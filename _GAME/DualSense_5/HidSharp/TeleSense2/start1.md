DualSenseTriggerControl - это программа тестирования триггеров DualSense - она рабочая
TeleSense2 - это программа приема телеметрии из игры GridLegends
мне нужно добавить в TeleSense2 логику управления DualSenseTriggerControl триггерами

в TeleSense2 есть два курка ABS - когда срабатывает загорается красным и RPM когда срабатывает загорается красным, сделай так
чтобы когда сработал ABS то левый триггер в DualSense стал жестким выдавливал курок и так же сделай с правым курком DualЫense, когда сработает RPM в TeleSense2

убери в программе задержки, правый курок усилие бери из RPM   и исправь левый курок, когда идет блокировка колес ТОРМОЗ от 1000 до 0  сделай эту шкалу для DualSense левого курка

в DualSense два мотора? сделай 1 вибро при наезде на неровности, возьми нужный параметр из телеметрии, второй левый вибро (который мощнее) сделай диапазон вибрирования от ТОРРМОЗ: от 1000 до 0, где 0 - это максимальная вибрация, и так же посмотри что с правым курком он на диапазон ТОРМОЗ: не реагирует от 1000 до 0 , где 0 это максимальные толчки как на правом курке. Правый курок работает его не трогай.
отключи пока вибрацию от неровностей, и посмотри почему левый курок не работает не отталкивает как правый при блокировки колес когда ТОРМОЗ = 0 вибро оставь на левый курок левый мотор

нет левый курок не работает, вибро на него не срабатывает

ТОРМОЗ: {(pkt.m_brake * 100),3:F0}% ({brakeForce})  - вот эти значения нужны когда ТОРМОЗ = 0 максимальная вибрация левого большого мотора в DualSense, а так же когда ТОРМОЗ = 0 левый курок должен максимально отталкивать до того, пока тормоз не станет 1000

вот код DualSenseTriggerControl:
using System;
using System.Linq;
using System.Windows.Forms;
using System.Net;
using System.Net.Sockets;
using System.Threading.Tasks;
using System.Text;
using HidSharp;
using Newtonsoft.Json; // ТРЕБУЕТСЯ УСТАНОВКА ЧЕРЕЗ NUGET

namespace DualSenseTriggerControl
{
// Класс для десериализации данных от SimHub
public class SimHubData
{
[JsonProperty("speed")]
public float SpeedKPH { get; set; }
}

    public partial class Form1 : Form
    {
        // Константы
        private const int VENDOR_ID = 0x054C;
        private const int PRODUCT_ID = 0x0CE6;
        private const int UDP_PORT = 20778; // Порт для SimHub
        private const int SPEED_THRESHOLD = 100; // Порог в км/ч для курка R2

        private HidDevice? _dsDevice = null;
        private HidStream? _dsStream = null;
        private UdpClient? _udpClient = null;

        private int _currentSpeedKPH = 0;
        private bool _isR2Hard = false;

        private System.Windows.Forms.Timer? _statusTimer;

        // Переменные состояния курков
        private byte _currentEffectID_R2 = 0x00;
        private byte _currentParam1_R2 = 0x00;
        private byte _currentParam2_R2 = 0x00;

        private byte _currentEffectID_L2 = 0x00;
        private byte _currentParam1_L2 = 0x00;
        private byte _currentParam2_L2 = 0x00;

        // Переменные состояния вибрации
        private byte _currentHeavyRumble = 0x00;
        private byte _currentLightRumble = 0x00;

        public Form1()
        {
            InitializeComponent();
            this.Text = "DualSense SimHub JSON Control";
            InitializeController();

            // Запуск слушателя и таймера перенесен в Form1_Load для избежания InvalidOperationException
            this.Load += new EventHandler(Form1_Load);
        }

        /// <summary>
        /// Вызывается после создания дескриптора окна. Здесь безопасно запускать потоки с Invoke.
        /// </summary>
        private void Form1_Load(object? sender, EventArgs e)
        {
            StartStatusTimer();
            StartUdpListener();
        }

