"use client"
import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp } from "lucide-react"
import Joystick from '@/components/control/Joystick'
import JoystickUp from '@/components/control/JoystickUp'
import JoyAnalog from '@/components/control/JoyAnalog'
import Keyboard from '@/components/control/Keyboard'
import ButtonControl from "@/components/control/ButtonControl"
import VirtualBox from "@/components/control/VirtualBox"

type MessageType = {
    ty?: string
    co?: string
    de?: string
    me?: string
    pa?: any
    b2?: string
    sp1?: string
    sp2?: string
    z?: string
    a?: string
    st?: string
}

type LogEntry = { me: string; ty: 'client' | 'esp' | 'server' | 'error' | 'success' | 'info' }

export default function SocketClient() {
    const [log, setLog] = useState<LogEntry[]>([])
    const [isConnected, setIsConnected] = useState(false)
    const [isIdentified, setIsIdentified] = useState(false)
    const [espConnected, setEspConnected] = useState(false)
    const [deviceId, setDeviceId] = useState<string>(() => {
        return typeof window !== 'undefined' ? localStorage.getItem('currentDeviceId') || '' : ''
    })
    const [inputDeviceId, setInputDeviceId] = useState(deviceId)
    const [logVisible, setLogVisible] = useState(false)
    const [servo1Angle, setServo1Angle] = useState(90)
    const [servo2Angle, setServo2Angle] = useState(90)
    const [inputVoltage, setInputVoltage] = useState<number | null>(null)
    const [alarmState, setAlarmState] = useState(false)
    const [relayD0State, setRelayD0State] = useState<boolean | null>(null)
    const [showServos, setShowServos] = useState<boolean>(() => {
        const saved = localStorage.getItem('showServos')
        return saved !== null ? JSON.parse(saved) : false
    })
    const [selectedJoystick, setSelectedJoystick] = useState<'Joystick' | 'JoystickUp' | 'JoyAnalog' | 'Keyboard' | 'ButtonControl'>(
        (typeof window !== 'undefined' && localStorage.getItem('selectedJoystick') as any) || 'ButtonControl'
    )
    const [isVirtualBoxActive, setIsVirtualBoxActive] = useState<boolean>(() => {
        const saved = localStorage.getItem('isVirtualBoxActive')
        return saved !== null ? JSON.parse(saved) : false
    })

    const socketRef = useRef<WebSocket | null>(null)

    // Троттлинг для моторов
    const motorAThrottleRef = useRef<NodeJS.Timeout | null>(null)
    const motorBThrottleRef = useRef<NodeJS.Timeout | null>(null)

    // Последние отправленные команды (чтобы не спамить дубли)
    const lastMotorACommandRef = useRef<{ sp: number; dir: 'forward' | 'backward' | 'stop' } | null>(null)
    const lastMotorBCommandRef = useRef<{ sp: number; dir: 'forward' | 'backward' | 'stop' } | null>(null)

    const [motorASpeed, setMotorASpeed] = useState(0)
    const [motorBSpeed, setMotorBSpeed] = useState(0)
    const [motorADirection, setMotorADirection] = useState<'forward' | 'backward' | 'stop'>('stop')
    const [motorBDirection, setMotorBDirection] = useState<'forward' | 'backward' | 'stop'>('stop')

    const addLog = useCallback((msg: string, ty: LogEntry['ty'] = 'info') => {
        setLog(prev => [...prev.slice(-100), { me: `${new Date().toLocaleTimeString()}: ${msg}`, ty }])
    }, [])

    // localStorage
    useEffect(() => {
        localStorage.setItem('currentDeviceId', deviceId)
    }, [deviceId])
    useEffect(() => {
        localStorage.setItem('showServos', JSON.stringify(showServos))
    }, [showServos])
    useEffect(() => {
        localStorage.setItem('selectedJoystick', selectedJoystick)
    }, [selectedJoystick])
    useEffect(() => {
        localStorage.setItem('isVirtualBoxActive', JSON.stringify(isVirtualBoxActive))
    }, [isVirtualBoxActive])

    const cleanupWebSocket = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close()
            socketRef.current = null
        }
    }, [])

    const connectWebSocket = useCallback(() => {
        if (!deviceId || deviceId.length !== 16) {
            addLog('deviceId должен быть 16 символов', 'error')
            return
        }
        cleanupWebSocket()
        const url = process.env.NEXT_PUBLIC_WEB_SOCKET_URL || 'wss://a.ardu.live/wsar';
        const ws = new WebSocket(url)
        ws.onopen = () => {
            setIsConnected(true)
            addLog('Подключено к серверу', 'success')
            ws.send(JSON.stringify({ ty: "clt", ct: "browser" }))
            ws.send(JSON.stringify({ ty: "idn", de: deviceId }))
        }
        ws.onmessage = (event) => {
            try {
                const data: MessageType = JSON.parse(event.data)

                if (data.ty === 'sys' && data.st === 'con') {
                    setIsIdentified(true)
                    setEspConnected(true)
                    addLog('ESP подключён', 'success')
                }

                // Обработка ack для реле D0
                if (data.ty === 'ack' && data.co === 'RLY' && data.pa?.pin === 'D0') {
                    const newState = data.pa.state === 'on'
                    setRelayD0State(newState)
                }

                if (data.ty === 'log') {
                    if (data.b2 !== undefined) setRelayD0State(data.b2 === 'on')
                    if (data.sp1 !== undefined) setServo1Angle(Number(data.sp1))
                    if (data.sp2 !== undefined) setServo2Angle(Number(data.sp2))
                    if (data.z !== undefined) setInputVoltage(Number(data.z))
                    if (data.a !== undefined) setAlarmState(data.a === 'on')
                }
            } catch (err) {
                console.error(err)
            }
        }
        ws.onclose = () => {
            setIsConnected(false)
            setIsIdentified(false)
            setEspConnected(false)
            addLog('Соединение закрыто', 'error')
        }
        socketRef.current = ws
    }, [deviceId, cleanupWebSocket, addLog])

    const sendCommand = useCallback((co: string, pa?: any) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN || !isIdentified) return
        socketRef.current.send(JSON.stringify({ co, pa, de: deviceId }))
    }, [deviceId, isIdentified])


    useEffect(() => {
        if (!isConnected || !isIdentified || (motorASpeed <= 0 && motorBSpeed <= 0)) return;

        const interval = setInterval(() => {
            sendCommand("HBT");
            console.log("HBT")
        }, 300);

        return () => clearInterval(interval);
    }, [isConnected, isIdentified, motorASpeed, motorBSpeed, sendCommand]);

    // Точная копия из рабочей версии — с throttle и немедленной остановкой
    const handleMotorControl = useCallback((motor: 'A' | 'B', value: number) => {
        const absValue = Math.abs(value)
        const direction = value > 0 ? 'forward' : value < 0 ? 'backward' : 'stop'
        const sp = absValue

        // Обновляем состояние для отображения
        if (motor === 'A') {
            setMotorASpeed(sp)
            setMotorADirection(direction)
        } else {
            setMotorBSpeed(sp)
            setMotorBDirection(direction)
        }

        const lastRef = motor === 'A' ? lastMotorACommandRef : lastMotorBCommandRef
        const throttleRef = motor === 'A' ? motorAThrottleRef : motorBThrottleRef

        const currentCommand: { sp: number; dir: 'forward' | 'backward' | 'stop' } = { sp, dir: direction }

        if (lastRef.current && lastRef.current.sp === sp && lastRef.current.dir === direction) {
            return
        }
        lastRef.current = currentCommand

        if (sp === 0) {
            if (throttleRef.current) {
                clearTimeout(throttleRef.current)
                throttleRef.current = null
            }
            sendCommand("SPD", { mo: motor, sp: 0 })
            sendCommand(motor === 'A' ? "MSA" : "MSB")
            return
        }

        if (throttleRef.current) {
            clearTimeout(throttleRef.current)
        }
        throttleRef.current = setTimeout(() => {
            sendCommand("SPD", { mo: motor, sp })
            sendCommand(direction === 'forward' ? `MF${motor}` : `MR${motor}`)
        }, 40)
    }, [sendCommand])

    const handleDualAxisControl = useCallback(({ x, y }: { x: number; y: number }) => {
        handleMotorControl('A', Math.round(x))
        handleMotorControl('B', Math.round(y))
    }, [handleMotorControl])

    const adjustServo = useCallback((servoId: '1' | '2', value: number, isAbsolute: boolean) => {
        const current = servoId === '1' ? servo1Angle : servo2Angle
        const newAngle = isAbsolute ? value : current + value
        const clamped = Math.max(0, Math.min(180, newAngle))
        sendCommand(servoId === '1' ? 'SSY' : 'SSX', { an: clamped })
        if (servoId === '1') setServo1Angle(clamped)
        else setServo2Angle(clamped)
    }, [servo1Angle, servo2Angle, sendCommand])

    const adjustServoAxis = useCallback((_: '1', value: { an: number; ak: number }) => {
        sendCommand('SAR', { an: value.an, ak: value.ak })
    }, [sendCommand])

    const disabled = !isConnected || !isIdentified

    return (
        <div className="flex flex-col items-center min-h-screen bg-black relative">
            {/* Панель подключения */}
            <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-black/80 rounded-lg p-4 z-50 w-full max-w-md">
    <div className="flex items-center gap-3 mb-4">
    <div className={`w-4 h-4 rounded-full ${isConnected && isIdentified && espConnected ? 'bg-green-500' : isConnected ? 'bg-yellow-500' : 'bg-red-500'}`} />
    <span className="text-white">
    {isConnected && isIdentified && espConnected ? 'Подключено' : isConnected ? 'Ожидание ESP' : 'Отключено'}
    </span>
    </div>
    <div className="flex gap-2">
    <Input
        value={inputDeviceId}
    onChange={(e) => setInputDeviceId(e.target.value.toUpperCase().replace(/[^0-9A-F]/g, ''))}
    placeholder="deviceId (16 символов)"
    maxLength={16}
    />
    <Button onClick={() => {
        if (inputDeviceId.length === 16) {
            setDeviceId(inputDeviceId)
            connectWebSocket()
        }
    }} disabled={inputDeviceId.length !== 16}>
        Подключить
        </Button>
        <Button onClick={cleanupWebSocket} variant="destructive" disabled={!isConnected}>
    Отключить
    </Button>
    </div>
    <Button onClick={() => setLogVisible(!logVisible)} className="mt-2 w-full">
        {logVisible ? <ChevronUp /> : <ChevronDown />} Логи
    </Button>
    {logVisible && (
        <div className="mt-2 max-h-48 overflow-y-auto bg-black/50 rounded p-2 text-xs">
            {log.slice().reverse().map((e, i) => (
                    <div key={i} className="text-gray-400">{e.me}</div>
    ))}
        </div>
    )}
    </div>

    {/* Управление */}
    <div className="mt-32 relative w-full h-screen">
        {(selectedJoystick === 'Joystick' || selectedJoystick === 'JoystickUp') && (
            <>
                {selectedJoystick === 'Joystick' ? (
                    <Joystick
                        mo="A"
                onChange={(v) => handleMotorControl('A', v)}
    disabled={disabled}
    direction={motorADirection}
    sp={motorASpeed}
    />
) : (
        <JoystickUp
            mo="A"
    onChange={(v) => handleMotorControl('A', v)}
    disabled={disabled}
    direction={motorADirection}
    sp={motorASpeed}
    />
)}
    {selectedJoystick === 'Joystick' ? (
            <Joystick
                mo="B"
        onChange={(v) => handleMotorControl('B', v)}
        disabled={disabled}
        direction={motorBDirection}
        sp={motorBSpeed}
        />
    ) : (
        <JoystickUp
            mo="B"
        onChange={(v) => handleMotorControl('B', v)}
        disabled={disabled}
        direction={motorBDirection}
        sp={motorBSpeed}
        />
    )}
    </>
)}

    {selectedJoystick === 'JoyAnalog' && (
        <JoyAnalog
            onChange={handleDualAxisControl}
        onServoChange={adjustServo}
        onServoChangeCheck={adjustServo}
        onRelayChange={(pin, state) => {
        if (pin === "D0" && state === "toggle") {
            const newState = relayD0State ? "off" : "on"
            sendCommand("RLY", { pin: "D0", state: newState })
            addLog(`Реле D0 переключено → ${newState}`, 'info')
        }
    }}
        disabled={disabled}
        />
    )}
    {selectedJoystick === 'Keyboard' && (
        <Keyboard
            onChange={handleDualAxisControl}
        onServoChange={adjustServo}
        onServoChangeCheck={adjustServo}
        onRelayChange={(pin, state) => {
        if (pin === "D0" && state === "toggle") {
            const newState = relayD0State ? "off" : "on"
            sendCommand("RLY", { pin: "D0", state: newState })
            addLog(`Реле D0 переключено → ${newState}`, 'info')
        }
    }}
        disabled={disabled}
        />
    )}
    {selectedJoystick === 'ButtonControl' && (
        <ButtonControl
            onChange={handleDualAxisControl}
        onServoChange={adjustServo}
        onServoChangeCheck={adjustServo}
        onRelayChange={(pin, state) => {
        if (pin === "D0" && state === "toggle") {
            const newState = relayD0State ? "off" : "on"
            sendCommand("RLY", { pin: "D0", state: newState })
            addLog(`Реле D0 переключено → ${newState}`, 'info')
        }
    }}
        disabled={disabled}
        />
    )}

    {isVirtualBoxActive && (
        <VirtualBox
            onServoChange={adjustServoAxis}
        isVirtualBoxActive={true}
        hasOrientationPermission={true}
        hasMotionPermission={true}
        isOrientationSupported={true}
        isMotionSupported={true}
        disabled={disabled}
        />
    )}
    </div>

    {/* Нижняя панель */}
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-50">
        {showServos && (
            <div className="bg-black/70 px-4 py-2 rounded text-green-400">
                V: {servo1Angle}° | H: {servo2Angle}°
                    </div>
)}
    <div className="flex gap-4 items-center">
        {inputVoltage !== null && (
            <span className="text-3xl font-bold text-green-500 bg-black/70 px-6 py-3 rounded-full">
                {inputVoltage.toFixed(2)}V
    </span>
)}
    <Button onClick={() => sendCommand("ALARM", { state: alarmState ? "off" : "on" })}>
    <img src={alarmState ? "/alarm/alarm-on.svg" : "/alarm/alarm-off.svg"} className="w-10 h-10" alt="Alarm" />
        </Button>
    {relayD0State !== null && (
        <Button onClick={() => sendCommand("RLY", { pin: "D0", state: relayD0State ? "off" : "on" })}>
        <img src={relayD0State ? "/off.svg" : "/on.svg"} className="w-10 h-10" alt="Relay" />
        </Button>
    )}
    <Button onClick={() => setShowServos(!showServos)}>
    <img src={showServos ? "/turn2.svg" : "/turn1.svg"} className="w-10 h-10" alt="Servos" />
        </Button>
        <Button onClick={() => {
        const options: typeof selectedJoystick[] = ['ButtonControl', 'Joystick', 'JoystickUp', 'JoyAnalog', 'Keyboard']
        const i = options.indexOf(selectedJoystick)
        setSelectedJoystick(options[(i + 1) % options.length])
    }}>
    <img
        src={
        selectedJoystick === 'Joystick' ? '/control/arrows-down.svg' :
        selectedJoystick === 'JoystickUp' ? '/control/arrows-up.svg' :
            selectedJoystick === 'JoyAnalog' ? '/control/xbox-controller.svg' :
                selectedJoystick === 'Keyboard' ? '/control/keyboard.svg' :
                    '/control/button-control.svg'
}
    className="w-12 h-12"
    alt="Switch control"
        />
        </Button>
        <Button
    onClick={() => setIsVirtualBoxActive(!isVirtualBoxActive)}
    className={isVirtualBoxActive ? 'border-4 border-green-500' : ''}
    >
    <img src="/control/axis-arrow.svg" className="w-12 h-12" alt="VirtualBox" />
        </Button>
        </div>
        </div>
        </div>
)
}

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

