нужно управлять моторами джойстиком Xbox

LT (Left Trigger) – левый аналоговый триггер (тормоз в гонках, прицеливание в шутерах) - включает:
мотор A вперед

RT (Right Trigger) – правый аналоговый триггер (газ в гонках, стрельба) - включает
мотор B вперед

LB (Left Bumper) – при нажатии должно менять вращении двигателей на назад клавишами LT (Left Trigger) и RT (Right Trigger)
RB (Right Bumper) – при нажатии должно менять вращении двигателей на вперед LT (Left Trigger) и RT (Right Trigger)


Добавь Нажатие на правый стик должен
onServoChange("2", 90, true); // Возврат в центр (90°)
onServoChange("1", 90, true); // Возврат в центр (90°)


Menu (Меню):
Расположена справа от центральной кнопки Xbox (с тремя горизонтальными линиями).
должна так же включать и выключать
{button1State !== null && (
<Button
onClick={() => {
const newState = button1State ? 'off' : 'on';
sendCommand('RLY', { pin: 'D0', state: newState });
}}
className="bg-transparent hover:bg-gray-700/30 border border-gray-600 p-2 rounded-full transition-all flex items-center"
>
{button1State ? (
<img width={'25px'} height={'25px'} src="/off.svg" alt="Image" />
) : (
<img width={'25px'} height={'25px'} src="/on.svg" alt="Image" />
)}
</Button>
)}


D-Pad (Крестовина) – направляющие кнопки влево/вправо/вверх/вниз.
вверх - меняет направление двух моторов вперед
вниз - меняет направление двух моторов моторов назад
влево - реверс двигателей - разворот влево
вправо - реверс двигателей - разворот вправо


A (зелёная) – подтверждение, прыжок (в играх). onClick={() => adjustServo('1', -15, false)}
B (красная) – отмена, действие "назад". onClick={() => adjustServo('2', -15, false)}
X (синяя) – взаимодействие (например, подбор предметов)- onClick={() => adjustServo('2', 15, false)}
Y (жёлтая) – часто используется для переключения оружия или камеры.  onClick={() => adjustServo('1', 15, false)}


Аналоговые стики правый -
ось X - onClick={() => adjustServo('2', диапазон 90, true)}
ось Y - onClick={() => adjustServo('1', диапазон 90, true)}

###

нужно переделать стик от джойстика. Сделай чтобы левый стик регулировал ось X от 0 до 180 - центр 90, а правый стик регулировал ось Y от 0 до 180 - центр 90
когда когда стики находятся в нейтральном положении, каждый из них должны установиться в 90 градусов и отправить команду в ардуино.
Сделай погрешность стиков в нейтральном положении 10%
Нужно чтобы два сервопривода (ось X И Y)  #define SERVO1_PIN D7 и #define SERVO2_PIN D8 в точности без задержек повторяли движение стиков. Посмотри клиент сервер и код ардуино, чтобы нигде не было задержек на получение команды от стиков джойстика.
отвечай на русском, покажи где что изменить.
###

создай в папке control файл который будет отвечать за джойстик назови его JoyAnalog
сюда добавь
<div className="relative">
<Button
onClick={() => setShowJoystickMenu(!showJoystickMenu)}
className="bg-transparent hover:bg-gray-700/30 border border-gray-600 p-2 rounded-full transition-all flex items-center"
title={showJoystickMenu ? 'Скрыть выбор джойстика' : 'Показать выбор джойстика'}
>
<img
width={'25px'}
height={'25px'}
src={
selectedJoystick === 'JoystickTurn' ? '/control/arrows-turn.svg' :
selectedJoystick === 'Joystick' ? '/control/arrows-down.svg' :
selectedJoystick === 'JoystickUp' ? '/control/arrows-up.svg' : ''
}
alt="Joystick Select"
/>
</Button>
</div>
выбор джойстика
отвечайн на русском, покажи где что изменить где добавить. (файл который будет отвечать за джойстик - сделай из примеров, которые есть в коде, сделай распознавание подключенного джойстика, когда пользователь выбирает JoyAnalog - за основу возьми джойстик X-Box)