
// file: docker-ardua-444/components/control/JoystickVertical.tsx
"use client"
import { useCallback, useEffect, useState } from 'react'
import { Joystick } from 'react-joystick-component'
import styles from './JoystickStyles.module.css'

interface JoystickTurnProps {
onChange: ({ x, y }: { x: number; y: number }) => void;
direction: 'forward' | 'backward' | 'stop';
sp: number;
className?: string;
disabled?: boolean;
}

const JoystickVertical = ({ onChange, direction, sp, disabled, className }: JoystickTurnProps) => {
const [isLandscape, setIsLandscape] = useState(false)

    useEffect(() => {
        const handleOrientationChange = () => {
            setIsLandscape(window.matchMedia("(orientation: landscape)").matches)
        }

        handleOrientationChange()
        const mediaQuery = window.matchMedia("(orientation: landscape)")
        mediaQuery.addEventListener('change', handleOrientationChange)

        return () => {
            mediaQuery.removeEventListener('change', handleOrientationChange)
        }
    }, [])

    const handleMove = useCallback((event: any) => {
        if (disabled) return

        // Нормализация значений джойстика от -1 до 1 в диапазон -255 до 255
        const x = Math.round(event.x * 255) // X-ось для поворота
        const y = Math.round(event.y * 255) // Y-ось для движения вперед/назад

        // Расчет скоростей и направлений моторов
        let motorASpeed = 0 // Левый мотор
        let motorBSpeed = 0 // Правый мотор
        let motorADirection = 'stop'
        let motorBDirection = 'stop'

        // Базовая скорость по Y-оси
        const baseSpeed = Math.abs(y)

        if (y !== 0) {
            // Движение вперед или назад
            motorADirection = y >= 0 ? 'backward' : 'forward'
            motorBDirection = y >= 0 ? 'backward' : 'forward'
            motorASpeed = baseSpeed
            motorBSpeed = baseSpeed

            // Корректировка скорости для поворота (X-ось)
            if (x !== 0) {
                const turnSpeed = Math.abs(x)
                if (x > 0) {
                    // Поворот вправо: уменьшаем скорость левого мотора (A)
                    motorASpeed = Math.max(0, baseSpeed - turnSpeed)
                    motorBSpeed = baseSpeed // Правый мотор на полной скорости
                    if (motorASpeed === 0) motorADirection = 'stop'
                } else {
                    // Поворот влево: уменьшаем скорость правого мотора (B)
                    motorASpeed = baseSpeed // Левый мотор на полной скорости
                    motorBSpeed = Math.max(0, baseSpeed - turnSpeed)
                    if (motorBSpeed === 0) motorBDirection = 'stop'
                }
            }
        } else if (x !== 0) {
            // Чистый поворот (без движения по Y)
            const turnSpeed = Math.abs(x)
            if (x > 0) {
                // Поворот вправо: правый мотор (B) работает, левый (A) останавливается
                motorASpeed = 0
                motorBSpeed = turnSpeed
                motorADirection = 'stop'
                motorBDirection = 'forward'
            } else {
                // Поворот влево: левый мотор (A) работает, правый (B) останавливается
                motorASpeed = turnSpeed
                motorBSpeed = 0
                motorADirection = 'forward'
                motorBDirection = 'stop'
            }
        }

        // Ограничение скоростей в диапазоне [0, 255]
        motorASpeed = Math.min(255, Math.max(0, Math.round(motorASpeed)))
        motorBSpeed = Math.min(255, Math.max(0, Math.round(motorBSpeed)))

        // Отладка: выводим значения для проверки
        console.log('Joystick Move:', { x, y, motorASpeed, motorBSpeed, motorADirection, motorBDirection })

        // Передаем значения моторов в родительский компонент (SocketClient)
        onChange({
            x: motorASpeed * (motorADirection === 'forward' ? 1 : motorADirection === 'backward' ? -1 : 0),
            y: motorBSpeed * (motorBDirection === 'forward' ? 1 : motorBDirection === 'backward' ? -1 : 0)
        })
    }, [onChange, disabled])

    const handleStop = useCallback(() => {
        if (disabled) return
        onChange({ x: 0, y: 0 })
    }, [onChange, disabled])

    return (
        <div
            className={`${className} ${styles.turnJoystickContainer} select-none`}
            style={{
                position: 'absolute',
                width: '150px',
                height: '150px',
                left: isLandscape ? '85%' : '82%',
                top: isLandscape ? '65%' : '45%',
                transform: 'translate(-50%, -50%)',
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                msUserSelect: 'none', // Исправлено: MsUserSelect -> msUserSelect
                MozUserSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
                zIndex: 1001
            }}
        >
            <Joystick
                size={150}
                baseColor="transparent"
                stickColor="transparent" // Прозрачный ползунок
                // stickColor="rgba(255, 255, 255, 0.7)"
                stickSize={200}
                move={handleMove}
                stop={handleStop}
                disabled={disabled}
                throttle={40}
                //stickShape="cross"
                //controlPlaneShape="rectangle"
            />
        </div>
    )
}