сервер

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { getAllowedDeviceIds, getDeviceTelegramInfo } from './actions';
import { createServer } from 'http';
import axios from 'axios';
// Интерфейс для сообщений от клиентов
interface MessageFromESP {
    ty: string;
    co?: string;
    de?: string;
    pa?: { pin: string; state: string };
    me?: string;
    b1?: string;
    b2?: string;
    sp1?: number;
    sp2?: number;
    z?: number;
    r?: string;
    a?: string;
    m?: boolean;
    ct?: 'browser' | 'esp'; // Добавляем поле ct для сообщений типа clt
}
// Конфигурация для Telegram-бота
let TELEGRAM_BOT_TOKEN: string | null = null; // Переменная для хранения токена Telegram-бота, который будет получен динамически
let TELEGRAM_CHAT_ID: string | null = null; // Переменная для хранения ID чата Telegram, который будет получен динамически
let lastTelegramMessageTime = 0; // Время последней отправки сообщения в Telegram для предотвращения спама
const TELEGRAM_MESSAGE_INTERVAL = 5000; // Минимальный интервал (в миллисекундах) между отправками сообщений в Telegram
//const DEVICE_NAME = 'R1'; // Название устройства, используется в сообщениях Telegram

const PORT = 8096; // Порт, на котором будет работать WebSocket-сервер
const WS_PATH = '/wsar'; // Путь для WebSocket-соединений