        private void InitializeController()
        {
            try
            {
                _dsDevice = DeviceList.Local.GetHidDevices(VENDOR_ID, PRODUCT_ID).FirstOrDefault();

                if (_dsDevice != null)
                {
                    _dsStream = _dsDevice.Open();

                    if (!_dsStream.CanWrite)
                    {
                        MessageBox.Show("DualSense не удалось открыть для записи. Убедитесь, что он подключен по USB.", "Ошибка", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        _dsDevice = null;
                        _dsStream = null;
                    }
                    //else
                    //{
                    //    MessageBox.Show("DualSense найден и готов. Закройте DSX!", "Статус", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    //}
                }
                else
                {
                    // Если DualSense не найден, можно вывести сообщение
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Критическая ошибка инициализации: {ex.Message}", "Ошибка", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            _statusTimer?.Stop();
            _statusTimer?.Dispose();

            _udpClient?.Close();
            _udpClient?.Dispose();

            if (_dsStream != null)
            {
                _dsStream.Close();
                _dsStream.Dispose();
            }
            base.Dispose(disposing);
        }

        #region UDP-Слушатель и Логика Скорости

        private void StartStatusTimer()
        {
            _statusTimer = new System.Windows.Forms.Timer();
            _statusTimer.Interval = 250;
            _statusTimer.Tick += StatusTimer_Tick;
            _statusTimer.Start();
        }

        private void StatusTimer_Tick(object? sender, EventArgs e)
        {
            if (this.lblSpeedStatus.InvokeRequired)
            {
                this.lblSpeedStatus.BeginInvoke((MethodInvoker)delegate
                {
                    UpdateSpeedLabel();
                });
            }
            else
            {
                UpdateSpeedLabel();
            }
        }

        private void UpdateSpeedLabel()
        {
            this.lblSpeedStatus.Text = $"Скорость: {_currentSpeedKPH} км/ч (R2: {(_isR2Hard ? "Твердый" : "Авто")})";
            this.lblSpeedStatus.BackColor = _isR2Hard ? System.Drawing.Color.Red : System.Drawing.Color.LightGreen;
        }

        private async void StartUdpListener()
        {
            try
            {
                // ИСПРАВЛЕНО: Явно привязываемся к 127.0.0.1 для приема пакетов
                IPEndPoint localEP = new IPEndPoint(IPAddress.Parse("127.0.0.1"), UDP_PORT);
                _udpClient = new UdpClient(localEP);

                // IPAddress.Any необходим для получения пакетов от любого отправителя (SimHub)
                IPEndPoint remoteEP = new IPEndPoint(IPAddress.Any, UDP_PORT);

                if (_udpClient == null) return;

                // Безопасный вызов BeginInvoke для обновления статуса
                if (this.IsHandleCreated && !this.IsDisposed)
                {
                    this.lblSpeedStatus.BeginInvoke((MethodInvoker)delegate
                    {
                        this.lblSpeedStatus.Text = $"Скорость: Ожидание на {UDP_PORT}";
                    });
                }

                while (true)
                {
                    UdpReceiveResult result = await _udpClient.ReceiveAsync();
                    byte[] data = result.Buffer;

                    string jsonString = Encoding.UTF8.GetString(data);

                    this.BeginInvoke((MethodInvoker)delegate
                    {
                        this.txtUdpLog.Text = jsonString;
                    });

                    try
                    {
                        SimHubData? telemetry = JsonConvert.DeserializeObject<SimHubData>(jsonString);

                        if (telemetry != null)
                        {
                            _currentSpeedKPH = (int)telemetry.SpeedKPH;
                        }
                    }
                    catch (JsonException)
                    {
                        _currentSpeedKPH = 0;
                    }
                    catch (Exception)
                    {
                        _currentSpeedKPH = 0;
                    }

                    this.BeginInvoke((MethodInvoker)delegate
                    {
                        UpdateR2TriggerBasedOnSpeed();
                    });
                }
            }
            catch (ObjectDisposedException)
            {
                // Игнорируем
            }
            catch (Exception ex)
            {
                // ИСПРАВЛЕНО: Безопасная обработка исключения в catch
                if (this.IsHandleCreated && !this.IsDisposed)
                {
                    MessageBox.Show($"Ошибка UDP-клиента: {ex.Message}", "Ошибка", MessageBoxButtons.OK, MessageBoxIcon.Error);

                    this.lblSpeedStatus.BeginInvoke((MethodInvoker)delegate
                    {
                        this.lblSpeedStatus.Text = "Ошибка UDP";
                        this.lblSpeedStatus.BackColor = System.Drawing.Color.Red;
                    });
                }
            }
        }

        private void UpdateR2TriggerBasedOnSpeed()
        {
            if (_currentEffectID_R2 != 0x00)
            {
                return;
            }

            if (_currentSpeedKPH > SPEED_THRESHOLD)
            {
                if (!_isR2Hard)
                {
                    // R2 Твердый (Const Force)
                    SendR2EffectInternal(effectID: 0x01, param1: 0x00, param2: 0xFF);
                    _isR2Hard = true;
                }
            }
            else
            {
                if (_isR2Hard)
                {
                    // R2 Сброс (Off)
                    SendR2EffectInternal(effectID: 0x00, param1: 0x00, param2: 0x00);
                    _isR2Hard = false;
                }
            }
        }

        #endregion

        #region Методы отправки команд и Утилитарные методы

        private void SendSetupReport()
        {
            if (_dsStream == null || !_dsStream.CanWrite) return;
            byte[] report = new byte[64];
            report[0] = 0x31;
            report[1] = 0x01 | 0x02 | 0x04 | 0x08;
            try { _dsStream.Write(report); } catch (Exception) { /* Игнор */ }
        }

        private void SendDualSenseReportDual(byte effectID_R2, byte param1_R2, byte param2_R2, byte effectID_L2, byte param1_L2, byte param2_L2, byte heavyRumble, byte lightRumble)
        {
            if (_dsStream == null || !_dsStream.CanWrite) return;
            SendSetupReport();

            byte[] report = new byte[48];
            report[0] = 0x02;
            report[1] = 0x01 | 0x02 | 0x04 | 0x08;

            report[2] = heavyRumble;
            report[3] = lightRumble;

            report[10] = 0x02; report[11] = effectID_R2; report[12] = param1_R2; report[13] = param2_R2;
            report[22] = 0x01; report[23] = effectID_L2; report[24] = param1_L2; report[25] = param2_L2;

            try
            {
                _dsStream.Write(report);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Ошибка записи в HID-устройство: {ex.Message}", "Ошибка HID", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void SendR2EffectInternal(byte effectID, byte param1, byte param2)
        {
            _currentEffectID_R2 = effectID;
            _currentParam1_R2 = param1;
            _currentParam2_R2 = param2;

            SendDualSenseReportDual(
                _currentEffectID_R2, _currentParam1_R2, _currentParam2_R2,
                _currentEffectID_L2, _currentParam1_L2, _currentParam2_L2,
                _currentHeavyRumble, _currentLightRumble
            );
        }

        private void SendR2EffectManual(byte effectID, byte param1, byte param2)
        {
            _currentEffectID_R2 = effectID;
            _currentParam1_R2 = param1;
            _currentParam2_R2 = param2;

            _isR2Hard = (effectID != 0x00);

            SendDualSenseReportDual(
                _currentEffectID_R2, _currentParam1_R2, _currentParam2_R2,
                _currentEffectID_L2, _currentParam1_L2, _currentParam2_L2,
                _currentHeavyRumble, _currentLightRumble
            );
        }

        private void SendL2Effect(byte effectID, byte param1, byte param2)
        {
            _currentEffectID_L2 = effectID;
            _currentParam1_L2 = param1;
            _currentParam2_L2 = param2;

            SendDualSenseReportDual(
                _currentEffectID_R2, _currentParam1_R2, _currentParam2_R2,
                _currentEffectID_L2, _currentParam1_L2, _currentParam2_L2,
                _currentHeavyRumble, _currentLightRumble
            );
        }

        private void SendRumbleEffect(byte heavyRumble, byte lightRumble)
        {
            _currentHeavyRumble = heavyRumble;
            _currentLightRumble = lightRumble;

            SendDualSenseReportDual(
                _currentEffectID_R2, _currentParam1_R2, _currentParam2_R2,
                _currentEffectID_L2, _currentParam1_L2, _currentParam2_L2,
                _currentHeavyRumble, _currentLightRumble
            );
        }

        #endregion

        #region Обработчики кнопок

        private void btnFeedbackL2_Click(object sender, EventArgs e) => SendL2Effect(effectID: 0x06, param1: 0xFF, param2: 0x80);

        private void btnHardR2_Click(object sender, EventArgs e) => SendR2EffectManual(effectID: 0x01, param1: 0x00, param2: 0xFF);

        private void btnRumbleOn_Click(object sender, EventArgs e) => SendRumbleEffect(heavyRumble: 0xFF, lightRumble: 0xFF);

        private void btnRumbleOff_Click(object sender, EventArgs e) => SendRumbleEffect(heavyRumble: 0x00, lightRumble: 0x00);

        private void btnResetL2_Click(object sender, EventArgs e) => SendL2Effect(effectID: 0x00, param1: 0x00, param2: 0x00);

        private void btnResetR2_Click(object sender, EventArgs e)
        {
            SendR2EffectManual(effectID: 0x00, param1: 0x00, param2: 0x00);
        }

        private void btnResetAll_Click(object sender, EventArgs e)
        {
            _currentEffectID_R2 = 0x00; _currentParam1_R2 = 0x00; _currentParam2_R2 = 0x00;
            _currentEffectID_L2 = 0x00; _currentParam1_L2 = 0x00; _currentParam2_L2 = 0x00;
            _currentHeavyRumble = 0x00; _currentLightRumble = 0x00;
            _isR2Hard = false;

            SendDualSenseReportDual(0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00);
        }

        #endregion
    }
}
//Form1.Designer.cs
namespace DualSenseTriggerControl
{
partial class Form1
{
private System.ComponentModel.IContainer components = null;

        // Объявление всех нужных компонентов
        private System.Windows.Forms.Button btnHardR2;
        private System.Windows.Forms.Button btnFeedbackL2;
        private System.Windows.Forms.Button btnResetAll;
        private System.Windows.Forms.Button btnRumbleOn;
        private System.Windows.Forms.Button btnRumbleOff;
        private System.Windows.Forms.Button btnResetL2;
        private System.Windows.Forms.Button btnResetR2;

        // Элементы для телеметрии SimHub
        private System.Windows.Forms.Label lblSpeedStatus;
        private System.Windows.Forms.TextBox txtUdpLog;

        #region Windows Form Designer generated code

        private void InitializeComponent()
        {
            this.btnFeedbackL2 = new System.Windows.Forms.Button();
            this.btnHardR2 = new System.Windows.Forms.Button();
            this.btnRumbleOn = new System.Windows.Forms.Button();
            this.btnRumbleOff = new System.Windows.Forms.Button();
            this.btnResetL2 = new System.Windows.Forms.Button();
            this.btnResetR2 = new System.Windows.Forms.Button();
            this.btnResetAll = new System.Windows.Forms.Button();
            this.lblSpeedStatus = new System.Windows.Forms.Label();
            this.txtUdpLog = new System.Windows.Forms.TextBox();

            this.SuspendLayout();

            // --- КУРОК L2 (Отдача) - Слева ---
            this.btnFeedbackL2.Location = new System.Drawing.Point(20, 30);
            this.btnFeedbackL2.Name = "btnFeedbackL2";
            this.btnFeedbackL2.Size = new System.Drawing.Size(200, 40);
            this.btnFeedbackL2.Text = "L2: Отдача (Feedback)";
            this.btnFeedbackL2.UseVisualStyleBackColor = true;
            this.btnFeedbackL2.Click += new System.EventHandler(this.btnFeedbackL2_Click);

            // --- КУРОК L2 (Отключить) ---
            this.btnResetL2.Location = new System.Drawing.Point(20, 75);
            this.btnResetL2.Name = "btnResetL2";
            this.btnResetL2.Size = new System.Drawing.Size(200, 30);
            this.btnResetL2.Text = "L2: Отключить";
            this.btnResetL2.UseVisualStyleBackColor = true;
            this.btnResetL2.Click += new System.EventHandler(this.btnResetL2_Click);

            // --- КУРОК R2 (Твердый) - Справа ---
            this.btnHardR2.Location = new System.Drawing.Point(340, 30);
            this.btnHardR2.Name = "btnHardR2";
            this.btnHardR2.Size = new System.Drawing.Size(200, 40);
            this.btnHardR2.Text = "R2: Твердый (Const Force)";
            this.btnHardR2.UseVisualStyleBackColor = true;
            this.btnHardR2.Click += new System.EventHandler(this.btnHardR2_Click);

            // --- КУРОК R2 (Отключить) ---
            this.btnResetR2.Location = new System.Drawing.Point(340, 75);
            this.btnResetR2.Name = "btnResetR2";
            this.btnResetR2.Size = new System.Drawing.Size(200, 30);
            this.btnResetR2.Text = "R2: Авто / Отключить";
            this.btnResetR2.UseVisualStyleBackColor = true;
            this.btnResetR2.Click += new System.EventHandler(this.btnResetR2_Click);


            // --- Вибрация - Центр ---
            this.btnRumbleOn.Location = new System.Drawing.Point(20, 130);
            this.btnRumbleOn.Name = "btnRumbleOn";
            this.btnRumbleOn.Size = new System.Drawing.Size(200, 30);
            this.btnRumbleOn.Text = "ВИБРО ВКЛ";
            this.btnRumbleOn.UseVisualStyleBackColor = true;
            this.btnRumbleOn.Click += new System.EventHandler(this.btnRumbleOn_Click);

            this.btnRumbleOff.Location = new System.Drawing.Point(340, 130);
            this.btnRumbleOff.Name = "btnRumbleOff";
            this.btnRumbleOff.Size = new System.Drawing.Size(200, 30);
            this.btnRumbleOff.Text = "ВИБРО ВЫКЛ";
            this.btnRumbleOff.UseVisualStyleBackColor = true;
            this.btnRumbleOff.Click += new System.EventHandler(this.btnRumbleOff_Click);

            // --- Статус Скорости - Центр ---
            this.lblSpeedStatus.AutoSize = false;
            this.lblSpeedStatus.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            this.lblSpeedStatus.Location = new System.Drawing.Point(240, 130);
            this.lblSpeedStatus.Name = "lblSpeedStatus";
            this.lblSpeedStatus.Size = new System.Drawing.Size(100, 30);
            this.lblSpeedStatus.Text = "Скорость: 0 км/ч";
            this.lblSpeedStatus.BackColor = System.Drawing.Color.LightGray;
            this.lblSpeedStatus.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;

            // --- Сброс (По центру внизу) ---
            this.btnResetAll.Location = new System.Drawing.Point(180, 175);
            this.btnResetAll.Name = "btnResetAll";
            this.btnResetAll.Size = new System.Drawing.Size(200, 30);
            this.btnResetAll.Text = "СБРОС ВСЕГО (Reset)";
            this.btnResetAll.UseVisualStyleBackColor = true;
            this.btnResetAll.Click += new System.EventHandler(this.btnResetAll_Click);

            // --- Поле для лога UDP ---
            this.txtUdpLog.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom)
            | System.Windows.Forms.AnchorStyles.Left)
            | System.Windows.Forms.AnchorStyles.Right)));
            this.txtUdpLog.Location = new System.Drawing.Point(12, 215);
            this.txtUdpLog.Multiline = true;
            this.txtUdpLog.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
            this.txtUdpLog.Name = "txtUdpLog";
            this.txtUdpLog.ReadOnly = true;
            this.txtUdpLog.Size = new System.Drawing.Size(536, 100);
            this.txtUdpLog.TabIndex = 6;
            this.txtUdpLog.Text = "Здесь будет отображаться последний JSON-пакет от SimHub. Убедитесь, что SimHub настроен на 127.0.0.1:20778.";

            // 
            // Form1
            // 
            this.ClientSize = new System.Drawing.Size(560, 327);

            this.Controls.Add(this.lblSpeedStatus);
            this.Controls.Add(this.txtUdpLog);
            this.Controls.Add(this.btnFeedbackL2);
            this.Controls.Add(this.btnHardR2);
            this.Controls.Add(this.btnResetL2);
            this.Controls.Add(this.btnResetR2);
            this.Controls.Add(this.btnRumbleOn);
            this.Controls.Add(this.btnRumbleOff);
            this.Controls.Add(this.btnResetAll);

            this.Name = "Form1";
            this.Text = "DualSense SimHub JSON Control";
            this.ResumeLayout(false);
            this.PerformLayout();
        }

