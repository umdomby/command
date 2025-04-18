// stores/motorControlStore.ts
// не хотим хранить сокет в хранилище, можно модифицировать useMotorControl чтобы он принимал функцию для отправки команд:
import { create } from 'zustand'

type MotorState = {
    speed: number
    direction: 'forward' | 'backward' | 'stop'
}

type MotorControlStore = {
    motorA: MotorState
    motorB: MotorState
    isReady: boolean
    socket: WebSocket | null
    setSocket: (socket: WebSocket) => void
    setMotorA: (value: number) => void
    setMotorB: (value: number) => void
    emergencyStop: () => void
    initialize: () => void
    sendCommand: (command: string, params?: any) => void
}

export const useMotorControl = create<MotorControlStore>((set, get) => ({
    motorA: { speed: 0, direction: 'stop' },
    motorB: { speed: 0, direction: 'stop' },
    isReady: false,
    socket: null,

    sendCommandHandler: null,

    setSendCommandHandler: (handler) => set({ sendCommandHandler: handler }),

    sendCommand: (command, params) => {
        const { sendCommandHandler } = get();
        if (sendCommandHandler) {
            sendCommandHandler(command, params);
        } else {
            console.error('Send command handler not set');
        }
    },

    initialize: () => set({ isReady: true })
}))