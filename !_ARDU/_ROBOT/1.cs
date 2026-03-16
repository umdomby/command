using System;
using System.Drawing;
using System.Windows.Forms;
using System.IO;
using System.Text.Json;
using System.Net.WebSockets;
using System.Threading;
using System.Threading.Tasks;

using FormsTimer = System.Windows.Forms.Timer;

namespace ARDU
{
    public class AppSettings
    {
        // Мёртвые зоны стиков в процентах
        public decimal LeftY { get; set; } = 40m;
        public decimal LeftX { get; set; } = 40m;
        public decimal RightY { get; set; } = 40m;
        public decimal RightX { get; set; } = 40m;
        // Колёса
        public int GlobalSpeed { get; set; } = 255;
        public int GlobalMinStart { get; set; } = 80;
        // Поворот туловища
        public int BodyTurnSpeed { get; set; } = 255;
        public int BodyTurnMinStart { get; set; } = 100;
        // Наклон туловища
        public int TiltDownSpeed { get; set; } = 255;
        public int TiltUpSpeed { get; set; } = 255;
    }

    public partial class Form1 : Form
    {
        private readonly string configPath = Path.Combine(Application.StartupPath, "config.json");
        private CancellationTokenSource? cts;

        private readonly WebSocketHandler wsHandler;          // первый ESP — моторы/туловище
        private readonly WebSocketHandlerServo wsServo;       // второй ESP — только серво

        private readonly JoystickHandler joystickHandler;
        private readonly MotorLogic motorLogic;
        private readonly ServoLogic servoLogic;               // логика серво

        private ComboBox cmbJoysticks = null!;
        private TextBox txtLog = null!;
        private FormsTimer timerJoystick = null!;
        private Button btnConnect = null!;
        private Button btnConnectServo = null!;               // кнопка для серво
        private Label lblStatus = null!;
        private Label lblStatusServo = null!;                 // статус серво

        // Мёртвые зоны
        private NumericUpDown nudLeftYDeadzone = null!;
        private NumericUpDown nudLeftXDeadzone = null!;
        private NumericUpDown nudRightYDeadzone = null!;
        private NumericUpDown nudRightXDeadzone = null!;
        // Колёса
        private NumericUpDown nudGlobalSpeed = null!;
        private NumericUpDown nudGlobalMinStart = null!;
        // Поворот туловища
        private NumericUpDown nudBodyTurnSpeed = null!;
        private NumericUpDown nudBodyTurnMinStart = null!;
        // Наклон туловища
        private NumericUpDown nudTiltDownSpeed = null!;
        private NumericUpDown nudTiltUpSpeed = null!;

        private Label lblDeadzone = null!;
        private Label lblWheelsGroup = null!;
        private Label lblTurnGroup = null!;
        private Label lblTiltGroup = null!;
        private Button btnCalibrate = null!;

        public Form1()
        {
            InitializeComponent();
            InitializeControlsManually();

            cts = new CancellationTokenSource();

            wsHandler = new WebSocketHandler(Log, UpdateStatusLabel);
            wsServo = new WebSocketHandlerServo(Log, UpdateStatusServo);  // второй хэндлер

            joystickHandler = new JoystickHandler(Log);
            motorLogic = new MotorLogic(wsHandler.SendBinary, Log);
            servoLogic = new ServoLogic(wsServo.SendBinary, Log);        // логика серво

            timerJoystick = new FormsTimer { Interval = 50 };
            timerJoystick.Tick += TimerJoystick_Tick!;

            LoadSettings();

            this.Load += Form1_Load;
            this.FormClosing += Form1_FormClosing;
        }

