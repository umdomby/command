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