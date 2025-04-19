\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\control\Joystick.tsx
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\control\SocketClient.tsx
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\control\styles.module.css

// file: docker-ardua/components/control/Joystick.tsx
// file: docker-ardua/components/control/Joystick.tsx
"use client"
import { useCallback, useRef, useEffect } from 'react'

type JoystickProps = {
motor: 'A' | 'B'
onChange: (value: number) => void
direction: 'forward' | 'backward' | 'stop'
speed: number
}

/**
* Компонент джойстика для управления моторами
  */
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

       // Изменение цвета в зависимости от положения
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

  // Подписка на события
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

       // Добавление обработчиков
       container.addEventListener('touchstart', onTouchStart, { passive: false })
       container.addEventListener('touchmove', onTouchMove, { passive: false })
       container.addEventListener('touchend', onTouchEnd, { passive: false })
       container.addEventListener('touchcancel', onTouchEnd, { passive: false })

       container.addEventListener('mousedown', onMouseDown)
       document.addEventListener('mousemove', onMouseMove)
       document.addEventListener('mouseup', onMouseUp)
       container.addEventListener('mouseleave', handleEnd)

       // Глобальные обработчики для случаев, когда события завершения происходят вне элемента
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

       // Очистка
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

export default function SocketClient() {
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

    const [activeTab, setActiveTab] = useState<'webrtc' | 'esp' | 'controls' | null>('esp') // По умолчанию открыта вкладка ESP
когда в этой вкладке пользователь нажимает на Show Motor Controls и появляется - Use the joysticks to control each motor , вкладка 'esp'
должна закрыться и Use the joysticks to control each motor должна остаться на прозрачном не затемненном фоне.

дай полный код, комментарии на русском


background-color: rgba(0, 0, 0, 0.85);
backdrop-filter: blur(10px);


локальное видео нужно сделать чтобы можно было его скрывать
кнопку скрыть или открыть локальное видео помести в раздел Video
так же состояние нужно сохранять в localStorage
комментарии на русском, да полный код