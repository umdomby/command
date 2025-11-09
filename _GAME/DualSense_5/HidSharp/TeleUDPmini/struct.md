[StructLayout(LayoutKind.Sequential, Pack = 1)]
public struct GridLegendsMotionPacket189
{
// [0-3] Speed (m/s)
public float m_speed;

    // [4-7] Throttle (0.0 to 1.0)
    public float m_throttle;

    // [8-11] Brake (0.0 to 1.0)
    public float m_brake;

    // [12-15] Engine RPM
    public float m_engineRPM;

    // [16] Gear (-1 = R, 0 = N, 1-8 = gears)
    public sbyte m_gear;

    // [17-19] Padding (3 байта до выравнивания)
    private byte _pad0;
    private byte _pad1;
    private byte _pad2;

    // [20-23] G-Force Lateral
    public float m_gForceLateral;

    // [24-27] G-Force Longitudinal
    public float m_gForceLongitudinal;

    // [28-31] Pitch (radians)
    public float m_pitch;

    // [32-35] Roll (radians)
    public float m_roll;

    // [36-39] Yaw (radians)
    public float m_yaw;

    // [40-43] Local Velocity X
    public float m_localVelocityX;

    // [44-47] Local Velocity Y
    public float m_localVelocityY;

    // [48-51] Local Velocity Z
    public float m_localVelocityZ;

    // [52-55] Angular Velocity X
    public float m_angularVelocityX;

    // [56-59] Angular Velocity Y
    public float m_angularVelocityY;

    // [60-63] Angular Velocity Z
    public float m_angularVelocityZ;

    // [64-67] Suspension Position Rear Left
    public float m_suspensionPositionRearLeft;

    // [68-71] Suspension Position Rear Right
    public float m_suspensionPositionRearRight;

    // [72-75] Suspension Position Front Left
    public float m_suspensionPositionFrontLeft;

    // [76-79] Suspension Position Front Right
    public float m_suspensionPositionFrontRight;

    // [80-83] Suspension Velocity Rear Left
    public float m_suspensionVelocityRearLeft;

    // [84-87] Suspension Velocity Rear Right
    public float m_suspensionVelocityRearRight;

    // [88-91] Suspension Velocity Front Left
    public float m_suspensionVelocityFrontLeft;

    // [92-95] Suspension Velocity Front Right
    public float m_suspensionVelocityFrontRight;

    // [96-99] Wheel Speed Rear Left
    public float m_wheelSpeedRearLeft;

    // [100-103] Wheel Speed Rear Right
    public float m_wheelSpeedRearRight;

    // [104-107] Wheel Speed Front Left
    public float m_wheelSpeedFrontLeft;

    // [108-111] Wheel Speed Front Right
    public float m_wheelSpeedFrontRight;

    // [112-115] Steering Angle (radians)
    public float m_steeringAngle;

    // [116-119] Clutch
    public float m_clutch;

    // [120-123] Clutch Engaged
    public float m_clutchEngaged;

    // [124-127] Engine Temperature
    public float m_engineTemperature;

    // [128-131] Oil Temperature
    public float m_oilTemperature;

    // [132-135] Water Temperature
    public float m_waterTemperature;

    // [136-139] Oil Pressure
    public float m_oilPressure;

    // [140-143] Fuel Pressure
    public float m_fuelPressure;

    // [144-147] Fuel Level
    public float m_fuelLevel;

    // [148-151] Fuel Capacity
    public float m_fuelCapacity;

    // [152-155] Current Lap Time
    public float m_currentLapTime;

    // [156-159] Last Lap Time
    public float m_lastLapTime;

    // [160-163] Best Lap Time
    public float m_bestLapTime;

    // [164-167] Session Time Left
    public float m_sessionTimeLeft;

    // [168-171] Race Position
    public float m_racePosition;

    // [172-175] Lap Number
    public float m_lapNumber;

    // [176-179] Total Laps
    public float m_totalLaps;

    // [180-183] Track Length
    public float m_trackLength;

    // [184-187] Distance Traveled
    public float m_distanceTraveled;

    // [188] Packet ID (189 байт всего)
    public byte m_packetId; // Должно быть 189
}