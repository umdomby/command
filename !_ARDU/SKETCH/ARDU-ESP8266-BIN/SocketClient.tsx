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

type LogEntry = { me: string; ty: 'client' | 'esp' | 'server' | 'error' | 'success' | 'info' }

// Бинарные константы — должны совпадать с ESP
const CMD_CLIENT_TYPE   = 0x02
const CMD_IDENTIFY      = 0x01
const CMD_HEARTBEAT     = 0x10
const CMD_MOTOR         = 0x20
const CMD_SERVO_ABS     = 0x30
const CMD_RELAY         = 0x40
const CMD_ALARM         = 0x41

const RSP_FULL_STATUS   = 0x50
const RSP_ACK           = 0x51

export default function SocketClient() {
    const [log, setLog] = useState<LogEntry[]>([])
    const [isConnected, setIsConnected] = useState(false)
    const [isIdentified, setIsIdentified] = useState(false)
    const [espConnected, setEspConnected] = useState(false)

    const [deviceId, setDeviceId] = useState<string>(() =>
        typeof window !== 'undefined' ? localStorage.getItem('currentDeviceId') || '' : ''
    )
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

    // Троттлинг и кэш команд моторов
    const motorAThrottleRef = useRef<NodeJS.Timeout | null>(null)
    const motorBThrottleRef = useRef<NodeJS.Timeout | null>(null)
    const lastMotorACommandRef = useRef<{ speed: number; dir: 0|1|2 } | null>(null)
    const lastMotorBCommandRef = useRef<{ speed: number; dir: 0|1|2 } | null>(null)

    const [motorASpeed, setMotorASpeed] = useState(0)
    const [motorBSpeed, setMotorBSpeed] = useState(0)
    const [motorADirection, setMotorADirection] = useState<0|1|2>(0) // 0=stop, 1=forward, 2=backward
    const [motorBDirection, setMotorBDirection] = useState<0|1|2>(0)

    const addLog = useCallback((msg: string, ty: LogEntry['ty'] = 'info') => {
        setLog(prev => [...prev.slice(-100), { me: `${new Date().toLocaleTimeString()}: ${msg}`, ty }])
    }, [])

    // localStorage
    useEffect(() => { localStorage.setItem('currentDeviceId', deviceId) }, [deviceId])
    useEffect(() => { localStorage.setItem('showServos', JSON.stringify(showServos)) }, [showServos])
    useEffect(() => { localStorage.setItem('selectedJoystick', selectedJoystick) }, [selectedJoystick])
    useEffect(() => { localStorage.setItem('isVirtualBoxActive', JSON.stringify(isVirtualBoxActive)) }, [isVirtualBoxActive])

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
        const url = process.env.NEXT_PUBLIC_WEB_SOCKET_URL || 'wss://a.ardu.live/wsar'
        const ws = new WebSocket(url)

        ws.binaryType = 'arraybuffer'

        ws.onopen = () => {
            setIsConnected(true)
            addLog('Подключено к серверу', 'success')

            // 1. Тип клиента
            ws.send(new Uint8Array([CMD_CLIENT_TYPE, 1]))

            // 2. Идентификация
            const idBuf = new Uint8Array(17)
            idBuf[0] = CMD_IDENTIFY
            const encoder = new TextEncoder()
            const idBytes = encoder.encode(deviceId.padEnd(16, ' '))
            idBuf.set(idBytes, 1)
            ws.send(idBuf)

            // *** КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ ***
            setIsIdentified(true)  // ← Добавь эту строку!
        }

        ws.onmessage = (event) => {
            if (!(event.data instanceof ArrayBuffer)) return

            const data = new Uint8Array(event.data)
            if (data.length === 0) return

            const type = data[0]



            if (type === RSP_FULL_STATUS && data.length >= 9) {
                // FULL_STATUS от ESP
                const relayOn = data[1] === 1
                const s1 = data[2]
                const s2 = data[3]
                const voltRaw = (data[4] << 8) | data[5]
                const voltage = voltRaw * 0.021888  // ваш коэффициент из ESP

                setRelayD0State(relayOn)
                setServo1Angle(s1)
                setServo2Angle(s2)
                setInputVoltage(voltage)

                if (!espConnected) {
                    setEspConnected(true)
                    addLog('ESP подключён (бинарный статус)', 'success')
                }
            }
            else if (type === 0x60) {  // esp status от сервера
                const status = data[1];
                if (status === 1) {
                    setEspConnected(true);
                    addLog('ESP подключён (уведомление от сервера)', 'success');
                } else {
                    setEspConnected(false);
                    addLog('ESP отключился', 'error');
                }
            }
            else if (type === RSP_ACK) {
                // Можно добавить обработку подтверждений если нужно
                // addLog(`Получено подтверждение команды 0x${data[1].toString(16)}`, 'success')
            }
        }

        ws.onclose = () => {
            setIsConnected(false)
            setIsIdentified(false)
            setEspConnected(false)
            addLog('Соединение закрыто', 'error')
        }

        ws.onerror = () => {
            addLog('Ошибка WebSocket-соединения', 'error')
        }

        socketRef.current = ws
    }, [deviceId, cleanupWebSocket, addLog, espConnected])

    // Отправка бинарных данных
    const sendBinary = useCallback((data: Uint8Array) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;  // ← Убрали !isIdentified
        socketRef.current.send(data)
    }, [])

    const sendHeartbeat = useCallback(() => {
        sendBinary(new Uint8Array([CMD_HEARTBEAT]))
    }, [sendBinary])

    const sendMotor = useCallback((motor: 'A'|'B', speed: number, dir: 0|1|2) => {
        const buf = new Uint8Array(5)
        buf[0] = CMD_MOTOR
        buf[1] = motor === 'A' ? 65 : 66           // 'A'=65, 'B'=66
        buf[2] = Math.min(255, Math.max(0, speed))
        buf[3] = dir

        // Проверка дубликата
        const ref = motor === 'A' ? lastMotorACommandRef : lastMotorBCommandRef
        if (ref.current?.speed === buf[2] && ref.current?.dir === dir) return
        ref.current = { speed: buf[2], dir }

        sendBinary(buf)
    }, [sendBinary])

    // Управление моторами с троттлингом и мгновенной остановкой
    const handleMotorControl = useCallback((motor: 'A'|'B', value: number) => {
        const abs = Math.abs(value)
        const dir: 0|1|2 = value > 0 ? 1 : value < 0 ? 2 : 0
        const speed = Math.round(abs)

        if (motor === 'A') {
            setMotorASpeed(speed)
            setMotorADirection(dir)
        } else {
            setMotorBSpeed(speed)
            setMotorBDirection(dir)
        }

        if (speed === 0) {
            if (motorAThrottleRef.current) clearTimeout(motorAThrottleRef.current)
            if (motorBThrottleRef.current) clearTimeout(motorBThrottleRef.current)
            sendMotor(motor, 0, 0)
            return
        }

        const throttleRef = motor === 'A' ? motorAThrottleRef : motorBThrottleRef
        if (throttleRef.current) clearTimeout(throttleRef.current)

        throttleRef.current = setTimeout(() => {
            sendMotor(motor, speed, dir)
        }, 40)
    }, [sendMotor])

    const handleDualAxisControl = useCallback(({ x, y }: { x: number; y: number }) => {
        handleMotorControl('A', Math.round(x))
        handleMotorControl('B', Math.round(y))
    }, [handleMotorControl])

    // Абсолютное положение серво (замена SSY/SSX)
    const adjustServo = useCallback((servoId: '1'|'2', value: number, isAbsolute: boolean) => {
        const current = servoId === '1' ? servo1Angle : servo2Angle
        const angle = isAbsolute ? value : current + value
        const clamped = Math.max(0, Math.min(180, Math.round(angle)))

        const buf = new Uint8Array(4)
        buf[0] = CMD_SERVO_ABS
        buf[1] = servoId === '1' ? 1 : 2
        buf[2] = clamped

        sendBinary(buf)

        if (servoId === '1') setServo1Angle(clamped)
        else setServo2Angle(clamped)
    }, [servo1Angle, servo2Angle, sendBinary])

    // Переключение реле D0
    const toggleRelay = useCallback(() => {
        if (relayD0State === null) return
        const newState = !relayD0State

        const buf = new Uint8Array([CMD_RELAY, newState ? 1 : 0])
        sendBinary(buf)

        setRelayD0State(newState)
        addLog(`Реле D0 → ${newState ? 'on' : 'off'}`, 'info')
    }, [relayD0State, sendBinary, addLog])

    // Переключение тревоги
    const toggleAlarm = useCallback(() => {
        const newState = !alarmState

        const buf = new Uint8Array([CMD_ALARM, newState ? 1 : 0])
        sendBinary(buf)

        setAlarmState(newState)
    }, [alarmState, sendBinary])

    // Heartbeat каждые 300 мс при активных моторах
    useEffect(() => {
        if (!isConnected || !isIdentified || (motorASpeed <= 0 && motorBSpeed <= 0)) return

        const interval = setInterval(sendHeartbeat, 300)
        return () => clearInterval(interval)
    }, [isConnected, isIdentified, motorASpeed, motorBSpeed, sendHeartbeat])

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
                                direction={motorADirection === 1 ? 'forward' : motorADirection === 2 ? 'backward' : 'stop'}
                                sp={motorASpeed}
                            />
                        ) : (
                            <JoystickUp
                                mo="A"
                                onChange={(v) => handleMotorControl('A', v)}
                                disabled={disabled}
                                direction={motorADirection === 1 ? 'forward' : motorADirection === 2 ? 'backward' : 'stop'}
                                sp={motorASpeed}
                            />
                        )}
                        {selectedJoystick === 'Joystick' ? (
                            <Joystick
                                mo="B"
                                onChange={(v) => handleMotorControl('B', v)}
                                disabled={disabled}
                                direction={motorBDirection === 1 ? 'forward' : motorBDirection === 2 ? 'backward' : 'stop'}
                                sp={motorBSpeed}
                            />
                        ) : (
                            <JoystickUp
                                mo="B"
                                onChange={(v) => handleMotorControl('B', v)}
                                disabled={disabled}
                                direction={motorBDirection === 1 ? 'forward' : motorBDirection === 2 ? 'backward' : 'stop'}
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
                            if (pin === "D0" && state === "toggle") toggleRelay()
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
                            if (pin === "D0" && state === "toggle") toggleRelay()
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
                            if (pin === "D0" && state === "toggle") toggleRelay()
                        }}
                        disabled={disabled}
                    />
                )}

                {isVirtualBoxActive && (
                    <VirtualBox
                        onServoChange={adjustServo}
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
                    <Button onClick={toggleAlarm}>
                        <img src={alarmState ? "/alarm/alarm-on.svg" : "/alarm/alarm-off.svg"} className="w-10 h-10" alt="Alarm" />
                    </Button>
                    {relayD0State !== null && (
                        <Button onClick={toggleRelay}>
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