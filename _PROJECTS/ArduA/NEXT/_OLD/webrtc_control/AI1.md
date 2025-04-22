\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\stores\socketConnectStores.ts
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\control\SocketClient.tsx
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc\VideoCallApp.tsx



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
const motorStyles = {
A: { bg: 'rgba(255, 87, 34, 0.2)', border: '2px solid #ff5722' },
B: { bg: 'rgba(76, 175, 80, 0.2)', border: '2px solid #4caf50' }
}

    const updateValue = useCallback((clientY: number) => {
        const container = containerRef.current
        if (!container) return

        const rect = container.getBoundingClientRect()
        const y = clientY - rect.top
        const height = rect.height
        let value = ((height - y) / height) * 510 - 255
        value = Math.max(-255, Math.min(255, value))

        const intensity = Math.abs(value) / 255 * 0.3 + 0.2
        container.style.backgroundColor = `rgba(${
            motor === 'A' ? '255, 87, 34' : '76, 175, 80'
        }, ${intensity})`

        onChange(value)
    }, [motor, onChange])

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

        container.addEventListener('touchstart', onTouchStart, { passive: false })
        container.addEventListener('touchmove', onTouchMove, { passive: false })
        container.addEventListener('touchend', onTouchEnd, { passive: false })
        container.addEventListener('touchcancel', onTouchEnd, { passive: false })

        container.addEventListener('mousedown', onMouseDown)
        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
        container.addEventListener('mouseleave', handleEnd)

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
const [motorASpeed, setMotorASpeed] = useState(0)
const [motorBSpeed, setMotorBSpeed] = useState(0)
const [motorADirection, setMotorADirection] = useState<'forward' | 'backward' | 'stop'>('stop')
const [motorBDirection, setMotorBDirection] = useState<'forward' | 'backward' | 'stop'>('stop')
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

        ws.onopen = () => {
            setIsConnected(true)
            reconnectAttemptRef.current = 0
            addLog("Connected to WebSocket server", 'server')

            ws.send(JSON.stringify({
                type: 'client_type',
                clientType: 'browser'
            }))

            ws.send(JSON.stringify({
                type: 'identify',
                deviceId: deviceIdToConnect
            }))
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

        ws.onclose = (event) => {
            setIsConnected(false)
            setIsIdentified(false)
            setEspConnected(false)
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

    const createMotorHandler = useCallback((motor: 'A' | 'B') => {
        const lastCommandRef = motor === 'A' ? lastMotorACommandRef : lastMotorBCommandRef
        const throttleRef = motor === 'A' ? motorAThrottleRef : motorBThrottleRef
        const setSpeed = motor === 'A' ? setMotorASpeed : setMotorBSpeed
        const setDirection = motor === 'A' ? setMotorADirection : setMotorBDirection

        return (value: number) => {
            let direction: 'forward' | 'backward' | 'stop' = 'stop'
            let speed = 0

            if (value > 0) {
                direction = 'forward'
                speed = value
            } else if (value < 0) {
                direction = 'backward'
                speed = -value
            }

            setSpeed(speed)
            setDirection(direction)

            const currentCommand = { speed, direction }
            if (JSON.stringify(lastCommandRef.current) === JSON.stringify(currentCommand)) {
                return
            }

            lastCommandRef.current = currentCommand

            if (throttleRef.current) {
                clearTimeout(throttleRef.current)
            }

            if (speed === 0) {
                sendCommand("set_speed", { motor, speed: 0 })
                return
            }

            throttleRef.current = setTimeout(() => {
                sendCommand("set_speed", { motor, speed })
                sendCommand(direction === 'forward'
                    ? `motor_${motor.toLowerCase()}_forward`
                    : `motor_${motor.toLowerCase()}_backward`)
            }, 40)
        }
    }, [sendCommand])

    const handleMotorAControl = createMotorHandler('A')
    const handleMotorBControl = createMotorHandler('B')

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
                                    onChange={handleMotorAControl}
                                    direction={motorADirection}
                                    speed={motorASpeed}
                                />
                            </div>
                            <div className="mt-2 text-sm">
                                {motorADirection === 'stop' ? 'Stopped' :
                                    `${motorADirection} at ${motorASpeed}%`}
                            </div>
                        </div>

                        <div className="flex flex-col items-center">
                            <h3 className="font-medium mb-2">Motor B</h3>
                            <div className="w-full h-40">
                                <Joystick
                                    motor="B"
                                    onChange={handleMotorBControl}
                                    direction={motorBDirection}
                                    speed={motorBSpeed}
                                />
                            </div>
                            <div className="mt-2 text-sm">
                                {motorBDirection === 'stop' ? 'Stopped' :
                                    `${motorBDirection} at ${motorBSpeed}%`}
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

// file: docker-ardua/components/control/styles.module.css
/* file: docker-ardua/components/control/styles.module.css */
.container {
position: fixed;
top: 20px;
left: 20px;
z-index: 1000;
background: transparent;
}

.sheetTrigger {
padding: 8px 16px;
background: transparent;
}

.sheetContent {
width: 350px;
display: flex;
flex-direction: column;
padding: 20px;
background: transparent;
}

.controlsContainer {
display: flex;
flex-direction: column;
gap: 16px;
margin-top: 20px;
flex: 1;
background: transparent;
}

.statusIndicator {
display: flex;
align-items: center;
gap: 8px;
margin-bottom: 10px;
background: transparent;
}

.statusDot {
width: 12px;
height: 12px;
border-radius: 50%;
}

.connected {
background-color: #10B981;
}

.pending {
background-color: #F59E0B;
}

.disconnected {
background-color: #EF4444;
}

.deviceControl {
display: flex;
flex-direction: column;
gap: 8px;
background: transparent;
}

.selectTrigger {
width: 100%;
background: transparent;
}

.newDevice {
display: flex;
gap: 8px;
background: transparent;
}

.newDeviceInput {
flex: 1;
background: transparent;
}

.addButton {
min-width: 60px;
background: transparent;
}

.connectionButtons {
display: flex;
gap: 8px;
background: transparent;
}

.connectButton {
flex: 1;
background-color: #10B981;
}

.connectButton:hover {
background-color: #059669;
}

.disconnectButton {
flex: 1;
background: transparent;
}

.checkboxGroup {
display: flex;
flex-direction: column;
gap: 8px;
background: transparent;
}

.checkboxItem {
display: flex;
align-items: center;
gap: 8px;
background: transparent;
}

.checkbox {
width: 16px;
height: 16px;
background: transparent;
}

.showControlsButton {
width: 100%;
margin-top: 10px;
background: transparent;
}

.logsButton {
width: 100%;
justify-content: center;
margin-top: 10px;
background: transparent;
}

.logContainer {
border: 1px solid rgba(229, 231, 235, 0.5);
border-radius: 6px;
overflow: hidden;
margin-top: 10px;
background: transparent;
backdrop-filter: blur(10px);
}

.logContent {
height: 150px;
overflow-y: auto;
padding: 8px;
background: rgba(249, 250, 251, 0.5);
line-height: 1.5;
}

.logEntry {
padding: 4px 0;
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
background: transparent;
}

.clientLog {
color: #3b82f6;
}

.espLog {
color: #10b981;
}

.serverLog {
color: #8b5cf6;
}

.errorLog {
color: #ef4444;
font-weight: bold;
}

.closeButton {
margin-top: 20px;
width: 100%;
background: transparent;
}

.joystickDialog {
width: 90vw;
max-width: 500px;
height: 70vh;
padding: 0;
background: transparent;
}

.joystickContainer {
display: flex;
width: 100%;
height: calc(100% - 120px);
justify-content: space-between;
gap: 20px;
padding: 20px;
background: transparent;
}

.joystickWrapper {
width: calc(50% - 10px);
height: 70%;
background: transparent;
}

.emergencyStop {
display: flex;
justify-content: center;
padding: 10px;
background: transparent;
}

.estopButton {
width: 120px;
height: 40px;
font-weight: bold;
}

@keyframes pulse {
0%, 100% {
opacity: 1;
}
50% {
opacity: 0.5;
}
}

.connecting {
animation: pulse 1.5s infinite;
}

.statusBadge {
display: inline-flex;
align-items: center;
padding: 0.25rem 0.5rem;
border-radius: 9999px;
font-size: 0.75rem;
font-weight: 500;
background: transparent;
}

.statusBadgeConnected {
background-color: rgba(220, 252, 231, 0.5);
color: #166534;
}

.statusBadgeDisconnected {
background-color: rgba(254, 226, 226, 0.5);
color: #991b1b;
}

.statusBadgePending {
background-color: rgba(254, 249, 195, 0.5);
color: #854d0e;
}

.joystickBase {
position: relative;
width: 100%;
height: 100%;
border-radius: 50%;
background: rgba(243, 244, 246, 0.5);
touch-action: none;
}

.joystickHandle {
position: absolute;
width: 40px;
height: 40px;
border-radius: 50%;
background-color: #4f46e5;
transform: translate(-50%, -50%);
cursor: move;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.motorLabel {
position: absolute;
top: -1.5rem;
left: 50%;
transform: translateX(-50%);
font-weight: 600;
color: #374151;
background: transparent;
}

.speedIndicator {
position: absolute;
bottom: -1.5rem;
left: 50%;
transform: translateX(-50%);
font-size: 0.75rem;
color: #6b7280;
background: transparent;
}

.logEntryLine {
padding: 0.25rem 0;
border-bottom: 1px solid rgba(229, 231, 235, 0.5);
background: transparent;
}

.logEntryLine:last-child {
border-bottom: none;
}

// file: docker-ardua/components/webrtc/lib/webrtc.ts
//app\webrtc\lib\webrtc.ts
export function checkWebRTCSupport(): boolean {
if (typeof window === 'undefined') return false;

    const requiredAPIs = [
        'RTCPeerConnection',
        'RTCSessionDescription',
        'RTCIceCandidate',
        'MediaStream',
        'navigator.mediaDevices.getUserMedia'
    ];

    return requiredAPIs.every(api => {
        try {
            if (api.includes('.')) {
                const [obj, prop] = api.split('.');
                return (window as any)[obj]?.[prop] !== undefined;
            }
            return (window as any)[api] !== undefined;
        } catch {
            return false;
        }
    });
}







// file: docker-ardua/components/webrtc/lib/signaling.ts
// file: client/app/webrtc/lib/signaling.ts
import { RoomInfo, SignalingMessage, SignalingClientOptions } from '../types';

export class SignalingClient {
private ws: WebSocket | null = null;
private reconnectAttempts = 0;
private connectionTimeout: NodeJS.Timeout | null = null;
private connectionPromise: Promise<void> | null = null;
private resolveConnection: (() => void) | null = null;

    public onRoomInfo: (data: RoomInfo) => void = () => {};
    public onOffer: (data: RTCSessionDescriptionInit) => void = () => {};
    public onAnswer: (data: RTCSessionDescriptionInit) => void = () => {};
    public onCandidate: (data: RTCIceCandidateInit) => void = () => {};
    public onError: (error: string) => void = () => {};
    public onLeave: (username?: string) => void = () => {};
    public onJoin: (username: string) => void = () => {};

    constructor(
        private url: string,
        private options: SignalingClientOptions = {}
    ) {
        this.options = {
            maxReconnectAttempts: 5,
            reconnectDelay: 1000,
            connectionTimeout: 5000,
            ...options
        };
    }

    public get isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    public connect(roomId: string, username: string): Promise<void> {
        if (this.ws) {
            this.ws.close();
        }

        this.ws = new WebSocket(this.url);
        this.setupEventListeners();

        this.connectionPromise = new Promise((resolve, reject) => {
            this.resolveConnection = resolve;

            this.connectionTimeout = setTimeout(() => {
                if (!this.isConnected) {
                    this.handleError('Connection timeout');
                    reject(new Error('Connection timeout'));
                }
            }, this.options.connectionTimeout);

            this.ws!.onopen = () => {
                this.ws!.send(JSON.stringify({
                    type: 'join',
                    room: roomId,
                    username: username
                }));
            };
        });

        return this.connectionPromise;
    }

    private setupEventListeners(): void {
        if (!this.ws) return;

        this.ws.onmessage = (event) => {
            try {
                const message: SignalingMessage = JSON.parse(event.data);

                if (!('type' in message)) {
                    console.warn('Received message without type:', message);
                    return;
                }

                switch (message.type) {
                    case 'room_info':
                        this.onRoomInfo(message.data);
                        break;
                    case 'error':
                        this.onError(message.data);
                        break;
                    case 'offer':
                        this.onOffer(message.sdp);
                        break;
                    case 'answer':
                        this.onAnswer(message.sdp);
                        break;
                    case 'candidate':
                        this.onCandidate(message.candidate);
                        break;
                    case 'leave':
                        this.onLeave(message.data);
                        break;
                    case 'join':
                        this.onJoin(message.data);
                        break;
                    default:
                        console.warn('Unknown message type:', message);
                }
            } catch (error) {
                this.handleError('Invalid message format');
            }
        };

        this.ws.onclose = () => {
            console.log('Signaling connection closed');
            this.cleanup();
            this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
            this.handleError(`Connection error: ${error}`);
        };
    }

    public sendOffer(offer: RTCSessionDescriptionInit): Promise<void> {
        return this.send({ type: 'offer', sdp: offer });
    }

    public sendAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
        return this.send({ type: 'answer', sdp: answer });
    }

    public sendCandidate(candidate: RTCIceCandidateInit): Promise<void> {
        return this.send({ type: 'candidate', candidate });
    }

    public sendLeave(username: string): Promise<void> {
        return this.send({ type: 'leave', data: username });
    }

    private send(data: SignalingMessage): Promise<void> {
        if (!this.isConnected) {
            return Promise.reject(new Error('WebSocket not connected'));
        }

        try {
            this.ws!.send(JSON.stringify(data));
            return Promise.resolve();
        } catch (error) {
            console.error('Send error:', error);
            return Promise.reject(error);
        }
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= (this.options.maxReconnectAttempts || 5)) {
            return this.handleError('Max reconnection attempts reached');
        }

        this.reconnectAttempts++;
        console.log(`Reconnecting (attempt ${this.reconnectAttempts})`);

        setTimeout(() => this.connect('', ''), this.options.reconnectDelay);
    }

    private handleError(error: string): void {
        console.error('Signaling error:', error);
        this.onError(error);
        this.cleanup();
    }

    private cleanup(): void {
        this.clearTimeout(this.connectionTimeout);
        if (this.resolveConnection) {
            this.resolveConnection();
            this.resolveConnection = null;
        }
        this.connectionPromise = null;
    }

    private clearTimeout(timer: NodeJS.Timeout | null): void {
        if (timer) clearTimeout(timer);
    }

    public close(): void {
        this.cleanup();
        this.ws?.close();
    }
}

// file: docker-ardua/components/webrtc/hooks/useWebRTC.ts
import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
type: string;
data?: any;
sdp?: {
type: RTCSdpType;
sdp: string;
};
ice?: RTCIceCandidateInit;
room?: string;
username?: string;
}

