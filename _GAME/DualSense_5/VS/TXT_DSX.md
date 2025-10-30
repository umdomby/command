```
using System;
using System.IO;
using System.Windows.Forms;

namespace DualSenseUDPApp
{
    public partial class Form1 : Form
    {
        private readonly string filePath = @"C:\Program Files (x86)\Steam\steamapps\common\DSX\DualSenseXConfig.txt";  // Измени на свой путь к DSX

        private Button? btnHard;
        private Button? btnSoft;
        private Label? lblStatus;

        public Form1()
        {
            InitializeMyComponents();
            EnsureFileExists();
        }

        private void InitializeMyComponents()
        {
            this.Text = "DSX Text File Control — v3.1.4 STEAM";
            this.Size = new System.Drawing.Size(420, 220);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedSingle;
            this.MaximizeBox = false;

            btnHard = new Button
            {
                Text = "ТУГОЙ (Rigid)",
                Location = new System.Drawing.Point(60, 30),
                Size = new System.Drawing.Size(280, 45),
                BackColor = System.Drawing.Color.FromArgb(180, 0, 0),
                ForeColor = System.Drawing.Color.White,
                Font = new System.Drawing.Font("Segoe UI", 11, System.Drawing.FontStyle.Bold),
                FlatStyle = FlatStyle.Flat,
                FlatAppearance = { BorderSize = 0 }
            };
            btnHard.Click += (s, e) => SetTrigger(true);
            this.Controls.Add(btnHard);

            btnSoft = new Button
            {
                Text = "МЯГКИЙ (Off)",
                Location = new System.Drawing.Point(60, 85),
                Size = new System.Drawing.Size(280, 45),
                BackColor = System.Drawing.Color.FromArgb(0, 150, 0),
                ForeColor = System.Drawing.Color.White,
                Font = new System.Drawing.Font("Segoe UI", 11, System.Drawing.FontStyle.Bold),
                FlatStyle = FlatStyle.Flat,
                FlatAppearance = { BorderSize = 0 }
            };
            btnSoft.Click += (s, e) => SetTrigger(false);
            this.Controls.Add(btnSoft);

            lblStatus = new Label
            {
                Text = "Готово. Нажми кнопку → DSX применит!",
                Location = new System.Drawing.Point(60, 145),
                Size = new System.Drawing.Size(280, 30),
                TextAlign = System.Drawing.ContentAlignment.MiddleCenter,
                ForeColor = System.Drawing.Color.Blue,
                Font = new System.Drawing.Font("Segoe UI", 9)
            };
            this.Controls.Add(lblStatus);
        }

        private void EnsureFileExists()
        {
            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(filePath)!);
                if (!File.Exists(filePath))
                    File.WriteAllText(filePath, "RightTrigger=Off");  // Базовое состояние
                UpdateStatus("Файл готов: " + filePath, System.Drawing.Color.Green);
            }
            catch (Exception ex)
            {
                UpdateStatus("Ошибка файла: " + ex.Message, System.Drawing.Color.Red);
            }
        }

        private void SetTrigger(bool hard)
        {
            try
            {
                string content;
                if (hard)
                {
                    // ТУГОЙ: Rigid с 7 зонами (0=start, 255=force, остальные 0)
                    content = "RightTrigger=Rigid ForceRightTrigger=(0)(255)(0)(0)(0)(0)(0)";
                }
                else
                {
                    // МЯГКИЙ: Off
                    content = "RightTrigger=Off";
                }

                File.WriteAllText(filePath, content);
                UpdateStatus(hard ? "ТУГОЙ отправлен! (Rigid 255)" : "МЯГКИЙ отправлен! (Off)", System.Drawing.Color.Green);
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
            base.OnFormClosed(e);
        }
    }
}
```