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
                        _latestPacket = result.Buffer; // ? Просто перезаписываем
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
                packet = (byte[])_latestPacket.Clone();
                // НЕ сбрасываем _latestPacket!
            }

            if (packet.Length != 264) return;

            if (InvokeRequired)
            {
                BeginInvoke(new Action(() => UpdateUI(packet)));
                return;
            }

            UpdateUI(packet);
        }

        private void UpdateUI(byte[] packet)
        {
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

                _statusLabel.Text = "Grid Legends LIVE | ID: 150 | 264 байт";
            }
            catch { }
        }

        protected override void OnFormClosed(FormClosedEventArgs e)
        {
            _uiTimer?.Stop();
            _udpClient?.Close();
            base.OnFormClosed(e);
        }
    }
}

//Form1.Designer.cs

using TeleUDPmini;
namespace TeleUDPmini
{
partial class Form1
{
private System.ComponentModel.IContainer components = null;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        private void InitializeComponent()
        {
            this._statusLabel = new System.Windows.Forms.Label();
            this._scrollPanel = new System.Windows.Forms.Panel();
            this._telemetryDataLabel = new System.Windows.Forms.Label();
            this.SuspendLayout();

            // _statusLabel
            this._statusLabel.AutoSize = true;
            this._statusLabel.Font = new System.Drawing.Font("Segoe UI", 11F, System.Drawing.FontStyle.Bold);
            this._statusLabel.ForeColor = System.Drawing.Color.Lime;
            this._statusLabel.Location = new System.Drawing.Point(10, 10);
            this._statusLabel.Name = "_statusLabel";
            this._statusLabel.Text = "Запуск...";

            // _scrollPanel
            this._scrollPanel.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom)
            | System.Windows.Forms.AnchorStyles.Left)
            | System.Windows.Forms.AnchorStyles.Right)));
            this._scrollPanel.AutoScroll = true;
            this._scrollPanel.BackColor = System.Drawing.Color.FromArgb(40, 40, 40);
            this._scrollPanel.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this._scrollPanel.Location = new System.Drawing.Point(10, 50);
            this._scrollPanel.Name = "_scrollPanel";
            this._scrollPanel.Size = new System.Drawing.Size(620, 390);

            // _telemetryDataLabel
            this._telemetryDataLabel.AutoSize = true;
            this._telemetryDataLabel.Font = new System.Drawing.Font("Consolas", 11F);
            this._telemetryDataLabel.ForeColor = System.Drawing.Color.Cyan;
            this._telemetryDataLabel.Location = new System.Drawing.Point(0, 0);
            this._telemetryDataLabel.Name = "_telemetryDataLabel";
            this._telemetryDataLabel.Text = "Ожидание данных...";
            this._scrollPanel.Controls.Add(this._telemetryDataLabel);

            // Form1
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.FromArgb(30, 30, 30);
            this.ClientSize = new System.Drawing.Size(650, 480);
            this.Controls.Add(this._scrollPanel);
            this.Controls.Add(this._statusLabel);
            this.ForeColor = System.Drawing.Color.White;
            this.Name = "Form1";
            this.Text = "Grid Legends Telemetry [LIVE]";
            this.ResumeLayout(false);
            this.PerformLayout();
        }

        private System.Windows.Forms.Label _statusLabel;
        private System.Windows.Forms.Panel _scrollPanel;
        private System.Windows.Forms.Label _telemetryDataLabel;
    }
}

//TelemetryStructs.cs
using System;
using System.Runtime.InteropServices;

namespace TeleUDPmini
{
// *** ВАЖНО: Pack = 1 обязателен для работы с UDP-пакетами ***

    // ----------------------------------------------------------------
    // 1. ЗАГОЛОВОК ПАКЕТА (PacketHeader) - 40 байт
    // ----------------------------------------------------------------
    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct PacketHeader
    {
        public ushort m_packetFormat;       // 2 байта
        public byte m_gameMajorVersion;     // 1 байт
        public byte m_gameMinorVersion;     // 1 байт
        public byte m_packetVersion;        // 1 байт
        public byte m_packetId;             // 1 байт
        public ulong m_sessionUID;          // 8 байт
        public float m_sessionTime;          // 4 байта
        public uint m_frameIdentifier;      // 4 байта
        public byte m_playerCarIndex;       // 1 байт
        public byte m_secondaryPlayerCarIndex; // 1 байт

        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 16)]
        public byte[] m_headerPadding; // 16 байт
    }

    // ----------------------------------------------------------------
    // 2. ПАКЕТ СИМУЛЯТОРА GRID LEGENDS (РАЗМЕР 264 байта)
    // Восстановлены изначальные места полей. Только m_steer переименован.
    // ----------------------------------------------------------------
    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct GridLegendsMotionPacket189
    {
        public PacketHeader m_header; // 40 байт

        // --- Смещение 1: 36 БАЙТ ---
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 36)]
        public byte[] m_dataPadding1; // 36 байт

        // 1. Углы (12 байт) - ЭТИ ПОЛЯ МОГУТ БЫТЬ УГЛАМИ СКОЛЬЖЕНИЯ/ДРИФТА
        public float m_pitch;               // Тангаж
        public float m_roll;                // Крен
        public float m_yaw;                 // Рыскание (Yaw Rate)

        // 2. G-Forces (12 байт)
        public float m_gForceLateral;
        public float m_gForceLongitudinal;
        public float m_gForceVertical;

        // 3. Телеметрия (56 байт)
        public float m_speed;
        public float m_engineRPM;
        public float m_maxEngineRPM;

        public float m_brake;
        public float m_throttle;
        public float m_steer;
        public float m_clutchOrUnused2;     // ТЕСТ: Неизвестное/Сцепление
        public float m_unusedBrake;
        public float m_gear;

        // Оставшееся заполнение.
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 128)]
        public byte[] m_paddingFinal;
    }

    // ----------------------------------------------------------------
    // 3. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (Utils)
    // ----------------------------------------------------------------
    public static class Utils
    {
        public static T ByteArrayToStructure<T>(byte[] bytes) where T : struct
        {
            T structure = new T();
            int size = Marshal.SizeOf(structure);

            if (bytes.Length < size)
                throw new Exception($"Недостаточный размер байтов для структуры {typeof(T).Name}. Ожидается {size} байт, получено {bytes.Length}.");

            IntPtr ptr = Marshal.AllocHGlobal(size);

            try
            {
                Marshal.Copy(bytes, 0, ptr, size);
                structure = Marshal.PtrToStructure<T>(ptr);
                return structure;
            }
            finally
            {
                Marshal.FreeHGlobal(ptr);
            }
        }
    }
}