        #endregion
    }
}

код TeleSense2
using System;
using System.Drawing;
using System.Net;
using System.Net.Sockets;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace TeleSense2
{
public partial class Form1 : Form
{
private const int UdpPort = 20777;
private UdpClient? _udpClient;
private IPEndPoint? _endpoint;
private bool _isListening = false;

        private byte[]? _latestPacket;
        private readonly object _lock = new object();

        private const float RpmCalibrationFactor = 250.0f;
        private readonly Color TransparentColorKey = Color.Magenta;

        public Form1()
        {
            InitializeComponent();
            StartListening();
            _scrollPanel.Focus();
        }

        private void StartListening()
        {
            try
            {
                _endpoint = new IPEndPoint(IPAddress.Any, UdpPort);
                _udpClient = new UdpClient(_endpoint);
                _isListening = true;

                Task.Run(ReceiveTelemetry);
                _statusLabel.Text = $"Прослушивание порта {UdpPort}...";
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
                    var packet = result.Buffer;

                    // Сохраняем пакет
                    lock (_lock)
                    {
                        _latestPacket = packet;
                    }

                    // Обновляем UI мгновенно через BeginInvoke
                    this.BeginInvoke((Action<byte[]>)DecodeAndDisplay, packet);
                }
                catch (ObjectDisposedException) { break; }
                catch (Exception ex)
                {
                    this.BeginInvoke((Action)(() => _statusLabel.Text = $"Ошибка: {ex.Message}"));
                }
            }
        }

        private void DecodeAndDisplay(byte[] data)
        {
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

                // === RPM > MAX RPM (0–100) ===
                float rpmOverValue = CalculateRPMOverMax(rpm, maxRpm);
                _rightLabel.Text = $"RPM\n{(int)rpmOverValue}";
                _rightTrigger.BackColor = GetOverColor(rpmOverValue);
                _rpmOverLabel.Text = $"{(int)rpmOverValue}";
                _rpmOverLabel.ForeColor = GetOverColor(rpmOverValue);

                // === ABS ЛОГИКА ===
                bool isBraking = pkt.m_brake > 0f;
                bool isMoving = speedKmh > 5f;
                bool isAbsWarning = isMoving && !isBraking;

                int absDisplayValue = isAbsWarning ? 100 : (isBraking ? 100 : 0);
                string absText = isAbsWarning ? "НЕ ТОРМОЗИТ!" : (isBraking ? "ТОРМОЗ" : "ABS");

                _leftLabel.Text = $"ABS\n{absText}";

                if (isAbsWarning)
                {
                    _leftTrigger.BackColor = Color.Red;
                    _leftLabel.ForeColor = Color.White;
                }
                else if (isBraking)
                {
                    _leftTrigger.BackColor = Color.Green;
                    _leftLabel.ForeColor = Color.White;
                }
                else
                {
                    _leftTrigger.BackColor = Color.DarkGray;
                    _leftLabel.ForeColor = Color.LightGray;
                }

                string gear = pkt.m_gear switch { -1 => "R", 0 => "N", _ => ((int)pkt.m_gear).ToString() };

                string display = $@"
СКОРОСТЬ: {speedKmh,7:F1} км/ч
ПЕРЕДАЧА: {gear}
ГАЗ: {(pkt.m_throttle * 100),3:F0}
ТОРМОЗ: {(pkt.m_brake * 100),3:F0}
RPM: {rpm,6:F0}
МАКС. RPM: {maxRpm,6:F0}
RPM %: {rpmPercent,6:F1}
RPM > MAX (0-100): {(int)rpmOverValue}
ABS: {(isAbsWarning ? "ВНИМАНИЕ: ЕДЕТ БЕЗ ТОРМОЗА!" : (isBraking ? "ТОРМОЗ АКТИВЕН" : "СТОИТ"))}
".Trim();

                _telemetryDataLabel.Text = display;
                _statusLabel.Text = "Grid Legends — RPM vs MAX RPM";
            }
            catch (Exception ex)
            {
                _telemetryDataLabel.Text = $"ОШИБКА:\n{ex.Message}";
            }
        }

        private float CalculateRPMOverMax(float rpm, float maxRpm)
        {
            if (maxRpm <= 0) return 0f;
            float ratio = rpm / maxRpm;
            if (ratio <= 1.0f) return 0f;
            float excess = ratio - 1.0f;
            return Math.Min(excess / 0.5f * 100f, 100f);
        }

        private Color GetOverColor(float value)
        {
            value = Math.Clamp(value, 0f, 100f);
            int r = (int)(255 * (value / 100f));
            int g = (int)(255 * (1f - value / 100f));
            return Color.FromArgb(r, g, 0);
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

        private void Form1_KeyDown(object? sender, KeyEventArgs e)
        {
            if (!_scrollPanel.AutoScroll) return;
            int dx = 0, dy = 0;
            switch (e.KeyCode)
            {
                case Keys.Up: dy = -5; break;
                case Keys.Down: dy = 5; break;
                case Keys.Left: dx = -5; break;
                case Keys.Right: dx = 5; break;
                default: return;
            }
            e.Handled = true;
            var pos = _scrollPanel.AutoScrollPosition;
            _scrollPanel.AutoScrollPosition = new Point(-pos.X + dx, -pos.Y + dy);
        }

        protected override void OnFormClosed(FormClosedEventArgs e)
        {
            _isListening = false;
            _udpClient?.Dispose();
            base.OnFormClosed(e);
        }
    }
}

