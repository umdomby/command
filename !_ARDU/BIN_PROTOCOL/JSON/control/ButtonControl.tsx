"use client";
import { useCallback, useEffect, useRef, useState } from "react";

interface ButtonControlProps {
    onChange: ({ x, y }: { x: number; y: number }) => void;
    onServoChange: (servoId: "1" | "2", value: number, isAbsolute: boolean) => void;
    onServoChangeCheck: (servoId: "1" | "2", value: number, isAbsolute: boolean) => void;
    onRelayChange?: (pin: string, state: string) => void;
    disabled?: boolean;
}

const ButtonControl = ({ onChange, onServoChange, onServoChangeCheck, onRelayChange, disabled }: ButtonControlProps) => {
    const [motorSpeed, setMotorSpeed] = useState(() => {
        const savedSpeed = typeof window !== "undefined" ? localStorage.getItem("motorSpeed") : null;
        return savedSpeed ? Number(savedSpeed) : 157.5;
    });
    const [servo1Angle, setServo1Angle] = useState(() => {
        const savedServo1 = typeof window !== "undefined" ? localStorage.getItem("servo1Angle") : null;
        return savedServo1 ? Number(savedServo1) : 90;
    });
    const [servo2Angle, setServo2Angle] = useState(() => {
        const savedServo2 = typeof window !== "undefined" ? localStorage.getItem("servo2Angle") : null;
        return savedServo2 ? Number(savedServo2) : 90;
    });
    const [isSlidersVisible, setIsSlidersVisible] = useState(false);

    const prevButtonState = useRef({
        forward: false,
        backward: false,
        left: false,
        right: false,
        servoUp: false,
        servoDown: false,
        servoLeft: false,
        servoRight: false,
        center: false,
    });
    const activeDirection = useRef<"forward" | "backward" | "left" | "right" | null>(null);

    useEffect(() => {
        localStorage.setItem("motorSpeed", motorSpeed.toString());
        localStorage.setItem("servo1Angle", servo1Angle.toString());
        localStorage.setItem("servo2Angle", servo2Angle.toString());
    }, [motorSpeed, servo1Angle, servo2Angle]);

    const speedSteps = [52.25, 103.5, 154.75, 206, 255];

    const sendMotorCommand = useCallback(() => {
        if (disabled) return;

        let motorA = 0;
        let motorB = 0;

        if (activeDirection.current === "forward") {
            motorA = motorSpeed;
            motorB = motorSpeed;
        } else if (activeDirection.current === "backward") {
            motorA = -motorSpeed;
            motorB = -motorSpeed;
        } else if (activeDirection.current === "left") {
            motorA = -motorSpeed;
            motorB = motorSpeed;
        } else if (activeDirection.current === "right") {
            motorA = motorSpeed;
            motorB = -motorSpeed;
        }

        onChange({ x: motorA, y: motorB });
    }, [disabled, motorSpeed, onChange]);

    const handleButtonPress = (direction: "forward" | "backward" | "left" | "right" | "servoUp" | "servoDown" | "servoLeft" | "servoRight" | "center") => {
        if (disabled) return;

        if (direction === "forward" && !prevButtonState.current.forward) {
            activeDirection.current = "forward";
            prevButtonState.current.forward = true;
            sendMotorCommand();
        } else if (direction === "backward" && !prevButtonState.current.backward) {
            activeDirection.current = "backward";
            prevButtonState.current.backward = true;
            sendMotorCommand();
        } else if (direction === "left" && !prevButtonState.current.left) {
            activeDirection.current = "left";
            prevButtonState.current.left = true;
            sendMotorCommand();
        } else if (direction === "right" && !prevButtonState.current.right) {
            activeDirection.current = "right";
            prevButtonState.current.right = true;
            sendMotorCommand();
        } else if (direction === "servoUp" && !prevButtonState.current.servoUp) {
            onServoChangeCheck("1", 15, false);
            prevButtonState.current.servoUp = true;
        } else if (direction === "servoDown" && !prevButtonState.current.servoDown) {
            onServoChangeCheck("1", -15, false);
            prevButtonState.current.servoDown = true;
        } else if (direction === "servoLeft" && !prevButtonState.current.servoLeft) {
            onServoChangeCheck("2", 15, false);
            prevButtonState.current.servoLeft = true;
        } else if (direction === "servoRight" && !prevButtonState.current.servoRight) {
            onServoChangeCheck("2", -15, false);
            prevButtonState.current.servoRight = true;
        } else if (direction === "center" && !prevButtonState.current.center) {
            onServoChange("1", servo1Angle, true);
            onServoChange("2", servo2Angle, true);
            prevButtonState.current.center = true;
        }
    };

    const handleButtonRelease = (direction: "forward" | "backward" | "left" | "right" | "servoUp" | "servoDown" | "servoLeft" | "servoRight" | "center") => {
        if (disabled) return;

        if (direction === "forward") {
            prevButtonState.current.forward = false;
        } else if (direction === "backward") {
            prevButtonState.current.backward = false;
        } else if (direction === "left") {
            prevButtonState.current.left = false;
        } else if (direction === "right") {
            prevButtonState.current.right = false;
        } else if (direction === "servoUp") {
            prevButtonState.current.servoUp = false;
        } else if (direction === "servoDown") {
            prevButtonState.current.servoDown = false;
        } else if (direction === "servoLeft") {
            prevButtonState.current.servoLeft = false;
        } else if (direction === "servoRight") {
            prevButtonState.current.servoRight = false;
        } else if (direction === "center") {
            prevButtonState.current.center = false;
        }

        if (
            !prevButtonState.current.forward &&
            !prevButtonState.current.backward &&
            !prevButtonState.current.left &&
            !prevButtonState.current.right
        ) {
            activeDirection.current = null;
            sendMotorCommand();
            // Повторная отправка команды через 0.5 секунды
            setTimeout(() => {
                sendMotorCommand();
            }, 500);
        }
    };

    const handleSpeedChange = (increment: boolean) => {
        const currentIndex = speedSteps.indexOf(motorSpeed);
        let newIndex;
        if (increment) {
            newIndex = Math.min(currentIndex + 1, speedSteps.length - 1);
        } else {
            newIndex = Math.max(currentIndex - 1, 0);
        }
        setMotorSpeed(speedSteps[newIndex]);
        sendMotorCommand();
    };

    return (
        <div className="flex justify-between items-center h-full w-full relative no-select">
            {/* Левый крестик для управления моторами */}
            <div className="fixed left-4 top-1/2 transform -translate-y-1/2 flex flex-col items-center space-y-2 no-select">
                {!isSlidersVisible ? (
                    <>
                        <button
                            onTouchStart={() => handleButtonPress("backward")}
                            onTouchEnd={() => handleButtonRelease("backward")}
                            onMouseDown={() => handleButtonPress("backward")}
                            onMouseUp={() => handleButtonRelease("backward")}
                            className="w-10 h-10 bg-gray-700/50 hover:bg-gray-600/70 rounded-full flex items-center justify-center transition-all no-select"
                            disabled={disabled}
                        >
                            <img width="20" height="20" src="/arrow/arrow-up-2.svg" alt="Forward" className="no-select" />
                        </button>
                        <div className="flex space-x-2 no-select">
                            <button
                                onTouchStart={() => handleButtonPress("left")}
                                onTouchEnd={() => handleButtonRelease("left")}
                                onMouseDown={() => handleButtonPress("left")}
                                onMouseUp={() => handleButtonRelease("left")}
                                className="w-10 h-10 bg-gray-700/50 hover:bg-gray-600/70 rounded-full flex items-center justify-center transition-all no-select"
                                disabled={disabled}
                            >
                                <img width="20" height="20" src="/arrow/arrow-left-2.svg" alt="Left" className="no-select" />
                            </button>
                            <span
                                className="w-10 h-10 bg-gray-700/50 hover:bg-gray-600/70 rounded-full flex items-center justify-center transition-all text-green-300 text-lg font-medium cursor-pointer no-select"
                                onClick={() => setIsSlidersVisible(true)}
                            >
                    {motorSpeed.toFixed()}
                </span>
                            <button
                                onTouchStart={() => handleButtonPress("right")}
                                onTouchEnd={() => handleButtonRelease("right")}
                                onMouseDown={() => handleButtonPress("right")}
                                onMouseUp={() => handleButtonRelease("right")}
                                className="w-10 h-10 bg-gray-700/50 hover:bg-gray-600/70 rounded-full flex items-center justify-center transition-all no-select"
                                disabled={disabled}
                            >
                                <img width="20" height="20" src="/arrow/arrow-right-2.svg" alt="Right" className="no-select" />
                            </button>
                        </div>
                        <button
                            onTouchStart={() => handleButtonPress("forward")}
                            onTouchEnd={() => handleButtonRelease("forward")}
                            onMouseDown={() => handleButtonPress("forward")}
                            onMouseUp={() => handleButtonRelease("forward")}
                            className="w-10 h-10 bg-gray-700/50 hover:bg-gray-600/70 rounded-full flex items-center justify-center transition-all no-select"
                            disabled={disabled}
                        >
                            <img width="20" height="20" src="/arrow/arrow-down-2-thin.svg" alt="Backward" className="no-select" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center space-y-2 ml-3 no-select">
            <span
                className="w-10 h-10 bg-gray-700/50 hover:bg-gray-600/70 rounded-full flex items-center justify-center transition-all text-green-300 text-lg font-medium cursor-pointer no-select"
                onClick={() => setIsSlidersVisible(false)}
            >
                {motorSpeed.toFixed()}
            </span>
                        <div className="flex items-center space-x-2 no-select">
                            <button
                                onClick={() => handleSpeedChange(false)}
                                className="w-8 h-8 bg-gray-700/50 hover:bg-gray-600/70 rounded-full flex items-center justify-center transition-all no-select"
                                disabled={disabled || motorSpeed === speedSteps[0]}
                            >
                                <span className="text-green-300 no-select">-</span>
                            </button>
                            <button
                                onClick={() => handleSpeedChange(true)}
                                className="w-8 h-8 bg-gray-700/50 hover:bg-gray-600/70 rounded-full flex items-center justify-center transition-all no-select"
                                disabled={disabled || motorSpeed === speedSteps[speedSteps.length - 1]}
                            >
                                <span className="text-green-300 no-select">+</span>
                            </button>
                        </div>
                        <div className="w-[100px] no-select">
                            <label className="text-xs text-green-300 text-center no-select">V. ({servo1Angle}°)</label>
                            <input
                                type="range"
                                min="0"
                                max="180"
                                step="1"
                                value={servo1Angle}
                                onChange={(e) => {
                                    const newValue = Number(e.target.value);
                                    setServo1Angle(newValue);
                                    onServoChange("1", newValue, true);
                                }}
                                className="w-full h-1 bg-black/30 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-0 no-select"
                                style={{
                                    background: "linear-gradient(to right, rgba(0, 255, 0, 0.3) 0%, rgba(0, 255, 0, 0.3) 100%)",
                                }}
                                disabled={disabled}
                            />
                        </div>
                        <div className="w-[100px] no-select">
                            <label className="text-xs text-green-300 text-center no-select">H. ({servo2Angle}°)</label>
                            <input
                                type="range"
                                min="0"
                                max="180"
                                step="1"
                                value={servo2Angle}
                                onChange={(e) => {
                                    const newValue = Number(e.target.value);
                                    setServo2Angle(newValue);
                                    onServoChange("2", newValue, true);
                                }}
                                className="w-full h-1 bg-black/30 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-0 no-select"
                                style={{
                                    background: "linear-gradient(to right, rgba(0, 255, 0, 0.3) 0%, rgba(0, 255, 0, 0.3) 100%)",
                                }}
                                disabled={disabled}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Правый крестик для управления сервоприводами */}
            <div className="fixed right-4 top-1/2 transform -translate-y-1/2 flex flex-col items-center space-y-2 no-select">
                <button
                    onTouchStart={() => handleButtonPress("servoUp")}
                    onTouchEnd={() => handleButtonRelease("servoUp")}
                    onMouseDown={() => handleButtonPress("servoUp")}
                    onMouseUp={() => handleButtonRelease("servoUp")}
                    className="w-10 h-10 bg-gray-700/50 hover:bg-gray-600/70 rounded-full flex items-center justify-center transition-all no-select"
                    disabled={disabled}
                >
                    <img width="20" height="20" src="/arrow/arrow-up-2.svg" alt="Servo Up" className="no-select"/>
                </button>
                <div className="flex space-x-2 no-select">
                    <button
                        onTouchStart={() => handleButtonPress("servoLeft")}
                        onTouchEnd={() => handleButtonRelease("servoLeft")}
                        onMouseDown={() => handleButtonPress("servoLeft")}
                        onMouseUp={() => handleButtonRelease("servoLeft")}
                        className="w-10 h-10 bg-gray-700/50 hover:bg-gray-600/70 rounded-full flex items-center justify-center transition-all no-select"
                        disabled={disabled}
                    >
                        <img width="20" height="20" src="/arrow/arrow-left-2.svg" alt="Servo Left" className="no-select"/>
                    </button>
                    <button
                        onTouchStart={() => handleButtonPress("center")}
                        onTouchEnd={() => handleButtonRelease("center")}
                        onMouseDown={() => handleButtonPress("center")}
                        onMouseUp={() => handleButtonRelease("center")}
                        className="w-10 h-10 bg-gray-700/50 hover:bg-gray-600/70 rounded-full flex items-center justify-center transition-all no-select"
                        disabled={disabled}
                    >
                        <img width="20" height="20" src="/arrow/cross-cursor-svgrepo-com.svg" alt="Center" className="no-select"/>
                    </button>
                    <button
                        onTouchStart={() => handleButtonPress("servoRight")}
                        onTouchEnd={() => handleButtonRelease("servoRight")}
                        onMouseDown={() => handleButtonPress("servoRight")}
                        onMouseUp={() => handleButtonRelease("servoRight")}
                        className="w-10 h-10 bg-gray-700/50 hover:bg-gray-600/70 rounded-full flex items-center justify-center transition-all no-select"
                        disabled={disabled}
                    >
                        <img width="20" height="20" src="/arrow/arrow-right-2.svg" alt="Servo Right" className="no-select"/>
                    </button>
                </div>
                <button
                    onTouchStart={() => handleButtonPress("servoDown")}
                    onTouchEnd={() => handleButtonRelease("servoDown")}
                    onMouseDown={() => handleButtonPress("servoDown")}
                    onMouseUp={() => handleButtonRelease("servoDown")}
                    className="w-10 h-10 bg-gray-700/50 hover:bg-gray-600/70 rounded-full flex items-center justify-center transition-all no-select"
                    disabled={disabled}
                >
                    <img width="20" height="20" src="/arrow/arrow-down-2-thin.svg" alt="Servo Down" className="no-select"/>
                </button>
            </div>
        </div>
    );
};

export default ButtonControl;