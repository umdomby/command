"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./JoystickStyles.module.css";

interface JoyAnalogProps {
    onChange: ({ x, y }: { x: number; y: number }) => void;
    onServoChange: (servoId: "1" | "2", value: number, isAbsolute: boolean) => void;
    onServoChangeCheck: (servoId: "1" | "2", value: number, isAbsolute: boolean) => void;
    onRelayChange?: (pin: string, state: string) => void;
    disabled?: boolean;
}

const JoyAnalog = ({ onChange, onServoChange, disabled, onServoChangeCheck, onRelayChange }: JoyAnalogProps) => {
    const [gamepadConnected, setGamepadConnected] = useState(false);
    const [motorDirection, setMotorDirection] = useState<"forward" | "backward">("forward");
    const animationFrameRef = useRef<number | null>(null);

    const prevButtonState = useRef<Record<string, boolean>>({});
    const prevStickState = useRef<Record<number, { leftStickX: number; rightStickY: number; servo1Value: number; servo2Value: number }>>({});

    const checkGamepads = useCallback((): Gamepad[] => {
        const gamepads = navigator.getGamepads();
        const activeGamepads = Array.from(gamepads).filter(
            (gp): gp is Gamepad => gp !== null && (gp.id.includes("Xbox") || gp.mapping === "standard")
        );
        setGamepadConnected(activeGamepads.length > 0);
        return activeGamepads;
    }, []);

    const handleGamepadInput = useCallback(() => {
        if (disabled) return;

        const gamepads = checkGamepads();
        if (!gamepads.length) return;

        let totalMotorA = 0;
        let totalMotorB = 0;

        for (const gamepad of gamepads) {
            const index = gamepad.index;
            const deadZone = 0.1;

            // Получение состояния кнопок и стиков
            const ltValue = gamepad.buttons[6].value;
            const rtValue = gamepad.buttons[7].value;
            const motorASpeed = Math.round(ltValue * 255);
            const motorBSpeed = Math.round(rtValue * 255);

            const dpadDown = gamepad.buttons[12].pressed;
            const dpadUp = gamepad.buttons[13].pressed;
            const dpadLeft = gamepad.buttons[14].pressed;
            const dpadRight = gamepad.buttons[15].pressed;

            const buttonA = gamepad.buttons[0].pressed;
            const buttonB = gamepad.buttons[1].pressed;
            const buttonX = gamepad.buttons[2].pressed;
            const buttonY = gamepad.buttons[3].pressed;
            const buttonMenu = gamepad.buttons[8].pressed;
            const buttonLB = gamepad.buttons[4].pressed;
            const buttonRB = gamepad.buttons[5].pressed;

            const leftStickX = gamepad.axes[0];
            const rightStickY = gamepad.axes[3];

            // Предыдущие значения
            const prevButtons = prevButtonState.current;
            const prevSticks = prevStickState.current[index] || {
                leftStickX: 0,
                rightStickY: 0,
                servo1Value: 90,
                servo2Value: 90,
            };

            // Управление моторами
            let motorA = 0;
            let motorB = 0;
            if (motorASpeed > 0) motorA = motorDirection === "forward" ? -motorASpeed : motorASpeed;
            if (motorBSpeed > 0) motorB = motorDirection === "forward" ? -motorBSpeed : motorBSpeed;

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

            totalMotorA += motorA;
            totalMotorB += motorB;

            // Кнопки сервоприводов
            if (buttonA && !prevButtons[`A_${index}`]) onServoChangeCheck("1", -15, false);
            if (buttonB && !prevButtons[`B_${index}`]) onServoChangeCheck("2", -15, false);
            if (buttonX && !prevButtons[`X_${index}`]) onServoChangeCheck("2", 15, false);
            if (buttonY && !prevButtons[`Y_${index}`]) onServoChangeCheck("1", 15, false);

            if (buttonLB && !prevButtons[`LB_${index}`]) setMotorDirection("backward");
            if (buttonRB && !prevButtons[`RB_${index}`]) setMotorDirection("forward");

            if (buttonMenu && !prevButtons[`MENU_${index}`]) {
                console.log(`Gamepad ${index}: Button Menu pressed, toggling relay D0`);
                onRelayChange?.("D0", "toggle");
            }

            // Левый стик (servo2)
            if (Math.abs(leftStickX) > deadZone) {
                const servo2Value = Math.round((-leftStickX + 1) * 90);
                if (servo2Value !== prevSticks.servo2Value) {
                    onServoChange("2", servo2Value, true);
                    prevSticks.servo2Value = servo2Value;
                }
            } else if (Math.abs(prevSticks.leftStickX) > deadZone) {
                if (prevSticks.servo2Value !== 90) {
                    onServoChange("2", 90, true);
                    prevSticks.servo2Value = 90;
                }
            }

            // Правый стик (servo1)
            if (Math.abs(rightStickY) > deadZone) {
                const servo1Value = Math.round((-rightStickY + 1) * 90);
                if (servo1Value !== prevSticks.servo1Value) {
                    onServoChange("1", servo1Value, true);
                    prevSticks.servo1Value = servo1Value;
                }
            } else if (Math.abs(prevSticks.rightStickY) > deadZone) {
                if (prevSticks.servo1Value !== 90) {
                    onServoChange("1", 90, true);
                    prevSticks.servo1Value = 90;
                }
            }

            // Сохраняем предыдущее состояние
            prevButtonState.current = {
                ...prevButtons,
                [`A_${index}`]: buttonA,
                [`B_${index}`]: buttonB,
                [`X_${index}`]: buttonX,
                [`Y_${index}`]: buttonY,
                [`LB_${index}`]: buttonLB,
                [`RB_${index}`]: buttonRB,
                [`MENU_${index}`]: buttonMenu,
            };
            prevStickState.current[index] = {
                leftStickX,
                rightStickY,
                servo1Value: prevSticks.servo1Value,
                servo2Value: prevSticks.servo2Value,
            };
        }

        onChange({ x: totalMotorA, y: totalMotorB });
        animationFrameRef.current = requestAnimationFrame(handleGamepadInput);
    }, [disabled, checkGamepads, onChange, onServoChange, onServoChangeCheck, onRelayChange, motorDirection]);

    useEffect(() => {
        const handleConnect = () => {
            setGamepadConnected(!!checkGamepads().length);
            animationFrameRef.current = requestAnimationFrame(handleGamepadInput);
        };

        const handleDisconnect = () => {
            setGamepadConnected(false);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };

        window.addEventListener("gamepadconnected", handleConnect);
        window.addEventListener("gamepaddisconnected", handleDisconnect);

        if (checkGamepads().length) handleConnect();

        return () => {
            window.removeEventListener("gamepadconnected", handleConnect);
            window.removeEventListener("gamepaddisconnected", handleDisconnect);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [checkGamepads, handleGamepadInput]);

    return null;
};

export default JoyAnalog;
