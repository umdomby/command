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
        // --- P/Invoke для прозрачного окна (Оверлей) ---
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
        private const int HiddenAlpha = 204; // 80% прозрачность
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

        // --- Инициализация и настройка ---
        public Form1()
        {
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
                MessageBox.Show($"Ошибка инициализации UDP: {ex.Message}", "Ошибка UDP", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }

            InitializeDataBlocks();
            LoadBlockPositions();
            InitializeFormContextMenu();
            InitializeNotifyIcon();
        }

        private void InitializeNotifyIcon()
        {
            notifyIcon = new NotifyIcon();
            notifyIcon.Text = "Telemetry UDP Viewer";
            notifyIcon.Icon = this.Icon;
            notifyIcon.Visible = true;
            ContextMenuStrip trayMenu = new ContextMenuStrip();
            ToolStripMenuItem toggleOverlayItem = new ToolStripMenuItem("Переключить Оверлей (Прозрачность)");
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
                    if (this.Visible)
                    {
                        this.Hide();
                    }
                    else
                    {
                        this.Show();
                        this.BringToFront();
                    }
                }
            };
        }

        private void InitializeFormContextMenu()
        {
            ContextMenuStrip formContextMenu = new ContextMenuStrip();

            ToolStripMenuItem toggleOverlayItem = new ToolStripMenuItem("Переключить в Оверлей (Полная Прозрачность)");
            toggleOverlayItem.Checked = this.isOverlayMode;
            toggleOverlayItem.Click += ToggleOverlay_Click;
            formContextMenu.Items.Add(toggleOverlayItem);
            formContextMenu.Items.Add(new ToolStripSeparator());

            // <-- ИСПРАВЛЕНО: Прозрачность фона всех блоков через TrackBar -->
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
                    if (lbl.BackColor.A == 0) continue; // Пропускаем полностью прозрачные
                    Color baseColor = Color.FromArgb(255, lbl.BackColor.R, lbl.BackColor.G, lbl.BackColor.B);
                    lbl.BackColor = Color.FromArgb(alpha, baseColor);
                    var tag = lbl.Tag as Dictionary<string, object>;
                    if (tag != null)
                    {
                        tag["IsTransparent"] = alpha == 0;
                    }
                    lbl.Invalidate();
                }
                SaveBlockPositions();
            };
            backOpacityItem.DropDownItems.Add(backOpacityTrackBar);
            formContextMenu.Items.Add(backOpacityItem);

            ToolStripMenuItem changeBackColorAllItem = new ToolStripMenuItem("Установить цвет фона всех блоков");
            changeBackColorAllItem.Click += ChangeBackColorAll_Click;
            formContextMenu.Items.Add(changeBackColorAllItem);

            ToolStripMenuItem changeTextColorAllItem = new ToolStripMenuItem("Установить цвет текста всех блоков");
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
                    if (tag != null)
                    {
                        tag[TagKeyAlpha] = alpha;
                        lbl.Invalidate();
                    }
                }
                SaveBlockPositions();
            };
            textOpacityItem.DropDownItems.Add(opacityTrackBar);
            formContextMenu.Items.Add(textOpacityItem);
            formContextMenu.Items.Add(new ToolStripSeparator());

            ToolStripMenuItem toggleTopMostItem = new ToolStripMenuItem("Окно поверх всех (TopMost)");
            toggleTopMostItem.Checked = this.TopMost;
            toggleTopMostItem.Click += ToggleTopMost_Click;
            formContextMenu.Items.Add(toggleTopMostItem);

            ToolStripMenuItem resetPositionsItem = new ToolStripMenuItem("Сбросить расположение блоков");
            resetPositionsItem.Click += ResetBlockPositions_Click;
            formContextMenu.Items.Add(resetPositionsItem);

            this.ContextMenuStrip = formContextMenu;
        }

        private void InitializeDataBlocks()
        {
            ContextMenuStrip blockContextMenu = new ContextMenuStrip();

            ToolStripMenuItem changeTextColorItem = new ToolStripMenuItem("Изменить цвет текста");
            changeTextColorItem.Click += ChangeTextColor_Click;
            blockContextMenu.Items.Add(changeTextColorItem);

            ToolStripMenuItem changeBackColorItem = new ToolStripMenuItem("Изменить цвет фона");
            changeBackColorItem.Click += ChangeBackColor_Click;
            blockContextMenu.Items.Add(changeBackColorItem);

            blockContextMenu.Items.Add(new ToolStripSeparator());

            ToolStripMenuItem toggleVisibleItem = new ToolStripMenuItem("Скрыть/Показать этот блок");
            toggleVisibleItem.Click += ToggleVisible_Click;
            blockContextMenu.Items.Add(toggleVisibleItem);

            int formInnerWidth = this.ClientSize.Width - 20;
            int defaultWidth = formInnerWidth / 3 - 10;
            int defaultHeight = 60;
            int hSpace = 10;
            int vSpace = 10;
            int currentX = 10;
            int currentY = 10;

            CreateDataLabel("lblSpeed", "Speed: 0.0", currentX, currentY, defaultWidth, defaultHeight, blockContextMenu);
            currentX += defaultWidth + hSpace;
            CreateDataLabel("lblRPM_Raw", "RPM (Raw): 0", currentX, currentY, defaultWidth, defaultHeight, blockContextMenu);
            currentX += defaultWidth + hSpace;
            CreateDataLabel("lblRPM_250x", "RPM (*250): 0", currentX, currentY, defaultWidth, defaultHeight, blockContextMenu);
            currentX = 10;
            currentY += defaultHeight + vSpace;
            CreateDataLabel("lblGear", "Gear: 0", currentX, currentY, defaultWidth, defaultHeight, blockContextMenu);
            currentX += defaultWidth + hSpace;
            CreateDataLabel("lblThrottle", "Throttle: 0.0", currentX, currentY, defaultWidth, defaultHeight, blockContextMenu);
            currentX += defaultWidth + hSpace;
            CreateDataLabel("lblBrake", "Brake: 0.0", currentX, currentY, defaultWidth, defaultHeight, blockContextMenu);
            currentX = 10;
            currentY += defaultHeight + vSpace;
            CreateDataLabel("lblGForceLat", "G-Lat: 0.0", currentX, currentY, defaultWidth, defaultHeight, blockContextMenu);
            currentX += defaultWidth + hSpace;
            CreateDataLabel("lblGForceLon", "G-Long: 0.0", currentX, currentY, defaultWidth, defaultHeight, blockContextMenu);
            currentX += defaultWidth + hSpace;
            CreateDataLabel("lblPitch", "Pitch: 0.0", currentX, currentY, defaultWidth, defaultHeight, blockContextMenu);
        }

        private void CreateDataLabel(string name, string text, int x, int y, int width, int height, ContextMenuStrip contextMenu)
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
                ContextMenuStrip = contextMenu
            };
            lbl.Font = new Font("Arial", 12, FontStyle.Bold);
            ScaleLabelFont(lbl);
            lbl.MouseDown += Label_MouseDown;
            lbl.MouseMove += Label_MouseMove;
            lbl.MouseUp += Label_MouseUp;
            lbl.Paint += Label_Paint;
            this.Controls.Add(lbl);
        }

        // --- P/Invoke Логика Оверлея ---
        protected override void OnHandleCreated(EventArgs e)
        {
            base.OnHandleCreated(e);
            this.TransparencyKey = transparencyKeyColor;
        }

        private void ToggleOverlay_Click(object? sender, EventArgs e)
        {
            ToolStripMenuItem? menuItem = sender as ToolStripMenuItem;
            isOverlayMode = !isOverlayMode;
            if (menuItem != null)
            {
                menuItem.Checked = isOverlayMode;
            }
            if (notifyIcon.ContextMenuStrip?.Items[0] is ToolStripMenuItem trayItem)
            {
                trayItem.Checked = isOverlayMode;
            }
            if (this.ContextMenuStrip?.Items[0] is ToolStripMenuItem formItem)
            {
                formItem.Checked = isOverlayMode;
            }

            int currentStyles = GetWindowLong(this.Handle, GWL_EXSTYLE);
            if (isOverlayMode)
            {
                this.FormBorderStyle = FormBorderStyle.None;
                SetWindowLong(this.Handle, GWL_EXSTYLE, currentStyles | WS_EX_LAYERED);
                SetLayeredWindowAttributes(this.Handle, (uint)transparencyKeyColor.ToArgb(), 0, LWA_COLORKEY);
                SetWindowLong(this.Handle, GWL_EXSTYLE, GetWindowLong(this.Handle, GWL_EXSTYLE) | WS_EX_TRANSPARENT);
                this.BackColor = transparencyKeyColor;
            }
            else
            {
                this.FormBorderStyle = FormBorderStyle.Sizable;
                SetWindowLong(this.Handle, GWL_EXSTYLE, currentStyles & ~WS_EX_LAYERED);
                SetWindowLong(this.Handle, GWL_EXSTYLE, GetWindowLong(this.Handle, GWL_EXSTYLE) & ~WS_EX_TRANSPARENT);
                this.BackColor = Color.Gray;
            }
            this.Invalidate(true);
        }

        // --- Логика Drag, Resize и масштабирования шрифта ---
        private void Label_MouseDown(object? sender, MouseEventArgs e)
        {
            if (e.Button == MouseButtons.Left)
            {
                draggedOrResizedLabel = sender as Label;
                if (draggedOrResizedLabel == null) return;
                if (isOverlayMode && (Control.ModifierKeys & Keys.Control) != Keys.Control)
                {
                    return;
                }
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
                        ResizeHandleSize,
                        ResizeHandleSize
                    );
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
                    ResizeHandleSize,
                    ResizeHandleSize
                );
                if (resizeHandle.Contains(e.Location) && !isOverlayMode)
                {
                    draggedOrResizedLabel.Cursor = Cursors.SizeNWSE;
                }
                else
                {
                    draggedOrResizedLabel.Cursor = Cursors.Default;
                }
            }
        }

        private void Label_MouseUp(object? sender, MouseEventArgs e)
        {
            isDragging = false;
            isResizing = false;
            draggedOrResizedLabel = null;
            this.Cursor = Cursors.Default;
            SaveBlockPositions();
        }

        // <-- ИСПРАВЛЕНО: блоки с Closed = true НЕ рисуются в оверлее -->
        private void Label_Paint(object? sender, PaintEventArgs e)
        {
            Label? lbl = sender as Label;
            if (lbl == null) return;
            var tag = lbl.Tag as Dictionary<string, object>;
            if (tag == null) return;

            bool isClosed = tag.ContainsKey(TagKeyClosed) && (bool)tag[TagKeyClosed];

            // В оверлее скрытые блоки полностью пропускаются
            if (isOverlayMode && isClosed)
                return;

            int textAlpha = tag.ContainsKey(TagKeyAlpha) ? (int)tag[TagKeyAlpha] : 255;

            ScaleLabelFont(lbl);

            // Фон
            if (lbl.BackColor == Color.Transparent && isOverlayMode)
            {
                e.Graphics.Clear(transparencyKeyColor);
            }
            else if (lbl.BackColor == Color.Transparent && !isOverlayMode)
            {
                e.Graphics.Clear(this.BackColor);
            }
            else
            {
                using (SolidBrush brush = new SolidBrush(lbl.BackColor))
                {
                    e.Graphics.FillRectangle(brush, lbl.ClientRectangle);
                }
            }

            // Текст с альфой
            if (textAlpha > 0)
            {
                Color textColor = Color.FromArgb(textAlpha, lbl.ForeColor);
                using (SolidBrush textBrush = new SolidBrush(textColor))
                {
                    e.Graphics.DrawString(lbl.Text, lbl.Font, textBrush, lbl.ClientRectangle,
                        new StringFormat
                        {
                            Alignment = StringAlignment.Center,
                            LineAlignment = StringAlignment.Center
                        });
                }
            }

            // Граница
            if (lbl.BorderStyle == BorderStyle.FixedSingle)
            {
                e.Graphics.DrawRectangle(Pens.White, 0, 0, lbl.Width - 1, lbl.Height - 1);
            }
        }

        private void ScaleLabelFont(Label lbl)
        {
            if (string.IsNullOrEmpty(lbl.Text)) return;
            float minRatio;
            using (Graphics g = Graphics.FromHwnd(lbl.Handle))
            {
                Font baseFont = new Font("Arial", 100);
                SizeF stringSize = g.MeasureString(lbl.Text, baseFont, lbl.Width);
                float wRatio = lbl.Width / stringSize.Width;
                float hRatio = lbl.Height / stringSize.Height;
                minRatio = Math.Min(wRatio, hRatio);
                baseFont.Dispose();
            }
            float newFontSize = 100 * minRatio;
            if (newFontSize < 12) newFontSize = 12;
            if (Math.Abs(lbl.Font.Size - newFontSize) > 0.01f)
            {
                Font oldFont = lbl.Font;
                lbl.Font = new Font(oldFont.FontFamily, newFontSize, oldFont.Style);
                oldFont.Dispose();
            }
        }

        // --- Индивидуальные настройки блока ---
        private void ChangeTextColor_Click(object? sender, EventArgs e)
        {
            ToolStripMenuItem? menuItem = sender as ToolStripMenuItem;
            ContextMenuStrip? contextMenu = menuItem?.Owner as ContextMenuStrip;
            Label? targetLabel = contextMenu?.SourceControl as Label;
            if (targetLabel != null)
            {
                using (ColorDialog colorDialog = new ColorDialog())
                {
                    colorDialog.Color = targetLabel.ForeColor;
                    if (colorDialog.ShowDialog() == DialogResult.OK)
                    {
                        targetLabel.ForeColor = colorDialog.Color;
                        targetLabel.Invalidate();
                        SaveBlockPositions();
                    }
                }
            }
        }

        private void ChangeBackColor_Click(object? sender, EventArgs e)
        {
            ToolStripMenuItem? menuItem = sender as ToolStripMenuItem;
            ContextMenuStrip? contextMenu = menuItem?.Owner as ContextMenuStrip;
            Label? targetLabel = contextMenu?.SourceControl as Label;
            if (targetLabel != null)
            {
                using (ColorDialog colorDialog = new ColorDialog())
                {
                    colorDialog.Color = targetLabel.BackColor;
                    if (colorDialog.ShowDialog() == DialogResult.OK)
                    {
                        targetLabel.BackColor = colorDialog.Color;
                        var tag = targetLabel.Tag as Dictionary<string, object>;
                        if (tag != null)
                        {
                            tag["IsTransparent"] = targetLabel.BackColor.A == 0;
                        }
                        targetLabel.Invalidate();
                        SaveBlockPositions();
                    }
                }
            }
        }

        private void ToggleVisible_Click(object? sender, EventArgs e)
        {
            ToolStripMenuItem? menuItem = sender as ToolStripMenuItem;
            ContextMenuStrip? contextMenu = menuItem?.Owner as ContextMenuStrip;
            Label? targetLabel = contextMenu?.SourceControl as Label;
            if (targetLabel != null)
            {
                var tag = targetLabel.Tag as Dictionary<string, object>;
                if (tag == null) return;

                bool closed = tag.ContainsKey(TagKeyClosed) && (bool)tag[TagKeyClosed];
                tag[TagKeyClosed] = !closed;
                tag[TagKeyAlpha] = !closed ? HiddenAlpha : 255;
                targetLabel.Invalidate();
                SaveBlockPositions();
            }
        }

        // --- Глобальные настройки ---
        private IEnumerable<Label> GetDataLabels()
        {
            return this.Controls.OfType<Label>();
        }

        private int GetGlobalTextAlpha()
        {
            var first = GetDataLabels().FirstOrDefault();
            var tag = first?.Tag as Dictionary<string, object>;
            return tag != null && tag.ContainsKey(TagKeyAlpha) ? (int)tag[TagKeyAlpha] : 255;
        }

        // <-- ИСПРАВЛЕНО: Устранение CS8603 -->
        private int GetGlobalBackAlpha()
        {
            var first = GetDataLabels().FirstOrDefault(lbl => lbl.BackColor.A != 0);
            return first != null ? first.BackColor.A : 255;
        }

        private void ChangeBackColorAll_Click(object? sender, EventArgs e)
        {
            using (ColorDialog colorDialog = new ColorDialog())
            {
                if (colorDialog.ShowDialog() == DialogResult.OK)
                {
                    Color baseColor = colorDialog.Color;
                    foreach (Label lbl in GetDataLabels())
                    {
                        int currentAlpha = lbl.BackColor.A == 0 ? 255 : lbl.BackColor.A;
                        Color newColor = Color.FromArgb(currentAlpha, baseColor.R, baseColor.G, baseColor.B);
                        lbl.BackColor = newColor;
                        var tag = lbl.Tag as Dictionary<string, object>;
                        if (tag != null)
                        {
                            tag["IsTransparent"] = currentAlpha == 0;
                        }
                        lbl.Invalidate();
                    }
                    SaveBlockPositions();
                }
            }
        }

        private void ChangeTextColorAll_Click(object? sender, EventArgs e)
        {
            using (ColorDialog colorDialog = new ColorDialog())
            {
                if (colorDialog.ShowDialog() == DialogResult.OK)
                {
                    Color newColor = colorDialog.Color;
                    foreach (Label lbl in GetDataLabels())
                    {
                        lbl.ForeColor = newColor;
                        lbl.Invalidate();
                    }
                    SaveBlockPositions();
                }
            }
        }

        private void ToggleVisibleAll_Click(object? sender, EventArgs e)
        {
            bool makeClosed = true;
            Label? first = GetDataLabels().FirstOrDefault();
            if (first != null)
            {
                var tag = first.Tag as Dictionary<string, object>;
                makeClosed = tag != null && !(bool)tag[TagKeyClosed];
            }
            int targetAlpha = makeClosed ? HiddenAlpha : 255;
            foreach (Label lbl in GetDataLabels())
            {
                var tag = lbl.Tag as Dictionary<string, object>;
                if (tag != null)
                {
                    tag[TagKeyClosed] = makeClosed;
                    tag[TagKeyAlpha] = targetAlpha;
                    lbl.Invalidate();
                }
            }
            SaveBlockPositions();
        }

        // --- Прочие настройки ---
        private void ResetBlockPositions_Click(object? sender, EventArgs e)
        {
            if (File.Exists(POSITION_FILE))
            {
                try { File.Delete(POSITION_FILE); }
                catch (IOException ex)
                {
                    MessageBox.Show($"Невозможно удалить файл: {ex.Message}\nЗакройте программу и удалите файл вручную.", "Ошибка");
                    return;
                }
            }
            var controlsToRemove = GetDataLabels().ToList();
            foreach (var control in controlsToRemove)
            {
                this.Controls.Remove(control);
                control.Dispose();
            }
            InitializeDataBlocks();
        }

        private void ToggleTopMost_Click(object? sender, EventArgs e)
        {
            ToolStripMenuItem? menuItem = sender as ToolStripMenuItem;
            this.TopMost = !this.TopMost;
            if (menuItem != null)
            {
                menuItem.Checked = this.TopMost;
            }
        }

        // --- Сохранение и Загрузка ---
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
            public List<BlockData> Blocks { get; set; } = new List<BlockData>();
        }

        private void SaveBlockPositions()
        {
            var data = new BlockPositionData();
            foreach (Control control in this.Controls)
            {
                if (control is Label lbl)
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
                        TextAlpha = tag.ContainsKey(TagKeyAlpha) ? (int)tag[TagKeyAlpha] : 255,
                        Closed = tag.ContainsKey(TagKeyClosed) && (bool)tag[TagKeyClosed]
                    });
                }
            }
            try
            {
                string jsonString = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(POSITION_FILE, jsonString);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка сохранения позиций блоков: {ex.Message}");
            }
        }

        private void LoadBlockPositions()
        {
            if (!File.Exists(POSITION_FILE)) return;
            try
            {
                string jsonString = File.ReadAllText(POSITION_FILE);
                var data = JsonSerializer.Deserialize<BlockPositionData>(jsonString);
                if (data == null) return;
                foreach (var blockData in data.Blocks)
                {
                    Label? lbl = this.Controls[blockData.Name] as Label;
                    if (lbl != null)
                    {
                        lbl.Location = new Point(blockData.X, blockData.Y);
                        lbl.Size = new Size(blockData.Width, blockData.Height);
                        lbl.ForeColor = Color.FromArgb(blockData.TextColorArgb);
                        lbl.BackColor = Color.FromArgb(blockData.BackColorArgb);
                        lbl.BorderStyle = blockData.BorderStyle;
                        var tag = lbl.Tag as Dictionary<string, object> ?? new Dictionary<string, object>();
                        tag["IsTransparent"] = lbl.BackColor.A == 0;
                        tag[TagKeyAlpha] = blockData.TextAlpha;
                        tag[TagKeyClosed] = blockData.Closed;
                        lbl.Tag = tag;
                        lbl.Invalidate();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка загрузки позиций блоков: {ex.Message}");
                if (File.Exists(POSITION_FILE))
                {
                    File.Delete(POSITION_FILE);
                }
            }
        }

        private void Form1_Load(object? sender, EventArgs e) { }

        private void Form1_FormClosing(object? sender, FormClosingEventArgs e)
        {
            udpClient?.Close();
            SaveBlockPositions();
            notifyIcon.Visible = false;
            notifyIcon.Dispose();
        }

        // --- Обработка UDP ---
        private void ReceiveCallback(IAsyncResult ar)
        {
            try
            {
                byte[] receivedBytes = udpClient.EndReceive(ar, ref ipEndPoint!);
                udpClient.BeginReceive(new AsyncCallback(ReceiveCallback), null);
                if (receivedBytes.Length == Marshal.SizeOf<GridLegendsMotionPacket189>())
                {
                    GridLegendsMotionPacket189 packet = Utils.ByteArrayToStructure<GridLegendsMotionPacket189>(receivedBytes);
                    if (this.IsHandleCreated)
                    {
                        this.BeginInvoke(new Action(() => UpdateUI(packet)));
                    }
                }
            }
            catch (ObjectDisposedException) { }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка приема UDP: {ex.Message}");
            }
        }

        private void UpdateUI(GridLegendsMotionPacket189 packet)
        {
            void UpdateLabel(string name, string text)
            {
                var lbl = this.Controls[name] as Label;
                if (lbl != null)
                {
                    lbl.Text = text;
                    lbl.Invalidate();
                }
            }
            UpdateLabel("lblSpeed", $"Speed: {packet.m_speed * 3.6f:F1} km/h");
            UpdateLabel("lblRPM_Raw", $"RPM (Raw): {packet.m_engineRPM:F0}");
            UpdateLabel("lblRPM_250x", $"RPM (*250): {packet.m_engineRPM * 250f:F0}");
            string gearText = (packet.m_gear == 0f) ? "N" : (packet.m_gear > 0f) ? ((int)packet.m_gear).ToString() : "R";
            UpdateLabel("lblGear", $"Gear: {gearText}");
            UpdateLabel("lblThrottle", $"Throttle: {packet.m_throttle:P0}");
            UpdateLabel("lblBrake", $"Brake: {packet.m_brake:P0}");
            UpdateLabel("lblGForceLat", $"G-Lat: {packet.m_gForceLateral:F2}");
            UpdateLabel("lblGForceLon", $"G-Long: {packet.m_gForceLongitudinal:F2}");
            UpdateLabel("lblPitch", $"Pitch: {packet.m_pitch:F2}");
        }
    }

    public class ToolStripTrackBar : ToolStripControlHost
    {
        public TrackBar TrackBar => (TrackBar)Control;
        public ToolStripTrackBar() : base(new TrackBar())
        {
            TrackBar.AutoSize = false;
        }
    }
}