export default JoystickVertical

// file: docker-ardua-444/components/control/JoystickUp.tsx
"use client"
import { useCallback, useRef, useEffect, useState } from 'react'

interface JoystickUpProps {
mo: 'A' | 'B';
onChange: (value: number) => void;
direction: 'forward' | 'backward' | 'stop';
sp: number;
className?: string;
disabled?: boolean;
}

const JoystickUp = ({ mo, onChange, direction, sp, disabled, className }: JoystickUpProps) => {
const containerRef = useRef<HTMLDivElement>(null)
const knobRef = useRef<HTMLDivElement>(null)
const isDragging = useRef(false)
const touchId = useRef<number | null>(null)
const [isLandscape, setIsLandscape] = useState(false)
const [knobPosition, setKnobPosition] = useState(50)

    useEffect(() => {
        const handleOrientationChange = () => {
            setIsLandscape(window.matchMedia("(orientation: landscape)").matches)
        }

        handleOrientationChange()
        const mediaQuery = window.matchMedia("(orientation: landscape)")
        mediaQuery.addEventListener('change', handleOrientationChange)

        return () => {
            mediaQuery.removeEventListener('change', handleOrientationChange)
        }
    }, [])

    const motorStyles = {
        A: { border: '0px solid #ffffff', left: '10px' },
        B: { border: '0px solid #ffffff', right: '10px' }
    }

    const updateValue = useCallback((clientY: number) => {
        const container = containerRef.current
        if (!container) return

        const rect = container.getBoundingClientRect()
        const containerHeight = rect.height
        const y = clientY - rect.top

        // Ограничиваем движение ползунка в пределах 60% высоты (20% сверху, 80% снизу)
        const trackHeight = containerHeight * 0.6 // 60% высоты контейнера
        const trackTop = containerHeight * 0.2 // 20% сверху
        const trackBottom = containerHeight * 0.8 // 80% снизу
        const normalizedY = Math.max(trackTop, Math.min(trackBottom, y))

        // Вычисляем процент позиции внутри 60%-й полосы
        const positionPercentage = ((normalizedY - trackTop) / trackHeight) * 100
        setKnobPosition(20 + (positionPercentage * 0.6)) // Масштабируем для отображения в 20%-80%

        // Вычисляем значение скорости от -255 до 255 (инвертировано: вверх - вперёд, вниз - назад)
        const value = ((normalizedY - trackTop) / trackHeight) * 510 - 255
        const clampedValue = Math.max(-255, Math.min(255, value))

        onChange(clampedValue)
    }, [onChange])

    const handleStart = useCallback((clientY: number) => {
        isDragging.current = true
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
        setKnobPosition(50)
        onChange(0)
    }, [onChange])

    const onTouchStart = useCallback(
        (e: TouchEvent) => {
            if (disabled || touchId.current !== null || !containerRef.current?.contains(e.target as Node)) {
                return
            }
            const touch = e.changedTouches[0]
            touchId.current = touch.identifier
            handleStart(touch.clientY)
            e.preventDefault()
        },
        [handleStart, disabled]
    )

    const onTouchMove = useCallback((e: TouchEvent) => {
        if (touchId.current !== null && containerRef.current?.contains(e.target as Node)) {
            const touch = Array.from(e.changedTouches).find(
                t => t.identifier === touchId.current
            )
            if (touch) {
                handleMove(touch.clientY)
                e.preventDefault()
            }
        }
    }, [handleMove])

    const onTouchEnd = useCallback((e: TouchEvent) => {
        if (touchId.current !== null) {
            const touch = Array.from(e.changedTouches).find(
                t => t.identifier === touchId.current
            )
            if (touch) {
                handleEnd()
            }
        }
    }, [handleEnd])

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const onMouseDown = (e: MouseEvent) => {
            if (disabled || !container.contains(e.target as Node)) {
                return
            }
            handleStart(e.clientY)
            e.preventDefault()
        }

        const onMouseMove = (e: MouseEvent) => {
            if (isDragging.current) {
                handleMove(e.clientY)
                e.preventDefault()
            }
        }

        const onMouseUp = () => {
            if (isDragging.current) {
                handleEnd()
            }
        }

        container.addEventListener('touchstart', onTouchStart, { passive: false })
        container.addEventListener('touchmove', onTouchMove, { passive: false })
        container.addEventListener('touchend', onTouchEnd, { passive: false })
        container.addEventListener('touchcancel', onTouchEnd, { passive: false })

        container.addEventListener('mousedown', onMouseDown)
        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
        container.addEventListener('mouseleave', handleEnd)

        return () => {
            container.removeEventListener('touchstart', onTouchStart)
            container.removeEventListener('touchmove', onTouchMove)
            container.removeEventListener('touchend', onTouchEnd)
            container.removeEventListener('touchcancel', onTouchEnd)

            container.removeEventListener('mousedown', onMouseDown)
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)
            container.removeEventListener('mouseleave', handleEnd)
        }
    }, [handleEnd, handleMove, handleStart, onTouchEnd, onTouchMove, onTouchStart])

    return (
        <div
            ref={containerRef}
            className={`noSelect ${className}`}
            style={{
                position: 'absolute',
                width: '80px',
                height: isLandscape ? '50vh' : '45vh',
                top: isLandscape ? '15%' : '55%',
                transform: isLandscape ? 'translateY(-15%)' : 'translateY(-55%)',
                bottom: '0',
                borderRadius: '0px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                touchAction: 'none',
                userSelect: 'none',
                cursor: disabled ? 'not-allowed' : 'default',
                ...motorStyles[mo],
                zIndex: 1001
            }}
        >
            <div style={{
                position: 'absolute',
                width: '20px',
                height: '60%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '10px'
            }} />

            <div
                ref={knobRef}
                style={{
                    position: 'absolute',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    top: `${knobPosition}%`,
                    marginTop: '-20px',
                    transition: isDragging.current ? 'none' : 'top 0.2s ease-out',
                    pointerEvents: 'none'
                }}
            />

            <div style={{
                position: 'absolute',
                width: '20px',
                height: '2px',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
            }} />
        </div>
    )
}

