using System;
using System.Drawing;
using System.Net;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using System.IO;
using System.Text.Json;
using System.Collections.Generic;
using System.Linq;

namespace TeleUDP
{
    public partial class Form1 : Form
    {
        // --- P/Invoke ---
        private const int GWL_EXSTYLE = -20;
        private const int WS_EX_LAYERED = 0x80000;
        private const int WS_EX_TRANSPARENT = 0x20;
        private const int LWA_ALPHA = 0x2;
        private const int LWA_COLORKEY = 0x1;
        [DllImport("user32.dll", SetLastError = true)]
        private static extern int GetWindowLong(IntPtr hWnd, int nIndex);
        [DllImport("user32.dll")]
        private static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);
        [DllImport("user32.dll")]
        private static extern bool SetLayeredWindowAttributes(IntPtr hWnd, uint crKey, byte bAlpha, uint dwFlags);

        // --- Константы ---
        private const int LISTEN_PORT = 20778;
        private const string POSITION_FILE = "BlockPositions.json";
        private const string TagKeyAlpha = "TextAlpha";
        private const string TagKeyClosed = "Closed";
        private const string TagKeyBorderAlpha = "BorderAlpha";
        private const string TagKeyBorderColor = "BorderColor";
        private const string TagKeyBaseBackColor = "BaseBackColor";
        private const string TagKeyBackAlpha = "BackAlpha";
        private const string TagKeyShowLabel = "ShowLabel";
        private const int HiddenAlpha = 204;
        private const int ResizeHandleSize = 10;

        // --- Переменные ---
        private UdpClient udpClient = null!;
        private IPEndPoint ipEndPoint = null!;
        private Label? draggedOrResizedLabel = null;
        private Point dragStartPosition;
        private bool isDragging = false;
        private bool isResizing = false;
        private readonly Color defaultFormBackColor = Color.Gray;
        private int formBackAlpha = 255;
        private bool isOverlayMode = false;
        private NotifyIcon notifyIcon = null!;
        private readonly List<Label> hiddenInOverlay = new();
        private readonly Color overlayColorKey = Color.Black;

