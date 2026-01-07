это старый работающий код на JSON

"use client"
import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import Joystick from '@/components/control/Joystick'
import JoystickVertical from '@/components/control/JoystickVertical'
import JoystickHorizontal from '@/components/control/JoystickHorizontal' // Добавляем новый компонент
import { useServo } from '@/components/ServoContext';
import {
getDevices,
addDevice,
deleteDevice,
updateServoSettings,
sendDeviceSettingsToESP,
getSavedRoomWithDevice,
updateDeviceSettings
} from '@/app/actions';
import {
Accordion,
AccordionContent,
AccordionItem,
AccordionTrigger,
} from "@/components/ui/accordion";
import JoystickUp from "@/components/control/JoystickUp";
import JoyAnalog from '@/components/control/JoyAnalog';
import VirtualBox from "@/components/control/VirtualBox";
import Keyboard from '@/components/control/Keyboard';
import ButtonControl from "@/components/control/ButtonControl";


type MessageType = {
ty?: string
sp?: string
co?: string
de?: string
me?: string
mo?: string
pa?: any
clientId?: number
st?: string
ts?: string
or?: 'client' | 'esp' | 'server' | 'error'
re?: string
b1?: string
b2?: string
sp1?: string
sp2?: string
z?: string
a?: string
}

type LogEntry = {
me: string
ty: 'client' | 'esp' | 'server' | 'error' | 'success' | 'info'
}

interface SocketClientProps {
onConnectionStatusChange?: (isFullyConnected: boolean) => void;
selectedDeviceId?: string | null;
onDisconnectWebSocket?: { disconnectWebSocket?: () => Promise<void> };
onDeviceAdded?: (deviceId: string) => void;
isProxySocket?: boolean;
}