export const useWebRTC = (
deviceIds: { video: string; audio: string },
username: string,
roomId: string
) => {
const [localStream, setLocalStream] = useState<MediaStream | null>(null);
const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
const [users, setUsers] = useState<string[]>([]);
const [isCallActive, setIsCallActive] = useState(false);
const [isConnected, setIsConnected] = useState(false);
const [isInRoom, setIsInRoom] = useState(false);
const [error, setError] = useState<string | null>(null);
const [retryCount, setRetryCount] = useState(0);

    const ws = useRef<WebSocket | null>(null);
    const pc = useRef<RTCPeerConnection | null>(null);
    const pendingIceCandidates = useRef<RTCIceCandidate[]>([]);
    const isNegotiating = useRef(false);
    const shouldCreateOffer = useRef(false);
    const connectionTimeout = useRef<NodeJS.Timeout | null>(null);
    const statsInterval = useRef<NodeJS.Timeout | null>(null);

    // Максимальное количество попыток переподключения
    const MAX_RETRIES = 3;

    const normalizeSdp = (sdp: string | undefined): string => {
        if (!sdp) return '';

        let normalized = sdp.trim();
        if (!normalized.startsWith('v=')) {
            normalized = 'v=0\r\n' + normalized;
        }
        if (!normalized.includes('\r\no=')) {
            normalized = normalized.replace('\r\n', '\r\no=- 0 0 IN IP4 0.0.0.0\r\n');
        }
        if (!normalized.includes('\r\ns=')) {
            normalized = normalized.replace('\r\n', '\r\ns=-\r\n');
        }
        if (!normalized.includes('\r\nt=')) {
            normalized = normalized.replace('\r\n', '\r\nt=0 0\r\n');
        }

        return normalized + '\r\n';
    };

    const cleanup = () => {
        // Очистка таймеров
        if (connectionTimeout.current) {
            clearTimeout(connectionTimeout.current);
            connectionTimeout.current = null;
        }

        if (statsInterval.current) {
            clearInterval(statsInterval.current);
            statsInterval.current = null;
        }

        // Очистка WebRTC соединения
        if (pc.current) {
            pc.current.onicecandidate = null;
            pc.current.ontrack = null;
            pc.current.onnegotiationneeded = null;
            pc.current.oniceconnectionstatechange = null;
            pc.current.close();
            pc.current = null;
        }

        // Остановка медиапотоков
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }

        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
            setRemoteStream(null);
        }

        setIsCallActive(false);
        pendingIceCandidates.current = [];
        isNegotiating.current = false;
        shouldCreateOffer.current = false;
    };

    const leaveRoom = () => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'leave',
                room: roomId,
                username
            }));
        }
        cleanup();
        setUsers([]);
        setIsInRoom(false);
        ws.current?.close();
        ws.current = null;
        setRetryCount(0);
    };

    const connectWebSocket = async (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (ws.current?.readyState === WebSocket.OPEN) {
                resolve(true);
                return;
            }

            try {
                ws.current = new WebSocket('wss://anybet.site/ws');

                const onOpen = () => {
                    cleanupEvents();
                    setIsConnected(true);
                    setError(null);
                    console.log('WebSocket подключен');
                    resolve(true);
                };

                const onError = (event: Event) => {
                    cleanupEvents();
                    console.error('Ошибка WebSocket:', event);
                    setError('Ошибка подключения');
                    setIsConnected(false);
                    resolve(false);
                };

                const onClose = (event: CloseEvent) => {
                    cleanupEvents();
                    console.log('WebSocket отключен:', event.code, event.reason);
                    setIsConnected(false);
                    setIsInRoom(false);
                    setError(event.code !== 1000 ? `Соединение закрыто: ${event.reason || 'код ' + event.code}` : null);
                    resolve(false);
                };

                const cleanupEvents = () => {
                    ws.current?.removeEventListener('open', onOpen);
                    ws.current?.removeEventListener('error', onError);
                    ws.current?.removeEventListener('close', onClose);
                    if (connectionTimeout.current) {
                        clearTimeout(connectionTimeout.current);
                    }
                };

                connectionTimeout.current = setTimeout(() => {
                    cleanupEvents();
                    setError('Таймаут подключения WebSocket');
                    resolve(false);
                }, 5000);

                ws.current.addEventListener('open', onOpen);
                ws.current.addEventListener('error', onError);
                ws.current.addEventListener('close', onClose);

            } catch (err) {
                console.error('Ошибка создания WebSocket:', err);
                setError('Не удалось создать WebSocket соединение');
                resolve(false);
            }
        });
    };

    const setupWebSocketListeners = () => {
        if (!ws.current) return;

        const handleMessage = async (event: MessageEvent) => {
            try {
                const data: WebSocketMessage = JSON.parse(event.data);
                console.log('Получено сообщение:', data);

                if (data.type === 'room_info') {
                    setUsers(data.data.users || []);
                }
                else if (data.type === 'error') {
                    setError(data.data);
                }
                else if (data.type === 'offer') {
                    if (pc.current && ws.current?.readyState === WebSocket.OPEN && data.sdp) {
                        try {
                            if (isNegotiating.current) {
                                console.log('Уже в процессе переговоров, игнорируем оффер');
                                return;
                            }

                            isNegotiating.current = true;
                            await pc.current.setRemoteDescription(
                                new RTCSessionDescription(data.sdp)
                            );

                            const answer = await pc.current.createAnswer({
                                offerToReceiveAudio: true,
                                offerToReceiveVideo: true
                            });

                            const normalizedAnswer = {
                                ...answer,
                                sdp: normalizeSdp(answer.sdp)
                            };

                            await pc.current.setLocalDescription(normalizedAnswer);

                            ws.current.send(JSON.stringify({
                                type: 'answer',
                                sdp: normalizedAnswer,
                                room: roomId,
                                username
                            }));

                            setIsCallActive(true);
                            isNegotiating.current = false;
                        } catch (err) {
                            console.error('Ошибка обработки оффера:', err);
                            setError('Ошибка обработки предложения соединения');
                            isNegotiating.current = false;
                        }
                    }
                }
                else if (data.type === 'answer') {
                    if (pc.current && data.sdp) {
                        try {
                            if (pc.current.signalingState !== 'have-local-offer') {
                                console.log('Не в состоянии have-local-offer, игнорируем ответ');
                                return;
                            }

                            const answerDescription: RTCSessionDescriptionInit = {
                                type: 'answer',
                                sdp: normalizeSdp(data.sdp.sdp)
                            };

                            console.log('Устанавливаем удаленное описание с ответом');
                            await pc.current.setRemoteDescription(
                                new RTCSessionDescription(answerDescription)
                            );

                            setIsCallActive(true);

                            // Обрабатываем ожидающие кандидаты
                            while (pendingIceCandidates.current.length > 0) {
                                const candidate = pendingIceCandidates.current.shift();
                                if (candidate) {
                                    try {
                                        await pc.current.addIceCandidate(candidate);
                                    } catch (err) {
                                        console.error('Ошибка добавления отложенного ICE кандидата:', err);
                                    }
                                }
                            }
                        } catch (err) {
                            console.error('Ошибка установки ответа:', err);
                            setError(`Ошибка установки ответа: ${err instanceof Error ? err.message : String(err)}`);
                        }
                    }
                }
                else if (data.type === 'ice_candidate') {
                    if (data.ice) {
                        try {
                            const candidate = new RTCIceCandidate(data.ice);

                            if (pc.current && pc.current.remoteDescription) {
                                await pc.current.addIceCandidate(candidate);
                            } else {
                                pendingIceCandidates.current.push(candidate);
                            }
                        } catch (err) {
                            console.error('Ошибка добавления ICE-кандидата:', err);
                            setError('Ошибка добавления ICE-кандидата');
                        }
                    }
                }
            } catch (err) {
                console.error('Ошибка обработки сообщения:', err);
                setError('Ошибка обработки сообщения сервера');
            }
        };

        ws.current.onmessage = handleMessage;
    };

    const createAndSendOffer = async () => {
        if (!pc.current || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
            return;
        }

        try {
            const offer = await pc.current.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });

            const standardizedOffer = {
                ...offer,
                sdp: normalizeSdp(offer.sdp)
            };

            console.log('Устанавливаем локальное описание с оффером');
            await pc.current.setLocalDescription(standardizedOffer);

            ws.current.send(JSON.stringify({
                type: "offer",
                sdp: standardizedOffer,
                room: roomId,
                username
            }));

            setIsCallActive(true);
        } catch (err) {
            console.error('Ошибка создания оффера:', err);
            setError('Ошибка создания предложения соединения');
        }
    };

    const initializeWebRTC = async () => {
        try {
            cleanup();

            const config: RTCConfiguration = {
                iceServers: [
                    {
                        urls: [
                            'stun:stun.l.google.com:19302',
                            'stun:stun1.l.google.com:19302',
                            'stun:stun2.l.google.com:19302',
                            'stun:stun3.l.google.com:19302',
                            'stun:stun4.l.google.com:19302'
                        ]
                    }
                ],
                iceTransportPolicy: 'all',
                bundlePolicy: 'max-bundle',
                rtcpMuxPolicy: 'require'
            };

            pc.current = new RTCPeerConnection(config);

            // Обработчики событий WebRTC
            pc.current.onnegotiationneeded = () => {
                console.log('Требуется переговорный процесс');
            };

            pc.current.onsignalingstatechange = () => {
                console.log('Состояние сигнализации изменилось:', pc.current?.signalingState);
            };

            pc.current.onicegatheringstatechange = () => {
                console.log('Состояние сбора ICE изменилось:', pc.current?.iceGatheringState);
            };

            pc.current.onicecandidateerror = (event) => {
                const ignorableErrors = [701, 702, 703]; // Игнорируем стандартные ошибки STUN
                if (!ignorableErrors.includes(event.errorCode)) {
                    console.error('Критическая ошибка ICE кандидата:', event);
                    setError(`Ошибка ICE соединения: ${event.errorText}`);
                }
            };

            // Получаем медиапоток с устройства
            const stream = await navigator.mediaDevices.getUserMedia({
                video: deviceIds.video ? {
                    deviceId: { exact: deviceIds.video },
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 }
                } : {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 }
                },
                audio: deviceIds.audio ? {
                    deviceId: { exact: deviceIds.audio },
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } : true
            });

            // Проверяем наличие видеотрека
            const videoTracks = stream.getVideoTracks();
            if (videoTracks.length === 0) {
                throw new Error('Не удалось получить видеопоток с устройства');
            }

            setLocalStream(stream);
            stream.getTracks().forEach(track => {
                pc.current?.addTrack(track, stream);
            });

            // Обработка ICE кандидатов
            pc.current.onicecandidate = (event) => {
                if (event.candidate && ws.current?.readyState === WebSocket.OPEN) {
                    try {
                        // Фильтруем нежелательные кандидаты
                        if (event.candidate.candidate &&
                            event.candidate.candidate.length > 0 &&
                            !event.candidate.candidate.includes('0.0.0.0')) {

                            ws.current.send(JSON.stringify({
                                type: 'ice_candidate',
                                ice: {
                                    candidate: event.candidate.candidate,
                                    sdpMid: event.candidate.sdpMid || '0',
                                    sdpMLineIndex: event.candidate.sdpMLineIndex || 0
                                },
                                room: roomId,
                                username
                            }));
                        }
                    } catch (err) {
                        console.error('Ошибка отправки ICE кандидата:', err);
                    }
                }
            };

            // Обработка входящих медиапотоков
            pc.current.ontrack = (event) => {
                if (event.streams && event.streams[0]) {
                    // Проверяем, что видеопоток содержит данные
                    const videoTrack = event.streams[0].getVideoTracks()[0];
                    if (videoTrack) {
                        const videoElement = document.createElement('video');
                        videoElement.srcObject = new MediaStream([videoTrack]);
                        videoElement.onloadedmetadata = () => {
                            if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
                                setRemoteStream(event.streams[0]);
                                setIsCallActive(true);
                            } else {
                                console.warn('Получен пустой видеопоток');
                            }
                        };
                    } else {
                        console.warn('Входящий поток не содержит видео');
                    }
                }
            };

            // Обработка состояния ICE соединения
            pc.current.oniceconnectionstatechange = () => {
                if (!pc.current) return;

                console.log('Состояние ICE соединения:', pc.current.iceConnectionState);

                switch (pc.current.iceConnectionState) {
                    case 'failed':
                        console.log('Перезапуск ICE...');
                        setTimeout(() => {
                            if (pc.current && pc.current.iceConnectionState === 'failed') {
                                pc.current.restartIce();
                                if (isInRoom && !isCallActive) {
                                    createAndSendOffer().catch(console.error);
                                }
                            }
                        }, 1000);
                        break;

                    case 'disconnected':
                        console.log('Соединение прервано...');
                        setIsCallActive(false);
                        setTimeout(() => {
                            if (pc.current && pc.current.iceConnectionState === 'disconnected') {
                                createAndSendOffer().catch(console.error);
                            }
                        }, 2000);
                        break;

                    case 'connected':
                        console.log('Соединение установлено!');
                        setIsCallActive(true);
                        break;

                    case 'closed':
                        console.log('Соединение закрыто');
                        setIsCallActive(false);
                        break;
                }
            };

            // Запускаем мониторинг статистики соединения
            startConnectionMonitoring();

            return true;
        } catch (err) {
            console.error('Ошибка инициализации WebRTC:', err);
            setError(`Не удалось инициализировать WebRTC: ${err instanceof Error ? err.message : String(err)}`);
            cleanup();
            return false;
        }
    };

    const startConnectionMonitoring = () => {
        if (statsInterval.current) {
            clearInterval(statsInterval.current);
        }

        statsInterval.current = setInterval(async () => {
            if (!pc.current || !isCallActive) return;

            try {
                const stats = await pc.current.getStats();
                let hasActiveVideo = false;

                stats.forEach(report => {
                    if (report.type === 'inbound-rtp' && report.kind === 'video') {
                        if (report.bytesReceived > 0) {
                            hasActiveVideo = true;
                        }
                    }
                });

                if (!hasActiveVideo && isCallActive) {
                    console.warn('Нет активного видеопотока, пытаемся восстановить...');
                    resetConnection();
                }
            } catch (err) {
                console.error('Ошибка получения статистики:', err);
            }
        }, 5000);
    };

    const resetConnection = async () => {
        if (retryCount >= MAX_RETRIES) {
            setError('Не удалось восстановить соединение после нескольких попыток');
            leaveRoom();
            return;
        }

        setRetryCount(prev => prev + 1);
        console.log(`Попытка восстановления #${retryCount + 1}`);

        try {
            await leaveRoom();
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            await joinRoom(username);
        } catch (err) {
            console.error('Ошибка при восстановлении соединения:', err);
        }
    };

    const restartMediaDevices = async () => {
        try {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: deviceIds.video ? {
                    deviceId: { exact: deviceIds.video },
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 }
                } : {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 }
                },
                audio: deviceIds.audio ? {
                    deviceId: { exact: deviceIds.audio },
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } : true
            });

            setLocalStream(stream);

            if (pc.current) {
                const senders = pc.current.getSenders();
                stream.getTracks().forEach(track => {
                    const sender = senders.find(s => s.track?.kind === track.kind);
                    if (sender) {
                        sender.replaceTrack(track);
                    } else {
                        pc.current?.addTrack(track, stream);
                    }
                });
            }

            return true;
        } catch (err) {
            console.error('Ошибка перезагрузки медиаустройств:', err);
            setError('Ошибка доступа к медиаустройствам');
            return false;
        }
    };

    const joinRoom = async (uniqueUsername: string) => {
        setError(null);
        setIsInRoom(false);
        setIsConnected(false);

        try {
            // 1. Подключаем WebSocket
            if (!(await connectWebSocket())) {
                throw new Error('Не удалось подключиться к WebSocket');
            }

            setupWebSocketListeners();

            // 2. Инициализируем WebRTC
            if (!(await initializeWebRTC())) {
                throw new Error('Не удалось инициализировать WebRTC');
            }

            // 3. Отправляем запрос на присоединение к комнате
            await new Promise<void>((resolve, reject) => {
                if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
                    reject(new Error('WebSocket не подключен'));
                    return;
                }

                const onMessage = (event: MessageEvent) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === 'room_info') {
                            cleanupEvents();
                            resolve();
                        } else if (data.type === 'error') {
                            cleanupEvents();
                            reject(new Error(data.data || 'Ошибка входа в комнату'));
                        }
                    } catch (err) {
                        cleanupEvents();
                        reject(err);
                    }
                };

                const cleanupEvents = () => {
                    ws.current?.removeEventListener('message', onMessage);
                    if (connectionTimeout.current) {
                        clearTimeout(connectionTimeout.current);
                    }
                };

                // connectionTimeout.current = setTimeout(() => {
                //     cleanupEvents();
                //     reject(new Error('Таймаут ожидания ответа от сервера'));
                // }, 10000);

                ws.current.addEventListener('message', onMessage);
                ws.current.send(JSON.stringify({
                    action: "join",
                    room: roomId,
                    username: uniqueUsername
                }));
            });

            // 4. Успешное подключение
            setIsInRoom(true);
            shouldCreateOffer.current = true;

            // 5. Создаем оффер, если мы первые в комнате
            if (users.length === 0) {
                await createAndSendOffer();
            }

        } catch (err) {
            console.error('Ошибка входа в комнату:', err);
            setError(`Ошибка входа в комнату: ${err instanceof Error ? err.message : String(err)}`);

            // Полная очистка при ошибке
            cleanup();
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }

            // Автоматическая повторная попытка
            if (retryCount < MAX_RETRIES) {
                setTimeout(() => {
                    joinRoom(uniqueUsername).catch(console.error);
                }, 2000 * (retryCount + 1));
            }
        }
    };

    useEffect(() => {
        return () => {
            leaveRoom();
        };
    }, []);

    return {
        localStream,
        remoteStream,
        users,
        joinRoom,
        leaveRoom,
        isCallActive,
        isConnected,
        isInRoom,
        error,
        retryCount,
        resetConnection,
        restartMediaDevices
    };
};

