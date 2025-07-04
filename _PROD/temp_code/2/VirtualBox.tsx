"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { logVirtualBoxEvent } from "@/app/actionsVirtualBoxLog";

// Интерфейс пропсов компонента VirtualBox
interface VirtualBoxProps {
    onServoChange: (servoId: "1" | "2", value: number, isAbsolute: boolean) => void;
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
    const prevOrientationState = useRef({ gamma: 0 }); // Предыдущее значение gamma
    const lastValidServo1 = useRef(90); // Последнее валидное значение для servo1 (по умолчанию 90°)
    const isValidTransition = useRef<boolean>(false); // Флаг для отслеживания валидного перехода через 0/-0

    // Состояние для хранения данных ориентации
    const [orientationData, setOrientationData] = useState<{
        beta: number | null;
        gamma: number | null;
        alpha: number | null;
    }>({ beta: null, gamma: null, alpha: null });

    // Функция логирования событий с обработкой ошибок
    const log = useCallback(async (message: string, type: "info" | "error" | "success" = "info") => {
        try {
            await logVirtualBoxEvent(message, type);
        } catch (error) {
            console.error(`[VirtualBox Client] ERROR: Failed to send log - ${String(error)}`);
        }
    }, []);

    // Проверка информации об устройстве и поддержке сенсоров при монтировании компонента
    useEffect(() => {
        const userAgent = navigator.userAgent;
        const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
        const iOSVersion = isIOS ? parseInt(userAgent.match(/OS (\d+)_/i)?.[1] || "0", 10) : 0;
        log(`Информация об устройстве: iOS=${isIOS}, версия=${iOSVersion}, UserAgent=${userAgent}`, "info");
        log(`Поддержка сенсоров: Orientation=${isOrientationSupported}, Motion=${isMotionSupported}`, "info");

        if (isIOS && iOSVersion >= 13 && isOrientationSupported) {
            log("iOS 13+ обнаружен, требуется запрос разрешений для ориентации", "info");
        }
        if (isIOS && iOSVersion >= 13 && isMotionSupported) {
            log("iOS 13+ обнаружен, требуется запрос разрешений для акселерометра", "info");
        }
    }, [log, isOrientationSupported, isMotionSupported]);

    // Проверка настроек Safari для iOS-устройств
    useEffect(() => {
        const checkSafariSettings = () => {
            const userAgent = navigator.userAgent;
            const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
            if (isIOS) {
                log("Проверка настроек Safari: убедитесь, что 'Движение и ориентация' включены в Настройки > Safari > Конфиденциальность и безопасность", "info");
            }
        };
        checkSafariSettings();
    }, [log]);

    // Обработка активации/деактивации VirtualBox
    useEffect(() => {
        if (isVirtualBoxActive) {
            log("VirtualBox активирован", "info");
        } else {
            log("VirtualBox деактивирован", "info");
            onServoChange("1", 90, true);
            lastValidServo1.current = 90;
            log("Сервопривод 1 установлен в центральное положение (90°)", "info");
            isValidTransition.current = false; // Сбрасываем флаг при деактивации
        }
    }, [isVirtualBoxActive, log, onServoChange]);

    // Функция преобразования gamma в угол servo1 (0...180 градусов)
    const convertGammaToServoAngle = useCallback((gamma: number): number => {
        // Преобразуем gamma в угол servo1:
        // gamma = 89° -> servo1 = 0°
        // gamma = 0° или -0° -> servo1 = 90°
        // gamma = -89° -> servo1 = 180°
        let servoAngle: number;
        if (gamma >= 0) {
            // Диапазон [0...89] преобразуется в [90...0]
            servoAngle = 90 - gamma;
        } else {
            // Диапазон [-89...0] преобразуется в [180...90]
            servoAngle = 90 - gamma;
        }
        return Math.max(0, Math.min(180, Math.round(servoAngle))); // Ограничиваем диапазон [0...180]
    }, []);

    // Проверка, находится ли gamma в мёртвой зоне
    const isInDeadZone = useCallback((gamma: number, servo1: number): boolean => {
        // Мёртвая зона: [-87...-89] или [87...89]
        if ((gamma >= 87 && gamma <= 89) || (gamma <= -87 && gamma >= -89)) {
            // Если servo1 < 90, игнорируем [-87...-89]
            if (servo1 < 90 && gamma <= -87 && gamma >= -89) {
                log(`В мёртвой зоне: gamma=${gamma.toFixed(2)}, servo1=${servo1}, игнорируем [-87...-89]`, "info");
                return true;
            }
            // Если servo143 > 90, игнорируем [87...89]
            if (servo1 > 90 && gamma >= 87 && gamma <= 89) {
                log(`В мёртвой зоне: gamma=${gamma.toFixed(2)}, servo1=${servo1}, игнорируем [87...89]`, "info");
                return true;
            }
        }
        return false;
    }, [log]);