export default function SocketClient({ onConnectionStatusChange, selectedDeviceId, onDisconnectWebSocket, onDeviceAdded, isProxySocket }: SocketClientProps) {
const {
servoAngle,
servo2Angle,
servo1MinAngle,
servo1MaxAngle,
servo2MinAngle,
servo2MaxAngle,
setServoAngle,
setServo2Angle,
setServo1MinAngle,
setServo1MaxAngle,
setServo2MinAngle,
setServo2MaxAngle,
} = useServo();
const hasRequestedPermissions = useRef(false);
const [log, setLog] = useState<LogEntry[]>([])
const [isConnected, setIsConnected] = useState(false)
const [isIdentified, setIsIdentified] = useState(false)
const [de, setDe] = useState('')
const [inputDe, setInputDe] = useState('')
const [newDe, setNewDe] = useState('')
const [noDevices, setNoDevices] = useState(true)
const [deviceList, setDeviceList] = useState<string[]>([])
const [espConnected, setEspConnected] = useState(false)
const [logVisible, setLogVisible] = useState(false)
const [motorASpeed, setMotorASpeed] = useState(0)
const [motorBSpeed, setMotorBSpeed] = useState(0)
const [motorADirection, setMotorADirection] = useState<'forward' | 'backward' | 'stop'>('stop')
const [motorBDirection, setMotorBDirection] = useState<'forward' | 'backward' | 'stop'>('stop')
const [autoReconnect, setAutoReconnect] = useState(false)
const [autoConnect, setAutoConnect] = useState(false)
const [closedDel, setClosedDel] = useState(false)
const [isLandscape, setIsLandscape] = useState(false)
const [button1State, setButton1State] = useState<boolean | null>(null)
const [button2State, setButton2State] = useState<boolean | null>(null)
const [button3State, setButton3State] = useState<boolean | null>(null)
const [showServos, setShowServos] = useState<boolean | null>(() => {
const savedShowServos = localStorage.getItem('showServos');
return savedShowServos !== null ? JSON.parse(savedShowServos) : false;
});
const [activeTab, setActiveTab] = useState<'esp' | 'controls' | 'joystickControl' | null>('esp')
const [showJoystickMenu, setShowJoystickMenu] = useState(false)
const [selectedJoystick, setSelectedJoystick] = useState<'JoystickTurn' | 'Joystick' | 'JoystickUp' | 'JoyAnalog' | 'Keyboard' | 'ButtonControl'>(
(typeof window !== 'undefined' && localStorage.getItem('selectedJoystick') as 'Joystick' | 'JoystickTurn' | 'JoystickUp' | 'JoyAnalog' | 'Keyboard' | 'ButtonControl') || 'ButtonControl'
);
const [isVirtualBoxActive, setIsVirtualBoxActive] = useState<boolean>(() => {
const savedState = localStorage.getItem('isVirtualBoxActive');
return savedState !== null ? JSON.parse(savedState) : false;
});

    const lastHeartbeatLogTime = useRef<number>(0);
    const reconnectAttemptRef = useRef(0)
    const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
    const socketRef = useRef<WebSocket | null>(null)
    const lastMotorACommandRef = useRef<{ sp: number, direction: 'forward' | 'backward' | 'stop' } | null>(null)
    const lastMotorBCommandRef = useRef<{ sp: number, direction: 'forward' | 'backward' | 'stop' } | null>(null)
    const motorAThrottleRef = useRef<NodeJS.Timeout | null>(null)
    const motorBThrottleRef = useRef<NodeJS.Timeout | null>(null)
    const currentDeRef = useRef(inputDe)

    const [servo1MinInput, setServo1MinInput] = useState('');
    const [servo1MaxInput, setServo1MaxInput] = useState('');
    const [servo2MinInput, setServo2MinInput] = useState('');
    const [servo2MaxInput, setServo2MaxInput] = useState('');

    const [inputVoltage, setInputVoltage] = useState<number | null>(null);
    const [telegramToken, setTelegramToken] = useState<string | null>(null);
    const [telegramTokenInput, setTelegramTokenInput] = useState('');
    const [telegramIdInput, setTelegramIdInput] = useState('');
    const [isDeviceOrientationSupported, setIsDeviceOrientationSupported] = useState(false);
    const [isDeviceMotionSupported, setIsDeviceMotionSupported] = useState(false);
    const virtualBoxRef = useRef<{ handleRequestPermissions: () => void } | null>(null);
    const [hasOrientationPermission, setHasOrientationPermission] = useState(false);
    const [hasMotionPermission, setHasMotionPermission] = useState(false);

    const [isProxy, setIsProxy] = useState(false);

    // Новое состояние для данных ориентации
    const [orientationData, setOrientationData] = useState<{ beta: number | null; gamma: number | null; alpha: number | null }>({
        beta: null,
        gamma: null,
        alpha: null,
    });

    // Callback для обработки данных ориентации
    const handleOrientationChange = useCallback((beta: number, gamma: number, alpha: number) => {
        setOrientationData({ beta, gamma, alpha });
        addLog(`Данные ориентации от VirtualBox: beta=${beta.toFixed(2)}, gamma=${gamma.toFixed(2)}, alpha=${alpha.toFixed(2)}`, "info");
    }, []);


    useEffect(() => {
        setIsProxy(!!selectedDeviceId);
    }, [selectedDeviceId]);

    useEffect(() => {
        localStorage.setItem('isVirtualBoxActive', JSON.stringify(isVirtualBoxActive));
    }, [isVirtualBoxActive]);

    useEffect(() => {
        localStorage.setItem('selectedJoystick', selectedJoystick)
    }, [selectedJoystick])

    const addLog = useCallback((msg: string, ty: LogEntry['ty']) => {
        setLog(prev => [...prev.slice(-100), { me: `${new Date().toLocaleTimeString()}: ${msg}`, ty }]);
    }, []);

    const [telegramId, setTelegramId] = useState<BigInt | null>(null);

    useEffect(() => {
        const loadDevices = async () => {
            if (isProxySocket) return;
            try {
                const devices = await getDevices();
                setDeviceList(devices.map(d => d.idDevice));
                setNoDevices(devices.length === 0);
                if (devices.length > 0) {
                    const autoConnectDevice = devices.find(device => device.autoConnect) || devices[0];
                    const device = autoConnectDevice;
                    setInputDe(device.idDevice);
                    setDe(device.idDevice);
                    currentDeRef.current = device.idDevice;
                    setAutoReconnect(device.autoReconnect ?? false);
                    setAutoConnect(device.autoConnect ?? false);
                    setClosedDel(device.closedDel ?? false);
                    setTelegramToken(device.telegramToken ?? null);
                    setTelegramId(device.telegramId !== null ? BigInt(device.telegramId) : null);
                    setTelegramTokenInput(device.telegramToken ?? '');
                    setTelegramIdInput(device.telegramId?.toString() ?? '');
                    if (device.settings && device.settings.length > 0) {
                        const settings = device.settings[0];
                        setServo1MinAngle(settings.servo1MinAngle || 0);
                        setServo1MaxAngle(settings.servo1MaxAngle || 180);
                        setServo2MinAngle(settings.servo2MinAngle || 0);
                        setServo2MaxAngle(settings.servo2MaxAngle || 180);
                        setButton1State(settings.b1 ?? false);
                        setButton2State(settings.b2 ?? false);
                        setServo1MinInput((settings.servo1MinAngle || 0).toString());
                        setServo1MaxInput((settings.servo1MaxAngle || 180).toString());
                        setServo2MinInput((settings.servo2MinAngle || 0).toString());
                        setServo2MaxInput((settings.servo2MaxAngle || 180).toString());
                    }
                    if (device.autoConnect) {
                        connectWebSocket(device.idDevice);
                        addLog(`Автоматическое подключение к устройству ${formatDeviceId(device.idDevice)}`, 'success');
                    }
                    if (socketRef.current?.readyState === WebSocket.OPEN) {
                        const settings = await sendDeviceSettingsToESP(device.idDevice);
                        socketRef.current.send(JSON.stringify({
                            co: 'SET_SERVO1_LIMITS',
                            pa: { min: settings.servo1MinAngle, max: settings.servo1MaxAngle },
                            de: device.idDevice,
                            ts: Date.now(),
                            expectAck: true
                        }));
                        socketRef.current.send(JSON.stringify({
                            co: 'SET_SERVO2_LIMITS',
                            pa: { min: settings.servo2MinAngle, max: settings.servo2MaxAngle },
                            de: device.idDevice,
                            ts: Date.now(),
                            expectAck: true
                        }));
                        socketRef.current.send(JSON.stringify({
                            co: 'SET_SERVO_VIEW',
                            pa: { visible: settings.servoView },
                            de: device.idDevice,
                            ts: Date.now(),
                            expectAck: true
                        }));
                    }
                } else {
                    setDeviceList([]);
                    setNoDevices(true);
                    setInputDe('');
                    setDe('');
                    setShowServos(false);
                    setServo1MinInput('0');
                    setServo1MaxInput('180');
                    setServo2MinInput('0');
                    setServo2MaxInput('180');
                }
            } catch (error: unknown) {
                let errorMessage = 'Неизвестная ошибка';
                if (error instanceof Error) {
                    errorMessage = error.message;
                } else if (typeof error === 'object' && error !== null && 'message' in error) {
                    errorMessage = (error as { message: string }).message;
                } else {
                    errorMessage = String(error);
                }
                addLog(`Ошибка: ${errorMessage}`, 'error');
                setNoDevices(true);
            }
        };
        loadDevices();
    }, [setServo1MinAngle, setServo1MaxAngle, setServo2MinAngle, setServo2MaxAngle, addLog]);


    useEffect(() => {
        if (isVirtualBoxActive && isDeviceOrientationSupported) {
            addLog('Автоматическое подключение VirtualBox при загрузке', 'info');

            const userAgent = navigator.userAgent;
            const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
            const iOSVersion = isIOS ? parseInt(userAgent.match(/OS (\d+)_/i)?.[1] || '0', 10) : 0;
            const isAppleDevice = isIOS && iOSVersion >= 13;

            if (isAppleDevice && !hasRequestedPermissions.current) {
                hasRequestedPermissions.current = true;
                addLog('Начало запроса разрешений для DeviceOrientation и DeviceMotion при автоподключении', 'info');

                let orientationPermission = 'denied';
                let motionPermission = 'denied';

                Promise.resolve()
                    .then(() => {
                        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                            addLog('Запрос DeviceOrientationEvent', 'info');
                            return (DeviceOrientationEvent as any).requestPermission();
                        } else if (typeof window.DeviceOrientationEvent !== 'undefined') {
                            addLog('Разрешение DeviceOrientationEvent не требуется', 'info');
                            return 'granted';
                        } else {
                            addLog('DeviceOrientationEvent не поддерживается', 'error');
                            return 'denied';
                        }
                    })
                    .then((result) => {
                        orientationPermission = result;
                        addLog(
                            `Разрешение DeviceOrientationEvent: ${orientationPermission}`,
                            orientationPermission === 'granted' ? 'success' : 'error'
                        );
                        if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
                            addLog('Запрос DeviceMotionEvent', 'info');
                            return (DeviceMotionEvent as any).requestPermission();
                        } else if (typeof window.DeviceMotionEvent !== 'undefined') {
                            addLog('Разрешение DeviceMotionEvent не требуется', 'info');
                            return 'granted';
                        } else {
                            addLog('DeviceMotionEvent не поддерживается', 'error');
                            return 'denied';
                        }
                    })
                    .then((result) => {
                        motionPermission = result;
                        addLog(
                            `Разрешение DeviceMotionEvent: ${motionPermission}`,
                            motionPermission === 'granted' ? 'success' : 'error'
                        );

                        const orientationGranted = orientationPermission === 'granted';
                        const motionGranted = motionPermission === 'granted';
                        setHasOrientationPermission(orientationGranted);
                        setHasMotionPermission(motionGranted);

                        if (!orientationGranted || !motionGranted) {
                            setIsVirtualBoxActive(false);
                            localStorage.setItem('isVirtualBoxActive', JSON.stringify(false));
                            addLog('VirtualBox деактивирован из-за отсутствия разрешений при автоподключении', 'error');
                        }
                    })
                    .catch((error) => {
                        addLog(`Ошибка запроса разрешений при автоподключении: ${String(error)}`, 'error');
                        if (String(error).includes('NotAllowedError')) {
                            addLog('Запрос разрешений требует явного действия пользователя', 'error');
                        }
                        setHasOrientationPermission(false);
                        setHasMotionPermission(false);
                        setIsVirtualBoxActive(false);
                        localStorage.setItem('isVirtualBoxActive', JSON.stringify(false));
                        addLog('VirtualBox деактивирован из-за ошибки разрешений при автоподключении', 'error');
                    })
                    .finally(() => {
                        hasRequestedPermissions.current = false;
                    });
            } else if (!isAppleDevice) {
                const orientationSupported = typeof window.DeviceOrientationEvent !== 'undefined';
                const motionSupported = typeof window.DeviceMotionEvent !== 'undefined';
                setHasOrientationPermission(orientationSupported);
                setHasMotionPermission(motionSupported);
                addLog(
                    `Разрешения для Android: Orientation=${orientationSupported ? 'granted' : 'denied'}, Motion=${motionSupported ? 'granted' : 'denied'}`,
                    orientationSupported && motionSupported ? 'success' : 'error'
                );
                if (!orientationSupported || !motionSupported) {
                    setIsVirtualBoxActive(false);
                    localStorage.setItem('isVirtualBoxActive', JSON.stringify(false));
                    addLog('VirtualBox деактивирован из-за неподдержки сенсоров при автоподключении', 'error');
                }
            }
        }
    }, [isDeviceOrientationSupported, addLog]);

    const handleServoInputChange = useCallback(
        (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
            if (value === '' || (/^[0-9]*$/.test(value) && parseInt(value) <= 180)) {
                setter(value);
            }
        },
        []
    );

    const handleServoInputBlur = useCallback(
        async (field: 'servo1Min' | 'servo1Max' | 'servo2Min' | 'servo2Max', value: string) => {
            try {
                let newValue = value === '' ? 0 : parseInt(value);
                let isValid = true;
                let updateData: {
                    servo1MinAngle?: number;
                    servo1MaxAngle?: number;
                    servo2MinAngle?: number;
                    servo2MaxAngle?: number;
                } = {};

                if (newValue > 180) {
                    newValue = 180;
                    isValid = false;
                }

                if (field === 'servo1Min') {
                    if (newValue > servo1MaxAngle) {
                        newValue = servo1MinAngle;
                        setServo1MinInput(servo1MinAngle.toString());
                        isValid = false;
                    } else {
                        setServo1MinAngle(newValue);
                        setServo1MinInput(newValue.toString());
                        updateData.servo1MinAngle = newValue;
                    }
                } else if (field === 'servo1Max') {
                    if (newValue < servo1MinAngle) {
                        newValue = servo1MaxAngle;
                        setServo1MaxInput(servo1MaxAngle.toString());
                        isValid = false;
                    } else {
                        setServo1MaxAngle(newValue);
                        setServo1MaxInput(newValue.toString());
                        updateData.servo1MaxAngle = newValue;
                    }
                } else if (field === 'servo2Min') {
                    if (newValue > servo2MaxAngle) {
                        newValue = servo2MinAngle;
                        setServo2MinInput(servo2MinAngle.toString());
                        isValid = false;
                    } else {
                        setServo2MinAngle(newValue);
                        setServo2MinInput(newValue.toString());
                        updateData.servo2MinAngle = newValue;
                    }
                } else if (field === 'servo2Max') {
                    if (newValue < servo2MinAngle) {
                        newValue = servo2MaxAngle;
                        setServo2MaxInput(servo2MaxAngle.toString());
                        isValid = false;
                    } else {
                        setServo2MaxAngle(newValue);
                        setServo2MaxInput(newValue.toString());
                        updateData.servo2MaxAngle = newValue;
                    }
                }

                if (isValid && Object.keys(updateData).length > 0) {
                    await updateServoSettings(inputDe, updateData, isProxy);
                    if (socketRef.current?.readyState === WebSocket.OPEN) {
                        if (field === 'servo1Min' || field === 'servo1Max') {
                            socketRef.current.send(JSON.stringify({
                                co: 'SET_SERVO1_LIMITS',
                                pa: { min: servo1MinAngle, max: servo1MaxAngle },
                                de: inputDe,
                                ts: Date.now(),
                                expectAck: true
                            }));
                        } else {
                            socketRef.current.send(JSON.stringify({
                                co: 'SET_SERVO2_LIMITS',
                                pa: { min: servo2MinAngle, max: servo2MaxAngle },
                                de: inputDe,
                                ts: Date.now(),
                                expectAck: true
                            }));
                        }
                    }
                    addLog(`Угол ${field} обновлён: ${newValue}°`, 'success');
                } else if (!isValid) {
                    addLog(`Недопустимое значение для ${field}: ${value}`, 'error');
                }
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                addLog(`Ошибка сохранения ${field}: ${errorMessage}`, 'error');
                if (field === 'servo1Min') setServo1MinInput(servo1MinAngle.toString());
                else if (field === 'servo1Max') setServo1MaxInput(servo1MaxAngle.toString());
                else if (field === 'servo2Min') setServo2MinInput(servo2MinAngle.toString());
                else if (field === 'servo2Max') setServo2MaxInput(servo2MaxAngle.toString());
            }
        },
        [servo1MinAngle, servo1MaxAngle, servo2MinAngle, servo2MaxAngle, inputDe, addLog, setServo1MinAngle, setServo1MaxAngle, setServo2MinAngle, setServo2MaxAngle]
    );

    useEffect(() => {
        const checkOrientation = () => {
            if (window.screen.orientation) {
                setIsLandscape(window.screen.orientation.type.includes('landscape'));
            } else {
                setIsLandscape(window.innerWidth > window.innerHeight);
            }
            const orientationSupported = typeof window.DeviceOrientationEvent !== "undefined";
            const motionSupported = typeof window.DeviceMotionEvent !== "undefined";
            setIsDeviceOrientationSupported(orientationSupported);
            setIsDeviceMotionSupported(motionSupported);
            if (orientationSupported && typeof (DeviceOrientationEvent as any).requestPermission === "function") {
                addLog("DeviceOrientationEvent поддерживается, требуется запрос разрешения", "info");
            } else if (orientationSupported) {
                addLog("DeviceOrientationEvent поддерживается, разрешение не требуется", "info");
            } else {
                addLog("DeviceOrientationEvent не поддерживается", "error");
            }
            if (motionSupported && typeof (DeviceMotionEvent as any).requestPermission === "function") {
                addLog("DeviceMotionEvent поддерживается, требуется запрос разрешения", "info");
            } else if (motionSupported) {
                addLog("DeviceMotionEvent поддерживается, разрешение не требуется", "info");
            } else {
                addLog("DeviceMotionEvent не поддерживается", "error");
            }
        };

        checkOrientation();

        if (window.screen.orientation) {
            window.screen.orientation.addEventListener('change', checkOrientation);
        } else {
            window.addEventListener('resize', checkOrientation);
        }

        return () => {
            if (window.screen.orientation) {
                window.screen.orientation.removeEventListener('change', checkOrientation);
            } else {
                window.removeEventListener('resize', checkOrientation);
            }
        };
    }, [addLog]);

    useEffect(() => {
        currentDeRef.current = inputDe
    }, [inputDe])

    useEffect(() => {
        const isFullyConnected = isConnected && isIdentified && espConnected;
        onConnectionStatusChange?.(isFullyConnected);
    }, [isConnected, isIdentified, espConnected, onConnectionStatusChange]);

    const toggleAutoReconnect = useCallback(async (checked: boolean) => {
        setAutoReconnect(checked);
        try {
            await updateDeviceSettings(inputDe, { autoReconnect: checked });
            addLog(`Автоматическое переподключение: ${checked ? 'включено' : 'выключено'}`, 'success');
        } catch (error: unknown) {
            setAutoReconnect(!checked);
            const errorMessage = error instanceof Error ? error.message : String(error);
            addLog(`Ошибка сохранения autoReconnect: ${errorMessage}`, 'error');
        }
    }, [inputDe, addLog]);

    const toggleAutoConnect = useCallback(async (checked: boolean) => {
        setAutoConnect(checked);
        try {
            await updateDeviceSettings(inputDe, { autoConnect: checked });
            addLog(`Автоматическое подключение: ${checked ? 'включено' : 'выключено'}`, 'success');
        } catch (error: unknown) {
            setAutoConnect(!checked);
            const errorMessage = error instanceof Error ? error.message : String(error);
            addLog(`Ошибка сохранения autoConnect: ${errorMessage}`, 'error');
        }
    }, [inputDe, addLog]);

    const toggleClosedDel = useCallback(async (checked: boolean) => {
        setClosedDel(checked);
        try {
            await updateDeviceSettings(inputDe, { closedDel: checked });
            addLog(`Запрет удаления: ${checked ? 'включен' : 'выключен'}`, 'success');
        } catch (error: unknown) {
            setClosedDel(!checked);
            const errorMessage = error instanceof Error ? error.message : String(error);
            addLog(`Ошибка сохранения closedDel: ${errorMessage}`, 'error');
        }
    }, [inputDe, addLog]);

    const formatDeviceId = (id: string): string => {
        const cleanId = id.replace(/[^A-Z0-9]/gi, '');
        return cleanId.replace(/(.{4})(?=.)/g, '$1-');
    };

    const cleanDeviceId = (id: string): string => {
        return id.replace(/[^A-Z0-9]/gi, '');
    };

    const handleNewDeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value.toUpperCase();
        const cleanInput = input.replace(/[^A-Z0-9]/gi, '');
        if (cleanInput.length <= 16) {
            const formatted = formatDeviceId(cleanInput);
            setNewDe(formatted);
        }
    };

    const isAddDisabled = cleanDeviceId(newDe).length !== 16;

    const handleTelegramPaste = useCallback(
        async (e: React.ClipboardEvent<HTMLInputElement>, field: 'telegramToken' | 'telegramId') => {
            e.preventDefault();
            const pastedText = e.clipboardData.getData('text').trim();

            try {
                if (field === 'telegramToken') {
                    setTelegramTokenInput(pastedText);
                    await updateDeviceSettings(inputDe, {
                        telegramToken: pastedText || null,
                        telegramId: telegramId !== null ? Number(telegramId) : null,
                    });
                    setTelegramToken(pastedText || null);
                    addLog('Telegram Token успешно сохранён', 'success');
                } else {
                    if (!/^[0-9]*$/.test(pastedText)) {
                        addLog('Telegram ID должен содержать только цифры', 'error');
                        return;
                    }
                    const parsedTelegramId = pastedText ? BigInt(pastedText) : null;
                    if (parsedTelegramId === null) {
                        addLog('Telegram ID должен быть числом', 'error');
                        return;
                    }
                    setTelegramIdInput(pastedText);
                    await updateDeviceSettings(inputDe, {
                        telegramToken: telegramTokenInput || null,
                        telegramId: parsedTelegramId !== null ? Number(parsedTelegramId) : null,
                    });
                    setTelegramId(parsedTelegramId);
                    addLog('Telegram ID успешно сохранён', 'success');
                }
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                addLog(`Ошибка сохранения настроек Telegram: ${errorMessage}`, 'error');
                console.error('Ошибка в handleTelegramPaste:', errorMessage);
                if (field === 'telegramToken') {
                    setTelegramTokenInput(telegramToken ?? '');
                } else {
                    setTelegramIdInput(telegramId?.toString() ?? '');
                }
            }
        },
        [inputDe, telegramToken, telegramId, addLog]
    );

    const handleTelegramInputBlur = useCallback(
        async () => {
            try {
                const parsedTelegramId = telegramIdInput ? BigInt(telegramIdInput) : null;
                if (telegramIdInput && parsedTelegramId === null) {
                    throw new Error('Telegram ID должен быть числом');
                }

                await updateDeviceSettings(inputDe, {
                    telegramToken: telegramTokenInput || null,
                    telegramId: parsedTelegramId !== null ? Number(parsedTelegramId) : null,
                });

                setTelegramToken(telegramTokenInput || null);
                setTelegramId(parsedTelegramId);
                addLog('Настройки Telegram успешно сохранены', 'success');
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                addLog(`Ошибка сохранения настроек Telegram: ${errorMessage}`, 'error');
                setTelegramTokenInput(telegramToken ?? '');
                setTelegramIdInput(telegramId?.toString() ?? '');
            }
        },
        [inputDe, telegramTokenInput, telegramIdInput, telegramToken, telegramId, addLog]
    );

    const saveNewDe = useCallback(async () => {
        const cleanId = cleanDeviceId(newDe);
        if (cleanId.length === 16 && !deviceList.includes(cleanId)) {
            try {
                await addDevice(cleanId, autoConnect, autoReconnect, closedDel);
                setDeviceList(prev => [...prev, cleanId]);
                setInputDe(cleanId);
                setDe(cleanId);
                setNoDevices(false);
                setNewDe('');
                currentDeRef.current = cleanId;
                addLog(`Устройство ${cleanId} добавлено`, 'success');
                onDeviceAdded?.(cleanId);
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                addLog(`Ошибка добавления устройства: ${errorMessage}`, 'error');
            }
        }
    }, [newDe, deviceList, autoConnect, autoReconnect, closedDel, addLog, onDeviceAdded]);

    const handleDeleteDevice = useCallback(async () => {
        if (isConnected) {
            addLog('Невозможно удалить устройство: активное соединение с WebSocket', 'error');
            return;
        }
        if (noDevices) {
            addLog('Нет устройств для удаления', 'error');
            return;
        }
        if (closedDel) {
            addLog('Удаление устройства запрещено', 'error');
            return;
        }

        try {
            const roomWithDevice = await getSavedRoomWithDevice(inputDe);
            if (roomWithDevice.deviceId) {
                addLog(`Устройство ${formatDeviceId(inputDe)} привязано к комнате ${roomWithDevice.id}, удаление невозможно`, 'error');
                return;
            }

            if (!confirm("Удалить устройство?")) {
                return;
            }

            await deleteDevice(inputDe);
            const updatedList = deviceList.filter(id => id !== inputDe);
            setDeviceList(updatedList);
            setNoDevices(updatedList.length === 0);
            const defaultDevice = updatedList.length > 0 ? updatedList[0] : '';
            setInputDe(defaultDevice);
            setDe(defaultDevice);
            currentDeRef.current = defaultDevice;
            addLog(`Устройство ${formatDeviceId(inputDe)} удалено`, 'success');
        } catch (error: unknown) {
            console.error('Ошибка при удалении устройства:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            addLog(`Ошибка удаления устройства: ${errorMessage}`, 'error');
        }
    }, [isConnected, noDevices, closedDel, inputDe, deviceList, addLog, formatDeviceId]);

    const cleanupWebSocket = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.onopen = null;
            socketRef.current.onclose = null;
            socketRef.current.onmessage = null;
            socketRef.current.onerror = null;
            if (socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.close();
            }
            socketRef.current = null;
        }
    }, []);

    const toggleServosVisibility = useCallback(async () => {
        try {
            const newState = !showServos;
            setShowServos(newState);
            localStorage.setItem('showServos', JSON.stringify(newState)); // Сохраняем в localStorage
            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                    co: 'SET_SERVO_VIEW',
                    pa: { visible: newState },
                    de: inputDe,
                    ts: Date.now(),
                    expectAck: true
                }));
            }
            await updateServoSettings(inputDe, { servoView: newState });
            addLog(`Видимость сервоприводов: ${newState ? 'включена' : 'выключена'}`, 'success');
        } catch (error: unknown) {
            setShowServos(showServos); // Откатываем значение при ошибке
            const errorMessage = error instanceof Error ? error.message : String(error);
            addLog(`Ошибка servoView: ${errorMessage}`, 'error');
        }
    }, [inputDe, showServos, addLog]);

    const connectWebSocket = useCallback((deToConnect: string) => {
        cleanupWebSocket();
        reconnectAttemptRef.current = 0;
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }

        const ws = new WebSocket(process.env.WEBSOCKET_URL_WSAR || 'wss://ardua.site:444/wsar');

        ws.onopen = () => {
            setIsConnected(true);
            reconnectAttemptRef.current = 0;
            addLog("Подключено к WebSocket серверу", 'server');

            ws.send(JSON.stringify({ ty: "clt", ct: "browser" }));
            ws.send(JSON.stringify({ ty: "idn", de: deToConnect }));
            ws.send(JSON.stringify({ co: "GET_RELAYS", de: deToConnect, ts: Date.now() }));

            sendDeviceSettingsToESP(deToConnect)
                .then(settings => {
                    if (ws.readyState === WebSocket.OPEN) {
                        if (settings.servo1MinAngle !== undefined && settings.servo1MaxAngle !== undefined) {
                            ws.send(
                                JSON.stringify({
                                    co: 'SET_SERVO1_LIMITS',
                                    pa: { min: settings.servo1MinAngle, max: settings.servo1MaxAngle },
                                    de: deToConnect,
                                    ts: Date.now(),
                                    expectAck: true,
                                })
                            );
                        }
                        if (settings.servo2MinAngle !== undefined && settings.servo2MaxAngle !== undefined) {
                            ws.send(
                                JSON.stringify({
                                    co: 'SET_SERVO2_LIMITS',
                                    pa: { min: settings.servo2MinAngle, max: settings.servo2MaxAngle },
                                    de: deToConnect,
                                    ts: Date.now(),
                                    expectAck: true,
                                })
                            );
                        }
                        ws.send(
                            JSON.stringify({
                                co: 'SET_SERVO_VIEW',
                                pa: { visible: settings.servoView },
                                de: deToConnect,
                                ts: Date.now(),
                                expectAck: true,
                            })
                        );
                    }
                })
                .catch((error: unknown) => {
                    console.error('Ошибка отправки настроек на устройство:', error);
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    addLog(`Ошибка отправки настроек: ${errorMessage}`, 'error');
                });
        };

        ws.onmessage = (event) => {
            try {
                const data: MessageType = JSON.parse(event.data);
                console.log('Получено сообщение:', data);
                //console.log('111111111111111111111 ws.onmessage ')
                // обработка подтверждений (ack)
                if (data.ty === 'ack' && data.co === 'RLY' && data.pa) {
                    if (data.pa.pin === '3') {
                        const newState = data.pa.state === "on";
                        setButton1State(newState);
                        updateServoSettings(deToConnect, { b1: newState }).catch((error) => {
                            const errorMessage = error instanceof Error ? error.message : String(error);
                            addLog(`Ошибка сохранения b1: ${errorMessage}`, "error");
                        });
                        addLog(`Реле 1 (3) ${newState ? "включено" : "выключено"}`, "esp");
                    } else if (data.pa.pin === 'D0') {
                        const newState = data.pa.state === "on";
                        setButton2State(newState);
                        updateServoSettings(deToConnect, { b2: newState }).catch((error) => {
                            const errorMessage = error instanceof Error ? error.message : String(error);
                            addLog(`Ошибка сохранения b2: ${errorMessage}`, "error");
                        });
                        addLog(`Реле 2 (D0) ${newState ? "включено" : "выключено"}`, "esp");
                    }
                }

                if (data.ty === 'ack' && data.co === 'ALARM' && data.pa) {
                    const newState = data.pa.state === "on";
                    setButton3State(newState);
                    addLog(`ALARM ${newState ? "включено" : "выключено"}`, "esp");
                }

                if (data.ty === 'sys') {
                    if (data.st === 'con') {
                        setIsIdentified(true);
                        setDe(deToConnect);
                        setEspConnected(true);
                    }
                    addLog(`Система: ${data.me}`, 'server');
                } else if (data.ty === 'err') {
                    addLog(`Ошибка: ${data.me}`, 'error');
                    setIsIdentified(false);
                }
                else if (data.ty === 'log') {
                    // if (data.me === 'HBT' && Date.now() - lastHeartbeatLogTime.current < 1000) {
                    //     return;
                    // }
                    // if (data.me === 'HBT') {
                    //     lastHeartbeatLogTime.current = Date.now();
                    // }
                    // addLog(`ESP: ${data.me}`, 'esp');

                    if (data.b1 !== undefined) {
                        const newState = data.b1 === 'on';
                        setButton1State(newState);
                        addLog(`Реле 1 (3): ${newState ? 'включено' : 'выключено'}`, 'esp');
                    }
                    if (data.b2 !== undefined) {
                        const newState = data.b2 === 'on';
                        setButton2State(newState);
                        addLog(`Реле 2 (D0): ${newState ? 'включено' : 'выключено'}`, 'esp');
                    }
                    if (data.sp1 !== undefined) {
                        setServoAngle(Number(data.sp1));
                        addLog(`Угол сервопривода 1: ${data.sp1}°`, 'esp');
                    }
                    if (data.sp2 !== undefined) {
                        setServo2Angle(Number(data.sp2));
                        addLog(`Угол сервопривода 2: ${data.sp2}°`, 'esp');
                    }
                    if (data.z !== undefined) {
                        const voltage = Number(data.z);
                        setInputVoltage(voltage);
                        addLog(`Напряжение A0: ${voltage.toFixed(2)} В`, 'esp');
                    }
                    if (data.a !== undefined) {
                        setButton3State(data.a === "off" ? false : data.a === "on" ? true : button3State);
                    }
                }
                else if (data.ty === 'est') {
                    console.log(`Статус ESP: ${data.st}`);
                    setEspConnected(data.st === 'con');
                    addLog(`ESP ${data.st === 'con' ? '✅ Подключено' : '❌ Отключено'}`, 'error');
                } else if (data.ty === 'cst') {
                    addLog(`Команда ${data.co} доставлена`, 'client');
                }
            } catch (error: unknown) {
                console.error('Ошибка обработки сообщения:', error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                addLog(`Ошибка обработки сообщения: ${errorMessage}`, 'error');
            }
        };

        ws.onclose = (event) => {
            setIsConnected(false);
            setIsIdentified(false);
            setEspConnected(false);
            addLog(`Отключено от сервера${event.reason ? `: ${event.reason}` : ''}`, 'server');

            if (reconnectAttemptRef.current < 5) {
                reconnectAttemptRef.current += 1;
                const delay = Math.min(5000, reconnectAttemptRef.current * 1000);
                addLog(`Попытка переподключения через ${delay / 1000} секунд... (попытка ${reconnectAttemptRef.current})`, 'server');

                reconnectTimerRef.current = setTimeout(() => {
                    connectWebSocket(currentDeRef.current);
                }, delay);
            } else {
                addLog("Достигнуто максимальное количество попыток переподключения", 'error');
            }
        };

        ws.onerror = (error) => {
            addLog(`Ошибка WebSocket: ${error.type}`, 'error');
        };

        socketRef.current = ws;
    }, [addLog, cleanupWebSocket]);

    const disconnectWebSocket = useCallback(async () => {
        return new Promise<void>(async (resolve, reject) => {
            try {
                if (isConnected && inputDe) {
                    try {
                        sendCommand("SPD", { mo: 'A', sp: 0 });
                        sendCommand("MSA");
                        sendCommand("SPD", { mo: 'B', sp: 0 });
                        sendCommand("MSB");
                        addLog("Команды остановки моторов отправлены через WebSocket", 'success');

                        setMotorASpeed(0);
                        setMotorBSpeed(0);
                        setMotorADirection('stop');
                        setMotorBDirection('stop');
                        lastMotorACommandRef.current = null;
                        lastMotorBCommandRef.current = null;
                        if (motorAThrottleRef.current) {
                            clearTimeout(motorAThrottleRef.current);
                            motorAThrottleRef.current = null;
                        }
                        if (motorBThrottleRef.current) {
                            clearTimeout(motorBThrottleRef.current);
                            motorBThrottleRef.current = null;
                        }
                    } catch (error: unknown) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        addLog(`Ошибка остановки моторов: ${errorMessage}`, 'error');
                    }
                }

                cleanupWebSocket();
                setIsConnected(false);
                setIsIdentified(false);
                setEspConnected(false);
                addLog("Отключено вручную", 'server');
                reconnectAttemptRef.current = 5;

                if (reconnectTimerRef.current) {
                    clearTimeout(reconnectTimerRef.current);
                    reconnectTimerRef.current = null;
                }

                if (autoReconnect || autoConnect) {
                    setAutoReconnect(false);
                    setAutoConnect(false);
                    try {
                        await updateDeviceSettings(inputDe, {
                            autoReconnect: false,
                            autoConnect: false,
                        });
                        addLog("Автоматическое переподключение и подключение отключены", 'success');
                    } catch (error: unknown) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        addLog(`Ошибка сохранения настроек устройства: ${errorMessage}`, 'error');
                    }
                }

                resolve();
            } catch (error) {
                addLog(`Ошибка при отключении WebSocket: ${String(error)}`, 'error');
                reject(error);
            }
        });
    }, [
        addLog,
        cleanupWebSocket,
        isConnected,
        inputDe,
        autoReconnect,
        autoConnect,
        updateDeviceSettings,
        setMotorASpeed,
        setMotorBSpeed,
        setMotorADirection,
        setMotorBDirection,
    ]);

    useEffect(() => {
        if (onDisconnectWebSocket) {
            onDisconnectWebSocket.disconnectWebSocket = disconnectWebSocket;
        }
        return () => {
            if (onDisconnectWebSocket) {
                onDisconnectWebSocket.disconnectWebSocket = undefined;
            }
        };
    }, [onDisconnectWebSocket, disconnectWebSocket]);

    useEffect(() => {
        if (selectedDeviceId && selectedDeviceId !== inputDe) {
            const reconnect = async () => {
                try {
                    await disconnectWebSocket();
                    setInputDe(selectedDeviceId);
                    currentDeRef.current = selectedDeviceId;
                    connectWebSocket(selectedDeviceId);
                    addLog(`Переподключено к устройству ${formatDeviceId(selectedDeviceId)} из-за смены комнаты`, 'success');
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    addLog(`Ошибка переподключения устройства: ${errorMessage}`, 'error');
                }
            };
            reconnect();
        }
    }, [selectedDeviceId, inputDe, disconnectWebSocket, connectWebSocket, addLog, formatDeviceId]);

    useEffect(() => {
        if (autoConnect && !isConnected) {
            connectWebSocket(currentDeRef.current);
        }
    }, [autoConnect, connectWebSocket, isConnected]);

    const handleDeviceChange = useCallback(async (value: string) => {
        if (noDevices) {
            addLog('Нет добавленных устройств', 'error');
            return;
        }
        if (selectedDeviceId) {
            addLog('Невозможно сменить устройство: оно привязано к комнате', 'error');
            return;
        }
        if (value === inputDe) {
            return;
        }
        setInputDe(value);
        currentDeRef.current = value;
        try {
            const devices = await getDevices();
            const selectedDevice = devices.find(device => device.idDevice === value);
            if (selectedDevice) {
                setAutoConnect(selectedDevice.autoConnect ?? false);
                setClosedDel(selectedDevice.closedDel ?? false);
                setTelegramToken(selectedDevice.telegramToken ?? null);
                setTelegramId(selectedDevice.telegramId ?? null);
                setTelegramTokenInput(selectedDevice.telegramToken ?? '');
                setTelegramIdInput(selectedDevice.telegramId?.toString() ?? '');
                if (selectedDevice.settings && selectedDevice.settings[0]) {
                    setServo1MinAngle(selectedDevice.settings[0].servo1MinAngle || 0);
                    setServo1MaxAngle(selectedDevice.settings[0].servo1MaxAngle || 180);
                    setServo2MinAngle(selectedDevice.settings[0].servo2MinAngle || 0);
                    setServo2MaxAngle(selectedDevice.settings[0].servo2MaxAngle || 180);
                    setButton1State(selectedDevice.settings[0].b1 ?? false);
                    setButton2State(selectedDevice.settings[0].b2 ?? false);
                    setShowServos(selectedDevice.settings[0].servoView ?? true);
                    setServo1MinInput((selectedDevice.settings[0].servo1MinAngle || 0).toString());
                    setServo1MaxInput((selectedDevice.settings[0].servo1MaxAngle || 180).toString());
                    setServo2MinInput((selectedDevice.settings[0].servo2MinAngle || 0).toString());
                    setServo2MaxInput((selectedDevice.settings[0].servo2MaxAngle || 180).toString());
                }
                if (selectedDevice.autoReconnect) {
                    setAutoReconnect(true);
                    await updateDeviceSettings(value, { autoReconnect: true });
                    await disconnectWebSocket();
                    connectWebSocket(value);
                    addLog(`Переподключено к устройству ${formatDeviceId(value)}`, 'success');
                } else {
                    setAutoReconnect(false);
                    await updateDeviceSettings(value, { autoReconnect: false });
                    await disconnectWebSocket();
                    addLog(`Устройство ${formatDeviceId(value)} выбрано, но автоматическое переподключение отключено`, 'info');
                }
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            addLog(`Ошибка при смене устройства: ${errorMessage}`, 'error');
        }
    }, [noDevices, selectedDeviceId, inputDe, disconnectWebSocket, connectWebSocket, addLog, setServo1MinAngle, setServo1MaxAngle, setServo2MinAngle, setServo2MaxAngle, updateDeviceSettings, formatDeviceId]);

    const sendCommand = useCallback((co: string, pa?: any) => {
        if (!isIdentified) {
            return; // Убрали addLog
        }

        if (socketRef.current?.readyState === WebSocket.OPEN) {
            const msg = JSON.stringify({
                co,
                pa,
                de,
            });

            socketRef.current.send(msg);
            // Убрали addLog
        } else {
            // Убрали addLog
        }
    }, [de, isIdentified]);

    useEffect(() => {
        if (!isConnected || !isIdentified || (motorASpeed <= 0 && motorBSpeed <= 0)) return;

        const interval = setInterval(() => {
            sendCommand("HBT");
        }, 300);

        return () => clearInterval(interval);
    }, [isConnected, isIdentified, motorASpeed, motorBSpeed, sendCommand]);

    const createMotorHandler = useCallback((mo: 'A' | 'B') => {
        const lastCommandRef = mo === 'A' ? lastMotorACommandRef : lastMotorBCommandRef;
        const throttleRef = mo === 'A' ? motorAThrottleRef : motorBThrottleRef;
        const setSpeed = mo === 'A' ? setMotorASpeed : setMotorBSpeed;
        const setDirection = mo === 'A' ? setMotorADirection : setMotorBDirection;

        return (value: number) => {
            if (!isConnected) return;

            let direction: 'forward' | 'backward' | 'stop' = 'stop';
            let sp = 0;

            if (value > 0) {
                direction = 'forward';
                sp = value;
            } else if (value < 0) {
                direction = 'backward';
                sp = -value;
            }

            setSpeed(sp);
            setDirection(direction);

            const currentCommand = { sp, direction };
            if (JSON.stringify(lastCommandRef.current) === JSON.stringify(currentCommand)) {
                return;
            }

            lastCommandRef.current = currentCommand;

            if (sp === 0) {
                if (throttleRef.current) {
                    clearTimeout(throttleRef.current);
                    throttleRef.current = null;
                }
                console.log('Motor Command:', { mo, sp, direction }); // Отладка
                sendCommand("SPD", { mo, sp: 0 });
                sendCommand(mo === 'A' ? "MSA" : "MSB");
                return;
            }

            if (throttleRef.current) {
                clearTimeout(throttleRef.current);
            }

            throttleRef.current = setTimeout(() => {
                console.log('Motor Command:', { mo, sp, direction }); // Отладка
                sendCommand("SPD", { mo, sp });
                sendCommand(direction === 'forward' ? `MF${mo}` : `MR${mo}`);
            }, 40);
        };
    }, [sendCommand, isConnected]);

    const adjustServo = useCallback(
        (servoId: '1' | '2', value: number, isAbsolute: boolean) => {
            const currentAngle = servoId === '1' ? servoAngle : servo2Angle;
            const minAngle = servoId === '1' ? servo1MinAngle : servo2MinAngle;
            const maxAngle = servoId === '1' ? servo1MaxAngle : servo2MaxAngle;

            let newAngle;
            if (isAbsolute) {
                newAngle = Math.max(minAngle, Math.min(maxAngle, value));
            } else {
                newAngle = Math.max(minAngle, Math.min(maxAngle, currentAngle + value));
            }

            sendCommand(servoId === '1' ? 'SSY' : 'SSX', { an: newAngle });
            // Убрали addLog
        },
        [servoAngle, servo2Angle, servo1MinAngle, servo1MaxAngle, servo2MinAngle, servo2MaxAngle, sendCommand]
    );

    const adjustServoAxis = useCallback(
        (servoId: '1', value: { an: number; ak: number }) => {
            sendCommand('SAR', { an: value.an, ak: value.ak });
            addLog(`Установлены углы сервоприводов: Servo1=${value.an}°, Servo2=${value.ak}°`, 'info');
        },
        [servoAngle, servo2Angle, sendCommand, addLog]
    );


    const adjustServoCheck = useCallback(
        (servoId: '1' | '2', value: number, isAbsolute: boolean) => {
            const currentAngle = servoId === '1' ? servoAngle : servo2Angle;
            const minAngle = servoId === '1' ? servo1MinAngle : servo2MinAngle;
            const maxAngle = servoId === '1' ? servo1MaxAngle : servo2MaxAngle;

            sendCommand(servoId === '1' ? 'SSA' : 'SSB', { an: value });
            // Убрали addLog
        },
        [servoAngle, servo2Angle, servo1MinAngle, servo1MaxAngle, servo2MinAngle, servo2MaxAngle, sendCommand]
    );

    const handleMotorAControl = createMotorHandler('A');
    const handleMotorBControl = createMotorHandler('B');

    const emergencyStop = useCallback(() => {
        sendCommand("SPD", { mo: 'A', sp: 0 });
        sendCommand("SPD", { mo: 'B', sp: 0 });
        setMotorASpeed(0);
        setMotorBSpeed(0);
        setMotorADirection('stop');
        setMotorBDirection('stop');

        if (motorAThrottleRef.current) clearTimeout(motorAThrottleRef.current);
        if (motorBThrottleRef.current) clearTimeout(motorBThrottleRef.current);
    }, [sendCommand]);

    useEffect(() => {
        return () => {
            cleanupWebSocket();
            if (motorAThrottleRef.current) clearTimeout(motorAThrottleRef.current);
            if (motorBThrottleRef.current) clearTimeout(motorBThrottleRef.current);
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        };
    }, [cleanupWebSocket]);

    const handleOpenControls = useCallback(() => {
        setActiveTab(null);
        if (noDevices) {
            addLog('Нет добавленных устройств', 'error');
            return;
        }
        if (!inputDe) {
            addLog('Выберите устройство для подключения', 'error');
            return;
        }
        if (!isConnected) {
            connectWebSocket(inputDe);
            addLog(`Попытка подключения к устройству ${formatDeviceId(inputDe)}`, 'info');
        } else {
            addLog('WebSocket уже подключён', 'info');
        }
    }, [noDevices, inputDe, isConnected, connectWebSocket, addLog, formatDeviceId]);

    const handleCloseControls = () => {
        setActiveTab(activeTab === 'controls' ? null : 'controls');
        setShowJoystickMenu(false);
    };

    const singleValueJoystickComponents = {
        Joystick: Joystick,
        JoystickUp: JoystickUp,
    };

    const dualValueJoystickComponents = {
        JoystickTurn: JoystickVertical,
        JoystickHorizontal: JoystickHorizontal,
        JoyAnalog: JoyAnalog,
        Keyboard: Keyboard,
        ButtonControl: ButtonControl,
    };

    const ActiveJoystick = singleValueJoystickComponents[selectedJoystick as keyof typeof singleValueJoystickComponents] || dualValueJoystickComponents[selectedJoystick as keyof typeof dualValueJoystickComponents];

    return (
        <div className="flex flex-col items-center min-h-[calc(100vh-3rem)] p-4 overflow-hidden relative no-select">
            {activeTab === 'controls' && (
                <div className="absolute top-14 left-1/2 transform -translate-x-1/2 w-full max-w-md z-50">
                    <div
                        className="space-y-2 bg-black rounded-lg p-2 sm:p-2 border border-gray-200"
                        style={{ maxHeight: '90vh', overflowY: 'auto' }}
                    >
                        <Button
                            onClick={handleCloseControls}
                            className="absolute top-0 right-1 bg-transparent hover:bg-gray-700/30 p-1 rounded-full transition-all"
                            title="Закрыть"
                        >
                            <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300" />
                        </Button>
                        <div className="flex flex-col items-center space-y-2">
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${isConnected
                                    ? (isIdentified
                                        ? (espConnected ? 'bg-green-500' : 'bg-yellow-500')
                                        : 'bg-yellow-500')
                                    : 'bg-red-500'
                                }`}></div>
                                <span className="text-xs sm:text-sm font-medium text-gray-600">
                                    {isConnected
                                        ? (isIdentified
                                            ? (espConnected ? 'Подключено' : 'Ожидание ESP')
                                            : 'Подключение...')
                                        : 'Отключено'}
                                </span>
                            </div>
                        </div>

                        <div className="flex space-x-2">
                            <Button
                                onClick={handleOpenControls}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-8 sm:h-10 text-xs sm:text-sm"
                                disabled={noDevices}
                            >
                                Управление
                            </Button>
                            <Button
                                onClick={disconnectWebSocket}
                                disabled={!isConnected}
                                className="flex-1 bg-red-600 hover:bg-red-700 h-8 sm:h-10 text-xs sm:text-sm"
                            >
                                Разъединить
                            </Button>
                        </div>

                        <div className="flex space-x-2">
                            <Select
                                value={selectedDeviceId || inputDe}
                                onValueChange={handleDeviceChange}
                                disabled={isProxy || (isConnected && !autoReconnect)}
                            >
                                <SelectTrigger className="flex-1 bg-transparent h-8 sm:h-10">
                                    <SelectValue placeholder={noDevices ? "Устройства еще не добавлены" : "Выберите устройство"} />
                                </SelectTrigger>
                                <SelectContent className="bg-transparent border border-gray-200">
                                    {deviceList.map(id => (
                                        <SelectItem key={id} value={id} className="hover:bg-gray-100/50 text-xs sm:text-sm">
                                            {formatDeviceId(id)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                onClick={handleDeleteDevice}
                                disabled={isConnected || closedDel || !!selectedDeviceId || noDevices}
                                className="bg-red-600 hover:bg-red-700 h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm"
                            >
                                Удалить
                            </Button>
                        </div>

                        <div className="space-y-1 sm:space-y-2">
                            <Label className="block text-xs sm:text-sm font-medium text-gray-700">Добавить новое устройство</Label>
                            <div className="flex space-x-2">
                                <Input
                                    value={newDe}
                                    disabled={isProxy}
                                    onChange={handleNewDeChange}
                                    placeholder="XXXX-XXXX-XXXX-XXXX"
                                    className="flex-1 bg-transparent h-8 sm:h-10 text-xs sm:text-sm uppercase"
                                    maxLength={19}
                                />
                                <Button
                                    onClick={saveNewDe}
                                    disabled={isAddDisabled || isProxy}
                                    className="bg-blue-600 hover:bg-blue-700 h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm"
                                >
                                    Добавить
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="auto-reconnect"
                                    checked={isProxy ? true : autoReconnect}
                                    onCheckedChange={isProxy ? undefined : toggleAutoReconnect}
                                    className={`border-gray-300 w-4 h-4 sm:w-5 sm:h-5 ${isProxy || autoReconnect ? 'bg-green-500' : 'bg-white'}`}
                                    disabled={noDevices || isProxy}
                                />
                                <Label htmlFor="auto-reconnect" className="text-xs sm:text-sm font-medium text-gray-700">
                                    Автоматическое переподключение при смене устройства
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="auto-connect"
                                    checked={isProxy ? true : autoConnect}
                                    onCheckedChange={isProxy ? undefined : toggleAutoConnect}
                                    className={`border-gray-300 w-4 h-4 sm:w-5 sm:h-5 ${isProxy || autoConnect ? 'bg-green-500' : 'bg-white'}`}
                                    disabled={noDevices || isProxy}
                                />
                                <Label htmlFor="auto-connect" className="text-xs sm:text-sm font-medium text-gray-700">
                                    Автоматическое подключение при загрузке страницы
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="closed-del"
                                    checked={isProxy ? true : closedDel}
                                    onCheckedChange={isProxy ? undefined : toggleClosedDel}
                                    className={`border-gray-300 w-4 h-4 sm:w-5 sm:h-5 ${isProxy || closedDel ? 'bg-green-500' : 'bg-white'}`}
                                    disabled={noDevices || isProxy}
                                />
                                <Label htmlFor="closed-del" className="text-xs sm:text-sm font-medium text-gray-700">
                                    Запретить удаление устройств
                                </Label>
                            </div>
                        </div>

                        <div className="space-y-2 sm:space-y-3">
                            <Accordion type="single" collapsible>
                                <AccordionItem value="telegram-settings">
                                    <AccordionTrigger className="text-xs sm:text-sm font-medium text-gray-700">
                                        Настройки Telegram
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-2">
                                            <div>
                                                <Label htmlFor="telegram-token" className="text-xs sm:text-sm">Telegram Token</Label>
                                                <Input
                                                    id="telegram-token"
                                                    type="text"
                                                    value={telegramTokenInput}
                                                    onChange={(e) => setTelegramTokenInput(e.target.value)}
                                                    onPaste={(e) => handleTelegramPaste(e, 'telegramToken')}
                                                    onBlur={handleTelegramInputBlur}
                                                    placeholder="Введите токен"
                                                    className="bg-gray-700 text-white border-gray-600 h-8 sm:h-10 text-xs sm:text-sm"
                                                    disabled={noDevices || isProxy}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="telegram-id" className="text-xs sm:text-sm">Telegram ID</Label>
                                                <Input
                                                    id="telegram-id"
                                                    type="text"
                                                    value={telegramIdInput}
                                                    onChange={(e) => setTelegramIdInput(e.target.value)}
                                                    onPaste={(e) => handleTelegramPaste(e, 'telegramId')}
                                                    onBlur={handleTelegramInputBlur}
                                                    placeholder="Введите ID"
                                                    className="bg-gray-700 text-white border-gray-600 h-8 sm:h-10 text-xs sm:text-sm"
                                                    disabled={noDevices || isProxy}
                                                />
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>

                        {/*<div className="space-y-2 sm:space-y-3">*/}
                        {/*    <Label className="block text-xs sm:text-sm font-medium text-gray-700">Настройки сервоприводов</Label>*/}
                        {/*    <div className="grid grid-cols-2 gap-2">*/}
                        {/*        <div>*/}
                        {/*            <Label htmlFor="servo1-min" className="text-xs sm:text-sm">Servo 1 Min (°)</Label>*/}
                        {/*            <Input*/}
                        {/*                type="text"*/}
                        {/*                value={servo1MinInput}*/}
                        {/*                onChange={(e) => handleServoInputChange(setServo1MinInput, e.target.value)}*/}
                        {/*                onBlur={(e) => handleServoInputBlur('servo1Min', e.target.value)}*/}
                        {/*                placeholder="0"*/}
                        {/*                className="bg-gray-700 text-white border-gray-600"*/}
                        {/*                disabled={noDevices || isProxy}*/}
                        {/*            />*/}
                        {/*        </div>*/}
                        {/*        <div>*/}
                        {/*            <Label htmlFor="servo1-max" className="text-xs sm:text-sm">Servo 1 Max (°)</Label>*/}
                        {/*            <Input*/}
                        {/*                type="text"*/}
                        {/*                value={servo1MaxInput}*/}
                        {/*                onChange={(e) => handleServoInputChange(setServo1MaxInput, e.target.value)}*/}
                        {/*                onBlur={(e) => handleServoInputBlur('servo1Max', e.target.value)}*/}
                        {/*                placeholder="0"*/}
                        {/*                className={`bg-gray-700 text-white border-gray-600 ${parseInt(servo1MaxInput || '0') < servo1MinAngle ? 'border-red-500' : ''}`}*/}
                        {/*                disabled={noDevices || isProxy}*/}
                        {/*            />*/}
                        {/*        </div>*/}
                        {/*        <div>*/}
                        {/*            <Label htmlFor="servo2-min" className="text-xs sm:text-sm">Servo 2 Min (°)</Label>*/}
                        {/*            <Input*/}
                        {/*                type="text"*/}
                        {/*                value={servo2MinInput}*/}
                        {/*                onChange={(e) => handleServoInputChange(setServo2MinInput, e.target.value)}*/}
                        {/*                onBlur={(e) => handleServoInputBlur('servo2Min', e.target.value)}*/}
                        {/*                placeholder="0"*/}
                        {/*                className="bg-gray-700 text-white border-gray-600"*/}
                        {/*                disabled={noDevices || isProxy}*/}
                        {/*            />*/}
                        {/*        </div>*/}
                        {/*        <div>*/}
                        {/*            <Label htmlFor="servo2-max" className="text-xs sm:text-sm">Servo 2 Max (°)</Label>*/}
                        {/*            <Input*/}
                        {/*                type="text"*/}
                        {/*                value={servo2MaxInput}*/}
                        {/*                onChange={(e) => handleServoInputChange(setServo2MaxInput, e.target.value)}*/}
                        {/*                onBlur={(e) => handleServoInputBlur('servo2Max', e.target.value)}*/}
                        {/*                placeholder="0"*/}
                        {/*                className={`bg-gray-700 text-white border-gray-600 ${parseInt(servo2MaxInput || '0') < servo2MinAngle ? 'border-red-500' : ''}`}*/}
                        {/*                disabled={noDevices || isProxy}*/}
                        {/*            />*/}
                        {/*        </div>*/}
                        {/*    </div>*/}
                        {/*</div>*/}

                        <Button
                            onClick={() => setLogVisible(!logVisible)}
                            variant="outline"
                            className="w-full border-gray-300 bg-transparent hover:bg-gray-100/50 h-8 sm:h-10 text-xs sm:text-sm"
                        >
                            {logVisible ? (
                                <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            ) : (
                                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            )}
                            {logVisible ? "Скрыть логи" : "Показать логи"}
                        </Button>

                        {logVisible && (
                            <div className="border border-gray-200 rounded-md overflow-hidden bg-transparent">
                                <div className="h-32 sm:h-48 overflow-y-auto p-2 bg-transparent text-xs font-mono">
                                    {log.length === 0 ? (
                                        <div className="text-gray-500 italic">Логов пока нет</div>
                                    ) : (
                                        log.slice().reverse().map((entry, index) => (
                                            <div
                                                key={index}
                                                className={`truncate py-1 ${entry.ty === 'client' ? 'text-blue-600' :
                                                    entry.ty === 'esp' ? 'text-green-600' :
                                                        entry.ty === 'server' ? 'text-purple-600' :
                                                            entry.ty === 'success' ? 'text-teal-600' :
                                                                entry.ty === 'info' ? 'text-gray-600' :
                                                                    'text-red-600 font-semibold'
                                                }`}
                                            >
                                                {entry.me}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className={`mt-24 ${activeTab === 'controls' ? 'opacity-50' : ''}`}>
                {selectedJoystick === 'Joystick' || selectedJoystick === 'JoystickUp' ? (
                    <>
                        <ActiveJoystick
                            mo="A"
                            onChange={handleMotorAControl}
                            direction={motorADirection}
                            sp={motorASpeed}
                            disabled={!isConnected}
                        />
                        <ActiveJoystick
                            mo="B"
                            onChange={handleMotorBControl}
                            direction={motorBDirection}
                            sp={motorBSpeed}
                            disabled={!isConnected}
                        />
                    </>
                ) : selectedJoystick === 'JoystickTurn' ? (
                    <>
                        <JoystickVertical
                            onChange={({ x, y }) => {
                                handleMotorAControl(x);
                                handleMotorBControl(y);
                            }}
                            direction={motorADirection}
                            sp={motorASpeed}
                            disabled={!isConnected}
                        />
                        <JoystickHorizontal
                            onChange={({ x, y }) => {
                                handleMotorAControl(x);
                                handleMotorBControl(y);
                            }}
                            disabled={!isConnected}
                        />
                    </>
                ) : selectedJoystick === 'JoyAnalog' ? (
                    <JoyAnalog
                        onChange={({ x, y }) => {
                            handleMotorAControl(x);
                            handleMotorBControl(y);
                        }}
                        onServoChange={adjustServo}
                        onServoChangeCheck={adjustServoCheck}
                        onRelayChange={(pin, state) => {
                            if (pin === "D0" && state === "toggle") {
                                const newState = button2State ? "off" : "on";
                                sendCommand("RLY", { pin: "D0", state: newState });
                                addLog(`Реле D0 переключено в ${newState}`, "info");
                            } else if (pin === "3" && state === "toggle") {
                                const newState = button1State ? "off" : "on";
                                sendCommand("RLY", { pin: "3", state: newState });
                                addLog(`Реле 3 переключено в ${newState}`, "info");
                            }
                        }}
                        disabled={!isConnected}
                    />
                ) : selectedJoystick === 'Keyboard' ? (
                    <Keyboard
                        onChange={({ x, y }) => {
                            handleMotorAControl(x);
                            handleMotorBControl(y);
                        }}
                        onServoChange={adjustServo}
                        onServoChangeCheck={adjustServoCheck}
                        onRelayChange={(pin, state) => {
                            if (pin === "D0" && state === "toggle") {
                                const newState = button2State ? "off" : "on";
                                sendCommand("RLY", { pin: "D0", state: newState });
                                addLog(`Реле D0 переключено в ${newState}`, "info");
                            } else if (pin === "3" && state === "toggle") {
                                const newState = button1State ? "off" : "on";
                                sendCommand("RLY", { pin: "3", state: newState });
                                addLog(`Реле 3 переключено в ${newState}`, "info");
                            }
                        }}
                        disabled={!isConnected}
                    />
                ) : selectedJoystick === 'ButtonControl' ? (
                    <ButtonControl
                        onChange={({ x, y }) => {
                            handleMotorAControl(x);
                            handleMotorBControl(y);
                        }}
                        onServoChange={adjustServo}
                        onServoChangeCheck={adjustServoCheck}
                        onRelayChange={(pin, state) => {
                            if (pin === "D0" && state === "toggle") {
                                const newState = button2State ? "off" : "on";
                                sendCommand("RLY", { pin: "D0", state: newState });
                                addLog(`Реле D0 переключено в ${newState}`, "info");
                            } else if (pin === "3" && state === "toggle") {
                                const newState = button1State ? "off" : "on";
                                sendCommand("RLY", { pin: "3", state: newState });
                                addLog(`Реле 3 переключено в ${newState}`, "info");
                            }
                        }}
                        disabled={!isConnected}
                    />
                ) : null}
                {isDeviceOrientationSupported && isVirtualBoxActive && (
                    <VirtualBox
                        onServoChange={adjustServoAxis}
                        onOrientationChange={handleOrientationChange}
                        disabled={!isConnected}
                        isVirtualBoxActive={isVirtualBoxActive}
                        hasOrientationPermission={hasOrientationPermission}
                        hasMotionPermission={hasMotionPermission}
                        isOrientationSupported={isDeviceOrientationSupported}
                        isMotionSupported={isDeviceMotionSupported}
                    />
                )}

                <div className="fixed bottom-3 left-1/2 transform -translate-x-1/2 flex flex-col space-y-2 z-50">
                    {showServos && (
                        <>
                            <div className="flex flex-col items-center">
                                <div className="flex items-center justify-center space-x-2">
                                    <span className="text-sm font-medium text-green-300 mt-1">{servoAngle}°</span>
                                    <span className="text-sm font-medium text-green-300 mt-1">{servo2Angle}°</span>
                                </div>

                                <div className="flex items-center justify-center space-x-2">
                                    <Button
                                        onClick={() => adjustServo('1', 0, true)}
                                        className="bg-transparent hover:bg-gray-700/30 p-2 rounded-full transition-all flex items-center"
                                    >
                                        <img width={'25px'} height={'25px'} src="/arrow/twotone-keyboard-double-arrow-down.svg" alt="0°" />
                                    </Button>
                                    <Button
                                        onClick={() => adjustServoCheck('1', -5, false)}
                                        className="bg-transparent hover:bg-gray-700/30 p-2 rounded-full transition-all flex items-center"
                                    >
                                        <img width={'25px'} height={'25px'} src="/arrow/arrow-down-2-thin.svg" alt="-15°" />
                                    </Button>
                                    <Button
                                        onClick={() => adjustServo('1', 90, true)}
                                        className="bg-transparent hover:bg-gray-700/30 p-2 rounded-full transition-all flex items-center"
                                    >
                                        <img width={'25px'} height={'25px'} src="/arrow/two-arrow-in-down-up.svg" alt="90°" />
                                    </Button>
                                    <Button
                                        onClick={() => adjustServoCheck('1', 5, false)}
                                        className="bg-transparent hover:bg-gray-700/30 p-2 rounded-full transition-all flex items-center"
                                    >
                                        <img width={'25px'} height={'25px'} src="/arrow/arrow-up-2.svg" alt="+15°" />
                                    </Button>
                                    <Button
                                        onClick={() => adjustServo('1', 180, true)}
                                        className="bg-transparent hover:bg-gray-700/30 p-2 rounded-full transition-all flex items-center"
                                    >
                                        <img width={'25px'} height={'25px'} src="/arrow/twotone-keyboard-double-arrow-up.svg" alt="180°" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="flex items-center justify-center space-x-2">
                                    <Button
                                        onClick={() => adjustServo('2', 180, true)}
                                        className="bg-transparent hover:bg-gray-700/30 p-2 rounded-full transition-all flex items-center"
                                    >
                                        <img width={'25px'} height={'25px'} src="/arrow/twotone-keyboard-double-arrow-left.svg" />
                                    </Button>
                                    <Button
                                        onClick={() => adjustServoCheck('2', 5, false)}
                                        className="bg-transparent hover:bg-gray-700/30 p-2 rounded-full transition-all flex items-center"
                                    >
                                        <img width={'25px'} height={'25px'} src="/arrow/arrow-left-2.svg" alt="+15°" />
                                    </Button>
                                    <Button
                                        onClick={() => adjustServo('2', 90, true)}
                                        className="bg-transparent hover:bg-gray-700/30 p-2 rounded-full transition-all flex items-center"
                                    >
                                        <img width={'25px'} height={'25px'} src="/arrow/two-arrow-in-left-right.svg" />
                                    </Button>
                                    <Button
                                        onClick={() => adjustServoCheck('2', -5, false)}
                                        className="bg-transparent hover:bg-gray-700/30 p-2 rounded-full transition-all flex items-center"
                                    >
                                        <img width={'25px'} height={'25px'} src="/arrow/arrow-right-2.svg" alt="-15°" />
                                    </Button>
                                    <Button
                                        onClick={() => adjustServo('2', 0, true)}
                                        className="bg-transparent hover:bg-gray-700/30 p-2 rounded-full transition-all flex items-center"
                                    >
                                        <img width={'25px'} height={'25px'} src="/arrow/twotone-keyboard-double-arrow-right.svg" alt="180°" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                    <div className="flex items-center justify-center space-x-2">
                        {/*{isVirtualBoxActive && (*/}
                        {/*    <span className="text-sm font-medium text-green-300 bg-black/50 px-2 py-1 rounded">*/}
                        {/*        X: {orientationData.beta !== null ? orientationData.beta.toFixed(2) : 'N/A'}°*/}
                        {/*        Y: {orientationData.gamma !== null ? orientationData.gamma.toFixed(2) : 'N/A'}°*/}
                        {/*        Z: {orientationData.alpha !== null ? orientationData.alpha.toFixed(2) : 'N/A'}°*/}
                        {/*    </span>*/}
                        {/*)}*/}
                        {inputVoltage !== null && button2State ? (
                            <span className="text-xl font-medium text-green-600 bg-transparent rounded-full flex items-center justify-center">
                                {inputVoltage.toFixed(2)}
                            </span>
                        ) : (
                            <span className="text-xl font-medium text-green-600 bg-transparent rounded-full flex items-center justify-center">
                                {inputVoltage !== null && inputVoltage < 1 ? <span>Motion</span> : <span>Alarm</span>}
                            </span>
                        )}
                        <Button
                            onClick={() => {
                                const newState = button3State ? "off" : "on"; // Переключаем состояние
                                //setButton1State(!button1State); // Обновляем button1State
                                sendCommand("ALARM", { state: newState });
                            }}
                            className="bg-transparent hover:bg-gray-700/30 border border-gray-600 p-2 rounded-full transition-all flex items-center"
                        >
                            {button3State ? (
                                <img width={"25px"} height={"25px"} src="/alarm/alarm-on.svg" alt="Image" />
                            ) : (
                                <img width={"25px"} height={"25px"} src="/alarm/alarm-off.svg" alt="Image" />
                            )}
                        </Button>

                    </div>



                    <div className="flex items-center justify-center space-x-2">
                        {button1State !== null && (
                            <Button
                                onClick={() => {
                                    const newState = button1State ? "off" : "on"; // Переключаем состояние
                                    //setButton1State(!button1State); // Обновляем button1State
                                    sendCommand("RLY", { pin: "3", state: newState });
                                    addLog(`Реле 3 переключено в ${newState}`, "info");
                                }}
                                className="bg-transparent hover:bg-gray-700/30 border border-gray-600 p-2 rounded-full transition-all flex items-center"
                            >
                                {button1State ? (
                                    <img width={"25px"} height={"25px"} src="/off.svg" alt="Image" />
                                ) : (
                                    <img width={"25px"} height={"25px"} src="/on.svg" alt="Image" />
                                )}
                            </Button>
                        )}

                        {button2State !== null && isProxySocket === false && (
                            <Button
                                onClick={() => {
                                    const newState = button2State ? 'off' : 'on';
                                    //setButton2State(!button2State); // Обновляем button1State
                                    sendCommand('RLY', { pin: 'D0', state: newState });
                                    addLog(`Реле D0 переключено в ${newState}`, "info");
                                }}
                                className="bg-transparent hover:bg-gray-700/30 border border-gray-600 p-2 rounded-full transition-all flex items-center"
                            >
                                {button2State ? (
                                    <img width={'25px'} height={'25px'} src="/off.svg" alt="Image" />
                                ) : (
                                    <img width={'25px'} height={'25px'} src="/on.svg" alt="Image" />
                                )}
                            </Button>
                        )}

                        <Button
                            onClick={() => setActiveTab(activeTab === 'controls' ? null : 'controls')}
                            className="bg-transparent hover:bg-gray-700/30 border border-gray-600 p-2 rounded-full transition-all flex items-center"
                            title="Настройки"
                        >
                            {activeTab === 'controls' ? (
                                <img width={'25px'} height={'25px'} src="/settings2.svg" alt="Image" />
                            ) : (
                                <img width={'25px'} height={'25px'} src="/settings1.svg" alt="Image" />
                            )}
                        </Button>

                        <Button
                            onClick={toggleServosVisibility}
                            className="bg-transparent hover:bg-gray-700/30 border border-gray-600 p-2 rounded-full transition-all flex items-center"
                            title={showServos ? 'Скрыть сервоприводы' : 'Показать сервоприводы'}
                        >
                            {showServos ? (
                                <img width={'25px'} height={'25px'} src="/turn2.svg" alt="Image" />
                            ) : (
                                <img width={'25px'} height={'25px'} src="/turn1.svg" alt="Image" />
                            )}
                        </Button>

                        <div className="relative">
                            <Button
                                onClick={() => {
                                    setShowJoystickMenu(!showJoystickMenu);
                                }}
                                className={`bg-transparent hover:bg-gray-700/30 border ${isVirtualBoxActive ? 'border-green-500' : 'border-gray-600'} p-0 rounded-full transition-all flex items-center`}
                                title={showJoystickMenu ? 'Скрыть выбор джойстика' : 'Показать выбор джойстика'}
                            >
                                <img
                                    width={'40px'}
                                    height={'40px'}
                                    className="object-contain"
                                    src={
                                        selectedJoystick === 'JoystickTurn' ? '/control/arrows-turn.svg' :
                                            selectedJoystick === 'Joystick' ? '/control/arrows-down.svg' :
                                                selectedJoystick === 'JoystickUp' ? '/control/arrows-up.svg' :
                                                    selectedJoystick === 'JoyAnalog' ? '/control/xbox-controller.svg' :
                                                        selectedJoystick === 'Keyboard' ? '/control/keyboard.svg' :
                                                            selectedJoystick === 'ButtonControl' ? '/control/button-control.svg' : // Добавляем условие для ButtonControl
                                                                isVirtualBoxActive ? '/control/axis-arrow.svg' : '/control/axis-arrow.svg'
                                    }
                                    alt="Joystick Select"
                                />
                            </Button>
                            {showJoystickMenu && (
                                <div className="absolute bottom-12 bg-black rounded-lg border border-gray-200 z-150">
                                    <div className="flex flex-col items-center">
                                        <Button
                                            onClick={() => {
                                                setSelectedJoystick('Joystick');
                                                setShowJoystickMenu(false);
                                            }}
                                            className="bg-transparent hover:bg-gray-700/30 rounded-full transition-all flex items-center p-0 z-155"
                                        >
                                            <img width={'60px'} height={'60px'} className="object-contain" src="/control/arrows-down.svg" alt="Down Joystick" />
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setSelectedJoystick('JoystickUp');
                                                setShowJoystickMenu(false);
                                            }}
                                            className="bg-transparent hover:bg-gray-700/30 rounded-full transition-all flex items-center p-0 z-155"
                                        >
                                            <img width={'60px'} height={'60px'} className="object-contain" src="/control/arrows-up.svg" alt="Up Joystick" />
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setSelectedJoystick('JoystickTurn');
                                                setShowJoystickMenu(false);
                                            }}
                                            className="bg-transparent hover:bg-gray-700/30 rounded-full transition-all flex items-center p-0 z-155"
                                        >
                                            <img width={'60px'} height={'60px'} className="object-contain" src="/control/arrows-turn.svg" alt="Turn Joystick" />
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setSelectedJoystick('JoyAnalog');
                                                setShowJoystickMenu(false);
                                            }}
                                            className="bg-transparent hover:bg-gray-700/30 rounded-full transition-all flex items-center p-0 z-155"
                                        >
                                            <img width={'60px'} height={'60px'} className="object-contain" src="/control/xbox-controller.svg" alt="Xbox Joystick" />
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setSelectedJoystick('Keyboard');
                                                setShowJoystickMenu(false);
                                            }}
                                            className="bg-transparent hover:bg-gray-700/30 rounded-full transition-all flex items-center p-0 z-155"
                                        >
                                            <img width={'60px'} height={'60px'} className="object-contain" src="/control/keyboard.svg" alt="Keyboard" />
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setSelectedJoystick('ButtonControl');
                                                setShowJoystickMenu(false);
                                            }}
                                            className="bg-transparent hover:bg-gray-700/30 rounded-full transition-all flex items-center p-0 z-155"
                                        >
                                            <img width={'60px'} height={'60px'} className="object-contain" src="/control/button-control.svg" alt="Button Control" />
                                        </Button>
                                        {isDeviceOrientationSupported && (
                                            <Button
                                                onClick={() => {
                                                    const newState = !isVirtualBoxActive;
                                                    setIsVirtualBoxActive(newState);
                                                    localStorage.setItem('isVirtualBoxActive', JSON.stringify(newState));
                                                    addLog(`VirtualBox ${newState ? 'активирован' : 'деактивирован'}`, 'info');
                                                    setShowJoystickMenu(false);

                                                    if (!newState) {
                                                        // При деактивации VirtualBox устанавливаем сервоприводы в центральное положение
                                                        adjustServo('1', 90, true);
                                                        adjustServo('2', 90, true);
                                                        addLog('Сервоприводы 1 и 2 установлены в центральное положение (90°)', 'info');
                                                        // Сбрасываем данные ориентации
                                                        setOrientationData({ beta: null, gamma: null, alpha: null });
                                                        // Вызываем метод очистки в VirtualBox
                                                        if (virtualBoxRef.current?.handleRequestPermissions) {
                                                            virtualBoxRef.current.handleRequestPermissions();
                                                        }
                                                    }

                                                    if (newState) {
                                                        const userAgent = navigator.userAgent;
                                                        const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
                                                        const iOSVersion = isIOS ? parseInt(userAgent.match(/OS (\d+)_/i)?.[1] || '0', 10) : 0;
                                                        const isAppleDevice = isIOS && iOSVersion >= 13;

                                                        if (isAppleDevice && !hasRequestedPermissions.current) {
                                                            hasRequestedPermissions.current = true;
                                                            addLog('Начало запроса разрешений для DeviceOrientation и DeviceMotion', 'info');

                                                            let orientationPermission = 'denied';
                                                            let motionPermission = 'denied';

                                                            Promise.resolve()
                                                                .then(() => {
                                                                    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                                                                        addLog('Запрос DeviceOrientationEvent', 'info');
                                                                        return (DeviceOrientationEvent as any).requestPermission();
                                                                    } else if (typeof window.DeviceOrientationEvent !== 'undefined') {
                                                                        addLog('Разрешение DeviceOrientationEvent не требуется', 'info');
                                                                        return 'granted';
                                                                    } else {
                                                                        addLog('DeviceOrientationEvent не поддерживается', 'error');
                                                                        return 'denied';
                                                                    }
                                                                })
                                                                .then((result) => {
                                                                    orientationPermission = result;
                                                                    addLog(
                                                                        `Разрешение DeviceOrientationEvent: ${orientationPermission}`,
                                                                        orientationPermission === 'granted' ? 'success' : 'error'
                                                                    );
                                                                    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
                                                                        addLog('Запрос DeviceMotionEvent', 'info');
                                                                        return (DeviceMotionEvent as any).requestPermission();
                                                                    } else if (typeof window.DeviceMotionEvent !== 'undefined') {
                                                                        addLog('Разрешение DeviceMotionEvent не требуется', 'info');
                                                                        return 'granted';
                                                                    } else {
                                                                        addLog('DeviceMotionEvent не поддерживается', 'error');
                                                                        return 'denied';
                                                                    }
                                                                })
                                                                .then((result) => {
                                                                    motionPermission = result;
                                                                    addLog(
                                                                        `Разрешение DeviceMotionEvent: ${motionPermission}`,
                                                                        motionPermission === 'granted' ? 'success' : 'error'
                                                                    );

                                                                    const orientationGranted = orientationPermission === 'granted';
                                                                    const motionGranted = motionPermission === 'granted';
                                                                    setHasOrientationPermission(orientationGranted);
                                                                    setHasMotionPermission(motionGranted);

                                                                    if (!orientationGranted || !motionGranted) {
                                                                        setIsVirtualBoxActive(false);
                                                                        localStorage.setItem('isVirtualBoxActive', JSON.stringify(false));
                                                                        addLog('VirtualBox деактивирован из-за отсутствия разрешений', 'error');
                                                                    }
                                                                })
                                                                .catch((error) => {
                                                                    addLog(`Ошибка запроса разрешений: ${String(error)}`, 'error');
                                                                    if (String(error).includes('NotAllowedError')) {
                                                                        addLog('Запрос разрешений требует явного действия пользователя', 'error');
                                                                    }
                                                                    setHasOrientationPermission(false);
                                                                    setHasMotionPermission(false);
                                                                    setIsVirtualBoxActive(false);
                                                                    localStorage.setItem('isVirtualBoxActive', JSON.stringify(false));
                                                                    addLog('VirtualBox деактивирован из-за ошибки разрешений', 'error');
                                                                })
                                                                .finally(() => {
                                                                    hasRequestedPermissions.current = false;
                                                                });
                                                        } else if (!isAppleDevice) {
                                                            const orientationSupported = typeof window.DeviceOrientationEvent !== 'undefined';
                                                            const motionSupported = typeof window.DeviceMotionEvent !== 'undefined';
                                                            setHasOrientationPermission(orientationSupported);
                                                            setHasMotionPermission(motionSupported);
                                                            addLog(
                                                                `Разрешения для Android: Orientation=${orientationSupported ? 'granted' : 'denied'}, Motion=${motionSupported ? 'granted' : 'denied'}`,
                                                                orientationSupported && motionSupported ? 'success' : 'error'
                                                            );
                                                            if (!orientationSupported || !motionSupported) {
                                                                setIsVirtualBoxActive(false);
                                                                localStorage.setItem('isVirtualBoxActive', JSON.stringify(false));
                                                                addLog('VirtualBox деактивирован из-за неподдержки сенсоров', 'error');
                                                            }
                                                        }
                                                    }
                                                }}
                                                className={`bg-transparent hover:bg-gray-700/30 rounded-full transition-all flex items-center p-0 ${
                                                    isVirtualBoxActive && hasOrientationPermission && hasMotionPermission ? 'border-2 border-green-500' : 'border border-gray-600'
                                                }`}
                                                title={
                                                    hasOrientationPermission && hasMotionPermission
                                                        ? isVirtualBoxActive
                                                            ? 'VirtualBox активен, нажмите для деактивации'
                                                            : 'VirtualBox неактивен, нажмите для активации'
                                                        : 'Нажмите, чтобы запросить доступ к датчикам устройства'
                                                }
                                                disabled={false}
                                            >
                                                <img
                                                    width={'60px'}
                                                    height={'60px'}
                                                    className="object-contain"
                                                    src="/control/axis-arrow.svg"
                                                    alt="Gyroscope"
                                                />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {/*{isVirtualBoxActive && (*/}
                    {/*    <div className="fixed bottom-16 right-4 flex items-center justify-center z-50">*/}
                    {/*        <span className="text-sm font-medium text-yellow-300 bg-black/50 px-2 py-1 rounded">*/}
                    {/*            VirtualBox: {isVirtualBoxActive ? 'Активен' : 'Неактивен'},*/}
                    {/*            Orientation: {hasOrientationPermission ? 'Разрешено' : 'Запрещено'},*/}
                    {/*            Motion: {hasMotionPermission ? 'Разрешено' : 'Запрещено'}*/}
                    {/*        </span>*/}
                    {/*    </div>*/}
                    {/*)}*/}
                </div>
            </div>
        </div>
    );
}

это новы переделанный
"use client"
import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp } from "lucide-react"
import Joystick from '@/components/control/Joystick'
import JoystickUp from '@/components/control/JoystickUp'
import JoyAnalog from '@/components/control/JoyAnalog'
import Keyboard from '@/components/control/Keyboard'
import ButtonControl from "@/components/control/ButtonControl"
import VirtualBox from "@/components/control/VirtualBox"

type LogEntry = { me: string; ty: 'client' | 'esp' | 'server' | 'error' | 'success' | 'info' }

// Бинарные константы — должны совпадать с ESP
const CMD_CLIENT_TYPE   = 0x02
const CMD_IDENTIFY      = 0x01
const CMD_HEARTBEAT     = 0x10
const CMD_MOTOR         = 0x20
const CMD_SERVO_ABS     = 0x30
const CMD_RELAY         = 0x40
const CMD_ALARM         = 0x41

const RSP_FULL_STATUS   = 0x50
const RSP_ACK           = 0x51

export default function SocketClient() {
const [log, setLog] = useState<LogEntry[]>([])
const [isConnected, setIsConnected] = useState(false)
const [isIdentified, setIsIdentified] = useState(false)
const [espConnected, setEspConnected] = useState(false)

    const [deviceId, setDeviceId] = useState<string>(() =>
        typeof window !== 'undefined' ? localStorage.getItem('currentDeviceId') || '' : ''
    )
    const [inputDeviceId, setInputDeviceId] = useState(deviceId)
    const [logVisible, setLogVisible] = useState(false)

    const [servo1Angle, setServo1Angle] = useState(90)
    const [servo2Angle, setServo2Angle] = useState(90)
    const [inputVoltage, setInputVoltage] = useState<number | null>(null)
    const [alarmState, setAlarmState] = useState(false)
    const [relayD0State, setRelayD0State] = useState<boolean | null>(null)

    const [showServos, setShowServos] = useState<boolean>(() => {
        const saved = localStorage.getItem('showServos')
        return saved !== null ? JSON.parse(saved) : false
    })

    const [selectedJoystick, setSelectedJoystick] = useState<'Joystick' | 'JoystickUp' | 'JoyAnalog' | 'Keyboard' | 'ButtonControl'>(
        (typeof window !== 'undefined' && localStorage.getItem('selectedJoystick') as any) || 'ButtonControl'
    )

    const [isVirtualBoxActive, setIsVirtualBoxActive] = useState<boolean>(() => {
        const saved = localStorage.getItem('isVirtualBoxActive')
        return saved !== null ? JSON.parse(saved) : false
    })

    const socketRef = useRef<WebSocket | null>(null)

    // Троттлинг и кэш команд моторов
    const motorAThrottleRef = useRef<NodeJS.Timeout | null>(null)
    const motorBThrottleRef = useRef<NodeJS.Timeout | null>(null)
    const lastMotorACommandRef = useRef<{ speed: number; dir: 0|1|2 } | null>(null)
    const lastMotorBCommandRef = useRef<{ speed: number; dir: 0|1|2 } | null>(null)

    const [motorASpeed, setMotorASpeed] = useState(0)
    const [motorBSpeed, setMotorBSpeed] = useState(0)
    const [motorADirection, setMotorADirection] = useState<0|1|2>(0) // 0=stop, 1=forward, 2=backward
    const [motorBDirection, setMotorBDirection] = useState<0|1|2>(0)

    const addLog = useCallback((msg: string, ty: LogEntry['ty'] = 'info') => {
        setLog(prev => [...prev.slice(-100), { me: `${new Date().toLocaleTimeString()}: ${msg}`, ty }])
    }, [])

    // localStorage
    useEffect(() => { localStorage.setItem('currentDeviceId', deviceId) }, [deviceId])
    useEffect(() => { localStorage.setItem('showServos', JSON.stringify(showServos)) }, [showServos])
    useEffect(() => { localStorage.setItem('selectedJoystick', selectedJoystick) }, [selectedJoystick])
    useEffect(() => { localStorage.setItem('isVirtualBoxActive', JSON.stringify(isVirtualBoxActive)) }, [isVirtualBoxActive])

    const cleanupWebSocket = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close()
            socketRef.current = null
        }
    }, [])

    const connectWebSocket = useCallback(() => {
        if (!deviceId || deviceId.length !== 16) {
            addLog('deviceId должен быть 16 символов', 'error')
            return
        }

        cleanupWebSocket()
        const url = process.env.NEXT_PUBLIC_WEB_SOCKET_URL || 'wss://a.ardu.live/wsar'
        const ws = new WebSocket(url)

        ws.binaryType = 'arraybuffer'

        ws.onopen = () => {
            setIsConnected(true)
            addLog('Подключено к серверу', 'success')

            // 1. Тип клиента
            ws.send(new Uint8Array([CMD_CLIENT_TYPE, 1]))

            // 2. Идентификация
            const idBuf = new Uint8Array(17)
            idBuf[0] = CMD_IDENTIFY
            const encoder = new TextEncoder()
            const idBytes = encoder.encode(deviceId.padEnd(16, ' '))
            idBuf.set(idBytes, 1)
            ws.send(idBuf)

            // *** КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ ***
            setIsIdentified(true)  // ← Добавь эту строку!
        }

        ws.onmessage = (event) => {
            if (!(event.data instanceof ArrayBuffer)) return

            const data = new Uint8Array(event.data)
            if (data.length === 0) return

            const type = data[0]



            if (type === RSP_FULL_STATUS && data.length >= 9) {
                // FULL_STATUS от ESP
                const relayOn = data[1] === 1
                const s1 = data[2]
                const s2 = data[3]
                const voltRaw = (data[4] << 8) | data[5]
                const voltage = voltRaw * 0.021888  // ваш коэффициент из ESP

                setRelayD0State(relayOn)
                setServo1Angle(s1)
                setServo2Angle(s2)
                setInputVoltage(voltage)

                if (!espConnected) {
                    setEspConnected(true)
                    addLog('ESP подключён (бинарный статус)', 'success')
                }
            }
            else if (type === 0x60) {  // esp status от сервера
                const status = data[1];
                if (status === 1) {
                    setEspConnected(true);
                    addLog('ESP подключён (уведомление от сервера)', 'success');
                } else {
                    setEspConnected(false);
                    addLog('ESP отключился', 'error');
                }
            }
            else if (type === RSP_ACK) {
                // Можно добавить обработку подтверждений если нужно
                // addLog(`Получено подтверждение команды 0x${data[1].toString(16)}`, 'success')
            }
        }

        ws.onclose = () => {
            setIsConnected(false)
            setIsIdentified(false)
            setEspConnected(false)
            addLog('Соединение закрыто', 'error')
        }

        ws.onerror = () => {
            addLog('Ошибка WebSocket-соединения', 'error')
        }

        socketRef.current = ws
    }, [deviceId, cleanupWebSocket, addLog, espConnected])

    // Отправка бинарных данных
    const sendBinary = useCallback((data: Uint8Array) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;  // ← Убрали !isIdentified
        socketRef.current.send(data)
    }, [])

    const sendHeartbeat = useCallback(() => {
        sendBinary(new Uint8Array([CMD_HEARTBEAT]))
    }, [sendBinary])

    const sendMotor = useCallback((motor: 'A'|'B', speed: number, dir: 0|1|2) => {
        const buf = new Uint8Array(5)
        buf[0] = CMD_MOTOR
        buf[1] = motor === 'A' ? 65 : 66           // 'A'=65, 'B'=66
        buf[2] = Math.min(255, Math.max(0, speed))
        buf[3] = dir

        // Проверка дубликата
        const ref = motor === 'A' ? lastMotorACommandRef : lastMotorBCommandRef
        if (ref.current?.speed === buf[2] && ref.current?.dir === dir) return
        ref.current = { speed: buf[2], dir }

        sendBinary(buf)
    }, [sendBinary])

    // Управление моторами с троттлингом и мгновенной остановкой
    const handleMotorControl = useCallback((motor: 'A'|'B', value: number) => {
        const abs = Math.abs(value)
        const dir: 0|1|2 = value > 0 ? 1 : value < 0 ? 2 : 0
        const speed = Math.round(abs)

        if (motor === 'A') {
            setMotorASpeed(speed)
            setMotorADirection(dir)
        } else {
            setMotorBSpeed(speed)
            setMotorBDirection(dir)
        }

        if (speed === 0) {
            if (motorAThrottleRef.current) clearTimeout(motorAThrottleRef.current)
            if (motorBThrottleRef.current) clearTimeout(motorBThrottleRef.current)
            sendMotor(motor, 0, 0)
            return
        }

        const throttleRef = motor === 'A' ? motorAThrottleRef : motorBThrottleRef
        if (throttleRef.current) clearTimeout(throttleRef.current)

        throttleRef.current = setTimeout(() => {
            sendMotor(motor, speed, dir)
        }, 40)
    }, [sendMotor])

    const handleDualAxisControl = useCallback(({ x, y }: { x: number; y: number }) => {
        handleMotorControl('A', Math.round(x))
        handleMotorControl('B', Math.round(y))
    }, [handleMotorControl])

    // Абсолютное положение серво (замена SSY/SSX)
    const adjustServo = useCallback((servoId: '1'|'2', value: number, isAbsolute: boolean) => {
        const current = servoId === '1' ? servo1Angle : servo2Angle
        const angle = isAbsolute ? value : current + value
        const clamped = Math.max(0, Math.min(180, Math.round(angle)))

        const buf = new Uint8Array(4)
        buf[0] = CMD_SERVO_ABS
        buf[1] = servoId === '1' ? 1 : 2
        buf[2] = clamped

        sendBinary(buf)

        if (servoId === '1') setServo1Angle(clamped)
        else setServo2Angle(clamped)
    }, [servo1Angle, servo2Angle, sendBinary])

    // Переключение реле D0
    const toggleRelay = useCallback(() => {
        if (relayD0State === null) return
        const newState = !relayD0State

        const buf = new Uint8Array([CMD_RELAY, newState ? 1 : 0])
        sendBinary(buf)

        setRelayD0State(newState)
        addLog(`Реле D0 → ${newState ? 'on' : 'off'}`, 'info')
    }, [relayD0State, sendBinary, addLog])

    // Переключение тревоги
    const toggleAlarm = useCallback(() => {
        const newState = !alarmState

        const buf = new Uint8Array([CMD_ALARM, newState ? 1 : 0])
        sendBinary(buf)

        setAlarmState(newState)
    }, [alarmState, sendBinary])

    // Heartbeat каждые 300 мс при активных моторах
    useEffect(() => {
        if (!isConnected || !isIdentified || (motorASpeed <= 0 && motorBSpeed <= 0)) return

        const interval = setInterval(sendHeartbeat, 300)
        return () => clearInterval(interval)
    }, [isConnected, isIdentified, motorASpeed, motorBSpeed, sendHeartbeat])

    const disabled = !isConnected || !isIdentified

    return (
        <div className="flex flex-col items-center min-h-screen bg-black relative">
            {/* Панель подключения */}
            <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-black/80 rounded-lg p-4 z-50 w-full max-w-md">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-4 h-4 rounded-full ${isConnected && isIdentified && espConnected ? 'bg-green-500' : isConnected ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    <span className="text-white">
                        {isConnected && isIdentified && espConnected ? 'Подключено' : isConnected ? 'Ожидание ESP' : 'Отключено'}
                    </span>
                </div>
                <div className="flex gap-2">
                    <Input
                        value={inputDeviceId}
                        onChange={(e) => setInputDeviceId(e.target.value.toUpperCase().replace(/[^0-9A-F]/g, ''))}
                        placeholder="deviceId (16 символов)"
                        maxLength={16}
                    />
                    <Button onClick={() => {
                        if (inputDeviceId.length === 16) {
                            setDeviceId(inputDeviceId)
                            connectWebSocket()
                        }
                    }} disabled={inputDeviceId.length !== 16}>
                        Подключить
                    </Button>
                    <Button onClick={cleanupWebSocket} variant="destructive" disabled={!isConnected}>
                        Отключить
                    </Button>
                </div>
                <Button onClick={() => setLogVisible(!logVisible)} className="mt-2 w-full">
                    {logVisible ? <ChevronUp /> : <ChevronDown />} Логи
                </Button>
                {logVisible && (
                    <div className="mt-2 max-h-48 overflow-y-auto bg-black/50 rounded p-2 text-xs">
                        {log.slice().reverse().map((e, i) => (
                            <div key={i} className="text-gray-400">{e.me}</div>
                        ))}
                    </div>
                )}
            </div>

            {/* Управление */}
            <div className="mt-32 relative w-full h-screen">
                {(selectedJoystick === 'Joystick' || selectedJoystick === 'JoystickUp') && (
                    <>
                        {selectedJoystick === 'Joystick' ? (
                            <Joystick
                                mo="A"
                                onChange={(v) => handleMotorControl('A', v)}
                                disabled={disabled}
                                direction={motorADirection === 1 ? 'forward' : motorADirection === 2 ? 'backward' : 'stop'}
                                sp={motorASpeed}
                            />
                        ) : (
                            <JoystickUp
                                mo="A"
                                onChange={(v) => handleMotorControl('A', v)}
                                disabled={disabled}
                                direction={motorADirection === 1 ? 'forward' : motorADirection === 2 ? 'backward' : 'stop'}
                                sp={motorASpeed}
                            />
                        )}
                        {selectedJoystick === 'Joystick' ? (
                            <Joystick
                                mo="B"
                                onChange={(v) => handleMotorControl('B', v)}
                                disabled={disabled}
                                direction={motorBDirection === 1 ? 'forward' : motorBDirection === 2 ? 'backward' : 'stop'}
                                sp={motorBSpeed}
                            />
                        ) : (
                            <JoystickUp
                                mo="B"
                                onChange={(v) => handleMotorControl('B', v)}
                                disabled={disabled}
                                direction={motorBDirection === 1 ? 'forward' : motorBDirection === 2 ? 'backward' : 'stop'}
                                sp={motorBSpeed}
                            />
                        )}
                    </>
                )}

                {selectedJoystick === 'JoyAnalog' && (
                    <JoyAnalog
                        onChange={handleDualAxisControl}
                        onServoChange={adjustServo}
                        onServoChangeCheck={adjustServo}
                        onRelayChange={(pin, state) => {
                            if (pin === "D0" && state === "toggle") toggleRelay()
                        }}
                        disabled={disabled}
                    />
                )}

                {selectedJoystick === 'Keyboard' && (
                    <Keyboard
                        onChange={handleDualAxisControl}
                        onServoChange={adjustServo}
                        onServoChangeCheck={adjustServo}
                        onRelayChange={(pin, state) => {
                            if (pin === "D0" && state === "toggle") toggleRelay()
                        }}
                        disabled={disabled}
                    />
                )}

                {selectedJoystick === 'ButtonControl' && (
                    <ButtonControl
                        onChange={handleDualAxisControl}
                        onServoChange={adjustServo}
                        onServoChangeCheck={adjustServo}
                        onRelayChange={(pin, state) => {
                            if (pin === "D0" && state === "toggle") toggleRelay()
                        }}
                        disabled={disabled}
                    />
                )}

                {isVirtualBoxActive && (
                    <VirtualBox
                        onServoChange={adjustServo}
                        isVirtualBoxActive={true}
                        hasOrientationPermission={true}
                        hasMotionPermission={true}
                        isOrientationSupported={true}
                        isMotionSupported={true}
                        disabled={disabled}
                    />
                )}
            </div>

            {/* Нижняя панель */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-50">
                {showServos && (
                    <div className="bg-black/70 px-4 py-2 rounded text-green-400">
                        V: {servo1Angle}° | H: {servo2Angle}°
                    </div>
                )}
                <div className="flex gap-4 items-center">
                    {inputVoltage !== null && (
                        <span className="text-3xl font-bold text-green-500 bg-black/70 px-6 py-3 rounded-full">
                            {inputVoltage.toFixed(2)}V
                        </span>
                    )}
                    <Button onClick={toggleAlarm}>
                        <img src={alarmState ? "/alarm/alarm-on.svg" : "/alarm/alarm-off.svg"} className="w-10 h-10" alt="Alarm" />
                    </Button>
                    {relayD0State !== null && (
                        <Button onClick={toggleRelay}>
                            <img src={relayD0State ? "/off.svg" : "/on.svg"} className="w-10 h-10" alt="Relay" />
                        </Button>
                    )}
                    <Button onClick={() => setShowServos(!showServos)}>
                        <img src={showServos ? "/turn2.svg" : "/turn1.svg"} className="w-10 h-10" alt="Servos" />
                    </Button>
                    <Button onClick={() => {
                        const options: typeof selectedJoystick[] = ['ButtonControl', 'Joystick', 'JoystickUp', 'JoyAnalog', 'Keyboard']
                        const i = options.indexOf(selectedJoystick)
                        setSelectedJoystick(options[(i + 1) % options.length])
                    }}>
                        <img
                            src={
                                selectedJoystick === 'Joystick' ? '/control/arrows-down.svg' :
                                    selectedJoystick === 'JoystickUp' ? '/control/arrows-up.svg' :
                                        selectedJoystick === 'JoyAnalog' ? '/control/xbox-controller.svg' :
                                            selectedJoystick === 'Keyboard' ? '/control/keyboard.svg' :
                                                '/control/button-control.svg'
                            }
                            className="w-12 h-12"
                            alt="Switch control"
                        />
                    </Button>
                    <Button
                        onClick={() => setIsVirtualBoxActive(!isVirtualBoxActive)}
                        className={isVirtualBoxActive ? 'border-4 border-green-500' : ''}
                    >
                        <img src="/control/axis-arrow.svg" className="w-12 h-12" alt="VirtualBox" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

сервер
import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage } from 'http'
import { getAllowedDeviceIds, getDeviceTelegramInfo } from './actions'
import { createServer } from 'http'
import axios from 'axios'

const PORT = 8096
const WS_PATH = '/wsar'

let TELEGRAM_BOT_TOKEN: string | null = null
let TELEGRAM_CHAT_ID: string | null = null
let lastTelegramMessageTime = 0
const TELEGRAM_MESSAGE_INTERVAL = 5000

function formatDateTime(date: Date): string {
const moscowOffset = 3 * 60 * 60 * 1000
const moscowDate = new Date(date.getTime() + moscowOffset)
const day = String(moscowDate.getUTCDate()).padStart(2, '0')
const month = String(moscowDate.getUTCMonth() + 1).padStart(2, '0')
const year = moscowDate.getUTCFullYear()
const hours = String(moscowDate.getUTCHours()).padStart(2, '0')
const minutes = String(moscowDate.getUTCMinutes()).padStart(2, '0')
return `${day}.${month}.${year} ${hours}:${minutes}`
}

const server = createServer()
const wss = new WebSocketServer({ server, path: WS_PATH })

interface ClientInfo {
ws: WebSocket
ip: string
isIdentified: boolean
ct?: 'browser' | 'esp'
lastActivity: number
isAlive: boolean
de?: string
}

const clients = new Map<number, ClientInfo>()

// Пинг-понг каждые 30 секунд
setInterval(() => {
clients.forEach((client, id) => {
if (!client.isAlive) {
client.ws.terminate()
clients.delete(id)
console.log(`Клиент ${id} отключен (ping timeout)`)
return
}
client.isAlive = false
client.ws.ping()
})
}, 30000)

wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
if (req.url !== WS_PATH) {
ws.close(1002, 'Invalid path')
return
}

    const clientId = Date.now()
    const ip = req.socket.remoteAddress || 'unknown'

    const client: ClientInfo = {
        ws,
        ip,
        isIdentified: false,
        lastActivity: Date.now(),
        isAlive: true
    }
    clients.set(clientId, client)

    console.log(`Новое подключение: ${clientId} (${ip})`)

    ws.on('pong', () => {
        client.isAlive = true
        client.lastActivity = Date.now()
    })

    ws.on('message', async (data, isBinary) => {
        if (!isBinary) {
            console.log(`[${clientId}] Игнорируем текстовое сообщение`);
            return;
        }

        client.lastActivity = Date.now();

        const buf = Buffer.from(data as ArrayBuffer);
        if (buf.length < 1) return;

        const cmd = buf[0];

        try {
            switch (cmd) {
                case 0x02: // CLIENT_TYPE
                    if (buf.length >= 2) {
                        client.ct = buf[1] === 1 ? 'browser' : 'esp';
                        console.log(`[${clientId}] Тип: ${client.ct}`);
                    }
                    break;

                case 0x01: // IDENTIFY
                    if (buf.length === 17) {
                        const de = buf.subarray(1).toString('utf8').trim();
                        const allowed = new Set(await getAllowedDeviceIds());

                        if (allowed.has(de)) {
                            client.de = de;
                            client.isIdentified = true;

                            const telegramInfo = await getDeviceTelegramInfo(de);
                            TELEGRAM_BOT_TOKEN = telegramInfo?.telegramToken ?? null;
                            TELEGRAM_CHAT_ID = telegramInfo?.telegramId?.toString() ?? null;

                            console.log(`[${clientId}] Успешная идентификация: ${de}`);

                            // Если это ESP → уведомляем всех существующих браузеров
                            if (client.ct === 'esp') {
                                clients.forEach(c => {
                                    if (c.ct === 'browser' && c.de === de && c.isIdentified) {
                                        c.ws.send(new Uint8Array([0x60, 1])); // connected
                                        console.log(`[${clientId}] Уведомил браузер ${c.de} → ESP connected`);
                                    }
                                });
                            }

                            // Если это браузер → проверяем, есть ли уже ESP, и сразу уведомляем
                            else if (client.ct === 'browser') {
                                let espIsOnline = false;
                                clients.forEach(c => {
                                    if (c.ct === 'esp' && c.de === de && c.isIdentified) {
                                        espIsOnline = true;
                                    }
                                });

                                // Отправляем статус новому браузеру
                                client.ws.send(new Uint8Array([0x60, espIsOnline ? 1 : 0]));
                                console.log(`[${clientId}] Новый браузер → статус ESP: ${espIsOnline ? 'connected' : 'disconnected'}`);
                            }
                        } else {
                            ws.close(1008, 'Device not allowed');
                        }
                    }
                    break;

                default:
                    // *** КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: ПЕРЕСЫЛКА ВСЕХ ОСТАЛЬНЫХ КОМАНД ***
                    if (client.de && client.isIdentified) {
                        const isFromBrowser = client.ct === 'browser';
                        const targetType = isFromBrowser ? 'esp' : 'browser';

                        let forwarded = false;
                        clients.forEach(c => {
                            if (c.de === client.de && c.ct === targetType && c.isIdentified) {
                                c.ws.send(buf);
                                forwarded = true;
                                console.log(`[${clientId}] Пересылка → ${targetType} ${client.de} (cmd 0x${cmd.toString(16)})`);
                            }
                        });

                        if (!forwarded) {
                            console.log(`[${clientId}] НЕ НАЙДЕН ${targetType} для ${client.de} (cmd 0x${cmd.toString(16)})`);
                        }
                    } else {
                        console.log(`[${clientId}] Команда отклонена: не идентифицирован или нет deviceId`);
                    }
            }
        } catch (err) {
            console.error(`[${clientId}] Ошибка:`, err);
        }
    });

    ws.on('close', () => {
        console.log(`Клиент ${clientId} отключился`)
        if (client.ct === 'esp' && client.de) {
            clients.forEach(c => {
                if (c.ct === 'browser' && c.de === client.de) {
                    c.ws.send(new Uint8Array([0x60, 0])) // 0x60 = esp disconnected
                }
            })
        }
        clients.delete(clientId)
    })

    ws.on('error', err => {
        console.error(`[${clientId}] WS ошибка:`, err)
    })
})

server.listen(PORT, () => {
console.log(`Binary WebSocket сервер запущен на ws://0.0.0.0:${PORT}${WS_PATH}`)
})

ESP

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ArduinoWebsockets.h>
#include <ServoEasing.hpp>

using namespace websockets;

// Пины
#define PIN_ENA     D1
#define PIN_IN1     D2
#define PIN_IN2     D3
#define PIN_IN3     D4
#define PIN_IN4     D5
#define PIN_ENB     D6
#define PIN_RELAY   D0      // active LOW
#define PIN_SERVO1  D7
#define PIN_SERVO2  D8
#define PIN_VOLTAGE A0

// Настройки
const char* ssid       = "Robolab124";
const char* password   = "wifi123123123";
const char* ws_url     = "wss://a.ardu.live:444/wsar";
const char* DEVICE_ID  = "9999999999999999";  // 16 символов

ServoEasing Servo1, Servo2;
WebsocketsClient client;

bool identified = false;
unsigned long lastHbTx = 0;
unsigned long lastHbRx = 0;
unsigned long lastStatusTx = 0;

// Типы сообщений
#define CMD_IDENTIFY       0x01
#define CMD_CLIENT_TYPE    0x02
#define CMD_HEARTBEAT      0x10
#define CMD_MOTOR          0x20
#define CMD_SERVO_ABS      0x30
#define CMD_RELAY          0x40
#define CMD_ALARM          0x41

#define RSP_FULL_STATUS    0x50
#define RSP_ACK            0x51

// ────────────────────────────────────────────────────────────────
void sendBinary(const uint8_t* data, size_t len) {
if (client.available()) {
client.sendBinary((const char*)data, len);  // Явное приведение
}
}

void sendHeartbeat() {
uint8_t buf[1] = {CMD_HEARTBEAT};
sendBinary(buf, 1);
}

void sendFullStatus() {
uint8_t buf[9] = {0};
buf[0] = RSP_FULL_STATUS;
buf[1] = (digitalRead(PIN_RELAY) == LOW) ? 1 : 0;   // relay
buf[2] = Servo1.read();                             // servo1
buf[3] = Servo2.read();                             // servo2

    int raw = analogRead(PIN_VOLTAGE);
    buf[4] = highByte(raw);
    buf[5] = lowByte(raw);

    buf[6] = 0;  // alarm
    buf[7] = 0;  // motion
    buf[8] = (uint8_t)constrain(WiFi.RSSI(), -128, 127);  // rssi

    sendBinary(buf, sizeof(buf));
}

void sendAck(uint8_t cmd, uint8_t value = 0) {
uint8_t buf[3] = {RSP_ACK, cmd, value};
sendBinary(buf, 3);
}

// ────────────────────────────────────────────────────────────────
void onMessageCallback(WebsocketsMessage message) {
if (!message.isBinary()) {
Serial.println("Получено НЕ бинарное сообщение — игнорируем");
return;
}

    const uint8_t* data = reinterpret_cast<const uint8_t*>(message.c_str());
    size_t len = message.length();

    if (len == 0) {
        Serial.println("Получено пустое сообщение");
        return;
    }

    Serial.printf("Получено бинарное: cmd=0x%02X, len=%d  ", data[0], len);

    switch (data[0]) {
        case CMD_HEARTBEAT:
            Serial.println("→ HEARTBEAT (обновляю таймер)");
            lastHbRx = millis();
            break;

        case CMD_MOTOR:
            if (len < 5) {
                Serial.println("→ CMD_MOTOR: слишком короткое");
                return;
            }
            {
                char motor = data[1];
                uint8_t speed = data[2];
                uint8_t dir = data[3];

                Serial.printf("→ MOTOR %c: speed=%d, dir=%d\n", motor, speed, dir);

                uint8_t pwmPin = (motor == 'A') ? PIN_ENA : PIN_ENB;
                analogWrite(pwmPin, speed);

                if (dir == 1) {         // forward
                    if (motor == 'A') { 
                        digitalWrite(PIN_IN1, HIGH); 
                        digitalWrite(PIN_IN2, LOW); 
                    } else { 
                        digitalWrite(PIN_IN3, HIGH); 
                        digitalWrite(PIN_IN4, LOW); 
                    }
                } else if (dir == 2) {  // backward
                    if (motor == 'A') { 
                        digitalWrite(PIN_IN1, LOW);  
                        digitalWrite(PIN_IN2, HIGH);
                    } else { 
                        digitalWrite(PIN_IN3, LOW);  
                        digitalWrite(PIN_IN4, HIGH);
                    }
                }
                sendAck(CMD_MOTOR, speed);
            }
            break;

        case CMD_SERVO_ABS:
            if (len < 4) {
                Serial.println("→ CMD_SERVO_ABS: слишком короткое");
                return;
            }
            {
                uint8_t num = data[1];
                uint8_t angle = constrain(data[2], 0, 180);
                Serial.printf("→ SERVO %d → angle=%d\n", num, angle);

                if (num == 1) Servo1.write(angle);
                else if (num == 2) Servo2.write(angle);

                sendAck(CMD_SERVO_ABS, angle);
            }
            break;

        case CMD_RELAY:
            if (len < 3) {
                Serial.println("→ CMD_RELAY: слишком короткое");
                return;
            }
            {
                uint8_t state = data[1];
                Serial.printf("→ RELAY state=%d\n", state);
                digitalWrite(PIN_RELAY, state ? LOW : HIGH);
                sendAck(CMD_RELAY, state);
            }
            break;

        case CMD_ALARM:
            if (len < 2) {
                Serial.println("→ CMD_ALARM: слишком короткое");
                return;
            }
            Serial.printf("→ ALARM state=%d\n", data[1]);
            sendAck(CMD_ALARM, data[1]);
            break;

        default:
            Serial.printf("→ НЕИЗВЕСТНАЯ КОМАНДА 0x%02X\n", data[0]);
    }
}

void onEventsCallback(WebsocketsEvent event, String data) {
switch (event) {
case WebsocketsEvent::ConnectionOpened:
Serial.println("[WS] Connected");
identified = false;

            // Тип клиента
            {
                uint8_t buf[2] = {CMD_CLIENT_TYPE, 2}; // 2 = esp
                sendBinary(buf, 2);
            }

            // Идентификация
            {
                uint8_t buf[17];
                buf[0] = CMD_IDENTIFY;
                memcpy(buf + 1, DEVICE_ID, 16);
                sendBinary(buf, 17);
            }
            break;

        case WebsocketsEvent::ConnectionClosed:
            Serial.println("[WS] Disconnected");
            identified = false;
            analogWrite(PIN_ENA, 0);
            analogWrite(PIN_ENB, 0);
            break;
    }
}

// ────────────────────────────────────────────────────────────────
void setup() {
Serial.begin(115200);
delay(200);
Serial.println("\n=== Binary Protocol 2026 ===\n");

    Servo1.attach(PIN_SERVO1, 90);
    Servo2.attach(PIN_SERVO2, 90);
    Servo1.write(90);
    Servo2.write(90);

    pinMode(PIN_ENA,  OUTPUT);
    pinMode(PIN_ENB,  OUTPUT);
    pinMode(PIN_IN1,  OUTPUT);
    pinMode(PIN_IN2,  OUTPUT);
    pinMode(PIN_IN3,  OUTPUT);
    pinMode(PIN_IN4,  OUTPUT);
    pinMode(PIN_RELAY, OUTPUT);
    digitalWrite(PIN_RELAY, HIGH); // выключено

    analogWrite(PIN_ENA, 0);
    analogWrite(PIN_ENB, 0);

    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);

    Serial.print("WiFi ");
    while (WiFi.status() != WL_CONNECTED) {
        delay(400);
        Serial.print(".");
    }
    Serial.printf("\nIP: %s\n", WiFi.localIP().toString().c_str());

    client.onMessage(onMessageCallback);
    client.onEvent(onEventsCallback);
    client.setInsecure();
}

void loop() {
if (WiFi.status() != WL_CONNECTED) {
Serial.println("WiFi lost → reconnect");
WiFi.reconnect();
delay(2000);
return;
}

    if (!client.available()) {
        Serial.print("WS reconnect... ");
        if (client.connect(ws_url)) {
            Serial.println("OK");
        } else {
            Serial.println("fail");
        }
        delay(3000);
        return;
    }

    client.poll();

    unsigned long now = millis();

    // Heartbeat каждые ~2.5 сек
    if (now - lastHbTx >= 2500) {
        lastHbTx = now;
        sendHeartbeat();
    }

    // Статус каждые ~800 мс
    if (identified && now - lastStatusTx >= 800) {
        lastStatusTx = now;
        sendFullStatus();
    }

    // Защита моторов по таймауту heartbeat
    if (identified && now - lastHbRx > 5000UL) {
        static bool warned = false;
        if (!warned) {
            Serial.println("HEARTBEAT TIMEOUT → STOP MOTORS");
            warned = true;
        }
        analogWrite(PIN_ENA, 0);
        analogWrite(PIN_ENB, 0);
    } else {
        static bool warned = false;
        if (warned) warned = false;
    }
}

курки от JoyAnalog и возможно бамперы и реле не доходят до ESP
логи сервера
[1767766235778] Пересылка → esp 9999999999999999 (cmd 0x30)
[1767766120674] Пересылка → browser 9999999999999999 (cmd 0x51)
[1767766235778] Пересылка → esp 9999999999999999 (cmd 0x30)
[1767766120674] Пересылка → browser 9999999999999999 (cmd 0x51)
[1767766235778] Пересылка → esp 9999999999999999 (cmd 0x30)
[1767766120674] Пересылка → browser 9999999999999999 (cmd 0x51)
[1767766120674] Пересылка → browser 9999999999999999 (cmd 0x51)
[1767766120674] Пересылка → browser 9999999999999999 (cmd 0x51)

клиент
5JoyAnalog.tsx:198 Gamepad 1: Button Menu pressed, toggling relay D0
JoyAnalog.tsx:189 Gamepad 1: Motor A direction toggled to backward
JoyAnalog.tsx:194 Gamepad 1: Motor B direction toggled to backward
JoyAnalog.tsx:194 Gamepad 1: Motor B direction toggled to forward
JoyAnalog.tsx:194 Gamepad 1: Motor B direction toggled to backward
JoyAnalog.tsx:189 Gamepad 1: Motor A direction toggled to forward
JoyAnalog.tsx:189 Gamepad 1: Motor A direction toggled to backward

сделай так чтобы курки доходили до ESP и моторы отображались, так же сделай везде логи на клиенте сервере (откуда что приходит от куда что отправляется) 

NEXTAUTH_URL=https://a.ardu.live:444

NEXT_PUBLIC_WEB_SOCKET_URL=wss://a.ardu.live:444/wsar
это работает на NGINX смотри SocketClient
вот для наглядности
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./JoystickStyles.module.css";

interface JoyAnalogProps {
onChange: ({ x, y }: { x: number; y: number }) => void;
onServoChange: (servoId: "1" | "2", value: number, isAbsolute: boolean) => void;
onServoChangeCheck: (servoId: "1" | "2", value: number, isAbsolute: boolean) => void;
onRelayChange?: (pin: string, state: string) => void;
disabled?: boolean;
}

const JoyAnalog = ({ onChange, onServoChange, disabled, onServoChangeCheck, onRelayChange }: JoyAnalogProps) => {
const [gamepadConnected, setGamepadConnected] = useState(false);
const [motorADirection, setMotorADirection] = useState<"forward" | "backward">("forward");
const [motorBDirection, setMotorBDirection] = useState<"forward" | "backward">("forward");
const [showMultipleGamepadWarning, setShowMultipleGamepadWarning] = useState(false);
const [isRightStickYEnabled, setIsRightStickYEnabled] = useState(true);
const [ltRange, setLtRange] = useState(() => {
const saved = localStorage.getItem("ltRange");
return saved ? parseInt(saved, 10) : 255;
});
const [rtRange, setRtRange] = useState(() => {
const saved = localStorage.getItem("rtRange");
return saved ? parseInt(saved, 10) : 255;
});
const [rightStickXRange, setRightStickXRange] = useState(() => {
const saved = localStorage.getItem("rightStickXRange");
return saved ? parseInt(saved, 10) : 255;
});
const [servo1NeutralAngle, setServo1NeutralAngle] = useState(() => {
const saved = localStorage.getItem("servo1NeutralAngle");
return saved ? parseInt(saved, 10) : 90;
});
const [servo2NeutralAngle, setServo2NeutralAngle] = useState(() => {
const saved = localStorage.getItem("servo2NeutralAngle");
return saved ? parseInt(saved, 10) : 90;
});
const [ltValue, setLtValue] = useState(0);
const [rtValue, setRtValue] = useState(0);
const [rightStickXValue, setRightStickXValue] = useState(0);
const animationFrameRef = useRef<number | null>(null);
const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const prevButtonState = useRef<Record<string, boolean>>({});
    const prevStickState = useRef<Record<number, { leftStickX: number; rightStickY: number; rightStickX: number; servo1Value: number; servo2Value: number }>>({});

    useEffect(() => {
        localStorage.setItem("ltRange", ltRange.toString());
    }, [ltRange]);

    useEffect(() => {
        localStorage.setItem("rtRange", rtRange.toString());
    }, [rtRange]);

    useEffect(() => {
        localStorage.setItem("rightStickXRange", rightStickXRange.toString());
    }, [rightStickXRange]);

    useEffect(() => {
        localStorage.setItem("servo1NeutralAngle", servo1NeutralAngle.toString());
    }, [servo1NeutralAngle]);

    useEffect(() => {
        localStorage.setItem("servo2NeutralAngle", servo2NeutralAngle.toString());
    }, [servo2NeutralAngle]);

    const checkGamepads = useCallback((): Gamepad[] => {
        const gamepads = navigator.getGamepads();
        const activeGamepads = Array.from(gamepads).filter(
            (gp): gp is Gamepad => gp !== null && (gp.id.includes("Xbox") || gp.mapping === "standard")
        );
        setGamepadConnected(activeGamepads.length > 0);
        setShowMultipleGamepadWarning(activeGamepads.length > 1);
        return activeGamepads;
    }, []);

    const handleGamepadInput = useCallback(() => {
        if (disabled) return;

        const gamepads = checkGamepads();
        if (!gamepads.length || gamepads.length > 1) return;

        let totalMotorA = 0;
        let totalMotorB = 0;

        for (const gamepad of gamepads) {
            const index = gamepad.index;
            const deadZone = 0.1;
            const rightStickDeadZone = 0.35;

            const ltValue = gamepad.buttons[6].value;
            const rtValue = gamepad.buttons[7].value;
            const motorASpeed = Math.round(ltValue * ltRange);
            const motorBSpeed = Math.round(rtValue * rtRange);

            setLtValue(motorASpeed);
            setRtValue(motorBSpeed);

            const dpadDown = gamepad.buttons[12].pressed;
            const dpadUp = gamepad.buttons[13].pressed;
            const dpadLeft = gamepad.buttons[14].pressed;
            const dpadRight = gamepad.buttons[15].pressed;

            const buttonA = gamepad.buttons[0].pressed;
            const buttonB = gamepad.buttons[1].pressed;
            const buttonX = gamepad.buttons[2].pressed;
            const buttonY = gamepad.buttons[3].pressed;
            const buttonMenu = gamepad.buttons[8].pressed;
            const buttonView = gamepad.buttons[9].pressed;
            const buttonLB = gamepad.buttons[4].pressed;
            const buttonRB = gamepad.buttons[5].pressed;
            const leftStickButton = gamepad.buttons[10].pressed;
            const rightStickButton = gamepad.buttons[11].pressed;

            const leftStickX = gamepad.axes[0];
            const rightStickY = gamepad.axes[3];
            const rightStickX = gamepad.axes[2];

            const adjustedRightStickX = Math.abs(rightStickX) > rightStickDeadZone ? rightStickX : 0;
            const adjustedRightStickY = Math.abs(rightStickY) > rightStickDeadZone ? rightStickY : 0;

            const scaledRightStickX = adjustedRightStickX * rightStickXRange / 255;
            setRightStickXValue(Math.round(scaledRightStickX * 255));

            const prevButtons = prevButtonState.current;
            const prevSticks = prevStickState.current[index] || {
                leftStickX: 0,
                rightStickY: 0,
                rightStickX: 0,
                servo1Value: servo1NeutralAngle,
                servo2Value: servo2NeutralAngle,
            };

            let motorA = 0;
            let motorB = 0;
            if (motorASpeed > 0) motorA = motorADirection === "forward" ? -motorASpeed : motorASpeed;
            if (motorBSpeed > 0) motorB = motorBDirection === "forward" ? -motorBSpeed : motorBSpeed;

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

            if (Math.abs(adjustedRightStickX) > 0) {
                const motorBSpeedRightStick = Math.round(Math.abs(scaledRightStickX) * 255);
                motorA = adjustedRightStickX > 0 ? motorBSpeedRightStick : -motorBSpeedRightStick;
            }

            totalMotorA += motorA;
            totalMotorB += motorB;

            if (leftStickButton && buttonY && !prevButtons[`LEFT_STICK_Y_${index}`]) {
                setLtRange((prev) => Math.min(prev + 50, 255));
                setRightStickXRange((prev) => Math.min(prev + 50, 255));
                console.log(`Gamepad ${index}: Left trigger range increased to ${Math.min(ltRange + 50, 255)}, Right stick X range increased to ±${Math.min(rightStickXRange + 50, 255)}`);
            }
            if (leftStickButton && buttonA && !prevButtons[`LEFT_STICK_A_${index}`]) {
                setLtRange((prev) => Math.max(prev - 50, 55));
                setRightStickXRange((prev) => Math.max(prev - 50, 55));
                console.log(`Gamepad ${index}: Left trigger range decreased to ${Math.max(ltRange - 50, 55)}, Right stick X range decreased to ±${Math.max(rightStickXRange - 50, 55)}`);
            }

            if (rightStickButton && buttonY && !prevButtons[`RIGHT_STICK_Y_${index}`]) {
                setRtRange((prev) => Math.min(prev + 50, 255));
                console.log(`Gamepad ${index}: Right trigger range increased to ${Math.min(rtRange + 50, 255)}`);
            }
            if (rightStickButton && buttonA && !prevButtons[`RIGHT_STICK_A_${index}`]) {
                setRtRange((prev) => Math.max(prev - 50, 55));
                console.log(`Gamepad ${index}: Right trigger range decreased to ${Math.max(rtRange - 55, 55)}`);
            }

            if (buttonA && !prevButtons[`A_${index}`]) onServoChangeCheck("1", -15, false);
            if (buttonB && !prevButtons[`B_${index}`]) onServoChangeCheck("2", -15, false);
            if (buttonX && !prevButtons[`X_${index}`]) onServoChangeCheck("2", 15, false);
            if (buttonY && !prevButtons[`Y_${index}`]) onServoChangeCheck("1", 15, false);

            if (buttonLB && !prevButtons[`LB_${index}`]) {
                setMotorADirection((prev) => (prev === "forward" ? "backward" : "forward"));
                console.log(`Gamepad ${index}: Motor A direction toggled to ${motorADirection === "forward" ? "backward" : "forward"}`);
            }

            if (buttonRB && !prevButtons[`RB_${index}`]) {
                setMotorBDirection((prev) => (prev === "forward" ? "backward" : "forward"));
                console.log(`Gamepad ${index}: Motor B direction toggled to ${motorBDirection === "forward" ? "backward" : "forward"}`);
            }

            if (buttonMenu && !prevButtons[`MENU_${index}`]) {
                console.log(`Gamepad ${index}: Button Menu pressed, toggling relay D0`);
                onRelayChange?.("D0", "toggle");
            }

            if (buttonView && !prevButtons[`VIEW_${index}`]) {
                setIsRightStickYEnabled((prev) => !prev);
                console.log(`Gamepad ${index}: Right stick Y axis ${isRightStickYEnabled ? "disabled" : "enabled"}`);
            }

            if (Math.abs(leftStickX) > deadZone) {
                const servo2Value = Math.round((-leftStickX + 1) * 90);
                if (servo2Value !== prevSticks.servo2Value) {
                    onServoChange("2", servo2Value, true);
                    prevSticks.servo2Value = servo2Value;
                }
            } else if (Math.abs(prevSticks.leftStickX) > deadZone) {
                if (prevSticks.servo2Value !== servo2NeutralAngle) {
                    onServoChange("2", servo2NeutralAngle, true);
                    prevSticks.servo2Value = servo2NeutralAngle;
                }
            }

            if (isRightStickYEnabled && Math.abs(adjustedRightStickY) > 0) {
                const servo1Value = Math.round((-adjustedRightStickY + 1) * 90);
                if (servo1Value !== prevSticks.servo1Value) {
                    onServoChange("1", servo1Value, true);
                    prevSticks.servo1Value = servo1Value;
                }
            } else if (Math.abs(prevSticks.rightStickY) > rightStickDeadZone && prevSticks.servo1Value !== servo1NeutralAngle) {
                onServoChange("1", servo1NeutralAngle, true);
                prevSticks.servo1Value = servo1NeutralAngle;
            }

            prevButtonState.current = {
                ...prevButtons,
                [`A_${index}`]: buttonA,
                [`B_${index}`]: buttonB,
                [`X_${index}`]: buttonX,
                [`Y_${index}`]: buttonY,
                [`LB_${index}`]: buttonLB,
                [`RB_${index}`]: buttonRB,
                [`MENU_${index}`]: buttonMenu,
                [`VIEW_${index}`]: buttonView,
                [`LEFT_STICK_Y_${index}`]: leftStickButton && buttonY,
                [`LEFT_STICK_A_${index}`]: leftStickButton && buttonA,
                [`RIGHT_STICK_Y_${index}`]: rightStickButton && buttonY,
                [`RIGHT_STICK_A_${index}`]: rightStickButton && buttonA,
            };
            prevStickState.current[index] = {
                leftStickX,
                rightStickY,
                rightStickX,
                servo1Value: prevSticks.servo1Value,
                servo2Value: prevSticks.servo2Value,
            };
        }

        onChange({ x: totalMotorA, y: totalMotorB });
        animationFrameRef.current = requestAnimationFrame(handleGamepadInput);
    }, [disabled, checkGamepads, onChange, onServoChange, onServoChangeCheck, onRelayChange, motorADirection, motorBDirection, isRightStickYEnabled, ltRange, rtRange, rightStickXRange, servo1NeutralAngle, servo2NeutralAngle]);

    useEffect(() => {
        const handleConnect = () => {
            const gamepads = checkGamepads();
            setGamepadConnected(!!gamepads.length);
            if (gamepads.length <= 1) {
                animationFrameRef.current = requestAnimationFrame(handleGamepadInput);
            }
        };

        const handleDisconnect = () => {
            setGamepadConnected(false);
            setShowMultipleGamepadWarning(false);
            setLtValue(0);
            setRtValue(0);
            setRightStickXValue(0);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };

        intervalRef.current = setInterval(() => {
            const gamepads = checkGamepads();
            if (!gamepads.length) {
                onChange({ x: 0, y: 0 });
                setLtValue(0);
                setRtValue(0);
                setRightStickXValue(0);
            }
        }, 1000);

        window.addEventListener("gamepadconnected", handleConnect);
        window.addEventListener("gamepaddisconnected", handleDisconnect);

        if (checkGamepads().length) handleConnect();

        return () => {
            window.removeEventListener("gamepadconnected", handleConnect);
            window.removeEventListener("gamepaddisconnected", handleDisconnect);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [checkGamepads, handleGamepadInput, onChange]);

    const handleServoNeutralChange = (servo: "1" | "2", value: number) => {
        const clampedValue = Math.max(0, Math.min(180, value)); // Ограничиваем угол от 0 до 180
        if (servo === "1") {
            setServo1NeutralAngle(clampedValue);
        } else {
            setServo2NeutralAngle(clampedValue);
        }
    };

    return (
        <>
            {showMultipleGamepadWarning && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
                        <h2 className="text-xl font-bold mb-4 text-gray-700">Gamepads Detected</h2>
                        <p className="text-gray-700">
                            Обнаружено несколько геймпадов. Пожалуйста, оставьте подключенным только один.
                        </p>
                    </div>
                </div>
            )}
            {gamepadConnected && (
                <div
                    className="fixed bottom-[20%] right-[5%] transform -translate-x-1 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-40"
                    style={{ textAlign: "center" }}
                >
                    <p>tu {rightStickXRange} {rightStickXValue}</p>
                    <p>sp {rtRange} {rtValue}</p>
                    <div>
                        <label className="text-sm">V:</label>
                        <input
                            type="number"
                            min="0"
                            max="180"
                            value={servo1NeutralAngle}
                            onChange={(e) => handleServoNeutralChange("1", parseInt(e.target.value) || 0)}
                            className="rounded bg-gray-700 text-white w-12 text-center"
                        />
                    </div>
                    <div>
                        <label className="text-sm">H:</label>
                        <input
                            type="number"
                            min="0"
                            max="180"
                            value={servo2NeutralAngle}
                            onChange={(e) => handleServoNeutralChange("2", parseInt(e.target.value) || 0)}
                            className="rounded bg-gray-700 text-white w-12 text-center"
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default JoyAnalog; его не трогай!
const Joystick работает.