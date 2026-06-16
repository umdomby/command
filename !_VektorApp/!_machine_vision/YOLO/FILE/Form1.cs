using Emgu.CV;
using Emgu.CV.CvEnum;
using Emgu.CV.Structure;
using System;
using System.Collections.Concurrent;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Ports;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows.Forms;
using uEye;
using uEye.Defines;
using WeifenLuo.WinFormsUI.Docking;
using Color = System.Drawing.Color;
using DrawingSize = System.Drawing.Size;
using System.Threading;

namespace picoCam_303C
{
    public partial class Form1 : Form
    {
        private DeserializeDockContent? _deserializeDockContent = null;

        private SemaphoreSlim _aiSemaphore = new SemaphoreSlim(1, 1);
        private Task? _currentAiTask;
        private CancellationTokenSource? _aiCts;
        private Mat? _pendingFrameForAI;

        // === ПОДСВЕТКА ЗОН ПРИ ТРИГГЕРЕ ЭНКОДЕРА ===
        private Dictionary<Rectangle, Color> _originalZoneColors = new();
        private System.Windows.Forms.Timer? _redHighlightTimer = null;
        private System.Windows.Forms.Timer? _rejectTimer = null;
        private bool _isEncoderTriggeredHighlight = false;

        private long _lastRejectTriggerPos = 0; // для camera mode


        public RoiSelectionForm? _roiSelectionForm;
        private Dictionary<Rectangle, (string Label, float Confidence, Color Color, string ClassName)>? _lastZoneResults;

        private Dictionary<string, string> _lastZoneResultsForLog = new Dictionary<string, string>();
        private Dictionary<Rectangle, (string TableName, int ZoneIndex, string ClassName)> _zoneMetadata = new Dictionary<Rectangle, (string, int, string)>();

        private Thread? _aiThread;
        private bool _aiThreadRunning = true;
        private ConcurrentQueue<Mat> _aiFrameQueue = new ConcurrentQueue<Mat>();
        private readonly object _aiLock = new object();
        public bool IsLive => _isLive;
        public uEye.Camera? Camera => _cam;

        private double _lastAiFps = 0;
        private double _effectiveAiFps = 0;        // ← НОВОЕ
        private int _aiAnalysisCount = 0;          // ← НОВОЕ
        private Stopwatch _effectiveFpsStopwatch = new Stopwatch();  // ← НОВОЕ
        public long _lastTriggeredEncoderPos = 0;

        private List<RejectItem> _pendingRejects = new List<RejectItem>();

        public class RejectItem
        {
            public string ClassName { get; set; } = "";
            public long TriggerAtPos { get; set; }      // для режима по расстоянию
            public DateTime TriggerTime { get; set; }   // для режима по времени
            public bool IsTimeBased { get; set; }
            public int OriginalDelayMs { get; set; } = 0;  // для отладки
        }

        private System.Windows.Forms.Timer? _timeRejectTimer;
        private System.Windows.Forms.Timer? _queueUpdateTimer;
        public string _currentRejectClass = "";
        private readonly object _rejectLock = new object();
        private long _lastRejectDetectionPos = 0;
        private readonly Dictionary<long, DateTime> _lastRejectAddTime = new Dictionary<long, DateTime>();




        private MenuROI? _currentMenuROI;
        private System.Windows.Forms.Timer? _continuousSyntheticTimer;

        private uEye.Camera? _cam;
        private int _memId;
        private bool _isLive = false;
        public const string DefaultSettingsFile = "config_default.json";
        private string _savePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "camera-01");

        private Label _lblAIResult = new Label();
        private Button _btnToggleVideo = new Button();
        private Label _lblStatus = new Label();
        private ProgressBar _prbExpLoad = new ProgressBar();
        private System.Windows.Forms.Timer _timer = new System.Windows.Forms.Timer();

        private YoloInference? _ai;
        private string _currentModelPath = "";
        public string _currentTrainPath = "";   // временно public для удобства

        private bool _showVideo = true;
        private int _frameCounter = 0;
        private (string Label, float Confidence) _lastAIResult = ("WAITING", 0f);


        public EncoderReader _encoder = new EncoderReader();
        public bool IsAutoSnapEnabled { get; set; } = false;

        private bool _needAiProcessByEncoder = false;
        public long _lastTriggerUnit = 0;
        public long LastEncoderPosForTrigger { get; set; } = 0;

        // DockPanel и панели
        private SplitContainer _splitContainer = null!;
        private Panel _cameraViewPanel = null!;
        private DockPanel _dockPanel = null!;

        public PanelCamera _panelCamera = null!;
        public PanelTrigger _panelTrigger = null!;
        public PanelAIModel _panelAIModel = null!;
        public PanelSettings _panelSettings = null!;
        public PanelConsole _panelConsole = null!;

        private PictureBox _pictureBox = null!;

        public int TrainEpochs { get; set; } = 100;
        public int TrainBatchSize { get; set; } = 64;
        public int TrainImageSize { get; set; } = 320;
        public string TrainModelSize { get; set; } = "n";        // n, s, m
        public string TrainDevice { get; set; } = "0";           // "cpu" или "0"
        public int TrainWorkers { get; set; } = 8;

        private CheckBox _chkShowZones = null!;

        public string GetSavePath() => _savePath;

        public bool IsRealCaptureActive { get; set; } = false;
        public string RealCaptureClassName { get; set; } = "";
        public bool RealCaptureSaveToTrain { get; set; } = true;
        public bool RealCaptureSaveToVal { get; set; } = true;
        public int RealCaptureRemaining { get; set; } = 0;

        public int CurrentEncoderPosition { get; private set; } = 0;


        // === Непрерывный захват ===
        public bool IsContinuousCaptureActive { get; set; } = false;
        public string ContinuousCaptureClassName { get; set; } = "";
        public bool ContinuousSaveToTrain { get; set; } = true;
        public bool ContinuousSaveToVal { get; set; } = true;
        public bool UseCameraForContinuous { get; set; } = true;
        public int ContinuousFps { get; set; } = 15;
        public int ContinuousEncoderStep { get; set; } = 50;

        private System.Windows.Forms.Timer? _continuousCameraTimer;

        public bool IsRecording { get; private set; } = false;
        public string CurrentRecordPath { get; private set; } = "";
        private VideoWriter? _videoWriter;
        private string _recordFolder = "";

        private int _recordWidth = 0;   // ← новое
        private int _recordHeight = 0;  // ← новое


        // === МОНИТОРИНГ СЕТИ ===
        private PerformanceCounter? _netBytesCounter;
        private System.Windows.Forms.Timer _netTimer = new System.Windows.Forms.Timer();
        private Label _lblNetworkLoad = new Label();


        private int MaxDisplayFPS = 25;
        private readonly Stopwatch _displayStopwatch = new Stopwatch();
        private long _lastDisplayTicks = 0;

        private NumericUpDown _numMaxDisplayFPS = null!;

        private bool _continuousCaptureIsRoi = true;
        private Rectangle? _continuousCaptureRoi = null;
        private int _saveCounter = 0;

        private List<Rectangle> _continuousCaptureAllZones = new List<Rectangle>();
        private int _currentZoneIndex = 0;

        private int _aiAnalysisRate = 0;
        public int AiAnalysisRate
        {
            get => _aiAnalysisRate;
            set => _aiAnalysisRate = Math.Max(0, value);
        }
        private int _frameCounterForAI = 0;

        private System.Windows.Forms.Timer _aiResultTimer = null!;

        private Stopwatch _aiFpsStopwatch = new Stopwatch();

        // Статические переменные для сохранения последнего значения
        static double lastEffectiveFps = 0;
        static int analysisCount = 0;
        static Stopwatch effectiveStopwatch = new Stopwatch();

        private System.Windows.Forms.Timer? _aiTimer = null;
        private readonly object _aiBusyLock = new object();
        private int _aiProcessing = 0;
        public Form1()
        {
            InitializeComponent();

            LoadAppIcon();

            // === НОВОЕ: Коррекция позиции окна при запуске ===
            this.StartPosition = FormStartPosition.Manual;
            this.Load += Form1_Load_PositionFix;   // ← новый обработчик

            _timeRejectTimer = new System.Windows.Forms.Timer { Interval = 100 };
            _timeRejectTimer.Tick += TimeRejectTimer_Tick;
            _timeRejectTimer.Start();

            _queueUpdateTimer = new System.Windows.Forms.Timer { Interval = 50 };
            _queueUpdateTimer.Tick += QueueUpdateTimer_Tick;
            _queueUpdateTimer.Start();

            EnsureDirectories();
            BuildInterface();
            RefreshPorts();

            _deserializeDockContent = new DeserializeDockContent(GetContentFromPersistString);

            this.Shown += Form1_Shown;
            LoadSettings(DefaultSettingsFile);

            // ЗАПУСКАЕМ ПОТОК AI
            StartAiThread();

            this.Load += (s, e) =>
            {
                InitCamera((int)_panelCamera.NumW.Value, (int)_panelCamera.NumH.Value);
                if (File.Exists(_currentModelPath))
                    LoadAIModel(_currentModelPath, _currentTrainPath);
            };
        }

        private void LoadAppIcon()
        {
            try
            {
                string iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "img.ico");

                if (File.Exists(iconPath))
                {
                    this.Icon = new Icon(iconPath);
                    this.ShowIcon = true;
                    this.ShowInTaskbar = true;
                    System.Diagnostics.Debug.WriteLine($"Иконка успешно загружена: {iconPath}");
                }
                else
                {
                    System.Diagnostics.Debug.WriteLine("Файл img.ico не найден в папке запуска!");
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Ошибка загрузки иконки: " + ex.Message);
            }
        }

        private void Form1_Shown(object? sender, EventArgs e)
        {
            ConfigureDockPanels();
            _numMaxDisplayFPS.Value = MaxDisplayFPS;
            InitializeNetworkMonitor();
            PerformAutoConnectEncoder();
            _dockPanel.ActiveContentChanged += (s, ev) => AutoSave();


            // Таймер для отслеживания появления COM-порта (если порта нет)
            var portCheckTimer = new System.Windows.Forms.Timer { Interval = 3000 };
            portCheckTimer.Tick += (s, ev) =>
            {
                var settings = LoadSavedSettings();
                if (settings?.AutoConnectEncoder == true && !string.IsNullOrEmpty(settings.PortName))
                {
                    RefreshPorts();
                    if (_panelTrigger.CbPorts.Items.Cast<string>().Contains(settings.PortName))
                    {
                        if (!_encoder.IsOpen)
                        {
                            _panelTrigger.CbPorts.SelectedItem = settings.PortName;
                        }
                    }
                }
            };
            portCheckTimer.Start();

            Task.Delay(1200).ContinueWith(_ =>
            {
                this.BeginInvoke(new Action(() => AutoSave()));
            });

            this.BringToFront();
            this.Activate();
        }

        private void Form1_Load_PositionFix(object? sender, EventArgs e)
        {
            // Если форма слишком низко или за пределами экрана — поднимаем её
            Rectangle screen = Screen.FromControl(this).WorkingArea;

            int targetX = Math.Max(50, screen.Width / 2 - this.Width / 2);   // по центру по горизонтали
            int targetY = Math.Max(30, screen.Height / 2 - this.Height / 2); // немного выше центра

            // Если сохранённая позиция "уехала" вниз — сбрасываем
            if (this.Top > screen.Bottom - 100 || this.Top < -50)
            {
                this.Top = targetY;
                this.Left = targetX;
            }

            // Принудительно ставим в видимую область
            if (this.Top + this.Height > screen.Bottom)
                this.Top = screen.Bottom - this.Height - 50;

            if (this.Left + this.Width > screen.Right)
                this.Left = screen.Right - this.Width - 50;

            this.Refresh();
        }


