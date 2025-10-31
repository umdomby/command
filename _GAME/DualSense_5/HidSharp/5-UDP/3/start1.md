это SimHub конфликтует он тоже прослушивает порт 20777, 
мне нужно взять телеметрию из Grid Legends Codemasters как это делает SimHub в доступных свойствах.
Вместо логов JSON или что там выводится в программе выведи всю телеметрию со скролом и поиском, чтобы я мог найти
параметр speed
вот мой код, прослушивать нужно порт от игры 20777

в играх Codemasters (к которым относится GRID Legends), передается в виде сырых байтов через протокол UDP, 
а не в JSON. Это делается для максимальной скорости и минимальной задержки.

Grid Legend уже шлет данные в программу!!

Codemasters Grid Legends шлет телеметрию на UDP порт 20777 в виде сырых байтов.
Нужно расшифровать данные, есть какие библиотеки? можно для расшифровки использовать C# а не Python ?
если C# можно, сделай мне программу с данными телеметрией и их быстрого обновления.

```C#
namespace TeleUDP
{
    partial class Form1
    {
        /// <summary>
        ///  Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        ///  Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        ///  Required method for Designer support - do not modify
        ///  the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.components = new System.ComponentModel.Container();
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(800, 450);
            this.Text = "Form1";
        }

        #endregion
    }
}
```

```C#
namespace TeleUDP
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }
    }
}
```