// Функция для форматирования даты и времени в формате "24.06.2025 13:56" с учетом часового пояса Москвы (UTC+3)
function formatDateTime(date: Date): string {
    const moscowOffset = 3 * 60 * 60 * 1000; // Смещение времени для Москвы (+3 часа) в миллисекундах
    const moscowDate = new Date(date.getTime() + moscowOffset); // Применяем смещение к переданной дате
    const day = String(moscowDate.getUTCDate()).padStart(2, '0'); // День месяца, дополненный ведущим нулем
    const month = String(moscowDate.getUTCMonth() + 1).padStart(2, '0'); // Месяц (нумерация с 0, поэтому +1), дополненный ведущим нулем
    const year = moscowDate.getUTCFullYear(); // Полный год
    const hours = String(moscowDate.getUTCHours()).padStart(2, '0'); // Часы, дополненные ведущим нулем
    const minutes = String(moscowDate.getUTCMinutes()).padStart(2, '0'); // Минуты, дополненные ведущим нулем
    return `${day}.${month}.${year} ${hours}:${minutes}`; // Форматированная строка с датой и временем
}

const server = createServer(); // Создаем HTTP-сервер, который будет использоваться для WebSocket
const wss = new WebSocketServer({
    server, // Привязываем WebSocket-сервер к созданному HTTP-серверу
    path: WS_PATH // Указываем путь для WebSocket-соединений
});

