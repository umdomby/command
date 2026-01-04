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
    const [speedDivider, setSpeedDivider] = useState(() => {
        const savedDivider = typeof window !== "undefined" ? localStorage.getItem("speedDivider") : null;
        return savedDivider ? Number(savedDivider) : 1;
    });
    const [servo1Angle, setServo1Angle] = useState(() => {
        const savedServo1 = typeof window !== "undefined" ? localStorage.getItem("servo1Angle") : null;
        return savedServo1 ? Number(savedServo1) : 45;
    });
    const [servo2Angle, setServo2Angle] = useState(() => {
        const savedServo2 = typeof window !== "undefined" ? localStorage.getItem("servo2Angle") : null;
        return savedServo2 ? Number(savedServo2) : 90;
    });
    const [isSlidersVisible, setIsSlidersVisible] = useState(false);
    const [activeSlider, setActiveSlider] = useState<"speedDivider" | "servo1Angle" | "servo2Angle" | null>(null);

    const prevKeyState = useRef({
        keyW: false,
        keyS: false,
        keyA: false,
        keyD: false,
        keyQ: false,
        keyE: false,
        keyArrowRight: false,
        keyArrowLeft: false,
        keyArrowUp: false,
        keyArrowDown: false,
        keySpace: false,
        keyShift: false, // Добавляем отслеживание Shift
        key1: false,
        key68: false,
        key65: false,
        key189: false,
        key187: false,
    });
    const activeDirection = useRef<"forward" | "backward" | "left" | "right" | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        localStorage.setItem("motorSpeedA", motorSpeedA.toString());
        localStorage.setItem("motorSpeedB", motorSpeedB.toString());
        localStorage.setItem("motorSpeedCenter", motorSpeedCenter.toString());
        localStorage.setItem("speedDivider", speedDivider.toString());
        localStorage.setItem("servo1Angle", servo1Angle.toString());
        localStorage.setItem("servo2Angle", servo2Angle.toString());
    }, [motorSpeedA, motorSpeedB, motorSpeedCenter, speedDivider, servo1Angle, servo2Angle]);

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

    const updateMotorSpeeds = (key: "A" | "D", prevA: number, prevB: number, motorSpeedCenter: number) => {
        let newA = prevA;
        let newB = prevB;
        const speedStep = motorSpeedCenter / speedDivider;

        if (key === "A") {
            if (prevA === motorSpeedCenter && prevB === motorSpeedCenter) {
                newA = Math.max(0, prevA - speedStep);
            } else if (prevA < motorSpeedCenter && prevB === motorSpeedCenter) {
                newA = Math.max(0, prevA - speedStep);
            } else if (prevA > motorSpeedCenter && prevB === motorSpeedCenter) {
                newA = Math.max(0, prevA - speedStep);
            } else if (prevA === motorSpeedCenter && prevB > motorSpeedCenter) {
                newB = Math.min(255, prevB + speedStep);
            } else if (prevA === motorSpeedCenter && prevB < motorSpeedCenter) {
                newB = Math.min(255, prevB + speedStep);
            }
        } else if (key === "D") {
            if (prevA === motorSpeedCenter && prevB === motorSpeedCenter) {
                newB = Math.max(0, prevB - speedStep);
            } else if (prevA < motorSpeedCenter && prevB === motorSpeedCenter) {
                newA = Math.min(255, prevA + speedStep);
            } else if (prevA > motorSpeedCenter && prevB === motorSpeedCenter) {
                newA = Math.max(0, prevA - speedStep);
            } else if (prevA === motorSpeedCenter && prevB > motorSpeedCenter) {
                newB = Math.max(0, prevB - speedStep);
            } else if (prevA === motorSpeedCenter && prevB < motorSpeedCenter) {
                newB = Math.max(0, prevB - speedStep);
            }
        }

        return { newA, newB };
    };

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (disabled) return;
            const keyCode = event.keyCode;

            const updateSliderValue = () => {
                if (activeSlider === "speedDivider") {
                    setSpeedDivider((prev) => {
                        const newValue = keyCode === 189 ? Math.max(1, prev - 1) : Math.min(5, prev + 1);
                        return newValue;
                    });
                } else if (activeSlider === "servo1Angle") {
                    setServo1Angle((prev) => {
                        const newValue = keyCode === 189 ? Math.max(0, prev - 1) : Math.min(180, prev + 1);
                        onServoChange("1", newValue, true);
                        return newValue;
                    });
                } else if (activeSlider === "servo2Angle") {
                    setServo2Angle((prev) => {
                        const newValue = keyCode === 189 ? Math.max(0, prev - 1) : Math.min(180, prev + 1);
                        onServoChange("2", newValue, true);
                        return newValue;
                    });
                }
            };

            if ((keyCode === 189 || keyCode === 187) && !prevKeyState.current[`key${keyCode}`] && activeSlider) {
                prevKeyState.current[`key${keyCode}`] = true;
                updateSliderValue();
                intervalRef.current = setInterval(updateSliderValue, 100);
            } else if ((keyCode === 70 || keyCode === 13) && !prevKeyState.current.keyQ) {
                if (motorSpeedA !== motorSpeedB) {
                    const newSpeed = Math.min(motorSpeedA, motorSpeedB);
                    setMotorSpeedA(newSpeed);
                    setMotorSpeedB(newSpeed);
                    setMotorSpeedCenter(newSpeed);
                } else {
                    setMotorSpeedCenter((prev) => {
                        const newSpeed = Math.max(0, prev - 50.25);
                        setMotorSpeedA(newSpeed);
                        setMotorSpeedB(newSpeed);
                        return newSpeed;
                    });
                }
                prevKeyState.current.keyQ = true;
            } else if ((keyCode === 82 || keyCode === 107) && !prevKeyState.current.keyE) {
                if (motorSpeedA !== motorSpeedB) {
                    const newSpeed = Math.max(motorSpeedA, motorSpeedB);
                    setMotorSpeedA(newSpeed);
                    setMotorSpeedB(newSpeed);
                    setMotorSpeedCenter(newSpeed);
                } else {
                    setMotorSpeedCenter((prev) => {
                        const newSpeed = Math.min(255, prev + 50.25);
                        setMotorSpeedA(newSpeed);
                        setMotorSpeedB(newSpeed);
                        return newSpeed;
                    });
                }
                prevKeyState.current.keyE = true;
            } else if (keyCode === 81 && !prevKeyState.current.keyQ) {
                onServoChange("2", 180, true);
                prevKeyState.current.keyQ = true;
            } else if (keyCode === 69 && !prevKeyState.current.keyE) {
                onServoChange("2", 0, true);
                prevKeyState.current.keyE = true;
            } else if (keyCode === 87 && !prevKeyState.current.keyW) {
                if (motorSpeedA !== motorSpeedB) {
                    const newSpeed = Math.max(motorSpeedA, motorSpeedB);
                    setMotorSpeedA(newSpeed);
                    setMotorSpeedB(newSpeed);
                    setMotorSpeedCenter(newSpeed);
                }
                activeDirection.current = "backward";
                prevKeyState.current.keyW = true;
                sendMotorCommand();
            } else if (keyCode === 83 && !prevKeyState.current.keyS) {
                if (motorSpeedA !== motorSpeedB) {
                    const newSpeed = Math.max(motorSpeedA, motorSpeedB);
                    setMotorSpeedA(newSpeed);
                    setMotorSpeedB(newSpeed);
                    setMotorSpeedCenter(newSpeed);
                }
                activeDirection.current = "forward";
                prevKeyState.current.keyS = true;
                sendMotorCommand();
            } else if (keyCode === 68 && !prevKeyState.current.key68) {
                if (prevKeyState.current.keyW || prevKeyState.current.keyS) {
                    const { newA, newB } = updateMotorSpeeds("A", motorSpeedA, motorSpeedB, motorSpeedCenter);
                    setMotorSpeedA(newA);
                    setMotorSpeedB(newB);
                    prevKeyState.current.key68 = true;
                    sendMotorCommand();
                } else {
                    activeDirection.current = "right";
                    prevKeyState.current.key68 = true;
                    sendMotorCommand();
                }
            } else if (keyCode === 65 && !prevKeyState.current.key65) {
                if (prevKeyState.current.keyW || prevKeyState.current.keyS) {
                    const { newA, newB } = updateMotorSpeeds("D", motorSpeedA, motorSpeedB, motorSpeedCenter);
                    setMotorSpeedA(newA);
                    setMotorSpeedB(newB);
                    prevKeyState.current.key65 = true;
                    sendMotorCommand();
                } else {
                    activeDirection.current = "left";
                    prevKeyState.current.key65 = true;
                    sendMotorCommand();
                }
            } else if (keyCode === 39 && !prevKeyState.current.keyArrowRight) {
                onServoChangeCheck("2", -15, false);
                prevKeyState.current.keyArrowRight = true;
            } else if (keyCode === 37 && !prevKeyState.current.keyArrowLeft) {
                onServoChangeCheck("2", +15, false);
                prevKeyState.current.keyArrowLeft = true;
            } else if (keyCode === 38 && !prevKeyState.current.keyArrowUp) {
                onServoChangeCheck("1", 15, false);
                prevKeyState.current.keyArrowUp = true;
            } else if (keyCode === 40 && !prevKeyState.current.keyArrowDown) {
                onServoChangeCheck("1", -15, false);
                prevKeyState.current.keyArrowDown = true;
            } else if (keyCode === 32 && !prevKeyState.current.keySpace) {
                onServoChange("2", servo2Angle, true); // Изменено: только servo2
                prevKeyState.current.keySpace = true;
            } else if (keyCode === 16 && !prevKeyState.current.keyShift) { // Добавлено: Shift для servo1
                onServoChange("1", servo1Angle, true);
                prevKeyState.current.keyShift = true;
            } else if (keyCode === 49 && !prevKeyState.current.key1) {
                console.log("Клавиша 1 нажата, переключение реле D0");
                onRelayChange?.("D0", "toggle");
                prevKeyState.current.key1 = true;
            }
        },
        [disabled, motorSpeedA, motorSpeedB, motorSpeedCenter, speedDivider, servo1Angle, servo2Angle, onServoChange, onServoChangeCheck, onRelayChange, sendMotorCommand, activeSlider]
    );

    const handleKeyUp = useCallback(
        (event: KeyboardEvent) => {
            if (disabled) return;

            const keyCode = event.keyCode;

            if (keyCode === 189 || keyCode === 187) {
                prevKeyState.current[`key${keyCode}`] = false;
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            } else if (keyCode === 87) {
                prevKeyState.current.keyW = false;
                if (!prevKeyState.current.keyS && !prevKeyState.current.keyA && !prevKeyState.current.keyD && !prevKeyState.current.key65 && !prevKeyState.current.key68) {
                    activeDirection.current = null;
                    sendMotorCommand();
                }
            } else if (keyCode === 83) {
                prevKeyState.current.keyS = false;
                if (!prevKeyState.current.keyW && !prevKeyState.current.keyA && !prevKeyState.current.keyD && !prevKeyState.current.key65 && !prevKeyState.current.key68) {
                    activeDirection.current = null;
                    sendMotorCommand();
                }
            } else if (keyCode === 65) {
                prevKeyState.current.key65 = false;
                if (!prevKeyState.current.keyW && !prevKeyState.current.keyS && !prevKeyState.current.keyA && !prevKeyState.current.keyD && !prevKeyState.current.key68) {
                    activeDirection.current = null;
                    sendMotorCommand();
                }
            } else if (keyCode === 68) {
                prevKeyState.current.key68 = false;
                if (!prevKeyState.current.keyW && !prevKeyState.current.keyS && !prevKeyState.current.keyA && !prevKeyState.current.keyD && !prevKeyState.current.key65) {
                    activeDirection.current = null;
                    sendMotorCommand();
                }
            } else if (keyCode === 70 || keyCode === 13 || keyCode === 81) {
                prevKeyState.current.keyQ = false;
            } else if (keyCode === 82 || keyCode === 107 || keyCode === 69) {
                prevKeyState.current.keyE = false;
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
            } else if (keyCode === 16) { // Добавлено: обработка отпускания Shift
                prevKeyState.current.keyShift = false;
            } else if (keyCode === 49) {
                prevKeyState.current.key1 = false;
            }
        },
        [disabled, sendMotorCommand]
    );

    useEffect(() => {
        if (activeDirection.current) {
            sendMotorCommand();
        }
    }, [motorSpeedA, motorSpeedB, motorSpeedCenter, speedDivider, sendMotorCommand]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    return (
        <div className="flex flex-col items-center gap-2 no-select">
            <span
                className="text-lg font-medium text-green-300 bg-black/50 px-2 py-0 rounded cursor-pointer"
                onClick={() => setIsSlidersVisible(!isSlidersVisible)}
            >
                {motorSpeedA.toFixed()} {motorSpeedB.toFixed()}
            </span>
            {isSlidersVisible && (
                <>
                    <div className="w-[220px]">
                        <div className="text-xs text-green-300 text-center">{speedDivider}</div>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            value={speedDivider}
                            onChange={(e) => setSpeedDivider(Number(e.target.value))}
                            onFocus={() => setActiveSlider("speedDivider")}
                            className="w-full h-1 bg-black/30 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-0"
                            style={{
                                background: "linear-gradient(to right, rgba(0, 255, 0, 0.3) 0%, rgba(0, 255, 0, 0.3) 100%)",
                            }}
                        />
                    </div>
                    <div className="w-[220px]">
                        <label className="text-xs text-green-300 text-center">V.({servo1Angle}°)</label>
                        <input
                            type="range"
                            min="0"
                            max="180"
                            step="1"
                            value={servo1Angle}
                            onChange={(e) => {
                                const newAngle = Number(e.target.value);
                                setServo1Angle(newAngle);
                                onServoChange("1", newAngle, true);
                            }}
                            onFocus={() => setActiveSlider("servo1Angle")}
                            className="w-full h-1 bg-black/30 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-0"
                            style={{
                                background: "linear-gradient(to right, rgba(0, 255, 0, 0.3) 0%, rgba(0, 255, 0, 0.3) 100%)",
                            }}
                        />
                    </div>
                    <div className="w-[220px]">
                        <label className="text-xs text-green-300 text-center">H.({servo2Angle}°)</label>
                        <input
                            type="range"
                            min="0"
                            max="180"
                            step="1"
                            value={servo2Angle}
                            onChange={(e) => {
                                const newAngle = Number(e.target.value);
                                setServo2Angle(newAngle);
                                onServoChange("2", newAngle, true);
                            }}
                            onFocus={() => setActiveSlider("servo2Angle")}
                            className="w-full h-1 bg-black/30 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-0"
                            style={{
                                background: "linear-gradient(to right, rgba(0, 255, 0, 0.3) 0%, rgba(0, 255, 0, 0.3) 100%)",
                            }}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default Keyboard;