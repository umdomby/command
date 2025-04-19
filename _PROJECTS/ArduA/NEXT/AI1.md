\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\control
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\control\hooks
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\control\Joystick.tsx
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\control\SocketClient.tsx
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\control\styles.module.css
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\dataStores
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\dataStores\statusConnected_ESP8266.tsx
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\form
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\lib
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\modals
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\ui
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\webrtc
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\app\(root)
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\hooks
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\stores

// file: docker-ardua/components/control/hooks/useAutoConnectSocket.ts
// file: docker-ardua/components/control/hooks/useAutoConnectSocket.ts
import { useEffect } from 'react'
import { useMotorControlStore } from '@/stores/motorControlStore'

/**
* Хук для автоматического подключения к WebSocket
* Проверяет настройку autoConnect в localStorage и при необходимости подключается
  */
  export const useAutoConnectSocket = () => {
  const { initialize, autoConnect, deviceId, connectWebSocket } = useMotorControlStore()

  // Инициализация при монтировании компонента
  useEffect(() => {
  initialize()
  }, [initialize])

  // Автоподключение при изменении autoConnect или deviceId
  useEffect(() => {
  if (autoConnect && deviceId) {
  connectWebSocket(deviceId)
  }
  }, [autoConnect, deviceId, connectWebSocket])
  }

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
// components/control/SocketClient.tsx
"use client"
import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useMotorControlStore } from '@/stores/motorControlStore'
import {StatusConnected_ESP8266, useESP8266StatusStore} from '@/components/dataStores/statusConnected_ESP8266'
import Joystick from "@/components/control/Joystick";

