// file: _GAME/DualSense_5/HidSharp/Telemetry/3/Form1.cs
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace TeleUDP
{
    public partial class Form1 : Form
    {
        private const int UdpPort = 20778;

        private UdpClient? _udpClient;
        private IPEndPoint? _endpoint;

        // Поля, инициализируемые в конструкторе или SetupContextMenu
        private Label _statusLabel = null!;
        private CustomPanel _scrollPanel = null!;
        private ContextMenuStrip _contextMenu = null!;
        private ToolStripMenuItem _topMostMenuItem = null!;
        private ToolStripMenuItem _transparentMenuItem = null!;

        private bool _isListening = false;

        // Минимальный шаг прокрутки
        private const int ScrollStep = 5;

        // --- КОНСТАНТЫ КАЛИБРОВКИ ---
        private const float RpmCalibrationFactor = 250.0f;
        private const float GearRatioFactor = 0.005f;
        private readonly Color TransparentColorKey = Color.Magenta;

        // --- МАССИВ PacketNames ДОБАВЛЕН В КЛАСС Form1 ---
        private readonly string[] PacketNames = {
            "Motion", "Session", "Lap Data", "Event", "Participants",
            "Car Setups", "Car Telemetry", "Car Status", "Final Classification",
            "Lobby Info", "Car Damage", "Session History"
        };
        // -----------------------------------------------------------------

        // --- НОВЫЕ ПОЛЯ ДЛЯ ПЕРЕМЕЩАЕМЫХ БЛОКОВ ---
        private List<TelemetryBlock> _telemetryBlocks = new List<TelemetryBlock>();
        private TelemetryBlock? _draggedBlock = null;
        private Point _dragStartPoint = Point.Empty;
        private int _padding = 5;

        // --- WIN32 API ДЛЯ ПРОЗРАЧНОСТИ/КЛИКАБЕЛЬНОСТИ ---
        [DllImport("user32.dll")]
        private static extern int GetWindowLong(IntPtr hWnd, int nIndex);

        [DllImport("user32.dll")]
        private static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);

        private const int GWL_EXSTYLE = -20;
        private const int WS_EX_TRANSPARENT = 0x00000020;
        // -------------------------------------------------


        // --- КЛАСС ДЛЯ УСТРАНЕНИЯ ОШИБКИ SetStyle ---
        private class CustomPanel : Panel
        {
            public CustomPanel()
            {
                this.SetStyle(ControlStyles.OptimizedDoubleBuffer |
                              ControlStyles.AllPaintingInWmPaint |
                              ControlStyles.UserPaint, true);
            }
        }
        // -----------------------------------------------------------------

        private class TelemetryBlock : Panel
        {
            public string Title { get; private set; }
            public Label ContentLabel { get; private set; } = null!;

            // Font для контента будет использоваться, тайтл больше не нужен
            private readonly Font _contentFont = new Font("Consolas", 10F);

            public TelemetryBlock(string title, Color foreColor)
            {
                Title = title;
                BackColor = Color.FromArgb(180, 180, 180);
                BorderStyle = BorderStyle.FixedSingle;
                Margin = new Padding(5);
                Padding = new Padding(5);
                AutoSize = false;

                this.SetStyle(ControlStyles.OptimizedDoubleBuffer |
                              ControlStyles.AllPaintingInWmPaint |
                              ControlStyles.UserPaint, true);

                // --- Заголовок удален ---
                /*
                Label titleLabel = new Label
                {
                    Text = title,
                    Dock = DockStyle.Top,
                    Font = _titleFont,
                    ForeColor = Color.Black,
                    AutoSize = true,
                    TextAlign = ContentAlignment.MiddleCenter,

                };
                */
                // --- ---

                ContentLabel = new Label
                {
                    Text = "Ожидание данных...",
                    Dock = DockStyle.Fill,
                    Font = _contentFont,
                    ForeColor = foreColor,
                    AutoSize = false,
                    TextAlign = ContentAlignment.TopLeft,
                    // Уменьшен Padding, так как нет заголовка
                    Padding = new Padding(0, 0, 0, 0),
                };

                Controls.Add(ContentLabel);
                // Controls.Add(titleLabel); // Удалено

                // Уменьшен размер блока, так как заголовок удален
                Size = new Size(300, 100);
            }

            public void UpdateContent(string content, Color foreColor)
            {
                ContentLabel.Text = content;
                ContentLabel.ForeColor = foreColor;
                using (Graphics g = ContentLabel.CreateGraphics())
                {
                    SizeF size = g.MeasureString(ContentLabel.Text, ContentLabel.Font, ContentLabel.Width);
                    // Уменьшена высота (было +45, стало +15)
                    Height = (int)size.Height + 15;
                }
            }

            public void SetTransparentMode(bool isTransparent, Color key)
            {
                if (isTransparent)
                {
                    BackColor = key;
                    BorderStyle = BorderStyle.None;
                    foreach (Control c in Controls)
                    {
                        c.BackColor = key;
                    }
                }
                else
                {
                    BackColor = Color.FromArgb(180, 180, 180);
                    BorderStyle = BorderStyle.FixedSingle;
                    foreach (Control c in Controls)
                    {
                        c.BackColor = Color.Transparent;
                    }
                }
            }
        }
        // -----------------------------------------------------------

        public Form1()
        {
            this.DoubleBuffered = true;

            this.Text = "Grid Legends Telemetry Receiver (C# UDP)";
            this.ClientSize = new Size(650, 480);
            this.MinimumSize = new Size(1, 1);

            this.BackColor = Color.Gray;
            this.FormBorderStyle = FormBorderStyle.Sizable;
            this.TransparencyKey = Color.Empty;

            this.KeyPreview = true;
            this.KeyDown += Form1_KeyDown;

            SetupContextMenu();

            _statusLabel = new Label
            {
                Location = new Point(10, 10),
                AutoSize = true,
                Text = "Статус: Инициализация...",
                Font = new Font("Segoe UI", 12F, FontStyle.Bold),
                ForeColor = Color.Black,
                ContextMenuStrip = _contextMenu
            };
            this.Controls.Add(_statusLabel);

            _scrollPanel = new CustomPanel
            {
                Location = new Point(10, 50),
                Size = new Size(this.ClientSize.Width - 20, this.ClientSize.Height - 60),
                BorderStyle = BorderStyle.FixedSingle,
                AutoScroll = true,
                Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right,
                BackColor = Color.Transparent,
                ContextMenuStrip = _contextMenu,
                TabStop = true,
                AllowDrop = true
            };
            this.Controls.Add(_scrollPanel);

            SetupTelemetryBlocks();

            this.ContextMenuStrip = _contextMenu;

            StartListening();

            _scrollPanel.Focus();
        }

        private void SetupTelemetryBlocks()
        {
            // Названия блоков по-прежнему используются для идентификации в списке _telemetryBlocks
            _telemetryBlocks.Add(new TelemetryBlock("Скорость и Передача", Color.Black));
            _telemetryBlocks.Add(new TelemetryBlock("Обороты и Мощность", Color.Black));
            _telemetryBlocks.Add(new TelemetryBlock("Управление (Газ/Тормоз/Руль)", Color.Black));
            _telemetryBlocks.Add(new TelemetryBlock("Углы (Pitch/Roll/Yaw)", Color.Black));
            _telemetryBlocks.Add(new TelemetryBlock("G-Forces", Color.Black));
            _telemetryBlocks.Add(new TelemetryBlock("Пробуксовка", Color.Black));


            int currentY = _padding;
            int blockWidth = _scrollPanel.ClientSize.Width - _padding * 2;

            foreach (var block in _telemetryBlocks)
            {
                block.Width = blockWidth;
                block.Location = new Point(_padding, currentY);
                block.ContextMenuStrip = _contextMenu;

                block.MouseDown += Block_MouseDown;
                block.MouseMove += Block_MouseMove;
                block.MouseUp += Block_MouseUp;

                foreach (Control c in block.Controls)
                {
                    c.MouseDown += Block_MouseDown;
                    c.MouseMove += Block_MouseMove;
                    c.MouseUp += Block_MouseUp;
                }

                _scrollPanel.Controls.Add(block);
                currentY += block.Height + _padding;
            }

            _scrollPanel.Resize += (sender, e) => ArrangeBlocks();
        }

        // --- ЛОГИКА WIN32 API ---
        private void SetClickThrough(bool enabled)
        {
            IntPtr handle = this.Handle;
            int extendedStyle = GetWindowLong(handle, GWL_EXSTYLE);

            if (enabled)
            {
                SetWindowLong(handle, GWL_EXSTYLE, extendedStyle | WS_EX_TRANSPARENT);
            }
            else
            {
                SetWindowLong(handle, GWL_EXSTYLE, extendedStyle & ~WS_EX_TRANSPARENT);
            }
        }

        // --- ЛОГИКА ПЕРЕМЕЩЕНИЯ (Drag-and-Drop) ---
        private void Block_MouseDown(object? sender, MouseEventArgs e)
        {
            if (e.Button == MouseButtons.Left && _transparentMenuItem.Checked == false)
            {
                Control? control = sender as Control;
                _draggedBlock = control?.Parent as TelemetryBlock;

                if (_draggedBlock != null)
                {
                    _dragStartPoint = e.Location;
                    _draggedBlock.BringToFront();
                }
            }
        }

        private void Block_MouseMove(object? sender, MouseEventArgs e)
        {
            if (_draggedBlock != null && e.Button == MouseButtons.Left)
            {
                int newY = _draggedBlock.Top + (e.Y - _dragStartPoint.Y);
                _draggedBlock.Location = new Point(_draggedBlock.Left, newY);
                CheckForBlockSwap(_draggedBlock);

                ArrangeBlocks(animate: true);
            }
        }

        private void Block_MouseUp(object? sender, MouseEventArgs e)
        {
            if (_draggedBlock != null)
            {
                _draggedBlock = null;
                // Окончательная фиксация положения (animate=false)
                ArrangeBlocks();
            }
        }

        private void CheckForBlockSwap(TelemetryBlock draggedBlock)
        {
            int draggedIndex = _telemetryBlocks.IndexOf(draggedBlock);

            // 1. Проверка на перемещение НА САМУЮ ВЕРХНЮЮ ПОЗИЦИЮ
            if (_telemetryBlocks.Count > 0)
            {
                TelemetryBlock firstBlock = _telemetryBlocks[0];

                if (draggedBlock != firstBlock && draggedBlock.Top < firstBlock.Top + firstBlock.Height / 2)
                {
                    if (draggedIndex > 0)
                    {
                        _telemetryBlocks.RemoveAt(draggedIndex);
                        _telemetryBlocks.Insert(0, draggedBlock);
                        draggedIndex = 0;
                        ArrangeBlocks(animate: true);
                        return;
                    }
                }
            }
            // ---------------------------------------------------------

            // 2. Стандартная логика перестановки по центру
            int draggedCenterY = draggedBlock.Top + draggedBlock.Height / 2;

            for (int i = 0; i < _telemetryBlocks.Count; i++)
            {
                if (i == draggedIndex) continue;

                TelemetryBlock targetBlock = _telemetryBlocks[i];
                int targetCenterY = targetBlock.Top + targetBlock.Height / 2;

                if (draggedBlock.Bounds.IntersectsWith(targetBlock.Bounds))
                {
                    if (draggedCenterY < targetCenterY && draggedIndex < i)
                    {
                        _telemetryBlocks.RemoveAt(draggedIndex);
                        _telemetryBlocks.Insert(i, draggedBlock);
                        ArrangeBlocks(animate: true);
                        return;
                    }
                    else if (draggedCenterY > targetCenterY && draggedIndex > i)
                    {
                        _telemetryBlocks.RemoveAt(draggedIndex);
                        _telemetryBlocks.Insert(i, draggedBlock);
                        ArrangeBlocks(animate: true);
                        return;
                    }
                }
            }
        }

        private void ArrangeBlocks(bool animate = false)
        {
            if (_scrollPanel.InvokeRequired)
            {
                _scrollPanel.Invoke(new Action(() => ArrangeBlocks(animate)));
                return;
            }

            int currentY = _padding;
            int blockWidth = _scrollPanel.ClientSize.Width - _padding * 2 - (int)(_scrollPanel.VerticalScroll.Visible ? SystemInformation.VerticalScrollBarWidth : 0);

            foreach (var block in _telemetryBlocks)
            {
                block.Width = blockWidth;

                if (animate && block == _draggedBlock)
                {
                    // Игнорируем положение перетаскиваемого блока, но используем его высоту для расчета
                    // положения следующего блока.
                }
                else
                {
                    // Все остальные блоки (или этот, если он не перетаскивается)
                    // выравниваются по новому упорядоченному списку.
                    block.Location = new Point(_padding, currentY);
                }

                currentY += block.Height + _padding;
            }
        }


        // --- ОБРАБОТЧИК КЛАВИАТУРЫ ---
        private void Form1_KeyDown(object? sender, KeyEventArgs e)
        {
            if (!_scrollPanel.AutoScroll) return;

            int deltaX = 0;
            int deltaY = 0;

            switch (e.KeyCode)
            {
                case Keys.Up:
                    deltaY = -ScrollStep;
                    e.Handled = true;
                    break;
                case Keys.Down:
                    deltaY = ScrollStep;
                    e.Handled = true;
                    break;
                case Keys.Left:
                    deltaX = -ScrollStep;
                    e.Handled = true;
                    break;
                case Keys.Right:
                    deltaX = ScrollStep;
                    e.Handled = true;
                    break;
            }

            if (deltaX != 0 || deltaY != 0)
            {
                Point scrollPos = _scrollPanel.AutoScrollPosition;

                int newX = -scrollPos.X + deltaX;
                int newY = -scrollPos.Y + deltaY;

                _scrollPanel.AutoScrollPosition = new Point(newX, newY);
            }
        }

        // --- МЕТОДЫ МЕНЮ ПКМ ---
        private void SetupContextMenu()
        {
            _contextMenu = new ContextMenuStrip();

            _topMostMenuItem = new ToolStripMenuItem("Поверх всех окон (TopMost)", null, TopMostMenuItem_Click)
            {
                CheckOnClick = true
            };
            _contextMenu.Items.Add(_topMostMenuItem);

            _transparentMenuItem = new ToolStripMenuItem("Прозрачный фон (HUD)", null, TransparentMenuItem_Click)
            {
                CheckOnClick = true
            };
            _contextMenu.Items.Add(_transparentMenuItem);

            _contextMenu.Items.Add(new ToolStripSeparator());
            _contextMenu.Items.Add(new ToolStripMenuItem("Выход", null, (sender, e) => this.Close()));
        }

        private void TopMostMenuItem_Click(object? sender, EventArgs e)
        {
            this.TopMost = _topMostMenuItem.Checked;
        }

        private void TransparentMenuItem_Click(object? sender, EventArgs e)
        {
            bool isTransparent = _transparentMenuItem.Checked;
            Color textColor = isTransparent ? Color.White : Color.Black;

            if (isTransparent)
            {
                SetClickThrough(false);

                _statusLabel.Visible = false;

                _scrollPanel.AutoScroll = false;
                _scrollPanel.BorderStyle = BorderStyle.None;
                _scrollPanel.BackColor = TransparentColorKey;

                this.BackColor = TransparentColorKey;
                this.TransparencyKey = TransparentColorKey;
                this.FormBorderStyle = FormBorderStyle.None;

                if (!_topMostMenuItem.Checked)
                {
                    this.TopMost = true;
                }
            }
            else
            {
                SetClickThrough(true);

                _statusLabel.Visible = true;

                _scrollPanel.AutoScroll = true;
                _scrollPanel.BorderStyle = BorderStyle.FixedSingle;
                _scrollPanel.BackColor = Color.Transparent;

                this.BackColor = Color.Gray;
                this.TransparencyKey = Color.Empty;
                this.FormBorderStyle = FormBorderStyle.Sizable;

                this.TopMost = _topMostMenuItem.Checked;

                _scrollPanel.Focus();
            }

            _statusLabel.ForeColor = textColor;
            foreach (var block in _telemetryBlocks)
            {
                block.UpdateContent(block.ContentLabel.Text, textColor);
                block.SetTransparentMode(isTransparent, TransparentColorKey);
            }

            ArrangeBlocks();
        }

        // --- МЕТОДЫ UDP И РАСЧЕТОВ ---

        private void StartListening()
        {
            try
            {
                _endpoint = new IPEndPoint(IPAddress.Any, UdpPort);
                _udpClient = new UdpClient(_endpoint);
                _isListening = true;
                _statusLabel.Text = $"Статус: Прослушивание порта {UdpPort}...";

                Task.Run(() => ReceiveTelemetry());
            }
            catch (SocketException ex)
            {
                _statusLabel.Text = $"Ошибка сокета: {ex.Message}. Порт {UdpPort} занят или заблокирован.";
                _isListening = false;
            }
        }

        private async Task ReceiveTelemetry()
        {
            UdpClient client = _udpClient!;

            while (_isListening)
            {
                try
                {
                    var result = await client.ReceiveAsync();
                    byte[] rawBytes = result.Buffer;
                    DecodeAndDisplay(rawBytes);
                }
                catch (ObjectDisposedException) { break; }
                catch (Exception ex)
                {
                    Invoke(new Action(() => _statusLabel.Text = $"Ошибка приема: {ex.Message}"));
                }
            }
        }

        private float CalculateWheelSlipPercentage(float speedMps, float rpm, float gear)
        {
            if (gear <= 0 || rpm < 100) return 0.0f;

            float idealWheelSpeedMps = rpm * gear * GearRatioFactor;

            if (speedMps < 0.1f && idealWheelSpeedMps > 0.1f)
            {
                return 100.0f;
            }

            if (idealWheelSpeedMps < 0.1f) return 0.0f;

            float slipRatio = Math.Max(0, idealWheelSpeedMps - speedMps) / idealWheelSpeedMps;

            return Math.Min(slipRatio * 100.0f, 100.0f);
        }

        private void DecodeAndDisplay(byte[] rawBytes)
        {
            if (_statusLabel.InvokeRequired)
            {
                _statusLabel.Invoke(new Action<byte[]>(DecodeAndDisplay), rawBytes);
                return;
            }

            try
            {
                PacketHeader header = Utils.ByteArrayToStructure<PacketHeader>(rawBytes);
                bool is264Packet = rawBytes.Length == 264;
                Color textColor = _transparentMenuItem.Checked ? Color.White : Color.Black;

                if (is264Packet)
                {
                    GridLegendsMotionPacket189 motionPacket = Utils.ByteArrayToStructure<GridLegendsMotionPacket189>(rawBytes);

                    float speedMps = motionPacket.m_speed;
                    float speedKmh = speedMps * 3.6f;
                    float gear = motionPacket.m_gear;

                    float actualRPM = motionPacket.m_engineRPM * RpmCalibrationFactor;
                    float actualMaxRPM = motionPacket.m_maxEngineRPM * RpmCalibrationFactor;

                    float slipPercent = CalculateWheelSlipPercentage(
                        speedMps,
                        actualRPM,
                        gear
                    );
                    float tractionPercent = 100.0f - slipPercent;

                    string gearDisplay = (gear == -1) ? "R" : (gear == 0) ? "N" : gear.ToString("F0");
                    string throttleDisplay = (motionPacket.m_throttle * 100.0f).ToString("F0") + " %";
                    string steerDisplay = (motionPacket.m_steer * 100.0f).ToString("F0") + " %";
                    string brakeDisplay = (motionPacket.m_brake * 100.0f).ToString("F0") + " %";

                    // --- Обновление отдельных блоков ---
                    _telemetryBlocks.First(b => b.Title == "Скорость и Передача").UpdateContent(
                        $"Скорость: {speedKmh:F2} км/ч\n" +
                        $"Передача: {gearDisplay}",
                        textColor
                    );

                    _telemetryBlocks.First(b => b.Title == "Обороты и Мощность").UpdateContent(
                        $"Текущие RPM: {actualRPM:F0} об/мин\n" +
                        $"Макс. RPM: {actualMaxRPM:F0} об/мин",
                        textColor
                    );

                    _telemetryBlocks.First(b => b.Title == "Управление (Газ/Тормоз/Руль)").UpdateContent(
                        $"Газ (Throttle): {throttleDisplay}\n" +
                        $"Тормоз (Brake): {brakeDisplay}\n" +
                        $"Руль (Steer): {steerDisplay}\n" +
                        $"Сцепление/НЗ: {motionPacket.m_clutchOrUnused2:F3}",
                        textColor
                    );

                    _telemetryBlocks.First(b => b.Title == "Углы (Pitch/Roll/Yaw)").UpdateContent(
                        $"Тангаж (Pitch): {motionPacket.m_pitch:F3}\n" +
                        $"Крен (Roll): {motionPacket.m_roll:F3}\n" +
                        $"Рыскание (Yaw): {motionPacket.m_yaw:F3}",
                        textColor
                    );

                    _telemetryBlocks.First(b => b.Title == "G-Forces").UpdateContent(
                        $"G-Lateral (Бок.): {motionPacket.m_gForceLateral:F2} G\n" +
                        $"G-Longitudinal (Прод.): {motionPacket.m_gForceLongitudinal:F2} G\n" +
                        $"G-Vertical (Вер.): {motionPacket.m_gForceVertical:F2} G",
                        textColor
                    );

                    _telemetryBlocks.First(b => b.Title == "Пробуксовка").UpdateContent(
                        $"Пробуксовка (SLIP): {slipPercent:F1} %\n" +
                        $"Сцепление (Traction): {tractionPercent:F1} %",
                        textColor
                    );

                    ArrangeBlocks();

                    if (_statusLabel.Visible)
                    {
                        string packetName = "Grid Legends Motion/Telemetry";
                        _statusLabel.Text = $"Статус: Получен и декодирован пакет '{packetName}'. Порт: {UdpPort}.";
                    }
                }
                else
                {
                    string packetName = header.m_packetId < PacketNames.Length ? PacketNames[header.m_packetId] : "Неизвестный";
                    string display = $"Пакет: {packetName} (ID: {header.m_packetId})\nОжидается размер 264 байта для декодирования.";

                    if (_statusLabel.Visible)
                    {
                        _statusLabel.Text = $"Статус: Получен пакет '{packetName}'. Порт: {UdpPort}.";
                    }

                    if (!_transparentMenuItem.Checked)
                    {
                        _telemetryBlocks.First().UpdateContent(display, textColor);
                        ArrangeBlocks();
                    }
                }
            }
            catch (Exception ex)
            {
                _statusLabel.Text = $"Ошибка декодирования: {ex.GetType().Name}. Сообщение: {ex.Message}";
            }
        }
    }
}