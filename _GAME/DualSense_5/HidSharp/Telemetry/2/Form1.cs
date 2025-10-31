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
        private bool _isListening = false;

        // Коэффициент для расчета сцепления. Возможно, потребуется настройка.
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

            _telemetryDataLabel = new Label
            {
                Location = new Point(10, 50),
                AutoSize = false,
                Size = new Size(630, 420),
                Text = $"Данные телеметрии появятся здесь.\n\nПрослушиваем порт {UdpPort}.",
                Font = new Font("Consolas", 10F),
                BorderStyle = BorderStyle.FixedSingle
            };
            this.Controls.Add(_telemetryDataLabel);

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
            // Убран лишний '!' (ИСПРАВЛЕНИЕ CS0131)
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

        /// <summary>
        /// Расчет сцепления (Traction/Grip) в процентах (100% - полное сцепление).
        /// </summary>
        private float CalculateTractionLossPercentage(float speedMps, float rpm, float gear)
        {
            if (gear <= 0 || rpm < 100) return 100.0f;
            float idealWheelSpeedMps = rpm * gear * GearRatioFactor;
            if (idealWheelSpeedMps < 0.1f) return 100.0f;

            // Процент пробуксовки: 0 - нет пробуксовки; 1 - 100% пробуксовки.
            float slipRatio = Math.Abs(idealWheelSpeedMps - speedMps) / idealWheelSpeedMps;

            // Сцепление: 100% - Пробуксовка.
            float grip = 1.0f - Math.Min(slipRatio, 1.0f);

            return grip * 100.0f;
        }

        private void DecodeAndDisplay(byte[] rawBytes)
        {
            if (_telemetryDataLabel.InvokeRequired)
            {
                _telemetryDataLabel.Invoke(new Action<byte[]>(DecodeAndDisplay), rawBytes);
                return;
            }

            // Инициализируем 'display' (ИСПРАВЛЕНИЕ CS0165)
            string display = "Данные не декодированы (ошибка размера).";

            try
            {
                PacketHeader header = Utils.ByteArrayToStructure<PacketHeader>(rawBytes);

                bool is264Packet = rawBytes.Length == 264;
                string packetName = is264Packet ? "Grid Legends Motion/Telemetry" : (header.m_packetId < PacketNames.Length ? PacketNames[header.m_packetId] : "Неизвестный");

                if (is264Packet)
                {
                    GridLegendsMotionPacket189 motionPacket = Utils.ByteArrayToStructure<GridLegendsMotionPacket189>(rawBytes);

                    float speedKmh = motionPacket.m_speed * 3.6f;
                    float gear = motionPacket.m_gear;

                    // Расчет сцепления
                    float tractionPercent = CalculateTractionLossPercentage(
                        motionPacket.m_speed,
                        motionPacket.m_engineRPM,
                        gear
                    );

                    string gearDisplay = (gear == -1) ? "R" : (gear == 0) ? "N" : gear.ToString("F0");

                    // Газ (Throttle) - отображение в процентах
                    string throttleDisplay = (motionPacket.m_throttle >= 0.0f && motionPacket.m_throttle <= 1.0f)
                        ? (motionPacket.m_throttle * 100.0f).ToString("F0") + " %"
                        : motionPacket.m_throttle.ToString("F3");

                    // Тормоз (Brake) - отображение в процентах
                    string brakeDisplay = (motionPacket.m_brake >= 0.0f && motionPacket.m_brake <= 1.0f)
                        ? (motionPacket.m_brake * 100.0f).ToString("F0") + " %"
                        : motionPacket.m_brake.ToString("F3");

                    // Руль (Steer) - отображение в процентах
                    string steerDisplay = (motionPacket.m_steer >= -1.0f && motionPacket.m_steer <= 1.0f)
                        ? (motionPacket.m_steer * 100.0f).ToString("F0") + " %"
                        : motionPacket.m_steer.ToString("F3");

                    display =
                        $"Пакет: **{packetName}** (ID: {header.m_packetId})\n" +
                        $"Размер: {rawBytes.Length} байт\n" +
                        $"Время сессии: {header.m_sessionTime:F3} с\n" +
                        $"---------------------------------------\n" +
                        $"**КЛЮЧЕВЫЕ ДАННЫЕ:**\n" +
                        $"  Скорость: {speedKmh:F2} км/ч\n" +
                        $"  Обороты (RPMs): **{motionPacket.m_engineRPM:F0}** / {motionPacket.m_maxEngineRPM:F0} об/мин (НЕ РАБОТАЮТ)\n" +
                        $"  Передача: {gearDisplay}\n" +
                        $"  Сцепление с трассой (Расчет): **{tractionPercent:F1} %**\n" +
                        $"---------------------------------------\n" +
                        $"**УПРАВЛЕНИЕ:**\n" +
                        $"  Газ (Throttle): **{throttleDisplay}**\n" +
                        $"  Тормоз (Brake): **{brakeDisplay}** (НЕ РАБОТАЕТ)\n" +
                        $"  Руль (Steer): **{steerDisplay}** (0% - центр)\n" +
                        $"---------------------------------------\n" +
                        $"**ДВИЖЕНИЕ/G-FORCES:**\n" +
                        $"  G-Lateral (Бок.): {motionPacket.m_gForceLateral:F2} G\n" +
                        $"  G-Longitudinal (Прод.): {motionPacket.m_gForceLongitudinal:F2} G\n" +
                        $"  Pitch (Тангаж): {motionPacket.m_pitch:F3} рад\n" +
                        $"---------------------------------------\n" +
                        $"**НЕИЗВЕСТНЫЕ / ТЕХНИЧЕСКИЕ:**\n" +
                        $"  Макс. значение: {motionPacket.m_maxRpmOrTorque:F0}\n" +
                        $"  Сцепление/НЗ: {motionPacket.m_clutchOrUnused2:F3}\n";

                    _telemetryDataLabel.Text = display;
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