//Form1.Designer.cs
namespace TeleSense2
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
            this.components = new System.ComponentModel.Container();
            this._statusLabel = new System.Windows.Forms.Label();
            this._scrollPanel = new System.Windows.Forms.Panel();
            this._telemetryDataLabel = new System.Windows.Forms.Label();
            this._leftTrigger = new System.Windows.Forms.Panel();
            this._leftLabel = new System.Windows.Forms.Label();
            this._rightTrigger = new System.Windows.Forms.Panel();
            this._rightLabel = new System.Windows.Forms.Label();
            this._rpmOverLabel = new System.Windows.Forms.Label();
            this._contextMenu = new System.Windows.Forms.ContextMenuStrip(this.components);
            this._topMostMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this._transparentMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.toolStripSeparator1 = new System.Windows.Forms.ToolStripSeparator();
            this.toolStripMenuItem1 = new System.Windows.Forms.ToolStripMenuItem();
            this.triggerPanel = new System.Windows.Forms.Panel();
            this._scrollPanel.SuspendLayout();
            this._leftTrigger.SuspendLayout();
            this._rightTrigger.SuspendLayout();
            this._contextMenu.SuspendLayout();
            this.triggerPanel.SuspendLayout();
            this.SuspendLayout();

            // _statusLabel
            this._statusLabel.AutoSize = true;
            this._statusLabel.Font = new System.Drawing.Font("Segoe UI", 11F, System.Drawing.FontStyle.Bold);
            this._statusLabel.ForeColor = System.Drawing.Color.LightGray;
            this._statusLabel.Location = new System.Drawing.Point(10, 10);
            this._statusLabel.Name = "_statusLabel";
            this._statusLabel.Text = "Статус: Инициализация...";

            // triggerPanel
            this.triggerPanel.Location = new System.Drawing.Point(10, 45);
            this.triggerPanel.Name = "triggerPanel";
            this.triggerPanel.Size = new System.Drawing.Size(790, 110);
            this.triggerPanel.TabIndex = 1;

            // _leftTrigger
            this._leftTrigger.BackColor = System.Drawing.Color.DarkGray;
            this._leftTrigger.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this._leftTrigger.Location = new System.Drawing.Point(20, 5);
            this._leftTrigger.Name = "_leftTrigger";
            this._leftTrigger.Size = new System.Drawing.Size(160, 80);
            this.triggerPanel.Controls.Add(this._leftTrigger);

            // _leftLabel
            this._leftLabel.Dock = System.Windows.Forms.DockStyle.Fill;
            this._leftLabel.Font = new System.Drawing.Font("Consolas", 14F, System.Drawing.FontStyle.Bold);
            this._leftLabel.ForeColor = System.Drawing.Color.White;
            this._leftLabel.Location = new System.Drawing.Point(0, 0);
            this._leftLabel.Name = "_leftLabel";
            this._leftLabel.Size = new System.Drawing.Size(158, 78);
            this._leftLabel.Text = "ABS\n0";
            this._leftLabel.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            this._leftTrigger.Controls.Add(this._leftLabel);

            // _rightTrigger
            this._rightTrigger.BackColor = System.Drawing.Color.DarkGray;
            this._rightTrigger.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this._rightTrigger.Location = new System.Drawing.Point(610, 5);
            this._rightTrigger.Name = "_rightTrigger";
            this._rightTrigger.Size = new System.Drawing.Size(160, 80);
            this.triggerPanel.Controls.Add(this._rightTrigger);

            // _rightLabel
            this._rightLabel.Dock = System.Windows.Forms.DockStyle.Fill;
            this._rightLabel.Font = new System.Drawing.Font("Consolas", 14F, System.Drawing.FontStyle.Bold);
            this._rightLabel.ForeColor = System.Drawing.Color.White;
            this._rightLabel.Location = new System.Drawing.Point(0, 0);
            this._rightLabel.Name = "_rightLabel";
            this._rightLabel.Size = new System.Drawing.Size(158, 78);
            this._rightLabel.Text = "RPM\n0";
            this._rightLabel.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            this._rightTrigger.Controls.Add(this._rightLabel);

            // _rpmOverLabel
            this._rpmOverLabel.BackColor = System.Drawing.Color.FromArgb(50, 50, 50);
            this._rpmOverLabel.Font = new System.Drawing.Font("Consolas", 10F, System.Drawing.FontStyle.Bold);
            this._rpmOverLabel.ForeColor = System.Drawing.Color.White;
            this._rpmOverLabel.Location = new System.Drawing.Point(610, 90);
            this._rpmOverLabel.Name = "_rpmOverLabel";
            this._rpmOverLabel.Size = new System.Drawing.Size(160, 20);
            this._rpmOverLabel.Text = "0";
            this._rpmOverLabel.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            this.triggerPanel.Controls.Add(this._rpmOverLabel);

            // _scrollPanel
            this._scrollPanel.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom)
            | System.Windows.Forms.AnchorStyles.Left)
            | System.Windows.Forms.AnchorStyles.Right)));
            this._scrollPanel.AutoScroll = true;
            this._scrollPanel.BackColor = System.Drawing.Color.FromArgb(40, 40, 40);
            this._scrollPanel.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this._scrollPanel.Location = new System.Drawing.Point(10, 165);
            this._scrollPanel.Name = "_scrollPanel";
            this._scrollPanel.Size = new System.Drawing.Size(790, 525);
            this._scrollPanel.TabIndex = 2;
            this._scrollPanel.TabStop = true;

            // _telemetryDataLabel
            this._telemetryDataLabel.AutoSize = true;
            this._telemetryDataLabel.Font = new System.Drawing.Font("Consolas", 10F);
            this._telemetryDataLabel.ForeColor = System.Drawing.Color.LightGreen;
            this._telemetryDataLabel.Location = new System.Drawing.Point(0, 0);
            this._telemetryDataLabel.Name = "_telemetryDataLabel";
            this._telemetryDataLabel.Text = "Ожидание данных на порту 20777...";
            this._scrollPanel.Controls.Add(this._telemetryDataLabel);

            // _contextMenu
            this._contextMenu.Items.AddRange(new System.Windows.Forms.ToolStripItem[] {
                this._topMostMenuItem,
                this._transparentMenuItem,
                this.toolStripSeparator1,
                this.toolStripMenuItem1});
            this._contextMenu.Name = "_contextMenu";

            // _topMostMenuItem
            this._topMostMenuItem.CheckOnClick = true;
            this._topMostMenuItem.Name = "_topMostMenuItem";
            this._topMostMenuItem.Text = "Поверх всех окон";

            // _transparentMenuItem
            this._transparentMenuItem.CheckOnClick = true;
            this._transparentMenuItem.Name = "_transparentMenuItem";
            this._transparentMenuItem.Text = "Прозрачный HUD";

            // toolStripSeparator1
            this.toolStripSeparator1.Name = "toolStripSeparator1";

            // toolStripMenuItem1
            this.toolStripMenuItem1.Name = "toolStripMenuItem1";
            this.toolStripMenuItem1.Text = "Выход";

            // Form1
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.FromArgb(30, 30, 30);
            this.ClientSize = new System.Drawing.Size(820, 700);
            this.ContextMenuStrip = this._contextMenu;
            this.Controls.Add(this._scrollPanel);
            this.Controls.Add(this.triggerPanel);
            this.Controls.Add(this._statusLabel);
            this.KeyPreview = true;
            this.MinimumSize = new System.Drawing.Size(400, 300);
            this.Name = "Form1";
            this.Text = "Grid Legends — RPM vs MAX RPM (0-100)";
            this._scrollPanel.ResumeLayout(false);
            this._scrollPanel.PerformLayout();
            this._leftTrigger.ResumeLayout(false);
            this._rightTrigger.ResumeLayout(false);
            this._contextMenu.ResumeLayout(false);
            this.triggerPanel.ResumeLayout(false);
            this.ResumeLayout(false);
            this.PerformLayout();
        }

        private System.Windows.Forms.Label _statusLabel;
        private System.Windows.Forms.Panel _scrollPanel;
        private System.Windows.Forms.Label _telemetryDataLabel;
        private System.Windows.Forms.Panel _leftTrigger;
        private System.Windows.Forms.Label _leftLabel;
        private System.Windows.Forms.Panel _rightTrigger;
        private System.Windows.Forms.Label _rightLabel;
        private System.Windows.Forms.Label _rpmOverLabel;
        private System.Windows.Forms.ContextMenuStrip _contextMenu;
        private System.Windows.Forms.ToolStripMenuItem _topMostMenuItem;
        private System.Windows.Forms.ToolStripMenuItem _transparentMenuItem;
        private System.Windows.Forms.ToolStripSeparator toolStripSeparator1;
        private System.Windows.Forms.ToolStripMenuItem toolStripMenuItem1;
        private System.Windows.Forms.Panel triggerPanel;
    }
}

