# настройка  \\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\components\control\SocketClient.tsx
```

```



# управление
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\components\control\SocketClient.tsx
```
<div>
                    <Joystick
                        mo="A"
                        onChange={handleMotorAControl}
                        direction={motorADirection}
                        sp={motorASpeed}
                    />

                    <Joystick
                        mo="B"
                        onChange={handleMotorBControl}
                        direction={motorBDirection}
                        sp={motorBSpeed}
                    />

                    <div className="fixed bottom-3 left-1/2 transform -translate-x-1/2 flex flex-col space-y-2 z-50">
                        {showServos && (
                            <>
                        {/* Управление первым сервоприводом */}
                        <div className="flex flex-col items-center space-y-2">
                            {/* Управление первым сервоприводом */}
                            <div className="flex flex-col items-center">
                                <div className="flex items-center justify-center space-x-2">
                                    <Button
                                        onClick={() => adjustServo('1', -180)}
                                        className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 text-gray-600 p-2 rounded-full transition-all"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                    <Button
                                        onClick={() => adjustServo('1', -15)}
                                        className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 text-gray-600 p-2 rounded-full transition-all"
                                    >
                                        <ArrowDown className="h-5 w-5" />
                                    </Button>
                                    <Button
                                        onClick={() => adjustServo('1', 15)}
                                        className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 text-gray-600 p-2 rounded-full transition-all"
                                    >
                                        <ArrowUp className="h-5 w-5" />
                                    </Button>
                                    <Button
                                        onClick={() => adjustServo('1', 180)}
                                        className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 text-gray-600 p-2 rounded-full transition-all"
                                    >
                                        <ArrowRight className="h-5 w-5" />
                                    </Button>
                                </div>
                                <span className="text-sm font-medium text-gray-700 mt-1">{servoAngle}°</span>
                            </div>

                            {/* Управление вторым сервоприводом */}
                            <div className="flex flex-col items-center">
                                <div className="flex items-center justify-center space-x-2">
                                    <Button
                                        onClick={() => adjustServo('2', -180)}
                                        className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 text-gray-600 p-2 rounded-full transition-all"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                    <Button
                                        onClick={() => adjustServo('2', -15)}
                                        className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 text-gray-600 p-2 rounded-full transition-all"
                                    >
                                        <ArrowDown className="h-5 w-5" />
                                    </Button>
                                    <Button
                                        onClick={() => adjustServo('2', 15)}
                                        className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 text-gray-600 p-2 rounded-full transition-all"
                                    >
                                        <ArrowUp className="h-5 w-5" />
                                    </Button>
                                    <Button
                                        onClick={() => adjustServo('2', 180)}
                                        className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 text-gray-600 p-2 rounded-full transition-all"
                                    >
                                        <ArrowRight className="h-5 w-5" />
                                    </Button>
                                </div>
                                <span className="text-sm font-medium text-gray-700 mt-1">{servo2Angle}°</span>
                            </div>
                        </div>
                            </>
                    )}

                        {/* Кнопки реле и закрытия */}
                        <div className="flex items-center justify-center space-x-2">
                            <Button
                                onClick={() => {
                                    const newState = button1State ? 'off' : 'on';
                                    sendCommand('RLY', { pin: 'D0', state: newState });
                                    setButton1State(newState === 'on' ? 1 : 0);
                                }}
                                className={`${
                                    button1State ? 'bg-green-600 hover:bg-green-700' : 'bg-transparent hover:bg-gray-700/30'
                                } backdrop-blur-sm border border-gray-600 text-gray-600 rounded-full transition-all text-xs sm:text-sm flex items-center`}
                            >
                                <Power className="h-4 w-4" />
                            </Button>

                            <Button
                                onClick={() => {
                                    const newState = button2State ? 'off' : 'on';
                                    sendCommand('RLY', { pin: '3', state: newState });
                                    setButton2State(newState === 'on' ? 1 : 0);
                                }}
                                className={`${
                                    button2State ? 'bg-green-600 hover:bg-green-700' : 'bg-transparent hover:bg-gray-700/30'
                                } backdrop-blur-sm border border-gray-600 text-gray-600 rounded-full transition-all text-xs sm:text-sm flex items-center`}
                            >
                                <Power className="h-4 w-4" />
                            </Button>

                            <Button
                                onClick={toggleServosVisibility}
                                className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 text-gray-600 p-2 rounded-full transition-all flex items-center"
                                title={showServos ? 'Скрыть сервоприводы' : 'Показать сервоприводы'}
                            >
                                {showServos ? (
                                    <EyeOff className="h-4 w-4" /> // Иконка "глаз закрыт" когда видно
                                ) : (
                                    <Eye className="h-4 w-4" />    // Иконка "глаз открыт" когда скрыто
                                )}
                            </Button>

                            <Button
                                onClick={handleCloseControls}
                                className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-red-600 text-gray-600 px-4 py-1 sm:px-6 sm:py-2 rounded-full transition-all text-xs sm:text-sm"
                                // style={{ minWidth: '6rem' }}
                            >
                                <Power className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
```