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

        public Form1()
        {
            InitializeComponent();
            this.Text = "DualSense Direct HID Controller (L2: Слева | R2: Справа)";
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
        /// Отправляет HID-отчет (0x02) с командами для R2 и L2.
        /// </summary>
        private void SendDualSenseReportDual(byte effectID_R2, byte param1_R2, byte param2_R2, byte effectID_L2, byte param1_L2, byte param2_L2, byte heavyRumble, byte lightRumble)
        {
            if (_dsStream == null || !_dsStream.CanWrite) return;

            // 1. Инициализация курков
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

            // --- КОМАНДЫ КУРКА L2 (Левый) - ИСПРАВЛЕННАЯ АДРЕСАЦИЯ (БАЙТ 22) ---
            // Внимание: L2 часто использует блок, начинающийся с байта 22
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

        #region Утилитарные методы для кнопок

        // Метод для R2 (Левый курок L2 сбрасывается)
        private void SendR2Effect(byte effectID, byte param1, byte param2, byte heavyRumble = 0x00, byte lightRumble = 0x00)
        {
            // Устанавливаем эффект R2, L2 - сбрасываем (Off)
            SendDualSenseReportDual(effectID, param1, param2, 0x00, 0x00, 0x00, heavyRumble, lightRumble);
        }

        // Метод для L2 (Правый курок R2 сбрасывается)
        private void SendL2Effect(byte effectID, byte param1, byte param2, byte heavyRumble = 0x00, byte lightRumble = 0x00)
        {
            // Устанавливаем эффект L2, R2 - сбрасываем (Off)
            SendDualSenseReportDual(0x00, 0x00, 0x00, effectID, param1, param2, heavyRumble, lightRumble);
        }

        // Метод для вибрации (Сбрасывает оба курка)
        private void SendRumbleEffect(byte heavyRumble, byte lightRumble)
        {
            // Сбрасываем оба курка (Off), устанавливаем вибрацию
            SendDualSenseReportDual(0x00, 0x00, 0x00, 0x00, 0x00, 0x00, heavyRumble, lightRumble);
        }

        #endregion

        #region Обработчики кнопок курков L2 (Левый)

        // L2: 1. Constant Force (Твердый)
        private void btnHardL2_Click(object sender, EventArgs e) => SendL2Effect(effectID: 0x01, param1: 0x00, param2: 0xFF);
        // L2: 2. Section Resistance (Выстрел)
        private void btnShotL2_Click(object sender, EventArgs e) => SendL2Effect(effectID: 0x05, param1: 0x01, param2: 0xFF);
        // L2: 3. Continuous Vibrate (Пульсация)
        private void btnSoftL2_Click(object sender, EventArgs e) => SendL2Effect(effectID: 0x02, param1: 0x40, param2: 0x80);
        // L2: 4. Friction (Трение)
        private void btnFrictionL2_Click(object sender, EventArgs e) => SendL2Effect(effectID: 0x03, param1: 0xAA, param2: 0x00);
        // L2: 5. Bow (Тетива)
        private void btnBowL2_Click(object sender, EventArgs e) => SendL2Effect(effectID: 0x04, param1: 0x00, param2: 0x80);
        // L2: 6. Feedback (Отдача)
        private void btnFeedbackL2_Click(object sender, EventArgs e) => SendL2Effect(effectID: 0x06, param1: 0xFF, param2: 0x80);
        // L2: 7. Loop Vibrate (Циклическая вибрация)
        private void btnPulseL2_Click(object sender, EventArgs e) => SendL2Effect(effectID: 0x07, param1: 0x20, param2: 0xFF);
        // L2: 8. СБРОС (Off)
        private void btnResetL2_Click(object sender, EventArgs e) => SendL2Effect(effectID: 0x00, param1: 0x00, param2: 0x00);

        #endregion

        #region Обработчики кнопок курков R2 (Правый)

        // R2: 1. Constant Force (Твердый)
        private void btnHardR2_Click(object sender, EventArgs e) => SendR2Effect(effectID: 0x01, param1: 0x00, param2: 0xFF);
        // R2: 2. Section Resistance (Выстрел)
        private void btnShotR2_Click(object sender, EventArgs e) => SendR2Effect(effectID: 0x05, param1: 0x01, param2: 0xFF);
        // R2: 3. Continuous Vibrate (Пульсация)
        private void btnSoftR2_Click(object sender, EventArgs e) => SendR2Effect(effectID: 0x02, param1: 0x40, param2: 0x80);
        // R2: 4. Friction (Трение)
        private void btnFrictionR2_Click(object sender, EventArgs e) => SendR2Effect(effectID: 0x03, param1: 0xAA, param2: 0x00);
        // R2: 5. Bow (Тетива)
        private void btnBowR2_Click(object sender, EventArgs e) => SendR2Effect(effectID: 0x04, param1: 0x00, param2: 0x80);
        // R2: 6. Feedback (Отдача)
        private void btnFeedbackR2_Click(object sender, EventArgs e) => SendR2Effect(effectID: 0x06, param1: 0xFF, param2: 0x80);
        // R2: 7. Loop Vibrate (Циклическая вибрация)
        private void btnPulseR2_Click(object sender, EventArgs e) => SendR2Effect(effectID: 0x07, param1: 0x20, param2: 0xFF);
        // R2: 8. СБРОС (Off)
        private void btnResetR2_Click(object sender, EventArgs e) => SendR2Effect(effectID: 0x00, param1: 0x00, param2: 0x00);

        #endregion

        #region Обработчики кнопок вибрации (Общие)

        private void btnRumbleOn_Click(object sender, EventArgs e) => SendRumbleEffect(heavyRumble: 0xFF, lightRumble: 0xFF);
        private void btnRumbleOff_Click(object sender, EventArgs e) => SendRumbleEffect(heavyRumble: 0x00, lightRumble: 0x00);

        #endregion
    }
}