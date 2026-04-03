Install-Package Emgu.CV
Install-Package Emgu.CV.Bitmap          # ← это обязательно для ToBitmap()
Install-Package Emgu.CV.UI              # рекомендуется (но не обязательно)

```
using System;
using System.Drawing;
using System.Windows.Forms;
using Emgu.CV;
using Emgu.CV.Structure;

namespace picoCam_303C
{
    public partial class Form1 : Form
    {
        private VideoCapture? _capture;
        private Timer? _timer;

        // Настрой здесь свой URL и учётные данные
        private readonly string _rtspUrl = "rtsp://admin:admin@192.168.87.2:554/stream2"; // ← измени под себя

        public Form1()
        {
            InitializeComponent();

            // Создаём PictureBox для вывода изображения
            PictureBox pb = new PictureBox
            {
                Dock = DockStyle.Fill,
                SizeMode = PictureBoxSizeMode.Zoom
            };
            this.Controls.Add(pb);
            this.Text = "picoCam-303C 640x480";
            this.WindowState = FormWindowState.Maximized;

            _timer = new Timer { Interval = 30 }; // ~33 fps
            _timer.Tick += (s, e) => UpdateFrame(pb);

            StartCapture();
        }

        private void StartCapture()
        {
            try
            {
                _capture = new VideoCapture(_rtspUrl, VideoCapture.API.Any);
                _capture.Set(Emgu.CV.CvEnum.CapProp.FrameWidth, 640);
                _capture.Set(Emgu.CV.CvEnum.CapProp.FrameHeight, 480);

                _timer?.Start();
                MessageBox.Show("Подключение к камере запущено.\nЕсли картинки нет — проверь URL в VLC.");
            }
            catch (Exception ex)
            {
                MessageBox.Show("Ошибка подключения:\n" + ex.Message);
            }
        }

        private void UpdateFrame(PictureBox pb)
        {
            if (_capture == null) return;

            using Mat frame = _capture.QueryFrame();
            if (frame != null && !frame.IsEmpty)
            {
                pb.Image = frame.ToBitmap(); // конвертируем в Bitmap для отображения
            }
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            _timer?.Stop();
            _capture?.Dispose();
            base.OnFormClosing(e);
        }
    }
}
```