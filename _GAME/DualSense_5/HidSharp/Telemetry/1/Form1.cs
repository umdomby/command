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
        private const int UdpPort = 20777; // Порт по умолчанию для Codemasters
        private UdpClient _udpClient;
        private IPEndPoint _endpoint;
        private Label _statusLabel;
        private Label _telemetryDataLabel;
        private bool _isListening = false;

        private readonly string[] PacketNames = {
            "Motion", "Session", "Lap Data", "Event", "Participants",
            "Car Setups", "Car Telemetry", "Car Status", "Final Classification",
            "Lobby Info", "Car Damage", "Session History"
        };

        public Form1()
        {
            // Инициализация UI
            // InitializeComponent();

            this.Text = "Grid Legends Telemetry Receiver (C# UDP)";
            this.ClientSize = new Size(650, 400);

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
                Size = new Size(630, 340),
                Text = "Данные телеметрии появятся здесь.",
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
            while (_isListening)
            {
                try
                {
                    var result = await _udpClient.ReceiveAsync();
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

        private void DecodeAndDisplay(byte[] rawBytes)
        {
            if (_telemetryDataLabel.InvokeRequired)
            {
                _telemetryDataLabel.Invoke(new Action<byte[]>(DecodeAndDisplay), rawBytes);
                return;
            }

            try
            {
                PacketHeader header = Utils.ByteArrayToStructure<PacketHeader>(rawBytes);

                bool is264Packet = rawBytes.Length == 264;

                string packetName = "Неизвестный";
                if (is264Packet)
                {
                    packetName = "Grid Legends Motion/Telemetry";
                }
                else if (header.m_packetId < PacketNames.Length)
                {
                    packetName = PacketNames[header.m_packetId];
                }

                float speed = 0;
                float gear = 0;
                float rpm = 0;
                float throttle = 0;
                float gLat = 0, gLong = 0;

                if (is264Packet)
                {
                    GridLegendsMotionPacket189 motionPacket = Utils.ByteArrayToStructure<GridLegendsMotionPacket189>(rawBytes);

                    speed = motionPacket.m_speed * 3.6f; // м/с в км/ч
                    rpm = motionPacket.m_engineRPM;
                    gear = motionPacket.m_gear;
                    throttle = motionPacket.m_throttle;
                    gLat = motionPacket.m_gForceLateral;
                    gLong = motionPacket.m_gForceLongitudinal;

                    // Форматирование для отображения
                    string gearDisplay = (gear == -1) ? "R" : (gear == 0) ? "N" : gear.ToString("F0");

                    // Улучшенное форматирование Газа: если Газ в диапазоне 0.0-1.0, показываем в процентах.
                    string throttleDisplay = (throttle >= 0.0f && throttle <= 1.0f) ? throttle.ToString("P0") : throttle.ToString("F3");

                    string display =
                        $"Пакет: **{packetName}** (ID: {header.m_packetId})\n" +
                        $"Размер: {rawBytes.Length} байт\n" +
                        $"Время сессии: {header.m_sessionTime:F3} с\n" +
                        $"---------------------------------------\n" +
                        $"**КЛЮЧЕВАЯ ТЕЛЕМЕТРИЯ (СМЕЩЕНИЕ 36 БАЙТ, ПЕРЕСТАНОВКА):**\n" +
                        $"  Скорость: {speed:F2} км/ч\n" +
                        $"  Обороты: {rpm:F0} об/мин\n" +
                        $"  Передача: {gearDisplay}\n" +
                        $"  Газ: {throttleDisplay}\n" +
                        $"---------------------------------------\n" +
                        $"**ДАННЫЕ ДВИЖЕНИЯ (УГЛЫ/G-Forces):**\n" +
                        $"  G-Lateral: {gLat:F2} G\n" +
                        $"  G-Longitudinal: {gLong:F2} G\n" +
                        $"  Pitch (тангаж): {motionPacket.m_pitch:F2} рад";

                    _telemetryDataLabel.Text = display;
                    _statusLabel.Text = $"Статус: Получен и декодирован пакет '{packetName}' ({rawBytes.Length} байт).";
                }
                else
                {
                    string display =
                        $"Пакет: {packetName} (ID: {header.m_packetId})\n" +
                        $"Размер: {rawBytes.Length} байт\n" +
                        $"Время сессии: {header.m_sessionTime:F3} с\n" +
                        $"Пакет '{packetName}' получен, но не декодирован. \n" +
                        $"Ожидается размер **264 байта** для декодирования движения/скорости.";

                    _telemetryDataLabel.Text = display;
                    _statusLabel.Text = $"Статус: Получен пакет '{packetName}' ({rawBytes.Length} байт).";
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