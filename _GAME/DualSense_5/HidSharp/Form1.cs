namespace DualSenseTriggerControl
{
    partial class Form1
    {
        private System.ComponentModel.IContainer components = null;
        private System.Windows.Forms.Button btnHard;
        private System.Windows.Forms.Button btnSoft;
        private System.Windows.Forms.Button btnShot;
        private System.Windows.Forms.Button btnReset;
        private System.Windows.Forms.Button btnRumbleOn; // Новая кнопка
        private System.Windows.Forms.Button btnRumbleOff; // Новая кнопка


        #region Windows Form Designer generated code

        private void InitializeComponent()
        {
            this.btnHard = new System.Windows.Forms.Button();
            this.btnSoft = new System.Windows.Forms.Button();
            this.btnShot = new System.Windows.Forms.Button();
            this.btnReset = new System.Windows.Forms.Button();
            this.btnRumbleOn = new System.Windows.Forms.Button();
            this.btnRumbleOff = new System.Windows.Forms.Button();
            this.SuspendLayout();

            // КНОПКИ КУРКОВ
            this.btnHard.Location = new System.Drawing.Point(20, 20);
            this.btnHard.Name = "btnHard";
            this.btnHard.Size = new System.Drawing.Size(200, 40);
            this.btnHard.Text = "1. Твердый (Const Force)";
            this.btnHard.UseVisualStyleBackColor = true;
            this.btnHard.Click += new System.EventHandler(this.btnHard_Click);

            this.btnShot.Location = new System.Drawing.Point(20, 70);
            this.btnShot.Name = "btnShot";
            this.btnShot.Size = new System.Drawing.Size(200, 40);
            this.btnShot.Text = "2. Выстрел (Section Resistance)";
            this.btnShot.UseVisualStyleBackColor = true;
            this.btnShot.Click += new System.EventHandler(this.btnShot_Click);

            this.btnSoft.Location = new System.Drawing.Point(20, 120);
            this.btnSoft.Name = "btnSoft";
            this.btnSoft.Size = new System.Drawing.Size(200, 40);
            this.btnSoft.Text = "3. Пульсация (Continuous Vibrate)";
            this.btnSoft.UseVisualStyleBackColor = true;
            this.btnSoft.Click += new System.EventHandler(this.btnSoft_Click);

            // КНОПКИ ВИБРАЦИИ
            this.btnRumbleOn.Location = new System.Drawing.Point(250, 20);
            this.btnRumbleOn.Name = "btnRumbleOn";
            this.btnRumbleOn.Size = new System.Drawing.Size(200, 40);
            this.btnRumbleOn.Text = "5. ВИБРО ВКЛ (Rumble On)";
            this.btnRumbleOn.UseVisualStyleBackColor = true;
            this.btnRumbleOn.Click += new System.EventHandler(this.btnRumbleOn_Click);

            this.btnRumbleOff.Location = new System.Drawing.Point(250, 70);
            this.btnRumbleOff.Name = "btnRumbleOff";
            this.btnRumbleOff.Size = new System.Drawing.Size(200, 40);
            this.btnRumbleOff.Text = "6. ВИБРО ВЫКЛ (Rumble Off)";
            this.btnRumbleOff.UseVisualStyleBackColor = true;
            this.btnRumbleOff.Click += new System.EventHandler(this.btnRumbleOff_Click);

            // КНОПКА СБРОСА
            this.btnReset.Location = new System.Drawing.Point(20, 190);
            this.btnReset.Name = "btnReset";
            this.btnReset.Size = new System.Drawing.Size(430, 40);
            this.btnReset.Text = "4. СБРОС ВСЕГО (Off)";
            this.btnReset.UseVisualStyleBackColor = true;
            this.btnReset.Click += new System.EventHandler(this.btnReset_Click);

            //
            // Form1
            //
            this.ClientSize = new System.Drawing.Size(470, 250);
            this.Controls.Add(this.btnRumbleOff);
            this.Controls.Add(this.btnRumbleOn);
            this.Controls.Add(this.btnReset);
            this.Controls.Add(this.btnSoft);
            this.Controls.Add(this.btnShot);
            this.Controls.Add(this.btnHard);
            this.Name = "Form1";
            this.Text = "DualSense Tester (6 Buttons)";
            this.ResumeLayout(false);

        }

        #endregion
    }
}