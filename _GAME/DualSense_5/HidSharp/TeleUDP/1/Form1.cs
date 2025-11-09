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
        /// Расчет пробуксовки в процентах (0% - нет пробуксовки, >0% - пробуксовка).
        /// </summary>
        private float CalculateWheelSlipPercentage(float speedMps, float rpm, float gear)
        {
            // Условие для нейтрали или очень низких RPM
            if (gear <= 0 || rpm < 100) return 0.0f;

            // Вычисляем идеальную скорость колес (м/с)
            float idealWheelSpeedMps = rpm * gear * GearRatioFactor;

            // Если машина стоит (speedMps близка к 0), но колеса крутятся, это 100% пробуксовка.
            if (speedMps < 0.1f && idealWheelSpeedMps > 0.1f) return 100.0f;

            // Если скорости близки к 0, считаем 0 пробуксовкой, чтобы избежать деления на ноль.
            if (idealWheelSpeedMps < 0.1f) return 0.0f;

            // Процент пробуксовки: (Колесо - Авто) / Колесо.
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

                    float speedKmh = motionPacket.m_speed * 3.6f;
                    float gear = motionPacket.m_gear;

                    // --- Расчет пробуксовки (Wheel Slip) ---
                    // В этом тесте m_maxEngineRPM используется как m_engineRPM (тестовое поле)
                    float slipPercent = CalculateWheelSlipPercentage(
                        motionPacket.m_speed,
                        motionPacket.m_maxEngineRPM, // Используем m_maxEngineRPM как тестовые RPM
                        gear
                    );

                    string gearDisplay = (gear == -1) ? "R" : (gear == 0) ? "N" : gear.ToString("F0");

                    // Форматирование значений
                    string throttleDisplay = (motionPacket.m_throttle * 100.0f).ToString("F0") + " %";
                    string steerDisplay = (motionPacket.m_steer * 100.0f).ToString("F0") + " %";

                    // Тормоз: берем все три тестовых поля
                    string brakeCurrentDisplay = (motionPacket.m_brakeCurrent * 100.0f).ToString("F0") + " %";
                    string brakeTest1Display = motionPacket.m_brakeTest1.ToString("F3");
                    string brakeTest2Display = motionPacket.m_brakeTest2.ToString("F3");

                    display =
                        $"Пакет: **{packetName}** (ID: {header.m_packetId})\n" +
                        $"Размер: {rawBytes.Length} байт\n" +
                        $"---------------------------------------\n" +
                        $"**КЛЮЧЕВЫЕ ДАННЫЕ (РАБОТАЮТ):**\n" +
                        $"  Скорость: **{speedKmh:F2}** км/ч\n" +
                        $"  Передача: **{gearDisplay}**\n" +
                        $"  Газ (Throttle): **{throttleDisplay}**\n" +
                        $"  Руль (Steer): **{steerDisplay}**\n" +
                        $"---------------------------------------\n" +
                        $"**ПРОБУКСОВКА (РАСЧЕТ):**\n" +
                        $"  Пробуксовка колес (Slip): **{slipPercent:F1} %**\n" +
                        $"---------------------------------------\n" +
                        $"**ТЕСТ 1: ОБОРОТЫ (RPMs):**\n" +
                        $"  Текущие RPM (m_maxEngineRPM): **{motionPacket.m_maxEngineRPM:F0}**\n" +
                        $"  Макс. RPM (m_engineRPM): {motionPacket.m_engineRPM:F0}\n" +
                        $"---------------------------------------\n" +
                        $"**ТЕСТ 2: ТОРМОЗ (BRAKE):**\n" +
                        $"  Тормоз (m_brakeCurrent): {brakeCurrentDisplay} (Ориг. место, Не работает)\n" +
                        $"  Тормоз (m_brakeTest1): {brakeTest1Display} (Ранее m_maxRpmOrTorque)\n" +
                        $"  Тормоз (m_brakeTest2): {brakeTest2Display} (Ранее m_clutchOrUnused2 / Сцепление)\n" +
                        $"---------------------------------------\n" +
                        $"**G-FORCES:**\n" +
                        $"  G-Lateral (Бок.): {motionPacket.m_gForceLateral:F2} G\n" +
                        $"  G-Longitudinal (Прод.): {motionPacket.m_gForceLongitudinal:F2} G";

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