        private CameraSettings? LoadSavedSettings()
        {
            try
            {
                if (!File.Exists(DefaultSettingsFile)) return null;

                var json = File.ReadAllText(DefaultSettingsFile);
                return JsonSerializer.Deserialize<CameraSettings>(json);
            }
            catch
            {
                return null;
            }
        }

        private void QueueUpdateTimer_Tick(object? sender, EventArgs e)
        {
            // Просто обновляем отображение очереди без проверки срабатываний
            if (_pendingRejects.Count > 0)
                _panelTrigger.UpdateRejectsQueue(_pendingRejects);
        }

        private void PerformAutoConnectEncoder()
        {
            Task.Delay(500).ContinueWith(_ =>
            {
                this.BeginInvoke(new Action(() =>
                {
                    RefreshPorts();

                    // БЕРЁМ ПОРТ ИЗ _panelTrigger (уже загружен из LoadSettings)
                    string savedPort = _panelTrigger.CbPorts.SelectedItem?.ToString() ?? "";

                    if (string.IsNullOrEmpty(savedPort))
                    {
                        _panelConsole?.Log("Нет сохранённого порта для автоподключения", "System");
                        return;
                    }

                    // Проверяем, существует ли порт в списке доступных
                    if (_panelTrigger.CbPorts.Items.Cast<string>().Contains(savedPort))
                    {
                        _panelConsole?.Log($"Автоподключение к порту {savedPort}...", "System");
                        btnConnect_Click(null, EventArgs.Empty);
                    }
                    else
                    {
                        _panelConsole?.Log($"Порт {savedPort} не найден. Ожидаем появления...", "System");
                    }
                }));
            });
        }

        private void EnsureDirectories()
        {
            string[] subDirs = { "train/normal", "train/anomaly", "val/normal", "val/anomaly" };
            foreach (var dir in subDirs)
            {
                string path = Path.Combine(_savePath, dir);
                if (!Directory.Exists(path)) Directory.CreateDirectory(path);
            }
        }

        private void BuildInterface()
        {
            this.BackColor = Color.FromArgb(30, 30, 30);
            this.Size = new System.Drawing.Size(1900, 1024);
            this.Text = "picoCam-303C Ethernet System";

            _splitContainer = new SplitContainer
            {
                Dock = DockStyle.Fill,
                SplitterDistance = (int)(this.Width * 0.5), // 50% от ширины формы
                SplitterWidth = 8,
                BackColor = Color.FromArgb(40, 40, 40)
            };
            this.Controls.Add(_splitContainer);
             
            // Левая часть — окно камеры
            _cameraViewPanel = new Panel { Dock = DockStyle.Fill, BackColor = Color.Black };
            _pictureBox = new PictureBox
            {
                Dock = DockStyle.Fill,
                SizeMode = PictureBoxSizeMode.Zoom,
                BackColor = Color.Black
            };

            var cameraTopBar = new Panel
            {
                Dock = DockStyle.Top,
                Height = 70,
                BackColor = Color.FromArgb(45, 45, 48),
                Padding = new Padding(8)
            };

            // ====================== ИНДИКАТОР ЗАГРУЗКИ СЕТИ ======================
            _lblNetworkLoad = new Label
            {
                Text = "Net: 0.0 Mbps (0% of 5G)",
                ForeColor = Color.Yellow,
                BackColor = Color.Black,
                Dock = DockStyle.Right,
                AutoSize = true,
                Font = new Font("Consolas", 9.5f, FontStyle.Bold),
                TextAlign = ContentAlignment.MiddleRight,
                Width = 240,
                Margin = new Padding(8, 0, 8, 0)
            };
            cameraTopBar.Controls.Add(_lblNetworkLoad);

            _btnToggleVideo = new Button
            {
                Text = "🙈 СКРЫТЬ ВИДЕО",
                Dock = DockStyle.Left,
                Width = 120,
                BackColor = Color.FromArgb(70, 70, 90),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 6.5f, FontStyle.Bold),
                // Добавьте эти строки:
                TextAlign = ContentAlignment.MiddleCenter,
                Padding = new Padding(0),
                Margin = new Padding(0)
            };
            _btnToggleVideo.Click += BtnToggleVideo_Click;

            _chkShowZones = new CheckBox
            {
                Text = "ROI зоны",
                Dock = DockStyle.Right,
                ForeColor = Color.White,
                BackColor = Color.FromArgb(45, 45, 48),
                Checked = true,  // ← ДОЛЖНО БЫТЬ true
                AutoSize = true,
                Font = new Font("Segoe UI", 9, FontStyle.Bold)
            };

            _lblAIResult = new Label
            {
                Text = "AI: WAITING",
                ForeColor = Color.Cyan,
                BackColor = Color.Transparent,
                Dock = DockStyle.Fill,
                Font = new Font("Consolas", 9.5f, FontStyle.Bold),
                TextAlign = ContentAlignment.MiddleCenter,
                AutoSize = false,
                Padding = new Padding(0, 25, 0, 0)
            };

            _lblStatus = new Label
            {
                ForeColor = Color.Chartreuse,
                Dock = DockStyle.Top,
                Text = "LIVE: 0x0",
                Font = new Font("Segoe UI", 9, FontStyle.Bold),
                Height = 25
            };

            _prbExpLoad = new ProgressBar { Dock = DockStyle.Top, Height = 8, Maximum = 100 };

            // === Максимальный FPS отображения ===
            _prbExpLoad = new ProgressBar
            {
                Dock = DockStyle.Top,
                Height = 8,
                Maximum = 100
            };

            // ====================== Disp FPS сразу справа от LIVE ======================
            var panelStatus = new Panel
            {
                Dock = DockStyle.Top,
                Height = 28,
                BackColor = Color.FromArgb(45, 45, 48),
                Padding = new Padding(8, 5, 8, 0)
            };

            _lblStatus = new Label
            {
                ForeColor = Color.Chartreuse,
                AutoSize = true,
                Font = new Font("Segoe UI", 9, FontStyle.Bold),
                Location = new Point(0, 4),
                Text = "LIVE: 0x0"
            };

            var lblMaxFps = new Label
            {
                Text = "   Disp FPS:",
                ForeColor = Color.White,
                BackColor = Color.Transparent,
                AutoSize = true,
                Font = new Font("Segoe UI", 9, FontStyle.Bold),
                Location = new Point(180, 4)   // сразу после LIVE
            };

            _numMaxDisplayFPS = new NumericUpDown
            {
                Minimum = 5,
                Maximum = 60,
                Value = MaxDisplayFPS,
                DecimalPlaces = 0,
                Increment = 1,
                Width = 58,
                Font = new Font("Consolas", 9.5f, FontStyle.Bold),
                BackColor = Color.FromArgb(30, 30, 30),
                ForeColor = Color.White,
                Location = new Point(265, 2)
            };

            _numMaxDisplayFPS.ValueChanged += (s, e) =>
            {
                MaxDisplayFPS = (int)_numMaxDisplayFPS.Value;
            };

            panelStatus.Controls.Add(_lblStatus);
            panelStatus.Controls.Add(lblMaxFps);
            panelStatus.Controls.Add(_numMaxDisplayFPS);

            // ====================== Добавление элементов ======================
            cameraTopBar.Controls.Add(_btnToggleVideo);     // слева
            cameraTopBar.Controls.Add(_chkShowZones);       // справа
            cameraTopBar.Controls.Add(_lblNetworkLoad);     // справа

            cameraTopBar.Controls.Add(panelStatus);         // LIVE + Disp FPS
            cameraTopBar.Controls.Add(_lblAIResult);        // AI по центру
            cameraTopBar.Controls.Add(_prbExpLoad);         // прогресс сверху

            _cameraViewPanel.Controls.Add(cameraTopBar);
            _cameraViewPanel.Controls.Add(_pictureBox);
            _splitContainer.Panel1.Controls.Add(_cameraViewPanel);

            // DockPanel
            _dockPanel = new DockPanel
            {
                Dock = DockStyle.Fill,
                DocumentStyle = DocumentStyle.DockingWindow,
                DocumentTabStripLocation = WeifenLuo.WinFormsUI.Docking.DocumentTabStripLocation.Top,  // ← вот это главное
                AllowEndUserDocking = true
            };
            _dockPanel.Theme = new WeifenLuo.WinFormsUI.Docking.VS2015BlueTheme();
            _splitContainer.Panel2.Controls.Add(_dockPanel);
            _dockPanel.ActiveDocumentChanged += (s, ev) => { };

            // Создаём панели
            _panelCamera = new PanelCamera(this);
            _panelTrigger = new PanelTrigger(this);
            _panelAIModel = new PanelAIModel(this);
            _panelSettings = new PanelSettings(this);
            _panelConsole = new PanelConsole(this);

            _timer.Interval = 10;
            _displayStopwatch.Start();
            _timer.Tick += (s, e) => UpdateFrame();

            _dockPanel.ActiveContentChanged += (s, e) => AutoSave();