// Интерфейс для хранения информации о подключенных клиентах
interface ClientInfo {
    ws: WebSocket; // Объект WebSocket для общения с клиентом
    de?: string; // Идентификатор устройства (deviceId), может быть не определен на момент подключения
    ip: string; // IP-адрес клиента
    isIdentified: boolean; // Флаг, указывающий, идентифицирован ли клиент
    ct?: 'browser' | 'esp'; // Тип клиента: браузер или ESP-устройство
    lastActivity: number; // Время последней активности клиента (в миллисекундах)
    isAlive: boolean; // Флаг, указывающий, активен ли клиент (для проверки ping/pong)
}

const clients = new Map<number, ClientInfo>(); // Карта для хранения информации о клиентах, ключ — уникальный идентификатор клиента

// Периодическая проверка активности клиентов каждые 30 секунд
setInterval(() => {
    clients.forEach((client, clientId) => {
        if (!client.isAlive) { // Если клиент не ответил на ping, считаем его неактивным
            client.ws.terminate(); // Закрываем соединение с клиентом
            clients.delete(clientId); // Удаляем клиента из карты
            console.log(`Клиент ${clientId} отключен (не ответил на ping)`); // Логируем отключение клиента
            return;
        }
        client.isAlive = false; // Сбрасываем флаг активности перед отправкой нового ping
        client.ws.ping(null, false); // Отправляем ping клиенту для проверки активности
    });
}, 30000); // Интервал проверки — 30 секунд

