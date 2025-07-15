"use client";
import { useCallback, useEffect, useRef, useState } from "react";

interface KeyboardProps {
    onChange: ({ x, y }: { x: number; y: number }) => void;
    onServoChange: (servoId: "1" | "2", value: number, isAbsolute: boolean) => void;
    onServoChangeCheck: (servoId: "1" | "2", value: number, isAbsolute: boolean) => void;
    onRelayChange?: (pin: string, state: string) => void;
    disabled?: boolean;
}

const Keyboard = ({ onChange, onServoChange, onServoChangeCheck, onRelayChange, disabled }: KeyboardProps) => {
    const [motorSpeedA, setMotorSpeedA] = useState(() => {
        const savedSpeedA = typeof window !== "undefined" ? localStorage.getItem("motorSpeedA") : null;
        return savedSpeedA ? Number(savedSpeedA) : 100;
    });
    const [motorSpeedB, setMotorSpeedB] = useState(() => {
        const savedSpeedB = typeof window !== "undefined" ? localStorage.getItem("motorSpeedB") : null;
        return savedSpeedB ? Number(savedSpeedB) : 100;
    });
    const [motorSpeedCenter, setMotorSpeedCenter] = useState(() => {
        const savedSpeedCenter = typeof window !== "undefined" ? localStorage.getItem("motorSpeedCenter") : null;
        return savedSpeedCenter ? Number(savedSpeedCenter) : 100;
    });

    const prevKeyState = useRef({
        keyW: false,
        keyS: false,
        keyA: false,
        keyD: false,
        keyQ: false, // For speed decrease
        keyE: false, // For speed increase
        keyArrowRight: false,
        keyArrowLeft: false,
        keyArrowUp: false,
        keyArrowDown: false,
        keySpace: false,
        key1: false,
        key68: false, // For 'A'
        key65: false, // For 'D'
    });
    const activeDirection = useRef<"forward" | "backward" | "left" | "right" | null>(null);

    useEffect(() => {
        localStorage.setItem("motorSpeedA", motorSpeedA.toString());
        localStorage.setItem("motorSpeedB", motorSpeedB.toString());
        localStorage.setItem("motorSpeedCenter", motorSpeedCenter.toString());
    }, [motorSpeedA, motorSpeedB, motorSpeedCenter]);

    // Функция для отправки команд моторов на основе текущего направления и скорости
    const sendMotorCommand = useCallback(() => {
        if (disabled) return;

        let motorA = 0;
        let motorB = 0;

        if (activeDirection.current === "forward") {
            motorA = motorSpeedA;
            motorB = motorSpeedB;
        } else if (activeDirection.current === "backward") {
            motorA = -motorSpeedA;
            motorB = -motorSpeedB;
        } else if (activeDirection.current === "left") {
            motorA = -motorSpeedCenter;
            motorB = motorSpeedCenter;
        } else if (activeDirection.current === "right") {
            motorA = motorSpeedCenter;
            motorB = -motorSpeedCenter;
        }

        if (motorA !== 0 || motorB !== 0) {
            onChange({ x: motorA, y: motorB });
        } else {
            onChange({ x: 0, y: 0 });
        }
    }, [disabled, motorSpeedA, motorSpeedB, motorSpeedCenter, onChange]);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (disabled) return;

            const keyCode = event.keyCode;

            // Управление скоростью моторов (motorSpeedCenter)
            if ((keyCode === 70 || keyCode === 13) && !prevKeyState.current.keyQ) {
                // F, NumPad - или Q: уменьшение скорости на 25
                setMotorSpeedCenter((prev) => {
                    const newSpeed = Math.max(0, prev - 25);
                    setMotorSpeedA(newSpeed);
                    setMotorSpeedB(newSpeed);
                    return newSpeed;
                });
                prevKeyState.current.keyQ = true;
            } else if ((keyCode === 82 || keyCode === 107) && !prevKeyState.current.keyE) {
                // R, NumPad + или E: увеличение скорости на 25
                setMotorSpeedCenter((prev) => {
                    const newSpeed = Math.min(255, prev + 25);
                    setMotorSpeedA(newSpeed);
                    setMotorSpeedB(newSpeed);
                    return newSpeed;
                });
                prevKeyState.current.keyE = true;
            }

            // Управление моторами W (87) и S (83)
            if (keyCode === 87 && !prevKeyState.current.keyW) {
                // W: назад
                if (motorSpeedA !== motorSpeedCenter || motorSpeedB !== motorSpeedCenter) {
                    setMotorSpeedA(100);
                    setMotorSpeedB(100);
                    setMotorSpeedCenter(100);
                }
                activeDirection.current = "backward";
                prevKeyState.current.keyW = true;
                sendMotorCommand();
            } else if (keyCode === 83 && !prevKeyState.current.keyS) {
                // S: вперед
                if (motorSpeedA !== motorSpeedCenter || motorSpeedB !== motorSpeedCenter) {
                    setMotorSpeedA(100);
                    setMotorSpeedB(100);
                    setMotorSpeedCenter(100);
                }
                activeDirection.current = "forward";
                prevKeyState.current.keyS = true;
                sendMotorCommand();
            }

            // Управление моторами A (68) и D (65) в сочетании с W (87) или S (83)
            if (prevKeyState.current.keyW || prevKeyState.current.keyS) {
                if (keyCode === 68 && !prevKeyState.current.key68) {
                    // Клавиша A: изменение скорости моторов
                    setMotorSpeedA((prevA) => {
                        let newA = prevA;
                        setMotorSpeedB((prevB) => {
                            let newB = prevB;

                            if (prevA === motorSpeedCenter && prevB === motorSpeedCenter) {
                                newA = Math.max(0, prevA - 25);
                            } else if (prevA < motorSpeedCenter && prevB === motorSpeedCenter) {
                                newA = Math.max(0, prevA - 25);
                            } else if (prevA > motorSpeedCenter && prevB === motorSpeedCenter) {
                                newA = Math.max(0, prevA - 25);
                            } else if (prevA === motorSpeedCenter && prevB > motorSpeedCenter) {
                                newB = Math.min(255, prevB + 25);
                            } else if (prevA === motorSpeedCenter && prevB < motorSpeedCenter) {
                                newB = Math.min(255, prevB + 25);
                            }
                            // Если предыдущие условия не сработали и мы уже изменяли скорости
                            // то нужно привести их к центру, но не полностью, а по 25
                            if (newA === prevA && newB === prevB && prevA !== motorSpeedCenter) {
                                newA = Math.min(motorSpeedCenter, prevA + 25);
                            }
                            if (newA === prevA && newB === prevB && prevB !== motorSpeedCenter) {
                                newB = Math.max(motorSpeedCenter, prevB - 25);
                            }
                            return newB;
                        });
                        return newA;
                    });
                    prevKeyState.current.key68 = true;
                    sendMotorCommand();
                } else if (keyCode === 65 && !prevKeyState.current.key65) {
                    // Клавиша D: изменение скорости моторов
                    setMotorSpeedB((prevB) => {
                        let newB = prevB;
                        setMotorSpeedA((prevA) => {
                            let newA = prevA;

                            if (prevA === motorSpeedCenter && prevB === motorSpeedCenter) {
                                newB = Math.max(0, prevB - 25);
                            } else if (prevA < motorSpeedCenter && prevB === motorSpeedCenter) {
                                newA = Math.min(255, prevA + 25);
                            } else if (prevA > motorSpeedCenter && prevB === motorSpeedCenter) {
                                newA = Math.max(0, prevA - 25);
                            } else if (prevA === motorSpeedCenter && prevB > motorSpeedCenter) {
                                newB = Math.max(0, prevB - 25);
                            } else if (prevA === motorSpeedCenter && prevB < motorSpeedCenter) {
                                newB = Math.max(0, prevB - 25);
                            }
                            // Если предыдущие условия не сработали и мы уже изменяли скорости
                            // то нужно привести их к центру, но не полностью, а по 25
                            if (newA === prevA && newB === prevB && prevA !== motorSpeedCenter) {
                                newA = Math.max(motorSpeedCenter, prevA - 25);
                            }
                            if (newA === prevA && newB === prevB && prevB !== motorSpeedCenter) {
                                newB = Math.min(motorSpeedCenter, prevB + 25);
                            }
                            return newA;
                        });
                        return newB;
                    });
                    prevKeyState.current.key65 = true;
                    sendMotorCommand();
                }
            }


            // Управление моторами Q (81) и E (69) - разворот
            if (keyCode === 81 && !prevKeyState.current.keyA) {
                // Q: разворот влево
                activeDirection.current = "left";
                prevKeyState.current.keyA = true;
                sendMotorCommand();
            } else if (keyCode === 69 && !prevKeyState.current.keyD) {
                // E: разворот вправо
                activeDirection.current = "right";
                prevKeyState.current.keyD = true;
                sendMotorCommand();
            }

            // Управление сервоприводами
            if (keyCode === 39 && !prevKeyState.current.keyArrowRight) {
                // Стрелка вправо: Servo2 +15
                onServoChangeCheck("2", -15, false);
                prevKeyState.current.keyArrowRight = true;
            } else if (keyCode === 37 && !prevKeyState.current.keyArrowLeft) {
                // Стрелка влево: Servo2 -15
                onServoChangeCheck("2", +15, false);
                prevKeyState.current.keyArrowLeft = true;
            } else if (keyCode === 38 && !prevKeyState.current.keyArrowUp) {
                // Стрелка вверх: Servo1 +15
                onServoChangeCheck("1", 15, false);
                prevKeyState.current.keyArrowUp = true;
            } else if (keyCode === 40 && !prevKeyState.current.keyArrowDown) {
                // Стрелка вниз: Servo1 -15
                onServoChangeCheck("1", -15, false);
                prevKeyState.current.keyArrowDown = true;
            } else if (keyCode === 32 && !prevKeyState.current.keySpace) {
                // Пробел: установка Servo1 и Servo2 в 90 градусов
                onServoChange("1", 90, true);
                onServoChange("2", 90, true);
                prevKeyState.current.keySpace = true;
            }

            // Управление реле D0
            if (keyCode === 49 && !prevKeyState.current.key1) {
                // Клавиша 1: переключение реле D0
                console.log("Клавиша 1 нажата, переключение реле D0");
                onRelayChange?.("D0", "toggle");
                prevKeyState.current.key1 = true;
            }
        },
        [disabled, motorSpeedA, motorSpeedB, motorSpeedCenter, onServoChange, onServoChangeCheck, onRelayChange, sendMotorCommand]
    );

    const handleKeyUp = useCallback(
        (event: KeyboardEvent) => {
            if (disabled) return;

            const keyCode = event.keyCode;

            // Сбрасываем состояние клавиш моторов
            if (keyCode === 87) {
                prevKeyState.current.keyW = false;
                if (!prevKeyState.current.keyS && !prevKeyState.current.keyA && !prevKeyState.current.keyD) {
                    activeDirection.current = null;
                    sendMotorCommand();
                }
            } else if (keyCode === 83) {
                prevKeyState.current.keyS = false;
                if (!prevKeyState.current.keyW && !prevKeyState.current.keyA && !prevKeyState.current.keyD) {
                    activeDirection.current = null;
                    sendMotorCommand();
                }
            } else if (keyCode === 81) {
                prevKeyState.current.keyA = false; // Corresponds to keyQ in prevKeyState
                if (!prevKeyState.current.keyW && !prevKeyState.current.keyS && !prevKeyState.current.keyD) {
                    activeDirection.current = null;
                    sendMotorCommand();
                }
            } else if (keyCode === 69) {
                prevKeyState.current.keyD = false; // Corresponds to keyE in prevKeyState
                if (!prevKeyState.current.keyW && !prevKeyState.current.keyS && !prevKeyState.current.keyA) {
                    activeDirection.current = null;
                    sendMotorCommand();
                }
            } else if (keyCode === 70 || keyCode === 13) {
                prevKeyState.current.keyQ = false; // For speed decrease
            } else if (keyCode === 82 || keyCode === 107) {
                prevKeyState.current.keyE = false; // For speed increase
            } else if (keyCode === 39) {
                prevKeyState.current.keyArrowRight = false;
            } else if (keyCode === 37) {
                prevKeyState.current.keyArrowLeft = false;
            } else if (keyCode === 38) {
                prevKeyState.current.keyArrowUp = false;
            } else if (keyCode === 40) {
                prevKeyState.current.keyArrowDown = false;
            } else if (keyCode === 32) {
                prevKeyState.current.keySpace = false;
            } else if (keyCode === 49) {
                prevKeyState.current.key1 = false;
            } else if (keyCode === 65) {
                prevKeyState.current.key65 = false;
            } else if (keyCode === 68) {
                prevKeyState.current.key68 = false;
            }
        },
        [disabled, sendMotorCommand]
    );

    // Реагируем на изменение motorSpeedA, motorSpeedB, motorSpeedCenter
    useEffect(() => {
        if (activeDirection.current) {
            sendMotorCommand();
        }
    }, [motorSpeedA, motorSpeedB, motorSpeedCenter, sendMotorCommand]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    return (
        <div className="flex flex-col items-center">
            <span className="text-lg font-medium text-green-300 bg-black/50 px-2 py-0 rounded">
                {motorSpeedA} {motorSpeedB}
            </span>
        </div>
    );
};

export default Keyboard;