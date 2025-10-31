using System;
using System.Runtime.InteropServices;

namespace TeleUDP
{
    // ... (PacketHeader и Utils остаются без изменений) ...
    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct PacketHeader
    {
        public ushort m_packetFormat;       // 2 байта
        public byte m_gameMajorVersion;     // 1 байт
        public byte m_gameMinorVersion;     // 1 байт
        public byte m_packetVersion;        // 1 байт
        public byte m_packetId;             // 1 байт (ID: 38, 175, 177, 189)
        public ulong m_sessionUID;          // 8 байт
        public float m_sessionTime;          // 4 байта
        public uint m_frameIdentifier;      // 4 байта
        public byte m_playerCarIndex;       // 1 байт
        public byte m_secondaryPlayerCarIndex; // 1 байт
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 16)] // 16 байт
        public byte[] m_headerPadding;
    }

    // ----------------------------------------------------------------
    // 2. ПАКЕТ СИМУЛЯТОРА GRID LEGENDS (РАЗМЕР 264 байта)
    // ГИПОТЕЗА 8: СМЕЩЕНИЕ 36 БАЙТ ВЕРНО, А ПОРЯДОК ПОЛЕЙ - КЛЮЧЕВОЙ.
    // ----------------------------------------------------------------
    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct GridLegendsMotionPacket189
    {
        public PacketHeader m_header; // 40 байт

        // --- Смещение 1: 36 БАЙТ (9 float-полей) ---
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 36)]
        public byte[] m_dataPadding1; // 36 байт

        // 1. Углы (Pitch, Roll, Yaw) - ЧАСТО ИДУТ ПЕРВЫМИ В МОУШЕН ПАКЕТАХ
        public float m_pitch;               // 4 байта (тангаж)
        public float m_roll;                // 4 байта (крен)
        public float m_yaw;                 // 4 байта (рыскание)

        // 2. G-Forces (перегрузки)
        public float m_gForceLateral;       // 4 байта
        public float m_gForceLongitudinal;  // 4 байта
        public float m_gForceVertical;      // 4 байта

        // 3. Телеметрия (Скорость + RPM/Газ)
        public float m_speed;               // 4 байта (Скорость в м/с)
        public float m_engineRPM;           // 4 байта (Обороты)
        public float m_maxEngineRPM;        // 4 байта (Макс. обороты)
        public float m_throttle;            // 4 байта (Газ 0.0 - 1.0)
        public float m_brake;               // 4 байта
        public float m_clutch;              // 4 байта
        public float m_steer;               // 4 байта
        public float m_gear;                // 4 байта

        // Оставшееся заполнение
        // 264 - 40 - 36 - 24 (Angles/G-Forces) - 32 (Telemetry 8 float) = 132
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 132)]
        public byte[] m_paddingFinal; // 132 байта
    }

    // ... (Utils остается без изменений) ...
    public static class Utils
    {
        public static T ByteArrayToStructure<T>(byte[] bytes) where T : struct
        {
            T structure = new T();
            int size = Marshal.SizeOf(structure);

            if (bytes.Length < size)
                throw new Exception($"Недостаточный размер байтов для структуры {typeof(T).Name}. Ожидается {size} байт, получено {bytes.Length}.");

            IntPtr ptr = Marshal.AllocHGlobal(size);

            try
            {
                Marshal.Copy(bytes, 0, ptr, size);
                structure = (T)Marshal.PtrToStructure(ptr, typeof(T));
                return structure;
            }
            finally
            {
                Marshal.FreeHGlobal(ptr);
            }
        }
    }
}