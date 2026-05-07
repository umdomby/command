using System;
using System.IO;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Drawing;

namespace FATEK_ENCODER
{
    public partial class Form1 : Form
    {
        private TcpClient? _tcpClient;
        private NetworkStream? _stream;
        private readonly string _settingsFile = "settings.json";
        private int _lastValue = -999999;
        private byte _stationNumber = 1;
        private int _registerAddress = 4096;
        private CancellationTokenSource? _cts;

        // Состояния для отображения на кнопках
        private bool _m0ForceState = false; // Для 1-2
        private bool _m0SetState = false;   // Для 3-4
        private bool _y0ForceState = false; // Для 1-2
        private bool _y0SetState = false;   // Для 3-4

        public Form1()
        {
            InitializeComponent();
            LoadSettings();
            Log("Программа запущена. Готова к работе.");
        }

        // --- КНОПКА 1: M0 (Команды 1-2, СКОБКИ) ---
        private async void btnM0_12_Click(object sender, EventArgs e)
        {
            _m0ForceState = !_m0ForceState;
            string action = _m0ForceState ? "1" : "2";
            await SendCommand("M", 0, action, btnM0_12, "M0 Force (1-2)");
        }

        // --- КНОПКА 2: M0 (Команды 3-4, КРАСНЫЙ) ---
        private async void btnM0_34_Click(object sender, EventArgs e)
        {
            _m0SetState = !_m0SetState;
            string action = _m0SetState ? "3" : "4";
            await SendCommand("M", 0, action, btnM0_34, "M0 Set/Res (3-4)");
        }

        // --- КНОПКА 3: Y0 (Команды 1-2, СКОБКИ) ---
        private async void btnY0_12_Click(object sender, EventArgs e)
        {
            _y0ForceState = !_y0ForceState;
            string action = _y0ForceState ? "1" : "2";
            await SendCommand("Y", 0, action, btnY0_12, "Y0 Force (1-2)");
        }

        // --- КНОПКА 4: Y0 (Команды 3-4, КРАСНЫЙ) ---
        private async void btnY0_34_Click(object sender, EventArgs e)
        {
            _y0SetState = !_y0SetState;
            string action = _y0SetState ? "3" : "4";
            await SendCommand("Y", 0, action, btnY0_34, "Y0 Set/Res (3-4)");
        }

        // Универсальный метод отправки команды
        private async Task SendCommand(string type, int addr, string action, Button btn, string label)
        {
            if (_stream == null || !_tcpClient!.Connected) { Log("❌ Нет связи!"); return; }

            string station = _stationNumber.ToString("X2");
            string addrStr = type + addr.ToString("D4");
            string data = station + "42" + action + addrStr;

            int sum = 0x02;
            foreach (byte b in Encoding.ASCII.GetBytes(data)) sum += b;
            sum += 0x03;
            byte[] req = Encoding.ASCII.GetBytes("\x02" + data + ((byte)sum).ToString("X2") + "\x03");

            try
            {
                await _stream.WriteAsync(req, 0, req.Length);
                byte[] buffer = new byte[256];
                int recv = await _stream.ReadAsync(buffer, 0, buffer.Length);

                if (recv >= 6 && buffer[5] == 0x30)
                {
                    bool isOn = (action == "1" || action == "3");
                    btn.BackColor = isOn ? Color.OrangeRed : Color.LightGray;
                    Log($"✅ {label}: {(isOn ? "ВКЛ" : "ВЫКЛ")} (Код {action})");
                }
            }
            catch (Exception ex) { Log($"❌ Ошибка: {ex.Message}"); }
        }

        // --- Служебные методы ---
        private async void btnConnect_Click(object sender, EventArgs e)
        {
            if (_tcpClient?.Connected == true) { Disconnect(); return; }
            try
            {
                _tcpClient = new TcpClient { NoDelay = true };
                await _tcpClient.ConnectAsync(txtIP.Text.Trim(), 500);
                _stream = _tcpClient.GetStream();
                _cts = new CancellationTokenSource();
                _ = Task.Run(() => HighSpeedReadLoop(_cts.Token));
                btnConnect.Text = "Отключиться";
                btnConnect.BackColor = Color.LightGreen;
                Log("✅ Подключено к PLC");
                SaveSettings();
            }
            catch (Exception ex) { Log($"❌ Ошибка: {ex.Message}"); }
        }

        private async Task HighSpeedReadLoop(CancellationToken token)
        {
            byte[] request = BuildReadRequest(_registerAddress, 2);
            byte[] buffer = new byte[256];
            while (!token.IsCancellationRequested && _tcpClient?.Connected == true)
            {
                try
                {
                    await _stream!.WriteAsync(request, 0, request.Length, token);
                    int recv = await _stream.ReadAsync(buffer, 0, buffer.Length, token);
                    if (recv >= 13)
                    {
                        string lowHex = Encoding.ASCII.GetString(buffer, 6, 4);
                        string highHex = Encoding.ASCII.GetString(buffer, 10, 4);
                        int val = (int.Parse(highHex, System.Globalization.NumberStyles.HexNumber) << 16) | int.Parse(lowHex, System.Globalization.NumberStyles.HexNumber);
                        if (val != _lastValue) { _lastValue = val; this.BeginInvoke(new Action(() => lblValue.Text = val.ToString())); }
                    }
                    await Task.Delay(20, token);
                }
                catch { break; }
            }
        }

        private byte[] BuildReadRequest(int address, int words)
        {
            string data = _stationNumber.ToString("X2") + "46" + words.ToString("X2") + "R" + address.ToString("D5");
            int sum = 0x02;
            foreach (byte b in Encoding.ASCII.GetBytes(data)) sum += b;
            sum += 0x03;
            return Encoding.ASCII.GetBytes("\x02" + data + ((byte)sum).ToString("X2") + "\x03");
        }

        private void Log(string msg)
        {
            if (lblDebug.InvokeRequired) { lblDebug.Invoke(new Action(() => Log(msg))); return; }
            lblDebug.Text = $"[{DateTime.Now:HH:mm:ss}] {msg}\n" + lblDebug.Text;
        }

        private void Disconnect()
        {
            _cts?.Cancel(); _stream?.Close(); _tcpClient?.Close();
            btnConnect.Text = "Подключиться"; btnConnect.BackColor = SystemColors.Control;
        }

        private void LoadSettings()
        {
            if (File.Exists(_settingsFile))
            {
                try
                {
                    var s = JsonSerializer.Deserialize<Settings>(File.ReadAllText(_settingsFile));
                    if (s != null) txtIP.Text = s.IP;
                }
                catch { }
            }
            if (string.IsNullOrEmpty(txtIP.Text)) txtIP.Text = "192.168.0.15";
        }

        private void SaveSettings()
        {
            try { File.WriteAllText(_settingsFile, JsonSerializer.Serialize(new Settings { IP = txtIP.Text })); } catch { }
        }

        protected override void OnFormClosing(FormClosingEventArgs e) { Disconnect(); base.OnFormClosing(e); }
    }

    public class Settings { public string IP { get; set; } = ""; }
}