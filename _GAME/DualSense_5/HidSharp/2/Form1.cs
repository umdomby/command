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

        // **!!! ОБЪЯВЛЕНИЕ КОМПОНЕНТОВ УДАЛЕНО ИЗ ЭТОГО ФАЙЛА,
        // ТАК КАК ОНИ ДОЛЖНЫ БЫТЬ ТОЛЬКО В Form1.Designer.cs !!!**

        public Form1()
        {
            InitializeComponent();
            this.Text = "DualSense Direct HID Tester (Final Code)";
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

                    if (_dsStream.CanWrite)
                    {
                        MessageBox.Show("DualSense найден. Закройте все конфликтующие программы (DSX, DS4Windows, Steam).", "Статус", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    }
                    else
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
        /// Отправляет специальный Output Report (0x31) для инициализации.
        /// </summary>
        private void SendSetupReport()
        {
            if (_dsStream == null || !_dsStream.CanWrite) return;

            // Output Report ID 0x31. Длина: 64 байта.
            byte[] report = new byte[64];

            report[0] = 0x31; // Report ID

            // Флаги: 0x01: триггеры, 0x02/0x04: вибро, 0x08: LED
            report[1] = 0x01 | 0x02 | 0x04 | 0x08;

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
        /// Отправляет HID-отчет (0x02) с командами курков и вибрации, предваряя его Setup Report (0x31).
        /// </summary>
        private void SendDualSenseReport(byte effectID, byte param1, byte param2, byte heavyRumble, byte lightRumble)
        {
            if (_dsStream == null || !_dsStream.CanWrite) return;

            // 1. Сначала отправляем Setup Report (0x31) для инициализации
            SendSetupReport();

            // 2. Затем отправляем команду эффекта (0x02)
            byte[] report = new byte[48];

            report[0] = 0x02; // Report ID
            report[1] = 0x01 | 0x02 | 0x04 | 0x08; // Флаги

            report[2] = heavyRumble; // Heavy Rumble (Вибрация)
            report[3] = lightRumble; // Light Rumble (Вибрация)

            report[10] = 0x02;       // ID триггера R2
            report[11] = effectID;   // ID эффекта
            report[12] = param1;     // Параметр 1
            report[13] = param2;     // Параметр 2

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

        #region Обработчики кнопок курков (8 ЭФФЕКТОВ)

        private void btnHard_Click(object sender, EventArgs e)
        {
            // ID 0x01: Constant Force (Твердый)
            SendDualSenseReport(effectID: 0x01, param1: 0x00, param2: 0xFF, heavyRumble: 0x00, lightRumble: 0x00);
        }

        private void btnShot_Click(object sender, EventArgs e)
        {
            // ID 0x05: Section Resistance (Выстрел) - Используем агрессивные параметры
            SendDualSenseReport(effectID: 0x05, param1: 0x01, param2: 0xFF, heavyRumble: 0x00, lightRumble: 0x00);
        }

        private void btnSoft_Click(object sender, EventArgs e)
        {
            // ID 0x02: Continuous Vibrate (Пульсация - вибрация)
            SendDualSenseReport(effectID: 0x02, param1: 0x40, param2: 0x80, heavyRumble: 0x00, lightRumble: 0x00);
        }

        private void btnFriction_Click(object sender, EventArgs e)
        {
            // ID 0x03: Friction (Трение)
            SendDualSenseReport(effectID: 0x03, param1: 0xAA, param2: 0x00, heavyRumble: 0x00, lightRumble: 0x00);
        }

        private void btnBow_Click(object sender, EventArgs e)
        {
            // ID 0x04: Bow (Тетива)
            SendDualSenseReport(effectID: 0x04, param1: 0x00, param2: 0x80, heavyRumble: 0x00, lightRumble: 0x00);
        }

        private void btnFeedback_Click(object sender, EventArgs e)
        {
            // ID 0x06: Feedback (Отдача)
            SendDualSenseReport(effectID: 0x06, param1: 0xFF, param2: 0x80, heavyRumble: 0x00, lightRumble: 0x00);
        }

        private void btnPulse_Click(object sender, EventArgs e)
        {
            // ID 0x07: Loop Vibrate (Циклическая вибрация)
            SendDualSenseReport(effectID: 0x07, param1: 0x20, param2: 0xFF, heavyRumble: 0x00, lightRumble: 0x00);
        }

        private void btnReset_Click(object sender, EventArgs e)
        {
            // ID 0x00: Off (Сброс всего)
            SendDualSenseReport(effectID: 0x00, param1: 0x00, param2: 0x00, heavyRumble: 0x00, lightRumble: 0x00);
        }

        #endregion

        #region Обработчики кнопок вибрации (Rumble)

        private void btnRumbleOn_Click(object sender, EventArgs e)
        {
            // 9. ВИБРО ВКЛ
            SendDualSenseReport(effectID: 0x00, param1: 0x00, param2: 0x00, heavyRumble: 0xFF, lightRumble: 0xFF);
        }

        private void btnRumbleOff_Click(object sender, EventArgs e)
        {
            // 10. ВИБРО ВЫКЛ
            SendDualSenseReport(effectID: 0x00, param1: 0x00, param2: 0x00, heavyRumble: 0x00, lightRumble: 0x00);
        }

        #endregion
    }
}