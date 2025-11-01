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
        // --- P/Invoke для прозрачного оверлея ---
        private const int GWL_EXSTYLE = -20;
        private const int WS_EX_LAYERED = 0x80000;
        private const int WS_EX_TRANSPARENT = 0x20;
        private const int LWA_COLORKEY = 0x1;
        [DllImport("user32.dll", SetLastError = true)]
        private static extern int GetWindowLong(IntPtr hWnd, int nIndex);
        [DllImport("user32.dll")]
        private static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);
        [DllImport("user32.dll")]
        private static extern bool SetLayeredWindowAttributes(IntPtr hWnd, uint crKey, byte bAlpha, uint dwFlags);

        // --- Константы и переменные ---
        private const int LISTEN_PORT = 20778;
        private const string POSITION_FILE = "BlockPositions.json";
        private const string TagKeyAlpha = "TextAlpha";
        private const string TagKeyClosed = "Closed";
        private const string TagKeyBorderAlpha = "BorderAlpha";
        private const string TagKeyBorderColor = "BorderColor";
        private const string TagKeyBaseBackColor = "BaseBackColor";
        private const int HiddenAlpha = 204;          // 80 %
        private const int ResizeHandleSize = 10;
        private UdpClient udpClient = null!;
        private IPEndPoint ipEndPoint = null!;
        private Label? draggedOrResizedLabel = null;
        private Point dragStartPosition;
        private bool isDragging = false;
        private bool isResizing = false;
        private Color transparencyKeyColor = Color.Magenta;
        private bool isOverlayMode = false;
        private NotifyIcon notifyIcon = null!;

        // Список скрытых блоков для оверлея
        private readonly List<Label> hiddenInOverlay = new();

        public Form1()
        {
            InitializeComponent();
            this.Load += Form1_Load;
            this.FormClosing += Form1_FormClosing;
            this.DoubleBuffered = true;
            this.Text = "Telemetry UDP Viewer";
            this.BackColor = Color.Gray;
            this.FormBorderStyle = FormBorderStyle.Sizable;
            this.MaximizeBox = false;
            this.TopMost = true;
            this.Size = new Size(700, 300);
            this.Icon = SystemIcons.Application;

            try
            {
                ipEndPoint = new IPEndPoint(IPAddress.Any, LISTEN_PORT);
                udpClient = new UdpClient(ipEndPoint);
                udpClient.BeginReceive(new AsyncCallback(ReceiveCallback), null);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"UDP Error: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }

            InitializeDataBlocks();
            LoadBlockPositions();
            InitializeFormContextMenu();
            InitializeNotifyIcon();
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
            ContextMenuStrip trayMenu = new ContextMenuStrip();
            ToolStripMenuItem toggleOverlayItem = new ToolStripMenuItem("Оверлей (Прозрачность)");
            toggleOverlayItem.Click += ToggleOverlay_Click;
            ToolStripMenuItem exitItem = new ToolStripMenuItem("Выход");
            exitItem.Click += (s, e) => this.Close();
            trayMenu.Items.Add(toggleOverlayItem);
            trayMenu.Items.Add(new ToolStripSeparator());
            trayMenu.Items.Add(exitItem);
            notifyIcon.ContextMenuStrip = trayMenu;
            notifyIcon.MouseClick += (s, e) =>
            {
                if (e.Button == MouseButtons.Left)
                {
                    if (this.Visible) this.Hide();
                    else { this.Show(); this.BringToFront(); }
                }
            };
        }
        #endregion

        #region Form Context Menu
        private void InitializeFormContextMenu()
        {
            ContextMenuStrip formContextMenu = new ContextMenuStrip();

            ToolStripMenuItem toggleOverlayItem = new ToolStripMenuItem("Оверлей (Полная Прозрачность)");
            toggleOverlayItem.Checked = isOverlayMode;
            toggleOverlayItem.Click += ToggleOverlay_Click;
            formContextMenu.Items.Add(toggleOverlayItem);
            formContextMenu.Items.Add(new ToolStripSeparator());

            // Прозрачность фона всех
            ToolStripMenuItem backOpacityItem = new ToolStripMenuItem("Прозрачность фона всех блоков");
            ToolStripTrackBar backOpacityTrackBar = new ToolStripTrackBar();
            backOpacityTrackBar.TrackBar.Width = 150;
            backOpacityTrackBar.TrackBar.Minimum = 0;
            backOpacityTrackBar.TrackBar.Maximum = 255;
            backOpacityTrackBar.TrackBar.Value = GetGlobalBackAlpha();
            backOpacityTrackBar.TrackBar.ValueChanged += (s, ev) =>
            {
                int alpha = backOpacityTrackBar.TrackBar.Value;
                foreach (Label lbl in GetDataLabels())
                {
                    var tag = lbl.Tag as Dictionary<string, object>;
                    if (tag == null) continue;
                    Color baseColor = (Color)tag[TagKeyBaseBackColor];
                    lbl.BackColor = Color.FromArgb(alpha, baseColor);
                    tag["IsTransparent"] = alpha == 0;
                    lbl.Invalidate();
                }
                SaveBlockPositions();
            };
            backOpacityItem.DropDownItems.Add(backOpacityTrackBar);
            formContextMenu.Items.Add(backOpacityItem);

            // Цвет фона всех
            ToolStripMenuItem changeBackColorAllItem = new ToolStripMenuItem("Цвет фона всех блоков");
            changeBackColorAllItem.Click += ChangeBackColorAll_Click;
            formContextMenu.Items.Add(changeBackColorAllItem);

            // Цвет текста всех
            ToolStripMenuItem changeTextColorAllItem = new ToolStripMenuItem("Цвет текста всех блоков");
            changeTextColorAllItem.Click += ChangeTextColorAll_Click;
            formContextMenu.Items.Add(changeTextColorAllItem);

            // Прозрачность текста всех
            ToolStripMenuItem textOpacityItem = new ToolStripMenuItem("Прозрачность текста всех");
            ToolStripTrackBar textOpacityTrackBar = new ToolStripTrackBar();
            textOpacityTrackBar.TrackBar.Width = 150;
            textOpacityTrackBar.TrackBar.Minimum = 0;
            textOpacityTrackBar.TrackBar.Maximum = 255;
            textOpacityTrackBar.TrackBar.Value = GetGlobalTextAlpha();
            textOpacityTrackBar.TrackBar.ValueChanged += (s, ev) =>
            {
                int alpha = textOpacityTrackBar.TrackBar.Value;
                foreach (Label lbl in GetDataLabels())
                {
                    var tag = lbl.Tag as Dictionary<string, object>;
                    if (tag != null) tag[TagKeyAlpha] = alpha;
                    lbl.Invalidate();
                }
                SaveBlockPositions();
            };
            textOpacityItem.DropDownItems.Add(textOpacityTrackBar);
            formContextMenu.Items.Add(textOpacityItem);

            // Рамка
            ToolStripMenuItem borderToggleAllItem = new ToolStripMenuItem("Рамка всех блоков");
            borderToggleAllItem.Click += ToggleBorderAll_Click;
            formContextMenu.Items.Add(borderToggleAllItem);

            ToolStripMenuItem borderColorAllItem = new ToolStripMenuItem("Цвет рамки всех блоков");
            borderColorAllItem.Click += ChangeBorderColorAll_Click;
            formContextMenu.Items.Add(borderColorAllItem);

            ToolStripMenuItem borderAlphaAllItem = new ToolStripMenuItem("Прозрачность рамки всех");
            ToolStripTrackBar borderAlphaTrackBar = new ToolStripTrackBar();
            borderAlphaTrackBar.TrackBar.Width = 150;
            borderAlphaTrackBar.TrackBar.Minimum = 0;
            borderAlphaTrackBar.TrackBar.Maximum = 255;
            borderAlphaTrackBar.TrackBar.Value = GetGlobalBorderAlpha();
            borderAlphaTrackBar.TrackBar.ValueChanged += (s, ev) =>
            {
                int alpha = borderAlphaTrackBar.TrackBar.Value;
                foreach (Label lbl in GetDataLabels())
                {
                    var tag = lbl.Tag as Dictionary<string, object>;
                    if (tag != null) tag[TagKeyBorderAlpha] = alpha;
                    lbl.Invalidate();
                }
                SaveBlockPositions();
            };
            borderAlphaAllItem.DropDownItems.Add(borderAlphaTrackBar);
            formContextMenu.Items.Add(borderAlphaAllItem);

            formContextMenu.Items.Add(new ToolStripSeparator());

            // Скрыть/показать все
            ToolStripMenuItem toggleVisibleAllItem = new ToolStripMenuItem("Скрыть/Показать все блоки");
            toggleVisibleAllItem.Click += ToggleVisibleAll_Click;
            formContextMenu.Items.Add(toggleVisibleAllItem);

            ToolStripMenuItem toggleTopMostItem = new ToolStripMenuItem("Поверх всех окон");
            toggleTopMostItem.Checked = this.TopMost;
            toggleTopMostItem.Click += ToggleTopMost_Click;
            formContextMenu.Items.Add(toggleTopMostItem);

            ToolStripMenuItem resetPositionsItem = new ToolStripMenuItem("Сбросить расположение");
            resetPositionsItem.Click += ResetBlockPositions_Click;
            formContextMenu.Items.Add(resetPositionsItem);

            this.ContextMenuStrip = formContextMenu;
        }
        #endregion

        #region Data Blocks
        private void InitializeDataBlocks()
        {
            ContextMenuStrip blockContextMenu = new ContextMenuStrip();

            // Прозрачность фона одного блока
            ToolStripMenuItem backOpacityItem = new ToolStripMenuItem("Прозрачность фона");
            ToolStripTrackBar backOpacityTrackBar = new ToolStripTrackBar();
            backOpacityTrackBar.TrackBar.Width = 120;
            backOpacityTrackBar.TrackBar.Minimum = 0;
            backOpacityTrackBar.TrackBar.Maximum = 255;
            backOpacityTrackBar.TrackBar.ValueChanged += (s, ev) =>
            {
                if (blockContextMenu.Tag is Label lbl)
                {
                    var tag = lbl.Tag as Dictionary<string, object>;
                    if (tag != null)
                    {
                        int alpha = backOpacityTrackBar.TrackBar.Value;
                        Color baseColor = (Color)tag[TagKeyBaseBackColor];
                        lbl.BackColor = Color.FromArgb(alpha, baseColor);
                        tag["IsTransparent"] = alpha == 0;
                        lbl.Invalidate();
                        SaveBlockPositions();
                    }
                }
            };
            backOpacityItem.DropDownItems.Add(backOpacityTrackBar);
            blockContextMenu.Items.Add(backOpacityItem);

            // Прозрачность текста одного блока
            ToolStripMenuItem textOpacityItem = new ToolStripMenuItem("Прозрачность текста");
            ToolStripTrackBar textOpacityTrackBar = new ToolStripTrackBar();
            textOpacityTrackBar.TrackBar.Width = 120;
            textOpacityTrackBar.TrackBar.Minimum = 0;
            textOpacityTrackBar.TrackBar.Maximum = 255;
            textOpacityTrackBar.TrackBar.ValueChanged += (s, ev) =>
            {
                if (blockContextMenu.Tag is Label lbl)
                {
                    var tag = lbl.Tag as Dictionary<string, object>;
                    if (tag != null)
                    {
                        tag[TagKeyAlpha] = textOpacityTrackBar.TrackBar.Value;
                        lbl.Invalidate();
                        SaveBlockPositions();
                    }
                }
            };
            textOpacityItem.DropDownItems.Add(textOpacityTrackBar);
            blockContextMenu.Items.Add(textOpacityItem);

            ToolStripMenuItem changeTextColorItem = new ToolStripMenuItem("Цвет текста");
            changeTextColorItem.Click += ChangeTextColor_Click;
            blockContextMenu.Items.Add(changeTextColorItem);

            ToolStripMenuItem changeBackColorItem = new ToolStripMenuItem("Цвет фона");
            changeBackColorItem.Click += ChangeBackColor_Click;
            blockContextMenu.Items.Add(changeBackColorItem);

            ToolStripMenuItem toggleBorderItem = new ToolStripMenuItem("Рамка");
            toggleBorderItem.Click += ToggleBorder_Click;
            blockContextMenu.Items.Add(toggleBorderItem);

            ToolStripMenuItem changeBorderColorItem = new ToolStripMenuItem("Цвет рамки");
            changeBorderColorItem.Click += ChangeBorderColor_Click;
            blockContextMenu.Items.Add(changeBorderColorItem);

            ToolStripMenuItem borderAlphaItem = new ToolStripMenuItem("Прозрачность рамки");
            ToolStripTrackBar borderAlphaTrackBar = new ToolStripTrackBar();
            borderAlphaTrackBar.TrackBar.Width = 120;
            borderAlphaTrackBar.TrackBar.Minimum = 0;
            borderAlphaTrackBar.TrackBar.Maximum = 255;
            borderAlphaTrackBar.TrackBar.ValueChanged += (s, ev) =>
            {
                if (blockContextMenu.Tag is Label lbl)
                {
                    var tag = lbl.Tag as Dictionary<string, object>;
                    if (tag != null)
                    {
                        tag[TagKeyBorderAlpha] = borderAlphaTrackBar.TrackBar.Value;
                        lbl.Invalidate();
                        SaveBlockPositions();
                    }
                }
            };
            borderAlphaItem.DropDownItems.Add(borderAlphaTrackBar);
            blockContextMenu.Items.Add(borderAlphaItem);

            blockContextMenu.Items.Add(new ToolStripSeparator());

            ToolStripMenuItem toggleVisibleItem = new ToolStripMenuItem("Скрыть/Показать");
            toggleVisibleItem.Click += ToggleVisible_Click;
            blockContextMenu.Items.Add(toggleVisibleItem);

            int w = (this.ClientSize.Width - 40) / 3;
            int h = 60;
            int x = 10, y = 10;

            CreateDataLabel("lblSpeed", "Speed: 0.0", x, y, w, h, blockContextMenu); x += w + 10;
            CreateDataLabel("lblRPM_Raw", "RPM (Raw): 0", x, y, w, h, blockContextMenu); x += w + 10;
            CreateDataLabel("lblRPM_250x", "RPM (*250): 0", x, y, w, h, blockContextMenu); x = 10; y += h + 10;
            CreateDataLabel("lblGear", "Gear: 0", x, y, w, h, blockContextMenu); x += w + 10;
            CreateDataLabel("lblThrottle", "Throttle: 0.0", x, y, w, h, blockContextMenu); x += w + 10;
            CreateDataLabel("lblBrake", "Brake: 0.0", x, y, w, h, blockContextMenu); x = 10; y += h + 10;
            CreateDataLabel("lblGForceLat", "G-Lat: 0.0", x, y, w, h, blockContextMenu); x += w + 10;
            CreateDataLabel("lblGForceLon", "G-Long: 0.0", x, y, w, h, blockContextMenu); x += w + 10;
            CreateDataLabel("lblPitch", "Pitch: 0.0", x, y, w, h, blockContextMenu);
        }

        private void CreateDataLabel(string name, string text, int x, int y, int width, int height, ContextMenuStrip menu)
        {
            Label lbl = new Label
            {
                Name = name,
                Text = text,
                Location = new Point(x, y),
                Size = new Size(width, height),
                TextAlign = ContentAlignment.MiddleCenter,
                BorderStyle = BorderStyle.FixedSingle,
                ForeColor = Color.White,
                BackColor = Color.FromArgb(0, Color.Black), // Прозрачный фон
                AutoSize = false,
                Tag = new Dictionary<string, object>
                {
                    { "IsTransparent", true },
                    { TagKeyAlpha, 255 },
                    { TagKeyClosed, false },
                    { TagKeyBorderAlpha, 255 },
                    { TagKeyBorderColor, Color.White },
                    { TagKeyBaseBackColor, Color.Black }
                },
                ContextMenuStrip = menu
            };
            lbl.Font = new Font("Arial", 12, FontStyle.Bold);
            ScaleLabelFont(lbl);
            lbl.MouseDown += Label_MouseDown;
            lbl.MouseMove += Label_MouseMove;
            lbl.MouseUp += Label_MouseUp;
            lbl.Paint += Label_Paint;

            lbl.ContextMenuStrip.Opening += (s, e) =>
            {
                if (s is ContextMenuStrip cms && cms.SourceControl is Label l)
                {
                    cms.Tag = l;
                    var tag = l.Tag as Dictionary<string, object>;
                    if (tag != null)
                    {
                        var backTrack = cms.Items.OfType<ToolStripMenuItem>()
                            .FirstOrDefault(i => i.Text == "Прозрачность фона")?.DropDownItems[0] as ToolStripTrackBar;
                        if (backTrack != null) backTrack.TrackBar.Value = l.BackColor.A;

                        var textTrack = cms.Items.OfType<ToolStripMenuItem>()
                            .FirstOrDefault(i => i.Text == "Прозрачность текста")?.DropDownItems[0] as ToolStripTrackBar;
                        if (textTrack != null) textTrack.TrackBar.Value = (int)tag[TagKeyAlpha];

                        var borderTrack = cms.Items.OfType<ToolStripMenuItem>()
                            .FirstOrDefault(i => i.Text == "Прозрачность рамки")?.DropDownItems[0] as ToolStripTrackBar;
                        if (borderTrack != null) borderTrack.TrackBar.Value = (int)tag[TagKeyBorderAlpha];
                    }
                }
            };

            this.Controls.Add(lbl);
        }
        #endregion

        protected override void OnHandleCreated(EventArgs e)
        {
            base.OnHandleCreated(e);
            this.TransparencyKey = transparencyKeyColor;
        }

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
                SetLayeredWindowAttributes(this.Handle, (uint)transparencyKeyColor.ToArgb(), 0, LWA_COLORKEY);
                this.BackColor = transparencyKeyColor;

                foreach (Label lbl in GetDataLabels().ToList())
                {
                    var tag = lbl.Tag as Dictionary<string, object>;
                    if (tag != null && (bool)tag[TagKeyClosed])
                    {
                        this.Controls.Remove(lbl);
                        hiddenInOverlay.Add(lbl);
                    }
                }
            }
            else
            {
                this.FormBorderStyle = FormBorderStyle.Sizable;
                SetWindowLong(this.Handle, GWL_EXSTYLE, style & ~WS_EX_LAYERED & ~WS_EX_TRANSPARENT);
                this.BackColor = Color.Gray;

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
                Rectangle resizeHandle = new Rectangle(
                    draggedOrResizedLabel.Width - ResizeHandleSize,
                    draggedOrResizedLabel.Height - ResizeHandleSize,
                    ResizeHandleSize, ResizeHandleSize);
                if (resizeHandle.Contains(e.Location) && !isOverlayMode)
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
                int newWidth = draggedOrResizedLabel.Width + (e.X - dragStartPosition.X);
                int newHeight = draggedOrResizedLabel.Height + (e.Y - dragStartPosition.Y);
                if (newWidth > 50 && newHeight > 30)
                {
                    draggedOrResizedLabel.Width = newWidth;
                    draggedOrResizedLabel.Height = newHeight;
                    dragStartPosition = e.Location;
                }
                draggedOrResizedLabel.Invalidate();
            }
            else
            {
                Rectangle resizeHandle = new Rectangle(
                    draggedOrResizedLabel.Width - ResizeHandleSize,
                    draggedOrResizedLabel.Height - ResizeHandleSize,
                    ResizeHandleSize, ResizeHandleSize);
                draggedOrResizedLabel.Cursor = (resizeHandle.Contains(e.Location) && !isOverlayMode) ? Cursors.SizeNWSE : Cursors.Default;
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
            Label? lbl = sender as Label;
            if (lbl == null) return;
            var tag = lbl.Tag as Dictionary<string, object>;
            if (tag == null) return;

            bool isClosed = (bool)tag[TagKeyClosed];
            int textAlpha = (int)tag[TagKeyAlpha];
            int borderAlpha = (int)tag[TagKeyBorderAlpha];
            Color borderColor = (Color)tag[TagKeyBorderColor];
            Color baseBackColor = (Color)tag[TagKeyBaseBackColor];
            int backAlpha = lbl.BackColor.A;

            if (!isOverlayMode && isClosed)
                textAlpha = HiddenAlpha;

            ScaleLabelFont(lbl);

            // Фон
            if (backAlpha == 0 && isOverlayMode)
                e.Graphics.Clear(transparencyKeyColor);
            else if (backAlpha == 0 && !isOverlayMode)
                e.Graphics.Clear(this.BackColor);
            else
            {
                Color back = Color.FromArgb(backAlpha, baseBackColor);
                using (var brush = new SolidBrush(back))
                    e.Graphics.FillRectangle(brush, lbl.ClientRectangle);
            }

            // Рамка
            if (lbl.BorderStyle == BorderStyle.FixedSingle || isClosed)
            {
                Color finalBorderColor = Color.FromArgb(borderAlpha, borderColor);
                using (var pen = new Pen(finalBorderColor, 1))
                {
                    e.Graphics.DrawRectangle(pen, 0, 0, lbl.Width - 1, lbl.Height - 1);
                }
            }

            // Красная рамка при скрытии
            if (isClosed && !isOverlayMode)
            {
                using (var pen = new Pen(Color.Red, 3))
                {
                    e.Graphics.DrawRectangle(pen, 1, 1, lbl.Width - 3, lbl.Height - 3);
                }
            }

            // Текст
            if (textAlpha > 0 && !string.IsNullOrEmpty(lbl.Text))
            {
                Color textColor = Color.FromArgb(textAlpha, lbl.ForeColor);
                using (var brush = new SolidBrush(textColor))
                {
                    StringFormat sf = new StringFormat
                    {
                        Alignment = StringAlignment.Center,
                        LineAlignment = StringAlignment.Center
                    };
                    e.Graphics.DrawString(lbl.Text, lbl.Font, brush, lbl.ClientRectangle, sf);
                }
            }
        }
        #endregion

        private void ScaleLabelFont(Label lbl)
        {
            if (string.IsNullOrEmpty(lbl.Text)) return;
            using Graphics g = Graphics.FromHwnd(lbl.Handle);
            Font testFont = new Font("Arial", 100);
            SizeF size = g.MeasureString(lbl.Text, testFont, lbl.Width);
            float ratio = Math.Min(lbl.Width / size.Width, lbl.Height / size.Height);
            testFont.Dispose();
            float newSize = 100 * ratio * 0.9f;
            if (newSize < 10) newSize = 10;
            if (Math.Abs(lbl.Font.Size - newSize) > 0.01f)
            {
                lbl.Font = new Font(lbl.Font.FontFamily, newSize, lbl.Font.Style);
            }
        }

        #region Context Menu Handlers
        private void ChangeTextColor_Click(object? sender, EventArgs e)
        {
            if (sender is ToolStripMenuItem menuItem)
            {
                ContextMenuStrip? owner = menuItem.GetCurrentParent() as ContextMenuStrip;
                Label? lbl = owner?.SourceControl as Label;
                if (lbl != null)
                {
                    using ColorDialog dlg = new ColorDialog { Color = lbl.ForeColor };
                    if (dlg.ShowDialog() == DialogResult.OK)
                    {
                        lbl.ForeColor = dlg.Color;
                        lbl.Invalidate();
                        SaveBlockPositions();
                    }
                }
            }
        }

        private void ChangeBackColor_Click(object? sender, EventArgs e)
        {
            if (sender is ToolStripMenuItem menuItem)
            {
                ContextMenuStrip? owner = menuItem.GetCurrentParent() as ContextMenuStrip;
                Label? lbl = owner?.SourceControl as Label;
                if (lbl != null)
                {
                    using ColorDialog dlg = new ColorDialog { Color = (Color)(lbl.Tag as Dictionary<string, object>)[TagKeyBaseBackColor] };
                    if (dlg.ShowDialog() == DialogResult.OK)
                    {
                        var tag = lbl.Tag as Dictionary<string, object>;
                        tag[TagKeyBaseBackColor] = dlg.Color;
                        lbl.BackColor = Color.FromArgb(lbl.BackColor.A, dlg.Color);
                        tag["IsTransparent"] = lbl.BackColor.A == 0;
                        lbl.Invalidate();
                        SaveBlockPositions();
                    }
                }
            }
        }

        private void ToggleBorder_Click(object? sender, EventArgs e)
        {
            if (sender is ToolStripMenuItem menuItem)
            {
                ContextMenuStrip? owner = menuItem.GetCurrentParent() as ContextMenuStrip;
                Label? lbl = owner?.SourceControl as Label;
                if (lbl != null)
                {
                    lbl.BorderStyle = lbl.BorderStyle == BorderStyle.FixedSingle ? BorderStyle.None : BorderStyle.FixedSingle;
                    lbl.Invalidate();
                    SaveBlockPositions();
                }
            }
        }

        private void ChangeBorderColor_Click(object? sender, EventArgs e)
        {
            if (sender is ToolStripMenuItem menuItem)
            {
                ContextMenuStrip? owner = menuItem.GetCurrentParent() as ContextMenuStrip;
                Label? lbl = owner?.SourceControl as Label;
                if (lbl != null)
                {
                    using ColorDialog dlg = new ColorDialog { Color = (Color)(lbl.Tag as Dictionary<string, object>)[TagKeyBorderColor] };
                    if (dlg.ShowDialog() == DialogResult.OK)
                    {
                        var tag = lbl.Tag as Dictionary<string, object>;
                        tag[TagKeyBorderColor] = dlg.Color;
                        lbl.Invalidate();
                        SaveBlockPositions();
                    }
                }
            }
        }

        private void ToggleVisible_Click(object? sender, EventArgs e)
        {
            if (sender is ToolStripMenuItem menuItem)
            {
                ContextMenuStrip? owner = menuItem.GetCurrentParent() as ContextMenuStrip;
                Label? lbl = owner?.SourceControl as Label;
                if (lbl == null) return;

                var tag = lbl.Tag as Dictionary<string, object>;
                if (tag == null) return;

                bool wasClosed = (bool)tag[TagKeyClosed];
                tag[TagKeyClosed] = !wasClosed;

                if (isOverlayMode)
                {
                    if (!wasClosed)
                    {
                        if (this.Controls.Contains(lbl))
                        {
                            this.Controls.Remove(lbl);
                            hiddenInOverlay.Add(lbl);
                        }
                    }
                    else
                    {
                        if (hiddenInOverlay.Contains(lbl))
                        {
                            hiddenInOverlay.Remove(lbl);
                            this.Controls.Add(lbl);
                            lbl.Invalidate();
                        }
                    }
                }
                else
                {
                    lbl.Invalidate();
                }

                SaveBlockPositions();
            }
        }
        #endregion

        #region All-Block Actions
        private void ChangeBackColorAll_Click(object? sender, EventArgs e)
        {
            using ColorDialog dlg = new ColorDialog();
            if (dlg.ShowDialog() == DialogResult.OK)
            {
                foreach (Label lbl in GetDataLabels())
                {
                    var tag = lbl.Tag as Dictionary<string, object>;
                    if (tag != null)
                    {
                        tag[TagKeyBaseBackColor] = dlg.Color;
                        lbl.BackColor = Color.FromArgb(lbl.BackColor.A, dlg.Color);
                        tag["IsTransparent"] = lbl.BackColor.A == 0;
                        lbl.Invalidate();
                    }
                }
                SaveBlockPositions();
            }
        }

        private void ChangeTextColorAll_Click(object? sender, EventArgs e)
        {
            using ColorDialog dlg = new ColorDialog();
            if (dlg.ShowDialog() == DialogResult.OK)
            {
                foreach (Label lbl in GetDataLabels())
                {
                    lbl.ForeColor = dlg.Color;
                    lbl.Invalidate();
                }
                SaveBlockPositions();
            }
        }

        private void ToggleBorderAll_Click(object? sender, EventArgs e)
        {
            bool hasBorder = GetDataLabels().Any(l => l.BorderStyle == BorderStyle.FixedSingle);
            BorderStyle newStyle = hasBorder ? BorderStyle.None : BorderStyle.FixedSingle;
            foreach (Label lbl in GetDataLabels())
            {
                lbl.BorderStyle = newStyle;
                lbl.Invalidate();
            }
            SaveBlockPositions();
        }

        private void ChangeBorderColorAll_Click(object? sender, EventArgs e)
        {
            using ColorDialog dlg = new ColorDialog();
            if (dlg.ShowDialog() == DialogResult.OK)
            {
                foreach (Label lbl in GetDataLabels())
                {
                    var tag = lbl.Tag as Dictionary<string, object>;
                    if (tag != null)
                    {
                        tag[TagKeyBorderColor] = dlg.Color;
                        lbl.Invalidate();
                    }
                }
                SaveBlockPositions();
            }
        }

        private void ToggleVisibleAll_Click(object? sender, EventArgs e)
        {
            bool hasVisible = GetDataLabels().Any(lbl =>
            {
                var tag = lbl.Tag as Dictionary<string, object>;
                return tag != null && !(bool)tag[TagKeyClosed];
            });

            bool makeClosed = hasVisible;

            foreach (Label lbl in GetDataLabels().ToList())
            {
                var tag = lbl.Tag as Dictionary<string, object>;
                if (tag == null) continue;
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
            if (sender is ToolStripMenuItem item) item.Checked = this.TopMost;
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

        #region Helper
        private IEnumerable<Label> GetDataLabels() => this.Controls.OfType<Label>();

        private int GetGlobalTextAlpha()
        {
            var first = GetDataLabels().FirstOrDefault();
            return first?.Tag is Dictionary<string, object> t ? (int)t[TagKeyAlpha] : 255;
        }

        private int GetGlobalBackAlpha()
        {
            var first = GetDataLabels().FirstOrDefault(l => l.BackColor.A != 0);
            return first?.BackColor.A ?? 0;
        }

        private int GetGlobalBorderAlpha()
        {
            var first = GetDataLabels().FirstOrDefault();
            return first?.Tag is Dictionary<string, object> t ? (int)t[TagKeyBorderAlpha] : 255;
        }
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
        }

        public class BlockPositionData
        {
            public List<BlockData> Blocks { get; set; } = new();
        }

        private void SaveBlockPositions()
        {
            var data = new BlockPositionData();
            foreach (Control c in this.Controls)
            {
                if (c is Label lbl)
                {
                    var tag = lbl.Tag as Dictionary<string, object>;
                    if (tag == null) continue;
                    data.Blocks.Add(new BlockData
                    {
                        Name = lbl.Name,
                        X = lbl.Location.X,
                        Y = lbl.Location.Y,
                        Width = lbl.Size.Width,
                        Height = lbl.Size.Height,
                        TextColorArgb = lbl.ForeColor.ToArgb(),
                        BaseBackColorArgb = ((Color)tag[TagKeyBaseBackColor]).ToArgb(),
                        BackAlpha = lbl.BackColor.A,
                        BorderStyle = lbl.BorderStyle,
                        TextAlpha = (int)tag[TagKeyAlpha],
                        BorderAlpha = (int)tag[TagKeyBorderAlpha],
                        BorderColorArgb = ((Color)tag[TagKeyBorderColor]).ToArgb(),
                        Closed = (bool)tag[TagKeyClosed]
                    });
                }
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
                foreach (var b in data.Blocks)
                {
                    Label? lbl = this.Controls[b.Name] as Label;
                    if (lbl != null)
                    {
                        lbl.Location = new Point(b.X, b.Y);
                        lbl.Size = new Size(b.Width, b.Height);
                        lbl.ForeColor = Color.FromArgb(b.TextColorArgb);
                        lbl.BackColor = Color.FromArgb(b.BackAlpha, Color.FromArgb(b.BaseBackColorArgb));
                        lbl.BorderStyle = b.BorderStyle;
                        var tag = lbl.Tag as Dictionary<string, object> ?? new Dictionary<string, object>();
                        tag["IsTransparent"] = b.BackAlpha == 0;
                        tag[TagKeyAlpha] = b.TextAlpha;
                        tag[TagKeyClosed] = b.Closed;
                        tag[TagKeyBorderAlpha] = b.BorderAlpha;
                        tag[TagKeyBorderColor] = Color.FromArgb(b.BorderColorArgb);
                        tag[TagKeyBaseBackColor] = Color.FromArgb(b.BaseBackColorArgb);
                        lbl.Tag = tag;
                        lbl.Invalidate();
                    }
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
            notifyIcon.Visible = false;  // Исправлено!
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
            void Set(string name, string text)
            {
                var lbl = this.Controls[name] as Label;
                if (lbl != null)
                {
                    lbl.Text = text;
                    lbl.Invalidate();
                }
            }
            Set("lblSpeed", $"Speed: {packet.m_speed * 3.6f:F1} km/h");
            Set("lblRPM_Raw", $"RPM (Raw): {packet.m_engineRPM:F0}");
            Set("lblRPM_250x", $"RPM (*250): {packet.m_engineRPM * 250f:F0}");
            string gear = packet.m_gear == 0 ? "N" : packet.m_gear > 0 ? ((int)packet.m_gear).ToString() : "R";
            Set("lblGear", $"Gear: {gear}");
            Set("lblThrottle", $"Throttle: {packet.m_throttle:P0}");
            Set("lblBrake", $"Brake: {packet.m_brake:P0}");
            Set("lblGForceLat", $"G-Lat: {packet.m_gForceLateral:F2}");
            Set("lblGForceLon", $"G-Long: {packet.m_gForceLongitudinal:F2}");
            Set("lblPitch", $"Pitch: {packet.m_pitch:F2}");
        }
        #endregion
    }

    public class ToolStripTrackBar : ToolStripControlHost
    {
        public TrackBar TrackBar => (TrackBar)Control;
        public ToolStripTrackBar() : base(new TrackBar()) { TrackBar.AutoSize = false; }
    }
}