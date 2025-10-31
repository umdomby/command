using System.Drawing;
using System.Collections.Generic;

namespace TeleUDP
{
    // Класс для хранения данных о блоке (Label)
    public class BlockData
    {
        public string Name { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
        public int TextColorArgb { get; set; }
        // ЭТО ПОЛЕ ДОЛЖНО БЫТЬ ДОБАВЛЕНО
        public int BackColorArgb { get; set; }
    }

    // Класс для хранения коллекции данных о блоках
    public class BlockPositionData
    {
        public List<BlockData> Blocks { get; set; } = new List<BlockData>();
    }
}