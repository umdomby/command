нужно управлять моторами джойстиком Xbox

LT (Left Trigger) – левый аналоговый триггер (тормоз в гонках, прицеливание в шутерах) - включает:
мотор A вперед

RT (Right Trigger) – правый аналоговый триггер (газ в гонках, стрельба) - включает
мотор B вперед


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
ось X - onClick={() => adjustServo('2', диапазон 0 - 180, true)}
ось Y - onClick={() => adjustServo('1', диапазон 0 - 180, true)}


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