        private void InitializeControlsManually()
        {
            this.SuspendLayout();

            // ─── Верхняя часть ───────────────────────────────────────────────
            cmbJoysticks = new ComboBox { Location = new Point(12, 12), Size = new Size(260, 23), DropDownStyle = ComboBoxStyle.DropDownList };
            btnConnect = new Button { Location = new Point(280, 10), Size = new Size(120, 30), Text = "Подключиться", BackColor = Color.LightGray };
            btnConnectServo = new Button { Location = new Point(280, 45), Size = new Size(120, 30), Text = "Серво", BackColor = Color.LightGreen };
            lblStatus = new Label { Location = new Point(12, 45), Size = new Size(260, 25), Text = "Статус: Отключено", ForeColor = Color.Red, Font = new Font("Segoe UI", 10, FontStyle.Bold) };
            lblStatusServo = new Label { Location = new Point(12, 80), Size = new Size(260, 25), Text = "Серво: Отключено", ForeColor = Color.Red, Font = new Font("Segoe UI", 10, FontStyle.Bold) };
            txtLog = new TextBox { Location = new Point(12, 110), Size = new Size(430, 240), Multiline = true, ScrollBars = ScrollBars.Vertical, ReadOnly = true, BackColor = Color.FromArgb(30, 30, 30), ForeColor = Color.Lime, Font = new Font("Consolas", 9.5f) };

            // ─── Мёртвые зоны (общие) ────────────────────────────────────────
            nudLeftYDeadzone = CreateNud(12, 330);
            nudLeftXDeadzone = CreateNud(100, 330);
            nudRightYDeadzone = CreateNud(188, 330);
            nudRightXDeadzone = CreateNud(276, 330);
            lblDeadzone = new Label
            {
                Location = new Point(12, 355),
                AutoSize = true,
                Text = "Мёртвая зона (%): Левый Y / X Правый Y / X"
            };

            // ─── Группа 1: Колёса ────────────────────────────────────────────
            nudGlobalSpeed = new NumericUpDown
            {
                Location = new Point(12, 390),
                Size = new Size(80, 22),
                Minimum = 0,
                Maximum = 255,
                Value = 255
            };
            nudGlobalMinStart = new NumericUpDown
            {
                Location = new Point(100, 390),
                Size = new Size(80, 22),
                Minimum = 0,
                Maximum = 255,
                Value = 80
            };
            lblWheelsGroup = new Label
            {
                Location = new Point(12, 415),
                AutoSize = true,
                Text = "Колёса Макс. скорость Мин. старт"
            };

            // ─── Группа 2: Поворот туловища ──────────────────────────────────
            nudBodyTurnSpeed = new NumericUpDown
            {
                Location = new Point(12, 445),
                Size = new Size(80, 22),
                Minimum = 0,
                Maximum = 255,
                Value = 255
            };
            nudBodyTurnMinStart = new NumericUpDown
            {
                Location = new Point(100, 445),
                Size = new Size(80, 22),
                Minimum = 0,
                Maximum = 255,
                Value = 100
            };
            lblTurnGroup = new Label
            {
                Location = new Point(12, 470),
                AutoSize = true,
                Text = "Поворот туловища Макс. скорость Мин. старт"
            };

            // ─── Группа 3: Наклон туловища ───────────────────────────────────
            nudTiltDownSpeed = new NumericUpDown
            {
                Location = new Point(12, 500),
                Size = new Size(80, 22),
                Minimum = 0,
                Maximum = 255,
                Value = 255
            };
            nudTiltUpSpeed = new NumericUpDown
            {
                Location = new Point(100, 500),
                Size = new Size(80, 22),
                Minimum = 0,
                Maximum = 255,
                Value = 255
            };
            lblTiltGroup = new Label
            {
                Location = new Point(12, 525),
                AutoSize = true,
                Text = "Наклон туловища Вниз Вверх"
            };

            // ─── Кнопка калибровки ───────────────────────────────────────────
            btnCalibrate = new Button
            {
                Location = new Point(280, 380),
                Size = new Size(140, 28),
                Text = "Калибровать центр",
                BackColor = Color.LightBlue
            };

            // ─── Привязка событий ─────────────────────────────────────────────
            nudLeftYDeadzone.ValueChanged += (s, e) => motorLogic.LeftDeadzoneYPercent = nudLeftYDeadzone.Value;
            nudLeftXDeadzone.ValueChanged += (s, e) => motorLogic.LeftDeadzoneXPercent = nudLeftXDeadzone.Value;
            nudRightYDeadzone.ValueChanged += (s, e) => motorLogic.RightDeadzoneYPercent = nudRightYDeadzone.Value;
            nudRightXDeadzone.ValueChanged += (s, e) => motorLogic.RightDeadzoneXPercent = nudRightXDeadzone.Value;
            nudGlobalSpeed.ValueChanged += (s, e) => motorLogic.GlobalSpeed = (int)nudGlobalSpeed.Value;
            nudGlobalMinStart.ValueChanged += (s, e) => motorLogic.GlobalMinStart = (int)nudGlobalMinStart.Value;
            nudBodyTurnSpeed.ValueChanged += (s, e) => motorLogic.BodyTurnSpeed = (int)nudBodyTurnSpeed.Value;
            nudBodyTurnMinStart.ValueChanged += (s, e) => motorLogic.BodyTurnMinStart = (int)nudBodyTurnMinStart.Value;
            nudTiltDownSpeed.ValueChanged += (s, e) => motorLogic.TiltDownSpeed = (int)nudTiltDownSpeed.Value;
            nudTiltUpSpeed.ValueChanged += (s, e) => motorLogic.TiltUpSpeed = (int)nudTiltUpSpeed.Value;
            btnConnect.Click += BtnConnect_Click!;
            btnConnectServo.Click += BtnConnectServo_Click!;
            btnCalibrate.Click += BtnCalibrate_Click!;
            cmbJoysticks.SelectedIndexChanged += (s, e) => joystickHandler.SelectJoystick(cmbJoysticks.SelectedIndex);

            // ─── Добавление элементов на форму ────────────────────────────────
            this.Controls.AddRange(new Control[]
            {
                cmbJoysticks, btnConnect, btnConnectServo, lblStatus, lblStatusServo, txtLog,
                nudLeftYDeadzone, nudLeftXDeadzone, nudRightYDeadzone, nudRightXDeadzone,
                nudGlobalSpeed, nudGlobalMinStart,
                nudBodyTurnSpeed, nudBodyTurnMinStart,
                nudTiltDownSpeed, nudTiltUpSpeed,
                lblDeadzone, lblWheelsGroup, lblTurnGroup, lblTiltGroup,
                btnCalibrate
            });

            this.ClientSize = new Size(460, 570);
            this.Text = "Джойстик → ESP32 (Туловище + Min Start + Серво)";
            this.ResumeLayout(false);
        }