// file: docker-ardua/components/webrtc/types.ts
// file: client/app/webrtc/types.ts
export interface RoomInfo {
users: string[];
}

export type SignalingMessage =
| { type: 'room_info'; data: RoomInfo }
| { type: 'error'; data: string }
| { type: 'offer'; sdp: RTCSessionDescriptionInit }
| { type: 'answer'; sdp: RTCSessionDescriptionInit }
| { type: 'candidate'; candidate: RTCIceCandidateInit }
| { type: 'join'; data: string }
| { type: 'leave'; data: string };

export interface User {
username: string;
stream?: MediaStream;
peerConnection?: RTCPeerConnection;
}

export interface SignalingClientOptions {
maxReconnectAttempts?: number;
reconnectDelay?: number;
connectionTimeout?: number;
}

// file: docker-ardua/components/webrtc/index.tsx
// file: client/app/webrtc/index.tsx
'use client'

import { VideoCallApp } from './VideoCallApp';
import { useEffect, useState } from 'react';
import { checkWebRTCSupport } from './lib/webrtc';
import styles from './styles.module.css';

export default function WebRTCPage() {
const [isSupported, setIsSupported] = useState<boolean | null>(null);
const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

    useEffect(() => {
        const initialize = async () => {
            setIsSupported(checkWebRTCSupport());

            try {
                const mediaDevices = await navigator.mediaDevices.enumerateDevices();
                setDevices(mediaDevices);
            } catch (err) {
                console.error('Error getting devices:', err);
            }
        };

        initialize();
    }, []);

    if (isSupported === false) {
        return (
            <div className={styles.errorContainer}>
                <h1>WebRTC is not supported in your browser</h1>
                <p>Please use a modern browser like Chrome, Firefox or Edge.</p>
            </div>
        );
    }

    return (
        <div>
            {isSupported === null ? (
                <div>Loading...</div>
            ) : (
                <VideoCallApp />
            )}
        </div>
    );
}

