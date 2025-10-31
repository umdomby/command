﻿using System;
using System.Runtime.InteropServices;

namespace TeleUDP
{
    // *** ВАЖНО: Pack = 1 обязателен для работы с UDP-пакетами ***

    // ----------------------------------------------------------------
    // 1. ЗАГОЛОВОК ПАКЕТА (PacketHeader) - 40 байт
    // ----------------------------------------------------------------
    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct PacketHeader
    {
        public ushort m_packetFormat;       // 2 байта
        public byte m_gameMajorVersion;     // 1 байт
        public byte m_gameMinorVersion;     // 1 байт
        public byte m_packetVersion;        // 1 байт
        public byte m_packetId;             // 1 байт
        public ulong m_sessionUID;          // 8 байт
        public float m_sessionTime;          // 4 байта
        public uint m_frameIdentifier;      // 4 байта
        public byte m_playerCarIndex;       // 1 байт
        public byte m_secondaryPlayerCarIndex; // 1 байт

        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 16)]
        public byte[] m_headerPadding; // 16 байт
    }

    // ----------------------------------------------------------------
    // 2. ПАКЕТ СИМУЛЯТОРА GRID LEGENDS (РАЗМЕР 264 байта)
    // Восстановлены изначальные места полей. Только m_steer переименован.
    // ----------------------------------------------------------------
    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct GridLegendsMotionPacket189
    {
        public PacketHeader m_header; // 40 байт

        // --- Смещение 1: 36 БАЙТ ---
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 36)]
        public byte[] m_dataPadding1; // 36 байт

        // 1. Углы (12 байт)
        public float m_pitch;
        public float m_roll;
        public float m_yaw;

        // 2. G-Forces (12 байт)
        public float m_gForceLateral;
        public float m_gForceLongitudinal;
        public float m_gForceVertical;

        // 3. Телеметрия (56 байт)
        public float m_speed;               // Скорость (м/с) - РАБОТАЕТ
        public float m_engineRPM;           // ОБОРОТЫ (Не работает)
        public float m_maxEngineRPM;        // Макс. обороты

        public float m_maxRpmOrTorque;      // Максимальное значение (Гипотеза)
        public float m_throttle;            // Нажатие Газа - РАБОТАЕТ
        public float m_steer;               // РУЛЬ (ПЕРЕИМЕНОВАНО, РАБОТАЕТ)
        public float m_clutchOrUnused2;     // НЕИЗВЕСТНОЕ ПОЛЕ / Сцепление
        public float m_brake;               // ТОРМОЗ (Не работает)
        public float m_gear;                // Передача - РАБОТАЕТ

        // Оставшееся заполнение. Общий размер 264 байта.
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 128)]
        public byte[] m_paddingFinal;
    }

    // ----------------------------------------------------------------
    // 3. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (Utils)
    // ----------------------------------------------------------------
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
                structure = Marshal.PtrToStructure<T>(ptr);
                return structure;
            }
            finally
            {
                Marshal.FreeHGlobal(ptr);
            }
        }
    }
}