"use client";
import { useCallback, useEffect, useRef, useState } from "react";

// Интерфейс пропсов компонента VirtualBox
interface VirtualBoxProps {
    onServoChange: (servoId: "1", value: { an: number; ak: number }) => void;
    onOrientationChange?: (beta: number, gamma: number, alpha: number) => void;
    disabled?: boolean;
    isVirtualBoxActive: boolean;
    hasOrientationPermission: boolean;
    hasMotionPermission: boolean;
    isOrientationSupported: boolean;
    isMotionSupported: boolean;
}

// Компонент VirtualBox для обработки данных ориентации и акселерометра
const VirtualBox: React.FC<VirtualBoxProps> = ({
                                                   onServoChange,
                                                   onOrientationChange,
                                                   disabled,
                                                   isVirtualBoxActive,
                                                   hasOrientationPermission,
                                                   hasMotionPermission,
                                                   isOrientationSupported,
                                                   isMotionSupported,
                                               }) => {
    const animationFrameRef = useRef<number | null>(null);
    const lastValidServo1 = useRef(90); // Последнее валидное значение сервопривода 1 (по умолчанию 90°)
    const lastValidServo2 = useRef(90); // Последнее валидное значение сервопривода 2 (по умолчанию 90°)
    const prevOrientationState = useRef({ gamma: 90 }); // Для servo1
    const prevOrientationState2 = useRef({ gamma: 90, alpha: 0 }); // Для servo2
    // Состояние для хранения данных ориентации
    const [orientationData, setOrientationData] = useState<{
        beta: number | null;
        gamma: number | null;
        alpha: number | null;
    }>({ beta: null, gamma: null, alpha: null });

    const [al, setAl] = useState<number>(0); // Для отображения скорректированного alpha

    // Обработка активации/деактивации VirtualBox
    useEffect(() => {
        if (!isVirtualBoxActive) {
            onServoChange("1", {an: 90, ak: 90}); // Возвращаем оба сервопривода в центральное положение
            lastValidServo1.current = 90;
            lastValidServo2.current = 90;
            // Сброс предыдущих состояний для чистого старта
            prevOrientationState.current = { gamma: 90 };
            prevOrientationState2.current = { gamma: 90, alpha: 0 };
        } else {
            // При активации VirtualBox устанавливаем servo2 в 90 градусов
            lastValidServo2.current = 90;
            onServoChange("1", {an: lastValidServo1.current, ak: 90});
            prevOrientationState2.current = { gamma: 90, alpha: 0 };
        }
    }, [isVirtualBoxActive, onServoChange]);

    // Функция для преобразования gamma в значение сервопривода (0...180)
    // ВОЗВРАЩЕНА К ИСХОДНОМУ СОСТОЯНИЮ
    const mapGammaToServo = useCallback((gamma: number): number => {
        // gamma: [-89...89] -> servo: [90...0] или [90...180]
        // -0 -> 0°, 0 -> 179-180°, 89 -> 90°, -89 -> 90°
        if (gamma >= 0 && gamma <= 89) {
            // Диапазон [0...89] -> [179...90]
            return Math.round(179 - (gamma / 89) * (179 - 90));
        } else if (gamma <= -0 && gamma >= -89) {
            // Диапазон [-0...-89] -> [0...90]
            return Math.round((Math.abs(gamma) / 89) * 90);
        }
        return lastValidServo1.current; // Возвращаем последнее валидное значение, если вне диапазона
    }, []);

    // Улучшенная функция для коррекции alpha с учетом beta и gamma
    const correctAlpha = useCallback((alpha: number, beta: number): number => {
        // Нормализуем alpha к диапазону [0, 360]
        alpha = alpha % 360;
        if (alpha < 0) alpha += 360;

        // Если телефон экраном "вниз" (лицом от пользователя) или перевернут (beta близко к 180 или -180),
        // alpha может быть инвертирован или некорректен.
        if (beta > 90 || beta < -90) { // Телефон "перевернут" относительно своей горизонтальной оси
            alpha = (alpha + 180) % 360; // Инвертируем alpha
        }

        return alpha;
    }, []);

    // Обработчик событий ориентации устройства
    const handleDeviceOrientation = useCallback(
        (event: DeviceOrientationEvent) => {
            // Проверка условий для обработки
            if (disabled || !isVirtualBoxActive || !hasOrientationPermission) {
                return;
            }

            let { beta, gamma, alpha } = event;
            // Проверка валидности данных
            if (beta === null || gamma === null || alpha === null) {
                return;
            }

            // Обновление состояния ориентации
            setOrientationData({ beta, gamma, alpha });

            // Передача данных ориентации, если callback задан
            if (onOrientationChange) {
                onOrientationChange(beta, gamma, alpha); // Передаем исходные alpha до коррекции
            }

            // Обработка servo1 (gamma)
            const y = gamma;
            const prevY = prevOrientationState2.current.gamma;

            // Ваша исходная логика перехода для servo1 (gamma)
            const isTransition1 = (y < -5 && prevOrientationState.current.gamma <= 120 && prevY <= 0) || (y > 5 && prevOrientationState.current.gamma >= 60 && prevY >= 0);

            // Подготовка значений для обоих сервоприводов
            let servo1Value = lastValidServo1.current;
            let servo2Value = lastValidServo2.current;
            let shouldSendCommand = false;

            if (isTransition1) {
                servo1Value = mapGammaToServo(y);
                if (servo1Value !== lastValidServo1.current) {
                    lastValidServo1.current = servo1Value;
                    prevOrientationState.current.gamma = servo1Value;
                    prevOrientationState2.current.gamma = y;
                    shouldSendCommand = true;
                }
            }

            // Обработка servo2 (alpha)
            const correctedAlpha = correctAlpha(alpha, beta);
            const prevAlpha = prevOrientationState2.current.alpha;
            // Вычисляем разницу alpha с учетом переходов через 0/360
            let alphaDelta = correctedAlpha - prevAlpha;
            if (alphaDelta > 180) alphaDelta -= 360; // Переход через 0->360
            else if (alphaDelta < -180) alphaDelta += 360; // Переход через 360->0
            // Обновляем servo2 относительно текущего значения
            servo2Value = lastValidServo2.current + alphaDelta;
            // Ограничиваем диапазон servo2: 0–180 градусов
            servo2Value = Math.max(0, Math.min(180, Math.round(servo2Value)));
            if (servo2Value !== lastValidServo2.current) {
                lastValidServo2.current = servo2Value;
                setAl(correctedAlpha); // Обновляем состояние для отображения скорректированного alpha
                prevOrientationState2.current.alpha = correctedAlpha; // Сохраняем скорректированный alpha
                shouldSendCommand = true;
            }

            // Отправка единой команды SAR, если изменился хотя бы один сервопривод
            if (shouldSendCommand) {
                onServoChange("1", { an: servo1Value, ak: servo2Value });
            }

            // Обновляем prevOrientationState2.current для следующего цикла
            prevOrientationState2.current.gamma = y;
        },
        [disabled, isVirtualBoxActive, hasOrientationPermission, onServoChange, onOrientationChange, mapGammaToServo, correctAlpha]
    );

    // Обработчик событий акселерометра (без изменений)
    const handleDeviceMotion = useCallback(
        (event: DeviceMotionEvent) => {
            if (disabled || !isVirtualBoxActive || !hasMotionPermission) {
                return;
            }

            const { acceleration } = event;
            if (!acceleration || acceleration.x === null || acceleration.y === null || acceleration.z === null) {
                return;
            }
        },
        [disabled, isVirtualBoxActive, hasMotionPermission]
    );

    // Обработчик запроса разрешений (без изменений)
    const handleRequestPermissions = useCallback(() => {
        if (!isVirtualBoxActive) {
            window.removeEventListener("deviceorientation", handleDeviceOrientation);
            window.removeEventListener("devicemotion", handleDeviceMotion);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        }
    }, [isVirtualBoxActive, handleDeviceOrientation, handleDeviceMotion]);

    // Регистрация функции запроса разрешений (без изменений)
    useEffect(() => {
        // @ts-ignore
        const virtualBoxRef = (window as any).virtualBoxRef || { current: null };
        virtualBoxRef.current = { handleRequestPermissions };
        return () => {
            virtualBoxRef.current = null;
        };
    }, [handleRequestPermissions]);

    // Добавление и удаление обработчиков событий (без изменений)
    useEffect(() => {
        if (isVirtualBoxActive && (hasOrientationPermission || hasMotionPermission)) {
            if (isOrientationSupported && hasOrientationPermission) {
                window.addEventListener("deviceorientation", handleDeviceOrientation);
            }
            if (isMotionSupported && hasMotionPermission) {
                window.addEventListener("devicemotion", handleDeviceMotion);
            }

            return () => {
                window.removeEventListener("deviceorientation", handleDeviceOrientation);
                window.removeEventListener("devicemotion", handleDeviceMotion);
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                    animationFrameRef.current = null;
                }
            };
        }
    }, [
        isVirtualBoxActive,
        hasOrientationPermission,
        hasMotionPermission,
        isOrientationSupported,
        isMotionSupported,
        handleDeviceOrientation,
        handleDeviceMotion,
    ]);

    return null;
    // return (
    //     <div>
    //         <p>Alpha (servo2): {lastValidServo2.current.toFixed(2)}</p>
    //         <p>Gamma: {orientationData.gamma !== null ? orientationData.gamma.toFixed(2) : 'N/A'}</p>
    //         <p>Beta: {orientationData.beta !== null ? orientationData.beta.toFixed(2) : 'N/A'}</p>
    //     </div>
    // );
};

export default VirtualBox;