export default JoystickUp

// file: docker-ardua-444/components/control/JoystickHorizontal.tsx
"use client"
import { useCallback, useEffect, useState } from 'react'
import { Joystick } from 'react-joystick-component'
import styles from './JoystickStyles.module.css'

interface JoystickHorizontalProps {
onChange: ({ x, y }: { x: number; y: number }) => void;
disabled?: boolean;
className?: string;
}

const JoystickHorizontal = ({ onChange, disabled, className }: JoystickHorizontalProps) => {
const [isLandscape, setIsLandscape] = useState(false)

    useEffect(() => {
        const handleOrientationChange = () => {
            setIsLandscape(window.matchMedia("(orientation: landscape)").matches)
        }

        handleOrientationChange()
        const mediaQuery = window.matchMedia("(orientation: landscape)")
        mediaQuery.addEventListener('change', handleOrientationChange)

        return () => {
            mediaQuery.removeEventListener('change', handleOrientationChange)
        }
    }, [])

    const handleMove = useCallback((event: any) => {
        if (disabled) return

        // Нормализация значений джойстика (только X-ось, Y игнорируется)
        const x = Math.round(event.x * 255) // X-ось для поворота
        const y = 0 // Y-ось не используется

        // Расчет скоростей и направлений моторов
        let motorASpeed = 0 // Левый мотор
        let motorBSpeed = 0 // Правый мотор
        let motorADirection = 'stop'
        let motorBDirection = 'stop'

        if (x !== 0) {
            const turnSpeed = Math.abs(x)
            if (x > 0) {
                // Ползунок вправо: мотор A вперед, мотор B назад (поворот влево)
                motorASpeed = turnSpeed
                motorBSpeed = turnSpeed
                motorADirection = 'forward'
                motorBDirection = 'backward'
            } else {
                // Ползунок влево: мотор A назад, мотор B вперед (поворот вправо)
                motorASpeed = turnSpeed
                motorBSpeed = turnSpeed
                motorADirection = 'backward'
                motorBDirection = 'forward'
            }
        }

        // Ограничение скоростей в диапазоне [0, 255]
        motorASpeed = Math.min(255, Math.max(0, Math.round(motorASpeed)))
        motorBSpeed = Math.min(255, Math.max(0, Math.round(motorBSpeed)))

        // Отладка
        console.log('Horizontal Joystick Move:', { x, motorASpeed, motorBSpeed, motorADirection, motorBDirection })

        // Передаем значения моторов в родительский компонент (SocketClient)
        onChange({
            x: motorASpeed * (motorADirection === 'forward' ? 1 : motorADirection === 'backward' ? -1 : 0),
            y: motorBSpeed * (motorBDirection === 'forward' ? 1 : motorBDirection === 'backward' ? -1 : 0)
        })
    }, [onChange, disabled])

    const handleStop = useCallback(() => {
        if (disabled) return
        onChange({ x: 0, y: 0 })
    }, [onChange, disabled])

    return (
        <div
            className={`${className} ${styles.horizontalJoystickContainer} select-none`}
            style={{
                position: 'absolute',
                width: '150px',
                height: '150px',
                left: isLandscape ? '15%' : '75%',
                top: isLandscape ? '65%' : '20%',
                transform: 'translate(-50%, -50%)',
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                msUserSelect: 'none', // Исправлено: MsUserSelect -> msUserSelect
                MozUserSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
                zIndex: 1001
            }}
        >
            <Joystick
                size={150}
                baseColor="transparent"
                stickColor="transparent"
                stickSize={200}
                move={handleMove}
                stop={handleStop}
                disabled={disabled}
                throttle={40}
                //stickShape="circle" // Исправлено: "cross" -> "circle"
                //controlPlaneShape="horizontal"
            />
        </div>
    )
}

