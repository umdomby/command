namespace FATEK_ENCODER
{
    partial class Form1
    {
        private System.ComponentModel.IContainer components = null;
        private System.Windows.Forms.Label lblIP, lblValue, lblDebug;
        private System.Windows.Forms.TextBox txtIP;
        private System.Windows.Forms.Button btnConnect;
        // 4 Кнопки управления
        private System.Windows.Forms.Button btnM0_12, btnM0_34, btnY0_12, btnY0_34;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null)) components.Dispose();
            base.Dispose(disposing);
        }

        private void InitializeComponent()
        {
            this.lblIP = new System.Windows.Forms.Label();
            this.txtIP = new System.Windows.Forms.TextBox();
            this.btnConnect = new System.Windows.Forms.Button();
            this.lblValue = new System.Windows.Forms.Label();
            this.lblDebug = new System.Windows.Forms.Label();

            this.btnM0_12 = new System.Windows.Forms.Button();
            this.btnM0_34 = new System.Windows.Forms.Button();
            this.btnY0_12 = new System.Windows.Forms.Button();
            this.btnY0_34 = new System.Windows.Forms.Button();

            // IP и Подключение
            lblIP.Text = "IP PLC:"; lblIP.Location = new Point(20, 20); lblIP.AutoSize = true;
            txtIP.Location = new Point(80, 17); txtIP.Size = new Size(120, 23);
            btnConnect.Text = "Connect"; btnConnect.Location = new Point(210, 15); btnConnect.Size = new Size(80, 30);
            btnConnect.Click += btnConnect_Click;

            // Значение энкодера
            lblValue.Text = "0"; lblValue.Location = new Point(20, 60);
            lblValue.Font = new Font("Consolas", 20, FontStyle.Bold); lblValue.AutoSize = true;

            // --- ГРУППА M0 ---
            btnM0_12.Text = "M0 (Force 1-2)\n[ СКОБКИ ]";
            btnM0_12.Location = new Point(20, 110); btnM0_12.Size = new Size(130, 50);
            btnM0_12.Click += btnM0_12_Click;

            btnM0_34.Text = "M0 (Set 3-4)\n[ КРАСНЫЙ ]";
            btnM0_34.Location = new Point(160, 110); btnM0_34.Size = new Size(130, 50);
            btnM0_34.Click += btnM0_34_Click;

            // --- ГРУППА Y0 ---
            btnY0_12.Text = "Y0 (Force 1-2)\n[ СКОБКИ ]";
            btnY0_12.Location = new Point(20, 170); btnY0_12.Size = new Size(130, 50);
            btnY0_12.Click += btnY0_12_Click;

            btnY0_34.Text = "Y0 (Set 3-4)\n[ КРАСНЫЙ ]";
            btnY0_34.Location = new Point(160, 170); btnY0_34.Size = new Size(130, 50);
            btnY0_34.Click += btnY0_34_Click;

            // Лог
            lblDebug.Location = new Point(20, 240); lblDebug.Size = new Size(270, 200);
            lblDebug.BackColor = Color.Black; lblDebug.ForeColor = Color.Lime;
            lblDebug.Font = new Font("Consolas", 8);

            this.ClientSize = new Size(310, 460);
            this.Controls.AddRange(new Control[] { lblIP, txtIP, btnConnect, lblValue, btnM0_12, btnM0_34, btnY0_12, btnY0_34, lblDebug });
            this.Text = "Fatek 4-Button Test";
        }
    }
}