            _aiResultTimer = new System.Windows.Forms.Timer { Interval = 33 }; // ~30 Гц
            _aiResultTimer.Tick += AiResultTimer_Tick;
            _aiResultTimer.Start();
        }

        private void AiResultTimer_Tick(object? sender, EventArgs e)
        {
            // Показываем статус AI если нет результатов
            if ((_lastZoneResults == null || _lastZoneResults.Count == 0) && _ai != null)
            {
                _lblAIResult.Text = $"AI: {_ai.ProviderStatus}";
                _lblAIResult.ForeColor = _ai.ProviderStatus.Contains("GPU") ? Color.Lime : Color.Yellow;
                return;
            }

            // Можно также обновлять цвет рамок зон на картинке, если хочешь
            // (но это уже сложнее — требует перерисовки PictureBox)
        }
        private IDockContent? GetContentFromPersistString(string persistString)
        {
            if (string.IsNullOrWhiteSpace(persistString))
                return null;

            return persistString switch
            {
                nameof(PanelCamera) or "picoCam_303C.PanelCamera" => _panelCamera,
                nameof(PanelTrigger) or "picoCam_303C.PanelTrigger" => _panelTrigger,
                nameof(PanelAIModel) or "picoCam_303C.PanelAIModel" => _panelAIModel,
                nameof(PanelSettings) or "picoCam_303C.PanelSettings" => _panelSettings,
                nameof(PanelConsole) or "picoCam_303C.PanelConsole" => _panelConsole,
                _ => null
            };
        }

        private void TimeRejectTimer_Tick(object? sender, EventArgs e)
        {
            if (_pendingRejects.Count > 0)
            {
                var first = _pendingRejects.FirstOrDefault(r => r.IsTimeBased);
                if (first != null)
                {
                    _panelConsole?.Log($"[DIAG] TimeRejectTimer работает, первый элемент: {first.ClassName}, IsTimeBased={first.IsTimeBased}, TriggerTime={first.TriggerTime:HH:mm:ss.fff}, now={DateTime.UtcNow:HH:mm:ss.fff}", "Reject");
                }
            }
            // Проверяем только временные задачи (IsTimeBased = true)
            if (_pendingRejects.Count == 0) return;

            var now = DateTime.UtcNow;
            bool anyTriggered = false;

            lock (_rejectLock)
            {
                for (int i = _pendingRejects.Count - 1; i >= 0; i--)
                {
                    var item = _pendingRejects[i];
                    if (item.IsTimeBased)
                    {
                        // Отладочный вывод в консоль
                        _panelConsole?.Log($"[DEBUG] Проверка: {item.ClassName} | TriggerTime={item.TriggerTime:HH:mm:ss.fff} | now={now:HH:mm:ss.fff} | diff={(item.TriggerTime - now).TotalMilliseconds:F0}мс", "Reject");

                        if (now >= item.TriggerTime)
                        {
                            SendRejectCommand();
                            _panelConsole?.Log($"[БРАК] СРАБОТАЛ по ВРЕМЕНИ → {item.ClassName}", "Reject");
                            _pendingRejects.RemoveAt(i);
                            anyTriggered = true;
                        }
                    }
                }
            }

            if (anyTriggered)
            {
                _panelTrigger.UpdateRejectsQueue(_pendingRejects);
            }
        }


        private void BtnToggleVideo_Click(object? sender, EventArgs e)
        {
            _showVideo = !_showVideo;
            _btnToggleVideo.Text = _showVideo ? "🙈 СКРЫТЬ ВИДЕО" : "👁️ ПОКАЗАТЬ ВИДЕО";
            _pictureBox.Visible = _showVideo;

            // Дополнительно: принудительно очищаем PictureBox при скрытии, чтобы освободить память
            if (!_showVideo)
            {
                this.Invoke(() =>
                {
                    var old = _pictureBox.Image;
                    _pictureBox.Image = null;
                    old?.Dispose();
                });
            }
        }

        public void RefreshPorts()
        {
            string savedPort = _panelTrigger.CbPorts.SelectedItem?.ToString() ?? "";

            _panelTrigger.CbPorts.Items.Clear();
            string[] ports = SerialPort.GetPortNames();
            _panelTrigger.CbPorts.Items.AddRange(ports);

            if (!string.IsNullOrEmpty(savedPort) && ports.Contains(savedPort))
                _panelTrigger.CbPorts.SelectedItem = savedPort;
            else if (ports.Length > 0)
                _panelTrigger.CbPorts.SelectedIndex = 0;
        }

        private void ConfigureDockPanels()
        {
            // Запрещаем закрытие панелей (только скрытие через меню)
            var panels = new DockContent[] { _panelCamera, _panelTrigger, _panelAIModel, _panelSettings, _panelConsole };

            foreach (var panel in panels)
            {
                panel.CloseButton = false;        // Убираем кнопку закрытия
                panel.CloseButtonVisible = false; // Скрываем кнопку закрытия
                panel.TabPageContextMenuStrip = null; // Убираем контекстное меню с Close

                // При попытке закрыть - отменяем и показываем обратно
                panel.FormClosing += (s, e) =>
                {
                    e.Cancel = true;
                    panel.Hide();
                };

                // При показе - показываем
                //panel.VisibleChanged += (s, e) =>
                //{
                //    if (panel.Visible && panel.DockHandler != null && panel.DockHandler.Pane != null)
                //        panel.DockHandler.Pane.Activate();
                //};
            }
        }

        public void btnConnect_Click(object? sender, EventArgs e)
        {
            // Всегда обновляем список портов
            RefreshPorts();

            string portName = _panelTrigger.CbPorts.SelectedItem?.ToString() ?? "";

            if (string.IsNullOrEmpty(portName))
            {
                MessageBox.Show("Выберите COM-порт из списка!", "Ошибка", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            if (_encoder.IsOpen)
            {
                // Отключение
                _encoder.Disconnect();
                _panelTrigger.UpdateEncoderButtonState(false);
                _panelTrigger.UpdateEncoderCheckboxState();
                _panelConsole.Log("Энкодер отключён", "Trigger");
            }
            else
            {
                // Подключение
                try
                {
                    _encoder.Connect(portName);

                    // Сохраняем порт в настройки
                    var settings = LoadSavedSettings() ?? new CameraSettings();
                    settings.PortName = portName;
                    SaveSettings(settings);   // нужно будет добавить этот метод ниже

                    _panelTrigger.UpdateEncoderButtonState(true);
                    _panelTrigger.UpdateEncoderCheckboxState();

                    _panelConsole.Log($"✅ Энкодер успешно подключён: {portName}", "Trigger");
                }
                catch (Exception ex)
                {
                    _panelConsole.Log($"❌ Ошибка подключения к {portName}: {ex.Message}", "Trigger");
                    MessageBox.Show($"Не удалось открыть порт {portName}\n\n{ex.Message}",
                        "Ошибка подключения", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }

            TriggerAutoSave();
        }

        private void SaveSettings(CameraSettings settings)
        {
            try
            {
                var options = new JsonSerializerOptions { WriteIndented = true };
                string json = JsonSerializer.Serialize(settings, options);
                File.WriteAllText(DefaultSettingsFile, json);
            }
            catch (Exception ex)
            {
                _panelConsole?.Log($"Ошибка сохранения настроек: {ex.Message}", "System");
            }
        }

        private void CheckRejectQueue()
        {
            if (_pendingRejects.Count == 0) return;

            long currentPos = CurrentEncoderPosition;
            bool anyTriggered = false;

            lock (_rejectLock)
            {
                for (int i = _pendingRejects.Count - 1; i >= 0; i--)
                {
                    var item = _pendingRejects[i];
                    // Только для энкодерных задач
                    if (!item.IsTimeBased)
                    {
                        long distance = Math.Abs(currentPos - item.TriggerAtPos);
                        if (distance >= (int)_panelTrigger.NumRejectionStep.Value)
                        {
                            SendRejectCommand();
                            _panelConsole?.Log($"[БРАК] СРАБОТАЛ по ЭНКОДЕРУ → {item.ClassName}", "Reject");
                            _pendingRejects.RemoveAt(i);
                            anyTriggered = true;
                        }
                    }
                }
            }

            if (anyTriggered)
                _panelTrigger.UpdateRejectsQueue(_pendingRejects);
        }


        private void TriggerByEncoder(int currentPos)
        {
            if (!_panelTrigger.ChkEncoder.Checked) return;

            int step = (int)_panelTrigger.NumStep.Value;
            if (step <= 0) return;

            long distance = Math.Abs((long)currentPos - _lastTriggeredEncoderPos);

            if (distance >= step)
            {
                _lastTriggeredEncoderPos = currentPos;

                _panelConsole.Log($"[Encoder Trigger] Pos: {currentPos} | Distance: {distance} | Шаг: {step}", "Trigger");

                HighlightZonesRed();

                if (_panelTrigger.SaveInspectionEnabled && !string.IsNullOrEmpty(_panelTrigger.InspectionSavePath))
                    SaveInspectionShot();

                if (IsAutoSnapEnabled)
                    SavePhoto();

                ForceAiAnalysisNow();

                // Браковщик теперь проверяется централизованно
            }
        }


        private void CheckAndExecuteRejects(int currentPos)
        {
            for (int i = _pendingRejects.Count - 1; i >= 0; i--)
            {
                var reject = _pendingRejects[i];
                long distance = Math.Abs((long)currentPos - reject.TriggerAtPos);

                if (distance >= (int)_panelTrigger.NumRejectionStep.Value)
                {
                    SendRejectCommand();
                    _panelConsole.Log($"[БРАК] СРАБОТАЛ: {reject.ClassName} | Расстояние: {distance} шагов (pos: {currentPos})", "Reject");
                    _pendingRejects.RemoveAt(i);
                }
            }

            _panelTrigger.UpdateRejectsQueue(_pendingRejects);
        }

        public void AddReject(long currentPos, string rejectClass)
        {
            if (string.IsNullOrEmpty(rejectClass) || _panelTrigger == null) return;

            bool encoderRejectEnabled = _panelTrigger.ChkEnableEncoderRejector.Checked;
            bool timeRejectEnabled = _panelTrigger.ChkUseTimeBasedReject.Checked;

            // Если оба выключены — выходим сразу
            if (!encoderRejectEnabled && !timeRejectEnabled) return;

            int antiSpamMs = (int)_panelTrigger.NumRejectAntiSpamMs.Value;

            lock (_rejectLock)
            {
                var now = DateTime.UtcNow;

                // 1. Обработка браковщика по ЭНКОДЕРУ
                if (encoderRejectEnabled)
                {
                    // Проверяем анти-спам именно для ЭНКОДЕРНЫХ записей этого класса
                    bool encoderSpam = _pendingRejects.Any(r =>
                        !r.IsTimeBased &&
                        r.ClassName == rejectClass &&
                        (now - r.TriggerTime).TotalMilliseconds < antiSpamMs);

                    if (!encoderSpam)
                    {
                        var encoderItem = new RejectItem
                        {
                            ClassName = rejectClass,
                            TriggerAtPos = currentPos,
                            TriggerTime = now, // Время постановки для анти-спама
                            IsTimeBased = false
                        };
                        _pendingRejects.Add(encoderItem);
                        _panelConsole?.Log($"[Reject] Добавлен в очередь (ЭНКОДЕР) → {rejectClass} (поз. {currentPos})", "Reject");
                    }
                }

                // 2. Обработка браковщика по ВРЕМЕНИ
                if (timeRejectEnabled)
                {
                    // Проверяем анти-спам именно для ВРЕМЕННЫХ записей этого класса
                    // (используем реальное текущее время для отсечки дребезга ИИ)
                    bool timeSpam = _pendingRejects.Any(r =>
                        r.IsTimeBased &&
                        r.ClassName == rejectClass &&
                        (now - (r.TriggerTime.AddMilliseconds(-(int)_panelTrigger.NumRejectDelayMs.Value))).TotalMilliseconds < antiSpamMs);

                    if (!timeSpam)
                    {
                        int delayMs = Math.Max(0, (int)_panelTrigger.NumRejectDelayMs.Value);

                        // Коррекция на время анализа ИИ
                        int aiAnalysisTimeMs = (int)_aiFpsStopwatch.ElapsedMilliseconds;
                        if (aiAnalysisTimeMs > 0 && aiAnalysisTimeMs < delayMs)
                        {
                            delayMs -= aiAnalysisTimeMs;
                        }

                        var timeItem = new RejectItem
                        {
                            ClassName = rejectClass,
                            TriggerAtPos = 0,
                            TriggerTime = DateTime.UtcNow.AddMilliseconds(delayMs),
                            IsTimeBased = true
                        };
                        _pendingRejects.Add(timeItem);
                        _panelConsole?.Log($"[Reject] Добавлен в очередь (ВРЕМЯ) → {rejectClass} (задержка {delayMs}мс)", "Reject");
                    }
                }
            }

            // Обновляем визуальное отображение очереди в UI
            _panelTrigger.UpdateRejectsQueue(_pendingRejects);
        }

        public void ClearTimeRejects()
        {
            lock (_rejectLock)
            {
                _pendingRejects.RemoveAll(r => r.IsTimeBased);
            }
            _panelTrigger.UpdateRejectsQueue(_pendingRejects);
            _panelConsole?.Log("Очередь временного брака очищена принудительно", "Reject");
        }


        private void SendRejectCommand()
        {
            if (_encoder?.IsOpen != true || _encoder._serialPort?.IsOpen != true)
            {
                _panelConsole?.Log("[Reject] Arduino не подключён", "Reject");
                return;
            }

            try
            {
                _encoder._serialPort.WriteLine("REJECT");
                _panelConsole?.Log("→ REJECT отправлен на ESP32", "Reject");
            }
            catch (Exception ex)
            {
                _panelConsole?.Log($"Ошибка отправки REJECT: {ex.Message}", "Reject");
            }
        }

        private void HighlightZonesRed()
        {
            if (_lastZoneResults == null)
                _lastZoneResults = new Dictionary<Rectangle, (string Label, float Confidence, Color Color, string ClassName)>();

            _originalZoneColors.Clear();
            _isEncoderTriggeredHighlight = true;

            var allZones = GetAllInspectionZones();

            foreach (var zone in allZones)
            {
                Rectangle r = zone.Rect;
                if (_lastZoneResults.TryGetValue(r, out var data))
                {
                    _originalZoneColors[r] = data.Color;
                    _lastZoneResults[r] = (data.Label, data.Confidence, Color.Red, data.ClassName);
                }
                else
                {
                    _lastZoneResults[r] = ("TRIGGER", 1f, Color.Red, zone.ClassName);
                }
            }

            // Таймер на возврат цвета
            if (_redHighlightTimer == null)
            {
                _redHighlightTimer = new System.Windows.Forms.Timer { Interval = 500 };
                _redHighlightTimer.Tick += (s, e) =>
                {
                    RestoreOriginalZoneColors();
                    _redHighlightTimer.Stop();
                };
            }
            _redHighlightTimer.Start();
        }

        private void RestoreOriginalZoneColors()
        {
            _isEncoderTriggeredHighlight = false;

            if (_lastZoneResults == null) return;

            foreach (var kv in _originalZoneColors)
            {
                if (_lastZoneResults.ContainsKey(kv.Key))
                {
                    var current = _lastZoneResults[kv.Key];
                    _lastZoneResults[kv.Key] = (current.Label == "TRIGGER" ? "OK" : current.Label,
                                               current.Confidence, kv.Value, current.ClassName);
                }
            }

            _originalZoneColors.Clear();
        }


        private void SavePhoto()
        {
            if (!_isLive || _cam == null) return;
            try
            {
                _cam.Memory.GetLast(out int id);
                _cam.Memory.Lock(id);
                _cam.Memory.Inquire(id, out int w, out int h, out _, out int p);
                _cam.Memory.ToIntPtr(out IntPtr ptr);

                using (Mat raw = new Mat(h, w, DepthType.Cv8U, 1, ptr, p))
                using (Mat color = new Mat())
                {
                    CvInvoke.CvtColor(raw, color, ColorConversion.BayerRg2Bgr);
                    using (Bitmap bmp = color.ToBitmap())
                    {
                        string name = $"snap_{DateTime.Now:HHmmss_fff}.jpg";
                        bmp.Save(Path.Combine(_savePath, name), System.Drawing.Imaging.ImageFormat.Jpeg);
                    }
                }
            }
            catch { }
            finally { _cam?.Memory.Unlock(_memId); }
        }

        public void ManualSaveConfig() { }
        public void ManualLoadConfig() { }

        public void SaveInspectionShot()
        {
            if (!_isLive || _cam == null || string.IsNullOrEmpty(_panelTrigger.InspectionSavePath))
                return;

            int id = 0;

            try
            {
                _cam.Memory.GetLast(out id);
                if (id == 0) return;

                _cam.Memory.Lock(id);
                _cam.Memory.Inquire(id, out int w, out int h, out _, out int p);
                _cam.Memory.ToIntPtr(out IntPtr ptr);

                using var raw = new Mat(h, w, DepthType.Cv8U, 1, ptr, p);
                using var color = new Mat();
                CvInvoke.CvtColor(raw, color, ColorConversion.BayerRg2Bgr);

                // === Рисуем зоны инспекции на кадре ===
                DrawZonesOnImage(color);

                // Сохраняем
                string fileName = $"inspect_{DateTime.Now:yyyyMMdd_HHmmss_fff}.jpg";
                string fullPath = Path.Combine(_panelTrigger.InspectionSavePath, fileName);

                CvInvoke.Imwrite(fullPath, color);

                _panelConsole?.Log($"✅ Снимок инспекции с зонами сохранён: {fileName}", "Capture");
            }
            catch (Exception ex)
            {
                _panelConsole?.Log($"Ошибка сохранения снимка: {ex.Message}", "Capture");
            }
            finally
            {
                if (id != 0)
                    _cam?.Memory.Unlock(id);
            }
        }

        private void DrawZonesOnImage(Mat image)
        {
            var zones = GetAllInspectionZones();  // или _lastZoneResults, если хочешь актуальные цвета

            foreach (var zone in zones)
            {
                Rectangle r = zone.Rect;
                if (r.Width <= 0 || r.Height <= 0) continue;

                // Красная рамка при триггере, иначе обычный цвет
                Color color = _isEncoderTriggeredHighlight ? Color.Red : zone.Color;

                var scalar = new MCvScalar(color.B, color.G, color.R);
                CvInvoke.Rectangle(image, r, scalar, 3);           // толщина рамки
                                                                   // Можно добавить полупрозрачную заливку:
                                                                   // CvInvoke.Rectangle(image, r, scalar, -1); // -1 = заливка
            }
        }


        public Bitmap? CaptureCurrentFrame()
        {
            if (!_isLive || _cam == null) return null;
            try
            {
                _cam.Memory.GetLast(out int id);
                if (id == 0) return null;

                _cam.Memory.Lock(id);
                _cam.Memory.Inquire(id, out int w, out int h, out _, out int p);
                _cam.Memory.ToIntPtr(out IntPtr ptr);

                using var raw = new Mat(h, w, DepthType.Cv8U, 1, ptr, p);
                using var color = new Mat();
                CvInvoke.CvtColor(raw, color, ColorConversion.BayerRg2Bgr);

                var bmp = color.ToBitmap();
                _cam.Memory.Unlock(id);
                return bmp;
            }
            catch
            {
                return null;
            }
        }

        public async void RunTrainingAsync(object? sender, EventArgs e)
        {
            if (_panelAIModel == null) return;

            // Вызываем новый публичный метод из PanelAIModel
            await _panelAIModel.RunTrainingAsync();
            }

        public void InitCamera(int width, int height)
        {
            try
            {
                _isLive = false; _timer.Stop();
                if (_cam == null) _cam = new uEye.Camera();
                if (_cam.IsOpened) _cam.Exit();

                if (_cam.Init(0) != Status.SUCCESS) return;

                int tw = (width / 8) * 8;
                int th = (height / 2) * 2;
                _cam.Size.AOI.Set((1936 - tw) / 2 & ~1, (1216 - th) / 2 & ~1, tw, th);
                _cam.PixelFormat.Set(ColorMode.SensorRaw8);
                _cam.Memory.Allocate(out _memId, true);

                _panelCamera.ApplyCameraSettings();

                _cam.Acquisition.Capture();
                _isLive = true;
                _timer.Start();
                _lblStatus.Text = $"LIVE: {tw}x{th}";
            }
            catch (Exception ex) { MessageBox.Show(ex.Message); }
        }

        public void SetGain(int v)
        {
            if (_cam?.IsOpened == true) _cam.Gain.Hardware.Scaled.SetMaster(v);
            _panelCamera.LblGainVal.Text = $"Gain: {v}";
        }

        /// <summary>
        /// Сохраняет изображение (полный кадр или ROI) в выбранную папку модели
        /// </summary>
        public void SaveTrainingImage(string className, bool isRoi, Rectangle? roiRect = null,
                                             bool saveToTrain = true, bool saveToVal = false)
        {
            string trainRoot = _panelAIModel?.CurrentTrainPath ?? _currentTrainPath;

            if (string.IsNullOrEmpty(trainRoot) || !Directory.Exists(trainRoot))
            {
                _panelConsole?.Log("SaveTrainingImage: Не выбрана папка модели!", "AI");
                return;
            }

            try
            {
                _cam.Memory.GetLast(out int id);
                _cam.Memory.Lock(id);
                _cam.Memory.Inquire(id, out int w, out int h, out _, out int p);
                _cam.Memory.ToIntPtr(out IntPtr ptr);

                using (Mat raw = new Mat(h, w, DepthType.Cv8U, 1, ptr, p))
                using (Mat color = new Mat())
                {
                    CvInvoke.CvtColor(raw, color, ColorConversion.BayerRg2Bgr);

                    Mat imageToSave;

                    if (isRoi && roiRect.HasValue && roiRect.Value.Width > 0 && roiRect.Value.Height > 0)
                    {
                        int x = Math.Max(0, roiRect.Value.X);
                        int y = Math.Max(0, roiRect.Value.Y);
                        int width = Math.Min(roiRect.Value.Width, color.Width - x);
                        int height = Math.Min(roiRect.Value.Height, color.Height - y);

                        if (width > 0 && height > 0)
                        {
                            imageToSave = new Mat(color, new Rectangle(x, y, width, height));
                        }
                        else
                        {
                            imageToSave = color.Clone();
                        }
                    }
                    else
                    {
                        imageToSave = color.Clone();
                    }

                    string fileName = $"real_{DateTime.Now:yyyyMMdd_HHmmss_fff}.jpg";

                    _saveCounter++;

                    // Логика сохранения
                    bool saveToValActual = false;
                    if (saveToVal && saveToTrain)
                    {
                        // Если выбраны оба - каждый 4-й в Val
                        saveToValActual = (_saveCounter % 4 == 0);
                    }
                    else if (saveToVal && !saveToTrain)
                    {
                        // Если только Val - все в Val
                        saveToValActual = true;
                    }

                    // Сохраняем в Train
                    if (saveToTrain)
                    {
                        string trainFolder = Path.Combine(trainRoot, "train", className);
                        Directory.CreateDirectory(trainFolder);
                        CvInvoke.Imwrite(Path.Combine(trainFolder, fileName), imageToSave);
                    }

                    // Сохраняем в Val
                    if (saveToValActual)
                    {
                        string valFolder = Path.Combine(trainRoot, "val", className);
                        Directory.CreateDirectory(valFolder);
                        CvInvoke.Imwrite(Path.Combine(valFolder, fileName), imageToSave);
                    }

                    if (imageToSave != color)
                        imageToSave.Dispose();
                }
            }
            catch (Exception ex)
            {
                _panelConsole?.Log($"Ошибка сохранения: {ex.Message}", "Capture");
            }
            finally
            {
                _cam?.Memory.Unlock(_memId);
            }
        }

        /// <summary>
        /// Запускает форму выделения ROI с правильным преобразованием координат
        /// </summary>
        public void StartROISelectionForTraining(Action<Rectangle> onSelected, Rectangle? preDefinedRoi = null,
                                                 string className = "", List<Rectangle> existingZones = null)
        {
            StopAiAnalysis();

            if (!_isLive || _cam == null)
            {
                MessageBox.Show("Камера должна быть запущена.", "Ошибка", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            _cam.Memory.GetLast(out int id);
            _cam.Memory.Inquire(id, out int w, out int h, out _, out _);
            System.Drawing.Size realImageSize = new System.Drawing.Size(w, h);

            var roiForm = new RoiSelectionForm(this, realImageSize, onSelected, preDefinedRoi, className, existingZones);
            roiForm.SetCurrentClass(className);
            roiForm.ShowDialog();
        }

        public void SetFrameRate(double v)
        {
            if (_cam?.IsOpened == true)
            {
                _cam.Timing.Framerate.Set(v);
                _cam.Timing.Framerate.Get(out double r);
                _panelCamera.LblFPSVal.Text = $"FPS: {r:F1}";

                // Обновляем потолок в панели триггера
                _panelTrigger.UpdateMaxAiFps(r);

                UpdateExpLoad();
            }
        }

        public void SetExposure(int v)
        {
            if (_cam?.IsOpened == true)
            {
                _cam.Timing.Exposure.Set(v);
                _cam.Timing.Exposure.Get(out double r);
                _panelCamera.LblExpVal.Text = $"Exp: {r:F2} ms";
                UpdateExpLoad();
            }
        }

        private void UpdateExpLoad()
        {
            if (_cam?.IsOpened != true) return;
            _cam.Timing.Framerate.Get(out double f);
            _cam.Timing.Exposure.Get(out double e);
            double max = 1000.0 / (f > 0 ? f : 1);
            _prbExpLoad.Value = (int)Math.Max(0, Math.Min(100, (e / max) * 100));
        }

        private void UpdateFrame()
        {
            if (!_isLive || _cam == null) return;

            try
            {
                _cam.Memory.GetLast(out int id);
                if (id == 0) return;

                _cam.Memory.Lock(id);
                _cam.Memory.Inquire(id, out int w, out int h, out _, out int p);
                _cam.Memory.ToIntPtr(out IntPtr ptr);

                using (Mat raw = new Mat(h, w, DepthType.Cv8U, 1, ptr, p))
                using (Mat color = new Mat())
                {
                    CvInvoke.CvtColor(raw, color, ColorConversion.BayerRg2Bgr);

                    // ====================== ЗАПИСЬ ВИДЕО ======================
                    if (IsRecording && _videoWriter != null)
                    {
                        if (color.Width == _recordWidth && color.Height == _recordHeight)
                            _videoWriter.Write(color);
                        else
                        {
                            using var resized = new Mat();
                            CvInvoke.Resize(color, resized, new DrawingSize(_recordWidth, _recordHeight));
                            _videoWriter.Write(resized);
                        }
                    }

                    // ====================== AI АНАЛИЗ С ПРОПУСКОМ КАДРОВ ======================
                    _frameCounterForAI++;

                    bool shouldAnalyze = false;

                    // Приоритет по энкодеру
                    if (_panelTrigger.ChkEncoder.Checked)
                    {
                        if (_needAiProcessByEncoder)
                        {
                            shouldAnalyze = true;
                            _needAiProcessByEncoder = false;
                        }
                    }
                    // Режим по камере с регулируемой частотой
                    else if (_panelTrigger.ChkCamera.Checked && _ai != null)
                    {
                        // 0 = каждый кадр, 1 = каждый 2-й, 5 = каждый 6-й и т.д.
                        shouldAnalyze = (_aiAnalysisRate <= 0) ||
                                       (_frameCounterForAI % (_aiAnalysisRate + 1) == 0);
                    }

                    if (shouldAnalyze && _ai != null)
                    {
                        var frameCopy = CaptureCurrentFrameAsMat();
                        if (frameCopy != null)
                        {
                            // Ограничиваем очередь, чтобы не копить старые кадры
                            while (_aiFrameQueue.Count > 3)
                            {
                                if (_aiFrameQueue.TryDequeue(out var old))
                                    old?.Dispose();
                            }

                            _aiFrameQueue.Enqueue(frameCopy);
                        }
                    }

                    // ====================== ОТРИСОВКА ЗОН НА КАДРЕ ======================
                    if (_showVideo && _panelAIModel != null && _chkShowZones.Checked)
                    {
                        var currentResults = _lastZoneResults;

                        if (currentResults != null)
                        {
                            foreach (var kv in currentResults)
                            {
                                Rectangle zoneRect = kv.Key;
                                var result = kv.Value;

                                if (zoneRect.Width > 0 && zoneRect.Height > 0)
                                {
                                    var colorScalar = new MCvScalar(result.Color.B, result.Color.G, result.Color.R);
                                    CvInvoke.Rectangle(color, zoneRect, colorScalar, 2);

                                    float threshold = _panelCamera.TrbThresh.Value / 100f;
                                    bool isNormal = result.Label.ToLower().Contains("normal");
                                    string displayText = result.Label;

                                    MCvScalar textColorScalar;
                                    if (result.Confidence >= threshold)
                                        textColorScalar = isNormal
                                            ? new MCvScalar(0, 255, 0)
                                            : new MCvScalar(0, 0, 255);
                                    else
                                        textColorScalar = new MCvScalar(128, 128, 128);

                                    int baseline = 0;
                                    var textSize = CvInvoke.GetTextSize(displayText, FontFace.HersheySimplex, 0.6, 2, ref baseline);

                                    int labelX = zoneRect.X;
                                    int labelY = zoneRect.Y - 5;
                                    if (labelY < 0) labelY = zoneRect.Y + 25;

                                    // Фон под текст
                                    CvInvoke.Rectangle(color,
                                        new Rectangle(labelX, labelY - textSize.Height - 2,
                                                      textSize.Width + 8, textSize.Height + 6),
                                        new MCvScalar(0, 0, 0), -1);

                                    // Основной текст
                                    CvInvoke.PutText(color, displayText,
                                        new Point(labelX + 4, labelY - 3),
                                        FontFace.HersheySimplex, 0.6,
                                        new MCvScalar(255, 255, 255), 2);

                                    // Цветной текст
                                    CvInvoke.PutText(color, displayText,
                                        new Point(labelX + 3, labelY - 4),
                                        FontFace.HersheySimplex, 0.6,
                                        textColorScalar, 1);
                                }
                            }
                        }
                    }

                    // ====================== ОТОБРАЖЕНИЕ КАДРА ======================
                    if (_showVideo)
                    {
                        long currentTicks = _displayStopwatch.ElapsedTicks;
                        long ticksPerFrame = (long)(Stopwatch.Frequency / Math.Max(1, MaxDisplayFPS));

                        if (currentTicks - _lastDisplayTicks >= ticksPerFrame)
                        {
                            _lastDisplayTicks = currentTicks;
                            Bitmap bmp = color.ToBitmap();

                            this.BeginInvoke((Action)(() =>
                            {
                                var old = _pictureBox.Image;
                                _pictureBox.Image = bmp;
                                old?.Dispose();
                            }));
                        }
                    }

                    _lblStatus.Text = $"LIVE: {w}×{h}";
                }
                //if (_ai != null)
                //{
                //    bool isCameraMode = _panelTrigger.ChkCamera.Checked;
                //    bool isTimerMode = _panelAIModel?.ChkTimerAI?.Checked == true;

                //    if (isCameraMode || isTimerMode)
                //    {
                //        CheckRejectQueue();
                //    }
                //}
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"UpdateFrame error: {ex.Message}");
            }
            finally
            {
                _cam?.Memory.Unlock(_memId);
                _frameCounter++;
            }
        }

        public void ForceAiAnalysisNow()
        {
            if (_ai == null || !_isLive) return;

            while (_aiFrameQueue.TryDequeue(out var old))
                old?.Dispose();

            var frame = CaptureCurrentFrameAsMat();
            if (frame != null && !frame.IsEmpty)
            {
                _aiFrameQueue.Enqueue(frame);
                _panelConsole?.Log("Force AI analysis triggered by encoder", "AI");
            }
        }

        private void InitializeNetworkMonitor()
        {
            try
            {
                var category = new PerformanceCounterCategory("Network Interface");
                var instances = category.GetInstanceNames();

                // Предпочитаем именно ваш Realtek
                string? instanceName = instances.FirstOrDefault(i =>
                    i.Contains("Realtek", StringComparison.OrdinalIgnoreCase))
                    ?? instances.FirstOrDefault(i =>
                    i.Contains("Ethernet", StringComparison.OrdinalIgnoreCase))
                    ?? instances.FirstOrDefault();

                if (!string.IsNullOrEmpty(instanceName))
                {
                    _netBytesCounter = new PerformanceCounter("Network Interface", "Bytes Total/sec", instanceName, true);
                    _panelConsole?.Log($"Сетевой монитор запущен: {instanceName}", "System");
                }
            }
            catch (Exception ex)
            {
                _panelConsole?.Log($"Не удалось инициализировать монитор сети: {ex.Message}", "System");
            }

            _netTimer.Interval = 1000;           // обновление 1 раз в секунду
            _netTimer.Tick += NetTimer_Tick;
            _netTimer.Start();
        }

        public void ClearRejectQueue()
        {
            lock (_rejectLock)
            {
                _pendingRejects.Clear();
            }
            _panelTrigger.UpdateRejectsQueue(_pendingRejects);
            _panelConsole?.Log("Очередь брака очищена", "Reject");
        }

        private void NetTimer_Tick(object? sender, EventArgs e)
        {
            if (_netBytesCounter == null) return;

            try
            {
                float bytesPerSec = _netBytesCounter.NextValue();
                double mbps = bytesPerSec * 8.0 / 1_000_000.0;           // Мбит/с
                double percentOf5G = Math.Min(100.0, (mbps / 5000.0) * 100.0);

                //string text = $"Net: {mbps:F1} Mbps ({percentOf5G:F1}% of 5G)";
                string text = $"Net: {mbps:F1}";

                this.Invoke((Action)(() =>
                {
                    _lblNetworkLoad.Text = text;

                    // Цветовая индикация
                    if (percentOf5G > 70) _lblNetworkLoad.ForeColor = Color.Red;
                    else if (percentOf5G > 40) _lblNetworkLoad.ForeColor = Color.Orange;
                    else _lblNetworkLoad.ForeColor = Color.Lime;
                }));
            }
            catch { }
        }

        public string[] GetClassesFromCurrentModel()
        {
            if (string.IsNullOrEmpty(_currentTrainPath) || !Directory.Exists(_currentTrainPath))
                return new[] { "anomaly", "normal" };

            string trainDir = Path.Combine(_currentTrainPath, "train");

            if (!Directory.Exists(trainDir))
                return new[] { "anomaly", "normal" };

            var excludedFolders = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "weights", "runs", ".git", "__pycache__"
            };

            return Directory.GetDirectories(trainDir)
                            .Where(dir => !excludedFolders.Contains(Path.GetFileName(dir)))
                            .Select(Path.GetFileName)
                            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)   // ← важно!
                            .ToArray();
        }

        private void AutoSave()
        {
            if (_dockPanel == null || _splitContainer == null) return;

            try
            {
                using var ms = new MemoryStream();
                _dockPanel.SaveAsXml(ms, Encoding.UTF8);
                ms.Position = 0;
                using var reader = new StreamReader(ms, Encoding.UTF8);
                string layoutXml = reader.ReadToEnd();

                var floatingSizes = new Dictionary<string, DrawingSize>();
                foreach (var content in _dockPanel.Contents)
                {
                    if (content.DockHandler?.DockState == DockState.Float && content.DockHandler.FloatPane != null)
                    {
                        floatingSizes[content.GetType().Name] = content.DockHandler.FloatPane.Size;
                    }
                }
                string floatingSizesJson = JsonSerializer.Serialize(floatingSizes);

               

                var s = new CameraSettings
                {
                    Gain = _panelCamera.TrbGain.Value,
                    FPS = _panelCamera.TrbFPS.Value,
                    Exposure = _panelCamera.TrbExposure.Value,
                    Threshold = _panelCamera.TrbThresh.Value,
                    Width = (int)_panelCamera.NumW.Value,
                    Height = (int)_panelCamera.NumH.Value,
                    PortName = _panelTrigger.CbPorts.SelectedItem?.ToString() ?? "",
                    EncoderStep = (int)_panelTrigger.NumStep.Value,
                    EncoderOffset = (int)_panelTrigger.NumEncoderOffset.Value,
                    UseEncoderForAi = _panelTrigger.ChkEncoder.Checked,
                    ShowInspectionZones = _chkShowZones.Checked,

                    AutoConnectEncoder = _encoder.IsOpen ||
                                        (LoadSavedSettings()?.AutoConnectEncoder == true && _encoder.IsOpen == false),

                    IsAutoSnapEnabled = IsAutoSnapEnabled,
                    LastModelPath = _currentModelPath,
                    LastTrainPath = _currentTrainPath,
                    AiAnalysisFPS = _aiAnalysisRate,
                    SplitterDistance = _splitContainer.SplitterDistance,
                    DockLayoutXml = layoutXml,
                    FloatingSizesJson = floatingSizesJson,

                    // Новые поля
                    LastTrainingInfo = _panelAIModel?.LblTrainingInfo?.Text ?? "Параметры обучения: —",
                    InferenceInputSize = Convert.ToInt32(_panelAIModel?.CbImageSize?.SelectedItem ?? 224),

                    TrainEpochs = Convert.ToInt32(_panelAIModel?.NumEpochsCombo.SelectedItem ?? 100),
                    TrainBatchSize = Convert.ToInt32(_panelAIModel?.NumBatchSizeCombo.SelectedItem ?? 64),
                    TrainImageSize = Convert.ToInt32(_panelAIModel?.CbImageSize.SelectedItem ?? 320),
                    TrainModelSize = _panelAIModel?.CbModelSize.SelectedIndex switch { 1 => "s", 2 => "m", _ => "n" },
                    TrainDevice = _panelAIModel?.CbDevice.SelectedIndex == 0 ? "cpu" : "0",
                    TrainWorkers = Convert.ToInt32(_panelAIModel?.NumWorkersCombo.SelectedItem ?? 8),
                    RejectionStep = (int)_panelTrigger.NumRejectionStep.Value,
                    RejectAntiSpamMs = _panelTrigger.NumRejectAntiSpamMs != null ? (int)_panelTrigger.NumRejectAntiSpamMs.Value : 800,
                    RejectClass = _panelTrigger.SelectedRejectClass,
                    UseEncoderForSynthetic = _panelAIModel?.MenuROI?.ChkEncoder?.Checked ?? false,
                    UseCameraForSynthetic = _panelAIModel?.MenuROI?.ChkCamera?.Checked ?? true,
                    SyntheticEncoderStep = (int)(_panelAIModel?.MenuROI?.NumEncoderStep?.Value ?? 10),
                    SyntheticCameraFps = (int)(_panelAIModel?.MenuROI?.NumCameraFps?.Value ?? 30),
                    MaxDisplayFPS = MaxDisplayFPS,
                };

                s.ConsoleLogCamera = _panelConsole?.ChkLogCamera?.Checked;
                s.ConsoleLogTrigger = _panelConsole?.ChkLogTrigger?.Checked;
                s.ConsoleLogAIModel = _panelConsole?.ChkLogAIModel?.Checked;
                s.MenuRoiSaveToTrain = _panelAIModel?.MenuROI?.ChkSaveToTrain?.Checked ?? true;
                s.MenuRoiSaveToVal = _panelAIModel?.MenuROI?.ChkSaveToVal?.Checked ?? false;
                s.UseEncoderForAiInspection = _panelAIModel.ChkEncoderAI.Checked;
                s.UseCameraForAiInspection = _panelAIModel.ChkCameraAI.Checked;
                s.UseGPU = _panelAIModel?.ChkUseGPU?.Checked ?? true;
                s.SaveInspectionShots = _panelTrigger.SaveInspectionEnabled;
                s.InspectionSavePath = _panelTrigger.InspectionSavePath;
                s.EnableRejector = _panelTrigger.ChkEnableEncoderRejector.Checked;
                s.UseTimeBasedReject = _panelTrigger.ChkUseTimeBasedReject.Checked;
                s.RejectDelayMs = (int)_panelTrigger.NumRejectDelayMs.Value;
                s.RejectionStep = (int)_panelTrigger.NumRejectionStep.Value;
                s.RejectAntiSpamMs = (int)_panelTrigger.NumRejectAntiSpamMs.Value;
                s.RejectClass = _panelTrigger.SelectedRejectClass;
                File.WriteAllText(DefaultSettingsFile, JsonSerializer.Serialize(s, new JsonSerializerOptions { WriteIndented = true }));
            }
            catch { }
        }

        public void TriggerAutoSave() => AutoSave();

        public void SaveSettingsToFile(string filePath)
        {
            if (_dockPanel == null || _splitContainer == null) return;

            try
            {
                using var ms = new MemoryStream();
                _dockPanel.SaveAsXml(ms, Encoding.UTF8);
                ms.Position = 0;
                using var reader = new StreamReader(ms, Encoding.UTF8);
                string layoutXml = reader.ReadToEnd();

                var s = new CameraSettings
                {
                    Gain = _panelCamera.TrbGain.Value,
                    FPS = _panelCamera.TrbFPS.Value,
                    Exposure = _panelCamera.TrbExposure.Value,
                    Threshold = _panelCamera.TrbThresh.Value,
                    Width = (int)_panelCamera.NumW.Value,
                    Height = (int)_panelCamera.NumH.Value,
                    PortName = _panelTrigger.CbPorts.SelectedItem?.ToString() ?? "",
                    EncoderStep = (int)_panelTrigger.NumStep.Value,
                    EncoderOffset = (int)_panelTrigger.NumEncoderOffset.Value,
                    UseEncoderForAi = _panelTrigger.ChkEncoder.Checked,

                    AutoConnectEncoder = _encoder.IsOpen ||
                                        (LoadSavedSettings()?.AutoConnectEncoder == true && !_encoder.IsOpen),

                    IsAutoSnapEnabled = IsAutoSnapEnabled,
                    LastModelPath = _currentModelPath,
                    LastTrainPath = _currentTrainPath,
                    AiAnalysisFPS = _aiAnalysisRate,
                    SplitterDistance = _splitContainer.SplitterDistance,
                    DockLayoutXml = layoutXml
                };

                File.WriteAllText(filePath, JsonSerializer.Serialize(s, new JsonSerializerOptions { WriteIndented = true }));
            }
            catch (Exception ex)
            {
                MessageBox.Show("Ошибка сохранения: " + ex.Message);
            }
        }

        // Метод для логирования только изменений
        private void LogZoneChange(string className, Rectangle zoneRect, string newLabel, float confidence)
        {
            // Получаем или создаём метаданные для зоны
            if (!_zoneMetadata.ContainsKey(zoneRect))
            {
                string tableName = "Одиночная зона";
                int zoneIndex = 1;

                // Пытаемся определить таблицу из PanelAIModel (data.json)
                if (_panelAIModel != null)
                {
                    var zonesDict = _panelAIModel.GetInspectionZones();
                    int tableCounter = 1;
                    int zoneCounter = 1;
                    string currentTableClass = "";

                    foreach (var kv in zonesDict)
                    {
                        if (kv.Key != className) continue;

                        // Группируем зоны по их положению (признак таблицы - зоны на одной линии)
                        var sortedZones = kv.Value.OrderBy(z => z.Rect.X).ToList();
                        int lastY = -1;
                        int currentTableZones = 0;

                        for (int i = 0; i < sortedZones.Count; i++)
                        {
                            var zone = sortedZones[i];
                            if (zone.Rect == zoneRect)
                            {
                                if (Math.Abs(zone.Rect.Y - lastY) < 50 && currentTableZones > 0)
                                {
                                    // Это зона в текущей таблице
                                    zoneIndex = currentTableZones + 1;
                                    tableName = $"Таблица {tableCounter}";
                                }
                                else
                                {
                                    // Новая таблица
                                    tableName = $"Таблица {tableCounter}";
                                    zoneIndex = 1;
                                }
                                break;
                            }

                            if (Math.Abs(zone.Rect.Y - lastY) > 50 && lastY != -1)
                            {
                                tableCounter++;
                                currentTableZones = 0;
                            }
                            lastY = zone.Rect.Y;
                            currentTableZones++;
                        }
                    }
                }

                _zoneMetadata[zoneRect] = (tableName, zoneIndex, className);
            }

            var metadata = _zoneMetadata[zoneRect];
            string zoneUniqueId = $"{metadata.TableName}_{metadata.ZoneIndex}_{className}";

            if (_lastZoneResultsForLog.TryGetValue(zoneUniqueId, out string? lastLabel))
            {
                if (lastLabel != newLabel)
                {
                    _panelConsole?.Log($"[{metadata.TableName} Зона {metadata.ZoneIndex}] Класс '{className}' → {newLabel} ({confidence:P0})", "Camera");
                    _lastZoneResultsForLog[zoneUniqueId] = newLabel;
                }
            }
            else
            {
                _panelConsole?.Log($"[{metadata.TableName} Зона {metadata.ZoneIndex}] Класс '{className}' → {newLabel} ({confidence:P0})", "Camera");
                _lastZoneResultsForLog[zoneUniqueId] = newLabel;
            }
        }

        // Вспомогательный метод для получения таблиц из RoiSelectionForm
        private System.Collections.IList? GetGridTablesFromRoiForm()
        {
            if (_roiSelectionForm == null) return null;

            var field = _roiSelectionForm.GetType().GetField("_gridTables",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            return field?.GetValue(_roiSelectionForm) as System.Collections.IList;
        }

        public void LoadSettings(string path)
        {
            if (!File.Exists(path))
            {
                RestoreDefaultLayout();
                AutoSave();
                return;
            }

            try
            {
                var json = File.ReadAllText(path);
                var s = JsonSerializer.Deserialize<CameraSettings>(json);
                if (s == null)
                {
                    RestoreDefaultLayout();
                    return;
                }

                // Обычные настройки
                _panelCamera.LoadSettings(s);
                _panelTrigger.LoadSettings(s);
                _currentRejectClass = _panelTrigger.SelectedRejectClass;
                if (_panelAIModel != null)
                {
                    _panelAIModel.ChkEncoderAI.Checked = s.UseEncoderForAiInspection;
                    _panelAIModel.ChkCameraAI.Checked = s.UseCameraForAiInspection;
                }
                SyncAiToTriggerCheckboxes();
                _panelTrigger.RefreshState();
                _panelTrigger.UpdateMaxAiFps(s.FPS);

                // Сохраняем чекбоксы PanelConsole
                if (_panelConsole != null && s.ConsoleLogCamera != null)
                {
                    _panelConsole.ChkLogCamera.Checked = s.ConsoleLogCamera ?? true;
                    _panelConsole.ChkLogTrigger.Checked = s.ConsoleLogTrigger ?? true;
                    _panelConsole.ChkLogAIModel.Checked = s.ConsoleLogAIModel ?? true;
                }

                _aiAnalysisRate = s.AiAnalysisFPS;
                IsAutoSnapEnabled = s.IsAutoSnapEnabled;
                _currentModelPath = s.LastModelPath ?? "";
                _currentTrainPath = s.LastTrainPath ?? "";
                if (_panelAIModel != null && !string.IsNullOrEmpty(_currentTrainPath))
                {
                    _panelAIModel.CurrentTrainPath = _currentTrainPath;
                    _panelAIModel.EnsureAndLoadDataJson();           // ← важно
                    _panelAIModel.RefreshTrainPathDisplay();
                    _panelAIModel.RefreshTreeView();
                    _panelAIModel.RefreshInspectionClasses();
                }
                _panelTrigger.CbRejectClass.SelectedItem = s.RejectClass;

                if (_panelAIModel != null)
                    _panelAIModel.SetModelAndTrainPath(_currentModelPath, _currentTrainPath);

                if (_panelAIModel != null && s != null)
                {
                    _panelAIModel.LoadTrainingSettings(s);
                    if (!string.IsNullOrEmpty(s.LastTrainingInfo))
                    {
                        _panelAIModel.LblTrainingInfo.Text = s.LastTrainingInfo;
                    }
                }

                if (_chkShowZones != null)
                    _chkShowZones.Checked = s.ShowInspectionZones;

                if (_panelAIModel?.MenuROI != null && s != null)
                {
                    _panelAIModel.MenuROI.ChkEncoder.Checked = s.UseEncoderForSynthetic;
                    _panelAIModel.MenuROI.ChkCamera.Checked = s.UseCameraForSynthetic;
                    _panelAIModel.MenuROI.NumEncoderStep.Value = s.SyntheticEncoderStep;
                    _panelAIModel.MenuROI.NumCameraFps.Value = s.SyntheticCameraFps;

                    // Сохраняем чекбоксы Train/Val
                    _panelAIModel.MenuROI.ChkSaveToTrain.Checked = s.MenuRoiSaveToTrain;
                    _panelAIModel.MenuROI.ChkSaveToVal.Checked = s.MenuRoiSaveToVal;
                }

                _panelTrigger.RefreshState();

                // === ГЛАВНОЕ: СНАЧАЛА ОЧИЩАЕМ, ПОТОМ ЗАГРУЖАЕМ XML ===
                foreach (var content in _dockPanel.Contents.ToArray())
                {
                    if (content.DockHandler?.DockPanel != null)
                        content.DockHandler.DockPanel = null;
                }

                if (!string.IsNullOrWhiteSpace(s.DockLayoutXml))
                {
                    try
                    {
                        _deserializeDockContent ??= new DeserializeDockContent(GetContentFromPersistString);
                        using var ms = new MemoryStream(Encoding.UTF8.GetBytes(s.DockLayoutXml));
                        _dockPanel.LoadFromXml(ms, _deserializeDockContent);
                    }
                    catch
                    {
                        RestoreDefaultLayout();
                    }
                }
                else
                {
                    RestoreDefaultLayout();
                }

                // Восстанавливаем размеры плавающих окон
                if (!string.IsNullOrWhiteSpace(s.FloatingSizesJson) && s.FloatingSizesJson != "{}")
                {
                    try
                    {
                        var sizes = JsonSerializer.Deserialize<Dictionary<string, DrawingSize>>(s.FloatingSizesJson);
                        if (sizes != null)
                        {
                            foreach (var content in _dockPanel.Contents)
                            {
                                if (content.DockHandler?.DockState == DockState.Float &&
                                    sizes.TryGetValue(content.GetType().Name, out var size) &&
                                    content.DockHandler.FloatPane != null)
                                {
                                    content.DockHandler.FloatPane.Size = size;
                                }
                            }
                        }
                    }
                    catch { }
                }

                if (s.SplitterDistance > 100 && s.SplitterDistance < this.Width - 100)
                {
                    _splitContainer.SplitterDistance = s.SplitterDistance;
                }

                if (s.MaxDisplayFPS >= 5 && s.MaxDisplayFPS <= 60)
                {
                    MaxDisplayFPS = s.MaxDisplayFPS;
                    if (_numMaxDisplayFPS != null)
                        _numMaxDisplayFPS.Value = MaxDisplayFPS;
                }

                if (_panelAIModel != null && s != null)
                {
                    _panelAIModel.ChkUseGPU.Checked = s.UseGPU;
                }

                if (_panelAIModel != null)
                {
                    _panelAIModel.ChkTimerAI.Checked = s.UseTimerForAi;
                    _panelAIModel.NumAiTimerInterval.Value = s.AiTimerIntervalMs;
                }
            }
            catch
            {
                RestoreDefaultLayout();
            }
        }

        public void ClearZoneLog()
        {
            _lastZoneResultsForLog.Clear();
            _zoneMetadata.Clear();
            _panelConsole?.Log("--- Очищен лог зон, загружена новая модель ---", "Camera");
        }
        public void RestoreDefaultLayout()
        {
            foreach (var content in _dockPanel.Contents.ToArray())
            {
                if (content.DockHandler?.DockPanel != null)
                    content.DockHandler.DockPanel = null;
            }

            // Показываем все панели (если были скрыты)
            _panelCamera.Show(_dockPanel, DockState.DockRight);
            _panelTrigger.Show(_dockPanel, DockState.DockRight);
            _panelAIModel.Show(_dockPanel, DockState.DockRight);
            _panelSettings.Show(_dockPanel, DockState.DockRight);
            _panelConsole.Show(_dockPanel, DockState.DockRight);

            // Активируем первую
            if (_dockPanel.Contents.Count > 0)
                _dockPanel.Contents[0].DockHandler.Activate();

            // Восстанавливаем размер SplitContainer (50%/50%)
            _splitContainer.SplitterDistance = (int)(this.Width * 0.5);
        }

        public void StartContinuousCaptureForAllZones(string className, bool useCamera, int fps, int encoderStep,
                                           bool saveTrain, bool saveVal, List<Rectangle> allZones)
        {
            StopContinuousCapture();

            ContinuousCaptureClassName = className;
            UseCameraForContinuous = useCamera;
            ContinuousFps = fps;
            ContinuousEncoderStep = encoderStep;
            ContinuousSaveToTrain = saveTrain;
            ContinuousSaveToVal = saveVal;
            IsContinuousCaptureActive = true;

            // Сохраняем все зоны для циклического обхода
            _continuousCaptureAllZones = allZones;
            _currentZoneIndex = 0;

            _panelConsole?.Log($"Непрерывный захват запущен для класса '{className}' | Зон: {allZones.Count}", "Capture");

            if (useCamera)
            {
                _continuousCameraTimer = new System.Windows.Forms.Timer { Interval = 1000 / Math.Max(1, fps) };
                _continuousCameraTimer.Tick += (s, e) =>
                {
                    if (IsContinuousCaptureActive && _continuousCaptureAllZones.Count > 0)
                    {
                        // Сохраняем текущую зону, затем переходим к следующей
                        var currentRoi = _continuousCaptureAllZones[_currentZoneIndex];
                        SaveTrainingImage(className, true, currentRoi, saveTrain, saveVal);

                        // Переход к следующей зоне (циклически)
                        _currentZoneIndex = (_currentZoneIndex + 1) % _continuousCaptureAllZones.Count;
                    }
                };
                _continuousCameraTimer.Start();
            }
        }

        private void StartAiTimer()
{
    StopAiTimer();

    if (_panelAIModel == null || !_panelAIModel.ChkTimerAI.Checked) return;

    int interval = (int)_panelAIModel.NumAiTimerInterval.Value;
    interval = Math.Max(100, interval); // минимум 100 мс

    _aiTimer = new System.Windows.Forms.Timer { Interval = Math.Max(interval, 100) };

    _aiTimer.Tick += Timer_Tick_For_AI;
    _aiTimer.Start();

    // === НОВОЕ: При запуске таймера очищаем старые зоны, чтобы начать с чистого листа ===
    ClearZoneDisplay();

    _panelConsole?.Log($"[AI Timer] ЗАПУЩЕН — интервал {interval} мс", "AI");
}

        private void Timer_Tick_For_AI(object? sender, EventArgs e)
        {
            // Проверяем, что AI включён
            if (_ai == null || !_isLive || !_panelAIModel.ChkTimerAI.Checked)
            {
                StopAiTimer();
                ClearZoneDisplay();  // ← добавить очистку
                return;
            }

            // Атомарная проверка: если уже анализируем - пропускаем этот тик
            if (Interlocked.CompareExchange(ref _aiProcessing, 1, 0) == 1)
            {
                _panelConsole?.Log("[AI Timer] Пропуск — анализ ещё выполняется", "AI");
                return;
            }

            try
            {
                // ОЧИЩАЕМ СТАРУЮ ОЧЕРЕДЬ ПЕРЕД НОВЫМ КАДРОМ
                while (_aiFrameQueue.TryDequeue(out var old))
                    old?.Dispose();

                // ЗАХВАТЫВАЕМ ТОЛЬКО ОДИН РАЗ
                var frame = CaptureCurrentFrameAsMat();
                if (frame != null && !frame.IsEmpty)
                {
                    _aiFrameQueue.Enqueue(frame);
                    _panelConsole?.Log($"[AI Timer] → Запущен анализ (интервал {_panelAIModel.NumAiTimerInterval.Value} мс)", "AI");
                }
                else
                {
                    frame?.Dispose();
                    Interlocked.Exchange(ref _aiProcessing, 0);
                }
            }
            catch
            {
                Interlocked.Exchange(ref _aiProcessing, 0);
            }
        }

        private void StopAiTimer()
        {
            if (_aiTimer != null)
            {
                _aiTimer.Stop();
                _aiTimer.Dispose();
                _aiTimer = null;

                // ОЧИСТКА ОЧЕРЕДИ
                while (_aiFrameQueue.TryDequeue(out var old))
                    old?.Dispose();

                // СБРОС ФЛАГА
                Interlocked.Exchange(ref _aiProcessing, 0);

                // === НОВОЕ: Очищаем отображение зон ===
                ClearZoneDisplay();

                _panelConsole?.Log("[AI Timer] Остановлен, очередь очищена, зоны скрыты", "AI");
            }
        }

        public void StopContinuousCapture()
        {
            IsContinuousCaptureActive = false;
            _continuousCaptureAllZones.Clear();
            _currentZoneIndex = 0;

            if (_continuousCameraTimer != null)
            {
                _continuousCameraTimer.Stop();
                _continuousCameraTimer.Dispose();
                _continuousCameraTimer = null;
            }

            if (_continuousSyntheticTimer != null)
            {
                _continuousSyntheticTimer.Stop();
                _continuousSyntheticTimer.Dispose();
                _continuousSyntheticTimer = null;
            }

            _currentMenuROI = null;

            // === НОВОЕ: Очищаем отображение зон ===
            ClearZoneDisplay();

            _panelConsole?.Log("Непрерывный захват остановлен, зоны скрыты", "Capture");
        }

        public void LoadAIModel(string modelPath, string trainPath)
        {
            if (string.IsNullOrEmpty(modelPath) || !File.Exists(modelPath))
                return;

            try
            {
                _aiSemaphore.Wait();

                _ai?.Dispose();
                _ai = null;

                int requestedSize = Convert.ToInt32(_panelAIModel?.CbImageSize?.SelectedItem ?? 224);

                _ai = new YoloInference(modelPath, trainPath, requestedSize);

                _currentModelPath = modelPath;
                _currentTrainPath = trainPath;

                string[] classes = _ai.Labels;
                _panelTrigger.UpdateRejectClasses(classes);
                if (!string.IsNullOrEmpty(_panelTrigger.SelectedRejectClass))
                    _currentRejectClass = _panelTrigger.SelectedRejectClass;
            }
            catch (Exception ex)
            {
                _panelConsole?.Log($"Ошибка загрузки модели: {ex.Message}", "AI");
            }
            finally
            {
                _aiSemaphore.Release();
            }
        }

        private List<(string ClassName, Rectangle Rect, Color Color)> GetAllInspectionZones()
        {
            var allZones = new List<(string ClassName, Rectangle Rect, Color Color)>();

            if (_panelAIModel == null) return allZones;

            var zonesDict = _panelAIModel.GetInspectionZones();

            foreach (var kv in zonesDict)
            {
                string className = kv.Key;

                var tables = _panelAIModel.GetGridTablesForClass(className);
                foreach (var table in tables.Where(t => t.IsVisible))  // ← только видимые
                {
                    foreach (var cell in table.Cells)
                    {
                        allZones.Add((className, cell, table.BorderColor));
                    }
                }

                // Одиночные зоны (если таблиц нет)
                if (tables.Count == 0)
                {
                    var singleZones = _panelAIModel.GetZonesForClass(className);
                    foreach (var zone in singleZones)
                    {
                        allZones.Add((className, zone.Rect, zone.BorderColor));
                    }
                }
            }

            return allZones;
        }

        public void ToggleVideoRecording()
        {
            if (!IsRecording)
            {
                using var fbd = new FolderBrowserDialog
                {
                    Description = "Выберите папку для сохранения видео",
                    SelectedPath = _recordFolder ?? _savePath
                };

                if (fbd.ShowDialog() != DialogResult.OK) return;

                _recordFolder = fbd.SelectedPath;
                string fileName = $"record_{DateTime.Now:yyyyMMdd_HHmmss}.avi";
                CurrentRecordPath = Path.Combine(_recordFolder, fileName);

                _recordWidth = (int)_panelCamera.NumW.Value;
                _recordHeight = (int)_panelCamera.NumH.Value;

                // БЕРЁМ РЕАЛЬНОЕ FPS КАМЕРЫ
                _cam.Timing.Framerate.Get(out double realFps);
                int videoFps = (int)Math.Max(1, realFps);   // минимум 1

                _videoWriter = new VideoWriter(CurrentRecordPath,
                    VideoWriter.Fourcc('M', 'J', 'P', 'G'),
                    videoFps, new DrawingSize(_recordWidth, _recordHeight), true);

                IsRecording = true;
                _panelConsole?.Log($"▶️ Запись начата | FPS: {videoFps} | {CurrentRecordPath}", "Record");
            }
            else
            {
                StopRecording();
            }

            _panelCamera.UpdateRecordUI();
            TriggerAutoSave();
        }

        public void StartContinuousCaptureWithSynthetic(string className, bool useCamera, int fps, int encoderStep,
                                                          bool saveTrain, bool saveVal, List<Rectangle> allZones,
                                                          MenuROI menuROI)
        {
            StopContinuousCapture();

            _currentMenuROI = menuROI;
            ContinuousCaptureClassName = className;
            UseCameraForContinuous = useCamera;
            ContinuousFps = fps;
            ContinuousEncoderStep = encoderStep;
            ContinuousSaveToTrain = saveTrain;
            ContinuousSaveToVal = saveVal;
            IsContinuousCaptureActive = true;

            // Сохраняем ВСЕ зоны (не одну)
            _continuousCaptureAllZones = allZones;
            _currentZoneIndex = 0;

            _panelConsole?.Log($"Непрерывный захват (с синтетикой) запущен для '{className}' | Всего зон: {allZones.Count} (все таблицы)", "Capture");

            if (useCamera)
            {
                _continuousSyntheticTimer = new System.Windows.Forms.Timer { Interval = 1000 / Math.Max(1, fps) };
                _continuousSyntheticTimer.Tick += async (s, e) =>
                {
                    if (IsContinuousCaptureActive && _continuousCaptureAllZones.Count > 0 && _currentMenuROI != null)
                    {
                        using Mat? frame = CaptureCurrentFrameAsMat();
                        if (frame != null)
                        {
                            // ===== СОХРАНЯЕМ ВСЕ ЗОНЫ, А НЕ ТОЛЬКО ОДНУ =====
                            foreach (var roi in _continuousCaptureAllZones)
                            {
                                _currentMenuROI.SaveWithSyntheticVariants(frame, roi, className, saveTrain, saveVal);
                            }
                            _panelConsole?.Log($"[Continuous Capture] Камера: сохранено {_continuousCaptureAllZones.Count} зон + синтетика", "Capture");
                        }
                    }
                };
                _continuousSyntheticTimer.Start();
            }
        }

        // Добавьте вспомогательный метод для захвата кадра как Mat
        public Mat? CaptureCurrentFrameAsMat()
        {
            if (!_isLive || _cam == null) return null;

            try
            {
                _cam.Memory.GetLast(out int id);
                if (id == 0) return null;

                _cam.Memory.Lock(id);
                _cam.Memory.Inquire(id, out int w, out int h, out _, out int p);
                _cam.Memory.ToIntPtr(out IntPtr ptr);

                using Mat raw = new Mat(h, w, DepthType.Cv8U, 1, ptr, p);
                Mat color = new Mat();
                CvInvoke.CvtColor(raw, color, ColorConversion.BayerRg2Bgr);

                Mat result = color.Clone();
                _cam.Memory.Unlock(id);
                return result;
            }
            catch
            {
                return null;
            }
        }

        private void StopRecording()
        {
            if (_videoWriter != null)
            {
                _videoWriter.Dispose();
                _videoWriter = null;
            }

            IsRecording = false;

            _panelConsole?.Log($"⏹️ Запись остановлена: {CurrentRecordPath}", "Record");
            MessageBox.Show($"Запись завершена!\n\n" +
                            $"Файл: {CurrentRecordPath}\n" +
                            $"Длительность ≈ реальному времени",
                "Запись видео", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        // Добавьте в класс Form1
        private void StartAiThread()
        {
            _aiThreadRunning = true;
            _aiThread = new Thread(() =>
            {
                Thread.CurrentThread.Priority = ThreadPriority.Highest;

                while (_aiThreadRunning)
                {
                    if (_aiFrameQueue.TryDequeue(out Mat? frame))
                    {
                        if (frame != null && _ai != null)
                        {
                            _aiFpsStopwatch.Restart();

                            // Счётчик для effective FPS
                            analysisCount++;
                            if (!effectiveStopwatch.IsRunning)
                                effectiveStopwatch.Start();

                            try
                            {
                                var allZones = GetAllInspectionZones();
                                var results = new Dictionary<Rectangle, (string Label, float Confidence, Color Color, string ClassName)>();

                                var zoneList = allZones.ToList();
                                var resultsArray = new (Rectangle Rect, string Label, float Confidence, Color Color, string ClassName)[zoneList.Count];

                                Parallel.For(0, zoneList.Count, i =>
                                {
                                    var zoneInfo = zoneList[i];
                                    Rectangle zoneRect = zoneInfo.Rect;

                                    if (zoneRect.Width <= 0 || zoneRect.Height <= 0 ||
                                        zoneRect.X < 0 || zoneRect.Y < 0 ||
                                        zoneRect.X + zoneRect.Width > frame.Width ||
                                        zoneRect.Y + zoneRect.Height > frame.Height)
                                        return;

                                    using Mat roiImage = new Mat(frame, zoneRect);
                                    var result = _ai.Predict(roiImage);
                                    resultsArray[i] = (zoneRect, result.Label, result.Confidence, zoneInfo.Color, zoneInfo.ClassName);
                                });

                                foreach (var res in resultsArray)
                                {
                                    if (res.Rect != Rectangle.Empty)
                                    {
                                        // Логируем изменение
                                        this.BeginInvoke(new Action(() =>
                                        {
                                            LogZoneChange(res.ClassName, res.Rect, res.Label, res.Confidence);
                                        }));

                                        // === БРАКОВЩИК ===
                                        if (res.Label == _currentRejectClass &&
                                                                                    !string.IsNullOrEmpty(_currentRejectClass) &&
                                                                                    _panelTrigger.NumRejectionStep.Value > 0)
                                        {
                                            this.BeginInvoke(new Action(() =>
                                            {
                                                AddReject(CurrentEncoderPosition, res.Label);
                                            }));
                                        }
                                    }
                                }

                                foreach (var res in resultsArray)
                                {
                                    if (res.Rect != Rectangle.Empty)
                                        results[res.Rect] = (res.Label, res.Confidence, res.Color, res.ClassName);
                                }

                                _lastZoneResults = results;

                                foreach (var res in resultsArray)
                                {
                                    if (res.Rect != Rectangle.Empty)
                                    {
                                        this.BeginInvoke(new Action(() =>
                                        {
                                            LogZoneChange(res.ClassName, res.Rect, res.Label, res.Confidence);
                                        }));
                                    }
                                }

                                // ====================== ПРОИЗВОДИТЕЛЬНОСТЬ ======================
                                _aiFpsStopwatch.Stop();
                                long elapsedMs = _aiFpsStopwatch.ElapsedMilliseconds;

                                if (elapsedMs > 0)
                                    _lastAiFps = 1000.0 / elapsedMs;
                                else
                                    _lastAiFps = 0;

                                // Обновляем UI (без мерцания)
                                this.BeginInvoke(new Action(() =>
                                {
                                    string status = _ai?.ProviderStatus ?? "CPU";

                                    string speedText = _lastAiFps > 0
                                        ? $" | {_lastAiFps:F1} fps ({elapsedMs}ms)"
                                        : "";

                                    // Обновляем effective FPS только когда прошло достаточно времени
                                    if (effectiveStopwatch.ElapsedMilliseconds > 900)
                                    {
                                        if (analysisCount > 0)
                                            lastEffectiveFps = analysisCount * 1000.0 / effectiveStopwatch.ElapsedMilliseconds;

                                        analysisCount = 0;
                                        effectiveStopwatch.Restart();
                                    }

                                    string effectiveText = lastEffectiveFps > 0
                                        ? $" | Eff: {lastEffectiveFps:F1} fps"
                                        : "";

                                    _lblAIResult.Text = $"AI: {status}{speedText}{effectiveText}";
                                    _lblAIResult.ForeColor = status.Contains("GPU") || status.Contains("CUDA")
                                        ? Color.Lime
                                        : Color.Yellow;
                                }));
                            }
                            catch (Exception ex)
                            {
                                Debug.WriteLine($"AI Thread Error: {ex.Message}");
                            }
                            finally
                            {
                                frame?.Dispose();

                                lock (_aiBusyLock)
                                {
                                    _aiProcessing = 0;
                                }
                            }
                        }
                        Interlocked.Exchange(ref _aiProcessing, 0);

                    }
                    else
                    {
                        Thread.Sleep(1);
                    }
                }
            })
            {
                IsBackground = true,
                Priority = ThreadPriority.Highest
            };

            _aiThread.Start();
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            _aiThreadRunning = false;
            _aiThread?.Join(1000);

            if (IsRecording) StopRecording();
            _timer.Stop();
            _isLive = false;
            _ai?.Dispose();
            _encoder.Disconnect();
            _timeRejectTimer?.Stop();
            _queueUpdateTimer?.Stop();
            _cam?.Exit();
            lock (_aiBusyLock) _aiProcessing = 0;
            StopAiTimer();
            AutoSave();
            base.OnFormClosing(e);
        }

        public void StopAiAnalysis()
        {
            _panelTrigger.ChkEncoder.Checked = false;
            _panelTrigger.ChkCamera.Checked = false;
            _panelTrigger.RefreshState();

            SyncTriggerToAiCheckboxes();

            _needAiProcessByEncoder = false;

            // === НОВОЕ: Очищаем отображение зон ===
            ClearZoneDisplay();

            _panelConsole?.Log("AI анализ остановлен, зоны скрыты", "AI");
        }

        private void Form1_Load(object sender, EventArgs e)
        {
        }

        public int AiAnalysisFPS
        {
            get => _aiAnalysisRate;
            set => _aiAnalysisRate = value;
        }

        public void SyncTriggerToAiCheckboxes()
        {
            if (_panelAIModel == null || _panelTrigger == null) return;

            bool encoder = _panelTrigger.ChkEncoder.Checked;
            bool camera = _panelTrigger.ChkCamera.Checked;

            _panelAIModel.ChkEncoderAI.Checked = encoder;
            _panelAIModel.ChkCameraAI.Checked = camera;

            // Если включили энкодер или камеру — выключаем таймер
            if (encoder || camera)
            {
                _panelAIModel.ChkTimerAI.Checked = false;
            }

            // Управление таймером
            if (_panelAIModel.ChkTimerAI.Checked)
                StartAiTimer();
            else
                StopAiTimer();
        }

        public void SyncAiToTriggerCheckboxes()
        {
            if (_panelAIModel == null || _panelTrigger == null) return;

            bool useTimer = _panelAIModel.ChkTimerAI.Checked;
            bool useEncoder = _panelAIModel.ChkEncoderAI.Checked;
            bool useCamera = _panelAIModel.ChkCameraAI.Checked;

            // Взаимоисключающие режимы
            if (useTimer)
            {
                useEncoder = false;
                useCamera = false;
            }
            else if (useEncoder)
            {
                useCamera = false;
                useTimer = false;
            }
            else if (useCamera)
            {
                useEncoder = false;
                useTimer = false;
            }

            // Если ВСЕ чекбоксы выключены — очищаем зоны
            if (!useTimer && !useEncoder && !useCamera)
            {
                ClearZoneDisplay();
            }

            if (!useTimer)
            {
                while (_aiFrameQueue.TryDequeue(out var old)) old?.Dispose();
                Interlocked.Exchange(ref _aiProcessing, 0);
            }

            // Применяем в триггер-панель
            _panelTrigger.ChkEncoder.Checked = useEncoder;
            _panelTrigger.ChkCamera.Checked = useCamera;

            _panelTrigger.RefreshState();

            // Управление таймером
            if (useTimer)
                StartAiTimer();
            else
                StopAiTimer();
        }

        public void ClearZoneDisplay()
        {
            // Очищаем результаты зон
            _lastZoneResults = null;

            // Очищаем лог изменений
            _lastZoneResultsForLog.Clear();

            // Очищаем очередь AI кадров
            while (_aiFrameQueue.TryDequeue(out var old))
                old?.Dispose();

            // Сбрасываем флаг обработки
            Interlocked.Exchange(ref _aiProcessing, 0);

            _redHighlightTimer?.Stop();
            _originalZoneColors.Clear();
            _isEncoderTriggeredHighlight = false;

            _panelConsole?.Log("Отображение зон инспекции очищено", "AI");
        }


        public void RefreshAIInspectionZones()
        {
            // Принудительно обновляем зоны для ИИ
            if (_aiThread != null)
            {
                // Очищаем очередь, чтобы следующий тик взял свежие зоны
                while (_aiFrameQueue.TryDequeue(out var old))
                    old?.Dispose();
            }

            // Если сейчас идёт анализ — он подхватит новые зоны при следующем тике
            _panelConsole?.Log("Зоны инспекции обновлены (скрытые таблицы исключены)", "AI");
        }
    }
}