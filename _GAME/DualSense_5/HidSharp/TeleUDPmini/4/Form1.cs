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

        // ?????? ?????? ???? ??????
        private GridLegendsMotionPacket189? _myCarData = null;
        private readonly object _lock = new object();
        private const float RpmFactor = 250f;

        private DateTime _lastUpdate = DateTime.MinValue;
        private int _goodPackets = 0;
        private byte _lastPacketId = 255;
        private byte _lastPlayerIndex = 255;

        public Form1()
        {
            InitializeComponent();
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
                Task.Run(ReceiveLoop); // ?? ????? await ? ??? ??????? ??????
                _statusLabel.Text = $"LIVE | ???? {UdpPort} | ????????...";
            }
            catch (Exception ex)
            {
                _statusLabel.Text = $"??????: {ex.Message}";
            }
        }

        private async Task ReceiveLoop()
        {
            while (_udpClient != null)
            {
                try
                {
                    var result = await _udpClient.ReceiveAsync();
                    ProcessPacket(result.Buffer); // ????????? ? ?????????
                }
                catch { break; }
            }
        }

        private void ProcessPacket(byte[] packet)
        {
            if (packet.Length < 40) return;

            try
            {
                var header = Utils.ByteArrayToStructure<PacketHeader>(packet);

                // ????? ????? Motion-????? ? ????? ???????
                if (packet.Length == 264)
                {
                    var motion = Utils.ByteArrayToStructure<GridLegendsMotionPacket189>(packet);

                    lock (_lock)
                    {
                        _myCarData = motion;
                        _lastUpdate = DateTime.Now;
                        _goodPackets++;
                        _lastPacketId = header.m_packetId;
                        _lastPlayerIndex = header.m_playerCarIndex;
                    }
                }
            }
            catch { }
        }

        private void UpdateUI()
        {
            GridLegendsMotionPacket189? data;
            lock (_lock)
            {
                data = _myCarData;
            }

            if (data == null || (DateTime.Now - _lastUpdate).TotalSeconds > 1)
            {
                _statusLabel.Text = $"????? ??????... | ???????: {_goodPackets}";
                _telemetryDataLabel.Text = "???????? ??????????...\n(?????? ??????: 0)";
                return;
            }

            ShowTelemetry(data.Value);
        }

        private void ShowTelemetry(GridLegendsMotionPacket189 motion)
        {
            float speedKmh = motion.m_speed * 3.6f;
            float rpm = motion.m_engineRPM * RpmFactor;
            float maxRpm = motion.m_maxEngineRPM * RpmFactor;
            string gear = motion.m_gear == -1 ? "R" : motion.m_gear == 0 ? "N" : ((int)motion.m_gear).ToString();

            _telemetryDataLabel.Text =
                $"????????: {speedKmh:F1} ??/?\n" +
                $"????????: {gear}\n" +
                $"???: {(motion.m_throttle * 100):F0}%\n" +
                $"??????: {(motion.m_brake * 100):F0}%\n" +
                $"????: {(motion.m_steer * 100):F0}%\n" +
                $"\n" +
                $"RPM: {rpm:F0}\n" +
                $"Max: {maxRpm:F0}\n" +
                $"\n" +
                $"Pitch: {motion.m_pitch:F3}\n" +
                $"Roll: {motion.m_roll:F3}\n" +
                $"Yaw: {motion.m_yaw:F3}\n" +
                $"G-Lat: {motion.m_gForceLateral:F2}G\n" +
                $"G-Long: {motion.m_gForceLongitudinal:F2}G";

            _statusLabel.Text = $"LIVE | ID: {_lastPacketId} | ??????: {_lastPlayerIndex} | ???????: {_goodPackets}";
        }

        protected override void OnFormClosed(FormClosedEventArgs e)
        {
            _uiTimer?.Stop();
            _udpClient?.Close();
            base.OnFormClosed(e);
        }
    }
}