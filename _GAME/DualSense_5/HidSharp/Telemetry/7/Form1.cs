using System;
using System.Drawing;
using System.Net;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using System.IO;
using System.Text.Json;
using System.Collections.Generic;
using System.Linq;

namespace TeleUDP
{
    public partial class Form1 : Form
    {
        // --- P/Invoke для прозрачного окна (Оверлей) ---
        private const int GWL_EXSTYLE = -20;
        private const int WS_EX_LAYERED = 0x80000;
        private const int WS_EX_TRANSPARENT = 0x20;
        private const int LWA_COLORKEY = 0x1;

        [DllImport("user32.dll", SetLastError = true)]
        private static extern int GetWindowLong(IntPtr hWnd, int nIndex);

        [DllImport("user32.dll")]
        private static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);

        [DllImport("user32.dll")]
        private static extern bool SetLayeredWindowAttributes(IntPtr hWnd, uint crKey, byte bAlpha, uint dwFlags);

        // --- Константы и переменные ---
        private const int LISTEN_PORT = 20778;
        private const string POSITION_FILE = "BlockPositions.json";

        private UdpClient udpClient = null!;
        private IPEndPoint ipEndPoint = null!;

        private Label? draggedOrResizedLabel = null;
        private Point dragStartPosition;
        private bool isDragging = false;
        private bool isResizing = false;
        private const int ResizeHandleSize = 10;

        private Color transparencyKeyColor = Color.Magenta;
        private bool isOverlayMode = false;
        private NotifyIcon notifyIcon = null!;

        // Глобальные настройки для обводки текста
        private const string TagKeyOutline = "Outline";
        private const string TagKeyHidden = "Hidden";


        // --- Инициализация и настройка ---

