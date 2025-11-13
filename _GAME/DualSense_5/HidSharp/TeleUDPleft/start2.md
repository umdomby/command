Задача - адаптировать телеметрию Grid Legends коротая приходит по порту UDP 20777 к адаптивному левому триггеру DualSense в приложении TeleUDPleft, 
приложение DualSenseTriggerControl идет для примера.
Данные телеметрии:
$"Скорость: {speedKmh:F1} км/ч\n" +
$"Передача: {gear}\n" +
$"Газ: {(motion.m_throttle * 100):F0}%\n" +
$"Тормоз: {(motion.m_brake * 100):F0}%\n" +
$"Руль: {(motion.m_steer * 100):F0}%\n" +
$"\n" +
$"RPM: {rpm:F0}\n" +
$"Max: {maxRpm:F0}\n" +
$"\n" +
$"Pitch: {motion.m_pitch:F3}\n" +
$"Roll: {motion.m_roll:F3}\n" +
$"Yaw: {motion.m_yaw:F3}\n" +
$"G-Lat: {motion.m_gForceLateral:F2}G\n" +
$"G-Long: {motion.m_gForceLongitudinal:F2}G";

левый курок должен делать резкий толчек когда происходит блокировка колес Тормоз: = 0