    // Обработчик событий ориентации устройства
    const handleDeviceOrientation = useCallback(
        (event: DeviceOrientationEvent) => {
            // Проверка условий для обработки ориентации
            if (disabled || !isVirtualBoxActive || !hasOrientationPermission) {
                if (isVirtualBoxActive && (!hasOrientationPermission || disabled)) {
                    log("Обработка ориентации отключена: disabled, неактивно или нет разрешения", "info");
                }
                return;
            }

            const { beta, gamma, alpha } = event;
            // Проверка валидности данных ориентации
            if (beta === null || gamma === null || alpha === null) {
                log("Данные ориентации недоступны (null значения)", "error");
                return;
            }

            // Обновление состояния ориентации
            setOrientationData({ beta, gamma, alpha });

            // Вызов callback для передачи данных ориентации, если он задан
            if (onOrientationChange) {
                onOrientationChange(beta, gamma, alpha);
            }

            const y = gamma;
            const prevY = prevOrientationState.current.gamma;

            // Определяем переход через 0/-0 ([3,2,1,0 (переход) -0,-1,-2])
            const isTransition = (prevY >= 0 && y < 0) || (prevY <= 0 && y > 0);
            if (isTransition && Math.abs(y) <= 3 && Math.abs(prevY) <= 3) {
                isValidTransition.current = true; // Устанавливаем флаг валидного перехода
                log(`Переход через 0/-0 обнаружен, gamma=${y.toFixed(2)}, isValidTransition=true`, "info");
            } else if (Math.abs(y) >= 87 && Math.abs(prevY) >= 87) {
                // Сбрасываем флаг, если gamma в мёртвой зоне
                isValidTransition.current = false;
                log(`В мёртвой зоне, gamma=${y.toFixed(2)}, isValidTransition=false`, "info");
            }

            // Проверяем мёртвую зону
            if (isInDeadZone(y, lastValidServo1.current)) {
                prevOrientationState.current.gamma = y;
                return; // Игнорируем данные в мёртвой зоне
            }

            // Преобразуем gamma в угол servo1
            const servoAngle = convertGammaToServoAngle(y);

            // Отправляем данные на servo1, если переход валиден или gamma вне мёртвой зоны
            if (isValidTransition.current || Math.abs(y) < 87) {
                onServoChange("1", servoAngle, true);
                lastValidServo1.current = servoAngle;
                log(`Данные отправлены на servo1: gamma=${y.toFixed(2)}, servo1=${servoAngle}`, "success");
            } else {
                log(`Данные не отправлены на servo1: gamma=${y.toFixed(2)}, isValidTransition=${isValidTransition.current}`, "info");
            }

            prevOrientationState.current.gamma = y;
        },
        [disabled, isVirtualBoxActive, hasOrientationPermission, onServoChange, onOrientationChange, log, convertGammaToServoAngle, isInDeadZone]
    );

    // Обработчик событий акселерометра
    const handleDeviceMotion = useCallback(
        (event: DeviceMotionEvent) => {
            if (disabled || !isVirtualBoxActive || !hasMotionPermission) {
                if (isVirtualBoxActive && (!hasMotionPermission || disabled)) {
                    log("Обработка акселерометра отключена: disabled, неактивно или нет разрешения", "info");
                }
                return;
            }

            const { acceleration } = event;
            if (!acceleration || acceleration.x === null || acceleration.y === null || acceleration.z === null) {
                log("Данные акселерометра недоступны (null значения)", "error");
                return;
            }

            log(`Данные акселерометра: x=${acceleration.x.toFixed(2)}, y=${acceleration.y.toFixed(2)}, z=${acceleration.z.toFixed(2)}`, "info");
        },
        [disabled, isVirtualBoxActive, hasMotionPermission, log]
    );

    // Обработчик запроса разрешений
    const handleRequestPermissions = useCallback(() => {
        if (!isVirtualBoxActive) {
            window.removeEventListener("deviceorientation", handleDeviceOrientation);
            window.removeEventListener("devicemotion", handleDeviceMotion);
            log("Обработчики событий ориентации и акселерометра удалены при деактивации", "info");
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        }
    }, [isVirtualBoxActive, log, handleDeviceOrientation, handleDeviceMotion]);

    // Регистрация функции запроса разрешений
    useEffect(() => {
        // @ts-ignore
        const virtualBoxRef = (window as any).virtualBoxRef || { current: null };
        virtualBoxRef.current = { handleRequestPermissions };
        return () => {
            virtualBoxRef.current = null;
        };
    }, [handleRequestPermissions]);

    // Добавление и удаление обработчиков событий ориентации и акселерометра
    useEffect(() => {
        if (isVirtualBoxActive && (hasOrientationPermission || hasMotionPermission)) {
            if (isOrientationSupported && hasOrientationPermission) {
                window.addEventListener("deviceorientation", handleDeviceOrientation);
                log("Обработчик DeviceOrientationEvent добавлен", "success");
            }
            if (isMotionSupported && hasMotionPermission) {
                window.addEventListener("devicemotion", handleDeviceMotion);
                log("Обработчик DeviceMotionEvent добавлен", "success");
            }

            return () => {
                window.removeEventListener("deviceorientation", handleDeviceOrientation);
                window.removeEventListener("devicemotion", handleDeviceMotion);
                log("Обработчики DeviceOrientationEvent и DeviceMotionEvent удалены", "info");
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
        log,
    ]);

    return null;
};

export default VirtualBox;