        private NumericUpDown CreateNud(int x, int y) => new NumericUpDown
        {
            Location = new Point(x, y),
            Size = new Size(80, 22),
            Minimum = 0,
            Maximum = 90,
            DecimalPlaces = 1,
            Value = 40m
        };

        private void LoadSettings()
        {
            if (File.Exists(configPath))
            {
                try
                {
                    string json = File.ReadAllText(configPath);
                    var settings = JsonSerializer.Deserialize<AppSettings>(json);
                    if (settings != null)
                    {
                        nudLeftYDeadzone.Value = settings.LeftY;
                        nudLeftXDeadzone.Value = settings.LeftX;
                        nudRightYDeadzone.Value = settings.RightY;
                        nudRightXDeadzone.Value = settings.RightX;
                        nudGlobalSpeed.Value = settings.GlobalSpeed;
                        nudGlobalMinStart.Value = settings.GlobalMinStart;
                        nudBodyTurnSpeed.Value = settings.BodyTurnSpeed;
                        nudBodyTurnMinStart.Value = settings.BodyTurnMinStart;
                        nudTiltDownSpeed.Value = settings.TiltDownSpeed;
                        nudTiltUpSpeed.Value = settings.TiltUpSpeed;
                        Log("Конфигурация загружена.");
                    }
                }
                catch { SetDefaults(); Log("Ошибка файла → дефолты."); }
            }
            else { SetDefaults(); Log("config.json не найден → дефолты."); }
            SyncMotorLogic();
        }

        private void SaveSettings()
        {
            try
            {
                var settings = new AppSettings
                {
                    LeftY = nudLeftYDeadzone.Value,
                    LeftX = nudLeftXDeadzone.Value,
                    RightY = nudRightYDeadzone.Value,
                    RightX = nudRightXDeadzone.Value,
                    GlobalSpeed = (int)nudGlobalSpeed.Value,
                    GlobalMinStart = (int)nudGlobalMinStart.Value,
                    BodyTurnSpeed = (int)nudBodyTurnSpeed.Value,
                    BodyTurnMinStart = (int)nudBodyTurnMinStart.Value,
                    TiltDownSpeed = (int)nudTiltDownSpeed.Value,
                    TiltUpSpeed = (int)nudTiltUpSpeed.Value
                };
                File.WriteAllText(configPath, JsonSerializer.Serialize(settings, new JsonSerializerOptions { WriteIndented = true }));
            }
            catch (Exception ex) { Log("Ошибка сохранения: " + ex.Message); }
        }

        private void SetDefaults()
        {
            nudLeftYDeadzone.Value = 40m;
            nudLeftXDeadzone.Value = 40m;
            nudRightYDeadzone.Value = 40m;
            nudRightXDeadzone.Value = 40m;
            nudGlobalSpeed.Value = 255;
            nudGlobalMinStart.Value = 80;
            nudBodyTurnSpeed.Value = 255;
            nudBodyTurnMinStart.Value = 100;
            nudTiltDownSpeed.Value = 255;
            nudTiltUpSpeed.Value = 255;
        }

