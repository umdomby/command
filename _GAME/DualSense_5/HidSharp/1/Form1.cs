using System;
using System.Linq;
using System.Windows.Forms;
using HidSharp; // �������� ���������� ��� ������ � HID

namespace DualSenseTriggerControl // ���������� ���� ������������ ����
{
    public partial class Form1 : Form
    {
        // ������������� DualSense (USB Vendor ID: 0x054C, Product ID: 0x0CE6)
        private const int VENDOR_ID = 0x054C;
        private const int PRODUCT_ID = 0x0CE6;

        private HidDevice? _dsDevice = null;
        private HidStream? _dsStream = null;

        public Form1()
        {
            InitializeComponent();
            this.Text = "DualSense Direct HID Tester (Final)";
            InitializeController();
        }

        private void InitializeController()
        {
            try
            {
                // ����� ���������� �� VendorID � ProductID
                _dsDevice = DeviceList.Local.GetHidDevices(VENDOR_ID, PRODUCT_ID).FirstOrDefault();

                if (_dsDevice != null)
                {
                    // �������� ������ ��� ������/������
                    _dsStream = _dsDevice.Open();

                    if (_dsStream.CanWrite)
                    {
                        MessageBox.Show("DualSense ������ � �����. �������� ��� ������������� ��������� (DSX, DS4Windows, Steam).", "������", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    }
                    else
                    {
                        MessageBox.Show("DualSense �� ������� ������� ��� ������. ���������, ��� �� ��������� �� USB.", "������", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        _dsDevice = null;
                        _dsStream = null;
                    }
                }
                else
                {
                    MessageBox.Show("DualSense �� ������. ���������� ��� �� USB.", "������", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"����������� ������ �������������: {ex.Message}", "������", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        // ���������� ������ CS0111 (Dispose) � �������� ������.
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            // �������� ������ � ������������ �������� HID
            if (_dsStream != null)
            {
                _dsStream.Close();
                _dsStream.Dispose();
            }
            base.Dispose(disposing);
        }

        #region ������ �������� ������

        /// <summary>
        /// ���������� ����� HID-����� (Output Report 0x02) � ��������� ������ � ��������.
        /// </summary>
        private void SendDualSenseReport(byte effectID, byte param1, byte param2, byte heavyRumble, byte lightRumble)
        {
            if (_dsStream == null || !_dsStream.CanWrite) return;

            // Output Report ID 0x02. �����: 48 ����.
            byte[] report = new byte[48];

            // --- ������� ������� � ����� ---
            report[0] = 0x02; // Report ID

            // �����: �������� ���, ����� ���������� ������������� ���������
            // 0x01: ������� ��������� (������������ ����!)
            // 0x02: Heavy Rumble | 0x04: Light Rumble | 0x08: LED/Misc
            report[1] = 0x01 | 0x02 | 0x04 | 0x08;

            // --- ������� �������� ---
            report[2] = heavyRumble; // Heavy Rumble (������ �������)
            report[3] = lightRumble; // Light Rumble (������� �������)

            // --- ������� ������ (R2) ---
            report[10] = 0x02;       // ID �������� R2
            report[11] = effectID;   // ID ������� (0x00 - 0x07)
            report[12] = param1;     // �������� 1
            report[13] = param2;     // �������� 2

            try
            {
                _dsStream.Write(report);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"������ ������ � HID-����������: {ex.Message}", "������ HID", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        #endregion

        #region ����������� ������ ������ (8 ��������)

        private void btnHard_Click(object sender, EventArgs e)
        {
            // ID 0x01: Constant Force (���������� ����)
            SendDualSenseReport(effectID: 0x01, param1: 0x00, param2: 0xFF, heavyRumble: 0x00, lightRumble: 0x00);
        }

        private void btnShot_Click(object sender, EventArgs e)
        {
            // �������� �������� ����� ID 0x06 (Feedback)
            // ������������� �������, ������ ������ (0xFF) � ��������� �������� ���������.
            SendDualSenseReport(effectID: 0x06, param1: 0xFF, param2: 0x40, heavyRumble: 0x00, lightRumble: 0x00);
            MessageBox.Show("������������ �������� ������ Feedback (0x06) ��� �������� ��������.", "�������� ������");
        }

        private void btnSoft_Click(object sender, EventArgs e)
        {
            // ID 0x02: Continuous Vibrate (����������� ��������/���������)
            SendDualSenseReport(effectID: 0x02, param1: 0x40, param2: 0x80, heavyRumble: 0x00, lightRumble: 0x00);
        }

        private void btnFriction_Click(object sender, EventArgs e)
        {
            // ID 0x03: Friction (������/��������)
            SendDualSenseReport(effectID: 0x03, param1: 0xAA, param2: 0x00, heavyRumble: 0x00, lightRumble: 0x00);
        }

        private void btnBow_Click(object sender, EventArgs e)
        {
            // ID 0x04: Bow (������/��������� ����)
            SendDualSenseReport(effectID: 0x04, param1: 0x00, param2: 0x80, heavyRumble: 0x00, lightRumble: 0x00);
        }

        private void btnFeedback_Click(object sender, EventArgs e)
        {
            // ID 0x06: Feedback (���������� ������/������ ������)
            SendDualSenseReport(effectID: 0x06, param1: 0xFF, param2: 0x80, heavyRumble: 0x00, lightRumble: 0x00);
        }

        private void btnPulse_Click(object sender, EventArgs e)
        {
            // �������� ������������ ����� ����� ID 0x06 (Feedback)
            // ������������� �������, ������������� ������ (0x80) ��� �������� ���������.
            SendDualSenseReport(effectID: 0x06, param1: 0x80, param2: 0x80, heavyRumble: 0x00, lightRumble: 0x00);
            MessageBox.Show("������������ �������� ������ Feedback (0x06) ��� �������� ������������ �����.", "�������� ������");
        }

        private void btnReset_Click(object sender, EventArgs e)
        {
            // ID 0x00: Off (����� ���� �������� � ��������)
            SendDualSenseReport(effectID: 0x00, param1: 0x00, param2: 0x00, heavyRumble: 0x00, lightRumble: 0x00);
        }

        #endregion

        #region ����������� ������ �������� (Rumble)

        private void btnRumbleOn_Click(object sender, EventArgs e)
        {
            // ��������� ������� (0xFF) � ������ (0xFF) ��������
            SendDualSenseReport(effectID: 0x00, param1: 0x00, param2: 0x00, heavyRumble: 0xFF, lightRumble: 0xFF);
        }

        private void btnRumbleOff_Click(object sender, EventArgs e)
        {
            // ����� �������� (����� �������� � ������ Off)
            SendDualSenseReport(effectID: 0x00, param1: 0x00, param2: 0x00, heavyRumble: 0x00, lightRumble: 0x00);
        }

        #endregion
    }
}