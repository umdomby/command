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
    // *** ПРЕДУПРЕЖДЕНИЕ: Этот код зависит от обновленной структуры BlockData.cs ***

    public partial class Form1 : Form
    {
        // --- Константы и переменные ---
        private const int LISTEN_PORT = 20778; // Порт для UDP
        private const string POSITION_FILE = "BlockPositions.json";

        // ! - Оператор null-forgiving, утверждающий, что поля инициализированы в конструкторе
        private UdpClient udpClient = null!;
        private IPEndPoint ipEndPoint = null!;

        // Переменные для Drag-and-Drop и Resizing
        // ? - Указывает, что Label может быть null
        private Label? draggedOrResizedLabel = null;
        private Point dragStartPosition;
        private bool isDragging = false;
        private bool isResizing = false;
        private const int ResizeHandleSize = 10;

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
                // При ошибке инициализации мы не можем продолжить, this.Close()
            }

            // Создание и настройка блоков (Label)
            InitializeDataBlocks();
            LoadBlockPositions();

            // Установка контекстного меню для формы после InitializeDataBlocks
            InitializeFormContextMenu();
        }

        private void InitializeFormContextMenu()
        {
            // 2. Создание контекстного меню для формы (ПКМ на фоне)
            ContextMenuStrip formContextMenu = new ContextMenuStrip();
            ToolStripMenuItem resetPositionsItem = new ToolStripMenuItem("Сбросить расположение блоков");
            resetPositionsItem.Click += ResetBlockPositions_Click;
            ToolStripMenuItem toggleTopMostItem = new ToolStripMenuItem("Поверх всех окон (TopMost)");
            toggleTopMostItem.Click += ToggleTopMost_Click;

            formContextMenu.Items.Add(resetPositionsItem);
            formContextMenu.Items.Add(toggleTopMostItem);
            this.ContextMenuStrip = formContextMenu; // Привязка к форме

            // Настройка прозрачности формы (частично)
            ToolStripMenuItem toggleFormTransparency = new ToolStripMenuItem("Сделать окно прозрачным (Opacity)");
            toggleFormTransparency.Click += ToggleFormOpacity_Click;
            formContextMenu.Items.Add(toggleFormTransparency);
        }

        private void InitializeDataBlocks()
        {
            // 1. Создание контекстного меню для блоков (ПКМ на блоке)
            ContextMenuStrip blockContextMenu = new ContextMenuStrip();
            ToolStripMenuItem changeColorItem = new ToolStripMenuItem("Изменить цвет текста");
            changeColorItem.Click += ChangeTextColor_Click;
            ToolStripMenuItem toggleTransparencyItem = new ToolStripMenuItem("Сделать фон прозрачным/непрозрачным");
            toggleTransparencyItem.Click += ToggleTransparency_Click;

            blockContextMenu.Items.Add(changeColorItem);
            blockContextMenu.Items.Add(toggleTransparencyItem);

            // 3. Создание блоков с данными
            CreateDataLabel("lblSpeed", "Speed: 0.0", 10, 10, 150, 40, blockContextMenu);
            CreateDataLabel("lblRPM_Raw", "RPM (Raw): 0", 170, 10, 150, 40, blockContextMenu);
            CreateDataLabel("lblRPM_250x", "RPM (*250): 0", 330, 10, 150, 40, blockContextMenu);
            CreateDataLabel("lblGear", "Gear: 0", 490, 10, 100, 40, blockContextMenu);
            CreateDataLabel("lblThrottle", "Throttle: 0.0", 10, 60, 150, 40, blockContextMenu);
            CreateDataLabel("lblBrake", "Brake: 0.0", 170, 60, 150, 40, blockContextMenu);
            CreateDataLabel("lblGForceLat", "G-Lat: 0.0", 10, 110, 150, 40, blockContextMenu);
            CreateDataLabel("lblGForceLon", "G-Long: 0.0", 170, 110, 150, 40, blockContextMenu);
            CreateDataLabel("lblPitch", "Pitch: 0.0", 330, 60, 150, 40, blockContextMenu);
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

            // Font гарантированно не null после создания
            lbl.Font = new Font("Arial", 12, FontStyle.Bold);
            ScaleLabelFont(lbl);

            // Привязка обработчиков мыши для Drag & Resize
            lbl.MouseDown += Label_MouseDown;
            lbl.MouseMove += Label_MouseMove;
            lbl.MouseUp += Label_MouseUp;
            lbl.Paint += Label_Paint;

            this.Controls.Add(lbl);
        }

        // --- Логика Drag, Resize и масштабирования шрифта ---

        private void Label_MouseDown(object? sender, MouseEventArgs e)
        {
            if (e.Button == MouseButtons.Left)
            {
                // Проверяем, что sender является Label и приводим к типу Label?
                draggedOrResizedLabel = sender as Label;
                if (draggedOrResizedLabel == null) return; // Дополнительная проверка на null

                // Логика Drag/Resize
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

                    if (resizeHandle.Contains(e.Location))
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
                // Разыменование вероятной пустой ссылки - исправлено проверкой выше
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
                // Курсор
                Rectangle resizeHandle = new Rectangle(
                    draggedOrResizedLabel.Width - ResizeHandleSize,
                    draggedOrResizedLabel.Height - ResizeHandleSize,
                    ResizeHandleSize,
                    ResizeHandleSize
                );

                if (resizeHandle.Contains(e.Location))
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
            // lbl.Text не может быть null, так как Text - это non-nullable string
            if (lbl.Text.Length == 0) return;

            float minRatio;

            // CreateGraphics() возвращает Graphics, который должен быть освобожден
            using (Graphics g = lbl.CreateGraphics())
            {
                // Font Family гарантированно не null, так как мы его создали.
                Font baseFont = new Font("Arial", 100);
                // Избегаем разыменования вероятной пустой ссылки baseFont, так как using
                SizeF stringSize = g.MeasureString(lbl.Text, baseFont, lbl.Width);

                float wRatio = lbl.Width / stringSize.Width;
                float hRatio = lbl.Height / stringSize.Height;
                minRatio = Math.Min(wRatio, hRatio);
                baseFont.Dispose();
            }

            float newFontSize = 100 * minRatio * 0.9f;

            if (newFontSize < 5) newFontSize = 5;

            // lbl.Font гарантированно не null
            if (lbl.Font.Size != newFontSize)
            {
                Font oldFont = lbl.Font;
                // Font Family гарантированно не null
                lbl.Font = new Font(oldFont.FontFamily, newFontSize, oldFont.Style);
                oldFont.Dispose();
            }
        }


        // --- Обработка контекстного меню ---

        private void ChangeTextColor_Click(object? sender, EventArgs e)
        {
            ToolStripMenuItem? menuItem = sender as ToolStripMenuItem;
            // Оператор ! утверждает, что Owner и SourceControl не будут null
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
            // Оператор ! утверждает, что Owner и SourceControl не будут null
            ContextMenuStrip? contextMenu = menuItem!.Owner as ContextMenuStrip;
            Label? targetLabel = contextMenu!.SourceControl as Label;

            if (targetLabel != null)
            {
                // Распаковка-преобразование вероятного значения NULL - исправлено проверкой на null
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
            // Удаление файла для сброса
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

            // Пересоздание блоков в исходных позициях
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
            // Разыменование вероятной пустой ссылки - исправлено проверкой на null
            if (menuItem != null)
            {
                menuItem.Checked = this.TopMost;
            }
        }

        private void ToggleFormOpacity_Click(object? sender, EventArgs e)
        {
            ToolStripMenuItem? menuItem = sender as ToolStripMenuItem;
            if (this.Opacity < 1.0)
            {
                this.Opacity = 1.0;
                // Разыменование вероятной пустой ссылки - исправлено проверкой на null
                if (menuItem != null)
                {
                    menuItem.Text = "Сделать окно прозрачным (Opacity)";
                }
            }
            else
            {
                this.Opacity = 0.5;
                if (menuItem != null)
                {
                    menuItem.Text = "Сделать окно непрозрачным (Opacity)";
                }
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
                        // Name гарантированно не null, так как инициализировано в BlockData
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
                // JsonSerializer.Serialize может вернуть null, но мы используем не-nullable string
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
                // JsonSerializer.Deserialize может вернуть null
                var data = JsonSerializer.Deserialize<BlockPositionData>(jsonString);

                if (data == null) return; // Проверка на null

                foreach (var blockData in data.Blocks)
                {
                    // this.Controls[string] может вернуть null
                    Label? lbl = this.Controls[blockData.Name] as Label;
                    if (lbl != null)
                    {
                        lbl.Location = new Point(blockData.X, blockData.Y);
                        lbl.Size = new Size(blockData.Width, blockData.Height);
                        lbl.ForeColor = Color.FromArgb(blockData.TextColorArgb);
                        lbl.BackColor = Color.FromArgb(blockData.BackColorArgb);
                        lbl.BorderStyle = blockData.BorderStyle;

                        // Установка флага Tag (прозрачность)
                        lbl.Tag = (lbl.BackColor.A == 0);

                        ScaleLabelFont(lbl);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка загрузки позиций блоков: {ex.Message}");
                // При ошибке загрузки удаляем поврежденный файл
                if (File.Exists(POSITION_FILE))
                {
                    File.Delete(POSITION_FILE);
                }
            }
        }

        private void Form1_Load(object? sender, EventArgs e) { }

        private void Form1_FormClosing(object? sender, FormClosingEventArgs e)
        {
            // Проверка на null перед использованием оператора .
            udpClient?.Close();
            SaveBlockPositions();
        }

        // --- Обработка UDP данных ---

        private void ReceiveCallback(IAsyncResult ar)
        {
            try
            {
                // ipEndPoint гарантированно не null, так как инициализировано в конструкторе
                byte[] receivedBytes = udpClient.EndReceive(ar, ref ipEndPoint!);
                udpClient.BeginReceive(new AsyncCallback(ReceiveCallback), null);

                if (receivedBytes.Length == Marshal.SizeOf<GridLegendsMotionPacket189>())
                {
                    GridLegendsMotionPacket189 packet = Utils.ByteArrayToStructure<GridLegendsMotionPacket189>(receivedBytes);

                    // Использование BeginInvoke для обновления UI из другого потока
                    if (this.IsHandleCreated)
                    {
                        // BeginInvoke не принимает null для delegate
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
            // Обновление данных в блоках (добавлены проверки на null)
            if (this.Controls["lblSpeed"] is Label lblSpeed)
            {
                lblSpeed.Text = $"Speed: {packet.m_speed * 3.6f:F1} km/h";
                ScaleLabelFont(lblSpeed);
            }

            if (this.Controls["lblRPM_Raw"] is Label lblRPM1)
            {
                lblRPM1.Text = $"RPM (Raw): {packet.m_engineRPM:F0}";
                ScaleLabelFont(lblRPM1);
            }

            if (this.Controls["lblRPM_250x"] is Label lblRPM2)
            {
                lblRPM2.Text = $"RPM (*250): {packet.m_engineRPM * 250f:F0}";
                ScaleLabelFont(lblRPM2);
            }

            if (this.Controls["lblGear"] is Label lblGear)
            {
                string gearText = (packet.m_gear == 0f) ? "N" : (packet.m_gear > 0f) ? ((int)packet.m_gear).ToString() : "R";
                lblGear.Text = $"Gear: {gearText}";
                ScaleLabelFont(lblGear);
            }

            if (this.Controls["lblThrottle"] is Label lblThrottle)
            {
                lblThrottle.Text = $"Throttle: {packet.m_throttle:P0}";
                ScaleLabelFont(lblThrottle);
            }

            if (this.Controls["lblBrake"] is Label lblBrake)
            {
                lblBrake.Text = $"Brake: {packet.m_brake:P0}";
                ScaleLabelFont(lblBrake);
            }

            if (this.Controls["lblGForceLat"] is Label lblGForceLat)
            {
                lblGForceLat.Text = $"G-Lat: {packet.m_gForceLateral:F2}";
                ScaleLabelFont(lblGForceLat);
            }

            if (this.Controls["lblGForceLon"] is Label lblGForceLon)
            {
                lblGForceLon.Text = $"G-Long: {packet.m_gForceLongitudinal:F2}";
                ScaleLabelFont(lblGForceLon);
            }

            if (this.Controls["lblPitch"] is Label lblPitch)
            {
                lblPitch.Text = $"Pitch: {packet.m_pitch:F2}";
                ScaleLabelFont(lblPitch);
            }
        }
    }
}