        private void SyncMotorLogic()
        {
            motorLogic.LeftDeadzoneYPercent = nudLeftYDeadzone.Value;
            motorLogic.LeftDeadzoneXPercent = nudLeftXDeadzone.Value;
            motorLogic.RightDeadzoneYPercent = nudRightYDeadzone.Value;
            motorLogic.RightDeadzoneXPercent = nudRightXDeadzone.Value;
            motorLogic.GlobalSpeed = (int)nudGlobalSpeed.Value;
            motorLogic.GlobalMinStart = (int)nudGlobalMinStart.Value;
            motorLogic.BodyTurnSpeed = (int)nudBodyTurnSpeed.Value;
            motorLogic.BodyTurnMinStart = (int)nudBodyTurnMinStart.Value;
            motorLogic.TiltDownSpeed = (int)nudTiltDownSpeed.Value;
            motorLogic.TiltUpSpeed = (int)nudTiltUpSpeed.Value;
        }

        private void Form1_Load(object? sender, EventArgs e)
        {
            joystickHandler.LoadJoysticks(cmbJoysticks);
            if (joystickHandler.HasJoysticks) cmbJoysticks.SelectedIndex = 0;
        }

        private void BtnCalibrate_Click(object? sender, EventArgs e) => joystickHandler.CalibrateCenter();

        private async void BtnConnect_Click(object? sender, EventArgs e)
        {
            if (wsHandler.IsConnected)
            {
                await wsHandler.DisconnectAsync();
                btnConnect.Text = "Подключиться";
                UpdateStatusLabel("Отключено", Color.Red);
                timerJoystick.Stop();
            }
            else
            {
                await wsHandler.ConnectAsync();
                if (wsHandler.IsConnected)
                {
                    btnConnect.Text = "Отключиться";
                    UpdateStatusLabel("Подключено", Color.LimeGreen);
                    timerJoystick.Start();
                }
            }
        }

        private async void BtnConnectServo_Click(object? sender, EventArgs e)
        {
            if (wsServo.IsConnected)
            {
                await wsServo.DisconnectAsync();
                btnConnectServo.Text = "Серво";
                UpdateStatusServo("Отключено", Color.Red);
            }
            else
            {
                await wsServo.ConnectAsync();
                if (wsServo.IsConnected)
                {
                    btnConnectServo.Text = "Отключить серво";
                    UpdateStatusServo("Подключено", Color.LimeGreen);
                }
            }
        }

        private async void TimerJoystick_Tick(object? sender, EventArgs e)
        {
            var state = joystickHandler.GetCurrentState();
            if (state != null)
            {
                await motorLogic.Process(state);
                await servoLogic.Process(state);  // ← управление серво
            }
        }

        private async void Form1_FormClosing(object? sender, FormClosingEventArgs e)
        {
            SaveSettings();
            cts?.Cancel();
            timerJoystick.Stop();
            if (wsHandler.IsConnected)
            {
                await wsHandler.SendMotor('A', 0, 0);
                await wsHandler.SendMotor('B', 0, 0);
                await wsHandler.SendMotor('C', 0, 0);
                await wsHandler.SendMotor('D', 0, 0);
                await wsHandler.DisconnectAsync();
            }
            if (wsServo.IsConnected)
            {
                await wsServo.SendBinary(new byte[] { 90 }); // серво в центр
                await wsServo.DisconnectAsync();
            }
            joystickHandler.Dispose();
            wsHandler.Dispose();
            wsServo.Dispose();
        }

        private void Log(string message)
        {
            if (InvokeRequired) Invoke(new Action(() => Log(message)));
            else { txtLog.AppendText($"{DateTime.Now:HH:mm:ss} {message}\r\n"); txtLog.ScrollToCaret(); }
        }

        private void UpdateStatusLabel(string text, Color color)
        {
            if (InvokeRequired) Invoke(new Action(() => UpdateStatusLabel(text, color)));
            else { lblStatus.Text = $"Статус: {text}"; lblStatus.ForeColor = color; }
        }

        private void UpdateStatusServo(string text, Color color)
        {
            if (InvokeRequired) Invoke(new Action(() => UpdateStatusServo(text, color)));
            else { lblStatusServo.Text = $"Серво: {text}"; lblStatusServo.ForeColor = color; }
        }
    }
}