"use client";
import { useCallback, useEffect, useRef, useState } from "react";

interface JoyAnalogProps {
    onChange: ({ x, y }: { x: number; y: number }) => void;
    onServoChange: (servoId: "1" | "2", value: number, isAbsolute: boolean) => void;
    onServoChangeCheck: (servoId: "1" | "2", value: number, isAbsolute: boolean) => void;
    onRelayChange?: (pin: string, state: string) => void;
    disabled?: boolean;
}

const JoyAnalog = ({ onChange, onServoChange, disabled, onServoChangeCheck, onRelayChange }: JoyAnalogProps) => {
    const [gamepadConnected, setGamepadConnected] = useState(false);
    const [motorADirection, setMotorADirection] = useState<"forward" | "backward">("forward");
    const [motorBDirection, setMotorBDirection] = useState<"forward" | "backward">("forward");
    const [showMultipleGamepadWarning, setShowMultipleGamepadWarning] = useState(false);
    const [isRightStickYEnabled, setIsRightStickYEnabled] = useState(true);
    const [ltRange, setLtRange] = useState(() => {
        const saved = localStorage.getItem("ltRange");
        return saved ? parseInt(saved, 10) : 255;
    });
    const [rtRange, setRtRange] = useState(() => {
        const saved = localStorage.getItem("rtRange");
        return saved ? parseInt(saved, 10) : 255;
    });
    const [rightStickXRange, setRightStickXRange] = useState(() => {
        const saved = localStorage.getItem("rightStickXRange");
        return saved ? parseInt(saved, 10) : 255;
    });
    const [servo1NeutralAngle, setServo1NeutralAngle] = useState(() => {
        const saved = localStorage.getItem("servo1NeutralAngle");
        return saved ? parseInt(saved, 10) : 90;
    });
    const [servo2NeutralAngle, setServo2NeutralAngle] = useState(() => {
        const saved = localStorage.getItem("servo2NeutralAngle");
        return saved ? parseInt(saved, 10) : 90;
    });
    const [ltValue, setLtValue] = useState(0);
    const [rtValue, setRtValue] = useState(0);
    const [rightStickXValue, setRightStickXValue] = useState(0);
    const animationFrameRef = useRef<number | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const prevButtonState = useRef<Record<string, boolean>>({});
    const prevStickState = useRef<Record<number, { leftStickX: number; rightStickY: number; rightStickX: number; servo1Value: number; servo2Value: number }>>({});

    useEffect(() => {
        localStorage.setItem("ltRange", ltRange.toString());
    }, [ltRange]);

    useEffect(() => {
        localStorage.setItem("rtRange", rtRange.toString());
    }, [rtRange]);

    useEffect(() => {
        localStorage.setItem("rightStickXRange", rightStickXRange.toString());
    }, [rightStickXRange]);

    useEffect(() => {
        localStorage.setItem("servo1NeutralAngle", servo1NeutralAngle.toString());
    }, [servo1NeutralAngle]);

    useEffect(() => {
        localStorage.setItem("servo2NeutralAngle", servo2NeutralAngle.toString());
    }, [servo2NeutralAngle]);

    const checkGamepads = useCallback((): Gamepad[] => {
        const gamepads = navigator.getGamepads();
        const activeGamepads = Array.from(gamepads).filter(
            (gp): gp is Gamepad => gp !== null && (gp.id.includes("Xbox") || gp.mapping === "standard")
        );
        setGamepadConnected(activeGamepads.length > 0);
        setShowMultipleGamepadWarning(activeGamepads.length > 1);
        return activeGamepads;
    }, []);

    const handleGamepadInput = useCallback(() => {
        if (disabled) return;

        const gamepads = checkGamepads();
        if (!gamepads.length || gamepads.length > 1) return;

        let totalMotorA = 0;
        let totalMotorB = 0;

        for (const gamepad of gamepads) {
            const index = gamepad.index;
            const deadZone = 0.08;
            const rightStickDeadZone = 0.08;

            const ltValue = gamepad.buttons[6].value;
            const rtValue = gamepad.buttons[7].value;
            const motorASpeed = Math.round(ltValue * ltRange);
            const motorBSpeed = Math.round(rtValue * rtRange);

            setLtValue(motorASpeed);
            setRtValue(motorBSpeed);

            const dpadDown = gamepad.buttons[12].pressed;
            const dpadUp = gamepad.buttons[13].pressed;
            const dpadLeft = gamepad.buttons[14].pressed;
            const dpadRight = gamepad.buttons[15].pressed;

            const buttonA = gamepad.buttons[0].pressed;
            const buttonB = gamepad.buttons[1].pressed;
            const buttonX = gamepad.buttons[2].pressed;
            const buttonY = gamepad.buttons[3].pressed;
            const buttonMenu = gamepad.buttons[8].pressed;
            const buttonView = gamepad.buttons[9].pressed;
            const buttonLB = gamepad.buttons[4].pressed;
            const buttonRB = gamepad.buttons[5].pressed;
            const leftStickButton = gamepad.buttons[10].pressed;
            const rightStickButton = gamepad.buttons[11].pressed;

            const leftStickX = gamepad.axes[0];
            const rightStickY = gamepad.axes[3];
            const rightStickX = gamepad.axes[2];

            const adjustedRightStickX = Math.abs(rightStickX) > rightStickDeadZone ? rightStickX : 0;
            const adjustedRightStickY = Math.abs(rightStickY) > rightStickDeadZone ? rightStickY : 0;

            const scaledRightStickX = adjustedRightStickX * rightStickXRange / 255;
            setRightStickXValue(Math.round(scaledRightStickX * 255));

            const prevButtons = prevButtonState.current;
            const prevSticks = prevStickState.current[index] || {
                leftStickX: 0,
                rightStickY: 0,
                rightStickX: 0,
                servo1Value: servo1NeutralAngle,
                servo2Value: servo2NeutralAngle,
            };

            let motorA = 0;
            let motorB = 0;
            if (motorASpeed > 0) motorA = motorADirection === "forward" ? -motorASpeed : motorASpeed;
            if (motorBSpeed > 0) motorB = motorBDirection === "forward" ? -motorBSpeed : motorBSpeed;

            if (dpadUp) {
                motorA = motorA || 255;
                motorB = motorB || 255;
            } else if (dpadDown) {
                motorA = motorA ? -motorA : -255;
                motorB = motorB ? -motorB : -255;
            } else if (dpadLeft) {
                motorA = -255;
                motorB = 255;
            } else if (dpadRight) {
                motorA = 255;
                motorB = -255;
            }

            if (Math.abs(adjustedRightStickX) > 0) {
                const motorBSpeedRightStick = Math.round(Math.abs(scaledRightStickX) * 255);
                motorA = adjustedRightStickX > 0 ? motorBSpeedRightStick : -motorBSpeedRightStick;
            }

            totalMotorA += motorA;
            totalMotorB += motorB;

            if (leftStickButton && buttonY && !prevButtons[`LEFT_STICK_Y_${index}`]) {
                setLtRange((prev) => Math.min(prev + 50, 255));
                setRightStickXRange((prev) => Math.min(prev + 50, 255));
                console.log(`Gamepad ${index}: Left trigger range increased to ${Math.min(ltRange + 50, 255)}, Right stick X range increased to ±${Math.min(rightStickXRange + 50, 255)}`);
            }
            if (leftStickButton && buttonA && !prevButtons[`LEFT_STICK_A_${index}`]) {
                setLtRange((prev) => Math.max(prev - 50, 55));
                setRightStickXRange((prev) => Math.max(prev - 50, 55));
                console.log(`Gamepad ${index}: Left trigger range decreased to ${Math.max(ltRange - 50, 55)}, Right stick X range decreased to ±${Math.max(rightStickXRange - 50, 55)}`);
            }

            if (rightStickButton && buttonY && !prevButtons[`RIGHT_STICK_Y_${index}`]) {
                setRtRange((prev) => Math.min(prev + 50, 255));
                console.log(`Gamepad ${index}: Right trigger range increased to ${Math.min(rtRange + 50, 255)}`);
            }
            if (rightStickButton && buttonA && !prevButtons[`RIGHT_STICK_A_${index}`]) {
                setRtRange((prev) => Math.max(prev - 50, 55));
                console.log(`Gamepad ${index}: Right trigger range decreased to ${Math.max(rtRange - 55, 55)}`);
            }

            if (buttonA && !prevButtons[`A_${index}`]) onServoChangeCheck("1", -15, false);
            if (buttonB && !prevButtons[`B_${index}`]) onServoChangeCheck("2", -15, false);
            if (buttonX && !prevButtons[`X_${index}`]) onServoChangeCheck("2", 15, false);
            if (buttonY && !prevButtons[`Y_${index}`]) onServoChangeCheck("1", 15, false);

            if (buttonLB && !prevButtons[`LB_${index}`]) {
                setMotorADirection((prev) => (prev === "forward" ? "backward" : "forward"));
                console.log(`Gamepad ${index}: Motor A direction toggled to ${motorADirection === "forward" ? "backward" : "forward"}`);
            }

            if (buttonRB && !prevButtons[`RB_${index}`]) {
                setMotorBDirection((prev) => (prev === "forward" ? "backward" : "forward"));
                console.log(`Gamepad ${index}: Motor B direction toggled to ${motorBDirection === "forward" ? "backward" : "forward"}`);
            }

            if (buttonMenu && !prevButtons[`MENU_${index}`]) {
                console.log(`Gamepad ${index}: Button Menu pressed, toggling relay D0`);
                onRelayChange?.("D0", "toggle");
            }

            if (buttonView && !prevButtons[`VIEW_${index}`]) {
                setIsRightStickYEnabled((prev) => !prev);
                console.log(`Gamepad ${index}: Right stick Y axis ${isRightStickYEnabled ? "disabled" : "enabled"}`);
            }

            if (Math.abs(leftStickX) > deadZone) {
                const servo2Value = Math.round((-leftStickX + 1) * 90);
                if (servo2Value !== prevSticks.servo2Value) {
                    onServoChange("2", servo2Value, true);
                    prevSticks.servo2Value = servo2Value;
                }
            } else if (Math.abs(prevSticks.leftStickX) > deadZone) {
                if (prevSticks.servo2Value !== servo2NeutralAngle) {
                    onServoChange("2", servo2NeutralAngle, true);
                    prevSticks.servo2Value = servo2NeutralAngle;
                }
            }

            if (isRightStickYEnabled && Math.abs(adjustedRightStickY) > 0) {
                const servo1Value = Math.round((-adjustedRightStickY + 1) * 90);
                if (servo1Value !== prevSticks.servo1Value) {
                    onServoChange("1", servo1Value, true);
                    prevSticks.servo1Value = servo1Value;
                }
            } else if (Math.abs(prevSticks.rightStickY) > rightStickDeadZone && prevSticks.servo1Value !== servo1NeutralAngle) {
                onServoChange("1", servo1NeutralAngle, true);
                prevSticks.servo1Value = servo1NeutralAngle;
            }

            prevButtonState.current = {
                ...prevButtons,
                [`A_${index}`]: buttonA,
                [`B_${index}`]: buttonB,
                [`X_${index}`]: buttonX,
                [`Y_${index}`]: buttonY,
                [`LB_${index}`]: buttonLB,
                [`RB_${index}`]: buttonRB,
                [`MENU_${index}`]: buttonMenu,
                [`VIEW_${index}`]: buttonView,
                [`LEFT_STICK_Y_${index}`]: leftStickButton && buttonY,
                [`LEFT_STICK_A_${index}`]: leftStickButton && buttonA,
                [`RIGHT_STICK_Y_${index}`]: rightStickButton && buttonY,
                [`RIGHT_STICK_A_${index}`]: rightStickButton && buttonA,
            };
            prevStickState.current[index] = {
                leftStickX,
                rightStickY,
                rightStickX,
                servo1Value: prevSticks.servo1Value,
                servo2Value: prevSticks.servo2Value,
            };
        }

        onChange({ x: totalMotorA, y: totalMotorB });
        animationFrameRef.current = requestAnimationFrame(handleGamepadInput);
    }, [disabled, checkGamepads, onChange, onServoChange, onServoChangeCheck, onRelayChange, motorADirection, motorBDirection, isRightStickYEnabled, ltRange, rtRange, rightStickXRange, servo1NeutralAngle, servo2NeutralAngle]);

    useEffect(() => {
        const handleConnect = () => {
            const gamepads = checkGamepads();
            setGamepadConnected(!!gamepads.length);
            if (gamepads.length <= 1) {
                animationFrameRef.current = requestAnimationFrame(handleGamepadInput);
            }
        };

        const handleDisconnect = () => {
            setGamepadConnected(false);
            setShowMultipleGamepadWarning(false);
            setLtValue(0);
            setRtValue(0);
            setRightStickXValue(0);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };

        intervalRef.current = setInterval(() => {
            const gamepads = checkGamepads();
            if (!gamepads.length) {
                onChange({ x: 0, y: 0 });
                setLtValue(0);
                setRtValue(0);
                setRightStickXValue(0);
            }
        }, 1000);

        window.addEventListener("gamepadconnected", handleConnect);
        window.addEventListener("gamepaddisconnected", handleDisconnect);

        if (checkGamepads().length) handleConnect();

        return () => {
            window.removeEventListener("gamepadconnected", handleConnect);
            window.removeEventListener("gamepaddisconnected", handleDisconnect);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [checkGamepads, handleGamepadInput, onChange]);

    const handleServoNeutralChange = (servo: "1" | "2", value: number) => {
        const clampedValue = Math.max(0, Math.min(180, value)); // Ограничиваем угол от 0 до 180
        if (servo === "1") {
            setServo1NeutralAngle(clampedValue);
        } else {
            setServo2NeutralAngle(clampedValue);
        }
    };

    return (
        <>
            {showMultipleGamepadWarning && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
                        <h2 className="text-xl font-bold mb-4 text-gray-700">Gamepads Detected</h2>
                        <p className="text-gray-700">
                            Обнаружено несколько геймпадов. Пожалуйста, оставьте подключенным только один.
                        </p>
                    </div>
                </div>
            )}
            {gamepadConnected && (
                <div
                    className="fixed bottom-[20%] right-[5%] transform -translate-x-1 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-40"
                    style={{ textAlign: "center" }}
                >
                    <p>tu {rightStickXRange} {rightStickXValue}</p>
                    <p>sp {ltRange} {ltValue}</p>
                    <p>sp {rtRange} {rtValue}</p>
                    <div>
                        <label className="text-sm">V:</label>
                        <input
                            type="number"
                            min="0"
                            max="180"
                            value={servo1NeutralAngle}
                            onChange={(e) => handleServoNeutralChange("1", parseInt(e.target.value) || 0)}
                            className="rounded bg-gray-700 text-white w-12 text-center"
                        />
                    </div>
                    <div>
                        <label className="text-sm">H:</label>
                        <input
                            type="number"
                            min="0"
                            max="180"
                            value={servo2NeutralAngle}
                            onChange={(e) => handleServoNeutralChange("2", parseInt(e.target.value) || 0)}
                            className="rounded bg-gray-700 text-white w-12 text-center"
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default JoyAnalog;