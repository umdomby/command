using System;
using System.Linq;
using System.Windows.Forms;
using HidSharp;

namespace DualSenseTriggerControl
{
    public partial class Form1 : Form
    {
        // Идентификаторы DualSense (USB)
        private const int VENDOR_ID = 0x054C;
        private const int PRODUCT_ID = 0x0CE6;

        private HidDevice? _dsDevice = null;
        private HidStream? _dsStream = null;

        // --- Переменные состояния для хранения текущего эффекта курков ---
        private byte _currentEffectID_R2 = 0x00;
        private byte _currentParam1_R2 = 0x00;
        private byte _currentParam2_R2 = 0x00;

        private byte _currentEffectID_L2 = 0x00;
        private byte _currentParam1_L2 = 0x00;
        private byte _currentParam2_L2 = 0x00;

        // --- Переменные состояния для вибрации ---
        private byte _currentHeavyRumble = 0x00;
        private byte _currentLightRumble = 0x00;
        // ---------------------------------------------------------------------

        public Form1()
        {
            InitializeComponent();
            this.Text = "DualSense Minimal Trigger + Rumble Control";
            InitializeController();
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
                }
                else
                {
                    MessageBox.Show("DualSense не найден. Подключите его по USB.", "Ошибка", MessageBoxButtons.OK, MessageBoxIcon.Error);
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
            if (_dsStream != null)
            {
                _dsStream.Close();
                _dsStream.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Методы отправки команд

        /// <summary>
        /// Отправляет специальный Output Report (0x31) для инициализации курков.
        /// </summary>
        private void SendSetupReport()
        {
            if (_dsStream == null || !_dsStream.CanWrite) return;

            byte[] report = new byte[64];

            report[0] = 0x31; // Report ID
            report[1] = 0x01 | 0x02 | 0x04 | 0x08; // Включаем все флаги

            try
            {
                _dsStream.Write(report);
            }
            catch (Exception)
            {
                // Игнорируем ошибки
            }
        }

        /// <summary>
        /// Отправляет HID-отчет (0x02) с командами для R2 (байт 10) и L2 (байт 22) и вибрации.
        /// </summary>
        private void SendDualSenseReportDual(byte effectID_R2, byte param1_R2, byte param2_R2, byte effectID_L2, byte param1_L2, byte param2_L2, byte heavyRumble, byte lightRumble)
        {
            if (_dsStream == null || !_dsStream.CanWrite) return;

            SendSetupReport();

            byte[] report = new byte[48];

            report[0] = 0x02; // Report ID
            report[1] = 0x01 | 0x02 | 0x04 | 0x08; // Флаги

            report[2] = heavyRumble; // Heavy Rumble (Вибрация)
            report[3] = lightRumble; // Light Rumble (Вибрация)

            // --- КОМАНДЫ КУРКА R2 (Правый) - АДРЕСАЦИЯ (БАЙТ 10) ---
            report[10] = 0x02;       // ID триггера R2
            report[11] = effectID_R2; // ID эффекта
            report[12] = param1_R2;  // Параметр 1
            report[13] = param2_R2;  // Параметр 2

            // --- КОМАНДЫ КУРКА L2 (Левый) - АДРЕСАЦИЯ (БАЙТ 22) ---
            report[22] = 0x01;       // ID триггера L2 (0x01)
            report[23] = effectID_L2; // ID эффекта
            report[24] = param1_L2;  // Параметр 1
            report[25] = param2_L2;  // Параметр 2

            try
            {
                _dsStream.Write(report);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Ошибка записи в HID-устройство: {ex.Message}", "Ошибка HID", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        #endregion

        #region Утилитарные методы (Сохранение состояния)

        // Метод для R2: устанавливает новый эффект R2 и сохраняет текущий эффект L2 и вибрацию
        private void SendR2Effect(byte effectID, byte param1, byte param2)
        {
            // Обновляем состояние R2
            _currentEffectID_R2 = effectID;
            _currentParam1_R2 = param1;
            _currentParam2_R2 = param2;

            // Отправляем все текущие состояния
            SendDualSenseReportDual(
                _currentEffectID_R2, _currentParam1_R2, _currentParam2_R2,
                _currentEffectID_L2, _currentParam1_L2, _currentParam2_L2,
                _currentHeavyRumble, _currentLightRumble
            );
        }

        // Метод для L2: устанавливает новый эффект L2 и сохраняет текущий эффект R2 и вибрацию
        private void SendL2Effect(byte effectID, byte param1, byte param2)
        {
            // Обновляем состояние L2
            _currentEffectID_L2 = effectID;
            _currentParam1_L2 = param1;
            _currentParam2_L2 = param2;

            // Отправляем все текущие состояния
            SendDualSenseReportDual(
                _currentEffectID_R2, _currentParam1_R2, _currentParam2_R2,
                _currentEffectID_L2, _currentParam1_L2, _currentParam2_L2,
                _currentHeavyRumble, _currentLightRumble
            );
        }

        // Метод для вибрации: устанавливает новую вибрацию и сохраняет текущие эффекты курков
        private void SendRumbleEffect(byte heavyRumble, byte lightRumble)
        {
            // Обновляем состояние вибрации
            _currentHeavyRumble = heavyRumble;
            _currentLightRumble = lightRumble;

            // Отправляем все текущие состояния
            SendDualSenseReportDual(
                _currentEffectID_R2, _currentParam1_R2, _currentParam2_R2,
                _currentEffectID_L2, _currentParam1_L2, _currentParam2_L2,
                _currentHeavyRumble, _currentLightRumble
            );
        }

        #endregion

        #region Обработчики кнопок

        // L2: Отдача (Feedback)
        private void btnFeedbackL2_Click(object sender, EventArgs e) => SendL2Effect(effectID: 0x06, param1: 0xFF, param2: 0x80);

        // R2: Твердый (Const Force)
        private void btnHardR2_Click(object sender, EventArgs e) => SendR2Effect(effectID: 0x01, param1: 0x00, param2: 0xFF);

        // Вибрация: ВКЛ
        private void btnRumbleOn_Click(object sender, EventArgs e) => SendRumbleEffect(heavyRumble: 0xFF, lightRumble: 0xFF);

        // Вибрация: ВЫКЛ
        private void btnRumbleOff_Click(object sender, EventArgs e) => SendRumbleEffect(heavyRumble: 0x00, lightRumble: 0x00);

        // --- НОВОЕ: Отдельное отключение L2 ---
        private void btnResetL2_Click(object sender, EventArgs e) => SendL2Effect(effectID: 0x00, param1: 0x00, param2: 0x00);

        // --- НОВОЕ: Отдельное отключение R2 ---
        private void btnResetR2_Click(object sender, EventArgs e) => SendR2Effect(effectID: 0x00, param1: 0x00, param2: 0x00);

        // Сброс всего
        private void btnResetAll_Click(object sender, EventArgs e)
        {
            // Сбрасываем курки
            _currentEffectID_R2 = 0x00; _currentParam1_R2 = 0x00; _currentParam2_R2 = 0x00;
            _currentEffectID_L2 = 0x00; _currentParam1_L2 = 0x00; _currentParam2_L2 = 0x00;

            // Сбрасываем вибрацию
            _currentHeavyRumble = 0x00; _currentLightRumble = 0x00;

            SendDualSenseReportDual(0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00);
        }

        #endregion
    }
}