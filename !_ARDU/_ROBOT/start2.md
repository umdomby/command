


мне нужно добавить изменить код в ESP32 и C#
реализацию, смотри комменатарии по управлению из C#
#define SERVO_LRFT_SHOULDER_PIN 5 // левое плечо  D-PAD-LEFT  + RIGHT_STICK_X
#define SERVO_LEFT_ELBOW_PIN 6    // левый локоть D-PAD-DOWN  + RIGHT_STICK_Y
#define SERVO_LEFT_BRUSH_PIN 7    // левая кисть  D-PAD-RIGHT + RIGHT_STICK_Y


реализация #define SERVO_TORSO_PIN 4         // turn torso   D-PAD-UP    + RIGHT_STICK_X  - работает

сделай такую же задержку
#define SERVO_LRFT_SHOULDER_PIN 5 // левое плечо  D-PAD-LEFT  + RIGHT_STICK_X
#define SERVO_LEFT_ELBOW_PIN 6    // левый локоть D-PAD-DOWN  + RIGHT_STICK_Y
#define SERVO_LEFT_BRUSH_PIN 7    // левая кисть  D-PAD-RIGHT + RIGHT_STICK_Y
как в реализация #define SERVO_TORSO_PIN 4         // turn torso   D-PAD-UP    + RIGHT_STICK_X

в C# в Form1  добавь центрирование для (начальное положение если команд нету, с сохранением)
#define SERVO_LRFT_SHOULDER_PIN 5 // левое плечо  D-PAD-LEFT  + RIGHT_STICK_X
#define SERVO_LEFT_ELBOW_PIN 6    // левый локоть D-PAD-DOWN  + RIGHT_STICK_Y
#define SERVO_LEFT_BRUSH_PIN 7    // левая кисть  D-PAD-RIGHT + RIGHT_STICK_Y

используй такую же логику как в проекте и концепцию, не надо придумывать свое , бери концепцию из проекта


не надо этой хуйни!!
int rightX_raw = state.Rx - 32768;
int rightY_raw = state.Ry - 32768;
int[] povs = state.PointOfView ?? Array.Empty<int>();
Ошибка компиляции возникает потому, что C++ не позволяет в старых стилях инициализировать структуру массивом с указателями и значениями в фигурных скобках так, как мы написали.
этой хуеты!!!
int pov = state.POVs[0];          // первый POV

НЕ НАДО ДОДУМЫВАТЬ СВОЕ БЕРИ ТО ЧТО РАБОТАЕТ!!!!
Дай полные нужные файлы, чтобы я скопировал и вставил