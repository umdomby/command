\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\control\SocketClient.tsx
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\control\Joystick.tsx
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\VideoCallApp.tsx
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\stores\motorControlStore.ts


// file: docker-ardua/components/control/SocketClient.tsx
// file: docker-ardua/components/control/SocketClient.tsx
"use client"
import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import {
Dialog, DialogClose,
DialogContent, DialogDescription,
DialogHeader,
DialogTitle,
DialogTrigger,
} from "@/components/ui/dialog"
import {VisuallyHidden} from "@radix-ui/react-visually-hidden";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import Joystick from './Joystick'
import styles from './styles.module.css'
import {useMotorControl} from "@/stores/motorControlStore";

interface SocketClientProps {
compactMode?: boolean;
onStatusChange?: (status: { /* ... */ }) => void;
onMotorControl?: (motor: 'A' | 'B', value: number) => void;
}

type MessageType = {
type?: string
command?: string
deviceId?: string
message?: string
params?: any
clientId?: number
status?: string
timestamp?: string
origin?: 'client' | 'esp' | 'server' | 'error'
reason?: string
}

type LogEntry = {
message: string
type: 'client' | 'esp' | 'server' | 'error'
}

interface SocketClientProps {
compactMode?: boolean
onStatusChange?: (status: {
isConnected: boolean
isIdentified: boolean
espConnected: boolean
}) => void
}

export default function SocketClient({ compactMode, onStatusChange }: SocketClientProps) {
const [log, setLog] = useState<LogEntry[]>([])
const [isConnected, setIsConnected] = useState(false)
const [isIdentified, setIsIdentified] = useState(false)
const [deviceId, setDeviceId] = useState('123')
const [inputDeviceId, setInputDeviceId] = useState('123')
const [newDeviceId, setNewDeviceId] = useState('')
const [deviceList, setDeviceList] = useState<string[]>(['123'])
const [espConnected, setEspConnected] = useState(false)
const [controlVisible, setControlVisible] = useState(false)
const [logVisible, setLogVisible] = useState(false)
const [autoReconnect, setAutoReconnect] = useState(false)
const [autoConnect, setAutoConnect] = useState(false)

    const reconnectAttemptRef = useRef(0)
    const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
    const socketRef = useRef<WebSocket | null>(null)
    const commandTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastMotorACommandRef = useRef<{speed: number, direction: 'forward' | 'backward' | 'stop'} | null>(null)
    const lastMotorBCommandRef = useRef<{speed: number, direction: 'forward' | 'backward' | 'stop'} | null>(null)
    const motorAThrottleRef = useRef<NodeJS.Timeout | null>(null)
    const motorBThrottleRef = useRef<NodeJS.Timeout | null>(null)
    const currentDeviceIdRef = useRef(inputDeviceId)

    useEffect(() => {
        currentDeviceIdRef.current = inputDeviceId
    }, [inputDeviceId])

    useEffect(() => {
        const savedDevices = localStorage.getItem('espDeviceList')
        if (savedDevices) {
            const devices = JSON.parse(savedDevices)
            setDeviceList(devices)
            if (devices.length > 0) {
                const savedDeviceId = localStorage.getItem('selectedDeviceId')
                const initialDeviceId = savedDeviceId && devices.includes(savedDeviceId)
                    ? savedDeviceId
                    : devices[0]
                setInputDeviceId(initialDeviceId)
                setDeviceId(initialDeviceId)
                currentDeviceIdRef.current = initialDeviceId
            }
        }

        const savedAutoReconnect = localStorage.getItem('autoReconnect')
        if (savedAutoReconnect) {
            setAutoReconnect(savedAutoReconnect === 'true')
        }

        const savedAutoConnect = localStorage.getItem('autoConnect')
        if (savedAutoConnect) {
            setAutoConnect(savedAutoConnect === 'true')
        }
    }, [])

    // Изменим useEffect для передачи статуса
    useEffect(() => {
        if (onStatusChange) {
            onStatusChange({
                isConnected,
                isIdentified,
                espConnected
            });
        }
    }, [isConnected, isIdentified, espConnected, onStatusChange]);


    const saveNewDeviceId = useCallback(() => {
        if (newDeviceId && !deviceList.includes(newDeviceId)) {
            const updatedList = [...deviceList, newDeviceId]
            setDeviceList(updatedList)
            localStorage.setItem('espDeviceList', JSON.stringify(updatedList))
            setInputDeviceId(newDeviceId)
            setNewDeviceId('')
            currentDeviceIdRef.current = newDeviceId
        }
    }, [newDeviceId, deviceList])

    const addLog = useCallback((msg: string, type: LogEntry['type']) => {
        setLog(prev => [...prev.slice(-100), {message: `${new Date().toLocaleTimeString()}: ${msg}`, type}])
    }, [])

    const cleanupWebSocket = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.onopen = null
            socketRef.current.onclose = null
            socketRef.current.onmessage = null
            socketRef.current.onerror = null
            if (socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.close()
            }
            socketRef.current = null
        }
    }, [])

    const connectWebSocket = useCallback((deviceIdToConnect: string) => {
        cleanupWebSocket()

        reconnectAttemptRef.current = 0
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current)
            reconnectTimerRef.current = null
        }

        const ws = new WebSocket('wss://ardu.site/ws')

        // Внутри функции connectWebSocket
