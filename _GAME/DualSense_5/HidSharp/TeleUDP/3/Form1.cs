using System;
using System.Drawing;
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

        private Label _statusLabel;
        private Label _telemetryDataLabel;
        private Panel _scrollPanel;

        private ContextMenuStrip _contextMenu;
        private ToolStripMenuItem _topMostMenuItem;
        private ToolStripMenuItem _transparentMenuItem;

        private bool _isListening = false;

        // Минимальный шаг прокрутки
        private const int ScrollStep = 5;

        // --- КОНСТАНТЫ КАЛИБРОВКИ ---
        private const float RpmCalibrationFactor = 250.0f;
        private const float GearRatioFactor = 0.005f;
        private readonly Color TransparentColorKey = Color.Magenta;

        private readonly string[] PacketNames = {
            "Motion", "Session", "Lap Data", "Event", "Participants",
            "Car Setups", "Car Telemetry", "Car Status", "Final Classification",
            "Lobby Info", "Car Damage", "Session History"
        };

        public Form1()
        {
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

            _scrollPanel = new Panel
            {
                Location = new Point(10, 50),
                Size = new Size(this.ClientSize.Width - 20, this.ClientSize.Height - 60),
                BorderStyle = BorderStyle.FixedSingle,
                AutoScroll = true,
                Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right,
                BackColor = Color.Transparent,
                ContextMenuStrip = _contextMenu,
                // Важно: TabStop = true, чтобы панель могла принимать фокус
                TabStop = true
            };
            this.Controls.Add(_scrollPanel);

            _telemetryDataLabel = new Label
            {
                Location = new Point(0, 0),
                AutoSize = true,
                Text = $"Данные телеметрии появятся здесь.\n\nПрослушиваем порт {UdpPort}.",
                Font = new Font("Consolas", 10F),
                ForeColor = Color.Black,
                ContextMenuStrip = _contextMenu
            };
            _scrollPanel.Controls.Add(_telemetryDataLabel);

            this.ContextMenuStrip = _contextMenu;

            StartListening();

            // ГАРАНТИЯ ФОКУСА: Устанавливаем фокус на скролл-панель
            _scrollPanel.Focus();
        }

        // --- ОБРАБОТЧИК КЛАВИАТУРЫ ---
        private void Form1_KeyDown(object? sender, KeyEventArgs e)
        {
            // Прокрутка работает только если Panel имеет AutoScroll = true ИЛИ если она имеет фокус.
            // Благодаря KeyPreview, фокус не строго обязателен, но лучше его иметь.
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

                // Обратите внимание: AutoScrollPosition возвращает отрицательные координаты,
                // поэтому мы инвертируем их перед вычислением.
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

            _transparentMenuItem = new ToolStripMenuItem("Прозрачный фон", null, TransparentMenuItem_Click)
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
                _statusLabel.Visible = false;

                // Отключаем AutoScroll и рамку для HUD
                _scrollPanel.AutoScroll = false;
                _scrollPanel.BorderStyle = BorderStyle.None;

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
                _statusLabel.Visible = true;

                // Включаем AutoScroll и рамку
                _scrollPanel.AutoScroll = true;
                _scrollPanel.BorderStyle = BorderStyle.FixedSingle;

                this.BackColor = Color.Gray;
                this.TransparencyKey = Color.Empty;
                this.FormBorderStyle = FormBorderStyle.Sizable;

                this.TopMost = _topMostMenuItem.Checked;

                // ГАРАНТИЯ ФОКУСА: Возвращаем фокус на скролл-панель для прокрутки
                _scrollPanel.Focus();
            }

            _telemetryDataLabel.ForeColor = textColor;
            _statusLabel.ForeColor = textColor;

            foreach (ToolStripItem item in _contextMenu.Items)
            {
                item.ForeColor = Color.Black;
            }
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
            if (_telemetryDataLabel.InvokeRequired)
            {
                _telemetryDataLabel.Invoke(new Action<byte[]>(DecodeAndDisplay), rawBytes);
                return;
            }

            string display = "Данные не декодированы (ошибка размера).";

            try
            {
                PacketHeader header = Utils.ByteArrayToStructure<PacketHeader>(rawBytes);

                bool is264Packet = rawBytes.Length == 264;

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

                    // Минималистичный вывод
                    display =
                        $"Скорость: {speedKmh:F2} км/ч\n" +
                        $"Передача: {gearDisplay}\n" +
                        $"Газ (Throttle): {throttleDisplay}\n" +
                        $"Тормоз (Brake): {brakeDisplay}\n" +
                        $"Руль (Steer): {steerDisplay}\n" +

                        $"\n" +
                        $"Текущие RPM: {actualRPM:F0} об/мин\n" +
                        $"Макс. RPM: {actualMaxRPM:F0} об/мин\n" +

                        $"\n" +
                        $"Пробуксовка (SLIP): {slipPercent:F1} %\n" +
                        $"Сцепление (Traction): {tractionPercent:F1} %\n" +

                        $"\n" +
                        $"Тангаж (Pitch): {motionPacket.m_pitch:F3}\n" +
                        $"Крен (Roll): {motionPacket.m_roll:F3}\n" +
                        $"Рыскание (Yaw): {motionPacket.m_yaw:F3}\n" +
                        $"G-Lateral (Бок.): {motionPacket.m_gForceLateral:F2} G\n" +
                        $"G-Longitudinal (Прод.): {motionPacket.m_gForceLongitudinal:F2} G\n" +

                        $"\n" +
                        $"Сцепление/НЗ (m_clutchOrUnused2): {motionPacket.m_clutchOrUnused2:F3}";

                    _telemetryDataLabel.Text = display;
                    _telemetryDataLabel.PerformLayout();

                    if (_statusLabel.Visible)
                    {
                        string packetName = "Grid Legends Motion/Telemetry";
                        _statusLabel.Text = $"Статус: Получен и декодирован пакет '{packetName}'. Порт: {UdpPort}.";
                    }
                }
                else
                {
                    string packetName = header.m_packetId < PacketNames.Length ? PacketNames[header.m_packetId] : "Неизвестный";
                    display = $"Пакет: {packetName} (ID: {header.m_packetId})\nОжидается размер 264 байта для декодирования.";
                    _telemetryDataLabel.Text = display;
                    _statusLabel.Text = $"Статус: Получен пакет '{packetName}'. Порт: {UdpPort}.";
                }
            }
            catch (Exception ex)
            {
                _telemetryDataLabel.Text = $"Ошибка декодирования: {ex.Message}";
                _statusLabel.Text = $"Ошибка декодирования: {ex.GetType().Name}.";
            }
        }
    }
}