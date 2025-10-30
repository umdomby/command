using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace DualSenseUDPApp
{
public partial class Form1 : Form
{
private UdpClient? udp;
private readonly IPEndPoint dsxEndPoint = new(IPAddress.Loopback, 20778);

        private Button? btnHard;
        private Button? btnSoft;
        private Label? lblStatus;

        public Form1()
        {
            InitializeMyComponents();
            InitUDP();
        }

        private void InitializeMyComponents()
        {
            this.Text = "DSX UDP — ФИНАЛ";
            this.Size = new System.Drawing.Size(420, 220);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedSingle;
            this.MaximizeBox = false;

            btnHard = new Button
            {
                Text = "ТУГОЙ (R2)",
                Location = new System.Drawing.Point(60, 30),
                Size = new System.Drawing.Size(280, 45),
                BackColor = System.Drawing.Color.FromArgb(180, 0, 0),
                ForeColor = System.Drawing.Color.White,
                Font = new System.Drawing.Font("Segoe UI", 11, System.Drawing.FontStyle.Bold),
                FlatStyle = FlatStyle.Flat
            };
            btnHard.Click += async (s, e) => await SendTrigger(true);
            this.Controls.Add(btnHard);

            btnSoft = new Button
            {
                Text = "МЯГКИЙ (R2)",
                Location = new System.Drawing.Point(60, 85),
                Size = new System.Drawing.Size(280, 45),
                BackColor = System.Drawing.Color.FromArgb(0, 150, 0),
                ForeColor = System.Drawing.Color.White,
                Font = new System.Drawing.Font("Segoe UI", 11, System.Drawing.FontStyle.Bold),
                FlatStyle = FlatStyle.Flat
            };
            btnSoft.Click += async (s, e) => await SendTrigger(false);
            this.Controls.Add(btnSoft);

            lblStatus = new Label
            {
                Text = "Готово. ВЫКЛЮЧИ галочку → нажми кнопку!",
                Location = new System.Drawing.Point(60, 145),
                Size = new System.Drawing.Size(280, 30),
                TextAlign = System.Drawing.ContentAlignment.MiddleCenter,
                ForeColor = System.Drawing.Color.Blue,
                Font = new System.Drawing.Font("Segoe UI", 9)
            };
            this.Controls.Add(lblStatus);
        }

        private void InitUDP()
        {
            try
            {
                udp = new UdpClient();
                UpdateStatus("UDP: 127.0.0.1:20778 — ГОТОВ", System.Drawing.Color.Green);
            }
            catch (Exception ex)
            {
                UpdateStatus("UDP ошибка: " + ex.Message, System.Drawing.Color.Red);
            }
        }

        private async Task SendTrigger(bool hard)
        {
            if (udp == null) return;

            try
            {
                string json = hard
                    ? @"{""RightTriggerFeedback"":{""Mode"":1,""Force"":[0,255,0,0,0,0,0]},""LeftTriggerFeedback"":{""Mode"":0}}"
                    : @"{""RightTriggerFeedback"":{""Mode"":0},""LeftTriggerFeedback"":{""Mode"":0}}";

                byte[] data = Encoding.UTF8.GetBytes(json);
                await udp.SendAsync(data, data.Length, dsxEndPoint);

                UpdateStatus(hard ? "ТУГОЙ — ОТПРАВЛЕНО!" : "МЯГКИЙ — ОТПРАВЛЕНО!", System.Drawing.Color.Green);
            }
            catch (Exception ex)
            {
                UpdateStatus("Ошибка: " + ex.Message, System.Drawing.Color.Red);
            }
        }

        private void UpdateStatus(string text, System.Drawing.Color color)
        {
            if (lblStatus != null)
            {
                lblStatus.Text = text;
                lblStatus.ForeColor = color;
            }
        }

        protected override void OnFormClosed(FormClosedEventArgs e)
        {
            udp?.Dispose();
            base.OnFormClosed(e);
        }
    }
}