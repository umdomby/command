// stores/motorControlStore.ts
import { create } from 'zustand'

type MotorState = {
    speed: number
    direction: 'forward' | 'backward' | 'stop'
}

type MotorControlStore = {
    motorA: MotorState
    motorB: MotorState
    isReady: boolean
    sendCommandHandler: ((command: string, params?: any) => void) | null
    setSendCommandHandler: (handler: (command: string, params?: any) => void) => void
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

    setMotorA: (value) => {
        const speed = Math.abs(value);
        const direction = value > 0 ? 'forward' : value < 0 ? 'backward' : 'stop';

        set({
            motorA: { speed, direction }
        });

        const { sendCommand } = get();
        if (value === 0) {
            sendCommand("set_speed", { motor: 'A', speed: 0 });
        } else {
            sendCommand("set_speed", { motor: 'A', speed });
            sendCommand(`motor_a_${direction}`);
        }
    },

    setMotorB: (value) => {
        const speed = Math.abs(value);
        const direction = value > 0 ? 'forward' : value < 0 ? 'backward' : 'stop';

        set({
            motorB: { speed, direction }
        });

        const { sendCommand } = get();
        if (value === 0) {
            sendCommand("set_speed", { motor: 'B', speed: 0 });
        } else {
            sendCommand("set_speed", { motor: 'B', speed });
            sendCommand(`motor_b_${direction}`);
        }
    },

    emergencyStop: () => {
        const { sendCommand } = get();
        sendCommand("set_speed", { motor: 'A', speed: 0 });
        sendCommand("set_speed", { motor: 'B', speed: 0 });
        set({
            motorA: { speed: 0, direction: 'stop' },
            motorB: { speed: 0, direction: 'stop' }
        });
    },

    initialize: () => set({ isReady: true })
}))