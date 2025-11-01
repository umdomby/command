using System.Drawing;
using System.Collections.Generic;
using System.Windows.Forms;

namespace TeleUDP
{
    // Класс для хранения данных о блоке (Label)
    public class BlockData
    {
        public string Name { get; set; } = string.Empty;
        public int X { get; set; }
        public int Y { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
        public int TextColorArgb { get; set; }
        public int BackColorArgb { get; set; }
        public BorderStyle BorderStyle { get; set; }
    }

    // Класс для хранения коллекции данных о блоках
    public class BlockPositionData
    {
        public List<BlockData> Blocks { get; set; } = new List<BlockData>();
    }
}