// Внутри функции connectWebSocket
ws.onopen = () => {
setIsConnected(true)
reconnectAttemptRef.current = 0
addLog("Connected to WebSocket server", 'server')

            // Регистрируем сокет в хранилище
            const unregister = useMotorControl.getState().registerSocket(ws)
            useMotorControl.getState().initialize()

            ws.send(JSON.stringify({
                type: 'client_type',
                clientType: 'browser'
            }))

            ws.send(JSON.stringify({
                type: 'identify',
                deviceId: deviceIdToConnect
            }))

            // Возвращаем функцию очистки
            return () => {
                unregister()
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close()
                }
            }
        }

        ws.onmessage = (event) => {
            try {
                const data: MessageType = JSON.parse(event.data)
                console.log("Received message:", data)

                if (data.type === "system") {
                    if (data.status === "connected") {
                        setIsIdentified(true)
                        setDeviceId(deviceIdToConnect)
                    }
                    addLog(`System: ${data.message}`, 'server')
                }
                else if (data.type === "error") {
                    addLog(`Error: ${data.message}`, 'error')
                    setIsIdentified(false)
                }
                else if (data.type === "log") {
                    addLog(`ESP: ${data.message}`, 'esp')
                    if (data.message && data.message.includes("Heartbeat")) {
                        setEspConnected(true)
                    }
                }
                else if (data.type === "esp_status") {
                    console.log(`Received ESP status: ${data.status}`)
                    setEspConnected(data.status === "connected")
                    addLog(`ESP ${data.status === "connected" ? "✅ Connected" : "❌ Disconnected"}${data.reason ? ` (${data.reason})` : ''}`,
                        data.status === "connected" ? 'esp' : 'error')
                }
                else if (data.type === "command_ack") {
                    if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current)
                    addLog(`ESP executed command: ${data.command}`, 'esp')
                }
                else if (data.type === "command_status") {
                    addLog(`Command ${data.command} delivered to ESP`, 'server')
                }
            } catch (error) {
                console.error("Error processing message:", error)
                addLog(`Received invalid message: ${event.data}`, 'error')
            }
        }

        // В обработчике onclose
        ws.onclose = (event) => {
            setIsConnected(false)
            setIsIdentified(false)
            setEspConnected(false)

            // Функция registerSocket уже автоматически очистит сокет через возвращаемую функцию unregister
            // Поэтому нам не нужно явно вызывать setSocket(null)

            addLog(`Disconnected from server${event.reason ? `: ${event.reason}` : ''}`, 'server')

            if (reconnectAttemptRef.current < 5) {
                reconnectAttemptRef.current += 1
                const delay = Math.min(5000, reconnectAttemptRef.current * 1000)
                addLog(`Attempting to reconnect in ${delay/1000} seconds... (attempt ${reconnectAttemptRef.current})`, 'server')

                reconnectTimerRef.current = setTimeout(() => {
                    connectWebSocket(currentDeviceIdRef.current)
                }, delay)
            } else {
                addLog("Max reconnection attempts reached", 'error')
            }
        }

        ws.onerror = (error) => {
            addLog(`WebSocket error: ${error.type}`, 'error')
        }

        socketRef.current = ws
    }, [addLog, cleanupWebSocket])

    useEffect(() => {
        if (autoConnect && !isConnected) {
            connectWebSocket(currentDeviceIdRef.current)
        }
    }, [autoConnect, connectWebSocket, isConnected])

    const handleAutoConnectChange = useCallback((checked: boolean) => {
        setAutoConnect(checked)
        localStorage.setItem('autoConnect', checked.toString())
    }, [])

    const disconnectWebSocket = useCallback(() => {
        return new Promise<void>((resolve) => {
            cleanupWebSocket()
            setIsConnected(false)
            setIsIdentified(false)
            setEspConnected(false)
            addLog("Disconnected manually", 'server')
            reconnectAttemptRef.current = 5

            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current)
                reconnectTimerRef.current = null
            }
            resolve()
        })
    }, [addLog, cleanupWebSocket])

    const handleDeviceChange = useCallback(async (value: string) => {
        setInputDeviceId(value)
        currentDeviceIdRef.current = value
        localStorage.setItem('selectedDeviceId', value)

        if (autoReconnect) {
            await disconnectWebSocket()
            connectWebSocket(value)
        }
    }, [autoReconnect, disconnectWebSocket, connectWebSocket])

    const toggleAutoReconnect = useCallback((checked: boolean) => {
        setAutoReconnect(checked)
        localStorage.setItem('autoReconnect', checked.toString())
    }, [])

    const sendCommand = useCallback((command: string, params?: any) => {
        if (!isIdentified) {
            addLog("Cannot send command: not identified", 'error')
            return
        }

        if (socketRef.current?.readyState === WebSocket.OPEN) {
            const msg = JSON.stringify({
                command,
                params,
                deviceId,
                timestamp: Date.now(),
                expectAck: true
            })

            socketRef.current.send(msg)
            addLog(`Sent command to ${deviceId}: ${command}`, 'client')

            if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current)
            commandTimeoutRef.current = setTimeout(() => {
                if (espConnected) {
                    addLog(`Command ${command} not acknowledged by ESP`, 'error')
                    setEspConnected(false)
                }
            }, 5000)
        } else {
            addLog("WebSocket not ready!", 'error')
        }
    }, [addLog, deviceId, isIdentified, espConnected])

    const emergencyStop = useCallback(() => {
        sendCommand("set_speed", { motor: 'A', speed: 0 })
        sendCommand("set_speed", { motor: 'B', speed: 0 })
        setMotorASpeed(0)
        setMotorBSpeed(0)
        setMotorADirection('stop')
        setMotorBDirection('stop')

        if (motorAThrottleRef.current) clearTimeout(motorAThrottleRef.current)
        if (motorBThrottleRef.current) clearTimeout(motorBThrottleRef.current)
    }, [sendCommand])

    useEffect(() => {
        return () => {
            cleanupWebSocket()
            if (motorAThrottleRef.current) clearTimeout(motorAThrottleRef.current)
            if (motorBThrottleRef.current) clearTimeout(motorBThrottleRef.current)
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
        }
    }, [cleanupWebSocket])

    useEffect(() => {
        const interval = setInterval(() => {
            if (isConnected && isIdentified) sendCommand("heartbeat2")
        }, 1000)
        return () => clearInterval(interval)
    }, [isConnected, isIdentified, sendCommand])

    return (
        <div className="flex flex-col items-center min-h-screen p-4 bg-transparent">
            <div className="w-full max-w-md space-y-4 bg-transparent rounded-lg p-6 border border-gray-200 backdrop-blur-sm">
                {/* Header and Status */}
                <div className="flex flex-col items-center space-y-2">
                    <h1 className="text-2xl font-bold text-gray-800">ESP8266 Control Panel</h1>
                    <div className="flex items-center space-x-2">
                        <div className={`w-4 h-4 rounded-full ${
                            isConnected
                                ? (isIdentified
                                    ? (espConnected ? 'bg-green-500' : 'bg-yellow-500')
                                    : 'bg-yellow-500')
                                : 'bg-red-500'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-600">
                            {isConnected
                                ? (isIdentified
                                    ? (espConnected ? 'Connected' : 'Waiting for ESP')
                                    : 'Connecting...')
                                : 'Disconnected'}
                        </span>
                    </div>
                </div>

                {/* Device Selection */}
                <div className="space-y-2">
                    <Label className="block text-sm font-medium text-gray-700">Device ID</Label>
                    <div className="flex space-x-2">
                        <Select
                            value={inputDeviceId}
                            onValueChange={handleDeviceChange}
                            disabled={isConnected && !autoReconnect}
                        >
                            <SelectTrigger className="flex-1 bg-transparent">
                                <SelectValue placeholder="Select device"/>
                            </SelectTrigger>
                            <SelectContent className="bg-transparent backdrop-blur-sm border border-gray-200">
                                {deviceList.map(id => (
                                    <SelectItem key={id} value={id} className="hover:bg-gray-100/50">{id}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* New Device Input */}
                <div className="space-y-2">
                    <Label className="block text-sm font-medium text-gray-700">Add New Device</Label>
                    <div className="flex space-x-2">
                        <Input
                            value={newDeviceId}
                            onChange={(e) => setNewDeviceId(e.target.value)}
                            placeholder="Enter new device ID"
                            className="flex-1 bg-transparent"
                        />
                        <Button
                            onClick={saveNewDeviceId}
                            disabled={!newDeviceId}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Add
                        </Button>
                    </div>
                </div>

                {/* Connection Controls */}
                <div className="flex space-x-2">
                    <Button
                        onClick={() => connectWebSocket(currentDeviceIdRef.current)}
                        disabled={isConnected}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                        Connect
                    </Button>
                    <Button
                        onClick={disconnectWebSocket}
                        disabled={!isConnected || autoConnect}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                        Disconnect
                    </Button>
                </div>

                {/* Options */}
                <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="auto-reconnect"
                            checked={autoReconnect}
                            onCheckedChange={toggleAutoReconnect}
                            className="border-gray-300 bg-transparent"
                        />
                        <Label htmlFor="auto-reconnect" className="text-sm font-medium text-gray-700">
                            Auto reconnect when changing device
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="auto-connect"
                            checked={autoConnect}
                            onCheckedChange={handleAutoConnectChange}
                            className="border-gray-300 bg-transparent"
                        />
                        <Label htmlFor="auto-connect" className="text-sm font-medium text-gray-700">
                            Auto connect on page load
                        </Label>
                    </div>
                </div>

                {/* Controls Button */}
                <Button
                    onClick={() => setControlVisible(!controlVisible)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                    {controlVisible ? "Hide Motor Controls" : "Show Motor Controls"}
                </Button>

                {/* Logs Toggle */}
                <Button
                    onClick={() => setLogVisible(!logVisible)}
                    variant="outline"
                    className="w-full border-gray-300 bg-transparent hover:bg-gray-100/50"
                >
                    {logVisible ? (
                        <ChevronUp className="h-4 w-4 mr-2"/>
                    ) : (
                        <ChevronDown className="h-4 w-4 mr-2"/>
                    )}
                    {logVisible ? "Hide Logs" : "Show Logs"}
                </Button>

                {/* Logs Display */}
                {logVisible && (
                    <div className="border border-gray-200 rounded-md overflow-hidden bg-transparent backdrop-blur-sm">
                        <div className="h-48 overflow-y-auto p-2 bg-transparent text-xs font-mono">
                            {log.length === 0 ? (
                                <div className="text-gray-500 italic">No logs yet</div>
                            ) : (
                                log.slice().reverse().map((entry, index) => (
                                    <div
                                        key={index}
                                        className={`truncate py-1 ${
                                            entry.type === 'client' ? 'text-blue-600' :
                                                entry.type === 'esp' ? 'text-green-600' :
                                                    entry.type === 'server' ? 'text-purple-600' :
                                                        'text-red-600 font-semibold'
                                        }`}
                                    >
                                        {entry.message}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Motor Controls Dialog */}
            <Dialog open={controlVisible} onOpenChange={setControlVisible}>
                <DialogContent className="sm:max-w-[425px] max-h-[80vh] flex flex-col bg-transparent backdrop-blur-sm border border-gray-200">
                    <DialogHeader>
                        <DialogTitle className="text-center">Motor Controls</DialogTitle>
                        <DialogDescription className="text-center">
                            Use the joysticks to control each motor
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 grid grid-cols-2 gap-4 py-4">
                        <div className="flex flex-col items-center">
                            <h3 className="font-medium mb-2">Motor A</h3>
                            <div className="w-full h-40">
                                <Joystick
                                    motor="A"
                                    onChange={(value) => {
                                        // Обновляем состояние
                                        useMotorControl.getState().setMotorA(value);

                                        // Отправляем команду на сервер
                                        const speed = Math.abs(value);
                                        const direction = value > 0 ? 'forward' : 'backward';

                                        if (value === 0) {
                                            // Остановка мотора
                                            sendCommand("set_speed", { motor: 'A', speed: 0 });
                                        } else {
                                            // Установка скорости и направления
                                            sendCommand("set_speed", { motor: 'A', speed });
                                            sendCommand(`motor_a_${direction}`);
                                        }
                                    }}

                                />
                            </div>

                        </div>

                        <div className="flex flex-col items-center">
                            <h3 className="font-medium mb-2">Motor B</h3>
                            <div className="w-full h-40">
                                <Joystick
                                    motor="B"
                                    onChange={(value) => {
                                        // Обновляем состояние
                                        useMotorControl.getState().setMotorB(value);

                                        // Отправляем команду на сервер
                                        const speed = Math.abs(value);
                                        const direction = value > 0 ? 'forward' : 'backward';

                                        if (value === 0) {
                                            // Остановка мотора
                                            sendCommand("set_speed", { motor: 'B', speed: 0 });
                                        } else {
                                            // Установка скорости и направления
                                            sendCommand("set_speed", { motor: 'B', speed });
                                            sendCommand(`motor_b_${direction}`);
                                        }
                                    }}

                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center pt-2">
                        <Button
                            onClick={emergencyStop}
                            disabled={!isConnected || !isIdentified}
                            variant="destructive"
                            className="w-32"
                        >
                            Emergency Stop
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// file: docker-ardua/components/control/Joystick.tsx
"use client"
import { useCallback, useRef, useEffect } from 'react'

type JoystickProps = {
motor: 'A' | 'B'
onChange: (value: number) => void
direction: 'forward' | 'backward' | 'stop'
speed: number
}

const Joystick = ({ motor, onChange, direction, speed }: JoystickProps) => {
const containerRef = useRef<HTMLDivElement>(null)
const isDragging = useRef(false)
const touchId = useRef<number | null>(null)

    // Стили для разных моторов
    const motorStyles = {
        A: { bg: 'rgba(255, 87, 34, 0.2)', border: '2px solid #ff5722' },
        B: { bg: 'rgba(76, 175, 80, 0.2)', border: '2px solid #4caf50' }
    }

    // Обновление значения джойстика
    const updateValue = useCallback((clientY: number) => {
        const container = containerRef.current
        if (!container) return

        const rect = container.getBoundingClientRect()
        const y = clientY - rect.top
        const height = rect.height
        let value = ((height - y) / height) * 510 - 255
        value = Math.max(-255, Math.min(255, value))

        // Изменение цвета фона в зависимости от положения
        const intensity = Math.abs(value) / 255 * 0.3 + 0.2
        container.style.backgroundColor = `rgba(${
            motor === 'A' ? '255, 87, 34' : '76, 175, 80'
        }, ${intensity})`

        onChange(value)
    }, [motor, onChange])

    // Обработчики событий
    const handleStart = useCallback((clientY: number) => {
        isDragging.current = true
        const container = containerRef.current
        if (container) {
            container.style.transition = 'none'
        }
        updateValue(clientY)
    }, [updateValue])

    const handleMove = useCallback((clientY: number) => {
        if (isDragging.current) {
            updateValue(clientY)
        }
    }, [updateValue])

    const handleEnd = useCallback(() => {
        if (!isDragging.current) return
        isDragging.current = false
        touchId.current = null

        const container = containerRef.current
        if (container) {
            container.style.transition = 'background-color 0.3s'
            container.style.backgroundColor = motorStyles[motor].bg
        }

        onChange(0)
    }, [motor, motorStyles, onChange])

    // Подписка на события мыши и тач-устройств
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const onTouchStart = (e: TouchEvent) => {
            if (touchId.current === null) {
                const touch = e.changedTouches[0]
                touchId.current = touch.identifier
                handleStart(touch.clientY)
            }
        }

        const onTouchMove = (e: TouchEvent) => {
            if (touchId.current !== null) {
                const touch = Array.from(e.changedTouches).find(
                    t => t.identifier === touchId.current
                )
                if (touch) {
                    handleMove(touch.clientY)
                }
            }
        }

        const onTouchEnd = (e: TouchEvent) => {
            if (touchId.current !== null) {
                const touch = Array.from(e.changedTouches).find(
                    t => t.identifier === touchId.current
                )
                if (touch) {
                    handleEnd()
                }
            }
        }

        const onMouseDown = (e: MouseEvent) => {
            e.preventDefault()
            handleStart(e.clientY)
        }

        const onMouseMove = (e: MouseEvent) => {
            e.preventDefault()
            handleMove(e.clientY)
        }

        const onMouseUp = () => {
            handleEnd()
        }

        // Добавление слушателей событий
        container.addEventListener('touchstart', onTouchStart, { passive: false })
        container.addEventListener('touchmove', onTouchMove, { passive: false })
        container.addEventListener('touchend', onTouchEnd, { passive: false })
        container.addEventListener('touchcancel', onTouchEnd, { passive: false })

        container.addEventListener('mousedown', onMouseDown)
        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
        container.addEventListener('mouseleave', handleEnd)

        // Глобальные обработчики для случаев, когда события не доходят до элемента
        const handleGlobalMouseUp = () => {
            if (isDragging.current) {
                handleEnd()
            }
        }

        const handleGlobalTouchEnd = (e: TouchEvent) => {
            if (isDragging.current && touchId.current !== null) {
                const touch = Array.from(e.changedTouches).find(
                    t => t.identifier === touchId.current
                )
                if (touch) {
                    handleEnd()
                }
            }
        }

        document.addEventListener('mouseup', handleGlobalMouseUp)
        document.addEventListener('touchend', handleGlobalTouchEnd)

        // Очистка слушателей при размонтировании
        return () => {
            container.removeEventListener('touchstart', onTouchStart)
            container.removeEventListener('touchmove', onTouchMove)
            container.removeEventListener('touchend', onTouchEnd)
            container.removeEventListener('touchcancel', onTouchEnd)

            container.removeEventListener('mousedown', onMouseDown)
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)
            container.removeEventListener('mouseleave', handleEnd)

            document.removeEventListener('mouseup', handleGlobalMouseUp)
            document.removeEventListener('touchend', handleGlobalTouchEnd)
        }
    }, [handleEnd, handleMove, handleStart])

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: '150px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                touchAction: 'none',
                userSelect: 'none',
                ...motorStyles[motor]
            }}
        >
            <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '0',
                right: '0',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#333',
                zIndex: '1'
            }}>
            </div>
        </div>
    )
}

export default Joystick

// file: docker-ardua/components/webrtc/VideoCallApp.tsx
// file: docker-ardua/components/webrtc/VideoCallApp.tsx
'use client'
import { useMotorControl } from '@/stores/motorControlStore'

import { useWebRTC } from './hooks/useWebRTC'
import styles from './styles.module.css'
import { VideoPlayer } from './components/VideoPlayer'
import { DeviceSelector } from './components/DeviceSelector'
import {useEffect, useState, useRef, useCallback} from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ChevronDown, ChevronUp } from "lucide-react"
import SocketClient from '../control/SocketClient'
import Joystick from "@/components/control/Joystick";

type VideoSettings = {
rotation: number
flipH: boolean
flipV: boolean
}

export const VideoCallApp = () => {
const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
const [selectedDevices, setSelectedDevices] = useState({
video: '',
audio: ''
})
const [videoTransform, setVideoTransform] = useState('')
const [roomId, setRoomId] = useState('room1')
const [username, setUsername] = useState('user_' + Math.floor(Math.random() * 1000))
const [hasPermission, setHasPermission] = useState(false)
const [devicesLoaded, setDevicesLoaded] = useState(false)
const [isJoining, setIsJoining] = useState(false)
const [autoJoin, setAutoJoin] = useState(false)
const [activeTab, setActiveTab] = useState<'webrtc' | 'esp' | 'controls' | null>('esp')
const [logVisible, setLogVisible] = useState(false)
const [videoSettings, setVideoSettings] = useState<VideoSettings>({
rotation: 0,
flipH: false,
flipV: false
})
const videoContainerRef = useRef<HTMLDivElement>(null)
const [isFullscreen, setIsFullscreen] = useState(false)
const remoteVideoRef = useRef<HTMLVideoElement>(null)
const [socketStatus, setSocketStatus] = useState({
isConnected: false,
isIdentified: false,
espConnected: false
})
const [showCompactControls, setShowCompactControls] = useState(false)
const [showMotorControls, setShowMotorControls] = useState(false)

    const {
        localStream,
        remoteStream,
        users,
        joinRoom,
        leaveRoom,
        isCallActive,
        isConnected,
        isInRoom,
        error
    } = useWebRTC(selectedDevices, username, roomId)

    const handleSocketStatusChange = useCallback((status: {
        isConnected: boolean
        isIdentified: boolean
        espConnected: boolean
    }) => {
        setSocketStatus(prev => {
            if (
                prev.isConnected !== status.isConnected ||
                prev.isIdentified !== status.isIdentified ||
                prev.espConnected !== status.espConnected
            ) {
                // Сворачиваем панель управления ESP при успешном подключении
                if (status.espConnected) {
                    setActiveTab(null)
                    setShowCompactControls(true)
                } else {
                    setShowCompactControls(false)
                }
                return status;
            }
            return prev;
        });
    }, []);

    const loadSettings = () => {
        try {
            const saved = localStorage.getItem('videoSettings')
            if (saved) {
                const parsed = JSON.parse(saved) as VideoSettings
                setVideoSettings(parsed)
                applyVideoTransform(parsed)
            }
        } catch (e) {
            console.error('Failed to load video settings', e)
        }
    }

    const saveSettings = (settings: VideoSettings) => {
        localStorage.setItem('videoSettings', JSON.stringify(settings))
    }

    const applyVideoTransform = (settings: VideoSettings) => {
        const { rotation, flipH, flipV } = settings
        let transform = ''
        if (rotation !== 0) transform += `rotate(${rotation}deg) `
        transform += `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`
        setVideoTransform(transform)

        if (remoteVideoRef.current) {
            remoteVideoRef.current.style.transform = transform
            remoteVideoRef.current.style.transformOrigin = 'center center'
            remoteVideoRef.current.style.width = '100%'
            remoteVideoRef.current.style.height = '100%'
            remoteVideoRef.current.style.objectFit = 'contain'
        }
    }

    const loadDevices = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            })

            stream.getTracks().forEach(track => track.stop())

            const devices = await navigator.mediaDevices.enumerateDevices()
            setDevices(devices)
            setHasPermission(true)
            setDevicesLoaded(true)

            const savedVideoDevice = localStorage.getItem('videoDevice')
            const savedAudioDevice = localStorage.getItem('audioDevice')

            const videoDevice = devices.find(d =>
                d.kind === 'videoinput' &&
                (savedVideoDevice ? d.deviceId === savedVideoDevice : true)
            )
            const audioDevice = devices.find(d =>
                d.kind === 'audioinput' &&
                (savedAudioDevice ? d.deviceId === savedAudioDevice : true)
            )

            setSelectedDevices({
                video: videoDevice?.deviceId || '',
                audio: audioDevice?.deviceId || ''
            })
        } catch (error) {
            console.error('Device access error:', error)
            setHasPermission(false)
            setDevicesLoaded(true)
        }
    }

    useEffect(() => {
        const savedAutoJoin = localStorage.getItem('autoJoin') === 'true'
        setAutoJoin(savedAutoJoin)
        loadSettings()
        loadDevices()

        const handleFullscreenChange = () => {
            const isNowFullscreen = !!document.fullscreenElement
            setIsFullscreen(isNowFullscreen)

            if (remoteVideoRef.current) {
                setTimeout(() => {
                    applyVideoTransform(videoSettings)
                }, 50)
            }
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange)
        }
    }, [])

    useEffect(() => {
        if (autoJoin && hasPermission && devicesLoaded && selectedDevices.video && selectedDevices.audio) {
            joinRoom(username)
        }
    }, [autoJoin, hasPermission, devicesLoaded, selectedDevices])

    useEffect(() => {
        if (selectedDevices.video) localStorage.setItem('videoDevice', selectedDevices.video)
        if (selectedDevices.audio) localStorage.setItem('audioDevice', selectedDevices.audio)
    }, [selectedDevices])

    const updateVideoSettings = (newSettings: Partial<VideoSettings>) => {
        const updated = { ...videoSettings, ...newSettings }
        setVideoSettings(updated)
        applyVideoTransform(updated)
        saveSettings(updated)
    }

    const handleDeviceChange = (type: 'video' | 'audio', deviceId: string) => {
        setSelectedDevices(prev => ({
            ...prev,
            [type]: deviceId
        }))
    }

    const handleJoinRoom = async () => {
        setIsJoining(true)
        try {
            await joinRoom(username)
        } catch (error) {
            console.error('Error joining room:', error)
        } finally {
            setIsJoining(false)
        }
    }

    const toggleFullscreen = async () => {
        if (!videoContainerRef.current) return

        try {
            if (!document.fullscreenElement) {
                await videoContainerRef.current.requestFullscreen()
                setTimeout(() => {
                    applyVideoTransform(videoSettings)
                }, 50)
            } else {
                await document.exitFullscreen()
            }
        } catch (err) {
            console.error('Fullscreen error:', err)
        }
    }

    const rotateVideo = (degrees: number) => {
        updateVideoSettings({ rotation: degrees })
    }

    const flipVideoHorizontal = () => {
        updateVideoSettings({ flipH: !videoSettings.flipH })
    }

    const flipVideoVertical = () => {
        updateVideoSettings({ flipV: !videoSettings.flipV })
    }

    const resetVideo = () => {
        updateVideoSettings({ rotation: 0, flipH: false, flipV: false })
    }

    const toggleTab = (tab: 'webrtc' | 'esp' | 'controls') => {
        setActiveTab(activeTab === tab ? null : tab)
    }

    const toggleMotorControls = () => {
        setShowMotorControls(!showMotorControls)
    }



    return (
        <div className={styles.container}>
            {/* Основное видео (удаленный участник) */}
            <div
                ref={videoContainerRef}
                className={styles.remoteVideoContainer}
            >
                <VideoPlayer
                    ref={remoteVideoRef}
                    stream={remoteStream}
                    className={styles.remoteVideo}
                    transform={videoTransform}
                />
                <div className={styles.remoteVideoLabel}>Удаленный участник</div>
            </div>

            {/* Локальное видео (маленькое в углу) */}
            <div className={styles.localVideoContainer}>
                <VideoPlayer
                    stream={localStream}
                    muted
                    className={styles.localVideo}
                />
                <div className={styles.localVideoLabel}>Вы ({username})</div>
            </div>

            {/* Панель управления сверху */}
            <div className={styles.topControls}>
                <div className={styles.tabsContainer}>
                    <button
                        onClick={() => toggleTab('webrtc')}
                        className={`${styles.tabButton} ${activeTab === 'webrtc' ? styles.activeTab : ''}`}
                    >
                        {activeTab === 'webrtc' ? '▲' : '▼'} Управление
                    </button>

                    <button
                        onClick={() => toggleTab('esp')}
                        className={`${styles.tabButton} ${activeTab === 'esp' ? styles.activeTab : ''}`}
                    >
                        {activeTab === 'esp' ? '▲' : '▼'} ESP8266 Control
                    </button>

                    <button
                        onClick={() => toggleTab('controls')}
                        className={`${styles.tabButton} ${activeTab === 'controls' ? styles.activeTab : ''}`}
                    >
                        {activeTab === 'controls' ? '▲' : '▼'} Video
                    </button>

                    {/* Компактные элементы управления моторами */}
                    {showCompactControls && (
                        <button
                            onClick={toggleMotorControls}
                            className={styles.tabButton}
                            style={{
                                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                                border: '1px solid #4caf50',
                                marginLeft: '10px'
                            }}
                        >
                            {showMotorControls ? 'Hide Motor Controls' : 'Show Motor Controls'}
                        </button>
                    )}

                    {/* Статус подключения ESP */}
                    <div className={styles.statusIndicator}>
                        <div className={`${styles.statusDot} ${
                            socketStatus.isConnected
                                ? (socketStatus.isIdentified
                                    ? (socketStatus.espConnected ? styles.connected : styles.pending)
                                    : styles.pending)
                                : styles.disconnected
                        }`}></div>
                        <span className={styles.statusText}>
                            {socketStatus.isConnected
                                ? (socketStatus.isIdentified
                                    ? (socketStatus.espConnected ? 'ESP Connected' : 'Waiting for ESP')
                                    : 'Connecting...')
                                : 'Disconnected'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Контент вкладок */}
            {activeTab === 'webrtc' && (
                <div className={styles.tabContent}>
                    {error && <div className={styles.error}>{error}</div>}
                    <div className={styles.controls}>
                        <div className={styles.connectionStatus}>
                            Статус: {isConnected ? (isInRoom ? `В комнате ${roomId}` : 'Подключено') : 'Отключено'}
                            {isCallActive && ' (Звонок активен)'}
                        </div>

                        <div className={styles.inputGroup}>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="autoJoin"
                                    checked={autoJoin}
                                    onCheckedChange={(checked) => {
                                        setAutoJoin(!!checked)
                                        localStorage.setItem('autoJoin', checked ? 'true' : 'false')
                                    }}
                                />
                                <Label htmlFor="autoJoin">
                                    Автоматическое подключение
                                </Label>
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <Input
                                id="room"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                disabled={isInRoom}
                                placeholder="ID комнаты"
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <Input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={isInRoom}
                                placeholder="Ваше имя"
                            />
                        </div>

                        {!isInRoom ? (
                            <Button
                                onClick={handleJoinRoom}
                                disabled={!hasPermission || isJoining || (autoJoin && isInRoom)}
                                className={styles.button}
                            >
                                {isJoining ? 'Подключение...' : 'Войти в комнату'}
                            </Button>
                        ) : (
                            <Button
                                onClick={leaveRoom}
                                className={styles.button}
                            >
                                Покинуть комнату
                            </Button>
                        )}

                        <div className={styles.userList}>
                            <h3>Участники ({users.length}):</h3>
                            <ul>
                                {users.map((user, index) => (
                                    <li key={index}>{user}</li>
                                ))}
                            </ul>
                        </div>

                        <div className={styles.deviceSelection}>
                            <h3>Выбор устройств:</h3>
                            {devicesLoaded ? (
                                <DeviceSelector
                                    devices={devices}
                                    selectedDevices={selectedDevices}
                                    onChange={handleDeviceChange}
                                    onRefresh={loadDevices}
                                />
                            ) : (
                                <div>Загрузка устройств...</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'esp' && (
                <div className={styles.tabContent}>
                    <SocketClient
                        compactMode
                        onStatusChange={handleSocketStatusChange}
                    />
                </div>
            )}

            {activeTab === 'controls' && (
                <div className={styles.tabContent}>
                    <div className={styles.videoControlsTab}>
                        <div className={styles.controlButtons}>
                            <button
                                onClick={() => rotateVideo(0)}
                                className={`${styles.controlButton} ${videoSettings.rotation === 0 ? styles.active : ''}`}
                                title="Обычная ориентация"
                            >
                                ↻0°
                            </button>
                            <button
                                onClick={() => rotateVideo(90)}
                                className={`${styles.controlButton} ${videoSettings.rotation === 90 ? styles.active : ''}`}
                                title="Повернуть на 90°"
                            >
                                ↻90°
                            </button>
                            <button
                                onClick={() => rotateVideo(180)}
                                className={`${styles.controlButton} ${videoSettings.rotation === 180 ? styles.active : ''}`}
                                title="Повернуть на 180°"
                            >
                                ↻180°
                            </button>
                            <button
                                onClick={() => rotateVideo(270)}
                                className={`${styles.controlButton} ${videoSettings.rotation === 270 ? styles.active : ''}`}
                                title="Повернуть на 270°"
                            >
                                ↻270°
                            </button>
                            <button
                                onClick={flipVideoHorizontal}
                                className={`${styles.controlButton} ${videoSettings.flipH ? styles.active : ''}`}
                                title="Отразить по горизонтали"
                            >
                                ⇄
                            </button>
                            <button
                                onClick={flipVideoVertical}
                                className={`${styles.controlButton} ${videoSettings.flipV ? styles.active : ''}`}
                                title="Отразить по вертикали"
                            >
                                ⇅
                            </button>
                            <button
                                onClick={resetVideo}
                                className={styles.controlButton}
                                title="Сбросить настройки"
                            >
                                ⟲
                            </button>
                            <button
                                onClick={toggleFullscreen}
                                className={styles.controlButton}
                                title={isFullscreen ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим'}
                            >
                                {isFullscreen ? '✕' : '⛶'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Motor Controls Overlay */}
            // In VideoCallApp.tsx, update the motor controls section
            // В компоненте VideoCallApp
            {showMotorControls && useMotorControl.getState().isReady && (
                <div className={styles.motorControlsOverlay}>
                    <div className={styles.joystickContainer}>
                        <div className={styles.motorControl}>
                            <h3>Motor A</h3>
                            <Joystick
                                motor="A"
                                onChange={(value) => useMotorControl.getState().setMotorA(value)}
                                direction={useMotorControl.getState().motorA.direction}
                                speed={useMotorControl.getState().motorA.speed}
                            />
                            <div className={styles.motorStatus}>
                                {useMotorControl.getState().motorA.direction === 'stop'
                                    ? 'Stopped'
                                    : `${useMotorControl.getState().motorA.direction} at ${useMotorControl.getState().motorA.speed}%`}
                            </div>
                        </div>

                        <div className={styles.motorControl}>
                            <h3>Motor B</h3>
                            <Joystick
                                motor="B"
                                onChange={(value) => useMotorControl.getState().setMotorB(value)}
                                direction={useMotorControl.getState().motorB.direction}
                                speed={useMotorControl.getState().motorB.speed}
                            />
                            <div className={styles.motorStatus}>
                                {useMotorControl.getState().motorB.direction === 'stop'
                                    ? 'Stopped'
                                    : `${useMotorControl.getState().motorB.direction} at ${useMotorControl.getState().motorB.speed}%`}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => useMotorControl.getState().emergencyStop()}
                        className={styles.emergencyButton}
                    >
                        Emergency Stop
                    </button>
                </div>
            )}

            {logVisible && (
                <div className={styles.logsPanel}>
                    <div className={styles.logsContent}>
                        {[...Array(50)].map((_, i) => (
                            <div key={i} className={styles.logEntry}>
                                Sample log entry {i + 1}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// file: docker-ardua/stores/motorControlStore.ts
import { create } from 'zustand'

type MotorState = {
speed: number
direction: 'forward' | 'backward' | 'stop'
}

type MotorControlStore = {
motorA: MotorState
motorB: MotorState
isReady: boolean
registerSocket: (socket: WebSocket | null) => () => void
setMotorA: (value: number) => void
setMotorB: (value: number) => void
emergencyStop: () => void
initialize: () => void
_sendCommand: (command: string, params?: any) => void
}

export const useMotorControl = create<MotorControlStore>((set, get) => {
let currentSocket: WebSocket | null = null

    return {
        motorA: { speed: 0, direction: 'stop' },
        motorB: { speed: 0, direction: 'stop' },
        isReady: false,

        registerSocket: (socket) => {
            currentSocket = socket
            return () => {
                currentSocket = null
            }
        },

        _sendCommand: (command, params) => {
            if (currentSocket?.readyState === WebSocket.OPEN) {
                const message = JSON.stringify({
                    command,
                    params,
                    timestamp: Date.now()
                })
                currentSocket.send(message)
                console.log('Command sent:', command, params)
            } else {
                console.warn('WebSocket not ready, command not sent:', command)
            }
        },

        setMotorA: (value) => {
            const speed = Math.abs(value)
            const direction = value > 0 ? 'forward' : value < 0 ? 'backward' : 'stop'

            set({
                motorA: { speed, direction }
            })

            const { _sendCommand } = get()
            if (value === 0) {
                _sendCommand("set_speed", { motor: 'A', speed: 0 })
            } else {
                _sendCommand("set_speed", { motor: 'A', speed })
                _sendCommand(`motor_a_${direction}`)
            }
        },

        setMotorB: (value) => {
            const speed = Math.abs(value)
            const direction = value > 0 ? 'forward' : value < 0 ? 'backward' : 'stop'

            set({
                motorB: { speed, direction }
            })

            const { _sendCommand } = get()
            if (value === 0) {
                _sendCommand("set_speed", { motor: 'B', speed: 0 })
            } else {
                _sendCommand("set_speed", { motor: 'B', speed })
                _sendCommand(`motor_b_${direction}`)
            }
        },

        emergencyStop: () => {
            const { _sendCommand } = get()
            _sendCommand("set_speed", { motor: 'A', speed: 0 })
            _sendCommand("set_speed", { motor: 'B', speed: 0 })
            set({
                motorA: { speed: 0, direction: 'stop' },
                motorB: { speed: 0, direction: 'stop' }
            })
        },

        initialize: () => set({ isReady: true })
    }
})

нужно чтобы этот блок
                        <h3>Motor A</h3>
                        <Joystick
                        motor="A"
                        onChange={(value) => useMotorControl.getState().setMotorA(value)}
                        direction={useMotorControl.getState().motorA.direction}
                        speed={useMotorControl.getState().motorA.speed}
                        />
                        <div className={styles.motorStatus}>
                        {useMotorControl.getState().motorA.direction === 'stop'
                        ? 'Stopped'
                        : `${useMotorControl.getState().motorA.direction} at ${useMotorControl.getState().motorA.speed}%`}
                        </div>
                        </div>

                        <div className={styles.motorControl}>
                            <h3>Motor B</h3>
                            <Joystick
                                motor="B"
                                onChange={(value) => useMotorControl.getState().setMotorB(value)}
                                direction={useMotorControl.getState().motorB.direction}
                                speed={useMotorControl.getState().motorB.speed}
                            />
                            <div className={styles.motorStatus}>
                                {useMotorControl.getState().motorB.direction === 'stop'
                                    ? 'Stopped'
                                    : `${useMotorControl.getState().motorB.direction} at ${useMotorControl.getState().motorB.speed}%`}
                            </div>
                        </div>
отправлял на сервер данные через useMotorControl

комментарии на русском