// Обработка нового WebSocket-соединения
wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
    // Проверяем, что запрос пришел по правильному пути
    if (req.url !== WS_PATH) {
        ws.close(1002, 'Неверный путь'); // Закрываем соединение, если путь неверный, с кодом ошибки 1002
        return;
    }

    const clientId = Date.now(); // Генерируем уникальный идентификатор клиента на основе текущего времени
    const ip = req.socket.remoteAddress || 'unknown'; // Получаем IP-адрес клиента или 'unknown', если адрес недоступен
    const client: ClientInfo = {
        ws, // Сохраняем объект WebSocket
        ip, // Сохраняем IP-адрес клиента
        isIdentified: false, // Клиент пока не идентифицирован
        lastActivity: Date.now(), // Устанавливаем время последней активности
        isAlive: true // Клиент считается активным при подключении
    };
    clients.set(clientId, client); // Добавляем клиента в карту

    console.log(`Новое подключение: ${clientId} с IP ${ip}`); // Логируем новое подключение

    // Обработка ответа на ping от клиента
    ws.on('pong', () => {
        client.isAlive = true; // Помечаем клиента как активного, так как он ответил на ping
        client.lastActivity = Date.now(); // Обновляем время последней активности
    });

    // Отправляем клиенту сообщение об успешном установлении соединения
    ws.send(JSON.stringify({
        ty: "sys", // Тип сообщения: системное
        me: "Соединение установлено", // Сообщение клиенту
        clientId, // Уникальный идентификатор клиента
        st: "awi" // Статус: ожидает идентификации
    }));

    // Обработка входящих сообщений от клиента
    ws.on('message', async (data: Buffer) => {
        try {
            client.lastActivity = Date.now(); // Обновляем время последней активности клиента
            const message = data.toString(); // Преобразуем буфер в строку
            console.log(`[${clientId}] Получено: ${message}`); // Логируем полученное сообщение
            const parsed: MessageFromESP = JSON.parse(message); // Парсим JSON с типом MessageFromESP

            // Обработка сообщения о типе клиента
            if (parsed.ty === "clt") { // Тип сообщения: client_type (тип клиента)
                client.ct = parsed.ct; // Сохраняем тип клиента (browser или esp)
                return;
            }

            // Обработка сообщения идентификации клиента
            if (parsed.ty === "idn") { // Тип сообщения: identify (идентификация)
                const allowedIds = new Set(await getAllowedDeviceIds()); // Получаем список разрешенных идентификаторов устройств
                if (parsed.de && allowedIds.has(parsed.de)) { // Проверяем, что deviceId передан и находится в списке разрешенных
                    client.de = parsed.de; // Сохраняем идентификатор устройства
                    client.isIdentified = true; // Помечаем клиента как идентифицированного

                    // Загружаем данные для отправки уведомлений в Telegram
                    const telegramInfo = await getDeviceTelegramInfo(parsed.de); // Получаем информацию о Telegram для устройства
                    TELEGRAM_BOT_TOKEN = telegramInfo?.telegramToken ?? null; // Сохраняем токен Telegram, если он есть
                    TELEGRAM_CHAT_ID = telegramInfo?.telegramId?.toString() ?? null; // Сохраняем ID чата Telegram, если он есть

                    // Отправляем клиенту подтверждение успешной идентификации
                    ws.send(JSON.stringify({
                        ty: "sys", // Тип сообщения: системное
                        me: "Идентификация успешна", // Сообщение клиенту
                        clientId, // Уникальный идентификатор клиента
                        de: parsed.de, // Идентификатор устройства
                        st: "con" // Статус: подключен
                    }));

                    // Уведомляем браузерные клиенты о подключении ESP-устройства
                    if (client.ct === "esp") { // Если клиент — это ESP-устройство
                        clients.forEach(targetClient => {
                            if (targetClient.ct === "browser" && // Если целевой клиент — браузер
                                targetClient.de === parsed.de && // И имеет тот же deviceId
                                targetClient.de !== null) { // И deviceId определен
                                console.log(`Уведомление браузерного клиента ${targetClient.de} о подключении ESP`); // Логируем уведомление
                                targetClient.ws.send(JSON.stringify({
                                    ty: "est", // Тип сообщения: esp_status (статус ESP)
                                    st: "con", // Статус: подключен
                                    de: parsed.de // Идентификатор устройства
                                }));
                            }
                        });
                    }
                } else {
                    // Если идентификатор устройства не разрешен, отправляем ошибку и закрываем соединение
                    ws.send(JSON.stringify({
                        ty: "err", // Тип сообщения: ошибка
                        me: "Ошибка идентификации", // Сообщение клиенту
                        clientId, // Уникальный идентификатор клиента
                        st: "rej" // Статус: отклонен
                    }));
                    ws.close(); // Закрываем соединение
                    return;
                }
                return;
            }

            // Проверяем, что клиент идентифицирован, иначе отправляем ошибку
            if (!client.isIdentified) {
                ws.send(JSON.stringify({
                    ty: "err", // Тип сообщения: ошибка
                    me: "Клиент не идентифицирован", // Сообщение клиенту
                    clientId // Уникальный идентификатор клиента
                }));
                return;
            }

            // Обработка логов от ESP-устройства
            if (parsed.ty === "log" && client.ct === "esp") { // Тип сообщения: log, клиент — ESP-устройство
                // console.log('111111111111111111')
                // console.log(parsed)
                // Проверяем условия для отправки уведомления в Telegram: реле 1 включено и напряжение меньше 1В
                if (parsed.m === true) {
                    const now = new Date(); // Текущая дата и время
                    const message = `🚨 Устройство: ${parsed.r}, Время: ${formatDateTime(now)}`; // Формируем сообщение для Telegram
                    console.log(message); // Логируем сообщение
                    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) { // Проверяем наличие токена и ID чата
                        sendTelegramMessage(message); // Отправляем сообщение в Telegram
                    } else {
                        console.log('Отсутствуют данные для Telegram'); // Логируем отсутствие данных Telegram
                    }
                }
                // Пересылка логов от ESP браузерным клиентам
                clients.forEach(targetClient => {
                    if (targetClient.ct === "browser" && // Если целевой клиент — браузер
                        targetClient.de === client.de) { // И имеет тот же deviceId
                        targetClient.ws.send(JSON.stringify({
                            ty: "log", // Тип сообщения: лог
                            me: parsed.me, // Сообщение от ESP
                            de: client.de, // Идентификатор устройства
                            or: "esp", // Источник: ESP-устройство
                            b1: parsed.b1, // Состояние реле 1
                            b2: parsed.b2, // Состояние реле 2
                            sp1: parsed.sp1, // Угол первого сервопривода
                            sp2: parsed.sp2, // Угол второго сервопривода
                            z: parsed.z, // Значение входного напряжения
                            a: parsed.a, // Значение входного напряжения
                            m: parsed.m // Значение входного напряжения
                        }));
                    }
                });
                return;
            }

            // Обработка подтверждений команд от ESP
            if (parsed.ty === "ack" && client.ct === "esp") { // Тип сообщения: acknowledge, клиент — ESP
                clients.forEach(targetClient => {
                    if (targetClient.ct === "browser" && // Если целевой клиент — браузер
                        targetClient.de === client.de) { // И имеет тот же deviceId
                        const response: MessageFromESP = {
                            ty: "ack",
                            co: parsed.co,
                            de: client.de,
                            pa: parsed.pa // Передаем pa напрямую, так как оно уже типизировано
                        };
                        console.log("Отправка в браузер:", JSON.stringify(response)); // Улучшенное логирование
                        targetClient.ws.send(JSON.stringify(response));
                    }
                });
                return;
            }

            // Маршрутизация команд к ESP-устройству
            if (parsed.co && parsed.de) { // Если в сообщении есть команда и deviceId
                let delivered = false; // Флаг, указывающий, была ли команда доставлена
                clients.forEach(targetClient => {
                    if (targetClient.de === parsed.de && // Если deviceId совпадает
                        targetClient.ct === "esp" && // Целевой клиент — ESP
                        targetClient.isIdentified) { // И клиент идентифицирован
                        console.log(`BRO --> ESP: ${message}`); // Отладка
                        targetClient.ws.send(message); // Пересылаем команду ESP-устройству
                        delivered = true; // Помечаем, что команда доставлена
                    }
                });
                if (!delivered) {
                    console.log(`No ESP found for deviceId=${parsed.de}`); // Отладка
                }
            }

        } catch (err) {
            // Обработка ошибок при разборе сообщения
            console.error(`[${clientId}] Ошибка обработки сообщения:`, err); // Логируем ошибку
            ws.send(JSON.stringify({
                ty: "err", // Тип сообщения: ошибка
                me: "Неверный формат сообщения", // Сообщение клиенту
                error: (err as Error).message, // Текст ошибки
                clientId // Уникальный идентификатор клиента
            }));
        }
    });

    // Обработка закрытия соединения
    ws.on('close', () => {
        console.log(`Клиент ${clientId} отключился`); // Логируем отключение клиента
        if (client.ct === "esp" && client.de) { // Если клиент — ESP и имеет deviceId
            clients.forEach(targetClient => {
                if (targetClient.ct === "browser" && // Если целевой клиент — браузер
                    targetClient.de === client.de) { // И имеет тот же deviceId
                    targetClient.ws.send(JSON.stringify({
                        ty: "est", // Тип сообщения: esp_status (статус ESP)
                        st: "dis", // Статус: отключен
                        de: client.de, // Идентификатор устройства
                        // ts: new Date().toISOString(), // Закомментировано: временная метка в формате ISO
                        re: "соединение закрыто" // Причина: соединение закрыто
                    }));
                }
            });
        }
        clients.delete(clientId); // Удаляем клиента из карты
    });

    // Обработка ошибок WebSocket
    ws.on('error', (err: Error) => {
        console.error(`[${clientId}] Ошибка WebSocket:`, err); // Логируем ошибку WebSocket
    });
});

