namespace DualSenseTriggerControl
{
    partial class Form1
    {
        private System.ComponentModel.IContainer components = null;

        // Объявление всех 18 кнопок
        private System.Windows.Forms.Button btnHardR2; private System.Windows.Forms.Button btnSoftR2;
        private System.Windows.Forms.Button btnShotR2; private System.Windows.Forms.Button btnResetR2;
        private System.Windows.Forms.Button btnFrictionR2; private System.Windows.Forms.Button btnBowR2;
        private System.Windows.Forms.Button btnFeedbackR2; private System.Windows.Forms.Button btnPulseR2;

        private System.Windows.Forms.Button btnHardL2; private System.Windows.Forms.Button btnSoftL2;
        private System.Windows.Forms.Button btnShotL2; private System.Windows.Forms.Button btnResetL2;
        private System.Windows.Forms.Button btnFrictionL2; private System.Windows.Forms.Button btnBowL2;
        private System.Windows.Forms.Button btnFeedbackL2; private System.Windows.Forms.Button btnPulseL2;

        private System.Windows.Forms.Button btnRumbleOn;
        private System.Windows.Forms.Button btnRumbleOff;

        #region Windows Form Designer generated code

        private void InitializeComponent()
        {
            // Инициализация кнопок L2
            this.btnHardL2 = new System.Windows.Forms.Button();
            this.btnSoftL2 = new System.Windows.Forms.Button();
            this.btnShotL2 = new System.Windows.Forms.Button();
            this.btnResetL2 = new System.Windows.Forms.Button();
            this.btnFrictionL2 = new System.Windows.Forms.Button();
            this.btnBowL2 = new System.Windows.Forms.Button();
            this.btnFeedbackL2 = new System.Windows.Forms.Button();
            this.btnPulseL2 = new System.Windows.Forms.Button();

            // Инициализация кнопок R2
            this.btnHardR2 = new System.Windows.Forms.Button();
            this.btnSoftR2 = new System.Windows.Forms.Button();
            this.btnShotR2 = new System.Windows.Forms.Button();
            this.btnResetR2 = new System.Windows.Forms.Button();
            this.btnFrictionR2 = new System.Windows.Forms.Button();
            this.btnBowR2 = new System.Windows.Forms.Button();
            this.btnFeedbackR2 = new System.Windows.Forms.Button();
            this.btnPulseR2 = new System.Windows.Forms.Button();

            // Инициализация кнопок Rumble
            this.btnRumbleOn = new System.Windows.Forms.Button();
            this.btnRumbleOff = new System.Windows.Forms.Button();

            this.SuspendLayout();

            // --- ГРУППА КУРКОВ L2 (Левый - Слева) ---
            // Колонка 1 (L2)
            this.btnHardL2.Location = new System.Drawing.Point(20, 20); this.btnHardL2.Name = "btnHardL2"; this.btnHardL2.Size = new System.Drawing.Size(200, 30); this.btnHardL2.Text = "L2: 1. Const Force (Твердый)"; this.btnHardL2.UseVisualStyleBackColor = true; this.btnHardL2.Click += new System.EventHandler(this.btnHardL2_Click);
            this.btnShotL2.Location = new System.Drawing.Point(20, 55); this.btnShotL2.Name = "btnShotL2"; this.btnShotL2.Size = new System.Drawing.Size(200, 30); this.btnShotL2.Text = "L2: 2. Section (Выстрел)"; this.btnShotL2.UseVisualStyleBackColor = true; this.btnShotL2.Click += new System.EventHandler(this.btnShotL2_Click);
            this.btnSoftL2.Location = new System.Drawing.Point(20, 90); this.btnSoftL2.Name = "btnSoftL2"; this.btnSoftL2.Size = new System.Drawing.Size(200, 30); this.btnSoftL2.Text = "L2: 3. Vibrate (Пульсация)"; this.btnSoftL2.UseVisualStyleBackColor = true; this.btnSoftL2.Click += new System.EventHandler(this.btnSoftL2_Click);
            this.btnFrictionL2.Location = new System.Drawing.Point(20, 125); this.btnFrictionL2.Name = "btnFrictionL2"; this.btnFrictionL2.Size = new System.Drawing.Size(200, 30); this.btnFrictionL2.Text = "L2: 4. Friction (Трение)"; this.btnFrictionL2.UseVisualStyleBackColor = true; this.btnFrictionL2.Click += new System.EventHandler(this.btnFrictionL2_Click);
            // Колонка 2 (L2)
            this.btnBowL2.Location = new System.Drawing.Point(250, 20); this.btnBowL2.Name = "btnBowL2"; this.btnBowL2.Size = new System.Drawing.Size(200, 30); this.btnBowL2.Text = "L2: 5. Bow (Тетива)"; this.btnBowL2.UseVisualStyleBackColor = true; this.btnBowL2.Click += new System.EventHandler(this.btnBowL2_Click);
            this.btnFeedbackL2.Location = new System.Drawing.Point(250, 55); this.btnFeedbackL2.Name = "btnFeedbackL2"; this.btnFeedbackL2.Size = new System.Drawing.Size(200, 30); this.btnFeedbackL2.Text = "L2: 6. Feedback (Отдача)"; this.btnFeedbackL2.UseVisualStyleBackColor = true; this.btnFeedbackL2.Click += new System.EventHandler(this.btnFeedbackL2_Click);
            this.btnPulseL2.Location = new System.Drawing.Point(250, 90); this.btnPulseL2.Name = "btnPulseL2"; this.btnPulseL2.Size = new System.Drawing.Size(200, 30); this.btnPulseL2.Text = "L2: 7. Loop Vibrate (Цикл. Вибро)"; this.btnPulseL2.UseVisualStyleBackColor = true; this.btnPulseL2.Click += new System.EventHandler(this.btnPulseL2_Click);
            this.btnResetL2.Location = new System.Drawing.Point(250, 125); this.btnResetL2.Name = "btnResetL2"; this.btnResetL2.Size = new System.Drawing.Size(200, 30); this.btnResetL2.Text = "L2: 8. СБРОС (Off)"; this.btnResetL2.UseVisualStyleBackColor = true; this.btnResetL2.Click += new System.EventHandler(this.btnResetL2_Click);

            // --- ГРУППА КУРКОВ R2 (Правый - Справа) ---
            // Колонка 3 (R2)
            this.btnHardR2.Location = new System.Drawing.Point(480, 20); this.btnHardR2.Name = "btnHardR2"; this.btnHardR2.Size = new System.Drawing.Size(200, 30); this.btnHardR2.Text = "R2: 1. Const Force (Твердый)"; this.btnHardR2.UseVisualStyleBackColor = true; this.btnHardR2.Click += new System.EventHandler(this.btnHardR2_Click);
            this.btnShotR2.Location = new System.Drawing.Point(480, 55); this.btnShotR2.Name = "btnShotR2"; this.btnShotR2.Size = new System.Drawing.Size(200, 30); this.btnShotR2.Text = "R2: 2. Section (Выстрел)"; this.btnShotR2.UseVisualStyleBackColor = true; this.btnShotR2.Click += new System.EventHandler(this.btnShotR2_Click);
            this.btnSoftR2.Location = new System.Drawing.Point(480, 90); this.btnSoftR2.Name = "btnSoftR2"; this.btnSoftR2.Size = new System.Drawing.Size(200, 30); this.btnSoftR2.Text = "R2: 3. Vibrate (Пульсация)"; this.btnSoftR2.UseVisualStyleBackColor = true; this.btnSoftR2.Click += new System.EventHandler(this.btnSoftR2_Click);
            this.btnFrictionR2.Location = new System.Drawing.Point(480, 125); this.btnFrictionR2.Name = "btnFrictionR2"; this.btnFrictionR2.Size = new System.Drawing.Size(200, 30); this.btnFrictionR2.Text = "R2: 4. Friction (Трение)"; this.btnFrictionR2.UseVisualStyleBackColor = true; this.btnFrictionR2.Click += new System.EventHandler(this.btnFrictionR2_Click);
            // Колонка 4 (R2)
            this.btnBowR2.Location = new System.Drawing.Point(710, 20); this.btnBowR2.Name = "btnBowR2"; this.btnBowR2.Size = new System.Drawing.Size(200, 30); this.btnBowR2.Text = "R2: 5. Bow (Тетива)"; this.btnBowR2.UseVisualStyleBackColor = true; this.btnBowR2.Click += new System.EventHandler(this.btnBowR2_Click);
            this.btnFeedbackR2.Location = new System.Drawing.Point(710, 55); this.btnFeedbackR2.Name = "btnFeedbackR2"; this.btnFeedbackR2.Size = new System.Drawing.Size(200, 30); this.btnFeedbackR2.Text = "R2: 6. Feedback (Отдача)"; this.btnFeedbackR2.UseVisualStyleBackColor = true; this.btnFeedbackR2.Click += new System.EventHandler(this.btnFeedbackR2_Click);
            this.btnPulseR2.Location = new System.Drawing.Point(710, 90); this.btnPulseR2.Name = "btnPulseR2"; this.btnPulseR2.Size = new System.Drawing.Size(200, 30); this.btnPulseR2.Text = "R2: 7. Loop Vibrate (Цикл. Вибро)"; this.btnPulseR2.UseVisualStyleBackColor = true; this.btnPulseR2.Click += new System.EventHandler(this.btnPulseR2_Click);
            this.btnResetR2.Location = new System.Drawing.Point(710, 125); this.btnResetR2.Name = "btnResetR2"; this.btnResetR2.Size = new System.Drawing.Size(200, 30); this.btnResetR2.Text = "R2: 8. СБРОС (Off)"; this.btnResetR2.UseVisualStyleBackColor = true; this.btnResetR2.Click += new System.EventHandler(this.btnResetR2_Click);

            // --- ГРУППА ВИБРАЦИИ (Общая) ---
            this.btnRumbleOn.Location = new System.Drawing.Point(365, 190); this.btnRumbleOn.Name = "btnRumbleOn"; this.btnRumbleOn.Size = new System.Drawing.Size(200, 30); this.btnRumbleOn.Text = "ВИБРО ВКЛ (Rumble On)"; this.btnRumbleOn.UseVisualStyleBackColor = true; this.btnRumbleOn.Click += new System.EventHandler(this.btnRumbleOn_Click);
            this.btnRumbleOff.Location = new System.Drawing.Point(365, 225); this.btnRumbleOff.Name = "btnRumbleOff"; this.btnRumbleOff.Size = new System.Drawing.Size(200, 30); this.btnRumbleOff.Text = "ВИБРО ВЫКЛ (Rumble Off)"; this.btnRumbleOff.UseVisualStyleBackColor = true; this.btnRumbleOff.Click += new System.EventHandler(this.btnRumbleOff_Click);

            //
            // Form1
            //
            this.ClientSize = new System.Drawing.Size(930, 275);
            this.Controls.Add(this.btnRumbleOff);
            this.Controls.Add(this.btnRumbleOn);

            // L2 Controls (Left side)
            this.Controls.Add(this.btnResetL2); this.Controls.Add(this.btnPulseL2);
            this.Controls.Add(this.btnFeedbackL2); this.Controls.Add(this.btnBowL2);
            this.Controls.Add(this.btnFrictionL2); this.Controls.Add(this.btnSoftL2);
            this.Controls.Add(this.btnShotL2); this.Controls.Add(this.btnHardL2);

            // R2 Controls (Right side)
            this.Controls.Add(this.btnResetR2); this.Controls.Add(this.btnPulseR2);
            this.Controls.Add(this.btnFeedbackR2); this.Controls.Add(this.btnBowR2);
            this.Controls.Add(this.btnFrictionR2); this.Controls.Add(this.btnSoftR2);
            this.Controls.Add(this.btnShotR2); this.Controls.Add(this.btnHardR2);

            this.Name = "Form1";
            this.Text = "DualSense Direct HID Controller (L2: Слева | R2: Справа)";
            this.ResumeLayout(false);

        }

        #endregion
    }
}