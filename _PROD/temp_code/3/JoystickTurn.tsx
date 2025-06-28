"use client"
import { useCallback, useRef, useEffect, useState } from 'react'

type JoystickProps = {
    mo: 'A' | 'B' // motor → mo
    onChange: (value: number) => void
    direction: 'forward' | 'backward' | 'stop'
    sp: number // speed → sp
    className?: string
    disabled?: boolean
}

const JoystickTurn = ({ mo, onChange, direction, sp, disabled, className }: JoystickProps) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const knobRef = useRef<HTMLDivElement>(null)
    const isDragging = useRef(false)
    const touchId = useRef<number | null>(null)
    const [isLandscape, setIsLandscape] = useState(false)
    const [knobPosition, setKnobPosition] = useState({ x: 50, y: 50 })

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
        A: { border: '0px solid #ffffff', left: '50%', transform: isLandscape ? 'translate(-50%, -15%)' : 'translate(-50%, -55%)' },
        B: { border: '0px solid #ffffff', left: '50%', transform: isLandscape ? 'translate(-50%, -15%)' : 'translate(-50%, -55%)' }
    }

    const updateValue = useCallback((clientX: number, clientY: number) => {
        const container = containerRef.current
        if (!container) return

        const rect = container.getBoundingClientRect()
        const containerWidth = rect.width
        const containerHeight = rect.height
        const x = clientX - rect.left
        const y = clientY - rect.top

        // Ограничиваем движение ползунка в пределах 60% области (20% отступ сверху и слева, 80% снизу и справа)
        const trackWidth = containerWidth * 0.6
        const trackHeight = containerHeight * 0.6
        const trackLeft = containerWidth * 0.2
        const trackTop = containerHeight * 0.2
        const trackRight = containerWidth * 0.8
        const trackBottom = containerHeight * 0.8
        const normalizedX = Math.max(trackLeft, Math.min(trackRight, x))
        const normalizedY = Math.max(trackTop, Math.min(trackBottom, y))

        // Вычисляем процент позиции внутри 60%-й области
        const positionX = ((normalizedX - trackLeft) / trackWidth) * 100
        const positionY = ((normalizedY - trackTop) / trackHeight) * 100
        setKnobPosition({ x: 20 + (positionX * 0.6), y: 20 + (positionY * 0.6) })

        // Вычисляем значения для осей X и Y (от -255 до 255, инвертировано: вверх - вперёд, вправо - поворот)
        const valueX = ((normalizedX - trackLeft) / trackWidth) * 510 - 255
        const valueY = ((normalizedY - trackTop) / trackHeight) * 510 - 255
        const clampedX = Math.max(-255, Math.min(255, valueX))
        const clampedY = Math.max(-255, Math.min(255, valueY))

        // Передаём значение в зависимости от мотора
        if (mo === 'A') {
            // Мотор A: Y для скорости (вперёд/назад)
            onChange(clampedY)
        } else {
            // Мотор B: X для поворота (лево/право)
            onChange(clampedX)
        }
    }, [onChange, mo])

    const handleStart = useCallback((clientX: number, clientY: number) => {
        isDragging.current = true
        updateValue(clientX, clientY)
    }, [updateValue])

    const handleMove = useCallback((clientX: number, clientY: number) => {
        if (isDragging.current) {
            updateValue(clientX, clientY)
        }
    }, [updateValue])

    const handleEnd = useCallback(() => {
        if (!isDragging.current) return
        isDragging.current = false
        touchId.current = null
        setKnobPosition({ x: 50, y: 50 })
        onChange(0)
    }, [onChange])

    const onTouchStart = useCallback(
        (e: TouchEvent) => {
            if (disabled || touchId.current !== null || !containerRef.current?.contains(e.target as Node)) {
                return
            }
            const touch = e.changedTouches[0]
            touchId.current = touch.identifier
            handleStart(touch.clientX, touch.clientY)
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
                handleMove(touch.clientX, touch.clientY)
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
            handleStart(e.clientX, e.clientY)
            e.preventDefault()
        }

        const onMouseMove = (e: MouseEvent) => {
            if (isDragging.current) {
                handleMove(e.clientX, e.clientY)
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
                width: '150px',
                height: isLandscape ? '150px' : '150px',
                top: isLandscape ? '15%' : '55%',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
                width: '60%',
                height: '60%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%'
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
                    left: `${knobPosition.x}%`,
                    top: `${knobPosition.y}%`,
                    transform: 'translate(-50%, -50%)',
                    transition: isDragging.current ? 'none' : 'all 0.2s ease-out',
                    pointerEvents: 'none'
                }}
            />

            <div style={{
                position: 'absolute',
                width: '2px',
                height: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                left: '50%',
                transform: 'translateX(-50%)'
            }} />

            <div style={{
                position: 'absolute',
                width: '100%',
                height: '2px',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                top: '50%',
                transform: 'translateY(-50%)'
            }} />
        </div>
    )
}

export default JoystickTurn