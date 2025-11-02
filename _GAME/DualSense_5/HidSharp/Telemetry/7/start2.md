// file: Form1.Designer.cs
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
            this.ClientSize = new System.Drawing.Size(700, 300);
            this.Text = "Telemetry UDP Viewer";
        }

        #endregion
    }
}
// file: _GAME/DualSense_5/HidSharp/Telemetry/7/BlockData.cs
using System.Collections.Generic;
using System.Drawing;
using System.Windows.Forms;

namespace TeleUDP
{
// Класс для хранения данных о блоке (Label)
public class BlockData
{
public string Name { get; set; } = "";
public string LabelText { get; set; } = "";  // ← ДОБАВИТЬ!
public int X { get; set; }
public int Y { get; set; }
public int Width { get; set; }
public int Height { get; set; }

        // Цвета в формате ARGB
        public int TextColorArgb { get; set; }
        public int BaseBackColorArgb { get; set; }
        public int BorderColorArgb { get; set; }

        // Альфа-каналы (0-255)
        public int BackAlpha { get; set; } = 255;
        public int TextAlpha { get; set; } = 255;
        public int BorderAlpha { get; set; } = 255;

        // Состояния
        public BorderStyle BorderStyle { get; set; }
        public bool Closed { get; set; } = false;
        public bool ShowLabel { get; set; } = true;

        // Дополнительно (не используется в Save/Load, но для совместимости)
        public int FormBackAlpha { get; set; } = 255;
    }

    // Класс для хранения коллекции данных о блоках
    public class BlockPositionData
    {
        public List<BlockData> Blocks { get; set; } = new();

        // Размер формы и прозрачность
        public int FormBackAlpha { get; set; } = 255;
        public int FormWidth { get; set; } = 700;
        public int FormHeight { get; set; } = 300;
    }
}

в оверлей Полная прозрачность не передается прозрачность текста, а скорее всего передается оттенок, измени