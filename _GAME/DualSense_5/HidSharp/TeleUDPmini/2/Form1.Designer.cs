//Form1.Designer.cs

using TeleUDPmini;
namespace TeleUDPmini
{
    partial class Form1
    {
        private System.ComponentModel.IContainer components = null;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        private void InitializeComponent()
        {
            this._statusLabel = new System.Windows.Forms.Label();
            this._scrollPanel = new System.Windows.Forms.Panel();
            this._telemetryDataLabel = new System.Windows.Forms.Label();
            this.SuspendLayout();

            // _statusLabel
            this._statusLabel.AutoSize = true;
            this._statusLabel.Font = new System.Drawing.Font("Segoe UI", 11F, System.Drawing.FontStyle.Bold);
            this._statusLabel.ForeColor = System.Drawing.Color.Lime;
            this._statusLabel.Location = new System.Drawing.Point(10, 10);
            this._statusLabel.Name = "_statusLabel";
            this._statusLabel.Text = "Запуск...";

            // _scrollPanel
            this._scrollPanel.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom)
            | System.Windows.Forms.AnchorStyles.Left)
            | System.Windows.Forms.AnchorStyles.Right)));
            this._scrollPanel.AutoScroll = true;
            this._scrollPanel.BackColor = System.Drawing.Color.FromArgb(40, 40, 40);
            this._scrollPanel.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this._scrollPanel.Location = new System.Drawing.Point(10, 50);
            this._scrollPanel.Name = "_scrollPanel";
            this._scrollPanel.Size = new System.Drawing.Size(620, 390);

            // _telemetryDataLabel
            this._telemetryDataLabel.AutoSize = true;
            this._telemetryDataLabel.Font = new System.Drawing.Font("Consolas", 11F);
            this._telemetryDataLabel.ForeColor = System.Drawing.Color.Cyan;
            this._telemetryDataLabel.Location = new System.Drawing.Point(0, 0);
            this._telemetryDataLabel.Name = "_telemetryDataLabel";
            this._telemetryDataLabel.Text = "Ожидание данных...";
            this._scrollPanel.Controls.Add(this._telemetryDataLabel);

            // Form1
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.FromArgb(30, 30, 30);
            this.ClientSize = new System.Drawing.Size(650, 480);
            this.Controls.Add(this._scrollPanel);
            this.Controls.Add(this._statusLabel);
            this.ForeColor = System.Drawing.Color.White;
            this.Name = "Form1";
            this.Text = "Grid Legends Telemetry [LIVE]";
            this.ResumeLayout(false);
            this.PerformLayout();
        }

        private System.Windows.Forms.Label _statusLabel;
        private System.Windows.Forms.Panel _scrollPanel;
        private System.Windows.Forms.Label _telemetryDataLabel;
    }
}