// Функция для отправки сообщения в Telegram
async function sendTelegramMessage(message: string) {
    const currentTime = Date.now(); // Текущее время
    if (currentTime - lastTelegramMessageTime < TELEGRAM_MESSAGE_INTERVAL) { // Проверяем, не слишком ли часто отправляются сообщения
        console.log('Отправка сообщения в Telegram ограничена по времени'); // Логируем ограничение
        return;
    }
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) { // Проверяем наличие токена и ID чата
        console.log('Невозможно отправить сообщение в Telegram: отсутствует токен или ID чата'); // Логируем ошибку
        return;
    }
    try {
        // Отправляем сообщение в Telegram через API
        const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID, // ID чата
            text: message // Текст сообщения
        });
        console.log(`Сообщение в Telegram отправлено: ${message}`, response.data); // Логируем успешную отправку
        lastTelegramMessageTime = currentTime; // Обновляем время последней отправки
    } catch (error: any) {
        console.error('Ошибка отправки сообщения в Telegram:', error.response?.data || error.message); // Логируем ошибку
    }
}

// Запускаем сервер
server.listen(PORT, () => {
    console.log(`WebSocket-сервер запущен на ws://0.0.0.0:${PORT}${WS_PATH}`); // Логируем запуск сервера
});

ESP
#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ArduinoWebsockets.h>
#include <ArduinoJson.h>
#include "ServoEasing.hpp"

unsigned long lastWiFiCheck = 0;
unsigned long disconnectStartTime = 0;
const unsigned long MAX_DISCONNECT_TIME = 1UL * 60UL * 60UL * 1000UL; // 1 час

const int analogPin = A0;

// Motor pins driver BTS7960
#define enA D1
#define in1 D2
#define in2 D3
#define in3 D4
#define in4 D5
#define enB D6

// Только одно реле — на D0 (GPIO16)
#define button2 D0  // GPIO16 - простое реле

// Servo pins
#define SERVO1_PIN D7
#define SERVO2_PIN D8

ServoEasing Servo1;
ServoEasing Servo2;

bool enableHeartbeatMotorProtection = true;

using namespace websockets;

const char *ssid = "Robolab124";
const char *password = "wifi123123123";
const char *websocket_server = "wss://a.ardu.live:444/wsar";

String alarm = "off";
boolean alarmMotion = false;

const char *de = "9999999999999999"; // deviceId

WebsocketsClient client;
unsigned long lastReconnectAttempt = 0;
unsigned long lastHeartbeatTime = 0;
unsigned long lastAnalogReadTime = 0;
unsigned long lastHeartbeat2Time = 0;
bool wasConnected = false;
bool isIdentified = false;

// Объявления функций
void sendLogMessage(const char *me);
void sendCommandAck(const char *co, int sp = -1);
void stopMotors();
void identifyDevice();
void ensureWiFiConnected();
void connectToServer();
void onMessageCallback(WebsocketsMessage message);
void onEventsCallback(WebsocketsEvent event, String data);

void sendLogMessage(const char *me)
{
    if (client.available())
    {
        StaticJsonDocument<256> doc;
        doc["ty"] = "log";
        doc["me"] = me;
        doc["de"] = de;
        doc["b2"] = digitalRead(button2) == LOW ? "off" : "on";  // Только реле на D0
        doc["sp1"] = Servo1.read();
        doc["sp2"] = Servo2.read();
        int raw = analogRead(analogPin);
        float inputVoltage = raw * 0.021888;
        char voltageStr[8];
        dtostrf(inputVoltage, 5, 2, voltageStr);
        doc["z"] = voltageStr;
        doc["r"] = "Dionis-Moto";
        doc["a"] = alarm;
        doc["m"] = alarmMotion;
        String output;
        serializeJson(doc, output);
        Serial.println("sendLogMessage: " + output);
        client.send(output);
        alarmMotion = false;
    }
}

void sendCommandAck(const char *co, int sp)
{
    if (client.available() && isIdentified)
    {
        StaticJsonDocument<256> doc;
        doc["ty"] = "ack";
        doc["co"] = co;
        doc["de"] = de;
        if (strcmp(co, "SPD") == 0 && sp != -1)
        {
            doc["sp"] = sp;
        }
        String output;
        serializeJson(doc, output);
        Serial.println("Sending ack: " + output);
        client.send(output);
    }
}

void stopMotors()
{
    analogWrite(enA, 0);
    analogWrite(enB, 0);
    enableHeartbeatMotorProtection = false;
}

void identifyDevice()
{
    if (client.available())
    {
        StaticJsonDocument<128> typeDoc;
        typeDoc["ty"] = "clt";
        typeDoc["ct"] = "esp";
        String typeOutput;
        serializeJson(typeDoc, typeOutput);
        client.send(typeOutput);

        StaticJsonDocument<128> doc;
        doc["ty"] = "idn";
        doc["de"] = de;
        String output;
        serializeJson(doc, output);
        client.send(output);

        Serial.println("Identification sent");
    }
}

void ensureWiFiConnected() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi disconnected, reconnecting...");
        WiFi.disconnect();
        WiFi.begin(ssid, password);
        int attempts = 0;
        while (WiFi.status() != WL_CONNECTED && attempts < 20) {
            delay(500);
            Serial.print(".");
            attempts++;
        }
        if (WiFi.status() == WL_CONNECTED) {
            Serial.println("\nWiFi reconnected");
        } else {
            Serial.println("\nWiFi reconnection failed");
        }
    }
}

void connectToServer() {
    Serial.println("Connecting to server...");
    client.close();
    client = WebsocketsClient();
    client.onMessage(onMessageCallback);
    client.onEvent(onEventsCallback);
    client.addHeader("Origin", "http://ardua.site");
    client.setInsecure();

    if (client.connect(websocket_server)) {
        Serial.println("WebSocket connected!");
        wasConnected = true;
        isIdentified = false;
        disconnectStartTime = 0;
        identifyDevice();
    } else {
        Serial.println("WebSocket connection failed!");
        wasConnected = false;
        isIdentified = false;
        if (disconnectStartTime == 0) {
            disconnectStartTime = millis();
        }
    }
}

