namespace DualSenseTriggerControl
{
    partial class Form1
    {
        private System.ComponentModel.IContainer components = null;

        // Объявление всех нужных кнопок
        private System.Windows.Forms.Button btnHardR2;
        private System.Windows.Forms.Button btnFeedbackL2;
        private System.Windows.Forms.Button btnResetAll;
        private System.Windows.Forms.Button btnRumbleOn;
        private System.Windows.Forms.Button btnRumbleOff;
        private System.Windows.Forms.Button btnResetL2; // НОВОЕ
        private System.Windows.Forms.Button btnResetR2; // НОВОЕ

        #region Windows Form Designer generated code

        private void InitializeComponent()
        {
            // Инициализация кнопок
            this.btnFeedbackL2 = new System.Windows.Forms.Button();
            this.btnHardR2 = new System.Windows.Forms.Button();
            this.btnRumbleOn = new System.Windows.Forms.Button();
            this.btnRumbleOff = new System.Windows.Forms.Button();
            this.btnResetL2 = new System.Windows.Forms.Button(); // НОВОЕ
            this.btnResetR2 = new System.Windows.Forms.Button(); // НОВОЕ
            this.btnResetAll = new System.Windows.Forms.Button();

            this.SuspendLayout();

            // --- КУРОК L2 (Отдача) - Слева ---
            this.btnFeedbackL2.Location = new System.Drawing.Point(20, 30);
            this.btnFeedbackL2.Name = "btnFeedbackL2";
            this.btnFeedbackL2.Size = new System.Drawing.Size(200, 40);
            this.btnFeedbackL2.Text = "L2: Отдача (Feedback)";
            this.btnFeedbackL2.UseVisualStyleBackColor = true;
            this.btnFeedbackL2.Click += new System.EventHandler(this.btnFeedbackL2_Click);

            // --- КУРОК L2 (Отключить) ---
            this.btnResetL2.Location = new System.Drawing.Point(20, 75);
            this.btnResetL2.Name = "btnResetL2";
            this.btnResetL2.Size = new System.Drawing.Size(200, 30);
            this.btnResetL2.Text = "L2: Отключить";
            this.btnResetL2.UseVisualStyleBackColor = true;
            this.btnResetL2.Click += new System.EventHandler(this.btnResetL2_Click);

            // --- КУРОК R2 (Твердый) - Справа ---
            this.btnHardR2.Location = new System.Drawing.Point(340, 30);
            this.btnHardR2.Name = "btnHardR2";
            this.btnHardR2.Size = new System.Drawing.Size(200, 40);
            this.btnHardR2.Text = "R2: Твердый (Const Force)";
            this.btnHardR2.UseVisualStyleBackColor = true;
            this.btnHardR2.Click += new System.EventHandler(this.btnHardR2_Click);

            // --- КУРОК R2 (Отключить) ---
            this.btnResetR2.Location = new System.Drawing.Point(340, 75);
            this.btnResetR2.Name = "btnResetR2";
            this.btnResetR2.Size = new System.Drawing.Size(200, 30);
            this.btnResetR2.Text = "R2: Отключить";
            this.btnResetR2.UseVisualStyleBackColor = true;
            this.btnResetR2.Click += new System.EventHandler(this.btnResetR2_Click);


            // --- Вибрация - Центр ---
            this.btnRumbleOn.Location = new System.Drawing.Point(20, 130);
            this.btnRumbleOn.Name = "btnRumbleOn";
            this.btnRumbleOn.Size = new System.Drawing.Size(200, 30);
            this.btnRumbleOn.Text = "ВИБРО ВКЛ";
            this.btnRumbleOn.UseVisualStyleBackColor = true;
            this.btnRumbleOn.Click += new System.EventHandler(this.btnRumbleOn_Click);

            this.btnRumbleOff.Location = new System.Drawing.Point(340, 130);
            this.btnRumbleOff.Name = "btnRumbleOff";
            this.btnRumbleOff.Size = new System.Drawing.Size(200, 30);
            this.btnRumbleOff.Text = "ВИБРО ВЫКЛ";
            this.btnRumbleOff.UseVisualStyleBackColor = true;
            this.btnRumbleOff.Click += new System.EventHandler(this.btnRumbleOff_Click);

            // --- Сброс (По центру внизу) ---
            this.btnResetAll.Location = new System.Drawing.Point(180, 175);
            this.btnResetAll.Name = "btnResetAll";
            this.btnResetAll.Size = new System.Drawing.Size(200, 30);
            this.btnResetAll.Text = "СБРОС ВСЕГО (Reset)";
            this.btnResetAll.UseVisualStyleBackColor = true;
            this.btnResetAll.Click += new System.EventHandler(this.btnResetAll_Click);

            //
            // Form1
            //
            this.ClientSize = new System.Drawing.Size(560, 215);

            this.Controls.Add(this.btnFeedbackL2);
            this.Controls.Add(this.btnHardR2);
            this.Controls.Add(this.btnResetL2); // НОВОЕ
            this.Controls.Add(this.btnResetR2); // НОВОЕ
            this.Controls.Add(this.btnRumbleOn);
            this.Controls.Add(this.btnRumbleOff);
            this.Controls.Add(this.btnResetAll);

            this.Name = "Form1";
            this.Text = "DualSense Minimal Trigger + Rumble Control";
            this.ResumeLayout(false);

        }

        #endregion
    }
}