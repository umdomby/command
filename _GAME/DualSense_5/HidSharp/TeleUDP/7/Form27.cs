// _GAME/DualSense_5/HidSharp/Telemetry/7/Form1.cs
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Windows.Forms;

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
        [DllImport("user32.dll")]
        private static extern bool UpdateLayeredWindow(IntPtr hWnd, IntPtr hdcDst, ref Point pptDst, ref Size psize, IntPtr hdcSrc, ref Point pptSrc, uint crKey, ref BLENDFUNCTION pblend, uint dwFlags);
        [DllImport("user32.dll")]
        private static extern IntPtr GetDC(IntPtr hWnd);
        [DllImport("user32.dll")]
        private static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);
        [DllImport("gdi32.dll")]
        private static extern IntPtr CreateCompatibleDC(IntPtr hdc);
        [DllImport("gdi32.dll")]
        private static extern IntPtr SelectObject(IntPtr hdc, IntPtr hgdiobj);
        [DllImport("gdi32.dll")]
        private static extern bool DeleteObject(IntPtr hObject);
        [DllImport("gdi32.dll")]
        private static extern bool DeleteDC(IntPtr hdc);

        [StructLayout(LayoutKind.Sequential)]
        private struct BLENDFUNCTION
        {
            public byte BlendOp;
            public byte BlendFlags;
            public byte SourceConstantAlpha;
            public byte AlphaFormat;
        }

        private const byte AC_SRC_OVER = 0;
        private const byte AC_SRC_ALPHA = 1;
        private const uint ULW_ALPHA = 0x00000002;

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
        private const string TagKeyTextColor = "TextColor";
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

        // --- Выделение ---
        private readonly HashSet<Label> selectedLabels = new();
        private bool isSelecting = false;
        private Point selectionStart;
        private Rectangle selectionRect;


        private string currentLanguage = "en"; // будет синхронизировано с Localization

        // --- Исходные блоки ---
        private readonly List<(string name, string label, string value)> defaultBlocks = new()
        {
            (name: "lblSpeed", label: "Speed", value: "0.0"),
            (name: "lblRPM_Raw", label: "RPM (Raw)", value: "0"),
            (name: "lblRPM_250x", label: "RPM (*250)", value: "0"),
            (name: "lblGear", label: "Gear", value: "0"),
            (name: "lblThrottle", label: "Throttle", value: "0.0"),
            (name: "lblBrake", label: "Brake", value: "0.0"),
            (name: "lblGForceLat", label: "G-Lat", value: "0.0"),
            (name: "lblGForceLon", label: "G-Long", value: "0.0"),
            (name: "lblPitch", label: "Pitch", value: "0.0")
        };

        private ContextMenuStrip? blockMenuTemplate;

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
            this.Icon = Properties.Resources.telemetry_icon;

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

            blockMenuTemplate = CreateBlockContextMenu();
            InitializeDataBlocks();
            LoadBlockPositions();
            InitializeFormContextMenu();
            InitializeNotifyIcon();
            UpdateMenuCheckedStateSafe();
            UpdateFormBackColor();

            this.MouseDown += Form_MouseDown;
            this.MouseMove += Form_MouseMove;
            this.MouseUp += Form_MouseUp;
            this.Paint += Form_Paint_Selection;
        }

        #region Form Events
        private void Form1_Load(object? sender, EventArgs e) { }
        private void Form1_FormClosing(object? sender, FormClosingEventArgs e)
        {
            udpClient?.Close();
            SaveBlockPositions();
            notifyIcon.Visible = false;
            notifyIcon.Dispose();
        }
        #endregion

        #region Selection
        private void Form_MouseDown(object? sender, MouseEventArgs e)
        {
            if (e.Button != MouseButtons.Left) return;
            if (isOverlayMode && (Control.ModifierKeys & Keys.Control) != Keys.Control) return;

            var clickedLabel = GetDataLabels().FirstOrDefault(l => l.Bounds.Contains(e.Location));
            if (clickedLabel != null)
            {
                if ((Control.ModifierKeys & Keys.Control) == Keys.Control)
                {
                    if (selectedLabels.Contains(clickedLabel))
                        selectedLabels.Remove(clickedLabel);
                    else
                        selectedLabels.Add(clickedLabel);
                    this.Invalidate();
                }
                return;
            }

            if ((Control.ModifierKeys & Keys.Control) != Keys.Control)
            {
                selectedLabels.Clear();
            }

            isSelecting = true;
            selectionStart = e.Location;
            selectionRect = new Rectangle(e.Location, Size.Empty);
            this.Invalidate();
        }

        private void Form_MouseMove(object? sender, MouseEventArgs e)
        {
            if (!isSelecting) return;

            selectionRect = new Rectangle(
                Math.Min(selectionStart.X, e.X),
                Math.Min(selectionStart.Y, e.Y),
                Math.Abs(e.X - selectionStart.X),
                Math.Abs(e.Y - selectionStart.Y));

            if ((Control.ModifierKeys & Keys.Control) != Keys.Control)
                selectedLabels.Clear();

            foreach (var lbl in GetDataLabels())
            {
                if (selectionRect.IntersectsWith(lbl.Bounds))
                    selectedLabels.Add(lbl);
            }

            this.Invalidate();
        }

        private void Form_MouseUp(object? sender, MouseEventArgs e)
        {
            isSelecting = false;
            this.Invalidate();
        }

        private void Form_Paint_Selection(object? sender, PaintEventArgs e)
        {
            if (isSelecting)
            {
                using var brush = new SolidBrush(Color.FromArgb(50, 0, 120, 255));
                using var pen = new Pen(Color.FromArgb(150, 0, 120, 255), 2);
                e.Graphics.FillRectangle(brush, selectionRect);
                e.Graphics.DrawRectangle(pen, selectionRect);
            }

            foreach (var lbl in selectedLabels)
            {
                var r = lbl.Bounds;
                r.Inflate(2, 2);
                using var pen = new Pen(Color.Yellow, 2);
                e.Graphics.DrawRectangle(pen, r);
            }
        }
        #endregion

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

            // Оверлей
            var toggleOverlay = new ToolStripMenuItem(Localization.T("Overlay (Transparency)")) { Checked = isOverlayMode };
            toggleOverlay.Click += ToggleOverlay_Click;
            trayMenu.Items.Add(toggleOverlay);

            trayMenu.Items.Add(new ToolStripSeparator());

            // Выход
            var exit = new ToolStripMenuItem(Localization.T("Exit"));
            exit.Click += (s, e) => this.Close();
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

            // Оверлей
            var overlayItem = new ToolStripMenuItem(Localization.T("Overlay (Full Transparency)")) { Checked = isOverlayMode };
            overlayItem.Click += ToggleOverlay_Click;
            formMenu.Items.Add(overlayItem);

            formMenu.Items.Add(new ToolStripSeparator());

            // Прозрачность фона формы
            var formBackOpacity = new ToolStripMenuItem(Localization.T("Form Background Transparency"));
            var formBackOpacityBar = new ToolStripTrackBar { TrackBar = { Width = 150, Minimum = 0, Maximum = 255, Value = formBackAlpha } };
            formBackOpacity.DropDownItems.Add(formBackOpacityBar);
            formBackOpacityBar.TrackBar.ValueChanged += (s, ev) =>
            {
                formBackAlpha = formBackOpacityBar.TrackBar.Value;
                UpdateFormBackColor();
                SaveBlockPositions();
            };
            formMenu.Items.Add(formBackOpacity);

            // Прозрачность фона всех блоков
            var backOpacityAll = new ToolStripMenuItem(Localization.T("Background Transparency for All Blocks"));
            var backOpacityBar = new ToolStripTrackBar { TrackBar = { Width = 150, Minimum = 0, Maximum = 255, Value = GetGlobalBackAlpha() } };
            backOpacityAll.DropDownItems.Add(backOpacityBar);
            backOpacityBar.TrackBar.ValueChanged += (s, ev) =>
            {
                int alpha = backOpacityBar.TrackBar.Value;
                foreach (Label lbl in GetDataLabels())
                {
                    if (lbl.Tag is Dictionary<string, object> tag)
                    {
                        tag[TagKeyBackAlpha] = alpha;
                        lbl.Invalidate();
                    }
                }
                SaveBlockPositions();
            };
            formMenu.Items.Add(backOpacityAll);

            // Цвет фона всех блоков
            var backColorAll = new ToolStripMenuItem(Localization.T("Background Color for All Blocks"));
            backColorAll.Click += ChangeBackColorAll_Click;
            formMenu.Items.Add(backColorAll);

            // Цвет текста всех блоков
            var textColorAll = new ToolStripMenuItem(Localization.T("Text Color for All Blocks"));
            textColorAll.Click += ChangeTextColorAll_Click;
            formMenu.Items.Add(textColorAll);

            // Прозрачность текста всех
            var textOpacityAll = new ToolStripMenuItem(Localization.T("Text Transparency for All Blocks"));
            var textOpacityBar = new ToolStripTrackBar { TrackBar = { Width = 150, Minimum = 0, Maximum = 255, Value = GetGlobalTextAlpha() } };
            textOpacityAll.DropDownItems.Add(textOpacityBar);
            textOpacityBar.TrackBar.ValueChanged += (s, ev) =>
            {
                int alpha = textOpacityBar.TrackBar.Value;
                foreach (Label lbl in GetDataLabels())
                {
                    if (lbl.Tag is Dictionary<string, object> tag)
                    {
                        tag[TagKeyAlpha] = alpha;
                        lbl.Invalidate();
                    }
                }
                SaveBlockPositions();
            };
            formMenu.Items.Add(textOpacityAll);

            // Показывать подпись у всех блоков
            var showLabelAll = new ToolStripMenuItem(Localization.T("Show Label for All Blocks"));
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

            // Рамка всех блоков
            var borderAll = new ToolStripMenuItem(Localization.T("Border for All Blocks"));
            borderAll.Click += ToggleBorderAll_Click;
            formMenu.Items.Add(borderAll);

            // Цвет рамки всех блоков
            var borderColorAll = new ToolStripMenuItem(Localization.T("Border Color for All Blocks"));
            borderColorAll.Click += ChangeBorderColorAll_Click;
            formMenu.Items.Add(borderColorAll);

            // Прозрачность рамки всех
            var borderAlphaAll = new ToolStripMenuItem(Localization.T("Border Transparency for All Blocks"));
            var borderAlphaBar = new ToolStripTrackBar { TrackBar = { Width = 150, Minimum = 0, Maximum = 255, Value = GetGlobalBorderAlpha() } };
            borderAlphaAll.DropDownItems.Add(borderAlphaBar);
            borderAlphaBar.TrackBar.ValueChanged += (s, ev) =>
            {
                int alpha = borderAlphaBar.TrackBar.Value;
                foreach (Label lbl in GetDataLabels())
                {
                    if (lbl.Tag is Dictionary<string, object> tag)
                    {
                        tag[TagKeyBorderAlpha] = alpha;
                        lbl.Invalidate();
                    }
                }
                SaveBlockPositions();
            };
            formMenu.Items.Add(borderAlphaAll);

            formMenu.Items.Add(new ToolStripSeparator());

            // Скрыть/Показать все блоки
            var hideAll = new ToolStripMenuItem(Localization.T("Hide/Show All Blocks"));
            hideAll.Click += ToggleVisibleAll_Click;
            formMenu.Items.Add(hideAll);

            // Поверх всех окон
            var topMost = new ToolStripMenuItem(Localization.T("Always on Top")) { Checked = this.TopMost };
            topMost.Click += ToggleTopMost_Click;
            formMenu.Items.Add(topMost);

            // Сбросить расположение
            var reset = new ToolStripMenuItem(Localization.T("Reset Layout"));
            reset.Click += ResetBlockPositions_Click;
            formMenu.Items.Add(reset);

            // Удалить выделенные блоки
            var deleteSelected = new ToolStripMenuItem(Localization.T("Delete Selected Blocks"));
            deleteSelected.Click += DeleteSelectedBlocks_Click;
            formMenu.Items.Add(deleteSelected);

            formMenu.Items.Add(new ToolStripSeparator());

            // Сохранить настройки как...
            var saveSettings = new ToolStripMenuItem(Localization.T("Save Settings As..."));
            saveSettings.Click += SaveSettingsAs_Click;
            formMenu.Items.Add(saveSettings);

            // Загрузить настройки из...
            var loadSettings = new ToolStripMenuItem(Localization.T("Load Settings From..."));
            loadSettings.Click += LoadSettingsFrom_Click;
            formMenu.Items.Add(loadSettings);

            // ── Язык ─────────────────────────────────────────────────────────────────────
            var langMenu = new ToolStripMenuItem(Localization.T("Language"));
            var enItem = new ToolStripMenuItem(Localization.T("English")) { Checked = Localization.Current == "en" };
            var ruItem = new ToolStripMenuItem(Localization.T("Russian")) { Checked = Localization.Current == "ru" };
            enItem.Click += (s, e) =>
            {
                Localization.Current = "en";
                currentLanguage = "en";
                enItem.Checked = true;
                ruItem.Checked = false;
                ApplyLanguageToAllMenus();
                SaveBlockPositions();
            };
            ruItem.Click += (s, e) =>
            {
                Localization.Current = "ru";
                currentLanguage = "ru";
                ruItem.Checked = true;
                enItem.Checked = false;
                ApplyLanguageToAllMenus();
                SaveBlockPositions();
            };
            langMenu.DropDownItems.Add(enItem);
            langMenu.DropDownItems.Add(ruItem);
            formMenu.Items.Add(new ToolStripSeparator());
            formMenu.Items.Add(langMenu);

            this.ContextMenuStrip = formMenu;
        }
        #endregion

        #region Overlay
        private void ToggleOverlay_Click(object? sender, EventArgs e)
        {
            isOverlayMode = !isOverlayMode;
            UpdateMenuCheckedStateSafe();

            int style = GetWindowLong(this.Handle, GWL_EXSTYLE);
            if (isOverlayMode)
            {
                this.FormBorderStyle = FormBorderStyle.None;
                SetWindowLong(this.Handle, GWL_EXSTYLE, style | WS_EX_LAYERED | WS_EX_TRANSPARENT);
                foreach (Label lbl in GetDataLabels().ToList())
                {
                    this.Controls.Remove(lbl);
                    hiddenInOverlay.Add(lbl);
                }
                RedrawOverlay();
            }
            else
            {
                this.FormBorderStyle = FormBorderStyle.Sizable;
                SetWindowLong(this.Handle, GWL_EXSTYLE, (style | WS_EX_LAYERED) & ~WS_EX_TRANSPARENT);
                foreach (Label lbl in hiddenInOverlay)
                {
                    this.Controls.Add(lbl);
                }
                hiddenInOverlay.Clear();
                UpdateFormBackColor(); // Восстанавливаем альфа фона
            }
        }

        private void UpdateMenuCheckedStateSafe()
        {
            if (notifyIcon?.ContextMenuStrip?.Items[0] is ToolStripMenuItem tray)
                tray.Checked = isOverlayMode;

            if (this.ContextMenuStrip?.Items[0] is ToolStripMenuItem form)
                form.Checked = isOverlayMode;
        }

        private void UpdateFormBackColor()
        {
            if (!isOverlayMode)
            {
                SetLayeredWindowAttributes(this.Handle, 0, (byte)formBackAlpha, LWA_ALPHA);
            }
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            if (!isOverlayMode)
            {
                base.OnPaint(e);
            }
        }
        #endregion

        #region Data Blocks
        private void InitializeDataBlocks()
        {
            int w = (this.ClientSize.Width - 40) / 3;
            int h = 60;
            int x = 10, y = 10;

            foreach (var (name, label, value) in defaultBlocks)
            {
                CreateDataLabel(name, label, value, x, y, w, h, blockMenuTemplate!);
                x += w + 10;
                if (x + w > this.ClientSize.Width)
                {
                    x = 10;
                    y += h + 10;
                }
            }
        }

        private ContextMenuStrip CreateBlockContextMenu()
        {
            var blockMenu = new ContextMenuStrip();

            // Показывать подпись
            var showLabelItem = new ToolStripMenuItem(Localization.T("Show Label"));
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

            // Прозрачность текста
            var textAlphaItem = new ToolStripMenuItem(Localization.T("Text Transparency"));
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

            // Цвет текста
            var textColor = new ToolStripMenuItem(Localization.T("Text Color"));
            textColor.Click += ChangeTextColor_Click;
            blockMenu.Items.Add(textColor);

            // Прозрачность фона
            var backAlphaItem = new ToolStripMenuItem(Localization.T("Background Transparency"));
            var backAlphaBar = new ToolStripTrackBar { TrackBar = { Width = 120, Minimum = 0, Maximum = 255 } };
            backAlphaItem.DropDownItems.Add(backAlphaBar);
            backAlphaBar.TrackBar.ValueChanged += (s, ev) =>
            {
                if (blockMenu.Tag is Label lbl && lbl.Tag is Dictionary<string, object> tag)
                {
                    tag[TagKeyBackAlpha] = backAlphaBar.TrackBar.Value;
                    lbl.Invalidate();
                    SaveBlockPositions();
                }
            };
            blockMenu.Items.Add(backAlphaItem);

            // Цвет фона
            var backColor = new ToolStripMenuItem(Localization.T("Background Color"));
            backColor.Click += ChangeBackColor_Click;
            blockMenu.Items.Add(backColor);

            // Рамка
            var borderToggle = new ToolStripMenuItem(Localization.T("Border"));
            borderToggle.Click += ToggleBorder_Click;
            blockMenu.Items.Add(borderToggle);

            // Цвет рамки
            var borderColor = new ToolStripMenuItem(Localization.T("Border Color"));
            borderColor.Click += ChangeBorderColor_Click;
            blockMenu.Items.Add(borderColor);

            // Прозрачность рамки
            var borderAlphaItem = new ToolStripMenuItem(Localization.T("Border Transparency"));
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

            // Скрыть/Показать
            var hide = new ToolStripMenuItem(Localization.T("Hide/Show"));
            hide.Click += ToggleVisible_Click;
            blockMenu.Items.Add(hide);

            // Копировать блок
            var copyBlock = new ToolStripMenuItem(Localization.T("Copy Block"));
            copyBlock.Click += CopyBlock_Click;
            blockMenu.Items.Add(copyBlock);

            // Удалить блок
            var deleteBlock = new ToolStripMenuItem(Localization.T("Delete Block"));
            deleteBlock.Click += DeleteBlock_Click;
            blockMenu.Items.Add(deleteBlock);

            return blockMenu;
        }

        private void DeleteBlock_Click(object? sender, EventArgs e)
        {
            if (sender is not ToolStripMenuItem mi) return;
            var owner = mi.GetCurrentParent() as ContextMenuStrip;
            if (owner?.SourceControl is not Label lbl) return;

            if (MessageBox.Show("Удалить этот блок?", "Подтверждение", MessageBoxButtons.YesNo) != DialogResult.Yes)
                return;

            RemoveLabel(lbl);
            SaveBlockPositions();
        }

        private void DeleteSelectedBlocks_Click(object? sender, EventArgs e)
        {
            if (!selectedLabels.Any()) return;
            if (MessageBox.Show($"Удалить {selectedLabels.Count} блок(ов)?", "Подтверждение", MessageBoxButtons.YesNo) != DialogResult.Yes)
                return;

            foreach (var lbl in selectedLabels.ToList())
            {
                RemoveLabel(lbl);
            }
            selectedLabels.Clear();
            SaveBlockPositions();
            this.Invalidate();
        }

        private void RemoveLabel(Label lbl)
        {
            if (this.Controls.Contains(lbl))
                this.Controls.Remove(lbl);
            if (hiddenInOverlay.Contains(lbl))
                hiddenInOverlay.Remove(lbl);
            lbl.Dispose();
        }

        private Label CreateDataLabel(string name, string labelText, string initialValue, int x, int y, int width, int height, ContextMenuStrip menu)
        {
            var tag = new Dictionary<string, object>
            {
                { TagKeyAlpha, 255 },
                { TagKeyClosed, false },
                { TagKeyBorderAlpha, 255 },
                { TagKeyBorderColor, Color.White },
                { TagKeyBaseBackColor, Color.Black },
                { TagKeyBackAlpha, 255 },
                { TagKeyShowLabel, true },
                { TagKeyTextColor, Color.White },
                { "LabelText", labelText },
                { "ValueText", initialValue },
                { "DisplayText", $"{labelText}: {initialValue}" }
            };

            var lbl = new Label
            {
                Name = name,
                Location = new Point(x, y),
                Size = new Size(width, height),
                Text = "",
                TextAlign = ContentAlignment.MiddleCenter,
                BorderStyle = BorderStyle.FixedSingle,
                AutoSize = false,
                Tag = tag,
                ContextMenuStrip = menu
            };

            lbl.SetStyle(ControlStyles.OptimizedDoubleBuffer, true);
            lbl.SetStyle(ControlStyles.AllPaintingInWmPaint, true);
            lbl.SetStyle(ControlStyles.UserPaint, true);
            lbl.SetStyle(ControlStyles.ResizeRedraw, true);

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
            return lbl;
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
                    ScaleLabelFont(draggedOrResizedLabel);
                    draggedOrResizedLabel.Invalidate();
                }
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
            if (draggedOrResizedLabel != null)
            {
                ScaleLabelFont(draggedOrResizedLabel);
                draggedOrResizedLabel.Invalidate();
            }
            draggedOrResizedLabel = null;
            this.Cursor = Cursors.Default;
            SaveBlockPositions();
        }
        #endregion

        #region Paint
        private void Label_Paint(object? sender, PaintEventArgs e)
        {
            if (sender is not Label lbl || lbl.Tag is not Dictionary<string, object> tag) return;

            int textAlpha = (int)tag[TagKeyAlpha];
            int backAlpha = (int)tag[TagKeyBackAlpha];
            int borderAlpha = (int)tag[TagKeyBorderAlpha];
            Color baseBackColor = (Color)tag[TagKeyBaseBackColor];
            Color borderColor = (Color)tag[TagKeyBorderColor];
            Color textColor = (Color)tag[TagKeyTextColor];
            string displayText = tag["DisplayText"] as string ?? "";
            bool closed = (bool)tag[TagKeyClosed];

            if (!isOverlayMode && closed)
            {
                textAlpha = Math.Min(textAlpha, HiddenAlpha);
                backAlpha = Math.Min(backAlpha, HiddenAlpha);
                borderAlpha = Math.Min(borderAlpha, HiddenAlpha);
            }

            var g = e.Graphics;

            if (backAlpha > 0)
            {
                using var brush = new SolidBrush(Color.FromArgb(backAlpha, baseBackColor));
                g.FillRectangle(brush, 0, 0, lbl.Width, lbl.Height);
            }

            if (lbl.BorderStyle == BorderStyle.FixedSingle && borderAlpha > 0)
            {
                using var pen = new Pen(Color.FromArgb(borderAlpha, borderColor), 1);
                g.DrawRectangle(pen, 0, 0, lbl.Width - 1, lbl.Height - 1);
            }

            if (closed && !isOverlayMode)
            {
                using var pen = new Pen(Color.Red, 3);
                g.DrawRectangle(pen, 2, 2, lbl.Width - 5, lbl.Height - 5);
            }

            if (textAlpha > 0 && !string.IsNullOrEmpty(displayText))
            {
                using var brush = new SolidBrush(Color.FromArgb(textAlpha, textColor));
                using var sf = new StringFormat
                {
                    Alignment = StringAlignment.Center,
                    LineAlignment = StringAlignment.Center,
                    FormatFlags = StringFormatFlags.NoWrap
                };
                var textRect = lbl.DisplayRectangle;
                textRect.Inflate(-2, -2);
                g.DrawString(displayText, lbl.Font, brush, textRect, sf);
            }
        }
        #endregion

        private void ScaleLabelFont(Label lbl)
        {
            if (lbl.Tag is not Dictionary<string, object> tag) return;
            string text = (string)tag["DisplayText"];
            if (string.IsNullOrEmpty(text)) return;

            using var g = lbl.CreateGraphics();
            var rect = lbl.DisplayRectangle;
            rect.Inflate(-2, -2);
            if (rect.Width <= 0 || rect.Height <= 0) return;

            float minSize = 8f;
            float maxSize = 1000f;
            float bestSize = minSize;

            while (maxSize - minSize > 0.5f)
            {
                float mid = (minSize + maxSize) / 2f;
                using var font = new Font(lbl.Font.FontFamily, mid, lbl.Font.Style);
                var size = g.MeasureString(text, font);
                if (size.Width <= rect.Width && size.Height <= rect.Height)
                {
                    bestSize = mid;
                    minSize = mid;
                }
                else
                {
                    maxSize = mid;
                }
            }

            bestSize *= 0.95f;
            bestSize = Math.Max(bestSize, 8f);
            if (Math.Abs(lbl.Font.Size - bestSize) > 0.1f)
            {
                lbl.Font = new Font(lbl.Font.FontFamily, bestSize, lbl.Font.Style);
            }
        }

        #region Context Menu Handlers
        private void ChangeTextColor_Click(object? sender, EventArgs e)
        {
            if (sender is not ToolStripMenuItem mi) return;
            var owner = mi.GetCurrentParent() as ContextMenuStrip;
            if (owner?.SourceControl is not Label lbl || lbl.Tag is not Dictionary<string, object> tag) return;

            using var dlg = new ColorDialog { Color = (Color)tag[TagKeyTextColor] };
            if (dlg.ShowDialog() == DialogResult.OK)
            {
                tag[TagKeyTextColor] = dlg.Color;
                lbl.Invalidate();
                SaveBlockPositions();
            }
        }

        private void ChangeBackColor_Click(object? sender, EventArgs e)
        {
            if (sender is not ToolStripMenuItem mi) return;
            var owner = mi.GetCurrentParent() as ContextMenuStrip;
            if (owner?.SourceControl is not Label lbl || lbl.Tag is not Dictionary<string, object> tag) return;

            using var dlg = new ColorDialog { Color = (Color)tag[TagKeyBaseBackColor] };
            if (dlg.ShowDialog() == DialogResult.OK)
            {
                tag[TagKeyBaseBackColor] = dlg.Color;
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
            if (owner?.SourceControl is not Label lbl || lbl.Tag is not Dictionary<string, object> tag) return;

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
            if (owner?.SourceControl is not Label lbl || lbl.Tag is not Dictionary<string, object> tag) return;

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
                if (lbl.Tag is Dictionary<string, object> tag)
                {
                    tag[TagKeyBaseBackColor] = dlg.Color;
                    lbl.Invalidate();
                }
            }
            SaveBlockPositions();
        }

        private void ChangeTextColorAll_Click(object? sender, EventArgs e)
        {
            using var dlg = new ColorDialog();
            if (dlg.ShowDialog() != DialogResult.OK) return;
            foreach (Label lbl in GetDataLabels())
            {
                if (lbl.Tag is Dictionary<string, object> tag)
                {
                    tag[TagKeyTextColor] = dlg.Color;
                    lbl.Invalidate();
                }
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

            foreach (var c in GetDataLabels().ToList())
            {
                RemoveLabel(c);
            }

            selectedLabels.Clear();
            InitializeDataBlocks();
            this.Invalidate();
        }

        private void SaveSettingsAs_Click(object? sender, EventArgs e)
        {
            using var dlg = new SaveFileDialog
            {
                Filter = "JSON files (*.json)|*.json",
                DefaultExt = "json",
                FileName = "TelemetrySettings", // .json подставится автоматически
                OverwritePrompt = true
            };

            if (dlg.ShowDialog() != DialogResult.OK) return;

            var data = new BlockPositionData
            {
                FormBackAlpha = formBackAlpha,
                FormWidth = this.ClientSize.Width,
                FormHeight = this.ClientSize.Height,
                Language = Localization.Current  // ← работает
            };

            foreach (var lbl in GetDataLabels())
            {
                if (lbl.Tag is not Dictionary<string, object> tag) continue;

                data.Blocks.Add(new BlockData
                {
                    Name = lbl.Name,
                    LabelText = (string)tag["LabelText"],
                    X = lbl.Location.X,
                    Y = lbl.Location.Y,
                    Width = lbl.Size.Width,
                    Height = lbl.Size.Height,
                    TextColorArgb = ((Color)tag[TagKeyTextColor]).ToArgb(),
                    BaseBackColorArgb = ((Color)tag[TagKeyBaseBackColor]).ToArgb(),
                    BackAlpha = (int)tag[TagKeyBackAlpha],
                    BorderStyle = lbl.BorderStyle,
                    TextAlpha = (int)tag[TagKeyAlpha],
                    BorderAlpha = (int)tag[TagKeyBorderAlpha],
                    BorderColorArgb = ((Color)tag[TagKeyBorderColor]).ToArgb(),
                    Closed = (bool)tag[TagKeyClosed],
                    ShowLabel = (bool)tag[TagKeyShowLabel]
                });
            }

            try
            {
                File.WriteAllText(dlg.FileName, JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true }));
                MessageBox.Show($"Настройки сохранены в:\n{dlg.FileName}", "Успех", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Ошибка сохранения:\n{ex.Message}", "Ошибка", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void LoadSettingsFrom_Click(object? sender, EventArgs e)
        {
            using var dlg = new OpenFileDialog
            {
                Filter = "JSON files (*.json)|*.json",
                FileName = "TelemetrySettings.json"
            };

            if (dlg.ShowDialog() != DialogResult.OK) return;

            try
            {
                var json = File.ReadAllText(dlg.FileName);
                var data = JsonSerializer.Deserialize<BlockPositionData>(json) ?? throw new Exception("Пустой или некорректный JSON");

                // --- Применяем глобальные настройки ---
                formBackAlpha = data.FormBackAlpha;
                this.ClientSize = new Size(data.FormWidth, data.FormHeight);
                UpdateFormBackColor();

                // --- Очищаем текущие блоки ---
                foreach (var lbl in GetDataLabels().ToList())
                {
                    RemoveLabel(lbl);
                }
                selectedLabels.Clear();
                hiddenInOverlay.Clear();

                // --- Создаём блоки из файла ---
                foreach (var b in data.Blocks)
                {
                    string labelText = b.LabelText;
                    if (string.IsNullOrEmpty(labelText))
                    {
                        // fallback для старых файлов
                        var def = defaultBlocks.FirstOrDefault(d => d.name == b.Name);
                        labelText = def.label; // ← теперь работает!
                    }

                    var lbl = CreateDataLabel(
                        b.Name,
                        labelText,
                        "0",
                        b.X, b.Y, b.Width, b.Height,
                        blockMenuTemplate!
                    );

                    lbl.BorderStyle = b.BorderStyle;

                    var tag = lbl.Tag as Dictionary<string, object> ?? new Dictionary<string, object>();
                    tag[TagKeyAlpha] = b.TextAlpha;
                    tag[TagKeyClosed] = b.Closed;
                    tag[TagKeyBorderAlpha] = b.BorderAlpha;
                    tag[TagKeyBorderColor] = Color.FromArgb(b.BorderColorArgb);
                    tag[TagKeyBaseBackColor] = Color.FromArgb(b.BaseBackColorArgb);
                    tag[TagKeyBackAlpha] = b.BackAlpha;
                    tag[TagKeyShowLabel] = b.ShowLabel;
                    tag[TagKeyTextColor] = Color.FromArgb(b.TextColorArgb);
                    tag["LabelText"] = labelText;
                    tag["ValueText"] = "0";
                    lbl.Tag = tag;

                    UpdateLabelText(lbl);
                    lbl.Invalidate();
                }

                // --- Если оверлей включён — переносим блоки в hiddenInOverlay ---
                if (isOverlayMode)
                {
                    foreach (Label lbl in this.Controls.OfType<Label>().ToList())
                    {
                        this.Controls.Remove(lbl);
                        hiddenInOverlay.Add(lbl);
                    }
                    RedrawOverlay();
                }

                // --- Сохраняем как дефолтные (для автосохранения при закрытии) ---
                SaveBlockPositions();

                this.Invalidate();

                MessageBox.Show($"Настройки загружены из:\n{dlg.FileName}", "Успех", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Ошибка загрузки:\n{ex.Message}", "Ошибка", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
        #endregion

        #region Helpers
        private IEnumerable<Label> GetDataLabels() => this.Controls.OfType<Label>().Concat(hiddenInOverlay);
        private int GetGlobalTextAlpha() => GetDataLabels().FirstOrDefault()?.Tag is Dictionary<string, object> t ? (int)t[TagKeyAlpha] : 255;
        private int GetGlobalBackAlpha() => GetDataLabels().FirstOrDefault()?.Tag is Dictionary<string, object> t ? (int)t[TagKeyBackAlpha] : 255;
        private int GetGlobalBorderAlpha() => GetDataLabels().FirstOrDefault()?.Tag is Dictionary<string, object> t ? (int)t[TagKeyBorderAlpha] : 255;
        #endregion

        #region Save / Load
        private void SaveBlockPositions()
        {
            var data = new BlockPositionData
            {
                FormBackAlpha = formBackAlpha,
                FormWidth = this.ClientSize.Width,
                FormHeight = this.ClientSize.Height,
                Language = Localization.Current
            };

            var existingLabels = GetDataLabels().ToList();

            foreach (var lbl in existingLabels)
            {
                if (lbl.Tag is not Dictionary<string, object> tag) continue;

                data.Blocks.Add(new BlockData
                {
                    Name = lbl.Name,
                    LabelText = (string)tag["LabelText"],  // ← ДОБАВИТЬ
                    X = lbl.Location.X,
                    Y = lbl.Location.Y,
                    Width = lbl.Size.Width,
                    Height = lbl.Size.Height,
                    TextColorArgb = ((Color)tag[TagKeyTextColor]).ToArgb(),
                    BaseBackColorArgb = ((Color)tag[TagKeyBaseBackColor]).ToArgb(),
                    BackAlpha = (int)tag[TagKeyBackAlpha],
                    BorderStyle = lbl.BorderStyle,
                    TextAlpha = (int)tag[TagKeyAlpha],
                    BorderAlpha = (int)tag[TagKeyBorderAlpha],
                    BorderColorArgb = ((Color)tag[TagKeyBorderColor]).ToArgb(),
                    Closed = (bool)tag[TagKeyClosed],
                    ShowLabel = (bool)tag[TagKeyShowLabel]
                });
            }

            try
            {
                File.WriteAllText(POSITION_FILE, JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true }));
            }
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
                this.ClientSize = new Size(data.FormWidth, data.FormHeight);
                UpdateFormBackColor();

                // ← Восстанавливаем язык
                if (!string.IsNullOrEmpty(data.Language))
                {
                    Localization.Current = data.Language;
                    currentLanguage = Localization.Current;
                    ApplyLanguageToAllMenus();
                }

                // Удаляем все старые блоки
                foreach (var c in GetDataLabels().ToList())
                {
                    RemoveLabel(c);
                }

                foreach (var b in data.Blocks)
                {
                    string labelText = b.LabelText;  // ← БЕРЁМ ИЗ JSON!
                    if (string.IsNullOrEmpty(labelText))
                    {
                        // fallback: если нет в JSON — ищем по Name в defaultBlocks
                        var def = defaultBlocks.FirstOrDefault(d => d.name == b.Name);
                        labelText = def.label;
                    }

                    var lbl = CreateDataLabel(
                        b.Name,
                        labelText,
                        "0",  // начальное значение
                        b.X, b.Y, b.Width, b.Height,
                        blockMenuTemplate!
                    );

                    lbl.BorderStyle = b.BorderStyle;

                    var tag = lbl.Tag as Dictionary<string, object> ?? new Dictionary<string, object>();
                    tag[TagKeyAlpha] = b.TextAlpha;
                    tag[TagKeyClosed] = b.Closed;
                    tag[TagKeyBorderAlpha] = b.BorderAlpha;
                    tag[TagKeyBorderColor] = Color.FromArgb(b.BorderColorArgb);
                    tag[TagKeyBaseBackColor] = Color.FromArgb(b.BaseBackColorArgb);
                    tag[TagKeyBackAlpha] = b.BackAlpha;
                    tag[TagKeyShowLabel] = b.ShowLabel;
                    tag[TagKeyTextColor] = Color.FromArgb(b.TextColorArgb);
                    tag["LabelText"] = labelText;  // ← ВАЖНО!
                    tag["ValueText"] = "0";
                    lbl.Tag = tag;

                    UpdateLabelText(lbl);
                    lbl.Invalidate();
                }
            }
            catch
            {
                File.Delete(POSITION_FILE);
            }
        }

        private void ApplyLanguageToAllMenus()
        {
            // === Главное меню формы ===
            this.ContextMenuStrip?.Dispose();
            this.ContextMenuStrip = null;
            InitializeFormContextMenu();

            // === Трей-меню ===
            if (notifyIcon != null)
            {
                notifyIcon.ContextMenuStrip?.Dispose();
                var trayMenu = new ContextMenuStrip();

                var toggleOverlay = new ToolStripMenuItem(Localization.T("Overlay (Transparency)")) { Checked = isOverlayMode };
                toggleOverlay.Click += ToggleOverlay_Click;
                trayMenu.Items.Add(toggleOverlay);

                trayMenu.Items.Add(new ToolStripSeparator());

                var exit = new ToolStripMenuItem(Localization.T("Exit"));
                exit.Click += (s, e) => this.Close();
                trayMenu.Items.Add(exit);

                notifyIcon.ContextMenuStrip = trayMenu;
            }

            // === Шаблон меню блоков ===
            blockMenuTemplate?.Dispose();
            blockMenuTemplate = CreateBlockContextMenu();

            // === Обновляем чекбоксы ТОЛЬКО если меню существуют ===
            UpdateMenuCheckedStateSafe();
        }
        #endregion

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
            void Set(string labelText, string value)
            {
                foreach (var lbl in GetDataLabels())
                {
                    if (lbl.Tag is Dictionary<string, object> tag &&
                        tag.TryGetValue("LabelText", out var lt) &&
                        lt is string lblText &&
                        lblText == labelText)
                    {
                        tag["ValueText"] = value;
                        UpdateLabelText(lbl);
                    }
                }
            }

            Set("Speed", $"{(int)(packet.m_speed * 3.6f)}");
            Set("RPM (Raw)", $"{packet.m_engineRPM:F0}");
            Set("RPM (*250)", $"{packet.m_engineRPM * 250f:F0}");
            Set("Gear", packet.m_gear == 0 ? "N" : packet.m_gear > 0 ? ((int)packet.m_gear).ToString() : "R");
            Set("Throttle", $"{packet.m_throttle:P0}");
            Set("Brake", $"{packet.m_brake:P0}");
            Set("G-Lat", $"{packet.m_gForceLateral:F2}");
            Set("G-Long", $"{packet.m_gForceLongitudinal:F2}");
            Set("Pitch", $"{packet.m_pitch:F2}");

            if (isOverlayMode) RedrawOverlay();
        }
        #endregion

        private void RedrawOverlay()
        {
            Point pos = this.Location;
            Size sz = this.Size;

            using var bmp = new Bitmap(sz.Width, sz.Height, PixelFormat.Format32bppArgb);
            using (var g = Graphics.FromImage(bmp))
            {
                g.Clear(Color.Transparent);

                foreach (Label lbl in GetDataLabels())
                {
                    if (lbl.Tag is not Dictionary<string, object> tag || (bool)tag[TagKeyClosed]) continue;

                    var rect = new Rectangle(lbl.Left, lbl.Top, lbl.Width, lbl.Height);
                    int textAlpha = (int)tag[TagKeyAlpha];
                    int backAlpha = (int)tag[TagKeyBackAlpha];
                    int borderAlpha = (int)tag[TagKeyBorderAlpha];
                    Color baseBackColor = (Color)tag[TagKeyBaseBackColor];
                    Color borderColor = (Color)tag[TagKeyBorderColor];
                    Color textColor = (Color)tag[TagKeyTextColor];
                    string displayText = tag["DisplayText"] as string ?? "";

                    // === Фон (с альфой) ===
                    if (backAlpha > 0)
                    {
                        using var brush = new SolidBrush(Color.FromArgb(backAlpha, baseBackColor));
                        g.FillRectangle(brush, rect);
                    }

                    // === Рамка (с альфой) ===
                    if (lbl.BorderStyle == BorderStyle.FixedSingle && borderAlpha > 0)
                    {
                        using var pen = new Pen(Color.FromArgb(borderAlpha, borderColor), 1);
                        g.DrawRectangle(pen, rect.X, rect.Y, rect.Width - 1, rect.Height - 1);
                    }

                    // === Текст — через отдельный метод с ImageAttributes ===
                    if (textAlpha > 0 && !string.IsNullOrEmpty(displayText))
                    {
                        DrawTextWithAlpha(g, rect, displayText, lbl.Font, textColor, textAlpha);
                    }
                }
            }

            // === Обновление окна ===
            IntPtr screenDc = GetDC(IntPtr.Zero);
            IntPtr memDc = CreateCompatibleDC(screenDc);
            IntPtr hBitmap = IntPtr.Zero;
            IntPtr oldBitmap = IntPtr.Zero;

            try
            {
                hBitmap = bmp.GetHbitmap(Color.FromArgb(0));
                oldBitmap = SelectObject(memDc, hBitmap);

                Point pptDst = pos;
                Size psize = sz;
                Point pptSrc = new Point(0, 0);

                BLENDFUNCTION blend = new BLENDFUNCTION
                {
                    BlendOp = AC_SRC_OVER,
                    BlendFlags = 0,
                    SourceConstantAlpha = 255,
                    AlphaFormat = AC_SRC_ALPHA
                };

                UpdateLayeredWindow(
                    this.Handle,
                    screenDc,
                    ref pptDst,
                    ref psize,
                    memDc,
                    ref pptSrc,
                    0,
                    ref blend,
                    ULW_ALPHA);
            }
            finally
            {
                if (oldBitmap != IntPtr.Zero) SelectObject(memDc, oldBitmap);
                if (hBitmap != IntPtr.Zero) DeleteObject(hBitmap);
                ReleaseDC(IntPtr.Zero, screenDc);
                DeleteDC(memDc);
            }
        }

        private void DrawTextWithAlpha(Graphics dst, Rectangle rect, string text, Font font, Color color, int alpha)
        {
            if (alpha <= 0 || string.IsNullOrEmpty(text)) return;

            // 1. Создаём временный битмап только для текста (полностью непрозрачный)
            using var txtBmp = new Bitmap(rect.Width, rect.Height, PixelFormat.Format32bppArgb);
            using (var gTxt = Graphics.FromImage(txtBmp))
            {
                gTxt.Clear(Color.Transparent);
                using var brush = new SolidBrush(color); // без альфы!
                using var sf = new StringFormat
                {
                    Alignment = StringAlignment.Center,
                    LineAlignment = StringAlignment.Center,
                    FormatFlags = StringFormatFlags.NoWrap
                };
                var textRect = new Rectangle(4, 4, rect.Width - 8, rect.Height - 8);
                gTxt.DrawString(text, font, brush, textRect, sf);
            }

            // 2. Блендим с нужной альфой через GDI+
            using var attributes = new ImageAttributes();
            var matrix = new ColorMatrix { Matrix33 = alpha / 255f }; // только альфа
            attributes.SetColorMatrix(matrix, ColorMatrixFlag.Default, ColorAdjustType.Bitmap);

            dst.DrawImage(
                txtBmp,
                rect,                     // destination
                0, 0, rect.Width, rect.Height,
                GraphicsUnit.Pixel,
                attributes);
        }

        private void UpdateLabelText(Label lbl)
        {
            if (lbl.Tag is not Dictionary<string, object> tag) return;
            string label = (string)tag["LabelText"];
            string value = (string)tag["ValueText"];
            bool showLabel = (bool)tag[TagKeyShowLabel];
            tag["DisplayText"] = showLabel ? $"{label}: {value}" : value;
            ScaleLabelFont(lbl);
            lbl.Invalidate();
        }

        private void CopyBlock_Click(object? sender, EventArgs e)
        {
            if (sender is not ToolStripMenuItem mi) return;
            var owner = mi.GetCurrentParent() as ContextMenuStrip;
            if (owner?.SourceControl is not Label original || original.Tag is not Dictionary<string, object> originalTag) return;

            string baseName = original.Name;
            int copyIndex = 1;
            string newName;
            do
            {
                newName = $"{baseName}_Copy{copyIndex++}";
            } while (GetDataLabels().Any(l => l.Name == newName));

            // Копируем LabelText и ValueText
            string labelText = (string)originalTag["LabelText"];
            string valueText = (string)originalTag["ValueText"];

            var newLabel = CreateDataLabel(
                newName,
                labelText,
                valueText, // ← передаём текущее значение
                original.Location.X + 20,
                original.Location.Y + 20,
                original.Width,
                original.Height,
                owner
            );

            var newTag = new Dictionary<string, object>(originalTag);
            newTag["DisplayText"] = originalTag["DisplayText"];
            newLabel.Tag = newTag;
            newLabel.Font = new Font(original.Font.FontFamily, original.Font.Size, original.Font.Style);
            newLabel.BorderStyle = original.BorderStyle;

            // Обновляем текст (важно!)
            UpdateLabelText(newLabel);
            newLabel.Invalidate();

            SaveBlockPositions();
        }
    }

    public class ToolStripTrackBar : ToolStripControlHost
    {
        public TrackBar TrackBar => (TrackBar)Control;
        public ToolStripTrackBar() : base(new TrackBar()) { TrackBar.AutoSize = false; }
    }

    public static class ControlExtensions
    {
        public static void SetStyle(this Control control, ControlStyles flag, bool value)
        {
            var method = typeof(Control).GetMethod("SetStyle", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            method?.Invoke(control, new object[] { flag, value });
        }
    }


}