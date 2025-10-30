namespace DualSenseTriggerControl
{
    partial class Form1
    {
        // Убрано повторное объявление компонентов для Form1.cs
        private System.ComponentModel.IContainer components = null;


        #region Windows Form Designer generated code

        private void InitializeComponent()
        {
            this.btnHard = new System.Windows.Forms.Button();
            this.btnSoft = new System.Windows.Forms.Button();
            this.btnShot = new System.Windows.Forms.Button();
            this.btnReset = new System.Windows.Forms.Button();
            this.btnRumbleOn = new System.Windows.Forms.Button();
            this.btnRumbleOff = new System.Windows.Forms.Button();
            this.btnFriction = new System.Windows.Forms.Button();
            this.btnBow = new System.Windows.Forms.Button();
            this.btnFeedback = new System.Windows.Forms.Button();
            this.btnPulse = new System.Windows.Forms.Button();
            this.SuspendLayout();

            // Группа КУРКОВ (Колонка 1)
            this.btnHard.Location = new System.Drawing.Point(20, 20);
            this.btnHard.Name = "btnHard";
            this.btnHard.Size = new System.Drawing.Size(200, 30);
            this.btnHard.Text = "1. Const Force (Твердый)";
            this.btnHard.UseVisualStyleBackColor = true;
            this.btnHard.Click += new System.EventHandler(this.btnHard_Click);

            this.btnShot.Location = new System.Drawing.Point(20, 55);
            this.btnShot.Name = "btnShot";
            this.btnShot.Size = new System.Drawing.Size(200, 30);
            this.btnShot.Text = "2. Section (Выстрел)";
            this.btnShot.UseVisualStyleBackColor = true;
            this.btnShot.Click += new System.EventHandler(this.btnShot_Click);

            this.btnSoft.Location = new System.Drawing.Point(20, 90);
            this.btnSoft.Name = "btnSoft";
            this.btnSoft.Size = new System.Drawing.Size(200, 30);
            this.btnSoft.Text = "3. Vibrate (Пульсация)";
            this.btnSoft.UseVisualStyleBackColor = true;
            this.btnSoft.Click += new System.EventHandler(this.btnSoft_Click);

            this.btnFriction.Location = new System.Drawing.Point(20, 125);
            this.btnFriction.Name = "btnFriction";
            this.btnFriction.Size = new System.Drawing.Size(200, 30);
            this.btnFriction.Text = "4. Friction (Трение)";
            this.btnFriction.UseVisualStyleBackColor = true;
            this.btnFriction.Click += new System.EventHandler(this.btnFriction_Click);

            // Группа КУРКОВ (Колонка 2)
            this.btnBow.Location = new System.Drawing.Point(250, 20);
            this.btnBow.Name = "btnBow";
            this.btnBow.Size = new System.Drawing.Size(200, 30);
            this.btnBow.Text = "5. Bow (Тетива)";
            this.btnBow.UseVisualStyleBackColor = true;
            this.btnBow.Click += new System.EventHandler(this.btnBow_Click);

            this.btnFeedback.Location = new System.Drawing.Point(250, 55);
            this.btnFeedback.Name = "btnFeedback";
            this.btnFeedback.Size = new System.Drawing.Size(200, 30);
            this.btnFeedback.Text = "6. Feedback (Отдача)";
            this.btnFeedback.UseVisualStyleBackColor = true;
            this.btnFeedback.Click += new System.EventHandler(this.btnFeedback_Click);

            this.btnPulse.Location = new System.Drawing.Point(250, 90);
            this.btnPulse.Name = "btnPulse";
            this.btnPulse.Size = new System.Drawing.Size(200, 30);
            this.btnPulse.Text = "7. Loop Vibrate (Цикл. Вибро)";
            this.btnPulse.UseVisualStyleBackColor = true;
            this.btnPulse.Click += new System.EventHandler(this.btnPulse_Click);

            // КНОПКА СБРОСА
            this.btnReset.Location = new System.Drawing.Point(250, 125);
            this.btnReset.Name = "btnReset";
            this.btnReset.Size = new System.Drawing.Size(200, 30);
            this.btnReset.Text = "8. СБРОС КУРКОВ (Off)";
            this.btnReset.UseVisualStyleBackColor = true;
            this.btnReset.Click += new System.EventHandler(this.btnReset_Click);

            // Группа ВИБРАЦИИ
            this.btnRumbleOn.Location = new System.Drawing.Point(20, 190);
            this.btnRumbleOn.Name = "btnRumbleOn";
            this.btnRumbleOn.Size = new System.Drawing.Size(200, 30);
            this.btnRumbleOn.Text = "9. ВИБРО ВКЛ (Rumble On)";
            this.btnRumbleOn.UseVisualStyleBackColor = true;
            this.btnRumbleOn.Click += new System.EventHandler(this.btnRumbleOn_Click);

            this.btnRumbleOff.Location = new System.Drawing.Point(250, 190);
            this.btnRumbleOff.Name = "btnRumbleOff";
            this.btnRumbleOff.Size = new System.Drawing.Size(200, 30);
            this.btnRumbleOff.Text = "10. ВИБРО ВЫКЛ (Rumble Off)";
            this.btnRumbleOff.UseVisualStyleBackColor = true;
            this.btnRumbleOff.Click += new System.EventHandler(this.btnRumbleOff_Click);

            //
            // Form1
            //
            this.ClientSize = new System.Drawing.Size(470, 235);
            this.Controls.Add(this.btnRumbleOff);
            this.Controls.Add(this.btnRumbleOn);
            this.Controls.Add(this.btnReset);
            this.Controls.Add(this.btnPulse);
            this.Controls.Add(this.btnFeedback);
            this.Controls.Add(this.btnBow);
            this.Controls.Add(this.btnFriction);
            this.Controls.Add(this.btnSoft);
            this.Controls.Add(this.btnShot);
            this.Controls.Add(this.btnHard);
            this.Name = "Form1";
            this.Text = "DualSense Direct HID Tester (Final Attempt)";
            this.ResumeLayout(false);

        }

        #endregion
    }
}