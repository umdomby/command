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
        // --- Константы и переменные ---
        private const int LISTEN_PORT = 20778; // Порт для UDP
        private const string POSITION_FILE = "BlockPositions.json";
        private UdpClient udpClient;
        private IPEndPoint ipEndPoint;

        // Переменные для Drag-and-Drop и Resizing
        private Label draggedOrResizedLabel = null;
        private Point dragStartPosition;
        private bool isDragging = false;
        private bool isResizing = false;
        private const int ResizeHandleSize = 10;

        // --- Инициализация и настройка ---

        public Form1()
        {
            InitializeComponent();
            this.Load += Form1_Load;
            this.FormClosing += Form1_FormClosing;

            // Инициализация UDP клиента
            try
            {
                ipEndPoint = new IPEndPoint(IPAddress.Any, LISTEN_PORT);
                udpClient = new UdpClient(ipEndPoint);
                udpClient.BeginReceive(new AsyncCallback(ReceiveCallback), null);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Ошибка инициализации UDP: {ex.Message}");
                // Закрытие приложения в случае критической ошибки
                this.Close();
            }

            // Создание и настройка блоков (Label)
            InitializeDataBlocks();
            LoadBlockPositions();
        }

        private void InitializeDataBlocks()
        {
            // Блоки для отображения данных
            CreateDataLabel("lblSpeed", "Speed: 0.0", 10, 10, 150, 40);
            CreateDataLabel("lblRPM", "RPM: 0", 170, 10, 150, 40);
            CreateDataLabel("lblGear", "Gear: 0", 330, 10, 100, 40);
            CreateDataLabel("lblThrottle", "Throttle: 0.0", 10, 60, 150, 40);
            CreateDataLabel("lblBrake", "Brake: 0.0", 170, 60, 150, 40);
            CreateDataLabel("lblGForceLat", "G-Lat: 0.0", 10, 110, 150, 40);
            CreateDataLabel("lblGForceLon", "G-Long: 0.0", 170, 110, 150, 40);
            CreateDataLabel("lblPitch", "Pitch: 0.0", 330, 60, 150, 40);

            // Создание контекстного меню
            ContextMenuStrip contextMenu = new ContextMenuStrip();
            ToolStripMenuItem changeColorItem = new ToolStripMenuItem("Изменить цвет текста");
            changeColorItem.Click += ChangeTextColor_Click;
            ToolStripMenuItem resetPositionsItem = new ToolStripMenuItem("Сбросить расположение блоков");
            resetPositionsItem.Click += ResetBlockPositions_Click;

            contextMenu.Items.Add(changeColorItem);
            contextMenu.Items.Add(new ToolStripSeparator());
            contextMenu.Items.Add(resetPositionsItem);

            this.ContextMenuStrip = contextMenu; // Привязка к форме для сброса
        }

        private void CreateDataLabel(string name, string text, int x, int y, int width, int height)
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
                AutoSize = false // Обязательно для ручного изменения размера
            };

            // Начальный размер шрифта, будет масштабироваться
            lbl.Font = new Font("Arial", 12, FontStyle.Bold);
            ScaleLabelFont(lbl); // Первичное масштабирование

            // Привязка обработчиков мыши для Drag & Resize
            lbl.MouseDown += Label_MouseDown;
            lbl.MouseMove += Label_MouseMove;
            lbl.MouseUp += Label_MouseUp;
            lbl.Paint += Label_Paint; // Используем Paint для масштабирования шрифта

            // Контекстное меню для каждого блока
            ContextMenuStrip contextMenu = new ContextMenuStrip();
            ToolStripMenuItem changeColorItem = new ToolStripMenuItem("Изменить цвет текста");
            changeColorItem.Click += ChangeTextColor_Click;
            contextMenu.Items.Add(changeColorItem);
            lbl.ContextMenuStrip = contextMenu;

            this.Controls.Add(lbl);
        }

        // --- Логика Drag, Resize и масштабирования шрифта ---

        private void Label_MouseDown(object sender, MouseEventArgs e)
        {
            if (e.Button == MouseButtons.Left)
            {
                draggedOrResizedLabel = sender as Label;

                // Проверка на область изменения размера (правый нижний угол)
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

                // Перенос блока на передний план при взаимодействии
                draggedOrResizedLabel.BringToFront();
            }
        }

        private void Label_MouseMove(object sender, MouseEventArgs e)
        {
            if (draggedOrResizedLabel == null) return;

            if (isDragging)
            {
                // Перемещение
                draggedOrResizedLabel.Left += e.X - dragStartPosition.X;
                draggedOrResizedLabel.Top += e.Y - dragStartPosition.Y;
            }
            else if (isResizing)
            {
                // Изменение размера
                int newWidth = draggedOrResizedLabel.Width + (e.X - dragStartPosition.X);
                int newHeight = draggedOrResizedLabel.Height + (e.Y - dragStartPosition.Y);

                // Ограничение минимального размера
                if (newWidth > 50 && newHeight > 30)
                {
                    draggedOrResizedLabel.Width = newWidth;
                    draggedOrResizedLabel.Height = newHeight;
                    dragStartPosition = e.Location; // Обновление точки для непрерывного изменения
                }

                // Перерисовка для масштабирования шрифта
                draggedOrResizedLabel.Invalidate();
            }
            else
            {
                // Изменение курсора при наведении на область изменения размера
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

        private void Label_MouseUp(object sender, MouseEventArgs e)
        {
            isDragging = false;
            isResizing = false;
            draggedOrResizedLabel = null;
            this.Cursor = Cursors.Default;

            // Сохранение позиций после завершения Drag/Resize
            SaveBlockPositions();
        }

        private void Label_Paint(object sender, PaintEventArgs e)
        {
            Label lbl = sender as Label;
            if (lbl != null)
            {
                ScaleLabelFont(lbl);
            }
        }

        private void ScaleLabelFont(Label lbl)
        {
            // Логика масштабирования шрифта
            if (lbl.Text.Length == 0) return;

            float minRatio = 1000f;

            using (Graphics g = lbl.CreateGraphics())
            {
                // Измерение размера строки с текущим шрифтом (или базовым)
                // Для предотвращения утечки ресурсов, используем Font из lbl,
                // если он уже установлен, или создаем базовый.
                Font baseFont = new Font("Arial", 100);
                SizeF stringSize = g.MeasureString(lbl.Text, baseFont);

                // Расчет коэффициента масштабирования по ширине и высоте
                float wRatio = lbl.Width / stringSize.Width;
                float hRatio = lbl.Height / stringSize.Height;
                minRatio = Math.Min(wRatio, hRatio);
            }

            // Новый размер шрифта
            float newFontSize = 100 * minRatio * 0.9f; // 0.9 для отступа

            // Ограничение минимального размера шрифта
            if (newFontSize < 5) newFontSize = 5;

            // Изменение шрифта, если размер изменился
            if (lbl.Font.Size != newFontSize)
            {
                // ВАЖНО: При каждой смене шрифта создается новый объект Font,
                // старый должен быть удален для предотвращения утечек GDI ресурсов.
                Font oldFont = lbl.Font;
                lbl.Font = new Font(oldFont.FontFamily, newFontSize, oldFont.Style);
                oldFont.Dispose();
            }
        }

        // --- Обработка контекстного меню ---

        private void ChangeTextColor_Click(object sender, EventArgs e)
        {
            // Определение Label, на котором было вызвано меню
            ToolStripMenuItem menuItem = sender as ToolStripMenuItem;
            ContextMenuStrip contextMenu = menuItem.Owner as ContextMenuStrip;
            Label targetLabel = contextMenu.SourceControl as Label;

            if (targetLabel != null)
            {
                using (ColorDialog colorDialog = new ColorDialog())
                {
                    colorDialog.Color = targetLabel.ForeColor;
                    if (colorDialog.ShowDialog() == DialogResult.OK)
                    {
                        targetLabel.ForeColor = colorDialog.Color;
                        SaveBlockPositions(); // Сохранение после изменения цвета
                    }
                }
            }
        }

        private void ResetBlockPositions_Click(object sender, EventArgs e)
        {
            // Удаление файла для сброса
            if (File.Exists(POSITION_FILE))
            {
                File.Delete(POSITION_FILE);
            }

            // Пересоздание блоков в исходных позициях
            foreach (Control control in this.Controls)
            {
                if (control is Label)
                {
                    control.Dispose();
                }
            }
            InitializeDataBlocks();
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
                        TextColorArgb = lbl.ForeColor.ToArgb()
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
                MessageBox.Show($"Ошибка сохранения позиций блоков: {ex.Message}");
            }
        }

        private void LoadBlockPositions()
        {
            if (!File.Exists(POSITION_FILE)) return;

            try
            {
                string jsonString = File.ReadAllText(POSITION_FILE);
                var data = JsonSerializer.Deserialize<BlockPositionData>(jsonString);

                foreach (var blockData in data.Blocks)
                {
                    Label lbl = this.Controls[blockData.Name] as Label;
                    if (lbl != null)
                    {
                        lbl.Location = new Point(blockData.X, blockData.Y);
                        lbl.Size = new Size(blockData.Width, blockData.Height);
                        lbl.ForeColor = Color.FromArgb(blockData.TextColorArgb);
                        ScaleLabelFont(lbl); // Масштабирование шрифта после изменения размера
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Ошибка загрузки позиций блоков: {ex.Message}");
                // При ошибке загрузки можно удалить поврежденный файл
                if (File.Exists(POSITION_FILE))
                {
                    File.Delete(POSITION_FILE);
                }
            }
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            // Здесь можно выполнить дополнительные действия при загрузке формы
        }

        private void Form1_FormClosing(object sender, FormClosingEventArgs e)
        {
            // Закрытие UDP сокета при закрытии формы
            udpClient?.Close();

            // Сохранение позиций при закрытии
            SaveBlockPositions();
        }

        // --- Обработка UDP данных ---

        private void ReceiveCallback(IAsyncResult ar)
        {
            try
            {
                byte[] receivedBytes = udpClient.EndReceive(ar, ref ipEndPoint);

                // Запуск следующего приема
                udpClient.BeginReceive(new AsyncCallback(ReceiveCallback), null);

                if (receivedBytes.Length == Marshal.SizeOf<GridLegendsMotionPacket189>())
                {
                    // Десериализация
                    GridLegendsMotionPacket189 packet = Utils.ByteArrayToStructure<GridLegendsMotionPacket189>(receivedBytes);

                    // Обновление UI должно происходить в потоке UI
                    if (this.IsHandleCreated)
                    {
                        this.BeginInvoke(new Action(() => UpdateUI(packet)));
                    }
                }
                else
                {
                    // Можно добавить логирование для пакетов неверного размера
                }
            }
            catch (ObjectDisposedException)
            {
                // Игнорирование, если клиент был закрыт
            }
            catch (Exception ex)
            {
                // Логирование или обработка ошибки
                Console.WriteLine($"Ошибка приема UDP: {ex.Message}");
            }
        }

        private void UpdateUI(GridLegendsMotionPacket189 packet)
        {
            // Обновление данных в блоках
            if (this.Controls["lblSpeed"] is Label lblSpeed)
            {
                // Приводим m_speed к км/ч или миль/ч, в зависимости от контекста игры
                lblSpeed.Text = $"Speed: {packet.m_speed * 3.6f:F1} km/h";
            }

            if (this.Controls["lblRPM"] is Label lblRPM)
            {
                lblRPM.Text = $"RPM: {packet.m_engineRPM:F0}";
            }

            if (this.Controls["lblGear"] is Label lblGear)
            {
                // Преобразование float m_gear в удобочитаемый вид
                string gearText = (packet.m_gear == 0f) ? "N" : (packet.m_gear > 0f) ? ((int)packet.m_gear).ToString() : "R";
                lblGear.Text = $"Gear: {gearText}";
            }

            if (this.Controls["lblThrottle"] is Label lblThrottle)
            {
                lblThrottle.Text = $"Throttle: {packet.m_throttle:P0}";
            }

            if (this.Controls["lblBrake"] is Label lblBrake)
            {
                lblBrake.Text = $"Brake: {packet.m_brake:P0}";
            }

            if (this.Controls["lblGForceLat"] is Label lblGForceLat)
            {
                lblGForceLat.Text = $"G-Lat: {packet.m_gForceLateral:F2}";
            }

            if (this.Controls["lblGForceLon"] is Label lblGForceLon)
            {
                lblGForceLon.Text = $"G-Long: {packet.m_gForceLongitudinal:F2}";
            }

            if (this.Controls["lblPitch"] is Label lblPitch)
            {
                lblPitch.Text = $"Pitch: {packet.m_pitch:F2}";
            }
        }
    }
}