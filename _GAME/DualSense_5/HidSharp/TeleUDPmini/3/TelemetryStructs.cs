using System;
using System.Runtime.InteropServices;

namespace TeleUDPmini
{
    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct PacketHeader
    {
        public ushort m_packetFormat;
        public byte m_gameMajorVersion;
        public byte m_gameMinorVersion;
        public byte m_packetVersion;
        public byte m_packetId;
        public ulong m_sessionUID;
        public float m_sessionTime;
        public uint m_frameIdentifier;
        public byte m_playerCarIndex;
        public byte m_secondaryPlayerCarIndex;
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 16)]
        public byte[] m_headerPadding;
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct GridLegendsMotionPacket189
    {
        public PacketHeader m_header;
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 36)] public byte[] m_dataPadding1;
        public float m_pitch; public float m_roll; public float m_yaw;
        public float m_gForceLateral; public float m_gForceLongitudinal; public float m_gForceVertical;
        public float m_speed; public float m_engineRPM; public float m_maxEngineRPM;
        public float m_brake; public float m_throttle; public float m_steer;
        public float m_clutchOrUnused2; public float m_unusedBrake; public float m_gear;
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 108)] public byte[] m_paddingFinal; // ← ТОЛЬКО ОДНА СТРОКА!
    }

    public static class Utils
    {
        public static T ByteArrayToStructure<T>(byte[] bytes) where T : struct
        {
            int expectedSize = Marshal.SizeOf(typeof(T));
            if (bytes.Length < expectedSize)
                throw new ArgumentException($"Недостаточно байт: {bytes.Length} < {expectedSize}");
            IntPtr ptr = Marshal.AllocHGlobal(expectedSize);
            try
            {
                Marshal.Copy(bytes, 0, ptr, expectedSize);
                return Marshal.PtrToStructure<T>(ptr);
            }
            finally
            {
                Marshal.FreeHGlobal(ptr);
            }
        }
    }
}