using System;
using System.Drawing;
using System.Net;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using System.IO;
using System.Text.Json;
using System.Collections.Generic;

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

        private UdpClient udpClient = null!;
        private IPEndPoint ipEndPoint = null!;

        private Label? draggedOrResizedLabel = null;
        private Point dragStartPosition;
        private bool isDragging = false;
        private bool isResizing = false;
        private const int ResizeHandleSize = 10;

        private Color transparencyKeyColor = Color.Magenta;
        private bool isOverlayMode = false;

        private NotifyIcon notifyIcon = null!;


        // --- Инициализация и настройка ---

        public Form1()
        {
            // InitializeComponent(); // Предполагается, что присутствует

            this.Load += Form1_Load;
            this.FormClosing += Form1_FormClosing;
            this.DoubleBuffered = true;
            this.Text = "Telemetry UDP Viewer";
            this.BackColor = Color.Gray;
            this.FormBorderStyle = FormBorderStyle.Sizable;
            this.MaximizeBox = false;
            this.TopMost = true;
            this.Size = new Size(500, 250); // Устанавливаем разумный начальный размер

            // Инициализация UDP клиента
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

            // Создание и настройка блоков (Label)
            InitializeDataBlocks();
            LoadBlockPositions();

            InitializeFormContextMenu();
            InitializeNotifyIcon(); // Инициализация иконки в трее
        }

        private void InitializeNotifyIcon()
        {
            notifyIcon = new NotifyIcon();
            notifyIcon.Text = "Telemetry UDP Viewer";

            // Заглушка для иконки - используем иконку приложения или создаем простую
            // В реальном приложении сюда нужно загрузить файл .ico
            notifyIcon.Icon = SystemIcons.Information;

            notifyIcon.Visible = true;

            ContextMenuStrip trayMenu = new ContextMenuStrip();
            ToolStripMenuItem toggleOverlayItem = new ToolStripMenuItem("Переключить Оверлей (Прозрачность)");
            toggleOverlayItem.Click += ToggleOverlay_Click;

            ToolStripMenuItem exitItem = new ToolStripMenuItem("Выход");
            exitItem.Click += (s, e) => this.Close();

            trayMenu.Items.Add(toggleOverlayItem);
            trayMenu.Items.Add(exitItem);

            notifyIcon.ContextMenuStrip = trayMenu;
        }

        private void InitializeFormContextMenu()
        {
            ContextMenuStrip formContextMenu = new ContextMenuStrip();
            ToolStripMenuItem resetPositionsItem = new ToolStripMenuItem("Сбросить расположение блоков");
            resetPositionsItem.Click += ResetBlockPositions_Click;

            ToolStripMenuItem toggleTopMostItem = new ToolStripMenuItem("Окно поверх всех (TopMost)");
            toggleTopMostItem.Checked = this.TopMost;
            toggleTopMostItem.Click += ToggleTopMost_Click;

            ToolStripMenuItem toggleOverlayItem = new ToolStripMenuItem("Переключить в Оверлей (Полная Прозрачность)");
            toggleOverlayItem.Checked = this.isOverlayMode;
            toggleOverlayItem.Click += ToggleOverlay_Click;

            formContextMenu.Items.Add(toggleOverlayItem);
            formContextMenu.Items.Add(new ToolStripSeparator());
            formContextMenu.Items.Add(toggleTopMostItem);
            formContextMenu.Items.Add(resetPositionsItem);

            this.ContextMenuStrip = formContextMenu;
        }

        private void InitializeDataBlocks()
        {
            ContextMenuStrip blockContextMenu = new ContextMenuStrip();
            ToolStripMenuItem changeColorItem = new ToolStripMenuItem("Изменить цвет текста");
            changeColorItem.Click += ChangeTextColor_Click;
            ToolStripMenuItem toggleTransparencyItem = new ToolStripMenuItem("Сделать фон прозрачным/непрозрачным");
            toggleTransparencyItem.Click += ToggleTransparency_Click;

            blockContextMenu.Items.Add(changeColorItem);
            blockContextMenu.Items.Add(toggleTransparencyItem);

            // Использование 80% ширины формы для расчета начального размера
            int formInnerWidth = this.ClientSize.Width - 20; // 10px padding с каждой стороны
            int defaultWidth = formInnerWidth / 3 - 10;
            int defaultHeight = 60; // Увеличиваем высоту для большего шрифта
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
                Tag = false,
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
            // Получаем элемент меню из контекстного меню формы или иконки в трее
            ToolStripMenuItem? menuItem = sender as ToolStripMenuItem;

            isOverlayMode = !isOverlayMode;

            if (menuItem != null)
            {
                menuItem.Checked = isOverlayMode;
                // Обновляем состояние другого меню (если оно есть)
                if (notifyIcon.ContextMenuStrip?.Items[0] is ToolStripMenuItem trayItem)
                {
                    trayItem.Checked = isOverlayMode;
                }
                if (this.ContextMenuStrip?.Items[0] is ToolStripMenuItem formItem)
                {
                    formItem.Checked = isOverlayMode;
                }
            }

            int currentStyles = GetWindowLong(this.Handle, GWL_EXSTYLE);

            if (isOverlayMode)
            {
                // Убираем заголовок и рамки
                this.FormBorderStyle = FormBorderStyle.None;

                // Включаем оверлей
                SetWindowLong(this.Handle, GWL_EXSTYLE, currentStyles | WS_EX_LAYERED);
                SetLayeredWindowAttributes(this.Handle, (uint)transparencyKeyColor.ToArgb(), 0, LWA_COLORKEY);
                SetWindowLong(this.Handle, GWL_EXSTYLE, GetWindowLong(this.Handle, GWL_EXSTYLE) | WS_EX_TRANSPARENT);

                this.BackColor = transparencyKeyColor;
            }
            else
            {
                // Возвращаем заголовок и рамки
                this.FormBorderStyle = FormBorderStyle.Sizable;

                // Выключаем оверлей
                SetWindowLong(this.Handle, GWL_EXSTYLE, currentStyles & ~WS_EX_LAYERED);
                SetWindowLong(this.Handle, GWL_EXSTYLE, GetWindowLong(this.Handle, GWL_EXSTYLE) & ~WS_EX_TRANSPARENT);

                this.BackColor = Color.Gray;
            }
        }

        // --- Логика Drag, Resize и масштабирования шрифта ---

        // Убрал WndProc, так как WS_EX_TRANSPARENT более надежно обрабатывает клики сквозь окно.

        private void Label_MouseDown(object? sender, MouseEventArgs e)
        {
            if (e.Button == MouseButtons.Left)
            {
                draggedOrResizedLabel = sender as Label;
                if (draggedOrResizedLabel == null) return;

                // Разрешаем управление блоками только вне оверлейного режима (или с Ctrl)
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

        private void Label_Paint(object? sender, PaintEventArgs e)
        {
            Label? lbl = sender as Label;
            if (lbl != null)
            {
                ScaleLabelFont(lbl);
            }
        }

        private void ScaleLabelFont(Label lbl)
        {
            if (lbl.Text.Length == 0) return;

            float minRatio;

            using (Graphics g = lbl.CreateGraphics())
            {
                Font baseFont = new Font("Arial", 100);
                // Используем больший коэффициент масштабирования, чтобы текст был крупнее
                SizeF stringSize = g.MeasureString(lbl.Text, baseFont, lbl.Width);

                float wRatio = lbl.Width / stringSize.Width;
                float hRatio = lbl.Height / stringSize.Height;
                minRatio = Math.Min(wRatio, hRatio);
                baseFont.Dispose();
            }

            // Убрали коэффициент 0.9f, чтобы использовать почти весь доступный размер
            float newFontSize = 100 * minRatio;

            // Увеличиваем минимальный размер шрифта
            if (newFontSize < 12) newFontSize = 12;

            if (lbl.Font.Size != newFontSize)
            {
                Font oldFont = lbl.Font;
                lbl.Font = new Font(oldFont.FontFamily, newFontSize, oldFont.Style);
                oldFont.Dispose();
            }
        }


        // --- Обработка контекстного меню и событий ---

        private void ChangeTextColor_Click(object? sender, EventArgs e)
        {
            ToolStripMenuItem? menuItem = sender as ToolStripMenuItem;
            ContextMenuStrip? contextMenu = menuItem!.Owner as ContextMenuStrip;
            Label? targetLabel = contextMenu!.SourceControl as Label;

            if (targetLabel != null)
            {
                using (ColorDialog colorDialog = new ColorDialog())
                {
                    colorDialog.Color = targetLabel.ForeColor;
                    if (colorDialog.ShowDialog() == DialogResult.OK)
                    {
                        targetLabel.ForeColor = colorDialog.Color;
                        SaveBlockPositions();
                    }
                }
            }
        }

        private void ToggleTransparency_Click(object? sender, EventArgs e)
        {
            ToolStripMenuItem? menuItem = sender as ToolStripMenuItem;
            ContextMenuStrip? contextMenu = menuItem!.Owner as ContextMenuStrip;
            Label? targetLabel = contextMenu!.SourceControl as Label;

            if (targetLabel != null)
            {
                bool isTransparent = targetLabel.Tag is bool tagValue && tagValue;

                if (isTransparent)
                {
                    targetLabel.BackColor = Color.Black;
                    targetLabel.BorderStyle = BorderStyle.FixedSingle;
                    targetLabel.Tag = false;
                }
                else
                {
                    targetLabel.BackColor = Color.Transparent;
                    targetLabel.BorderStyle = BorderStyle.None;
                    targetLabel.Tag = true;
                }

                SaveBlockPositions();
                targetLabel.Invalidate();
            }
        }

        private void ResetBlockPositions_Click(object? sender, EventArgs e)
        {
            if (File.Exists(POSITION_FILE))
            {
                try
                {
                    File.Delete(POSITION_FILE);
                }
                catch (IOException ex)
                {
                    MessageBox.Show($"Невозможно удалить файл: {ex.Message}\nЗакройте программу и удалите файл вручную.", "Ошибка");
                    return;
                }
            }

            var controlsToRemove = new List<Control>();
            foreach (Control control in this.Controls)
            {
                if (control is Label)
                {
                    controlsToRemove.Add(control);
                }
            }

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

        // --- Сохранение и Загрузка расположений блоков ---

        private void SaveBlockPositions()
        {
            var data = new BlockPositionData();

            foreach (Control control in this.Controls)
            {
                if (control is Label lbl)
                {
                    data.Blocks.Add(new BlockData
                    {
                        Name = lbl.Name,
                        X = lbl.Location.X,
                        Y = lbl.Location.Y,
                        Width = lbl.Size.Width,
                        Height = lbl.Size.Height,
                        TextColorArgb = lbl.ForeColor.ToArgb(),
                        BackColorArgb = lbl.BackColor.ToArgb(),
                        BorderStyle = lbl.BorderStyle
                    });
                }
            }

            try
            {
                string jsonString = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true })!;
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

                        lbl.Tag = (lbl.BackColor.A == 0);

                        ScaleLabelFont(lbl);
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
            // Убираем иконку из трея при закрытии
            notifyIcon.Visible = false;
            notifyIcon.Dispose();
        }

        // --- Обработка UDP данных ---

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
            // Получаем все Label один раз для эффективности
            var speedLabel = this.Controls["lblSpeed"] as Label;
            var rpmRawLabel = this.Controls["lblRPM_Raw"] as Label;
            var rpm250xLabel = this.Controls["lblRPM_250x"] as Label;
            var gearLabel = this.Controls["lblGear"] as Label;
            var throttleLabel = this.Controls["lblThrottle"] as Label;
            var brakeLabel = this.Controls["lblBrake"] as Label;
            var gForceLatLabel = this.Controls["lblGForceLat"] as Label;
            var gForceLonLabel = this.Controls["lblGForceLon"] as Label;
            var pitchLabel = this.Controls["lblPitch"] as Label;

            if (speedLabel != null)
            {
                speedLabel.Text = $"Speed: {packet.m_speed * 3.6f:F1} km/h";
                ScaleLabelFont(speedLabel);
            }

            if (rpmRawLabel != null)
            {
                rpmRawLabel.Text = $"RPM (Raw): {packet.m_engineRPM:F0}";
                ScaleLabelFont(rpmRawLabel);
            }

            if (rpm250xLabel != null)
            {
                rpm250xLabel.Text = $"RPM (*250): {packet.m_engineRPM * 250f:F0}";
                ScaleLabelFont(rpm250xLabel);
            }

            if (gearLabel != null)
            {
                string gearText = (packet.m_gear == 0f) ? "N" : (packet.m_gear > 0f) ? ((int)packet.m_gear).ToString() : "R";
                gearLabel.Text = $"Gear: {gearText}";
                ScaleLabelFont(gearLabel);
            }

            if (throttleLabel != null)
            {
                throttleLabel.Text = $"Throttle: {packet.m_throttle:P0}";
                ScaleLabelFont(throttleLabel);
            }

            if (brakeLabel != null)
            {
                brakeLabel.Text = $"Brake: {packet.m_brake:P0}";
                ScaleLabelFont(brakeLabel);
            }

            if (gForceLatLabel != null)
            {
                gForceLatLabel.Text = $"G-Lat: {packet.m_gForceLateral:F2}";
                ScaleLabelFont(gForceLatLabel);
            }

            if (gForceLonLabel != null)
            {
                gForceLonLabel.Text = $"G-Long: {packet.m_gForceLongitudinal:F2}";
                ScaleLabelFont(gForceLonLabel);
            }

            if (pitchLabel != null)
            {
                pitchLabel.Text = $"Pitch: {packet.m_pitch:F2}";
                ScaleLabelFont(pitchLabel);
            }
        }
    }
}