// file: docker-ardua/components/webrtc/components/VideoPlayer.tsx
import { useEffect, useRef, useState } from 'react'

interface VideoPlayerProps {
stream: MediaStream | null;
muted?: boolean;
className?: string;
transform?: string;
}

type VideoSettings = {
rotation: number;
flipH: boolean;
flipV: boolean;
};

export const VideoPlayer = ({ stream, muted = false, className, transform }: VideoPlayerProps) => {
const videoRef = useRef<HTMLVideoElement>(null)
const [computedTransform, setComputedTransform] = useState<string>('')

    useEffect(() => {
        // Применяем трансформации при каждом обновлении transform
        if (typeof transform === 'string') {
            setComputedTransform(transform)
        } else {
            try {
                const saved = localStorage.getItem('videoSettings')
                if (saved) {
                    const { rotation, flipH, flipV } = JSON.parse(saved) as VideoSettings
                    let fallbackTransform = ''
                    if (rotation !== 0) fallbackTransform += `rotate(${rotation}deg) `
                    fallbackTransform += `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`
                    setComputedTransform(fallbackTransform)
                } else {
                    setComputedTransform('')
                }
            } catch (e) {
                console.error('Error parsing saved video settings:', e)
                setComputedTransform('')
            }
        }
    }, [transform])

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const handleCanPlay = () => {
            video.play().catch(e => {
                console.error('Playback failed:', e)
                video.muted = true
                video.play().catch(e => console.error('Muted playback also failed:', e))
            })
        }

        video.addEventListener('canplay', handleCanPlay)

        if (stream) {
            video.srcObject = stream
        } else {
            video.srcObject = null
        }

        return () => {
            video.removeEventListener('canplay', handleCanPlay)
            video.srcObject = null
        }
    }, [stream])

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            className={className}
            style={{ transform: computedTransform, transformOrigin: 'center center' }}
        />
    )
}


