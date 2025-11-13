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