void onMessageCallback(WebsocketsMessage message)
{
    StaticJsonDocument<192> doc;
    DeserializationError error = deserializeJson(doc, message.data());

    if (error)
    {
        Serial.print("JSON parse error: ");
        Serial.println(error.c_str());
        return;
    }
    lastHeartbeat2Time = millis();

    Serial.println("Received message: " + message.data());

    if (doc["ty"] == "sys" && doc["st"] == "con")
    {
        isIdentified = true;
        Serial.println("Successfully identified!");
        sendLogMessage("ESP connected and identified");

        char relayStatus[64];
        snprintf(relayStatus, sizeof(relayStatus), "Relay D0=%s",
            digitalRead(button2) == LOW ? "off" : "on");
        sendLogMessage(relayStatus);

        Servo1.write(90);
        Servo2.write(90);
        sendLogMessage("Servos initialized to 90 degrees");
        return;
    }

    const char *co = doc["co"];
    if (!co) return;

    if (strcmp(co, "STP") == 0){
        stopMotors();
    }
    else if (strcmp(co, "SPD") == 0) {
        const char *mo = doc["pa"]["mo"];
        int speed = doc["pa"]["sp"];
        Serial.printf("SPD command received: motor=%s, speed=%d\n", mo, speed);
        if (strcmp(mo, "A") == 0) {
            analogWrite(enA, speed);
        } else if(strcmp(mo, "B") == 0) {
            analogWrite(enB, speed);
        }
        sendLogMessage("SPD");
    }
    else if (strcmp(co, "MFA") == 0) {
        digitalWrite(in1, HIGH);
        digitalWrite(in2, LOW);
    }
    else if (strcmp(co, "MRA") == 0) {
        digitalWrite(in1, LOW);
        digitalWrite(in2, HIGH);
    }
    else if (strcmp(co, "MFB") == 0) {
        digitalWrite(in3, HIGH);
        digitalWrite(in4, LOW);
    }
    else if (strcmp(co, "MRB") == 0) {
        digitalWrite(in3, LOW);
        digitalWrite(in4, HIGH);
    }
    else if (strcmp(co, "SAR") == 0)
    {
        int an = doc["pa"]["an"];
        int ak = doc["pa"]["ak"];
        an = constrain(an, 0, 180);
        ak = constrain(ak, 0, 180);
        Servo1.write(an);
        Servo2.write(ak);
    }
    else if (strcmp(co, "SSY") == 0)
    {
        int an = doc["pa"]["an"];
        an = constrain(an, 0, 180);
        Servo1.write(an);
    }
    else if (strcmp(co, "SSX") == 0)
    {
        int an = doc["pa"]["an"];
        an = constrain(an, 0, 180);
        Servo2.write(an);
    }
    else if (strcmp(co, "SSA") == 0)
    {
        int an = doc["pa"]["an"];
        int SSA = Servo1.read();
        if(an > 0){
            if(SSA + an < 180) Servo1.write(SSA + an);
        }else{
            if(SSA + an > 0) Servo1.write(SSA + an);
        }
    }
    else if (strcmp(co, "SSB") == 0)
    {
        int an = doc["pa"]["an"];
        int SSB = Servo2.read();
        if(an > 0){
            if(SSB + an < 180) Servo2.write(SSB + an);
        }else{
            if(SSB + an > 0) Servo2.write(SSB + an);
        }
    }
    else if (strcmp(co, "GET_RELAYS") == 0)
    {
        char relayStatus[64];
        snprintf(relayStatus, sizeof(relayStatus), "Relay D0=%s",
            digitalRead(button2) == LOW ? "off" : "on");
        sendLogMessage(relayStatus);
        return;
    }
    else if (strcmp(co, "HBT") == 0)
    {
        lastHeartbeat2Time = millis();
        enableHeartbeatMotorProtection = true;
    }
    else if (strcmp(co, "RLY") == 0)
    {
        const char *pin = doc["pa"]["pin"];
        const char *state = doc["pa"]["state"];

        if (!pin || !state) {
            Serial.println("Ошибка: pin или state отсутствуют в JSON!");
            return;
        }

        // Теперь только D0
        if (strcmp(pin, "D0") == 0)
        {
            digitalWrite(button2, strcmp(state, "on") == 0 ? LOW : HIGH);
            Serial.println("Relay D0 set to: " + String(state));
        }

        StaticJsonDocument<256> ackDoc;
        ackDoc["ty"] = "ack";
        ackDoc["co"] = "RLY";
        ackDoc["de"] = de;
        JsonObject pa = ackDoc.createNestedObject("pa");
        pa["pin"] = pin;
        pa["state"] = state;
        String output;
        serializeJson(ackDoc, output);
        Serial.println("Отправка подтверждения RLY: " + output);
        client.send(output);
    }
    else if (strcmp(co, "ALARM") == 0)
    {
        const char *state = doc["pa"]["state"];
        if (!state) return;

        alarm = state;

        StaticJsonDocument<256> ackDoc;
        ackDoc["ty"] = "ack";
        ackDoc["co"] = "ALARM";
        ackDoc["de"] = de;
        JsonObject pa = ackDoc.createNestedObject("pa");
        pa["state"] = alarm;
        String output;
        serializeJson(ackDoc, output);
        client.send(output);
    }
}

void onEventsCallback(WebsocketsEvent event, String data) {
    if (event == WebsocketsEvent::ConnectionOpened) {
        Serial.println("Connection opened");
    } else if (event == WebsocketsEvent::ConnectionClosed) {
        Serial.println("Connection closed");
        if (wasConnected) {
            wasConnected = false;
            isIdentified = false;
            stopMotors();
        }
        if (disconnectStartTime == 0) {
            disconnectStartTime = millis();
        }
    } else if (event == WebsocketsEvent::GotPing) {
        client.pong();
    }
}