//TelemetryStructs.cs
using System;
using System.Runtime.InteropServices;

namespace TeleSense2
{
[StructLayout(LayoutKind.Sequential, Pack = 1)]
public struct PacketHeader
{
public ushort m_packetFormat;
public byte m_gameMajorVersion;
public byte m_gameMinorVersion;
public byte m_packetVersion;
public byte m_packetId;
public ulong m_sessionUID;
public float m_sessionTime;
public uint m_frameIdentifier;
public byte m_playerCarIndex;
public byte m_secondaryPlayerCarIndex;
[MarshalAs(UnmanagedType.ByValArray, SizeConst = 16)]
public byte[] m_headerPadding;
}

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct GridLegendsMotionPacket189
    {
        public PacketHeader m_header;
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 36)] public byte[] m_dataPadding1;
        public float m_pitch; public float m_roll; public float m_yaw;
        public float m_gForceLateral; public float m_gForceLongitudinal; public float m_gForceVertical;
        public float m_speed; public float m_engineRPM; public float m_maxEngineRPM;
        public float m_brake; public float m_throttle; public float m_steer;
        public float m_clutchOrUnused2; public float m_unusedBrake; public float m_gear;
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 108)] public byte[] m_paddingFinal; // 108!
    }

    public static class Utils
    {
        public static T ByteArrayToStructure<T>(byte[] bytes) where T : struct
        {
            int size = Marshal.SizeOf<T>();
            if (bytes.Length < size)
                throw new ArgumentException($"Недостаточно байт: {bytes.Length}, нужно {size}");
            IntPtr ptr = Marshal.AllocHGlobal(size);
            try
            {
                Marshal.Copy(bytes, 0, ptr, size);
                return Marshal.PtrToStructure<T>(ptr);
            }
            finally
            {
                Marshal.FreeHGlobal(ptr);
            }
        }
    }
}

дай полный дополненный код TeleSense2