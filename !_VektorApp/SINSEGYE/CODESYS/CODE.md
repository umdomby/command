```
PROGRAM PLC_PRG
VAR
    fbPower     : MC_Power;
    fbMoveRel   : MC_MoveRelative; // Блок для инкрементального движения
    fbReset     : MC_Reset;
    // Управление
    bEnable     : BOOL;    // Подать ток
    bStartMove  : BOOL;    // Старт движения (каждый нажим добавляет путь)
    // Параметры (вставляй свои значения здесь)
    rDistance   : LREAL := 1.0;  // СКОЛЬКО ОБОРОТОВ ПРОЕХАТЬ (например, 7.5)
    rVelocity   : LREAL := 2.0;  // СКОРОСТЬ (оборотов в секунду)
    bResetAxis  : BOOL;    // Сброс ошибки 100
END_VAR


// 1. Питание мотора
fbPower(
    Axis:= SM_Drive_GenericDSP402, 
    Enable:= TRUE, 
    bRegulatorOn:= bEnable, 
    bDriveStart:= bEnable
);

// 2. Движение на относительное расстояние
fbMoveRel(
    Axis:= SM_Drive_GenericDSP402, 
    Execute:= bStartMove,      // Поедет при переходе FALSE -> TRUE
    Distance:= rDistance,      // Добавит это расстояние к текущему
    Velocity:= rVelocity,      
    Acceleration:= 20,         // Плавный разгон
    Deceleration:= 20,         // Плавное торможение
    Jerk:= 100,
    BufferMode:= MC_BUFFER_MODE.Aborting
);

// 3. Сброс аварий
fbReset(
    Axis:= SM_Drive_GenericDSP402, 
    Execute:= bResetAxis
);
```