        public Form1()
        {
            InitializeComponent();
            this.Load += Form1_Load;
            this.FormClosing += Form1_FormClosing;
            this.DoubleBuffered = true;
            this.Text = "Telemetry UDP Viewer";
            this.BackColor = defaultFormBackColor;
            this.FormBorderStyle = FormBorderStyle.Sizable;
            this.MaximizeBox = false;
            this.TopMost = true;
            this.Size = new Size(700, 300);
            this.Icon = SystemIcons.Application;

            int style = GetWindowLong(this.Handle, GWL_EXSTYLE);
            SetWindowLong(this.Handle, GWL_EXSTYLE, style | WS_EX_LAYERED);

            try
            {
                ipEndPoint = new IPEndPoint(IPAddress.Any, LISTEN_PORT);
                udpClient = new UdpClient(ipEndPoint);
                udpClient.BeginReceive(ReceiveCallback, null);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"UDP Error: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }

            InitializeDataBlocks();
            LoadBlockPositions();
            InitializeFormContextMenu();
            InitializeNotifyIcon();
            UpdateFormBackColor();
        }

        #region NotifyIcon
        private void InitializeNotifyIcon()
        {
            notifyIcon = new NotifyIcon
            {
                Text = "Telemetry UDP Viewer",
                Icon = this.Icon,
                Visible = true
            };
            var trayMenu = new ContextMenuStrip();
            var toggleOverlay = new ToolStripMenuItem("Оверлей (Прозрачность)") { Checked = isOverlayMode };
            toggleOverlay.Click += ToggleOverlay_Click;
            var exit = new ToolStripMenuItem("Выход");
            exit.Click += (s, e) => this.Close();

            trayMenu.Items.Add(toggleOverlay);
            trayMenu.Items.Add(new ToolStripSeparator());
            trayMenu.Items.Add(exit);
            notifyIcon.ContextMenuStrip = trayMenu;

            notifyIcon.MouseClick += (s, e) =>
            {
                if (e.Button != MouseButtons.Left) return;
                if (this.Visible) this.Hide();
                else { this.Show(); this.BringToFront(); }
            };
        }
        #endregion

        #region Form Context Menu
        private void InitializeFormContextMenu()
        {
            var formMenu = new ContextMenuStrip();

            var overlayItem = new ToolStripMenuItem("Оверлей (Полная Прозрачность)") { Checked = isOverlayMode };
            overlayItem.Click += ToggleOverlay_Click;
            formMenu.Items.Add(overlayItem);
            formMenu.Items.Add(new ToolStripSeparator());

            var formBackOpacity = new ToolStripMenuItem("Прозрачность фона формы");
            var formBackOpacityBar = new ToolStripTrackBar { TrackBar = { Width = 150, Minimum = 0, Maximum = 255, Value = formBackAlpha } };
            formBackOpacity.DropDownItems.Add(formBackOpacityBar);
            formBackOpacityBar.TrackBar.ValueChanged += (s, ev) =>
            {
                formBackAlpha = formBackOpacityBar.TrackBar.Value;
                UpdateFormBackColor();
                SaveBlockPositions();
            };
            formMenu.Items.Add(formBackOpacity);

            var backOpacityAll = new ToolStripMenuItem("Прозрачность фона всех блоков");
            var backOpacityBar = new ToolStripTrackBar { TrackBar = { Width = 150, Minimum = 0, Maximum = 255, Value = GetGlobalBackAlpha() } };
            backOpacityAll.DropDownItems.Add(backOpacityBar);
            backOpacityBar.TrackBar.ValueChanged += (s, ev) =>
            {
                int alpha = backOpacityBar.TrackBar.Value;
                foreach (Label lbl in GetDataLabels())
                {
                    if (lbl.Tag is not Dictionary<string, object> tag) continue;
                    tag[TagKeyBackAlpha] = alpha;
                    Color baseCol = (Color)tag[TagKeyBaseBackColor];
                    lbl.BackColor = Color.FromArgb(alpha, baseCol);
                    tag["IsTransparent"] = alpha == 0;
                    lbl.Invalidate();
                }
                SaveBlockPositions();
            };
            formMenu.Items.Add(backOpacityAll);

            var backColorAll = new ToolStripMenuItem("Цвет фона всех блоков");
            backColorAll.Click += ChangeBackColorAll_Click;
            formMenu.Items.Add(backColorAll);

            var textColorAll = new ToolStripMenuItem("Цвет текста всех блоков");
            textColorAll.Click += ChangeTextColorAll_Click;
            formMenu.Items.Add(textColorAll);

            var textOpacityAll = new ToolStripMenuItem("Прозрачность текста всех");
            var textOpacityBar = new ToolStripTrackBar { TrackBar = { Width = 150, Minimum = 0, Maximum = 255, Value = GetGlobalTextAlpha() } };
            textOpacityAll.DropDownItems.Add(textOpacityBar);
            textOpacityBar.TrackBar.ValueChanged += (s, ev) =>
            {
                int alpha = textOpacityBar.TrackBar.Value;
                foreach (Label lbl in GetDataLabels())
                {
                    if (lbl.Tag is Dictionary<string, object> tag)
                        tag[TagKeyAlpha] = alpha;
                    lbl.Invalidate();
                }
                SaveBlockPositions();
            };
            formMenu.Items.Add(textOpacityAll);

            var showLabelAll = new ToolStripMenuItem("Показывать подпись у всех блоков");
            showLabelAll.CheckOnClick = true;
            showLabelAll.Checked = GetDataLabels().Any() && GetDataLabels().All(l => l.Tag is Dictionary<string, object> t && (bool)t[TagKeyShowLabel]);
            showLabelAll.CheckedChanged += (s, e) =>
            {
                bool show = showLabelAll.Checked;
                foreach (Label lbl in GetDataLabels())
                {
                    if (lbl.Tag is Dictionary<string, object> tag)
                    {
                        tag[TagKeyShowLabel] = show;
                        UpdateLabelText(lbl);
                    }
                }
                SaveBlockPositions();
            };
            formMenu.Items.Add(showLabelAll);

            var borderAll = new ToolStripMenuItem("Рамка всех блоков");
            borderAll.Click += ToggleBorderAll_Click;
            formMenu.Items.Add(borderAll);

            var borderColorAll = new ToolStripMenuItem("Цвет рамки всех блоков");
            borderColorAll.Click += ChangeBorderColorAll_Click;
            formMenu.Items.Add(borderColorAll);

            var borderAlphaAll = new ToolStripMenuItem("Прозрачность рамки всех");
            var borderAlphaBar = new ToolStripTrackBar { TrackBar = { Width = 150, Minimum = 0, Maximum = 255, Value = GetGlobalBorderAlpha() } };
            borderAlphaAll.DropDownItems.Add(borderAlphaBar);
            borderAlphaBar.TrackBar.ValueChanged += (s, ev) =>
            {
                int alpha = borderAlphaBar.TrackBar.Value;
                foreach (Label lbl in GetDataLabels())
                {
                    if (lbl.Tag is Dictionary<string, object> tag)
                        tag[TagKeyBorderAlpha] = alpha;
                    lbl.Invalidate();
                }
                SaveBlockPositions();
            };
            formMenu.Items.Add(borderAlphaAll);
            formMenu.Items.Add(new ToolStripSeparator());

            var hideAll = new ToolStripMenuItem("Скрыть/Показать все блоки");
            hideAll.Click += ToggleVisibleAll_Click;
            formMenu.Items.Add(hideAll);

            var topMost = new ToolStripMenuItem("Поверх всех окон") { Checked = this.TopMost };
            topMost.Click += ToggleTopMost_Click;
            formMenu.Items.Add(topMost);

            var reset = new ToolStripMenuItem("Сбросить расположение");
            reset.Click += ResetBlockPositions_Click;
            formMenu.Items.Add(reset);

            this.ContextMenuStrip = formMenu;
        }
        #endregion

        #region Overlay
        private void ToggleOverlay_Click(object? sender, EventArgs e)
        {
            isOverlayMode = !isOverlayMode;
            UpdateMenuCheckedState();

            int style = GetWindowLong(this.Handle, GWL_EXSTYLE);

            if (isOverlayMode)
            {
                this.FormBorderStyle = FormBorderStyle.None;
                SetWindowLong(this.Handle, GWL_EXSTYLE, style | WS_EX_LAYERED | WS_EX_TRANSPARENT);
                this.BackColor = overlayColorKey;
                UpdateFormBackColor();

                foreach (Label lbl in GetDataLabels().ToList())
                {
                    if (lbl.Tag is Dictionary<string, object> tag && (bool)tag[TagKeyClosed])
                    {
                        this.Controls.Remove(lbl);
                        hiddenInOverlay.Add(lbl);
                    }
                }
            }
            else
            {
                this.FormBorderStyle = FormBorderStyle.Sizable;
                SetWindowLong(this.Handle, GWL_EXSTYLE, (style | WS_EX_LAYERED) & ~WS_EX_TRANSPARENT);
                this.BackColor = defaultFormBackColor;
                UpdateFormBackColor();

                foreach (Label lbl in hiddenInOverlay)
                {
                    this.Controls.Add(lbl);
                    lbl.Invalidate();
                }
                hiddenInOverlay.Clear();
            }

            this.Invalidate();
        }

        private void UpdateMenuCheckedState()
        {
            if (notifyIcon.ContextMenuStrip?.Items[0] is ToolStripMenuItem tray) tray.Checked = isOverlayMode;
            if (this.ContextMenuStrip?.Items[0] is ToolStripMenuItem form) form.Checked = isOverlayMode;
        }

        private void UpdateFormBackColor()
        {
            if (isOverlayMode)
            {
                SetLayeredWindowAttributes(this.Handle, (uint)ColorTranslator.ToWin32(overlayColorKey), 255, LWA_COLORKEY);
            }
            else
            {
                SetLayeredWindowAttributes(this.Handle, 0, (byte)formBackAlpha, LWA_ALPHA);
            }
        }
        #endregion

        #region Data Blocks
        private void InitializeDataBlocks()
        {
            var blockMenu = new ContextMenuStrip();

            var showLabelItem = new ToolStripMenuItem("Показывать подпись");
            showLabelItem.CheckOnClick = true;
            showLabelItem.CheckedChanged += (s, e) =>
            {
                if (blockMenu.Tag is Label lbl && lbl.Tag is Dictionary<string, object> tag)
                {
                    tag[TagKeyShowLabel] = showLabelItem.Checked;
                    UpdateLabelText(lbl);
                    SaveBlockPositions();
                }
            };
            blockMenu.Items.Add(showLabelItem);

            var textAlphaItem = new ToolStripMenuItem("Прозрачность текста");
            var textAlphaBar = new ToolStripTrackBar { TrackBar = { Width = 120, Minimum = 0, Maximum = 255 } };
            textAlphaItem.DropDownItems.Add(textAlphaBar);
            textAlphaBar.TrackBar.ValueChanged += (s, ev) =>
            {
                if (blockMenu.Tag is Label lbl && lbl.Tag is Dictionary<string, object> tag)
                {
                    tag[TagKeyAlpha] = textAlphaBar.TrackBar.Value;
                    lbl.Invalidate();
                    SaveBlockPositions();
                }
            };
            blockMenu.Items.Add(textAlphaItem);

            var textColor = new ToolStripMenuItem("Цвет текста");
            textColor.Click += ChangeTextColor_Click;
            blockMenu.Items.Add(textColor);

            var backAlphaItem = new ToolStripMenuItem("Прозрачность фона");
            var backAlphaBar = new ToolStripTrackBar { TrackBar = { Width = 120, Minimum = 0, Maximum = 255 } };
            backAlphaItem.DropDownItems.Add(backAlphaBar);
            backAlphaBar.TrackBar.ValueChanged += (s, ev) =>
            {
                if (blockMenu.Tag is Label lbl && lbl.Tag is Dictionary<string, object> tag)
                {
                    tag[TagKeyBackAlpha] = backAlphaBar.TrackBar.Value;
                    Color baseCol = (Color)tag[TagKeyBaseBackColor];
                    lbl.BackColor = Color.FromArgb(backAlphaBar.TrackBar.Value, baseCol);
                    tag["IsTransparent"] = backAlphaBar.TrackBar.Value == 0;
                    lbl.Invalidate();
                    SaveBlockPositions();
                }
            };
            blockMenu.Items.Add(backAlphaItem);

            var backColor = new ToolStripMenuItem("Цвет фона");
            backColor.Click += ChangeBackColor_Click;
            blockMenu.Items.Add(backColor);

            var borderToggle = new ToolStripMenuItem("Рамка");
            borderToggle.Click += ToggleBorder_Click;
            blockMenu.Items.Add(borderToggle);

            var borderColor = new ToolStripMenuItem("Цвет рамки");
            borderColor.Click += ChangeBorderColor_Click;
            blockMenu.Items.Add(borderColor);

            var borderAlphaItem = new ToolStripMenuItem("Прозрачность рамки");
            var borderAlphaBar = new ToolStripTrackBar { TrackBar = { Width = 120, Minimum = 0, Maximum = 255 } };
            borderAlphaItem.DropDownItems.Add(borderAlphaBar);
            borderAlphaBar.TrackBar.ValueChanged += (s, ev) =>
            {
                if (blockMenu.Tag is Label lbl && lbl.Tag is Dictionary<string, object> tag)
                {
                    tag[TagKeyBorderAlpha] = borderAlphaBar.TrackBar.Value;
                    lbl.Invalidate();
                    SaveBlockPositions();
                }
            };
            blockMenu.Items.Add(borderAlphaItem);
            blockMenu.Items.Add(new ToolStripSeparator());

            var hide = new ToolStripMenuItem("Скрыть/Показать");
            hide.Click += ToggleVisible_Click;
            blockMenu.Items.Add(hide);

            int w = (this.ClientSize.Width - 40) / 3;
            int h = 60;
            int x = 10, y = 10;

            CreateDataLabel("lblSpeed", "Speed", "0.0", x, y, w, h, blockMenu); x += w + 10;
            CreateDataLabel("lblRPM_Raw", "RPM (Raw)", "0", x, y, w, h, blockMenu); x += w + 10;
            CreateDataLabel("lblRPM_250x", "RPM (*250)", "0", x, y, w, h, blockMenu); x = 10; y += h + 10;
            CreateDataLabel("lblGear", "Gear", "0", x, y, w, h, blockMenu); x += w + 10;
            CreateDataLabel("lblThrottle", "Throttle", "0.0", x, y, w, h, blockMenu); x += w + 10;
            CreateDataLabel("lblBrake", "Brake", "0.0", x, y, w, h, blockMenu); x = 10; y += h + 10;
            CreateDataLabel("lblGForceLat", "G-Lat", "0.0", x, y, w, h, blockMenu); x += w + 10;
            CreateDataLabel("lblGForceLon", "G-Long", "0.0", x, y, w, h, blockMenu); x += w + 10;
            CreateDataLabel("lblPitch", "Pitch", "0.0", x, y, w, h, blockMenu);
        }

        private void CreateDataLabel(string name, string labelText, string initialValue, int x, int y, int width, int height, ContextMenuStrip menu)
        {
            var tag = new Dictionary<string, object>
            {
                { "IsTransparent", false },
                { TagKeyAlpha, 255 },
                { TagKeyClosed, false },
                { TagKeyBorderAlpha, 255 },
                { TagKeyBorderColor, Color.White },
                { TagKeyBaseBackColor, Color.Black },
                { TagKeyBackAlpha, 255 },
                { TagKeyShowLabel, true },
                { "LabelText", labelText },
                { "ValueText", initialValue }
            };

            var lbl = new Label
            {
                Name = name,
                Location = new Point(x, y),
                Size = new Size(width, height),
                TextAlign = ContentAlignment.MiddleCenter,
                BorderStyle = BorderStyle.FixedSingle,
                ForeColor = Color.White,
                BackColor = Color.FromArgb(255, Color.Black),
                AutoSize = false,
                Tag = tag,
                ContextMenuStrip = menu
            };

            // Отключаем DoubleBuffered у Label — это убирает размытие при прозрачности
            lbl.SetStyle(ControlStyles.OptimizedDoubleBuffer, false);
            lbl.SetStyle(ControlStyles.AllPaintingInWmPaint, true);
            lbl.SetStyle(ControlStyles.UserPaint, true);
            lbl.SetStyle(ControlStyles.ResizeRedraw, true);

            UpdateLabelText(lbl);
            lbl.Font = new Font("Arial", 12, FontStyle.Bold);
            ScaleLabelFont(lbl);
            lbl.MouseDown += Label_MouseDown;
            lbl.MouseMove += Label_MouseMove;
            lbl.MouseUp += Label_MouseUp;
            lbl.Paint += Label_Paint;

            lbl.ContextMenuStrip.Opening += (s, e) =>
            {
                if (s is ContextMenuStrip cms && cms.SourceControl is Label l && l.Tag is Dictionary<string, object> t)
                {
                    cms.Tag = l;
                    var showLabelItem = cms.Items.OfType<ToolStripMenuItem>().FirstOrDefault(i => i.Text == "Показывать подпись");
                    if (showLabelItem != null) showLabelItem.Checked = (bool)t[TagKeyShowLabel];

                    var backTrack = cms.Items.OfType<ToolStripMenuItem>()
                        .FirstOrDefault(i => i.Text == "Прозрачность фона")?.DropDownItems[0] as ToolStripTrackBar;
                    if (backTrack != null) backTrack.TrackBar.Value = (int)t[TagKeyBackAlpha];

                    var textTrack = cms.Items.OfType<ToolStripMenuItem>()
                        .FirstOrDefault(i => i.Text == "Прозрачность текста")?.DropDownItems[0] as ToolStripTrackBar;
                    if (textTrack != null) textTrack.TrackBar.Value = (int)t[TagKeyAlpha];

                    var borderTrack = cms.Items.OfType<ToolStripMenuItem>()
                        .FirstOrDefault(i => i.Text == "Прозрачность рамки")?.DropDownItems[0] as ToolStripTrackBar;
                    if (borderTrack != null) borderTrack.TrackBar.Value = (int)t[TagKeyBorderAlpha];
                }
            };

            this.Controls.Add(lbl);
        }

        private void UpdateLabelText(Label lbl)
        {
            if (lbl.Tag is not Dictionary<string, object> tag) return;
            string label = (string)tag["LabelText"];
            string value = (string)tag["ValueText"];
            bool showLabel = (bool)tag[TagKeyShowLabel];
            lbl.Text = showLabel ? $"{label}: {value}" : value;
            ScaleLabelFont(lbl);
        }
        #endregion

        #region Drag / Resize
        private void Label_MouseDown(object? sender, MouseEventArgs e)
        {
            if (e.Button != MouseButtons.Left) return;
            draggedOrResizedLabel = sender as Label;
            if (draggedOrResizedLabel == null) return;
            if (isOverlayMode && (Control.ModifierKeys & Keys.Control) != Keys.Control) return;

            if ((Control.ModifierKeys & Keys.Control) == Keys.Control)
            {
                isResizing = true;
                this.Cursor = Cursors.SizeNWSE;
            }
            else
            {
                var rc = new Rectangle(
                    draggedOrResizedLabel.Width - ResizeHandleSize,
                    draggedOrResizedLabel.Height - ResizeHandleSize,
                    ResizeHandleSize, ResizeHandleSize);
                if (rc.Contains(e.Location) && !isOverlayMode)
                {
                    isResizing = true;
                    this.Cursor = Cursors.SizeNWSE;
                }
                else
                {
                    isDragging = true;
                    dragStartPosition = e.Location;
                    this.Cursor = Cursors.SizeAll;
                }
            }
            draggedOrResizedLabel.BringToFront();
        }

        private void Label_MouseMove(object? sender, MouseEventArgs e)
        {
            if (draggedOrResizedLabel == null) return;

            if (isDragging && !isResizing)
            {
                draggedOrResizedLabel.Left += e.X - dragStartPosition.X;
                draggedOrResizedLabel.Top += e.Y - dragStartPosition.Y;
            }
            else if (isResizing)
            {
                int newW = draggedOrResizedLabel.Width + (e.X - dragStartPosition.X);
                int newH = draggedOrResizedLabel.Height + (e.Y - dragStartPosition.Y);
                if (newW > 50 && newH > 30)
                {
                    draggedOrResizedLabel.Width = newW;
                    draggedOrResizedLabel.Height = newH;
                    dragStartPosition = e.Location;
                }
                draggedOrResizedLabel.Invalidate();
            }
            else
            {
                var rc = new Rectangle(
                    draggedOrResizedLabel.Width - ResizeHandleSize,
                    draggedOrResizedLabel.Height - ResizeHandleSize,
                    ResizeHandleSize, ResizeHandleSize);
                draggedOrResizedLabel.Cursor = (rc.Contains(e.Location) && !isOverlayMode) ? Cursors.SizeNWSE : Cursors.Default;
            }
        }

        private void Label_MouseUp(object? sender, MouseEventArgs e)
        {
            isDragging = isResizing = false;
            draggedOrResizedLabel = null;
            this.Cursor = Cursors.Default;
            SaveBlockPositions();
        }
        #endregion

        #region Paint
        private void Label_Paint(object? sender, PaintEventArgs e)
        {
            if (sender is not Label lbl) return;
            if (lbl.Tag is not Dictionary<string, object> tag) return;

            bool closed = (bool)tag[TagKeyClosed];
            int textAlpha = (int)tag[TagKeyAlpha];
            int backAlpha = (int)tag[TagKeyBackAlpha];
            int borderAlpha = (int)tag[TagKeyBorderAlpha];
            Color borderColor = (Color)tag[TagKeyBorderColor];
            Color baseBack = (Color)tag[TagKeyBaseBackColor];

            if (!isOverlayMode && closed) textAlpha = HiddenAlpha;

            ScaleLabelFont(lbl);

            // Чёткий фон
            if (backAlpha > 0)
            {
                using var brush = new SolidBrush(Color.FromArgb(backAlpha, baseBack));
                e.Graphics.FillRectangle(brush, lbl.ClientRectangle);
            }

            // Рамка
            if (lbl.BorderStyle == BorderStyle.FixedSingle || closed)
            {
                using var pen = new Pen(Color.FromArgb(borderAlpha, borderColor), 1);
                e.Graphics.DrawRectangle(pen, 0, 0, lbl.Width - 1, lbl.Height - 1);
            }

            if (closed && !isOverlayMode)
            {
                using var pen = new Pen(Color.Red, 3);
                e.Graphics.DrawRectangle(pen, 1, 1, lbl.Width - 3, lbl.Height - 3);
            }

            // Текст
            if (textAlpha > 0 && !string.IsNullOrEmpty(lbl.Text))
            {
                using var brush = new SolidBrush(Color.FromArgb(textAlpha, lbl.ForeColor));
                var sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                e.Graphics.DrawString(lbl.Text, lbl.Font, brush, lbl.ClientRectangle, sf);
            }
        }
        #endregion

        private void ScaleLabelFont(Label lbl)
        {
            if (string.IsNullOrEmpty(lbl.Text)) return;
            using var g = Graphics.FromHwnd(lbl.Handle);
            using var test = new Font("Arial", 100);
            var sz = g.MeasureString(lbl.Text, test, lbl.Width);
            float ratio = Math.Min(lbl.Width / sz.Width, lbl.Height / sz.Height);
            float newSize = 100 * ratio * 0.9f;
            if (newSize < 10) newSize = 10;
            if (Math.Abs(lbl.Font.Size - newSize) > 0.01f)
                lbl.Font = new Font(lbl.Font.FontFamily, newSize, lbl.Font.Style);
        }

        #region Context Menu Handlers
        private void ChangeTextColor_Click(object? sender, EventArgs e)
        {
            if (sender is not ToolStripMenuItem mi) return;
            var owner = mi.GetCurrentParent() as ContextMenuStrip;
            if (owner?.SourceControl is not Label lbl) return;

            using var dlg = new ColorDialog { Color = lbl.ForeColor };
            if (dlg.ShowDialog() == DialogResult.OK)
            {
                lbl.ForeColor = dlg.Color;
                lbl.Invalidate();
                SaveBlockPositions();
            }
        }

        private void ChangeBackColor_Click(object? sender, EventArgs e)
        {
            if (sender is not ToolStripMenuItem mi) return;
            var owner = mi.GetCurrentParent() as ContextMenuStrip;
            if (owner?.SourceControl is not Label lbl) return;
            if (lbl.Tag is not Dictionary<string, object> tag) return;

            using var dlg = new ColorDialog { Color = (Color)tag[TagKeyBaseBackColor] };
            if (dlg.ShowDialog() == DialogResult.OK)
            {
                tag[TagKeyBaseBackColor] = dlg.Color;
                lbl.BackColor = Color.FromArgb((int)tag[TagKeyBackAlpha], dlg.Color);
                tag["IsTransparent"] = (int)tag[TagKeyBackAlpha] == 0;
                lbl.Invalidate();
                SaveBlockPositions();
            }
        }

        private void ToggleBorder_Click(object? sender, EventArgs e)
        {
            if (sender is not ToolStripMenuItem mi) return;
            var owner = mi.GetCurrentParent() as ContextMenuStrip;
            if (owner?.SourceControl is not Label lbl) return;

            lbl.BorderStyle = lbl.BorderStyle == BorderStyle.FixedSingle ? BorderStyle.None : BorderStyle.FixedSingle;
            lbl.Invalidate();
            SaveBlockPositions();
        }

        private void ChangeBorderColor_Click(object? sender, EventArgs e)
        {
            if (sender is not ToolStripMenuItem mi) return;
            var owner = mi.GetCurrentParent() as ContextMenuStrip;
            if (owner?.SourceControl is not Label lbl) return;
            if (lbl.Tag is not Dictionary<string, object> tag) return;

            using var dlg = new ColorDialog { Color = (Color)tag[TagKeyBorderColor] };
            if (dlg.ShowDialog() == DialogResult.OK)
            {
                tag[TagKeyBorderColor] = dlg.Color;
                lbl.Invalidate();
                SaveBlockPositions();
            }
        }

        private void ToggleVisible_Click(object? sender, EventArgs e)
        {
            if (sender is not ToolStripMenuItem mi) return;
            var owner = mi.GetCurrentParent() as ContextMenuStrip;
            if (owner?.SourceControl is not Label lbl) return;
            if (lbl.Tag is not Dictionary<string, object> tag) return;

            bool wasClosed = (bool)tag[TagKeyClosed];
            tag[TagKeyClosed] = !wasClosed;

            if (isOverlayMode)
            {
                if (!wasClosed && this.Controls.Contains(lbl))
                {
                    this.Controls.Remove(lbl);
                    hiddenInOverlay.Add(lbl);
                }
                else if (wasClosed && hiddenInOverlay.Contains(lbl))
                {
                    hiddenInOverlay.Remove(lbl);
                    this.Controls.Add(lbl);
                    lbl.Invalidate();
                }
            }
            else
            {
                lbl.Invalidate();
            }

            SaveBlockPositions();
        }
        #endregion

        #region All-Block Actions
        private void ChangeBackColorAll_Click(object? sender, EventArgs e)
        {
            using var dlg = new ColorDialog();
            if (dlg.ShowDialog() != DialogResult.OK) return;

            foreach (Label lbl in GetDataLabels())
            {
                if (lbl.Tag is not Dictionary<string, object> tag) continue;
                tag[TagKeyBaseBackColor] = dlg.Color;
                lbl.BackColor = Color.FromArgb((int)tag[TagKeyBackAlpha], dlg.Color);
                tag["IsTransparent"] = (int)tag[TagKeyBackAlpha] == 0;
                lbl.Invalidate();
            }
            SaveBlockPositions();
        }

        private void ChangeTextColorAll_Click(object? sender, EventArgs e)
        {
            using var dlg = new ColorDialog();
            if (dlg.ShowDialog() != DialogResult.OK) return;

            foreach (Label lbl in GetDataLabels())
            {
                lbl.ForeColor = dlg.Color;
                lbl.Invalidate();
            }
            SaveBlockPositions();
        }

        private void ToggleBorderAll_Click(object? sender, EventArgs e)
        {
            bool hasBorder = GetDataLabels().Any(l => l.BorderStyle == BorderStyle.FixedSingle);
            var newStyle = hasBorder ? BorderStyle.None : BorderStyle.FixedSingle;
            foreach (Label lbl in GetDataLabels())
            {
                lbl.BorderStyle = newStyle;
                lbl.Invalidate();
            }
            SaveBlockPositions();
        }

        private void ChangeBorderColorAll_Click(object? sender, EventArgs e)
        {
            using var dlg = new ColorDialog();
            if (dlg.ShowDialog() != DialogResult.OK) return;

            foreach (Label lbl in GetDataLabels())
            {
                if (lbl.Tag is Dictionary<string, object> tag)
                    tag[TagKeyBorderColor] = dlg.Color;
                lbl.Invalidate();
            }
            SaveBlockPositions();
        }

        private void ToggleVisibleAll_Click(object? sender, EventArgs e)
        {
            bool anyVisible = GetDataLabels().Any(l => l.Tag is Dictionary<string, object> t && !(bool)t[TagKeyClosed]);
            bool makeClosed = anyVisible;

            foreach (Label lbl in GetDataLabels().ToList())
            {
                if (lbl.Tag is not Dictionary<string, object> tag) continue;
                tag[TagKeyClosed] = makeClosed;

                if (isOverlayMode)
                {
                    if (makeClosed && this.Controls.Contains(lbl))
                    {
                        this.Controls.Remove(lbl);
                        hiddenInOverlay.Add(lbl);
                    }
                    else if (!makeClosed && hiddenInOverlay.Contains(lbl))
                    {
                        hiddenInOverlay.Remove(lbl);
                        this.Controls.Add(lbl);
                        lbl.Invalidate();
                    }
                }
                else
                {
                    lbl.Invalidate();
                }
            }
            SaveBlockPositions();
        }

        private void ToggleTopMost_Click(object? sender, EventArgs e)
        {
            this.TopMost = !this.TopMost;
            if (sender is ToolStripMenuItem mi) mi.Checked = this.TopMost;
        }

        private void ResetBlockPositions_Click(object? sender, EventArgs e)
        {
            if (File.Exists(POSITION_FILE))
            {
                try { File.Delete(POSITION_FILE); }
                catch { MessageBox.Show("Закройте программу и удалите файл BlockPositions.json вручную.", "Ошибка"); return; }
            }
            foreach (var c in GetDataLabels().ToList()) { this.Controls.Remove(c); c.Dispose(); }
            InitializeDataBlocks();
        }
        #endregion

        #region Helpers
        private IEnumerable<Label> GetDataLabels() => this.Controls.OfType<Label>();

        private int GetGlobalTextAlpha() => GetDataLabels().FirstOrDefault()?.Tag is Dictionary<string, object> t ? (int)t[TagKeyAlpha] : 255;
        private int GetGlobalBackAlpha() => GetDataLabels().FirstOrDefault()?.Tag is Dictionary<string, object> t ? (int)t[TagKeyBackAlpha] : 255;
        private int GetGlobalBorderAlpha() => GetDataLabels().FirstOrDefault()?.Tag is Dictionary<string, object> t ? (int)t[TagKeyBorderAlpha] : 255;
        #endregion

        #region Save / Load
        public class BlockData
        {
            public string Name { get; set; } = "";
            public int X { get; set; }
            public int Y { get; set; }
            public int Width { get; set; }
            public int Height { get; set; }
            public int TextColorArgb { get; set; }
            public int BaseBackColorArgb { get; set; }
            public int BackAlpha { get; set; }
            public BorderStyle BorderStyle { get; set; }
            public int TextAlpha { get; set; } = 255;
            public int BorderAlpha { get; set; } = 255;
            public int BorderColorArgb { get; set; }
            public bool Closed { get; set; } = false;
            public bool ShowLabel { get; set; } = true;
            public int FormBackAlpha { get; set; } = 255;
        }

        public class BlockPositionData
        {
            public List<BlockData> Blocks { get; set; } = new();
            public int FormBackAlpha { get; set; } = 255;
        }

        private void SaveBlockPositions()
        {
            var data = new BlockPositionData { FormBackAlpha = formBackAlpha };
            foreach (Control c in this.Controls)
            {
                if (c is not Label lbl) continue;
                if (lbl.Tag is not Dictionary<string, object> tag) continue;

                data.Blocks.Add(new BlockData
                {
                    Name = lbl.Name,
                    X = lbl.Location.X,
                    Y = lbl.Location.Y,
                    Width = lbl.Size.Width,
                    Height = lbl.Size.Height,
                    TextColorArgb = lbl.ForeColor.ToArgb(),
                    BaseBackColorArgb = ((Color)tag[TagKeyBaseBackColor]).ToArgb(),
                    BackAlpha = (int)tag[TagKeyBackAlpha],
                    BorderStyle = lbl.BorderStyle,
                    TextAlpha = (int)tag[TagKeyAlpha],
                    BorderAlpha = (int)tag[TagKeyBorderAlpha],
                    BorderColorArgb = ((Color)tag[TagKeyBorderColor]).ToArgb(),
                    Closed = (bool)tag[TagKeyClosed],
                    ShowLabel = (bool)tag[TagKeyShowLabel],
                    FormBackAlpha = formBackAlpha
                });
            }
            try { File.WriteAllText(POSITION_FILE, JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true })); }
            catch { }
        }

        private void LoadBlockPositions()
        {
            if (!File.Exists(POSITION_FILE)) return;
            try
            {
                var data = JsonSerializer.Deserialize<BlockPositionData>(File.ReadAllText(POSITION_FILE));
                if (data == null) return;

                formBackAlpha = data.FormBackAlpha;
                UpdateFormBackColor();

                foreach (var b in data.Blocks)
                {
                    if (this.Controls[b.Name] is not Label lbl) continue;

                    lbl.Location = new Point(b.X, b.Y);
                    lbl.Size = new Size(b.Width, b.Height);
                    lbl.ForeColor = Color.FromArgb(b.TextColorArgb);
                    lbl.BorderStyle = b.BorderStyle;

                    var tag = lbl.Tag as Dictionary<string, object> ?? new Dictionary<string, object>();
                    tag["IsTransparent"] = b.BackAlpha == 0;
                    tag[TagKeyAlpha] = b.TextAlpha;
                    tag[TagKeyClosed] = b.Closed;
                    tag[TagKeyBorderAlpha] = b.BorderAlpha;
                    tag[TagKeyBorderColor] = Color.FromArgb(b.BorderColorArgb);
                    tag[TagKeyBaseBackColor] = Color.FromArgb(b.BaseBackColorArgb);
                    tag[TagKeyBackAlpha] = b.BackAlpha;
                    tag[TagKeyShowLabel] = b.ShowLabel;
                    lbl.Tag = tag;

                    lbl.BackColor = Color.FromArgb(b.BackAlpha, Color.FromArgb(b.BaseBackColorArgb));
                    UpdateLabelText(lbl);
                    lbl.Invalidate();
                }

                // Обновляем состояние галочки "Показывать подпись у всех"
                if (this.ContextMenuStrip?.Items.OfType<ToolStripMenuItem>().FirstOrDefault(i => i.Text == "Показывать подпись у всех блоков") is ToolStripMenuItem showAll)
                {
                    showAll.Checked = GetDataLabels().Any() && GetDataLabels().All(l => l.Tag is Dictionary<string, object> t && (bool)t[TagKeyShowLabel]);
                }
            }
            catch { File.Delete(POSITION_FILE); }
        }
        #endregion

        private void Form1_Load(object? sender, EventArgs e) { }
        private void Form1_FormClosing(object? sender, FormClosingEventArgs e)
        {
            udpClient?.Close();
            SaveBlockPositions();
            notifyIcon.Visible = false;
            notifyIcon.Dispose();
        }

        #region UDP
        private void ReceiveCallback(IAsyncResult ar)
        {
            try
            {
                byte[] data = udpClient.EndReceive(ar, ref ipEndPoint!);
                udpClient.BeginReceive(ReceiveCallback, null);
                if (data.Length == Marshal.SizeOf<GridLegendsMotionPacket189>() && this.IsHandleCreated)
                    this.BeginInvoke(() => UpdateUI(Utils.ByteArrayToStructure<GridLegendsMotionPacket189>(data)));
            }
            catch { }
        }

        private void UpdateUI(GridLegendsMotionPacket189 packet)
        {
            void Set(string name, string value)
            {
                if (this.Controls[name] is Label lbl && lbl.Tag is Dictionary<string, object> tag)
                {
                    tag["ValueText"] = value;
                    UpdateLabelText(lbl);
                    lbl.Invalidate();
                }
            }

            Set("lblSpeed", $"{packet.m_speed * 3.6f:F1}");
            Set("lblRPM_Raw", $"{packet.m_engineRPM:F0}");
            Set("lblRPM_250x", $"{packet.m_engineRPM * 250f:F0}");
            string gear = packet.m_gear == 0 ? "N" : packet.m_gear > 0 ? ((int)packet.m_gear).ToString() : "R";
            Set("lblGear", gear);
            Set("lblThrottle", $"{packet.m_throttle:P0}");
            Set("lblBrake", $"{packet.m_brake:P0}");
            Set("lblGForceLat", $"{packet.m_gForceLateral:F2}");
            Set("lblGForceLon", $"{packet.m_gForceLongitudinal:F2}");
            Set("lblPitch", $"{packet.m_pitch:F2}");
        }
        #endregion
    }

    public class ToolStripTrackBar : ToolStripControlHost
    {
        public TrackBar TrackBar => (TrackBar)Control;
        public ToolStripTrackBar() : base(new TrackBar()) { TrackBar.AutoSize = false; }
    }

    // Вспомогательный метод для SetStyle
    public static class ControlExtensions
    {
        public static void SetStyle(this Control control, ControlStyles flag, bool value)
        {
            var method = typeof(Control).GetMethod("SetStyle", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            method?.Invoke(control, new object[] { flag, value });
        }
    }
}