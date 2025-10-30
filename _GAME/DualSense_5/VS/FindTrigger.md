using System;
using System.Linq;
using System.Windows.Forms;
using HidSharp;

namespace DualSenseTriggerApp
{
public partial class Form1 : Form
{
private HidDevice? dualSenseDevice;
private const int VENDOR_ID = 0x054C;  // Sony
private const int PRODUCT_ID = 0x0CE6; // DualSense (USB)

        private Button? btnHard;
        private Button? btnSoft;
        private Label? lblStatus;

        public Form1()
        {
            InitializeComponent();
            InitializeCustomComponents();
            ConnectToDualSense();
        }

        private void InitializeCustomComponents()
        {
            this.Text = "DualSense Trigger Control";
            this.Size = new System.Drawing.Size(400, 220);
            this.StartPosition = FormStartPosition.CenterScreen;

            btnHard = new Button
            {
                Text = "Правый курок: ТУГОЙ",
                Location = new System.Drawing.Point(50, 30),
                Size = new System.Drawing.Size(280, 40),
                BackColor = System.Drawing.Color.FromArgb(180, 0, 0),
                ForeColor = System.Drawing.Color.White,
                Font = new System.Drawing.Font("Segoe UI", 10, System.Drawing.FontStyle.Bold)
            };
            btnHard.Click += BtnHard_Click;
            this.Controls.Add(btnHard!);

            btnSoft = new Button
            {
                Text = "Правый курок: МЯГКИЙ",
                Location = new System.Drawing.Point(50, 80),
                Size = new System.Drawing.Size(280, 40),
                BackColor = System.Drawing.Color.FromArgb(0, 180, 0),
                ForeColor = System.Drawing.Color.White,
                Font = new System.Drawing.Font("Segoe UI", 10, System.Drawing.FontStyle.Bold)
            };
            btnSoft.Click += BtnSoft_Click;
            this.Controls.Add(btnSoft!);

            lblStatus = new Label
            {
                Text = "Поиск DualSense...",
                Location = new System.Drawing.Point(50, 140),
                Size = new System.Drawing.Size(280, 23),
                TextAlign = System.Drawing.ContentAlignment.MiddleCenter,
                ForeColor = System.Drawing.Color.Blue
            };
            this.Controls.Add(lblStatus!);
        }

        private void ConnectToDualSense()
        {
            try
            {
                var devices = DeviceList.Local.GetHidDevices(VENDOR_ID, PRODUCT_ID);
                dualSenseDevice = devices.FirstOrDefault();

                if (dualSenseDevice != null)
                {
                    HidStream testStream;
                    if (dualSenseDevice.TryOpen(out testStream))
                    {
                        testStream.Dispose();
                        lblStatus!.Text = "DualSense подключён!";
                        lblStatus.ForeColor = System.Drawing.Color.Green;
                        btnHard!.Enabled = true;
                        btnSoft!.Enabled = true;
                    }
                    else
                    {
                        lblStatus!.Text = "DualSense НЕ НАЙДЕН или недоступен.";
                        lblStatus.ForeColor = System.Drawing.Color.Red;
                        btnHard!.Enabled = false;
                        btnSoft!.Enabled = false;
                    }
                }
                else
                {
                    lblStatus!.Text = "DualSense НЕ НАЙДЕН.";
                    lblStatus.ForeColor = System.Drawing.Color.Red;
                    btnHard!.Enabled = false;
                    btnSoft!.Enabled = false;
                }
            }
            catch (Exception ex)
            {
                lblStatus!.Text = "Ошибка: " + ex.Message;
                lblStatus.ForeColor = System.Drawing.Color.Red;
            }
        }

        private void SendTriggerEffect(byte[] leftTrigger, byte[] rightTrigger)
        {
            if (dualSenseDevice == null)
            {
                MessageBox.Show("DualSense не подключён!", "Ошибка", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            try
            {
                using var stream = dualSenseDevice.Open();
                var report = new byte[48];

                report[0] = 0x02; // Report ID для USB

                // Левый триггер: байты 1–11
                Array.Copy(leftTrigger, 0, report, 1, 11);

                // Правый триггер: байты 12–22
                Array.Copy(rightTrigger, 0, report, 12, 11);

                // Включаем эффекты триггеров (флаги в report[1])
                report[1] |= 0x0C; // 0x04 для правого + 0x08 для левого

                // Остальные байты — 0 (вибрация, свет и т.д.)

                stream.Write(report);
                lblStatus!.Text = "Эффект применён!";
                lblStatus.ForeColor = System.Drawing.Color.Green;
            }
            catch (Exception ex)
            {
                MessageBox.Show("Ошибка отправки:\n" + ex.Message + "\n\nЗапустите от имени Администратора!",
                    "Ошибка", MessageBoxButtons.OK, MessageBoxIcon.Error);
                lblStatus!.Text = "Ошибка отправки";
                lblStatus.ForeColor = System.Drawing.Color.Red;
            }
        }

        private void BtnHard_Click(object? sender, EventArgs e)
        {
            // === ЛЕВЫЙ ТРИГГЕР: ВЫКЛЮЧЕН ===
            byte[] leftOff = { 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };

            // === ПРАВЫЙ ТРИГГЕР: ТВЁРДЫЙ (constant resistance, max сила) ===
            byte[] rightHard = { 0x01, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };

            SendTriggerEffect(leftOff, rightHard);
        }

        private void BtnSoft_Click(object? sender, EventArgs e)
        {
            // === ЛЕВЫЙ ТРИГГЕР: ВЫКЛЮЧЕН ===
            byte[] leftOff = { 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };

            // === ПРАВЫЙ ТРИГГЕР: МЯГКИЙ (off) ===
            byte[] rightSoft = { 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };

            SendTriggerEffect(leftOff, rightSoft);
        }
    }
}