export default JoystickHorizontal

// file: docker-ardua-444/components/control/Joystick.tsx
"use client"
import { useCallback, useRef, useEffect, useState } from 'react'

interface JoystickProps {
mo: 'A' | 'B';
onChange: (value: number) => void;
direction: 'forward' | 'backward' | 'stop';
sp: number;
className?: string;
disabled?: boolean;
}

const Joystick = ({ mo, onChange, direction, sp, disabled, className }: JoystickProps) => { // motor → mo, speed → sp
const containerRef = useRef<HTMLDivElement>(null)
const knobRef = useRef<HTMLDivElement>(null)
const isDragging = useRef(false)
const touchId = useRef<number | null>(null)
const [isLandscape, setIsLandscape] = useState(false)
const [knobPosition, setKnobPosition] = useState(50)

    useEffect(() => {
        const handleOrientationChange = () => {
            setIsLandscape(window.matchMedia("(orientation: landscape)").matches)
        }

        handleOrientationChange()
        const mediaQuery = window.matchMedia("(orientation: landscape)")
        mediaQuery.addEventListener('change', handleOrientationChange)

        return () => {
            mediaQuery.removeEventListener('change', handleOrientationChange)
        }
    }, [])

    const motorStyles = {
        A: { border: '0px solid #ffffff', left: '10px' },
        B: { border: '0px solid #ffffff', right: '10px' }
    }

    const updateValue = useCallback((clientY: number) => {
        const container = containerRef.current
        if (!container) return

        const rect = container.getBoundingClientRect()
        const containerHeight = rect.height
        const y = clientY - rect.top

        // Ограничиваем движение ползунка в пределах 60% высоты (20% сверху, 80% снизу)
        const trackHeight = containerHeight * 0.6 // 60% высоты контейнера
        const trackTop = containerHeight * 0.2 // 20% сверху
        const trackBottom = containerHeight * 0.8 // 80% снизу
        const normalizedY = Math.max(trackTop, Math.min(trackBottom, y))

        // Вычисляем процент позиции внутри 60%-й полосы
        const positionPercentage = ((normalizedY - trackTop) / trackHeight) * 100
        setKnobPosition(20 + (positionPercentage * 0.6)) // Масштабируем для отображения в 20%-80%

        // Вычисляем значение скорости от -255 до 255
        const value = ((trackHeight - (normalizedY - trackTop)) / trackHeight) * 510 - 255
        const clampedValue = Math.max(-255, Math.min(255, value))
        //console.log(`Joystick ${mo}: value=${clampedValue}, position=${positionPercentage}%`); // Отладка
        onChange(clampedValue)
    }, [onChange])

    const handleStart = useCallback((clientY: number) => {
        isDragging.current = true
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
        setKnobPosition(50)
        onChange(0)
    }, [onChange])

    const onTouchStart = useCallback(
        (e: TouchEvent) => {
            if (disabled || touchId.current !== null || !containerRef.current?.contains(e.target as Node)) {
                return
            }
            const touch = e.changedTouches[0]
            touchId.current = touch.identifier
            handleStart(touch.clientY)
            e.preventDefault()
        },
        [handleStart, disabled]
    )

    const onTouchMove = useCallback((e: TouchEvent) => {
        if (touchId.current !== null && containerRef.current?.contains(e.target as Node)) {
            const touch = Array.from(e.changedTouches).find(
                t => t.identifier === touchId.current
            )
            if (touch) {
                handleMove(touch.clientY)
                e.preventDefault()
            }
        }
    }, [handleMove])

    const onTouchEnd = useCallback((e: TouchEvent) => {
        if (touchId.current !== null) {
            const touch = Array.from(e.changedTouches).find(
                t => t.identifier === touchId.current
            )
            if (touch) {
                handleEnd()
            }
        }
    }, [handleEnd])

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const onMouseDown = (e: MouseEvent) => {
            if (disabled || !container.contains(e.target as Node)) {
                return
            }
            handleStart(e.clientY)
            e.preventDefault()
        }

        const onMouseMove = (e: MouseEvent) => {
            if (isDragging.current) {
                handleMove(e.clientY)
                e.preventDefault()
            }
        }

        const onMouseUp = () => {
            if (isDragging.current) {
                handleEnd()
            }
        }

        container.addEventListener('touchstart', onTouchStart, { passive: false })
        container.addEventListener('touchmove', onTouchMove, { passive: false })
        container.addEventListener('touchend', onTouchEnd, { passive: false })
        container.addEventListener('touchcancel', onTouchEnd, { passive: false })

        container.addEventListener('mousedown', onMouseDown)
        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
        container.addEventListener('mouseleave', handleEnd)

        return () => {
            container.removeEventListener('touchstart', onTouchStart)
            container.removeEventListener('touchmove', onTouchMove)
            container.removeEventListener('touchend', onTouchEnd)
            container.removeEventListener('touchcancel', onTouchEnd)

            container.removeEventListener('mousedown', onMouseDown)
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)
            container.removeEventListener('mouseleave', handleEnd)
        }
    }, [handleEnd, handleMove, handleStart, onTouchEnd, onTouchMove, onTouchStart])

    return (
        <div
            ref={containerRef}
            className={`noSelect ${className}`}
            style={{
                position: 'absolute',
                width: '80px',
                height: isLandscape ? '50vh' : '45vh',
                top: isLandscape ? '15%' : '55%',
                transform: isLandscape ? 'translateY(-15%)' : 'translateY(-55%)',
                bottom: '0',
                borderRadius: '0px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                touchAction: 'none',
                userSelect: 'none',
                // backgroundColor: disabled ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                cursor: disabled ? 'not-allowed' : 'default',
                ...motorStyles[mo], // motor → mo
                zIndex: 1001
            }}
        >
            <div style={{
                position: 'absolute',
                width: '20px',
                height: '60%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '10px'
            }} />

            <div
                ref={knobRef}
                style={{
                    position: 'absolute',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    top: `${knobPosition}%`,
                    marginTop: '-20px',
                    transition: isDragging.current ? 'none' : 'top 0.2s ease-out',
                    pointerEvents: 'none'
                }}
            />

            <div style={{
                position: 'absolute',
                width: '20px',
                height: '2px',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
            }} />
        </div>
    )
}

