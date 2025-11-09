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
        private IPEndPoint? _endpoint;

        private Label _statusLabel = null!;
        private Label _telemetryDataLabel = null!;
        private Panel _scrollPanel = null!;

        private Panel _leftTrigger = null!;
        private Panel _rightTrigger = null!;
        private Label _leftLabel = null!;
        private Label _rightLabel = null!;
        private Label _rpmOverLabel = null!; // НОВОЕ: значение под правым курком

        private ContextMenuStrip _contextMenu = null!;
        private ToolStripMenuItem _topMostMenuItem = null!;
        private ToolStripMenuItem _transparentMenuItem = null!;

        private bool _isListening = false;
        private const int ScrollStep = 5;
        private const float RpmCalibrationFactor = 250.0f;

        private readonly Color TransparentColorKey = Color.Magenta;

        public Form1()
        {
            InitializeUI();
            StartListening();
            _scrollPanel.Focus();
        }

        private void InitializeUI()
        {
            this.Text = "Grid Legends — RPM vs MAX RPM (0-100)";
            this.ClientSize = new Size(820, 700);
            this.MinimumSize = new Size(400, 300);
            this.BackColor = Color.FromArgb(30, 30, 30);
            this.FormBorderStyle = FormBorderStyle.Sizable;
            this.TransparencyKey = Color.Empty;
            this.KeyPreview = true;
            this.KeyDown += Form1_KeyDown;

            _contextMenu = new ContextMenuStrip();
            _topMostMenuItem = new ToolStripMenuItem("Поверх всех окон", null, (_, __) => this.TopMost = _topMostMenuItem.Checked) { CheckOnClick = true };
            _transparentMenuItem = new ToolStripMenuItem("Прозрачный HUD", null, ToggleTransparent) { CheckOnClick = true };
            _contextMenu.Items.Add(_topMostMenuItem);
            _contextMenu.Items.Add(_transparentMenuItem);
            _contextMenu.Items.Add(new ToolStripSeparator());
            _contextMenu.Items.Add(new ToolStripMenuItem("Выход", null, (_, __) => this.Close()));
            this.ContextMenuStrip = _contextMenu;

            _statusLabel = new Label
            {
                Location = new Point(10, 10),
                AutoSize = true,
                Text = "Статус: Инициализация...",
                Font = new Font("Segoe UI", 11F, FontStyle.Bold),
                ForeColor = Color.LightGray
            };
            this.Controls.Add(_statusLabel);

            Panel triggerPanel = new Panel
            {
                Location = new Point(10, 45),
                Size = new Size(this.ClientSize.Width - 20, 110),
                BackColor = Color.Transparent
            };
            this.Controls.Add(triggerPanel);

            // === ПРАВЫЙ КУРОК: RPM vs MAX RPM ===
            _rightTrigger = new Panel
            {
                Size = new Size(160, 80),
                Location = new Point(triggerPanel.Width - 180, 5),
                BackColor = Color.DarkGray,
                BorderStyle = BorderStyle.FixedSingle
            };
            _rightLabel = new Label
            {
                Text = "RPM\n0",
                Font = new Font("Consolas", 14F, FontStyle.Bold),
                ForeColor = Color.White,
                TextAlign = ContentAlignment.MiddleCenter,
                Dock = DockStyle.Fill
            };
            _rightTrigger.Controls.Add(_rightLabel);

            // НОВОЕ: значение под курком
            _rpmOverLabel = new Label
            {
                Location = new Point(triggerPanel.Width - 180, 90),
                Size = new Size(160, 20),
                Text = "0",
                Font = new Font("Consolas", 10F, FontStyle.Bold),
                ForeColor = Color.White,
                TextAlign = ContentAlignment.MiddleCenter,
                BackColor = Color.FromArgb(50, 50, 50)
            };
            triggerPanel.Controls.Add(_rightTrigger);
            triggerPanel.Controls.Add(_rpmOverLabel);

            // === ЛЕВЫЙ КУРОК: ABS ===
            _leftTrigger = new Panel
            {
                Size = new Size(160, 80),
                Location = new Point(20, 5),
                BackColor = Color.DarkGray,
                BorderStyle = BorderStyle.FixedSingle
            };
            _leftLabel = new Label
            {
                Text = "ABS\n0",
                Font = new Font("Consolas", 14F, FontStyle.Bold),
                ForeColor = Color.White,
                TextAlign = ContentAlignment.MiddleCenter,
                Dock = DockStyle.Fill
            };
            _leftTrigger.Controls.Add(_leftLabel);
            triggerPanel.Controls.Add(_leftTrigger);

            _scrollPanel = new Panel
            {
                Location = new Point(10, 165),
                Size = new Size(this.ClientSize.Width - 20, this.ClientSize.Height - 175),
                BorderStyle = BorderStyle.FixedSingle,
                AutoScroll = true,
                Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right,
                BackColor = Color.FromArgb(40, 40, 40),
                TabStop = true
            };
            this.Controls.Add(_scrollPanel);

            _telemetryDataLabel = new Label
            {
                Location = new Point(0, 0),
                AutoSize = true,
                Text = "Ожидание данных на порту 20777...",
                Font = new Font("Consolas", 10F),
                ForeColor = Color.LightGreen
            };
            _scrollPanel.Controls.Add(_telemetryDataLabel);
        }

        private void Form1_KeyDown(object? sender, KeyEventArgs e)
        {
            if (!_scrollPanel.AutoScroll) return;
            int dx = 0, dy = 0;
            switch (e.KeyCode)
            {
                case Keys.Up: dy = -ScrollStep; break;
                case Keys.Down: dy = ScrollStep; break;
                case Keys.Left: dx = -ScrollStep; break;
                case Keys.Right: dx = ScrollStep; break;
                default: return;
            }
            e.Handled = true;
            var pos = _scrollPanel.AutoScrollPosition;
            _scrollPanel.AutoScrollPosition = new Point(-pos.X + dx, -pos.Y + dy);
        }

        private void ToggleTransparent(object? sender, EventArgs e)
        {
            bool on = _transparentMenuItem.Checked;
            this.BackColor = on ? TransparentColorKey : Color.FromArgb(30, 30, 30);
            this.TransparencyKey = on ? TransparentColorKey : Color.Empty;
            this.FormBorderStyle = on ? FormBorderStyle.None : FormBorderStyle.Sizable;
            this.TopMost = on || _topMostMenuItem.Checked;
            _scrollPanel.Focus();
        }

        private void StartListening()
        {
            try
            {
                _endpoint = new IPEndPoint(IPAddress.Any, UdpPort);
                _udpClient = new UdpClient(_endpoint);
                _isListening = true;
                _statusLabel.Text = $"Прослушивание порта {UdpPort}...";
                Task.Run(ReceiveTelemetry);
            }
            catch (Exception ex)
            {
                _statusLabel.Text = $"Ошибка: {ex.Message}";
            }
        }

        private async Task ReceiveTelemetry()
        {
            while (_isListening && _udpClient != null)
            {
                try
                {
                    var result = await _udpClient.ReceiveAsync();
                    DecodeAndDisplay(result.Buffer);
                }
                catch (ObjectDisposedException) { break; }
                catch (Exception ex)
                {
                    this.Invoke(() => _statusLabel.Text = $"Ошибка: {ex.Message}");
                }
            }
        }

        // === RPM vs MAX RPM: 0–100 ===
        private float CalculateRPMOverMax(float rpm, float maxRpm)
        {
            if (maxRpm <= 0) return 0f;
            float ratio = rpm / maxRpm; // 1.0 = 100%
            if (ratio <= 1.0f) return 0f;

            // Если RPM > MAX RPM на 50% ? 100
            float excess = ratio - 1.0f; // 0.5 = 50% выше
            return Math.Min(excess / 0.5f * 100f, 100f);
        }

        private Color GetOverColor(float value)
        {
            value = Math.Clamp(value, 0f, 100f);
            int r = (int)(255 * (value / 100f));
            int g = (int)(255 * (1f - value / 100f));
            return Color.FromArgb(r, g, 0);
        }

        private float CalculateABSLockup(float brake, float longG, float speedMps)
        {
            if (brake < 0.6f || speedMps < 5f) return 0f;
            float expected = brake * 1.3f;
            float actual = -longG;
            float lockup = Math.Max(0, expected - actual) / expected;
            return Math.Min(lockup * 100f, 100f);
        }

        private void DecodeAndDisplay(byte[] data)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(() => DecodeAndDisplay(data));
                return;
            }

            if (data.Length != 264)
            {
                _telemetryDataLabel.Text = $"Пакет: {data.Length} байт (ожидалось 264)";
                return;
            }

            try
            {
                GridLegendsMotionPacket189 pkt = Utils.ByteArrayToStructure<GridLegendsMotionPacket189>(data);

                float speedKmh = pkt.m_speed * 3.6f;
                float rpm = pkt.m_engineRPM * RpmCalibrationFactor;
                float maxRpm = pkt.m_maxEngineRPM * RpmCalibrationFactor;
                float rpmPercent = maxRpm > 0 ? rpm / maxRpm * 100f : 0f;

                // === ПРАВЫЙ КУРОК: RPM > MAX RPM ===
                float rpmOverValue = CalculateRPMOverMax(rpm, maxRpm);
                _rightLabel.Text = $"RPM\n{(int)rpmOverValue}";
                _rightTrigger.BackColor = GetOverColor(rpmOverValue);
                _rpmOverLabel.Text = $"{(int)rpmOverValue}";
                _rpmOverLabel.ForeColor = GetOverColor(rpmOverValue);

                // === ЛЕВЫЙ КУРОК: ABS ===
                float absValue = CalculateABSLockup(pkt.m_brake, pkt.m_gForceLongitudinal, pkt.m_speed);
                _leftLabel.Text = $"ABS\n{(int)absValue}";
                _leftTrigger.BackColor = GetOverColor(absValue);

                string gear = pkt.m_gear switch { -1 => "R", 0 => "N", _ => ((int)pkt.m_gear).ToString() };

                string display = $@"
СКОРОСТЬ:          {speedKmh,7:F1} км/ч
ПЕРЕДАЧА:          {gear}
ГАЗ:               {(pkt.m_throttle * 100),3:F0}
ТОРМОЗ:            {(pkt.m_brake * 100),3:F0}

RPM:               {rpm,6:F0}
МАКС. RPM:         {maxRpm,6:F0}
RPM %:             {rpmPercent,6:F1}

RPM > MAX (0-100): {(int)rpmOverValue}
ABS (0-100):       {(int)absValue}
".Trim();

                _telemetryDataLabel.Text = display;
                _statusLabel.Text = "Grid Legends — RPM vs MAX RPM";
                _telemetryDataLabel.PerformLayout();
            }
            catch (Exception ex)
            {
                _telemetryDataLabel.Text = $"ОШИБКА:\n{ex.Message}";
            }
        }
    }
}