export default function SocketClient() {
const [log, setLog] = useState<{message: string, type: 'client' | 'esp' | 'server' | 'error'}[]>([])
const [inputDeviceId, setInputDeviceId] = useState('')
const [newDeviceId, setNewDeviceId] = useState('')
const [deviceList, setDeviceList] = useState<string[]>([])
const [controlVisible, setControlVisible] = useState(false)
const [logVisible, setLogVisible] = useState(false)
const [autoReconnect, setAutoReconnect] = useState(false)

    const {
        isConnected,
        isIdentified,
        espConnected,
        deviceId,
        autoConnect,
        setLeftMotorSpeed,
        setRightMotorSpeed,
        setConnectionStatus,
        setDeviceId,
        setAutoConnect,
        connectWebSocket,
        disconnectWebSocket
    } = useMotorControlStore()

    const {
        setIsConnected,
        setIsIdentified,
        setEspConnected
    } = useESP8266StatusStore()

    const currentDeviceIdRef = useRef(deviceId)

    useEffect(() => {
        currentDeviceIdRef.current = deviceId
    }, [deviceId])

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
    }, [setDeviceId])

    const saveNewDeviceId = useCallback(() => {
        if (newDeviceId && !deviceList.includes(newDeviceId)) {
            const updatedList = [...deviceList, newDeviceId]
            setDeviceList(updatedList)
            localStorage.setItem('espDeviceList', JSON.stringify(updatedList))
            setInputDeviceId(newDeviceId)
            setNewDeviceId('')
            setDeviceId(newDeviceId)
            currentDeviceIdRef.current = newDeviceId
        }
    }, [newDeviceId, deviceList, setDeviceId])

    const addLog = useCallback((msg: string, type: 'client' | 'esp' | 'server' | 'error') => {
        setLog(prev => [...prev.slice(-100), {message: `${new Date().toLocaleTimeString()}: ${msg}`, type}])
    }, [])

    const handleAutoConnectChange = useCallback((checked: boolean) => {
        setAutoConnect(checked)
        addLog(`Auto connect ${checked ? 'enabled' : 'disabled'}`, 'client')
    }, [setAutoConnect, addLog])

    const handleConnect = useCallback(() => {
        connectWebSocket(currentDeviceIdRef.current)
        addLog(`Connecting to device: ${currentDeviceIdRef.current}`, 'client')

        // Обновляем статус в глобальном хранилище
        setIsConnected(true)
        setDeviceId(currentDeviceIdRef.current)

        // Имитация процесса подключения
        setTimeout(() => {
            setIsIdentified(true)
            setConnectionStatus(true, true, false)
            addLog(`Identified with device: ${currentDeviceIdRef.current}`, 'server')

            setTimeout(() => {
                setEspConnected(true)
                setConnectionStatus(true, true, true)
                addLog(`ESP8266 connected`, 'esp')
            }, 1000)
        }, 500)
    }, [connectWebSocket, addLog, setIsConnected, setIsIdentified, setEspConnected, setDeviceId, setConnectionStatus])

    const handleDisconnect = useCallback(() => {
        disconnectWebSocket()
        addLog('Disconnected manually', 'server')

        // Обновляем статус в глобальном хранилище
        setIsConnected(false)
        setIsIdentified(false)
        setEspConnected(false)
    }, [disconnectWebSocket, addLog, setIsConnected, setIsIdentified, setEspConnected])

    const handleDeviceChange = useCallback(async (value: string) => {
        setInputDeviceId(value)
        setDeviceId(value)
        currentDeviceIdRef.current = value
        addLog(`Selected device: ${value}`, 'client')

        if (autoReconnect && isConnected) {
            await handleDisconnect()
            handleConnect()
        }
    }, [setDeviceId, autoReconnect, isConnected, handleDisconnect, handleConnect, addLog])

    const toggleAutoReconnect = useCallback((checked: boolean) => {
        setAutoReconnect(checked)
        localStorage.setItem('autoReconnect', checked.toString())
        addLog(`Auto reconnect ${checked ? 'enabled' : 'disabled'}`, 'client')
    }, [addLog])

    const createMotorHandler = useCallback((motor: 'left' | 'right') => {
        return (value: number) => {
            if (motor === 'left') {
                setLeftMotorSpeed(value)
            } else {
                setRightMotorSpeed(value)
            }
            addLog(`Motor ${motor} set to ${value}`, 'client')
        }
    }, [setLeftMotorSpeed, setRightMotorSpeed, addLog])

    const handleMotorAControl = createMotorHandler('left')
    const handleMotorBControl = createMotorHandler('right')

    return (
        <div className="flex flex-col items-center min-h-screen p-4 bg-transparent">
            <div className="w-full max-w-md space-y-4 bg-transparent rounded-lg p-6 border border-gray-200 backdrop-blur-sm">
                {/* Header and Status */}
                <div className="flex flex-col items-center space-y-2">
                    <h1 className="text-2xl font-bold text-gray-800">ESP8266 Control Panel</h1>
                    <StatusConnected_ESP8266 />
                </div>

                {/* Device Selection */}
                <div className="space-y-2">
                    <Label className="block text-sm font-medium text-gray-700">Device ID</Label>
                    <div className="flex space-x-2">
                        <select
                            value={inputDeviceId}
                            onChange={(e) => handleDeviceChange(e.target.value)}
                            disabled={isConnected && !autoReconnect}
                            className="flex-1 bg-transparent border rounded-md px-3 py-2 text-sm"
                        >
                            {deviceList.map(id => (
                                <option key={id} value={id}>{id}</option>
                            ))}
                        </select>
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
                        onClick={handleConnect}
                        disabled={isConnected}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                        Connect
                    </Button>
                    <Button
                        onClick={handleDisconnect}
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

            {/* Motor Controls */}
            {controlVisible && (
                <div className="mt-4 p-4 bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-md">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col items-center">
                            <h3 className="font-medium mb-2">Left Motor</h3>
                            <Joystick
                                motor="left"
                                onChange={handleMotorAControl}

                            />
                        </div>
                        <div className="flex flex-col items-center">
                            <h3 className="font-medium mb-2">Right Motor</h3>
                            <Joystick
                                motor="right"
                                onChange={handleMotorBControl}

                            />
                        </div>
                    </div>
                </div>
            )}
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

// file: docker-ardua/components/dataStores/statusConnected_ESP8266.tsx
// components/dataStores/statusConnected_ESP8266.tsx
'use client'

import { create } from 'zustand'

interface ESP8266StatusStore {
isConnected: boolean
isIdentified: boolean
espConnected: boolean
deviceId: string
setIsConnected: (isConnected: boolean) => void
setIsIdentified: (isIdentified: boolean) => void
setEspConnected: (espConnected: boolean) => void
setDeviceId: (deviceId: string) => void
}

export const useESP8266StatusStore = create<ESP8266StatusStore>((set) => ({
isConnected: false,
isIdentified: false,
espConnected: false,
deviceId: '',
setIsConnected: (isConnected) => set({ isConnected }),
setIsIdentified: (isIdentified) => set({ isIdentified }),
setEspConnected: (espConnected) => set({ espConnected }),
setDeviceId: (deviceId) => set({ deviceId }),
}))

export function StatusConnected_ESP8266() {
const { isConnected, isIdentified, espConnected } = useESP8266StatusStore()

    return (
        <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
                isConnected
                    ? (isIdentified
                        ? (espConnected ? 'bg-green-500' : 'bg-yellow-500')
                        : 'bg-yellow-500')
                    : 'bg-red-500'
            }`} />
            <span className="text-sm">
        {isConnected
            ? (isIdentified
                ? (espConnected ? 'ESP Connected' : 'Waiting for ESP')
                : 'Connecting...')
            : 'Disconnected'}
      </span>
        </div>
    )
}

// file: docker-ardua/components/form/index.ts
export { FormInput } from './form-input';
export { FormTextarea } from './form-textarea';


// file: docker-ardua/components/form/form-input.tsx
'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { ClearButton } from '@/components/clear-button';
import { ErrorText } from '@/components/error-text';
import { RequiredSymbol } from '@/components/required-symbol';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
name: string;
label?: string;
required?: boolean;
className?: string;
}

export const FormInput: React.FC<Props> = ({ className, name, label, required, ...props }) => {
const {
register,
formState: { errors },
watch,
setValue,
} = useFormContext();

const value = watch(name);
const errorText = errors[name]?.message as string;

const onClickClear = () => {
setValue(name, '', { shouldValidate: true });
};

return (
<div className={className}>
{label && (
<p className="font-medium mb-2">
{label} {required && <RequiredSymbol />}
</p>
)}

        <div className="relative">
          <Input className="h-12 text-md" {...register(name)} {...props} />

          {value && <ClearButton onClick={onClickClear} />}
        </div>

        {errorText && <ErrorText text={errorText} className="mt-2" />}
      </div>
);
};


// file: docker-ardua/components/form/form-textarea.tsx
'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Textarea } from '@/components/ui';
import { ClearButton } from '@/components/clear-button';

interface Props extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
className?: string;
name: string;
label?: string;
required?: boolean;
}

export const FormTextarea: React.FC<Props> = ({ className, name, label, required, ...props }) => {
const {
register,
formState: { errors },
watch,
setValue,
} = useFormContext();

const value = watch(name);
const errorText = errors[name]?.message as string;

const onClickClear = () => {
setValue(name, '');
};

return (
<div className={className}>
<p className="font-medium mb-2">
{label} {required && <span className="text-red-500">*</span>}
</p>

      <div className="relative">
        <Textarea className="h-12 text-md" {...register(name)} {...props} />

        {value && <ClearButton onClick={onClickClear} />}
      </div>

      {errorText && <p className="text-red-500 text-sm mt-2">{errorText}</p>}
    </div>
);
};


// file: docker-ardua/components/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
return twMerge(clsx(inputs))
}


// file: docker-ardua/components/lib/get-user-session.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/components/constants/auth-options';

export const getUserSession = async () => {
const session = await getServerSession(authOptions);

return session?.user ?? null;
};


// file: docker-ardua/components/modals/index.ts
export { AuthModal } from './auth-modal';


// file: docker-ardua/components/modals/auth-modal/forms/schemas.ts
import { z } from 'zod';

export const passwordSchema = z.string().min(4, { message: 'Введите корректный пароль' });

export const formLoginSchema = z.object({
email: z.string().email({ message: 'Введите корректную почту' }),
password: passwordSchema,
});

export const formRegisterSchema = formLoginSchema
.merge(
z.object({
fullName: z.string().min(2, { message: 'Введите имя и фамилию' }),
confirmPassword: passwordSchema,
}),
)
.refine((data) => data.password === data.confirmPassword, {
message: 'Пароли не совпадают',
path: ['confirmPassword'],
});

export type TFormLoginValues = z.infer<typeof formLoginSchema>;
export type TFormRegisterValues = z.infer<typeof formRegisterSchema>;


// file: docker-ardua/components/modals/auth-modal/forms/login-form.tsx
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { TFormLoginValues, formLoginSchema } from './schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Title } from '../../../title';
import { FormInput } from '@/components/form/form-input';
import { Button } from '@/components/ui';
import toast from 'react-hot-toast';
import { signIn } from 'next-auth/react';

interface Props {
onClose?: VoidFunction;
}

export const LoginForm: React.FC<Props> = ({ onClose }) => {
const form = useForm<TFormLoginValues>({
resolver: zodResolver(formLoginSchema),
defaultValues: {
email: '',
password: '',
},
});

const onSubmit = async (data: TFormLoginValues) => {
try {
const resp = await signIn('credentials', {
...data,
redirect: false,
});

      if (!resp?.ok) {
        throw Error();
      }

      toast.success('Вы успешно вошли в аккаунт', {
        icon: '✅',
      });

      onClose?.();
    } catch (error) {
      console.error('Error [LOGIN]', error);
      toast.error('Не удалось войти в аккаунт', {
        icon: '❌',
      });
    }
};

return (
<FormProvider {...form}>
<form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
<div className="flex justify-between items-center">
<div className="mr-2">
<Title text="Вход в аккаунт" size="md" className="font-bold text-gray-400" />
<p className="text-gray-400">Введите свою почту, чтобы войти в свой аккаунт</p>
</div>
<img src="/assets/images/phone-icon.png" alt="phone-icon" width={60} height={60} />
</div>

        <FormInput name="email" label="E-Mail" required />
        <FormInput name="password" label="Пароль" type="password" required />

        <Button loading={form.formState.isSubmitting} className="h-12 text-base" type="submit">
          Войти
        </Button>
      </form>
    </FormProvider>
);
};


// file: docker-ardua/components/modals/auth-modal/forms/register-form.tsx
'use client';

import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { registerUser } from '@/app/actions';
import { TFormRegisterValues, formRegisterSchema } from './schemas';
import { FormInput } from '@/components/form/form-input';
import { Button } from '@/components/ui';

interface Props {
onClose?: VoidFunction;
onClickLogin?: VoidFunction;
}

export const RegisterForm: React.FC<Props> = ({ onClose, onClickLogin }) => {
const form = useForm<TFormRegisterValues>({
resolver: zodResolver(formRegisterSchema),
defaultValues: {
email: '',
fullName: '',
password: '',
confirmPassword: '',
},
});

const onSubmit = async (data: TFormRegisterValues) => {
try {
await registerUser({
email: data.email,
fullName: data.fullName,
password: data.password,
});
// toast.error('Регистрация успешна 📝. Подтвердите свою почту', {
toast.error('Регистрация успешна 📝. Можете войти в акккаунт', {
icon: '✅',
});

      onClose?.();
    } catch (error) {
      return toast.error('Неверный E-Mail или пароль, может пользователь уже существует', {
        icon: '❌',
      });
    }
};

return (
<FormProvider {...form}>
<form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
<FormInput name="email" label="E-Mail" required />
<FormInput name="fullName" label="Полное имя" required />
<FormInput name="password" label="Пароль" type="password" required />
<FormInput name="confirmPassword" label="Подтвердите пароль" type="password" required />

        <Button loading={form.formState.isSubmitting} className="h-12 text-base" type="submit">
          Зарегистрироваться
        </Button>
      </form>
    </FormProvider>
);
};


// file: docker-ardua/components/modals/auth-modal/index.ts
export { AuthModal } from './auth-modal';


// file: docker-ardua/components/modals/auth-modal/auth-modal.tsx
'use client';

import { Button } from '@/components/ui/button';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import { signIn } from 'next-auth/react';
import React from 'react';
import { LoginForm } from './forms/login-form';
import { RegisterForm } from './forms/register-form';


interface Props {
open: boolean;
onClose: () => void;
}

export const AuthModal: React.FC<Props> = ({ open, onClose }) => {
const [type, setType] = React.useState<'login' | 'register'>('login');

    const onSwitchType = () => {
        setType(type === 'login' ? 'register' : 'login');
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="w-[450px] bg-secondary p-10">
                <DialogHeader>
                    <DialogTitle>Edit profile</DialogTitle>
                    <DialogDescription>
                        Auth
                    </DialogDescription>
                </DialogHeader>
                {type === 'login' ? (
                    <LoginForm onClose={handleClose} />
                ) : (
                    <RegisterForm onClose={handleClose} />
                )}

                <hr />
                <div className="flex gap-2">

                    {/*<Button*/}
                    {/*  variant="secondary"*/}
                    {/*  onClick={() =>*/}
                    {/*    signIn('github', {*/}
                    {/*      callbackUrl: '/',*/}
                    {/*      redirect: true,*/}
                    {/*    })*/}
                    {/*  }*/}
                    {/*  type="button"*/}
                    {/*  className="gap-2 h-12 p-2 flex-1">*/}
                    {/*  <img className="w-6 h-6" src="https://github.githubassets.com/favicons/favicon.svg" />*/}
                    {/*  GitHub*/}
                    {/*</Button>*/}

                    <Button
                        variant="secondary"
                        onClick={() =>
                            signIn('google', {
                                callbackUrl: '/',
                                redirect: true,
                            })
                        }
                        type="button"
                        className="gap-2 h-12 p-2 flex-1">
                        <img
                            className="w-6 h-6"
                            src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg"
                        />
                        Google
                    </Button>
                </div>

                <Button variant="outline" onClick={onSwitchType} type="button" className="h-12">
                    {type !== 'login' ? 'Войти' : 'Регистрация'}
                </Button>
            </DialogContent>
        </Dialog>
    );
};


// file: docker-ardua/components/ui/form.tsx
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
Controller,
ControllerProps,
FieldPath,
FieldValues,
FormProvider,
useFormContext,
} from "react-hook-form"

import { cn } from "@/components/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
TFieldValues extends FieldValues = FieldValues,
TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
{} as FormFieldContextValue
)

const FormField = <
TFieldValues extends FieldValues = FieldValues,
TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
...props
}: ControllerProps<TFieldValues, TName>) => {
return (
<FormFieldContext.Provider value={{ name: props.name }}>
<Controller {...props} />
</FormFieldContext.Provider>
)
}

const useFormField = () => {
const fieldContext = React.useContext(FormFieldContext)
const itemContext = React.useContext(FormItemContext)
const { getFieldState, formState } = useFormContext()

const fieldState = getFieldState(fieldContext.name, formState)

if (!fieldContext) {
throw new Error("useFormField should be used within <FormField>")
}

const { id } = itemContext

return {
id,
name: fieldContext.name,
formItemId: `${id}-form-item`,
formDescriptionId: `${id}-form-item-description`,
formMessageId: `${id}-form-item-message`,
...fieldState,
}
}

type FormItemContextValue = {
id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
{} as FormItemContextValue
)

const FormItem = React.forwardRef<
HTMLDivElement,
React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
const id = React.useId()

return (
<FormItemContext.Provider value={{ id }}>
<div ref={ref} className={cn("space-y-2", className)} {...props} />
</FormItemContext.Provider>
)
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
React.ElementRef<typeof LabelPrimitive.Root>,
React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
const { error, formItemId } = useFormField()

return (
<Label
ref={ref}
className={cn(error && "text-destructive", className)}
htmlFor={formItemId}
{...props}
/>
)
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
React.ElementRef<typeof Slot>,
React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

return (
<Slot
ref={ref}
id={formItemId}
aria-describedby={
!error
? `${formDescriptionId}`
: `${formDescriptionId} ${formMessageId}`
}
aria-invalid={!!error}
{...props}
/>
)
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
HTMLParagraphElement,
React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
const { formDescriptionId } = useFormField()

return (
<p
ref={ref}
id={formDescriptionId}
className={cn("text-sm text-muted-foreground", className)}
{...props}
/>
)
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
HTMLParagraphElement,
React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
const { error, formMessageId } = useFormField()
const body = error ? String(error?.message) : children

if (!body) {
return null
}

return (
<p
ref={ref}
id={formMessageId}
className={cn("text-sm font-medium text-destructive", className)}
{...props}
>
{body}
</p>
)
})
FormMessage.displayName = "FormMessage"

export {
useFormField,
Form,
FormItem,
FormLabel,
FormControl,
FormDescription,
FormMessage,
FormField,
}


// file: docker-ardua/components/ui/index.ts
export { Button } from './button';
export { Checkbox } from './checkbox';
export { Dialog } from './dialog';
export { Drawer } from './drawer';
export { Input } from './input';
export { Popover } from './popover';
export { Select } from './select';
export { Skeleton } from './skeleton';
export { Slider } from './slider';
export { Textarea } from './textarea';
export { Label } from './label';
export { Form } from './form';


// file: docker-ardua/components/ui/tabs.tsx
// components/ui/tabs.tsx
"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/components/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
React.ElementRef<typeof TabsPrimitive.List>,
React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
<TabsPrimitive.List
ref={ref}
className={cn(
"inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
className
)}
{...props}
/>
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
React.ElementRef<typeof TabsPrimitive.Trigger>,
React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
<TabsPrimitive.Trigger
ref={ref}
className={cn(
"inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
className
)}
{...props}
/>
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
React.ElementRef<typeof TabsPrimitive.Content>,
React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
<TabsPrimitive.Content
ref={ref}
className={cn(
"mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
className
)}
{...props}
/>
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }

// file: docker-ardua/components/ui/input.tsx
import * as React from 'react';

import { cn } from '@/components/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
({ className, type, ...props }, ref) => {
return (
<input
type={type}
className={cn(
'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
className,
)}
ref={ref}
{...props}
/>
);
},
);
Input.displayName = 'Input';

export { Input };


// file: docker-ardua/components/ui/label.tsx
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/components/lib/utils"

const labelVariants = cva(
"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
React.ElementRef<typeof LabelPrimitive.Root>,
React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
<LabelPrimitive.Root
ref={ref}
className={cn(labelVariants(), className)}
{...props}
/>
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }


// file: docker-ardua/components/ui/sheet.tsx
"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/components/lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
React.ElementRef<typeof SheetPrimitive.Overlay>,
React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
<SheetPrimitive.Overlay
className={cn(
"fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
className
)}
{...props}
ref={ref}
/>
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
"fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
{
variants: {
side: {
top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
bottom:
"inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
right:
"inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
},
},
defaultVariants: {
side: "right",
},
}
)

interface SheetContentProps
extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
React.ElementRef<typeof SheetPrimitive.Content>,
SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
<SheetPortal>
<SheetOverlay />
<SheetPrimitive.Content
ref={ref}
className={cn(sheetVariants({ side }), className)}
{...props}
>
{children}
<SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
<X className="h-4 w-4" />
<span className="sr-only">Close</span>
</SheetPrimitive.Close>
</SheetPrimitive.Content>
</SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
className,
...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
className,
...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
React.ElementRef<typeof SheetPrimitive.Title>,
React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
<SheetPrimitive.Title
ref={ref}
className={cn("text-lg font-semibold text-foreground", className)}
{...props}
/>
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
React.ElementRef<typeof SheetPrimitive.Description>,
React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
<SheetPrimitive.Description
ref={ref}
className={cn("text-sm text-muted-foreground", className)}
{...props}
/>
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
Sheet,
SheetPortal,
SheetOverlay,
SheetTrigger,
SheetClose,
SheetContent,
SheetHeader,
SheetFooter,
SheetTitle,
SheetDescription,
}


// file: docker-ardua/components/ui/table.tsx
import * as React from "react"

import { cn } from "@/components/lib/utils"

const Table = React.forwardRef<
HTMLTableElement,
React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
HTMLTableSectionElement,
React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
HTMLTableSectionElement,
React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
HTMLTableSectionElement,
React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
HTMLTableRowElement,
React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
HTMLTableCellElement,
React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
HTMLTableCellElement,
React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
HTMLTableCaptionElement,
React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
Table,
TableHeader,
TableBody,
TableFooter,
TableHead,
TableRow,
TableCell,
TableCaption,
}


// file: docker-ardua/components/ui/button.tsx
'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/components/lib/utils';
import { Loader } from 'lucide-react';

const buttonVariants = cva(
'inline-flex items-center justify-center whitespace-nowrap rounded-md active:translate-y-[1px] text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:bg-gray-500',
{
variants: {
variant: {
default: 'bg-primary text-primary-foreground hover:bg-primary/90',
destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
outline: 'border border-primary text-primary bg-transparent hover:bg-secondary',
secondary: 'bg-secondary text-primary hover:bg-secondary/50',
ghost: 'hover:bg-secondary hover:text-secondary-foreground',
link: 'text-primary underline-offset-4 hover:underline',
},
size: {
default: 'h-10 px-4 py-2',
sm: 'h-9 rounded-md px-3',
lg: 'h-11 rounded-md px-8',
icon: 'h-10 w-10',
},
},
defaultVariants: {
variant: 'default',
size: 'default',
},
},
);

export interface ButtonProps
extends React.ButtonHTMLAttributes<HTMLButtonElement>,
VariantProps<typeof buttonVariants> {
asChild?: boolean;
loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
({ className, variant, size, asChild = false, children, disabled, loading, ...props }, ref) => {
const Comp = asChild ? Slot : 'button';
return (
<Comp
disabled={disabled || loading}
className={cn(buttonVariants({ variant, size, className }))}
ref={ref}
{...props}>
{!loading ? children : <Loader className="w-5 h-5 animate-spin" />}
</Comp>
);
},
);
Button.displayName = 'Button';

export { Button, buttonVariants };


// file: docker-ardua/components/ui/dialog.tsx
'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '@/components/lib/utils';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
React.ElementRef<typeof DialogPrimitive.Overlay>,
React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
<DialogPrimitive.Overlay
ref={ref}
className={cn(
'fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
className,
)}
{...props}
/>
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
React.ElementRef<typeof DialogPrimitive.Content>,
React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
<DialogPortal>
<DialogOverlay />
<DialogPrimitive.Content
ref={ref}
className={cn(
'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
className,
)}
{...props}>
{children}
<DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
<X className="h-4 w-4" />
<span className="sr-only">Close</span>
</DialogPrimitive.Close>
</DialogPrimitive.Content>
</DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
React.ElementRef<typeof DialogPrimitive.Title>,
React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
<DialogPrimitive.Title
ref={ref}
className={cn('text-lg font-semibold leading-none tracking-tight', className)}
{...props}
/>
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
React.ElementRef<typeof DialogPrimitive.Description>,
React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
<DialogPrimitive.Description
ref={ref}
className={cn('text-sm text-muted-foreground', className)}
{...props}
/>
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
Dialog,
DialogPortal,
DialogOverlay,
DialogClose,
DialogTrigger,
DialogContent,
DialogHeader,
DialogFooter,
DialogTitle,
DialogDescription,
};


// file: docker-ardua/components/ui/drawer.tsx
'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';

import { cn } from '@/components/lib/utils';

const Drawer = ({
shouldScaleBackground = true,
...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
<DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
);
Drawer.displayName = 'Drawer';

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = React.forwardRef<
React.ElementRef<typeof DrawerPrimitive.Overlay>,
React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
<DrawerPrimitive.Overlay
ref={ref}
className={cn('fixed inset-0 z-50 bg-black/80', className)}
{...props}
/>
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

const DrawerContent = React.forwardRef<
React.ElementRef<typeof DrawerPrimitive.Content>,
React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
<DrawerPortal>
<DrawerOverlay />
<DrawerPrimitive.Content
ref={ref}
className={cn(
'fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background',
className,
)}
{...props}>
<div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
{children}
</DrawerPrimitive.Content>
</DrawerPortal>
));
DrawerContent.displayName = 'DrawerContent';

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('grid gap-1.5 p-4 text-center sm:text-left', className)} {...props} />
);
DrawerHeader.displayName = 'DrawerHeader';

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mt-auto flex flex-col gap-2 p-4', className)} {...props} />
);
DrawerFooter.displayName = 'DrawerFooter';

const DrawerTitle = React.forwardRef<
React.ElementRef<typeof DrawerPrimitive.Title>,
React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
<DrawerPrimitive.Title
ref={ref}
className={cn('text-lg font-semibold leading-none tracking-tight', className)}
{...props}
/>
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
React.ElementRef<typeof DrawerPrimitive.Description>,
React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
<DrawerPrimitive.Description
ref={ref}
className={cn('text-sm text-muted-foreground', className)}
{...props}
/>
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
Drawer,
DrawerPortal,
DrawerOverlay,
DrawerTrigger,
DrawerClose,
DrawerContent,
DrawerHeader,
DrawerFooter,
DrawerTitle,
DrawerDescription,
};


// file: docker-ardua/components/ui/select.tsx
'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '@/components/lib/utils';

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
React.ElementRef<typeof SelectPrimitive.Trigger>,
React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
<SelectPrimitive.Trigger
ref={ref}
className={cn(
'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
className,
)}
{...props}>
{children}
<SelectPrimitive.Icon asChild>
<ChevronDown className="h-4 w-4 opacity-50" />
</SelectPrimitive.Icon>
</SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
<SelectPrimitive.ScrollUpButton
ref={ref}
className={cn('flex cursor-default items-center justify-center py-1', className)}
{...props}>
<ChevronUp className="h-4 w-4" />
</SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
<SelectPrimitive.ScrollDownButton
ref={ref}
className={cn('flex cursor-default items-center justify-center py-1', className)}
{...props}>
<ChevronDown className="h-4 w-4" />
</SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
React.ElementRef<typeof SelectPrimitive.Content>,
React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
<SelectPrimitive.Portal>
<SelectPrimitive.Content
ref={ref}
className={cn(
'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
position === 'popper' &&
'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
className,
)}
position={position}
{...props}>
<SelectScrollUpButton />
<SelectPrimitive.Viewport
className={cn(
'p-1',
position === 'popper' &&
'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
)}>
{children}
</SelectPrimitive.Viewport>
<SelectScrollDownButton />
</SelectPrimitive.Content>
</SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
React.ElementRef<typeof SelectPrimitive.Label>,
React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
<SelectPrimitive.Label
ref={ref}
className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
{...props}
/>
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
React.ElementRef<typeof SelectPrimitive.Item>,
React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
<SelectPrimitive.Item
ref={ref}
className={cn(
'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
className,
)}
{...props}>
<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
<SelectPrimitive.ItemIndicator>
<Check className="h-4 w-4" />
</SelectPrimitive.ItemIndicator>
</span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
</SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
React.ElementRef<typeof SelectPrimitive.Separator>,
React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
<SelectPrimitive.Separator
ref={ref}
className={cn('-mx-1 my-1 h-px bg-muted', className)}
{...props}
/>
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
Select,
SelectGroup,
SelectValue,
SelectTrigger,
SelectContent,
SelectLabel,
SelectItem,
SelectSeparator,
SelectScrollUpButton,
SelectScrollDownButton,
};


// file: docker-ardua/components/ui/slider.tsx
'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '@/components/lib/utils';

const Slider = React.forwardRef<
React.ElementRef<typeof SliderPrimitive.Root>,
React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
<SliderPrimitive.Root
ref={ref}
className={cn('relative flex w-full touch-none select-none items-center', className)}
{...props}>
<SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
<SliderPrimitive.Range className="absolute h-full bg-primary" />
</SliderPrimitive.Track>
<SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
</SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };


// file: docker-ardua/components/ui/popover.tsx
'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '@/components/lib/utils';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
React.ElementRef<typeof PopoverPrimitive.Content>,
React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
<PopoverPrimitive.Portal>
<PopoverPrimitive.Content
ref={ref}
align={align}
sideOffset={sideOffset}
className={cn(
'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
className,
)}
{...props}
/>
</PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };


// file: docker-ardua/components/ui/checkbox.tsx
'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '@/components/lib/utils';

const Checkbox = React.forwardRef<
React.ElementRef<typeof CheckboxPrimitive.Root>,
React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
<CheckboxPrimitive.Root
ref={ref}
className={cn(
'peer h-4 w-4 shrink-0 bg-gray-100 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
className,
)}
{...props}>
<CheckboxPrimitive.Indicator className={cn('flex items-center justify-center text-current')}>
<Check className="h-4 w-4" strokeWidth={3} />
</CheckboxPrimitive.Indicator>
</CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };


не могу отправить данные мотора на сервер Joystick
1 of 1 error
Next.js (15.1.3) out of date (learn more)

Unhandled Runtime Error

TypeError: Cannot read properties of undefined (reading 'bg')

Source
components/control/Joystick.tsx (70:66) @ bg

68 |         if (container) {
69 |             container.style.transition = 'background-color 0.3s'
> 70 |             container.style.backgroundColor = motorStyles[motor].bg
|                                                                  ^
71 |         }
72 |
73 |         onChange(0)

нет логов,

после изменения
ESP8266 Control Panel - Connect (если стоит галочка "Auto connect on page load") - то при первой загрузке страницы,
должно происходить подключение к socket (SocketClient) -
хук useAutoConnectSocket @\hooks\useAutoConnectSocket.ts
подключения - который будет проверять "Auto connect on page load = true" (данные в localStorage)
то хук подключается к сокету как в SocketClient
статус подключения он должен отображаться из глобального хранилища stores (zustand)  - @\components\dataStores\statusConnected_ESP8266.tsx
так же нужно оставить ручное подключение в VideoCallApp, если "Auto connect on page load" = false

вот был рабочий код


// file: _PROJECTS/ArduA/NEXT/webrtc_control/11-new/control/Joystick.tsx
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

// file: _PROJECTS/ArduA/NEXT/webrtc_control/11-new/control/SocketClient.tsx
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

комментарии на русском, дай полный код