export default Joystick

// file: docker-ardua-444/components/control/JoyAnalog.tsx
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./JoystickStyles.module.css";

interface JoyAnalogProps {
onChange: ({ x, y }: { x: number; y: number }) => void;
onServoChange: (servoId: "1" | "2", value: number, isAbsolute: boolean) => void;
disabled?: boolean;
}

const JoyAnalog = ({ onChange, onServoChange, disabled }: JoyAnalogProps) => {
const [gamepadConnected, setGamepadConnected] = useState(false);
const [motorDirection, setMotorDirection] = useState<"forward" | "backward">("forward");
const animationFrameRef = useRef<number | null>(null);
const prevButtonState = useRef({
buttonA: false,
buttonB: false,
buttonX: false,
buttonY: false,
buttonLB: false,
buttonRB: false,
});
const prevStickState = useRef({
leftStickX: 0, // Для Servo2 (D8, SSR2)
rightStickY: 0, // Для Servo1 (D7, SSR)
});

    // Проверка подключения геймпада
    const checkGamepad = useCallback(() => {
        const gamepads = navigator.getGamepads();
        const gamepad = gamepads.find((gp) => gp !== null && gp.id.includes("Xbox"));
        setGamepadConnected(!!gamepad);
        return gamepad;
    }, []);

    // Обработка ввода с геймпада
    const handleGamepadInput = useCallback(() => {
        if (disabled) return;

        const gamepad = checkGamepad();
        if (!gamepad) return;

        // Аналоговые триггеры (LT и RT)
        const ltValue = gamepad.buttons[6].value; // Left Trigger
        const rtValue = gamepad.buttons[7].value; // Right Trigger
        const motorASpeed = Math.round(ltValue * 255); // Мотор A
        const motorBSpeed = Math.round(rtValue * 255); // Мотор B

        // D-Pad (Крестовина)
        const dpadUp = gamepad.buttons[12].pressed; // Вверх
        const dpadDown = gamepad.buttons[13].pressed; // Вниз
        const dpadLeft = gamepad.buttons[14].pressed; // Влево
        const dpadRight = gamepad.buttons[15].pressed; // Вправо

        // Кнопки A, B, X, Y
        const buttonA = gamepad.buttons[0].pressed; // A (зеленая)
        const buttonB = gamepad.buttons[1].pressed; // B (красная)
        const buttonX = gamepad.buttons[2].pressed; // X (синяя)
        const buttonY = gamepad.buttons[3].pressed; // Y (желтая)

        // Бамперы LB и RB
        const buttonLB = gamepad.buttons[4].pressed; // Left Bumper
        const buttonRB = gamepad.buttons[5].pressed; // Right Bumper

        // Левый и правый стики
        const leftStickX = gamepad.axes[0]; // Ось X левого стика (Servo2)
        const rightStickY = gamepad.axes[3]; // Ось Y правого стика (Servo1)
        const deadZone = 0.1; // Зона нечувствительности 10%

        // Управление моторами
        let motorA = 0;
        let motorB = 0;

        // LT и RT управляют скоростью
        if (motorASpeed > 0) {
            motorA = motorDirection === "forward" ? -motorASpeed : motorASpeed; // Учитываем направление
        }
        if (motorBSpeed > 0) {
            motorB = motorDirection === "forward" ? -motorBSpeed : motorBSpeed; // Учитываем направление
        }

        // D-Pad: направление моторов
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

        onChange({ x: motorA, y: motorB });

        // Кнопки для управления сервоприводами
        if (buttonA && !prevButtonState.current.buttonA) {
            onServoChange("1", -15, false);
        }
        if (buttonB && !prevButtonState.current.buttonB) {
            onServoChange("2", -15, false);
        }
        if (buttonX && !prevButtonState.current.buttonX) {
            onServoChange("2", 15, false);
        }
        if (buttonY && !prevButtonState.current.buttonY) {
            onServoChange("1", 15, false);
        }

        // Бамперы для переключения направления моторов
        if (buttonLB && !prevButtonState.current.buttonLB) {
            setMotorDirection("backward");
        }
        if (buttonRB && !prevButtonState.current.buttonRB) {
            setMotorDirection("forward");
        }

        // Левый стик (Servo2, ось X)
        if (Math.abs(leftStickX) > deadZone) {
            const servo2Value = Math.round((-leftStickX + 1) * 90); // От 0 до 180, инвертировано
            onServoChange("2", servo2Value, true);
        } else if (Math.abs(leftStickX) <= deadZone && Math.abs(prevStickState.current.leftStickX) > deadZone) {
            onServoChange("2", 90, true); // Возврат в центр (90°)
        }

        // Правый стик (Servo1, ось Y)
        if (Math.abs(rightStickY) > deadZone) {
            const servo1Value = Math.round((-rightStickY + 1) * 90); // От 0 до 180, инвертировано
            onServoChange("1", servo1Value, true);
        } else if (Math.abs(rightStickY) <= deadZone && Math.abs(prevStickState.current.rightStickY) > deadZone) {
            onServoChange("1", 90, true); // Возврат в центр (90°)
        }

        // Обновление предыдущего состояния
        prevButtonState.current = {
            buttonA,
            buttonB,
            buttonX,
            buttonY,
            buttonLB,
            buttonRB,
        };
        prevStickState.current = {
            leftStickX,
            rightStickY,
        };

        // Продолжаем опрос геймпада
        animationFrameRef.current = requestAnimationFrame(handleGamepadInput);
    }, [disabled, checkGamepad, onChange, onServoChange]);

    // Обработка подключения/отключения геймпада
    useEffect(() => {
        const handleConnect = () => {
            setGamepadConnected(!!checkGamepad());
            animationFrameRef.current = requestAnimationFrame(handleGamepadInput);
        };

        const handleDisconnect = () => {
            setGamepadConnected(false);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };

        window.addEventListener("gamepadconnected", handleConnect);
        window.addEventListener("gamepaddisconnected", handleDisconnect);

        // Проверяем, есть ли уже подключенный геймпад
        if (checkGamepad()) {
            handleConnect();
        }

        return () => {
            window.removeEventListener("gamepadconnected", handleConnect);
            window.removeEventListener("gamepaddisconnected", handleDisconnect);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [checkGamepad, handleGamepadInput]);

    return null;
};

export default JoyAnalog;