void setup()
{
    Serial.begin(115200);
    delay(1000);
    Serial.println("Starting ESP8266...");

    if (Servo1.attach(SERVO1_PIN, 90) == INVALID_SERVO)
    {
        Serial.println("Error attaching servo1");
        while (1) delay(100);
    }
    Servo1.write(90);

    if (Servo2.attach(SERVO2_PIN, 90) == INVALID_SERVO)
    {
        Serial.println("Error attaching servo2");
        while (1) delay(100);
    }
    Servo2.write(90);

    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi");
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected");

    connectToServer();

    pinMode(enA, OUTPUT);
    pinMode(enB, OUTPUT);
    pinMode(in1, OUTPUT);
    pinMode(in2, OUTPUT);
    pinMode(in3, OUTPUT);
    pinMode(in4, OUTPUT);
    pinMode(button2, OUTPUT);  // Только D0

    digitalWrite(button2, HIGH);
    digitalWrite(in1, HIGH);
    digitalWrite(in2, LOW);
    digitalWrite(in3, HIGH);
    digitalWrite(in4, LOW);
    stopMotors();
    Serial.println("Motors and relay initialized");
}

void loop() {
    if (millis() - lastWiFiCheck > 30000) {
        lastWiFiCheck = millis();
        ensureWiFiConnected();
    }

    if (!client.available()) {
        if (millis() - lastReconnectAttempt > 5000) {
            lastReconnectAttempt = millis();
            connectToServer();
        }

        if (disconnectStartTime > 0 && (millis() - disconnectStartTime > MAX_DISCONNECT_TIME)) {
            Serial.println("No connection for 1 hour, restarting...");
            ESP.restart();
        }
    } else {
        client.poll();

        if (isIdentified) {
            if (millis() - lastAnalogReadTime > 100) {
                lastAnalogReadTime = millis();
            }

            if (millis() - lastHeartbeatTime > 5000) {
                lastHeartbeatTime = millis();
                sendLogMessage("HBT");
            }

            if (millis() - lastHeartbeat2Time > 700) {
                if (enableHeartbeatMotorProtection) {
                    stopMotors();
                    Serial.print("HBT stopMotors()");
                }
            }
        } else if (millis() - lastReconnectAttempt > 3000) {
            lastReconnectAttempt = millis();
            identifyDevice();
        }
    }
}

проблема
else if (strcmp(co, "SPD") == 0) {
    const char *mo = doc["pa"]["mo"];
    int speed = doc["pa"]["sp"];
    Serial.printf("SPD command received: motor=%s, speed=%d\n", mo, speed);
    if (strcmp(mo, "A") == 0) {
        analogWrite(enA, speed);
    } else if(strcmp(mo, "B") == 0) {
        analogWrite(enB, speed);
    }
    sendLogMessage("SPD");
}
else if (strcmp(co, "MFA") == 0) {
    digitalWrite(in1, HIGH);
    digitalWrite(in2, LOW);
}
else if (strcmp(co, "MRA") == 0) {
    digitalWrite(in1, LOW);
    digitalWrite(in2, HIGH);
}
else if (strcmp(co, "MFB") == 0) {
    digitalWrite(in3, HIGH);
    digitalWrite(in4, LOW);
}
else if (strcmp(co, "MRB") == 0) {
    digitalWrite(in3, LOW);
    digitalWrite(in4, HIGH);
}
моторы крутятся только в одну сторонуЮ нет реверса, но драйвер BTS7960 подсоединен правильно
тестовый код работает
#include <Arduino.h>  // <<<--- ОБЯЗАТЕЛЬНО ДОБАВИТЬ!

// Пины для управления BTS7960 (два мотора A и B)
#define PIN_ENA  D1   // PWM для мотора A
#define PIN_IN1  D2   // Направление мотора A
#define PIN_IN2  D3   // Направление мотора A

#define PIN_ENB  D6   // PWM для мотора B
#define PIN_IN3  D4  // Направление мотора B
#define PIN_IN4  D5   // Направление мотора B


const int MOTOR_SPEED = 150;  // ~78% от максимума

void motorForward(int speed);
void motorBackward(int speed);
void stopMotors();

void setup() {
    pinMode(PIN_ENA, OUTPUT);
    pinMode(PIN_IN1, OUTPUT);
    pinMode(PIN_IN2, OUTPUT);

    pinMode(PIN_ENB, OUTPUT);
    pinMode(PIN_IN3, OUTPUT);
    pinMode(PIN_IN4, OUTPUT);

    stopMotors();

    Serial.println("Вперёд 5 секунд");
    motorForward(MOTOR_SPEED);
    delay(2000);

    Serial.println("Стоп 2 секунды");
    stopMotors();
    delay(2000);

    Serial.println("Назад 5 секунд");
    motorBackward(MOTOR_SPEED);
    delay(2000);

    Serial.println("Стоп 2 секунды");
    stopMotors();

    Serial.begin(115200);
    Serial.println("Тест управления моторами BTS7960 начат");
}

void loop() {
//   Serial.println("Вперёд 5 секунд");
//   motorForward(MOTOR_SPEED);
//   delay(2000);
//
//   Serial.println("Стоп 2 секунды");
//   stopMotors();
//   delay(2000);
//
//   Serial.println("Назад 5 секунд");
//   motorBackward(MOTOR_SPEED);
//   delay(2000);
//
//   Serial.println("Стоп 2 секунды");
//   stopMotors();
//   delay(200000);
}

void motorForward(int speed) {
    digitalWrite(PIN_IN1, HIGH);
    digitalWrite(PIN_IN2, LOW);
    analogWrite(PIN_ENA, speed);

    digitalWrite(PIN_IN3, HIGH);
    digitalWrite(PIN_IN4, LOW);
    analogWrite(PIN_ENB, speed);
}

void motorBackward(int speed) {
    digitalWrite(PIN_IN1, LOW);
    digitalWrite(PIN_IN2, HIGH);
    analogWrite(PIN_ENA, speed);

    digitalWrite(PIN_IN3, LOW);
    digitalWrite(PIN_IN4, HIGH);
    analogWrite(PIN_ENB, speed);
}

void stopMotors() {
    analogWrite(PIN_ENA, 0);
    analogWrite(PIN_ENB, 0);

    digitalWrite(PIN_IN1, LOW);
    digitalWrite(PIN_IN2, LOW);
    digitalWrite(PIN_IN3, LOW);
    digitalWrite(PIN_IN4, LOW);
}


