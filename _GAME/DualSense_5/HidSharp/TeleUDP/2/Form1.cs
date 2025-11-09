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
        private Label _telemetryDataLabel; // Эта метка будет внутри панели
        private Panel _scrollPanel; // Новый контейнер для прокрутки
        private bool _isListening = false;

        // --- КОНСТАНТЫ КАЛИБРОВКИ ---
        private const float RpmCalibrationFactor = 250.0f;
        private const float GearRatioFactor = 0.005f;

        private readonly string[] PacketNames = {
            "Motion", "Session", "Lap Data", "Event", "Participants",
            "Car Setups", "Car Telemetry", "Car Status", "Final Classification",
            "Lobby Info", "Car Damage", "Session History"
        };

        public Form1()
        {
            this.Text = "Grid Legends Telemetry Receiver (C# UDP)";
            this.ClientSize = new Size(650, 480);

            _statusLabel = new Label
            {
                Location = new Point(10, 10),
                AutoSize = true,
                Text = "Статус: Инициализация...",
                Font = new Font("Segoe UI", 12F, FontStyle.Bold)
            };
            this.Controls.Add(_statusLabel);

            // --- 1. Создаем Panel для прокрутки ---
            _scrollPanel = new Panel
            {
                Location = new Point(10, 50),
                Size = new Size(630, 420),
                BorderStyle = BorderStyle.FixedSingle,
                AutoScroll = true // Прокрутка включена на контейнере Panel
            };
            this.Controls.Add(_scrollPanel);

            // --- 2. Создаем Label внутри Panel ---
            _telemetryDataLabel = new Label
            {
                Location = new Point(0, 0),
                AutoSize = true, // Позволяем метке автоматически изменять размер, чтобы вместить текст
                Text = $"Данные телеметрии появятся здесь.\n\nПрослушиваем порт {UdpPort}.",
                Font = new Font("Consolas", 10F)
            };
            _scrollPanel.Controls.Add(_telemetryDataLabel);

            StartListening();
        }

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
                return 100.0f; // 100% пробуксовка при старте
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
                string packetName = is264Packet ? "Grid Legends Motion/Telemetry" : (header.m_packetId < PacketNames.Length ? PacketNames[header.m_packetId] : "Неизвестный");

                if (is264Packet)
                {
                    GridLegendsMotionPacket189 motionPacket = Utils.ByteArrayToStructure<GridLegendsMotionPacket189>(rawBytes);

                    float speedMps = motionPacket.m_speed;
                    float speedKmh = speedMps * 3.6f;
                    float gear = motionPacket.m_gear;

                    // --- Калибровка RPM ---
                    float actualRPM = motionPacket.m_engineRPM * RpmCalibrationFactor;
                    float actualMaxRPM = motionPacket.m_maxEngineRPM * RpmCalibrationFactor;

                    // --- Расчет пробуксовки (Wheel Slip) ---
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

                    display =
                        $"Пакет: **{packetName}** (ID: {header.m_packetId})\n" +
                        $"Размер: {rawBytes.Length} байт\n" +
                        $"---------------------------------------\n" +
                        $"**КЛЮЧЕВЫЕ ДАННЫЕ (РАБОТАЮТ):**\n" +
                        $"  Скорость: **{speedKmh:F2}** км/ч\n" +
                        $"  Передача: **{gearDisplay}**\n" +
                        $"  Газ (Throttle): **{throttleDisplay}**\n" +
                        $"  Тормоз (Brake): **{brakeDisplay}**\n" +
                        $"  Руль (Steer): **{steerDisplay}**\n" +
                        $"---------------------------------------\n" +
                        $"**ОБОРОТЫ (RPM):**\n" +
                        $"  Текущие RPM: **{actualRPM:F0}** об/мин\n" +
                        $"  Макс. RPM: **{actualMaxRPM:F0}** об/мин\n" +
                        $"---------------------------------------\n" +
                        $"**ПАРАМЕТРЫ СТАРТА / СЦЕПЛЕНИЕ:**\n" +
                        $"  **Пробуксовка (SLIP):** **{slipPercent:F1} %** (Цель старта: 0-5%)\n" +
                        $"  **Сцепление с трассой (Traction):** **{tractionPercent:F1} %**\n" +
                        $"---------------------------------------\n" +
                        $"**КАЛИБРОВКА СЦЕПЛЕНИЯ:**\n" +
                        $"  **Текущий GearRatioFactor (GRF):** {GearRatioFactor}\n" +
                        $"  **ИНСТРУКЦИЯ:** На 1-й передаче, RPM ~1000, постепенно \n" +
                        $"  изменяйте GRF (в Form1.cs) до тех пор, пока\n" +
                        $"  Пробуксовка (SLIP) не станет 0% при стоящем авто.\n" +
                        $"  Если SLIP > 0, нужно УВЕЛИЧИТЬ GRF.\n" +
                        $"---------------------------------------\n" +
                        $"**НЕИЗВЕСТНЫЕ ПОЛЯ / G-FORCES:**\n" +
                        $"  Сцепление/НЗ (m_clutchOrUnused2): {motionPacket.m_clutchOrUnused2:F3}\n" +
                        $"  G-Lateral (Бок.): {motionPacket.m_gForceLateral:F2} G\n" +
                        $"  G-Longitudinal (Прод.): {motionPacket.m_gForceLongitudinal:F2} G";

                    _telemetryDataLabel.Text = display;
                    // Обязательно вызываем PerformLayout для обновления размеров AutoSize
                    _telemetryDataLabel.PerformLayout();
                    _statusLabel.Text = $"Статус: Получен и декодирован пакет '{packetName}'. Порт: {UdpPort}.";
                }
                else
                {
                    display = $"Пакет: {packetName} (ID: {header.m_packetId})\nРазмер: {rawBytes.Length} байт\nОжидается размер **264 байта** для декодирования.";
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