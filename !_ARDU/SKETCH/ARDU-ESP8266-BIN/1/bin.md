Байт 0,Назначение,Направление,Длина (байты)
0x01,IDENTIFY (отправить deviceId),→ server,17
0x02,CLIENT_TYPE (browser / esp),→ server,2
0x10,HEARTBEAT,↔,1
0x20,MOTOR_CMD (motor + speed + dir),browser → esp,5
0x30,SERVO_ABSOLUTE,browser → esp,4
0x40,RELAY_SET (D0 only),browser → esp,3
0x41,ALARM_SET,browser → esp,2
0x50,FULL_STATUS (от esp),esp → browser,9
0x51,COMMAND_ACK,esp → browser,3–5

