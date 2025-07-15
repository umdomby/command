нужно сделать управление как на клавиатуре но только на кнопках на экране переделать кнопки клавиатуры
сделай два крестика с круглыми полупрозрачными миниатюрными кнопочками по центру по бокам экрана в горизонтальном и вертикальном положении, чтобы крестик управления моторами был по центру слева а крестик управления серво был по центру справа
крестик управления клавишами моторами 87 68 83 65 и крестик управления клавишами серво 38 39 40 37

этот блок не нужен с зажатой клавишей 87+65 87+68 и 83+65 83+68
пробел - установки центра серво1 и серво2 сделай круглую кнопку в центре крестика (крестик состоит из 4 круглых кнопок, а вместо пробела на клавиатуре сделай 5-ый кружочек в центре)

тебе не надо будет {motorSpeedA.toFixed()} {motorSpeedB.toFixed()}  и motorSpeedCenter
сделай одну переменную для установки скорости motorSpeed и выведи ее там же, но по бокам сделай слева минус, справа плюс
- {motorSpeed} + для изменения скорости от 52.25 до 255 получится 5 скоростей motorSpeed одна скорость для двух моторов
при нажатии на motorSpeed нужно вывести так же ползунки для регулировки серво1 и серво2

                    <div className="w-[60px]">
                        <label className="text-xs text-green-300 text-center">V. ({servo1Angle}°)</label>
                        <input
                            type="range"
                            min="0"
                            max="180"
                            step="1"
                            value={servo1Angle}
                            onChange={(e) => setServo1Angle(Number(e.target.value))}
                            className="w-full h-1 bg-black/30 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-0"
                            style={{
                                background: "linear-gradient(to right, rgba(0, 255, 0, 0.3) 0%, rgba(0, 255, 0, 0.3) 100%)",
                            }}
                        />
                    </div>
                    <div className="w-[60px]">
                        <label className="text-xs text-green-300 text-center">H. ({servo2Angle}°)</label>
                        <input
                            type="range"
                            min="0"
                            max="180"
                            step="1"
                            value={servo2Angle}
                            onChange={(e) => setServo2Angle(Number(e.target.value))}
                            className="w-full h-1 bg-black/30 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-0"
                            style={{
                                background: "linear-gradient(to right, rgba(0, 255, 0, 0.3) 0%, rgba(0, 255, 0, 0.3) 100%)",
                            }}
                        />
                    </div>
при обратном нажатии на motorSpeed - настройки серво скрывались, так же учти что это будут кнопки управляться и на мобильных устройствах андройд и iOS
сделай компонент ButtonControl.tsx

добавь его к кнопкам с такой же логикой управления
<Button
onClick={() => {
setSelectedJoystick('Joystick');
setShowJoystickMenu(false);
}}
className="bg-transparent hover:bg-gray-700/30 rounded-full transition-all flex items-center p-0 z-155"
>
<img width={'60px'} height={'60px'} className="object-contain" src="/control/arrows-down.svg" alt="Down Joystick" />
</Button>
<Button
onClick={() => {
setSelectedJoystick('JoystickUp');
setShowJoystickMenu(false);
}}
className="bg-transparent hover:bg-gray-700/30 rounded-full transition-all flex items-center p-0 z-155"
>
<img width={'60px'} height={'60px'} className="object-contain" src="/control/arrows-up.svg" alt="Up Joystick" />
</Button>
<Button
onClick={() => {
setSelectedJoystick('JoystickTurn');
setShowJoystickMenu(false);
}}
className="bg-transparent hover:bg-gray-700/30 rounded-full transition-all flex items-center p-0 z-155"
>
<img width={'60px'} height={'60px'} className="object-contain" src="/control/arrows-turn.svg" alt="Turn Joystick" />
</Button>
<Button
onClick={() => {
setSelectedJoystick('JoyAnalog');
setShowJoystickMenu(false);
}}
className="bg-transparent hover:bg-gray-700/30 rounded-full transition-all flex items-center p-0 z-155"
>
<img width={'60px'} height={'60px'} className="object-contain" src="/control/xbox-controller.svg" alt="Xbox Joystick" />
</Button>
<Button
onClick={() => {
setSelectedJoystick('Keyboard');
setShowJoystickMenu(false);
}}
className="bg-transparent hover:bg-gray-700/30 rounded-full transition-all flex items-center p-0 z-155"
>
<img width={'60px'} height={'60px'} className="object-contain" src="/control/keyboard.svg" alt="Keyboard" />
</Button>

сделай компонент ButtonControl по умолчанию, если нет данных в localStorage

SocketClient дай точечные изменения где что изменить-добавить, отвечай на русском, даю пример управления клавиатурой
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\components\control\Keyboard.tsx
отвечай на русском
