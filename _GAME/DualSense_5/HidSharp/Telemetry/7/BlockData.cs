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