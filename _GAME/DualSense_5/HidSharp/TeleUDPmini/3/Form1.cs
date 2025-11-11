using System;
using System.Drawing;
using System.Net;
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
        private System.Windows.Forms.Timer _watchdogTimer;

        private byte[]? _latestPacket;
        private readonly object _lock = new object();
        private const float RpmFactor = 250f;

        private int _packetCount = 0;
        private DateTime _lastPacketTime = DateTime.MinValue;

        public Form1()
        {
            InitializeComponent(); // ? Только вызов, НЕ ПИШИ РЕАЛИЗАЦИЮ!
            StartListening();

            _uiTimer = new System.Windows.Forms.Timer { Interval = 33 };
            _uiTimer.Tick += (s, e) => UpdateUI();
            _uiTimer.Start();

            _watchdogTimer = new System.Windows.Forms.Timer { Interval = 3000 };
            _watchdogTimer.Tick += Watchdog_Tick;
            _watchdogTimer.Start();
        }

        private void StartListening()
        {
            try
            {
                _udpClient?.Dispose();
                _udpClient = new UdpClient(new IPEndPoint(IPAddress.Any, UdpPort));
                _packetCount = 0;
                _lastPacketTime = DateTime.MinValue;

                Task.Run(ReceiveLoop);
                _statusLabel.Text = $"LIVE | Порт {UdpPort}";
                _statusLabel.ForeColor = Color.Lime;
            }
            catch (Exception ex)
            {
                _statusLabel.Text = $"ОШИБКА: {ex.Message}";
                _statusLabel.ForeColor = Color.Red;
            }
        }

        private async Task ReceiveLoop()
        {
            while (_udpClient != null)
            {
                try
                {
                    var result = await _udpClient.ReceiveAsync();
                    var packet = result.Buffer;

                    lock (_lock)
                    {
                        _latestPacket = packet;
                        _packetCount++;
                        _lastPacketTime = DateTime.Now;
                    }

                    // ЛОГ ID ПАКЕТА В КОНСОЛЬ (удали потом)
                    Console.WriteLine($"[UDP] Пакет #{_packetCount} | Размер: {packet.Length} | ID: {BitConverter.ToUInt16(packet, 8)}");
                }
                catch (ObjectDisposedException) { break; }
                catch { }
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

    // ПРИНИМАЕМ ЛЮБОЙ ПАКЕТ 264 БАЙТА — НЕ ФИЛЬТРУЕМ ПО ID
    if (packet.Length != 264)
    {
        _statusLabel.Text = $"ПАКЕТ: {packet.Length} байт (игнор)";
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
            $"G-Long: {motion.m_gForceLongitudinal:F2}G\n" +
            $"\n" +
            $"Пакетов: {_packetCount} | ID: {motion.m_header.m_packetId}";

        _statusLabel.Text = $"LIVE | ID: {motion.m_header.m_packetId} | {_packetCount} пакетов";
        _statusLabel.ForeColor = Color.Lime;
    }
    catch (Exception ex)
    {
        // Читаем ID вручную, если структура не совпадает
        ushort packetId = packet.Length >= 10 ? BitConverter.ToUInt16(packet, 8) : (ushort)0;
        _statusLabel.Text = $"ОШИБКА ID:{packetId}: {ex.Message}";
        _statusLabel.ForeColor = Color.Red;
    }
}

        private void Watchdog_Tick(object? sender, EventArgs e)
        {
            if (_lastPacketTime == DateTime.MinValue) return;

            if ((DateTime.Now - _lastPacketTime).TotalSeconds > 5)
            {
                _statusLabel.Text = "ПАКЕТЫ ПРОПАЛИ ? ПЕРЕЗАПУСК UDP...";
                _statusLabel.ForeColor = Color.Orange;
                StartListening();
            }
        }

        protected override void OnFormClosed(FormClosedEventArgs e)
        {
            _uiTimer.Stop();
            _watchdogTimer.Stop();
            _udpClient?.Dispose();
            base.OnFormClosed(e);
        }
    }
}