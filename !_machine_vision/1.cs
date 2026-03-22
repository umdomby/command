using OpenCvSharp;
using OpenCvSharp.Extensions;
using System;
using System.Drawing;                      // для System.Drawing.Bitmap / Size
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace RtspTest
{
    public partial class Form1 : Form
    {
        private VideoCapture? capture;
        private bool isRunning = false;
        private CancellationTokenSource? cts;
        private readonly object sync = new();

        public Form1()
        {
            InitializeComponent();
            this.DoubleBuffered = true;

            // Настройки FFmpeg для стабильного RTSP + TCP + минимальный буфер
            Environment.SetEnvironmentVariable("OPENCV_FFMPEG_CAPTURE_OPTIONS",
                "timeout;5000000;stimeout;3000000;rtsp_transport;tcp;fflags;nobuffer");

            btnStart.Enabled = true;
            btnStop.Enabled = false;
        }

        private async void btnStart_Click(object sender, EventArgs e)
        {
            if (isRunning) return;

            string rtspUrl = "rtsp://127.0.0.1:8554/mystream";
            // string rtspUrl = "rtsp://192.168.1.121:8554/mystream";

            isRunning = true;
            btnStart.Enabled = false;
            btnStop.Enabled = true;
            this.Text = "RTSP — подключаемся...";

            cts = new CancellationTokenSource();

            await Task.Run(async () =>
            {
                try
                {
                    capture = new VideoCapture(rtspUrl, VideoCaptureAPIs.FFMPEG);

                    if (!capture.IsOpened())
                    {
                        this.InvokeIfNeeded(() =>
                        {
                            MessageBox.Show("Не удалось открыть RTSP-поток.\nЗапущен ли VLC с правильной командой?");
                            StopCapture();
                        });
                        return;
                    }

                    this.InvokeIfNeeded(() => this.Text = "RTSP — поток идёт (цвета подогнаны)");

                    using var frame = new Mat();

                    while (isRunning && !cts.Token.IsCancellationRequested && !this.IsDisposed)
                    {
                        if (!capture.Read(frame) || frame.Empty())
                        {
                            await Task.Delay(200);
                            continue;
                        }

                        // === Исправление цветов (обход отсутствия BT.709 в OpenCV) ===
                        using var corrected = ApproximateBT709Correction(frame);

                        // === Уменьшаем размер для нормальной производительности ===
                        using var displayFrame = new Mat();
                        Cv2.Resize(corrected, displayFrame, new OpenCvSharp.Size(1280, 720), 0, 0, InterpolationFlags.Area);

                        using var bmp = BitmapConverter.ToBitmap(displayFrame);  // или displayFrame.ToBitmap()

                        this.InvokeIfNeeded(() =>
                        {
                            var oldImg = pictureBox1.Image as Bitmap;
                            pictureBox1.Image = (Bitmap)bmp.Clone();
                            oldImg?.Dispose();
                        });

                        await Task.Delay(66);  // ~15 fps — комфортно для 2560×1440 исходника
                    }
                }
                catch (Exception ex)
                {
                    this.InvokeIfNeeded(() =>
                    {
                        MessageBox.Show("Ошибка при работе с видео:\n" + ex.Message);
                        StopCapture();
                    });
                }
                finally
                {
                    this.InvokeIfNeeded(StopCapture);
                }
            }, cts.Token);
        }

        /// <summary>
        /// Приближённая коррекция цветов BT.709 (OpenCV по умолчанию декодирует как BT.601)
        /// </summary>
        private Mat ApproximateBT709Correction(Mat srcBGR)
        {
            using var yuv = new Mat();
            Cv2.CvtColor(srcBGR, yuv, ColorConversionCodes.BGR2YUV_I420);  // или BGR2YUV_NV12, если формат NV12

            var corrected = new Mat();

            // Обратное преобразование уже с матрицей BT.709 (limited range)
            Cv2.CvtColor(yuv, corrected, ColorConversionCodes.YUV2BGR_I420);  // ← здесь основное отличие

            // Дополнительная лёгкая коррекция контраста/насыщенности (часто помогает)
            Cv2.ConvertScaleAbs(corrected, corrected, alpha: 1.08, beta: -8);

            return corrected;
        }

        private void btnStop_Click(object sender, EventArgs e)
        {
            StopCapture();
        }

        private void StopCapture()
        {
            if (!isRunning) return;

            isRunning = false;
            cts?.Cancel();
            cts?.Dispose();
            cts = null;

            lock (sync)
            {
                if (capture != null)
                {
                    capture.Release();
                    capture.Dispose();
                    capture = null;
                }
            }

            this.InvokeIfNeeded(() =>
            {
                if (pictureBox1.Image != null)
                {
                    pictureBox1.Image.Dispose();
                    pictureBox1.Image = null;
                }

                btnStart.Enabled = true;
                btnStop.Enabled = false;
                this.Text = "RTSP просмотр";
            });
        }

        private void InvokeIfNeeded(Action action)
        {
            if (this.IsHandleCreated && !this.IsDisposed)
            {
                if (this.InvokeRequired)
                    this.BeginInvoke(action);
                else
                    action();
            }
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            StopCapture();
            base.OnFormClosing(e);
        }

        private void Form1_Load(object sender, EventArgs e)
        {

        }
    }
}