// file: docker-ardua/components/webrtc/components/DeviceSelector.tsx
//app\webrtc\components\DeviceSelector.tsx
import { useState, useEffect } from 'react';
import styles from '../styles.module.css';

interface DeviceSelectorProps {
devices?: MediaDeviceInfo[];
selectedDevices: {
video: string;
audio: string;
};
onChange: (type: 'video' | 'audio', deviceId: string) => void;
onRefresh?: () => Promise<void>;
}

export const DeviceSelector = ({
devices,
selectedDevices,
onChange,
onRefresh
}: DeviceSelectorProps) => {
const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        if (devices) {
            updateDeviceLists(devices);
        }
    }, [devices]);

    const updateDeviceLists = (deviceList: MediaDeviceInfo[]) => {
        setVideoDevices(deviceList.filter(d => d.kind === 'videoinput'));
        setAudioDevices(deviceList.filter(d => d.kind === 'audioinput'));
    };

    const handleRefresh = async () => {
        if (!onRefresh) return;

        setIsRefreshing(true);
        try {
            await onRefresh();
        } catch (error) {
            console.error('Error refreshing devices:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className={styles.deviceSelector}>
            <div className={styles.deviceGroup}>
                <label>Камера:</label>
                <select
                    value={selectedDevices.video}
                    onChange={(e) => onChange('video', e.target.value)}
                    disabled={videoDevices.length === 0}
                >
                    {videoDevices.length === 0 ? (
                        <option value="">Камеры не найдены</option>
                    ) : (
                        <>
                            <option value="">-- Выберите камеру --</option>
                            {videoDevices.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Камера ${videoDevices.indexOf(device) + 1}`}
                                </option>
                            ))}
                        </>
                    )}
                </select>
            </div>

            <div className={styles.deviceGroup}>
                <label>Микрофон:</label>
                <select
                    value={selectedDevices.audio}
                    onChange={(e) => onChange('audio', e.target.value)}
                    disabled={audioDevices.length === 0}
                >
                    {audioDevices.length === 0 ? (
                        <option value="">Микрофоны не найдены</option>
                    ) : (
                        <>
                            <option value="">-- Выберите микрофон --</option>
                            {audioDevices.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Микрофон ${audioDevices.indexOf(device) + 1}`}
                                </option>
                            ))}
                        </>
                    )}
                </select>
            </div>

            <button
                onClick={handleRefresh}
                className={styles.refreshButton}
                disabled={isRefreshing}
            >
                {isRefreshing ? 'Обновление...' : 'Обновить устройства'}
            </button>
        </div>
    );
};

