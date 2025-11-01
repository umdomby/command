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
        private const int HiddenAlpha = 204; // 80%
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

        private void InitializeFormContextMenu()
        {
            ContextMenuStrip formContextMenu = new ContextMenuStrip();

            ToolStripMenuItem toggleOverlayItem = new ToolStripMenuItem("Оверлей (Полная Прозрачность)");
            toggleOverlayItem.Checked = isOverlayMode;
            toggleOverlayItem.Click += ToggleOverlay_Click;
            formContextMenu.Items.Add(toggleOverlayItem);
            formContextMenu.Items.Add(new ToolStripSeparator());

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
                    if (lbl.BackColor.A == 0) continue;
                    Color baseColor = Color.FromArgb(255, lbl.BackColor.R, lbl.BackColor.G, lbl.BackColor.B);
                    lbl.BackColor = Color.FromArgb(alpha, baseColor);
                    var tag = lbl.Tag as Dictionary<string, object>;
                    if (tag != null) tag["IsTransparent"] = alpha == 0;
                    lbl.Invalidate();
                }
                SaveBlockPositions();
            };
            backOpacityItem.DropDownItems.Add(backOpacityTrackBar);
            formContextMenu.Items.Add(backOpacityItem);

            ToolStripMenuItem changeBackColorAllItem = new ToolStripMenuItem("Цвет фона всех блоков");
            changeBackColorAllItem.Click += ChangeBackColorAll_Click;
            formContextMenu.Items.Add(changeBackColorAllItem);

            ToolStripMenuItem changeTextColorAllItem = new ToolStripMenuItem("Цвет текста всех блоков");
            changeTextColorAllItem.Click += ChangeTextColorAll_Click;
            formContextMenu.Items.Add(changeTextColorAllItem);

            ToolStripMenuItem toggleVisibleAllItem = new ToolStripMenuItem("Скрыть/Показать все блоки");
            toggleVisibleAllItem.Click += ToggleVisibleAll_Click;
            formContextMenu.Items.Add(toggleVisibleAllItem);

            ToolStripMenuItem textOpacityItem = new ToolStripMenuItem("Прозрачность текста");
            ToolStripTrackBar opacityTrackBar = new ToolStripTrackBar();
            opacityTrackBar.TrackBar.Width = 150;
            opacityTrackBar.TrackBar.Minimum = 0;
            opacityTrackBar.TrackBar.Maximum = 255;
            opacityTrackBar.TrackBar.Value = GetGlobalTextAlpha();
            opacityTrackBar.TrackBar.ValueChanged += (s, ev) =>
            {
                int alpha = opacityTrackBar.TrackBar.Value;
                foreach (Label lbl in GetDataLabels())
                {
                    var tag = lbl.Tag as Dictionary<string, object>;
                    if (tag != null) tag[TagKeyAlpha] = alpha;
                    lbl.Invalidate();
                }
                SaveBlockPositions();
            };
            textOpacityItem.DropDownItems.Add(opacityTrackBar);
            formContextMenu.Items.Add(textOpacityItem);
            formContextMenu.Items.Add(new ToolStripSeparator());

            ToolStripMenuItem toggleTopMostItem = new ToolStripMenuItem("Поверх всех окон");
            toggleTopMostItem.Checked = this.TopMost;
            toggleTopMostItem.Click += ToggleTopMost_Click;
            formContextMenu.Items.Add(toggleTopMostItem);

            ToolStripMenuItem resetPositionsItem = new ToolStripMenuItem("Сбросить расположение");
            resetPositionsItem.Click += ResetBlockPositions_Click;
            formContextMenu.Items.Add(resetPositionsItem);

            this.ContextMenuStrip = formContextMenu;
        }

        private void InitializeDataBlocks()
        {
            ContextMenuStrip blockContextMenu = new ContextMenuStrip();
            ToolStripMenuItem changeTextColorItem = new ToolStripMenuItem("Цвет текста");
            changeTextColorItem.Click += ChangeTextColor_Click;
            blockContextMenu.Items.Add(changeTextColorItem);

            ToolStripMenuItem changeBackColorItem = new ToolStripMenuItem("Цвет фона");
            changeBackColorItem.Click += ChangeBackColor_Click;
            blockContextMenu.Items.Add(changeBackColorItem);

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
                BackColor = Color.Black,
                AutoSize = false,
                Tag = new Dictionary<string, object>
                {
                    { "IsTransparent", false },
                    { TagKeyAlpha, 255 },
                    { TagKeyClosed, false }
                },
                ContextMenuStrip = menu
            };
            lbl.Font = new Font("Arial", 12, FontStyle.Bold);
            ScaleLabelFont(lbl);
            lbl.MouseDown += Label_MouseDown;
            lbl.MouseMove += Label_MouseMove;
            lbl.MouseUp += Label_MouseUp;
            lbl.Paint += Label_Paint;
            this.Controls.Add(lbl);
        }

        protected override void OnHandleCreated(EventArgs e)
        {
            base.OnHandleCreated(e);
            this.TransparencyKey = transparencyKeyColor;
        }

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

        private void Label_Paint(object? sender, PaintEventArgs e)
        {
            Label? lbl = sender as Label;
            if (lbl == null) return;
            var tag = lbl.Tag as Dictionary<string, object>;
            if (tag == null) return;

            bool isClosed = (bool)tag[TagKeyClosed];
            int textAlpha = (int)tag[TagKeyAlpha];

            if (!isOverlayMode && isClosed)
            {
                textAlpha = HiddenAlpha;
            }

            ScaleLabelFont(lbl);

            if (lbl.BackColor.A == 0 && isOverlayMode)
                e.Graphics.Clear(transparencyKeyColor);
            else if (lbl.BackColor.A == 0 && !isOverlayMode)
                e.Graphics.Clear(this.BackColor);
            else
                using (var brush = new SolidBrush(lbl.BackColor))
                    e.Graphics.FillRectangle(brush, lbl.ClientRectangle);

            if (textAlpha > 0)
            {
                Color textColor = Color.FromArgb(textAlpha, lbl.ForeColor);
                using (var brush = new SolidBrush(textColor))
                {
                    e.Graphics.DrawString(lbl.Text, lbl.Font, brush, lbl.ClientRectangle,
                        new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center });
                }
            }

            if (lbl.BorderStyle == BorderStyle.FixedSingle)
                e.Graphics.DrawRectangle(Pens.White, 0, 0, lbl.Width - 1, lbl.Height - 1);
        }

        private void ScaleLabelFont(Label lbl)
        {
            if (string.IsNullOrEmpty(lbl.Text)) return;
            using Graphics g = Graphics.FromHwnd(lbl.Handle);
            Font baseFont = new Font("Arial", 100);
            SizeF size = g.MeasureString(lbl.Text, baseFont, lbl.Width);
            float ratio = Math.Min(lbl.Width / size.Width, lbl.Height / size.Height);
            baseFont.Dispose();
            float newSize = 100 * ratio;
            if (newSize < 12) newSize = 12;
            if (Math.Abs(lbl.Font.Size - newSize) > 0.01f)
            {
                lbl.Font = new Font(lbl.Font.FontFamily, newSize, lbl.Font.Style);
            }
        }

        // --- Исправлено: SourceControl через GetCurrentParent ---
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
                    using ColorDialog dlg = new ColorDialog { Color = lbl.BackColor };
                    if (dlg.ShowDialog() == DialogResult.OK)
                    {
                        lbl.BackColor = dlg.Color;
                        var tag = lbl.Tag as Dictionary<string, object>;
                        if (tag != null) tag["IsTransparent"] = dlg.Color.A == 0;
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
                tag[TagKeyAlpha] = !wasClosed ? HiddenAlpha : 255;

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

        private IEnumerable<Label> GetDataLabels() => this.Controls.OfType<Label>();

        private int GetGlobalTextAlpha()
        {
            var first = GetDataLabels().FirstOrDefault();
            return first?.Tag is Dictionary<string, object> t ? (int)t[TagKeyAlpha] : 255;
        }

        private int GetGlobalBackAlpha()
        {
            return GetDataLabels().FirstOrDefault(l => l.BackColor.A != 0)?.BackColor.A ?? 255;
        }

        private void ChangeBackColorAll_Click(object? sender, EventArgs e)
        {
            using ColorDialog dlg = new ColorDialog();
            if (dlg.ShowDialog() == DialogResult.OK)
            {
                foreach (Label lbl in GetDataLabels())
                {
                    int a = lbl.BackColor.A == 0 ? 255 : lbl.BackColor.A;
                    lbl.BackColor = Color.FromArgb(a, dlg.Color.R, dlg.Color.G, dlg.Color.B);
                    var tag = lbl.Tag as Dictionary<string, object>;
                    if (tag != null) tag["IsTransparent"] = a == 0;
                    lbl.Invalidate();
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
                tag[TagKeyAlpha] = makeClosed ? HiddenAlpha : 255;

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

        // --- Сохранение/Загрузка ---
        public class BlockData
        {
            public string Name { get; set; } = "";
            public int X { get; set; }
            public int Y { get; set; }
            public int Width { get; set; }
            public int Height { get; set; }
            public int TextColorArgb { get; set; }
            public int BackColorArgb { get; set; }
            public BorderStyle BorderStyle { get; set; }
            public int TextAlpha { get; set; } = 255;
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
                        BackColorArgb = lbl.BackColor.ToArgb(),
                        BorderStyle = lbl.BorderStyle,
                        TextAlpha = (int)tag[TagKeyAlpha],
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
                    Label? lbl = this.Controls[b.Name] as Label;  // <-- ИСПРАВЛЕНО: this.Controls
                    if (lbl != null)
                    {
                        lbl.Location = new Point(b.X, b.Y);
                        lbl.Size = new Size(b.Width, b.Height);
                        lbl.ForeColor = Color.FromArgb(b.TextColorArgb);
                        lbl.BackColor = Color.FromArgb(b.BackColorArgb);
                        lbl.BorderStyle = b.BorderStyle;
                        var tag = lbl.Tag as Dictionary<string, object> ?? new Dictionary<string, object>();
                        tag["IsTransparent"] = lbl.BackColor.A == 0;
                        tag[TagKeyAlpha] = b.TextAlpha;
                        tag[TagKeyClosed] = b.Closed;
                        lbl.Tag = tag;
                        lbl.Invalidate();
                    }
                }
            }
            catch { File.Delete(POSITION_FILE); }
        }

        private void Form1_Load(object? sender, EventArgs e) { }
        private void Form1_FormClosing(object? sender, FormClosingEventArgs e)
        {
            udpClient?.Close();
            SaveBlockPositions();
            notifyIcon.Visible = false;
            notifyIcon.Dispose();
        }

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
                if (lbl != null) { lbl.Text = text; lbl.Invalidate(); }
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
    }

    public class ToolStripTrackBar : ToolStripControlHost
    {
        public TrackBar TrackBar => (TrackBar)Control;
        public ToolStripTrackBar() : base(new TrackBar()) { TrackBar.AutoSize = false; }
    }
}