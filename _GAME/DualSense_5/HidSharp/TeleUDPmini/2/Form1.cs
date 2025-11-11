using System;
using System.Drawing;
using System.Net.Sockets;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace TeleUDPmini
{
    public partial class Form1 : Form
    {
        private const int UdpPort = 20777;
        private UdpClient? _udpClient;
        private System.Windows.Forms.Timer _uiTimer;

        private byte[]? _latestPacket = null;
        private readonly object _lock = new object();
        private const float RpmFactor = 250f;

        public Form1()
        {
            InitializeComponent(); // ? Автоматически из Designer.cs
            StartListening();

            _uiTimer = new System.Windows.Forms.Timer { Interval = 33 };
            _uiTimer.Tick += (s, e) => UpdateUI();
            _uiTimer.Start();
        }

        private void StartListening()
        {
            try
            {
                _udpClient = new UdpClient(UdpPort);
                Task.Run(ReceiveLoop);
                _statusLabel.Text = $"LIVE | Порт {UdpPort}";
            }
            catch (Exception ex)
            {
                _statusLabel.Text = $"Ошибка: {ex.Message}";
            }
        }

        private async Task ReceiveLoop()
        {
            while (_udpClient != null)
            {
                try
                {
                    var result = await _udpClient.ReceiveAsync();
                    lock (_lock)
                    {
                        _latestPacket = result.Buffer;
                    }
                }
                catch { break; }
            }
        }

        private void UpdateUI()
        {
            byte[]? packet;
            lock (_lock)
            {
                if (_latestPacket == null) return;
                packet = _latestPacket;
                _latestPacket = null;
            }

            if (packet.Length != 264)
            {
                _statusLabel.Text = $"ПАКЕТ: {packet.Length} байт";
                return;
            }

            try
            {
                var motion = Utils.ByteArrayToStructure<GridLegendsMotionPacket189>(packet);
                float speedKmh = motion.m_speed * 3.6f;
                float rpm = motion.m_engineRPM * RpmFactor;
                float maxRpm = motion.m_maxEngineRPM * RpmFactor;
                string gear = motion.m_gear == -1 ? "R" : motion.m_gear == 0 ? "N" : ((int)motion.m_gear).ToString();

                _telemetryDataLabel.Text =
                    $"Скорость: {speedKmh:F1} км/ч\n" +
                    $"Передача: {gear}\n" +
                    $"Газ: {(motion.m_throttle * 100):F0}%\n" +
                    $"Тормоз: {(motion.m_brake * 100):F0}%\n" +
                    $"Руль: {(motion.m_steer * 100):F0}%\n" +
                    $"\n" +
                    $"RPM: {rpm:F0}\n" +
                    $"Max: {maxRpm:F0}\n" +
                    $"\n" +
                    $"Pitch: {motion.m_pitch:F3}\n" +
                    $"Roll: {motion.m_roll:F3}\n" +
                    $"Yaw: {motion.m_yaw:F3}\n" +
                    $"G-Lat: {motion.m_gForceLateral:F2}G\n" +
                    $"G-Long: {motion.m_gForceLongitudinal:F2}G";

                _statusLabel.Text = $"LIVE | {packet.Length} байт | ID: {motion.m_header.m_packetId}";
            }
            catch (Exception ex)
            {
                _statusLabel.Text = $"ОШИБКА: {ex.Message}";
                _telemetryDataLabel.Text = $"ПАКЕТ: {packet.Length} байт\n{ex}";
            }
        }

        protected override void OnFormClosed(FormClosedEventArgs e)
        {
            _uiTimer?.Stop();
            _udpClient?.Close();
            base.OnFormClosed(e);
        }
    }
}