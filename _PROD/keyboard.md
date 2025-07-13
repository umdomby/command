нужно сделать управление клавиатурой, аналогично как управляется JoyAnalog создай файл в
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\components\control Keyboard.tsx

1. Сделать управление моторами в Keyboard.tsx по аналогии с JoyAnalog
        // Аналоговые триггеры (LT и RT) нужно перевести на режим работы с клавиатуры, с изменяемой скоростью Q(81) и E(69) на клавитуре, не учитывая раскладку, Q - 25 к скорости, E + 25 к скорости
        const ltValue = gamepad.buttons[6].value; // Left Trigger
        const rtValue = gamepad.buttons[7].value; // Right Trigger
        const motorASpeed = Math.round(ltValue * 255); // Мотор A
        const motorBSpeed = Math.round(rtValue * 255); // Мотор B

//клавиатура id кнопки чтобы не учитывать раскладку управление моторомаи с клавиатуры
w(87)- назад  отправляй команду с установленной скоростью,  Скорость для обоих моторов {motorSpeed}
s(83)- вперед отправляй команду с установленной скоростью  Скорость, для обоих моторов {motorSpeed}
a(65)- разворот влево отправляй команду с установленной скоростью,  Скорость для обоих моторов: {motorSpeed}
d(68)- разворот вправо отправляй команду с установленной скоростью,  Скорость для обоих моторов: {motorSpeed}

        // Кнопки A, B, X, Y
        const buttonA = gamepad.buttons[0].pressed; // A (зеленая)
        const buttonB = gamepad.buttons[1].pressed; // B (красная)
        const buttonX = gamepad.buttons[2].pressed; // X (синяя)
        const buttonY = gamepad.buttons[3].pressed; // Y (желтая)


изменять скорость
"q" - устанавливает с какой скоростью (значение уменьшается на 25) 
"e"  - устанавливает с какой скоростью (значение увеличивается на 25) 
```
устанавливается скорость на клавиатуре кнопками  Q и E 
сделай одну устанавливаемую скорость для моторов A И B, которая регулируется и изменяется Q и E и аналогично oyAnalog.tsx отправляй моторами с установленной скоростью, и сделай чтобы скорость моторов в Скорость: {motorSpeed} изменялось
"Q" - устанавливает с какой скоростью (значение уменьшается на 25) 
"E"  - устанавливает с какой скоростью (значение увеличивается на 25) 
motorSpeed - так же должно сохраняться в localstorage , если в первоначальном запуске в localstorage данных нет, установи 255 значение для обоих моторов, и для обоих моторов это значение устанавливается Q - минус на 25,  E плюс 25 и значение отображалось в 
            <span className="text-lg font-medium text-green-300 bg-black/50 px-2 py-1 rounded">
                Скорость: {motorSpeed}
            </span>
```

2. Сделать управление servo1 и servo2 в Keyboard.tsx по аналогии с JoyAnalog

на клавиатуре стрелка вправо(39) SERVO1 +15
на клавиатуре стрелка влево(37) SERVO1  -15
на клавиатуре стрелка вверх(38) SERVO2  +15
на клавиатуре стрелка вниз(40) SERVO2  -15

        // Кнопки для управления сервоприводами
        if (buttonA && !prevButtonState.current.buttonA) {
            onServoChangeCheck("1", -15, false);
        }
        if (buttonB && !prevButtonState.current.buttonB) {
            onServoChangeCheck("2", -15, false);
        }
        if (buttonX && !prevButtonState.current.buttonX) {
            onServoChangeCheck("2", 15, false);
        }
        if (buttonY && !prevButtonState.current.buttonY) {
            onServoChangeCheck("1", 15, false);
        }
// клавиатура пробел(32) устанавливает Servo1 и Servo2, ось X и ось Y в 90 градусов

3. Включать и выключать D0
нужно чтобы D0 включалось кнопкой на клавиатуре "1"



привожу код
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\components\control\SocketClient.tsx

и для примера
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\components\control\JoyAnalog.tsx

нужно внести логику в управление клавишами 87 83 13 107
добавь клавиши 65 и 68 для будущей логики

добавь переменные {motorSpeedA} {motorSpeedB} {motorSpeedCenter} удали  {motorSpeed}
при нажатии клавиши 87 или 83 нужно запомнить едуную скорость для двух моторов motorSpeedCenter, если при нажатии клавиши 87 или 83 скорости у моторов {motorSpeedA} {motorSpeedB} разные то {motorSpeedA} и {motorSpeedB} должны стать равными 100, и 100 выбрать как центр скорости motorSpeedCenter.