        public Form1()
        {
            // InitializeComponent(); // Предполагается, что присутствует

            this.Load += Form1_Load;
            this.FormClosing += Form1_FormClosing;
            this.DoubleBuffered = true;
            this.Text = "Telemetry UDP Viewer";
            this.BackColor = Color.Gray;
            this.FormBorderStyle = FormBorderStyle.Sizable;
            this.MaximizeBox = false;
            this.TopMost = true;
            this.Size = new Size(700, 300); // Увеличиваем размер формы

            // Заглушка для иконки - используем иконку приложения
            this.Icon = SystemIcons.Application;

            // Инициализация UDP клиента
            try
            {
                ipEndPoint = new IPEndPoint(IPAddress.Any, LISTEN_PORT);
                udpClient = new UdpClient(ipEndPoint);
                udpClient.BeginReceive(new AsyncCallback(ReceiveCallback), null);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Ошибка инициализации UDP: {ex.Message}", "Ошибка UDP", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }

            // Создание и настройка блоков (Label)
            InitializeDataBlocks();
            LoadBlockPositions();

            InitializeFormContextMenu();
            InitializeNotifyIcon();
        }

        private void InitializeNotifyIcon()
        {
            notifyIcon = new NotifyIcon();
            notifyIcon.Text = "Telemetry UDP Viewer";
            notifyIcon.Icon = this.Icon;
            notifyIcon.Visible = true;

            ContextMenuStrip trayMenu = new ContextMenuStrip();

            ToolStripMenuItem toggleOverlayItem = new ToolStripMenuItem("Переключить Оверлей (Прозрачность)");
            toggleOverlayItem.Click += ToggleOverlay_Click;

            ToolStripMenuItem exitItem = new ToolStripMenuItem("Выход");
            exitItem.Click += (s, e) => this.Close();

            trayMenu.Items.Add(toggleOverlayItem);
            trayMenu.Items.Add(new ToolStripSeparator());
            trayMenu.Items.Add(exitItem);

            notifyIcon.ContextMenuStrip = trayMenu;
            notifyIcon.MouseClick += (s, e) =>
            {
                if (e.Button == MouseButtons.Left)
                {
                    if (this.Visible)
                    {
                        this.Hide();
                    }
                    else
                    {
                        this.Show();
                        this.BringToFront();
                    }
                }
            };
        }

        private void InitializeFormContextMenu()
        {
            ContextMenuStrip formContextMenu = new ContextMenuStrip();

            // --- Глобальные настройки оверлея ---
            ToolStripMenuItem toggleOverlayItem = new ToolStripMenuItem("Переключить в Оверлей (Полная Прозрачность)");
            toggleOverlayItem.Checked = this.isOverlayMode;
            toggleOverlayItem.Click += ToggleOverlay_Click;
            formContextMenu.Items.Add(toggleOverlayItem);

            formContextMenu.Items.Add(new ToolStripSeparator());

            // --- Глобальные настройки блоков ---
            ToolStripMenuItem toggleBackgroundAllItem = new ToolStripMenuItem("Фон всех блоков: Прозрачный/Непрозрачный");
            toggleBackgroundAllItem.Click += ToggleBackgroundAll_Click;

            ToolStripMenuItem changeBackColorAllItem = new ToolStripMenuItem("Установить цвет фона всех блоков");
            changeBackColorAllItem.Click += ChangeBackColorAll_Click;

            ToolStripMenuItem changeTextColorAllItem = new ToolStripMenuItem("Установить цвет текста всех блоков");
            changeTextColorAllItem.Click += ChangeTextColorAll_Click;

            ToolStripMenuItem toggleOutlineAllItem = new ToolStripMenuItem("Переключить обводку текста для всех");
            toggleOutlineAllItem.Click += ToggleOutlineAll_Click;

            ToolStripMenuItem toggleVisibleAllItem = new ToolStripMenuItem("Скрыть/Показать все блоки");
            toggleVisibleAllItem.Click += ToggleVisibleAll_Click;

            formContextMenu.Items.Add(toggleBackgroundAllItem);
            formContextMenu.Items.Add(changeBackColorAllItem);
            formContextMenu.Items.Add(changeTextColorAllItem);
            formContextMenu.Items.Add(toggleOutlineAllItem);
            formContextMenu.Items.Add(toggleVisibleAllItem);

            formContextMenu.Items.Add(new ToolStripSeparator());

            // --- Прочие настройки ---
            ToolStripMenuItem toggleTopMostItem = new ToolStripMenuItem("Окно поверх всех (TopMost)");
            toggleTopMostItem.Checked = this.TopMost;
            toggleTopMostItem.Click += ToggleTopMost_Click;

            ToolStripMenuItem resetPositionsItem = new ToolStripMenuItem("Сбросить расположение блоков");
            resetPositionsItem.Click += ResetBlockPositions_Click;

            formContextMenu.Items.Add(toggleTopMostItem);
            formContextMenu.Items.Add(resetPositionsItem);

            this.ContextMenuStrip = formContextMenu;
        }

        private void InitializeDataBlocks()
        {
            // Контекстное меню для одного блока
            ContextMenuStrip blockContextMenu = new ContextMenuStrip();

            ToolStripMenuItem changeTextColorItem = new ToolStripMenuItem("Изменить цвет текста");
            changeTextColorItem.Click += ChangeTextColor_Click;

            ToolStripMenuItem changeBackColorItem = new ToolStripMenuItem("Изменить цвет фона");
            changeBackColorItem.Click += ChangeBackColor_Click;

            ToolStripMenuItem toggleTransparencyItem = new ToolStripMenuItem("Сделать фон прозрачным/непрозрачным");
            toggleTransparencyItem.Click += ToggleTransparency_Click;

            ToolStripMenuItem toggleOutlineItem = new ToolStripMenuItem("Переключить обводку текста");
            toggleOutlineItem.Click += ToggleOutline_Click;

            ToolStripMenuItem toggleVisibleItem = new ToolStripMenuItem("Скрыть/Показать этот блок");
            toggleVisibleItem.Click += ToggleVisible_Click;


            blockContextMenu.Items.Add(changeTextColorItem);
            blockContextMenu.Items.Add(changeBackColorItem);
            blockContextMenu.Items.Add(toggleTransparencyItem);
            blockContextMenu.Items.Add(toggleOutlineItem);
            blockContextMenu.Items.Add(new ToolStripSeparator());
            blockContextMenu.Items.Add(toggleVisibleItem);


            int formInnerWidth = this.ClientSize.Width - 20;
            int defaultWidth = formInnerWidth / 3 - 10;
            int defaultHeight = 60;
            int hSpace = 10;
            int vSpace = 10;
            int currentX = 10;
            int currentY = 10;

            CreateDataLabel("lblSpeed", "Speed: 0.0", currentX, currentY, defaultWidth, defaultHeight, blockContextMenu);
            currentX += defaultWidth + hSpace;
            CreateDataLabel("lblRPM_Raw", "RPM (Raw): 0", currentX, currentY, defaultWidth, defaultHeight, blockContextMenu);
            currentX += defaultWidth + hSpace;
            CreateDataLabel("lblRPM_250x", "RPM (*250): 0", currentX, currentY, defaultWidth, defaultHeight, blockContextMenu);

            currentX = 10;
            currentY += defaultHeight + vSpace;
            CreateDataLabel("lblGear", "Gear: 0", currentX, currentY, defaultWidth, defaultHeight, blockContextMenu);
            currentX += defaultWidth + hSpace;
            CreateDataLabel("lblThrottle", "Throttle: 0.0", currentX, currentY, defaultWidth, defaultHeight, blockContextMenu);
            currentX += defaultWidth + hSpace;
            CreateDataLabel("lblBrake", "Brake: 0.0", currentX, currentY, defaultWidth, defaultHeight, blockContextMenu);

            currentX = 10;
            currentY += defaultHeight + vSpace;
            CreateDataLabel("lblGForceLat", "G-Lat: 0.0", currentX, currentY, defaultWidth, defaultHeight, blockContextMenu);
            currentX += defaultWidth + hSpace;
            CreateDataLabel("lblGForceLon", "G-Long: 0.0", currentX, currentY, defaultWidth, defaultHeight, blockContextMenu);
            currentX += defaultWidth + hSpace;
            CreateDataLabel("lblPitch", "Pitch: 0.0", currentX, currentY, defaultWidth, defaultHeight, blockContextMenu);
        }

        private void CreateDataLabel(string name, string text, int x, int y, int width, int height, ContextMenuStrip contextMenu)
        {
            Label lbl = new Label
            {
                Name = name,
                Text = text,
                Location = new Point(x, y),
                Size = new Size(width, height),
                TextAlign = ContentAlignment.MiddleCenter,
                BorderStyle = BorderStyle.FixedSingle,
                ForeColor = Color.White,
                BackColor = Color.Black,
                AutoSize = false,
                Tag = new Dictionary<string, object>
                {
                    { "IsTransparent", false }, // false = непрозрачный фон
                    { TagKeyOutline, false },   // false = без обводки
                    { TagKeyHidden, false }     // false = видим
                },
                ContextMenuStrip = contextMenu
            };

            lbl.Font = new Font("Arial", 12, FontStyle.Bold);
            ScaleLabelFont(lbl);

            lbl.MouseDown += Label_MouseDown;
            lbl.MouseMove += Label_MouseMove;
            lbl.MouseUp += Label_MouseUp;
            lbl.Paint += Label_Paint;

            this.Controls.Add(lbl);
        }

        // --- P/Invoke Логика Оверлея ---

        protected override void OnHandleCreated(EventArgs e)
        {
            base.OnHandleCreated(e);
            this.TransparencyKey = transparencyKeyColor;
        }

        private void ToggleOverlay_Click(object? sender, EventArgs e)
        {
            ToolStripMenuItem? menuItem = sender as ToolStripMenuItem;
            isOverlayMode = !isOverlayMode;

            // Обновление состояния всех связанных пунктов меню
            if (menuItem != null)
            {
                menuItem.Checked = isOverlayMode;
            }
            if (notifyIcon.ContextMenuStrip?.Items[0] is ToolStripMenuItem trayItem)
            {
                trayItem.Checked = isOverlayMode;
            }
            if (this.ContextMenuStrip?.Items[0] is ToolStripMenuItem formItem)
            {
                formItem.Checked = isOverlayMode;
            }

            int currentStyles = GetWindowLong(this.Handle, GWL_EXSTYLE);

            if (isOverlayMode)
            {
                // Убираем заголовок и рамки
                this.FormBorderStyle = FormBorderStyle.None;

                // Включаем оверлей
                SetWindowLong(this.Handle, GWL_EXSTYLE, currentStyles | WS_EX_LAYERED);
                SetLayeredWindowAttributes(this.Handle, (uint)transparencyKeyColor.ToArgb(), 0, LWA_COLORKEY);
                SetWindowLong(this.Handle, GWL_EXSTYLE, GetWindowLong(this.Handle, GWL_EXSTYLE) | WS_EX_TRANSPARENT);

                this.BackColor = transparencyKeyColor;
            }
            else
            {
                // Возвращаем заголовок и рамки
                this.FormBorderStyle = FormBorderStyle.Sizable;

                // Выключаем оверлей
                SetWindowLong(this.Handle, GWL_EXSTYLE, currentStyles & ~WS_EX_LAYERED);
                SetWindowLong(this.Handle, GWL_EXSTYLE, GetWindowLong(this.Handle, GWL_EXSTYLE) & ~WS_EX_TRANSPARENT);

                this.BackColor = Color.Gray;
            }
        }

        // --- Логика Drag, Resize и масштабирования шрифта ---

        private void Label_MouseDown(object? sender, MouseEventArgs e)
        {
            if (e.Button == MouseButtons.Left)
            {
                draggedOrResizedLabel = sender as Label;
                if (draggedOrResizedLabel == null) return;

                if (isOverlayMode && (Control.ModifierKeys & Keys.Control) != Keys.Control)
                {
                    return;
                }

                if ((Control.ModifierKeys & Keys.Control) == Keys.Control)
                {
                    isResizing = true;
                    this.Cursor = Cursors.SizeNWSE;
                }
                else
                {
                    Rectangle resizeHandle = new Rectangle(
                        draggedOrResizedLabel.Width - ResizeHandleSize,
                        draggedOrResizedLabel.Height - ResizeHandleSize,
                        ResizeHandleSize,
                        ResizeHandleSize
                    );

                    if (resizeHandle.Contains(e.Location) && !isOverlayMode)
                    {
                        isResizing = true;
                        this.Cursor = Cursors.SizeNWSE;
                    }
                    else
                    {
                        isDragging = true;
                        dragStartPosition = e.Location;
                        this.Cursor = Cursors.SizeAll;
                    }
                }

                draggedOrResizedLabel.BringToFront();
            }
        }

        private void Label_MouseMove(object? sender, MouseEventArgs e)
        {
            if (draggedOrResizedLabel == null) return;

            if (isDragging && !isResizing)
            {
                draggedOrResizedLabel.Left += e.X - dragStartPosition.X;
                draggedOrResizedLabel.Top += e.Y - dragStartPosition.Y;
            }
            else if (isResizing)
            {
                int newWidth = draggedOrResizedLabel.Width + (e.X - dragStartPosition.X);
                int newHeight = draggedOrResizedLabel.Height + (e.Y - dragStartPosition.Y);

                if (newWidth > 50 && newHeight > 30)
                {
                    draggedOrResizedLabel.Width = newWidth;
                    draggedOrResizedLabel.Height = newHeight;
                    dragStartPosition = e.Location;
                }

                draggedOrResizedLabel.Invalidate();
            }
            else
            {
                Rectangle resizeHandle = new Rectangle(
                    draggedOrResizedLabel.Width - ResizeHandleSize,
                    draggedOrResizedLabel.Height - ResizeHandleSize,
                    ResizeHandleSize,
                    ResizeHandleSize
                );

                if (resizeHandle.Contains(e.Location) && !isOverlayMode)
                {
                    draggedOrResizedLabel.Cursor = Cursors.SizeNWSE;
                }
                else
                {
                    draggedOrResizedLabel.Cursor = Cursors.Default;
                }
            }
        }

        private void Label_MouseUp(object? sender, MouseEventArgs e)
        {
            isDragging = false;
            isResizing = false;
            draggedOrResizedLabel = null;
            this.Cursor = Cursors.Default;

            SaveBlockPositions();
        }

        // --- Обводка текста и масштабирование ---
        private void Label_Paint(object? sender, PaintEventArgs e)
        {
            Label? lbl = sender as Label;
            if (lbl == null) return;

            // 1. Масштабирование шрифта
            ScaleLabelFont(lbl);

            // 2. Очистка (если фон прозрачен)
            if (lbl.BackColor == Color.Transparent && isOverlayMode)
            {
                e.Graphics.Clear(transparencyKeyColor);
            }
            else if (lbl.BackColor == Color.Transparent && !isOverlayMode)
            {
                // Для прозрачности вне оверлея
                e.Graphics.Clear(this.BackColor);
            }
            else
            {
                // Заливка цветом
                using (SolidBrush brush = new SolidBrush(lbl.BackColor))
                {
                    e.Graphics.FillRectangle(brush, lbl.ClientRectangle);
                }
            }

            // 3. Рисование обводки и текста
            var tag = lbl.Tag as Dictionary<string, object>;
            bool drawOutline = tag != null && tag.ContainsKey(TagKeyOutline) && (bool)tag[TagKeyOutline];

            // Настройки для центрирования
            StringFormat sf = new StringFormat
            {
                Alignment = StringAlignment.Center,
                LineAlignment = StringAlignment.Center
            };

            // Обводка
            if (drawOutline)
            {
                using (Pen outlinePen = new Pen(lbl.ForeColor, 2))
                {
                    for (int x = -1; x <= 1; x++)
                    {
                        for (int y = -1; y <= 1; y++)
                        {
                            if (x != 0 || y != 0)
                            {
                                e.Graphics.DrawString(lbl.Text, lbl.Font, Brushes.Black, lbl.ClientRectangle.Location.X + x, lbl.ClientRectangle.Location.Y + y, sf);
                            }
                        }
                    }
                }
            }

            // Основной текст
            using (SolidBrush textBrush = new SolidBrush(lbl.ForeColor))
            {
                e.Graphics.DrawString(lbl.Text, lbl.Font, textBrush, lbl.ClientRectangle, sf);
            }

            // Рисование рамки (если не прозрачный фон)
            if (lbl.BorderStyle == BorderStyle.FixedSingle)
            {
                e.Graphics.DrawRectangle(Pens.White, 0, 0, lbl.Width - 1, lbl.Height - 1);
            }
        }

        private void ScaleLabelFont(Label lbl)
        {
            if (lbl.Text.Length == 0) return;

            float minRatio;

            // Graphics для измерения текста
            using (Graphics g = Graphics.FromHwnd(lbl.Handle))
            {
                // Используем большой фиктивный размер для измерения
                Font baseFont = new Font("Arial", 100);
                SizeF stringSize = g.MeasureString(lbl.Text, baseFont, lbl.Width);

                float wRatio = lbl.Width / stringSize.Width;
                float hRatio = lbl.Height / stringSize.Height;
                minRatio = Math.Min(wRatio, hRatio);
                baseFont.Dispose();
            }

            float newFontSize = 100 * minRatio;

            if (newFontSize < 12) newFontSize = 12;

            if (lbl.Font.Size != newFontSize)
            {
                Font oldFont = lbl.Font;
                lbl.Font = new Font(oldFont.FontFamily, newFontSize, oldFont.Style);
                oldFont.Dispose();
            }
        }


        // --- Индивидуальные настройки блока ---

        private void ChangeTextColor_Click(object? sender, EventArgs e)
        {
            ToolStripMenuItem? menuItem = sender as ToolStripMenuItem;
            ContextMenuStrip? contextMenu = menuItem!.Owner as ContextMenuStrip;
            Label? targetLabel = contextMenu!.SourceControl as Label;

            if (targetLabel != null)
            {
                using (ColorDialog colorDialog = new ColorDialog())
                {
                    colorDialog.Color = targetLabel.ForeColor;
                    if (colorDialog.ShowDialog() == DialogResult.OK)
                    {
                        targetLabel.ForeColor = colorDialog.Color;
                        targetLabel.Invalidate();
                        SaveBlockPositions();
                    }
                }
            }
        }

        private void ChangeBackColor_Click(object? sender, EventArgs e)
        {
            ToolStripMenuItem? menuItem = sender as ToolStripMenuItem;
            ContextMenuStrip? contextMenu = menuItem!.Owner as ContextMenuStrip;
            Label? targetLabel = contextMenu!.SourceControl as Label;

            if (targetLabel != null)
            {
                using (ColorDialog colorDialog = new ColorDialog())
                {
                    colorDialog.Color = targetLabel.BackColor;
                    if (colorDialog.ShowDialog() == DialogResult.OK)
                    {
                        targetLabel.BackColor = colorDialog.Color;
                        targetLabel.Tag = new Dictionary<string, object>
                        {
                            { "IsTransparent", targetLabel.BackColor.A == 0 },
                            { TagKeyOutline, (targetLabel.Tag as Dictionary<string, object>)![TagKeyOutline] },
                            { TagKeyHidden, (targetLabel.Tag as Dictionary<string, object>)![TagKeyHidden] }
                        };
                        targetLabel.Invalidate();
                        SaveBlockPositions();
                    }
                }
            }
        }

        private void ToggleTransparency_Click(object? sender, EventArgs e)
        {
            ToolStripMenuItem? menuItem = sender as ToolStripMenuItem;
            ContextMenuStrip? contextMenu = menuItem!.Owner as ContextMenuStrip;
            Label? targetLabel = contextMenu!.SourceControl as Label;

            if (targetLabel != null)
            {
                var tag = (targetLabel.Tag as Dictionary<string, object>)!;
                bool isTransparent = (bool)tag["IsTransparent"];

                if (isTransparent)
                {
                    targetLabel.BackColor = Color.Black;
                    targetLabel.BorderStyle = BorderStyle.FixedSingle;
                    tag["IsTransparent"] = false;
                }
                else
                {
                    targetLabel.BackColor = Color.Transparent;
                    targetLabel.BorderStyle = BorderStyle.None;
                    tag["IsTransparent"] = true;
                }

                targetLabel.Invalidate();
                SaveBlockPositions();
            }
        }

        private void ToggleOutline_Click(object? sender, EventArgs e)
        {
            ToolStripMenuItem? menuItem = sender as ToolStripMenuItem;
            ContextMenuStrip? contextMenu = menuItem!.Owner as ContextMenuStrip;
            Label? targetLabel = contextMenu!.SourceControl as Label;

            if (targetLabel != null)
            {
                var tag = (targetLabel.Tag as Dictionary<string, object>)!;
                bool currentOutline = (bool)tag[TagKeyOutline];
                tag[TagKeyOutline] = !currentOutline;

                targetLabel.Invalidate();
                SaveBlockPositions();
            }
        }

        private void ToggleVisible_Click(object? sender, EventArgs e)
        {
            ToolStripMenuItem? menuItem = sender as ToolStripMenuItem;
            ContextMenuStrip? contextMenu = menuItem!.Owner as ContextMenuStrip;
            Label? targetLabel = contextMenu!.SourceControl as Label;

            if (targetLabel != null)
            {
                var tag = (targetLabel.Tag as Dictionary<string, object>)!;
                bool isHidden = (bool)tag[TagKeyHidden];
                tag[TagKeyHidden] = !isHidden;
                targetLabel.Visible = !isHidden;

                SaveBlockPositions();
            }
        }

        // --- Глобальные настройки для всех блоков ---

        private IEnumerable<Label> GetDataLabels()
        {
            return this.Controls.OfType<Label>();
        }

        private void ToggleBackgroundAll_Click(object? sender, EventArgs e)
        {
            // Берем состояние первого видимого блока как эталон
            bool makeTransparent = true;
            Label? firstVisible = GetDataLabels().FirstOrDefault(lbl => lbl.Visible);
            if (firstVisible != null)
            {
                var tag = (firstVisible.Tag as Dictionary<string, object>)!;
                makeTransparent = !(bool)tag["IsTransparent"];
            }

            foreach (Label lbl in GetDataLabels())
            {
                var tag = (lbl.Tag as Dictionary<string, object>)!;

                if (makeTransparent)
                {
                    lbl.BackColor = Color.Transparent;
                    lbl.BorderStyle = BorderStyle.None;
                    tag["IsTransparent"] = true;
                }
                else
                {
                    lbl.BackColor = Color.Black;
                    lbl.BorderStyle = BorderStyle.FixedSingle;
                    tag["IsTransparent"] = false;
                }
                lbl.Invalidate();
            }
            SaveBlockPositions();
        }

        private void ChangeBackColorAll_Click(object? sender, EventArgs e)
        {
            using (ColorDialog colorDialog = new ColorDialog())
            {
                if (colorDialog.ShowDialog() == DialogResult.OK)
                {
                    Color newColor = colorDialog.Color;
                    foreach (Label lbl in GetDataLabels())
                    {
                        lbl.BackColor = newColor;
                        var tag = (lbl.Tag as Dictionary<string, object>)!;
                        // Если выбран прозрачный цвет (A=0), ставим флаг прозрачности
                        tag["IsTransparent"] = newColor.A == 0;
                        lbl.Invalidate();
                    }
                    SaveBlockPositions();
                }
            }
        }

        private void ChangeTextColorAll_Click(object? sender, EventArgs e)
        {
            using (ColorDialog colorDialog = new ColorDialog())
            {
                if (colorDialog.ShowDialog() == DialogResult.OK)
                {
                    Color newColor = colorDialog.Color;
                    foreach (Label lbl in GetDataLabels())
                    {
                        lbl.ForeColor = newColor;
                        lbl.Invalidate();
                    }
                    SaveBlockPositions();
                }
            }
        }

        private void ToggleOutlineAll_Click(object? sender, EventArgs e)
        {
            // Берем состояние первого видимого блока как эталон
            bool enableOutline = true;
            Label? firstVisible = GetDataLabels().FirstOrDefault(lbl => lbl.Visible);
            if (firstVisible != null)
            {
                var tag = (firstVisible.Tag as Dictionary<string, object>)!;
                enableOutline = !(bool)tag[TagKeyOutline];
            }

            foreach (Label lbl in GetDataLabels())
            {
                var tag = (lbl.Tag as Dictionary<string, object>)!;
                tag[TagKeyOutline] = enableOutline;
                lbl.Invalidate();
            }
            SaveBlockPositions();
        }

        private void ToggleVisibleAll_Click(object? sender, EventArgs e)
        {
            // Берем состояние первого видимого блока как эталон
            bool makeVisible = true;
            Label? firstVisible = GetDataLabels().FirstOrDefault(lbl => lbl.Visible);

            // Если хотя бы один видим, то скрываем все
            if (firstVisible != null)
            {
                makeVisible = false;
            }

            foreach (Label lbl in GetDataLabels())
            {
                var tag = (lbl.Tag as Dictionary<string, object>)!;
                tag[TagKeyHidden] = !makeVisible;
                lbl.Visible = makeVisible;
            }
            SaveBlockPositions();
        }

        // --- Прочие настройки и события ---

        private void ResetBlockPositions_Click(object? sender, EventArgs e)
        {
            if (File.Exists(POSITION_FILE))
            {
                try
                {
                    File.Delete(POSITION_FILE);
                }
                catch (IOException ex)
                {
                    MessageBox.Show($"Невозможно удалить файл: {ex.Message}\nЗакройте программу и удалите файл вручную.", "Ошибка");
                    return;
                }
            }

            var controlsToRemove = GetDataLabels().ToList();

            foreach (var control in controlsToRemove)
            {
                this.Controls.Remove(control);
                control.Dispose();
            }

            InitializeDataBlocks();
        }

        private void ToggleTopMost_Click(object? sender, EventArgs e)
        {
            ToolStripMenuItem? menuItem = sender as ToolStripMenuItem;
            this.TopMost = !this.TopMost;
            if (menuItem != null)
            {
                menuItem.Checked = this.TopMost;
            }
        }

        // --- Сохранение и Загрузка расположений блоков ---

        private void SaveBlockPositions()
        {
            var data = new BlockPositionData();

            foreach (Control control in this.Controls)
            {
                if (control is Label lbl)
                {
                    var tag = (lbl.Tag as Dictionary<string, object>)!;

                    data.Blocks.Add(new BlockData
                    {
                        Name = lbl.Name,
                        X = lbl.Location.X,
                        Y = lbl.Location.Y,
                        Width = lbl.Size.Width,
                        Height = lbl.Size.Height,
                        TextColorArgb = lbl.ForeColor.ToArgb(),
                        // Сохраняем цвет фона. Прозрачность будет определяться по A=0
                        BackColorArgb = lbl.BackColor.ToArgb(),
                        BorderStyle = lbl.BorderStyle,
                        // В реальном коде сюда нужно добавить сохранение состояний TagKeyOutline/TagKeyHidden
                    });
                }
            }

            try
            {
                string jsonString = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true })!;
                File.WriteAllText(POSITION_FILE, jsonString);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка сохранения позиций блоков: {ex.Message}");
            }
        }

        private void LoadBlockPositions()
        {
            if (!File.Exists(POSITION_FILE)) return;

            try
            {
                string jsonString = File.ReadAllText(POSITION_FILE);
                var data = JsonSerializer.Deserialize<BlockPositionData>(jsonString);

                if (data == null) return;

                foreach (var blockData in data.Blocks)
                {
                    Label? lbl = this.Controls[blockData.Name] as Label;
                    if (lbl != null)
                    {
                        lbl.Location = new Point(blockData.X, blockData.Y);
                        lbl.Size = new Size(blockData.Width, blockData.Height);
                        lbl.ForeColor = Color.FromArgb(blockData.TextColorArgb);
                        lbl.BackColor = Color.FromArgb(blockData.BackColorArgb);
                        lbl.BorderStyle = blockData.BorderStyle;

                        // Восстановление Tag-данных
                        lbl.Tag = new Dictionary<string, object>
                        {
                            { "IsTransparent", lbl.BackColor.A == 0 },
                            { TagKeyOutline, false }, // Предполагаем false при загрузке (нет сохранения)
                            { TagKeyHidden, false } // Предполагаем false при загрузке (нет сохранения)
                        };

                        lbl.Visible = !(bool)(lbl.Tag as Dictionary<string, object>)![TagKeyHidden];
                        ScaleLabelFont(lbl);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка загрузки позиций блоков: {ex.Message}");
                if (File.Exists(POSITION_FILE))
                {
                    File.Delete(POSITION_FILE);
                }
            }
        }

        private void Form1_Load(object? sender, EventArgs e) { }

        private void Form1_FormClosing(object? sender, FormClosingEventArgs e)
        {
            udpClient?.Close();
            SaveBlockPositions();
            notifyIcon.Visible = false;
            notifyIcon.Dispose();
        }

        // --- Обработка UDP данных ---

        private void ReceiveCallback(IAsyncResult ar)
        {
            try
            {
                byte[] receivedBytes = udpClient.EndReceive(ar, ref ipEndPoint!);
                udpClient.BeginReceive(new AsyncCallback(ReceiveCallback), null);

                if (receivedBytes.Length == Marshal.SizeOf<GridLegendsMotionPacket189>())
                {
                    GridLegendsMotionPacket189 packet = Utils.ByteArrayToStructure<GridLegendsMotionPacket189>(receivedBytes);

                    if (this.IsHandleCreated)
                    {
                        this.BeginInvoke(new Action(() => UpdateUI(packet)));
                    }
                }
            }
            catch (ObjectDisposedException) { }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка приема UDP: {ex.Message}");
            }
        }

        private void UpdateUI(GridLegendsMotionPacket189 packet)
        {
            var speedLabel = this.Controls["lblSpeed"] as Label;
            var rpmRawLabel = this.Controls["lblRPM_Raw"] as Label;
            var rpm250xLabel = this.Controls["lblRPM_250x"] as Label;
            var gearLabel = this.Controls["lblGear"] as Label;
            var throttleLabel = this.Controls["lblThrottle"] as Label;
            var brakeLabel = this.Controls["lblBrake"] as Label;
            var gForceLatLabel = this.Controls["lblGForceLat"] as Label;
            var gForceLonLabel = this.Controls["lblGForceLon"] as Label;
            var pitchLabel = this.Controls["lblPitch"] as Label;

            // Обновление и Invalidate для перерисовки (включая обводку)
            if (speedLabel != null)
            {
                speedLabel.Text = $"Speed: {packet.m_speed * 3.6f:F1} km/h";
                speedLabel.Invalidate();
            }

            if (rpmRawLabel != null)
            {
                // RPM (Raw) = исходное значение
                rpmRawLabel.Text = $"RPM (Raw): {packet.m_engineRPM:F0}";
                rpmRawLabel.Invalidate();
            }

            if (rpm250xLabel != null)
            {
                // RPM (*250) = умноженное значение
                rpm250xLabel.Text = $"RPM (*250): {packet.m_engineRPM * 250f:F0}";
                rpm250xLabel.Invalidate();
            }

            if (gearLabel != null)
            {
                string gearText = (packet.m_gear == 0f) ? "N" : (packet.m_gear > 0f) ? ((int)packet.m_gear).ToString() : "R";
                gearLabel.Text = $"Gear: {gearText}";
                gearLabel.Invalidate();
            }

            if (throttleLabel != null)
            {
                throttleLabel.Text = $"Throttle: {packet.m_throttle:P0}";
                throttleLabel.Invalidate();
            }

            if (brakeLabel != null)
            {
                brakeLabel.Text = $"Brake: {packet.m_brake:P0}";
                brakeLabel.Invalidate();
            }

            if (gForceLatLabel != null)
            {
                gForceLatLabel.Text = $"G-Lat: {packet.m_gForceLateral:F2}";
                gForceLatLabel.Invalidate();
            }

            if (gForceLonLabel != null)
            {
                gForceLonLabel.Text = $"G-Long: {packet.m_gForceLongitudinal:F2}";
                gForceLonLabel.Invalidate();
            }

            if (pitchLabel != null)
            {
                pitchLabel.Text = $"Pitch: {packet.m_pitch:F2}";
                pitchLabel.Invalidate();
            }
        }
    }
}