// file: docker-ardua/components/webrtc/VideoCallApp.tsx
// file: docker-ardua/components/webrtc/VideoCallApp.tsx
'use client'

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
const [activeTab, setActiveTab] = useState<'webrtc' | 'esp' | 'controls' | null>(null) // По умолчанию открыта вкладка ESP
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

// file: docker-ardua/components/webrtc/styles.module.css
.container {
position: relative;
width: 100vw;
height: 100vh;
overflow: hidden;
background-color: #000;
font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.remoteVideoContainer {
position: absolute;
top: 0;
left: 0;
width: 100%;
height: 100%;
display: flex;
justify-content: center;
align-items: center;
background-color: #000;
transition: transform 0.3s ease;
}

:fullscreen .remoteVideoContainer {
width: 100vw;
height: 100vh;
background-color: #000;
}

.remoteVideo {
width: 100%;
height: 100%;
object-fit: contain;
transition: transform 0.3s ease;
}

.localVideoContainer {
position: absolute;
bottom: 20px;
right: 20px;
width: 20vw;
max-width: 300px;
min-width: 150px;
height: 15vh;
max-height: 200px;
min-height: 100px;
z-index: 10;
border: 2px solid #fff;
border-radius: 8px;
overflow: hidden;
background-color: #000;
box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.localVideo {
width: 100%;
height: 100%;
object-fit: cover;
transform: scaleX(-1);
}

.remoteVideoLabel,
.localVideoLabel {
position: absolute;
left: 0;
right: 0;
bottom: 0;
background-color: rgba(0, 0, 0, 0.7);
color: white;
padding: 8px 12px;
font-size: 14px;
text-align: center;
backdrop-filter: blur(5px);
}

.topControls {
position: absolute;
top: 0;
left: 0;
right: 0;
display: flex;
justify-content: space-between;
padding: 15px;
z-index: 20;
background-color: rgba(0, 0, 0, 0.7);
backdrop-filter: blur(8px);
}

.toggleControlsButton {
background-color: rgba(255, 255, 255, 0.15);
color: white;
border: none;
border-radius: 20px;
padding: 8px 16px;
font-size: 14px;
cursor: pointer;
display: flex;
align-items: center;
gap: 8px;
transition: all 0.2s ease;
}

.toggleControlsButton:hover {
background-color: rgba(255, 255, 255, 0.25);
}

.videoControls {
display: flex;
gap: 8px;
flex-wrap: wrap;
justify-content: flex-end;
}

.controlButton {
background-color: rgba(255, 255, 255, 0.15);
color: white;
border: none;
border-radius: 20px;
min-width: 40px;
height: 40px;
font-size: 14px;
cursor: pointer;
display: flex;
justify-content: center;
align-items: center;
transition: all 0.2s ease;
padding: 0 12px;
}

.controlButton:hover {
background-color: rgba(255, 255, 255, 0.25);
}

.controlButton.active {
background-color: rgba(0, 150, 255, 0.7);
color: white;
}

.controlsOverlay {
position: absolute;
top: 70px;
left: 0;
right: 0;
background-color: rgba(0, 0, 0, 0.85);
color: white;
padding: 25px;
z-index: 15;
max-height: calc(100vh - 100px);
overflow-y: auto;
backdrop-filter: blur(10px);
border-radius: 0 0 12px 12px;
animation: fadeIn 0.3s ease-out;
}

.controls {
display: flex;
flex-direction: column;
gap: 20px;
max-width: 600px;
margin: 0 auto;
}

.inputGroup {
display: flex;
flex-direction: column;
gap: 8px;
}

.button {
width: 100%;
padding: 12px;
font-weight: 500;
transition: all 0.2s ease;
}

.userList {
margin-top: 20px;
background-color: rgba(255, 255, 255, 0.1);
padding: 15px;
border-radius: 8px;
}

.userList h3 {
margin-top: 0;
margin-bottom: 10px;
font-size: 16px;
}

.userList ul {
list-style: none;
padding: 0;
margin: 0;
display: flex;
flex-direction: column;
gap: 8px;
}

.userList li {
padding: 8px 12px;
background-color: rgba(255, 255, 255, 0.1);
border-radius: 6px;
}

.error {
color: #ff6b6b;
background-color: rgba(255, 107, 107, 0.1);
padding: 12px;
border-radius: 6px;
border-left: 4px solid #ff6b6b;
margin-bottom: 20px;
}

.connectionStatus {
padding: 12px;
background-color: rgba(255, 255, 255, 0.1);
border-radius: 6px;
margin-bottom: 15px;
font-weight: 500;
}

.deviceSelection {
margin-top: 20px;
background-color: rgba(255, 255, 255, 0.1);
padding: 15px;
border-radius: 8px;
}

.deviceSelection h3 {
margin-top: 0;
margin-bottom: 15px;
}

@keyframes fadeIn {
from { opacity: 0; transform: translateY(-10px); }
to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
.localVideoContainer {
width: 25vw;
height: 20vh;
}

    .controlsOverlay {
        padding: 15px;
    }

    .controlButton {
        width: 36px;
        height: 36px;
        font-size: 14px;
    }

    .videoControls {
        gap: 6px;
    }
}

/* Новые стили для вкладок */
.tabsContainer {
display: flex;
gap: 8px;
flex-wrap: wrap;
}

.tabButton {
background-color: rgba(255, 255, 255, 0.15);
color: white;
border: none;
border-radius: 20px;
padding: 8px 16px;
font-size: 14px;
cursor: pointer;
display: flex;
align-items: center;
gap: 8px;
transition: all 0.2s ease;
}

.tabButton:hover {
background-color: rgba(255, 255, 255, 0.25);
}

.activeTab {
background-color: rgba(0, 150, 255, 0.7);
}

.tabContent {
position: absolute;
top: 70px;
left: 0;
right: 0;
background-color: rgba(0, 0, 0, 0.85);
color: white;
padding: 25px;
z-index: 15;
max-height: calc(100vh - 100px);
overflow-y: auto;
backdrop-filter: blur(10px);
border-radius: 0 0 12px 12px;
animation: fadeIn 0.3s ease-out;
}

.videoControlsTab {
display: flex;
flex-direction: column;
gap: 20px;
}

.controlButtons {
display: flex;
flex-wrap: wrap;
gap: 8px;
justify-content: center;
}

/* Стили для панели логов */
.logsPanel {
position: fixed;
top: 0;
right: 0;
bottom: 0;
width: 300px;
background-color: rgba(0, 0, 0, 0.9);
z-index: 1000;
padding: 15px;
overflow-y: auto;
backdrop-filter: blur(5px);
user-select: none;
pointer-events: none;
}

.logsContent {
font-family: monospace;
font-size: 12px;
color: #ccc;
line-height: 1.5;
}

.logEntry {
margin-bottom: 4px;
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
}

/* Адаптивные стили */
@media (max-width: 768px) {
.tabsContainer {
gap: 6px;
}

    .tabButton {
        padding: 6px 12px;
        font-size: 12px;
    }

    .tabContent {
        padding: 15px;
    }

    .logsPanel {
        width: 200px;
    }
}


.statusIndicator {
display: flex;
align-items: center;
gap: 8px;
margin-left: 15px;
padding: 6px 12px;
border-radius: 20px;
background-color: rgba(0, 0, 0, 0.5);
backdrop-filter: blur(5px);
}

.statusDot {
width: 10px;
height: 10px;
border-radius: 50%;
}

.statusText {
font-size: 14px;
color: white;
}

.connected {
background-color: #10B981;
}

.pending {
background-color: #F59E0B;
animation: pulse 1.5s infinite;
}

.disconnected {
background-color: #EF4444;
}

@keyframes pulse {
0%, 100% {
opacity: 1;
}
50% {
opacity: 0.5;
}
}

.statusIndicator {
/* существующие стили */
will-change: contents; /* Оптимизация для браузера */
}

.statusDot, .statusText {
transition: all 0.3s ease;
}

// file: docker-ardua/stores/motorControlStore.ts
import { create } from 'zustand'

1. ESP8266 Control Panel - Connect (если стоит галочка "Auto connect on page load") - то при первой загрузке страницы, 
должно происходить подключение к socket (SocketClient) - сделай хук подключения который будет проверять "Auto connect on page load"- данные в localStorage 
 хук дает подключение к сокету как в SocketClient
   ws.onopen = () => {
   setIsConnected(true)
   reconnectAttemptRef.current = 0
   addLog("Connected to WebSocket server", 'server')

            ws.send(JSON.stringify({
                type: 'client_type',
                clientType: 'browser'
            }))

            ws.send(JSON.stringify({
                type: 'identify',
                deviceId: deviceIdToConnect
            }))
        }

статус подключение socket отображаться в ESP Connected в (VideoCallApp) .
я не знаю как это сделать, в помощь если надо import { create } from 'zustand' (stores)
комментарии на русском. дай полный код.



второе задание
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\stores\motorControl.ts
import { create } from 'zustand'

нужно отобразить элементы управления моторами на главной странице - после подключения сокета
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\control\Joystick.tsx

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
const motorStyles = {
A: { bg: 'rgba(255, 87, 34, 0.2)', border: '2px solid #ff5722' },
B: { bg: 'rgba(76, 175, 80, 0.2)', border: '2px solid #4caf50' }
}

    const updateValue = useCallback((clientY: number) => {
        const container = containerRef.current
        if (!container) return

        const rect = container.getBoundingClientRect()
        const y = clientY - rect.top
        const height = rect.height
        let value = ((height - y) / height) * 510 - 255
        value = Math.max(-255, Math.min(255, value))

        const intensity = Math.abs(value) / 255 * 0.3 + 0.2
        container.style.backgroundColor = `rgba(${
            motor === 'A' ? '255, 87, 34' : '76, 175, 80'
        }, ${intensity})`

        onChange(value)
    }, [motor, onChange])

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

        container.addEventListener('touchstart', onTouchStart, { passive: false })
        container.addEventListener('touchmove', onTouchMove, { passive: false })
        container.addEventListener('touchend', onTouchEnd, { passive: false })
        container.addEventListener('touchcancel', onTouchEnd, { passive: false })

        container.addEventListener('mousedown', onMouseDown)
        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
        container.addEventListener('mouseleave', handleEnd)

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

дай полный код.




нужно сделать отдельные стили для мобильных браузеров, элементы нужно сделать меньше, высоту и ширину подогнать под разрешение экрана браузера по 90% высоты или 90% ширины, что первое становится меньше. Сделать динамическую панель.
логику отображения элементов не меняй, не удаляй комментарии, дай полный код