```ы
центр скорости {motorSpeedCenter} должен оставаться неизменным при нажатии W (87) или S (83) и A (65) и D (68)
Изменять {motorSpeedCenter}могут только клавишами NumPad + (107) + 25 и NumPad - (13) - 25. Скорости моторов A и B (motorASpeed, motorBSpeed) 
если motorSpeedA = motorSpeedCenter и motorSpeedB = motorSpeedCenter, нажимаем клавиши (65 по нескольку раз с зажатой 87) 87+65,+65,+65... то motorSpeedA= -25,-25,-25... пока  motorSpeedA < motorSpeedCenter
если motorSpeedA = motorSpeedCenter и motorSpeedB = motorSpeedCenter, нажимаем клавиши (68 по нескольку раз с зажатой 87) 87+68,+68,+68... то motorSpeedB= -25,-25,-25... пока  motorSpeedB < motorSpeedCenter
если motorSpeedA < motorSpeedCenter и motorSpeedB = motorSpeedCenter, нажимаем клавиши (65 по нескольку раз с зажатой 87) 87+65,+65,+65... то motorSpeedA= -25,-25,-25... пока  motorSpeedA = motorSpeedCenter
если motorSpeedA > motorSpeedCenter и motorSpeedB = motorSpeedCenter, нажимаем клавиши (65 по нескольку раз с зажатой 87) 87+65,+65,+65... то motorSpeedA= -25,-25,-25... пока  motorSpeedA = 0
если motorSpeedA = motorSpeedCenter и motorSpeedB > motorSpeedCenter, нажимаем клавиши (65 по нескольку раз с зажатой 87) 87+65,+65,+65... то motorSpeedB= +25,+25,+25... пока  motorSpeedA = motorSpeedCenter
если motorSpeedA = motorSpeedCenter и motorSpeedB < motorSpeedCenter, нажимаем клавиши (65 по нескольку раз с зажатой 87) 87+65,+65,+65... то motorSpeedB= +25,+25,+25... пока  motorSpeedA = motorSpeedCenter
если motorSpeedA < motorSpeedCenter и motorSpeedB = motorSpeedCenter, нажимаем клавиши (68 по нескольку раз с зажатой 87) 87+68,+68,+68... то motorSpeedA= +25,+25,+25... пока  motorSpeedA = motorSpeedCenter
если motorSpeedA > motorSpeedCenter и motorSpeedB = motorSpeedCenter, нажимаем клавиши (68 по нескольку раз с зажатой 87) 87+68,+68,+68... то motorSpeedA= -25,-25,-25... пока  motorSpeedA = motorSpeedCenter
если motorSpeedA = motorSpeedCenter и motorSpeedB > motorSpeedCenter, нажимаем клавиши (68 по нескольку раз с зажатой 87) 87+68,+68,+68... то motorSpeedB= -25,-25,-25... пока  motorSpeedA = 0
если motorSpeedA = motorSpeedCenter и motorSpeedB < motorSpeedCenter, нажимаем клавиши (68 по нескольку раз с зажатой 87) 87+68,+68,+68... то motorSpeedA= -25,-25,-25... пока  motorSpeedA = 0

если motorSpeedA = motorSpeedCenter и motorSpeedB = 0, нажимаем клавиши (68 по нескольку раз с зажатой 87) 87+68,+68,+68... 
если motorSpeedB = motorSpeedCenter и motorSpeedA = 0, нажимаем клавиши (65 по нескольку раз с зажатой 87) 87+65,+65,+65... 

эти условия должны работать все по отдельнности, работает только одно условие из всех

нажатие клавиши 107 или 82 = motorSpeedCenter +25, motorSpeedA+25, motorSpeedB+25
нажатие клавиши 13 или 70 = motorSpeedCenter -25, motorSpeedA-25, motorSpeedB-25
```

так же сделай аналогично с клавишей 83+65 и 83+68

выведи скорость двух моторов motorSpeedA и motorSpeedB, сохраняй положение двух моторов в localstorage
<div className="flex flex-col items-center">
<span className="text-lg font-medium text-green-300 bg-black/50 px-2 py-0 rounded">
{motorSpeedA} {motorSpeedB}
</span>
</div>
логику клавиш 81 и 69 не трогай
Отвечай на русском.

