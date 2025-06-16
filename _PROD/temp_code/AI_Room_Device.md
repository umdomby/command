generator client {
provider = "prisma-client-js"
}

datasource db {
provider  = "postgresql"
url       = env("POSTGRES_PRISMA_URL")
directUrl = env("POSTGRES_URL_NON_POOLING")
}

model User {
id         Int         @id @default(autoincrement())
fullName   String
email      String      @unique
resetToken String?
provider   String?
providerId String?
password   String
role       UserRole    @default(USER)
img        String?
devices    Devices[]
savedRooms SavedRoom[]
createdAt  DateTime    @default(now())
updatedAt  DateTime    @updatedAt
}

model Devices {
id            Int         @id @default(autoincrement())
userId        Int
user          User        @relation(fields: [userId], references: [id])
savedRoom     SavedRoom
diviceName    String?
devicesEnum   DevicesEnum @default(ArduaESP8266)
idDeviceAr    String?
idDevice      String      @unique
autoReconnect Boolean
autoConnect   Boolean
closedDel     Boolean
settings      Settings[]
createdAt     DateTime    @default(now())
updatedAt     DateTime    @updatedAt
}

model Settings {
id             Int     @id @default(autoincrement())
devicesId      Int     @unique
devices        Devices @relation(fields: [devicesId], references: [id])
servo1MinAngle Int?
servo1MaxAngle Int?
servo2MinAngle Int?
servo2MaxAngle Int?
b1             Boolean
b2             Boolean
servoView      Boolean
}

model SavedRoom {
id          Int       @id @default(autoincrement())
userId      Int
user        User      @relation(fields: [userId], references: [id])
devicesId   Int?
devices     Devices?  @relation(fields: [devicesId], references: [id])
roomId      String    @unique
isDefault   Boolean   @default(false)
autoConnect Boolean   @default(false)
createdAt   DateTime  @default(now())
updatedAt   DateTime  @updatedAt
}

enum DevicesEnum {
ArduaESP8266
}

enum UserRole {
USER
ADMIN
}

\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\components\control\SocketClient.tsx
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\components\webrtc\VideoCallApp.tsx


// file: docker-ardua-444/components/control/SocketClient.tsx
// file: components/control/SocketClient.tsx
"use client"
import {useState, useEffect, useRef, useCallback} from 'react'
import {Button} from "@/components/ui/button"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Input} from "@/components/ui/input"
import {ChevronDown, ChevronUp, ArrowUp, ArrowDown, ArrowLeft, ArrowRight} from "lucide-react"
import {Checkbox} from "@/components/ui/checkbox"
import {Label} from "@/components/ui/label"
import Joystick from '@/components/control/Joystick'
import {useServo} from '@/components/ServoContext';
import {
getDevices,
addDevice,
deleteDevice,
updateDeviceSettings,
updateServoSettings,
sendDeviceSettingsToESP
} from '@/app/actions';

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
}

type LogEntry = {
me: string
ty: 'client' | 'esp' | 'server' | 'error' | 'success'
}

interface SocketClientProps {
onConnectionStatusChange?: (isFullyConnected: boolean) => void;
}

export default function SocketClient({onConnectionStatusChange}: SocketClientProps) {
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

    const [log, setLog] = useState<LogEntry[]>([])
    const [isConnected, setIsConnected] = useState(false)
    const [isIdentified, setIsIdentified] = useState(false)
    const [de, setDe] = useState('123')
    const [inputDe, setInputDe] = useState('123')
    const [newDe, setNewDe] = useState('')
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
    const [showServos, setShowServos] = useState<boolean | null>(null)
    const [activeTab, setActiveTab] = useState<'esp' | 'controls' | null>('esp');

    const lastHeartbeatLogTime = useRef<number>(0);
    const reconnectAttemptRef = useRef(0)
    const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
    const socketRef = useRef<WebSocket | null>(null)
    const commandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

    const addLog = useCallback((msg: string, ty: LogEntry['ty']) => {
        setLog(prev => [...prev.slice(-100), {me: `${new Date().toLocaleTimeString()}: ${msg}`, ty}]);
    }, []);

    // Загрузка устройств и настроек из базы данных
    useEffect(() => {
        const loadDevices = async () => {
            try {
                const devices = await getDevices();
                setDeviceList(devices.map(d => d.idDevice));
                if (devices.length > 0) {
                    const device = devices[0];
                    setInputDe(device.idDevice);
                    setDe(device.idDevice);
                    currentDeRef.current = device.idDevice;
                    setAutoReconnect(device.autoReconnect ?? false); // Загрузка из базы
                    setAutoConnect(device.autoConnect ?? false); // Загрузка из базы
                    setClosedDel(device.closedDel ?? false); // Загрузка из базы
                    if (device.settings) {
                        setServo1MinAngle(device.settings.servo1MinAngle || 0);
                        setServo1MaxAngle(device.settings.servo1MaxAngle || 180);
                        setServo2MinAngle(device.settings.servo2MinAngle || 0);
                        setServo2MaxAngle(device.settings.servo2MaxAngle || 180);
                        setButton1State(device.settings.b1 ?? false);
                        setButton2State(device.settings.b2 ?? false);
                        setShowServos(device.settings.servoView ?? true);
                        setServo1MinInput((device.settings.servo1MinAngle || 0).toString());
                        setServo1MaxInput((device.settings.servo1MaxAngle || 180).toString());
                        setServo2MinInput((device.settings.servo2MinAngle || 0).toString());
                        setServo2MaxInput((device.settings.servo2MaxAngle || 180).toString());
                    }
                    if (socketRef.current?.readyState === WebSocket.OPEN) {
                        const settings = await sendDeviceSettingsToESP(device.idDevice);
                        socketRef.current.send(JSON.stringify({
                            co: 'SET_SERVO1_LIMITS',
                            pa: {min: settings.servo1MinAngle, max: settings.servo1MaxAngle},
                            de: device.idDevice,
                            ts: Date.now(),
                            expectAck: true
                        }));
                        socketRef.current.send(JSON.stringify({
                            co: 'SET_SERVO2_LIMITS',
                            pa: {min: settings.servo2MinAngle, max: settings.servo2MaxAngle},
                            de: device.idDevice,
                            ts: Date.now(),
                            expectAck: true
                        }));
                        socketRef.current.send(JSON.stringify({
                            co: 'SET_SERVO_VIEW',
                            pa: {visible: settings.servoView},
                            de: device.idDevice,
                            ts: Date.now(),
                            expectAck: true
                        }));
                    }
                    if (device.autoConnect) {
                        connectWebSocket(device.idDevice);
                    }
                } else {
                    setDeviceList(['123']);
                    setInputDe('123');
                    setDe('123');
                    setShowServos(true);
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
            }
        };
        loadDevices();
    }, [setServo1MinAngle, setServo1MaxAngle, setServo2MinAngle, setServo2MaxAngle, addLog]);

    const handleServoInputChange = useCallback(
        (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
            // Разрешаем ввод любых цифр или пустую строку, но не больше 180
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

                // Ограничиваем значения до 180
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
                    await updateServoSettings(inputDe, updateData);
                    if (socketRef.current?.readyState === WebSocket.OPEN) {
                        if (field === 'servo1Min' || field === 'servo1Max') {
                            socketRef.current.send(JSON.stringify({
                                co: 'SET_SERVO1_LIMITS',
                                pa: {min: servo1MinAngle, max: servo1MaxAngle},
                                de: inputDe,
                                ts: Date.now(),
                                expectAck: true
                            }));
                        } else {
                            socketRef.current.send(JSON.stringify({
                                co: 'SET_SERVO2_LIMITS',
                                pa: {min: servo2MinAngle, max: servo2MaxAngle},
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
                setIsLandscape(window.screen.orientation.type.includes('landscape'))
            } else {
                setIsLandscape(window.innerWidth > window.innerHeight)
            }
        }

        checkOrientation()

        if (window.screen.orientation) {
            window.screen.orientation.addEventListener('change', checkOrientation)
        } else {
            window.addEventListener('resize', checkOrientation)
        }

        return () => {
            if (window.screen.orientation) {
                window.screen.orientation.removeEventListener('change', checkOrientation)
            } else {
                window.removeEventListener('resize', checkOrientation)
            }
        }
    }, [])

    useEffect(() => {
        currentDeRef.current = inputDe
    }, [inputDe])

    useEffect(() => {
        const isFullyConnected = isConnected && isIdentified && espConnected;
        onConnectionStatusChange?.(isFullyConnected);
    }, [isConnected, isIdentified, espConnected, onConnectionStatusChange]);

    // Обработчики для настроек устройства
    const toggleAutoReconnect = useCallback(async (checked: boolean) => {
        setAutoReconnect(checked);
        try {
            await updateDeviceSettings(inputDe, {autoReconnect: checked});
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
            await updateDeviceSettings(inputDe, {autoConnect: checked});
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
            await updateDeviceSettings(inputDe, {closedDel: checked});
            addLog(`Запрет удаления: ${checked ? 'включен' : 'выключен'}`, 'success');
        } catch (error: unknown) {
            setClosedDel(!checked);
            const errorMessage = error instanceof Error ? error.message : String(error);
            addLog(`Ошибка сохранения closedDel: ${errorMessage}`, 'error');
        }
    }, [inputDe, addLog]);

    // Форматирование и очистка ID устройства
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

    // Добавление нового устройства
    const saveNewDe = useCallback(async () => {
        const cleanId = cleanDeviceId(newDe);
        if (cleanId.length === 16 && !deviceList.includes(cleanId)) {
            try {
                await addDevice(cleanId, autoConnect, autoReconnect, closedDel);
                setDeviceList(prev => [...prev, cleanId]);
                setInputDe(cleanId);
                setNewDe('');
                currentDeRef.current = cleanId;
                addLog(`Устройство ${cleanId} добавлено`, 'success');
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                addLog(`Ошибка добавления устройства: ${errorMessage}`, 'error');
            }
        }
    }, [newDe, deviceList, autoConnect, autoReconnect, closedDel, addLog]);

    // Удаление устройства
    const handleDeleteDevice = useCallback(async () => {
        if (!closedDel && confirm("Удалить устройство?")) {
            try {
                await deleteDevice(inputDe);
                const updatedList = deviceList.filter(id => id !== inputDe);
                const defaultDevice = updatedList.length > 0 ? updatedList[0] : '123';
                setDeviceList(updatedList.length ? updatedList : ['123']);
                setInputDe(defaultDevice);
                setDe(defaultDevice);
                currentDeRef.current = defaultDevice;
            } catch (error: unknown) {
                console.error('Ошибка при удалении устройства:', error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                addLog(`Ошибка: ${errorMessage}`, 'error');
            }
        }
    }, [inputDe, deviceList, closedDel, addLog]);

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
            setShowServos(prev => !prev);
            const newState = !showServos;
            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                    co: 'SET_SERVO_VIEW',
                    pa: {visible: newState},
                    de: inputDe,
                    ts: Date.now(),
                    expectAck: true
                }));
            }
            await updateServoSettings(inputDe, {servoView: newState});
            addLog(`Видимость сервоприводов: ${newState ? 'включена' : 'выключена'}`, 'success');
        } catch (error: unknown) {
            setShowServos(prev => !prev);
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

            ws.send(JSON.stringify({ty: "clt", ct: "browser"}));
            ws.send(JSON.stringify({ty: "idn", de: deToConnect}));
            ws.send(JSON.stringify({co: "GET_RELAYS", de: deToConnect, ts: Date.now()}));

            sendDeviceSettingsToESP(deToConnect)
                .then(settings => {
                    if (ws.readyState === WebSocket.OPEN) {
                        if (settings.servo1MinAngle !== undefined && settings.servo1MaxAngle !== undefined) {
                            ws.send(
                                JSON.stringify({
                                    co: 'SET_SERVO1_LIMITS',
                                    pa: {min: settings.servo1MinAngle, max: settings.servo1MaxAngle},
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
                                    pa: {min: settings.servo2MinAngle, max: settings.servo2MaxAngle},
                                    de: deToConnect,
                                    ts: Date.now(),
                                    expectAck: true,
                                })
                            );
                        }
                        ws.send(
                            JSON.stringify({
                                co: 'SET_SERVO_VIEW',
                                pa: {visible: settings.servoView},
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

                if (data.ty === 'ack') {
                    if (data.co === 'RLY' && data.pa) {
                        if (data.pa.pin === 'D0') {
                            const newState = data.pa.state === 'on';
                            setButton1State(newState);
                            updateServoSettings(deToConnect, {b1: newState}).catch((error: unknown) => {
                                const errorMessage = error instanceof Error ? error.message : String(error);
                                addLog(`Ошибка сохранения b1: ${errorMessage}`, 'error');
                            });
                            addLog(`Реле 1 (D0) ${newState ? 'включено' : 'выключено'}`, 'esp');
                        } else if (data.pa.pin === '3') {
                            const newState = data.pa.state === 'on';
                            setButton2State(newState);
                            updateServoSettings(deToConnect, {b2: newState}).catch((error: unknown) => {
                                const errorMessage = error instanceof Error ? error.message : String(error);
                                addLog(`Ошибка сохранения b2: ${errorMessage}`, 'error');
                            });
                            addLog(`Реле 2 (3) ${newState ? 'включено' : 'выключено'}`, 'esp');
                        }
                    } else if (data.co === 'SPD' && data.sp !== undefined) {
                        addLog(`Скорость установлена: ${data.sp} для мотора ${data.mo || 'unknown'}`, 'esp');
                    } else {
                        addLog(`Команда ${data.co} подтверждена`, 'esp');
                    }
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
                } else if (data.ty === 'log') {
                    if (data.me === 'Heartbeat - OK' && Date.now() - lastHeartbeatLogTime.current < 1000) {
                        return;
                    }
                    if (data.me === 'Heartbeat - OK') {
                        lastHeartbeatLogTime.current = Date.now();
                    }
                    addLog(`ESP: ${data.me}`, 'esp');
                    if (data.b1 !== undefined) {
                        const newState = data.b1 === 'on';
                        setButton1State(newState);
                        updateServoSettings(deToConnect, {b1: newState}).catch((error: unknown) => {
                            const errorMessage = error instanceof Error ? error.message : String(error);
                            addLog(`Ошибка сохранения b1: ${errorMessage}`, 'error');
                        });
                        addLog(`Реле 1 (D0): ${newState ? 'включено' : 'выключено'}`, 'esp');
                    }
                    if (data.b2 !== undefined) {
                        const newState = data.b2 === 'on';
                        setButton2State(newState);
                        updateServoSettings(deToConnect, {b2: newState}).catch((error: unknown) => {
                            const errorMessage = error instanceof Error ? error.message : String(error);
                            addLog(`Ошибка сохранения b2: ${errorMessage}`, 'error');
                        });
                        addLog(`Реле 2 (3): ${newState ? 'включено' : 'выключено'}`, 'esp');
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
                } else if (data.ty === 'est') {
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

    useEffect(() => {
        if (autoConnect && !isConnected) {
            connectWebSocket(currentDeRef.current);
        }
    }, [autoConnect, connectWebSocket, isConnected]);

    const disconnectWebSocket = useCallback(() => {
        return new Promise<void>((resolve) => {
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
            resolve();
        });
    }, [addLog, cleanupWebSocket]);

    const handleDeviceChange = useCallback(async (value: string) => {
        setInputDe(value);
        currentDeRef.current = value;
        try {
            const devices = await getDevices();
            const selectedDevice = devices.find(device => device.idDevice === value);
            if (selectedDevice) {
                setAutoReconnect(selectedDevice.autoReconnect ?? false);
                setAutoConnect(selectedDevice.autoConnect ?? false);
                setClosedDel(selectedDevice.closedDel ?? false);
                if (selectedDevice.settings) {
                    setServo1MinAngle(selectedDevice.settings.servo1MinAngle || 0);
                    setServo1MaxAngle(selectedDevice.settings.servo1MaxAngle || 180);
                    setServo2MinAngle(selectedDevice.settings.servo2MinAngle || 0);
                    setServo2MaxAngle(selectedDevice.settings.servo2MaxAngle || 180);
                    setButton1State(selectedDevice.settings.b1 ?? false);
                    setButton2State(selectedDevice.settings.b2 ?? false);
                    setShowServos(selectedDevice.settings.servoView ?? true);
                    setServo1MinInput((selectedDevice.settings.servo1MinAngle || 0).toString());
                    setServo1MaxInput((selectedDevice.settings.servo1MaxAngle || 180).toString());
                    setServo2MinInput((selectedDevice.settings.servo2MinAngle || 0).toString());
                    setServo2MaxInput((selectedDevice.settings.servo2MaxAngle || 180).toString());
                }
                if (autoReconnect) {
                    await disconnectWebSocket();
                    connectWebSocket(value);
                }
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            addLog(`Ошибка при смене устройства: ${errorMessage}`, 'error');
        }
    }, [autoReconnect, disconnectWebSocket, connectWebSocket, addLog, setServo1MinAngle, setServo1MaxAngle, setServo2MinAngle, setServo2MaxAngle]);

    const sendCommand = useCallback((co: string, pa?: any) => {
        if (!isIdentified) {
            addLog("Невозможно отправить команду: не идентифицирован", 'error');
            return;
        }

        if (socketRef.current?.readyState === WebSocket.OPEN) {
            const msg = JSON.stringify({
                co,
                pa,
                de,
                ts: Date.now(),
                expectAck: true
            });

            socketRef.current.send(msg);
            addLog(`Отправлена команда на ${de}: ${co}`, 'client');

            if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
            commandTimeoutRef.current = setTimeout(() => {
                if (espConnected) {
                    addLog(`Команда ${co} не подтверждена ESP`, 'error');
                    setEspConnected(false);
                }
            }, 5000);
        } else {
            addLog("WebSocket не готов!", 'error');
        }
    }, [addLog, de, isIdentified, espConnected]);

    const createMotorHandler = useCallback((mo: 'A' | 'B') => { // motor → mo
        const lastCommandRef = mo === 'A' ? lastMotorACommandRef : lastMotorBCommandRef
        const throttleRef = mo === 'A' ? motorAThrottleRef : motorBThrottleRef
        const setSpeed = mo === 'A' ? setMotorASpeed : setMotorBSpeed
        const setDirection = mo === 'A' ? setMotorADirection : setMotorBDirection

        return (value: number) => {
            let direction: 'forward' | 'backward' | 'stop' = 'stop'
            let sp = 0 // speed → sp

            if (value > 0) {
                direction = 'forward'
                sp = value // speed → sp
            } else if (value < 0) {
                direction = 'backward'
                sp = -value // speed → sp
            }

            setSpeed(sp) // speed → sp
            setDirection(direction)

            const currentCommand = {sp, direction} // speed → sp
            if (JSON.stringify(lastCommandRef.current) === JSON.stringify(currentCommand)) {
                return
            }

            lastCommandRef.current = currentCommand

            if (sp === 0) { // speed → sp
                if (throttleRef.current) {
                    clearTimeout(throttleRef.current)
                    throttleRef.current = null
                }
                sendCommand("SPD", {mo, sp: 0}) // set_speed → SPD, motor → mo, speed → sp
                sendCommand(mo === 'A' ? "MSA" : "MSB")
                return
            }

            if (throttleRef.current) {
                clearTimeout(throttleRef.current)
            }

            throttleRef.current = setTimeout(() => {
                sendCommand("SPD", {mo, sp}) // set_speed → SPD, motor → mo, speed → sp
                sendCommand(direction === 'forward'
                    ? `MF${mo}` // motor_a_forward → MFA, motor_b_forward → MFB
                    : `MR${mo}`) // motor_a_backward → MRA, motor_b_backward → MRB
            }, 40)
        }
    }, [sendCommand])

    const adjustServo = useCallback(
        (servoId: '1' | '2', delta: number) => {
            const currentAngle = servoId === '1' ? servoAngle : servo2Angle;
            const minAngle = servoId === '1' ? servo1MinAngle : servo2MinAngle;
            const maxAngle = servoId === '1' ? servo1MaxAngle : servo2MaxAngle;

            const newAngle = Math.max(minAngle, Math.min(maxAngle, currentAngle + delta));

            if (newAngle === currentAngle) {
                addLog(`Угол сервопривода ${servoId} не изменён: в пределах ${minAngle}-${maxAngle}`, 'error');
                return;
            }

            sendCommand(servoId === '1' ? 'SSR' : 'SSR2', {an: newAngle});
        },
        [servoAngle, servo2Angle, servo1MinAngle, servo1MaxAngle, servo2MinAngle, servo2MaxAngle, sendCommand, addLog]
    );

    const handleMotorAControl = createMotorHandler('A');
    const handleMotorBControl = createMotorHandler('B');

    const emergencyStop = useCallback(() => {
        sendCommand("SPD", {mo: 'A', sp: 0});
        sendCommand("SPD", {mo: 'B', sp: 0});
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

    useEffect(() => {
        const interval = setInterval(() => {
            if (isConnected && isIdentified) sendCommand("HBT");
        }, 1000);
        return () => clearInterval(interval);
    }, [isConnected, isIdentified, sendCommand]);

    const handleOpenControls = () => {
        setActiveTab(null);
    };

    const handleCloseControls = () => {
        setActiveTab(activeTab === 'controls' ? null : 'controls');
    };

    return (
        <div className="flex flex-col items-center min-h-[calc(100vh-3rem)] p-4 overflow-hidden relative">
            {activeTab === 'controls' && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-full max-w-md z-50">

                    <div
                        className="space-y-2 bg-black rounded-lg p-2 sm:p-2 border border-gray-200 backdrop-blur-sm"
                        style={{maxHeight: '90vh', overflowY: 'auto'}}
                    >
                        <div className="flex flex-col items-center space-y-2">
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${
                                    isConnected
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

                        <Button
                            onClick={handleOpenControls}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 h-8 sm:h-10 text-xs sm:text-sm"
                        >
                            Управление
                        </Button>

                        <div className="flex space-x-2">
                            <Select
                                value={inputDe}
                                onValueChange={handleDeviceChange}
                                disabled={isConnected && !autoReconnect}
                            >
                                <SelectTrigger className="flex-1 bg-transparent h-8 sm:h-10">
                                    <SelectValue placeholder="Выберите устройство"/>
                                </SelectTrigger>
                                <SelectContent className="bg-transparent backdrop-blur-sm border border-gray-200">
                                    {deviceList.map(id => (
                                        <SelectItem key={id} value={id}
                                                    className="hover:bg-gray-100/50 text-xs sm:text-sm">
                                            {formatDeviceId(id)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                onClick={handleDeleteDevice}
                                disabled={closedDel}
                                className="bg-red-600 hover:bg-red-700 h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm"
                            >
                                Удалить
                            </Button>
                        </div>

                        <div className="space-y-1 sm:space-y-2">
                            <Label className="block text-xs sm:text-sm font-medium text-gray-700">Добавить новое
                                устройство</Label>
                            <div className="flex space-x-2">
                                <Input
                                    value={newDe}
                                    onChange={handleNewDeChange}
                                    placeholder="XXXX-XXXX-XXXX-XXXX"
                                    className="flex-1 bg-transparent h-8 sm:h-10 text-xs sm:text-sm uppercase"
                                    maxLength={19}
                                />
                                <Button
                                    onClick={saveNewDe}
                                    disabled={isAddDisabled}
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
                                    checked={autoReconnect}
                                    onCheckedChange={toggleAutoReconnect}
                                    className={`border-gray-300 w-4 h-4 sm:w-5 sm:h-5 ${autoReconnect ? 'bg-green-500' : 'bg-white'}`}
                                />
                                <Label htmlFor="auto-reconnect"
                                       className="text-xs sm:text-sm font-medium text-gray-700">
                                    Автоматическое переподключение при смене устройства
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="auto-connect"
                                    checked={autoConnect}
                                    onCheckedChange={toggleAutoConnect}
                                    className={`border-gray-300 w-4 h-4 sm:w-5 sm:h-5 ${autoConnect ? 'bg-green-500' : 'bg-white'}`}
                                />
                                <Label htmlFor="auto-connect" className="text-xs sm:text-sm font-medium text-gray-700">
                                    Автоматическое подключение при загрузке страницы
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="closed-del"
                                    checked={closedDel}
                                    onCheckedChange={toggleClosedDel}
                                    className={`border-gray-300 w-4 h-4 sm:w-5 sm:h-5 ${closedDel ? 'bg-green-500' : 'bg-white'}`}
                                />
                                <Label htmlFor="closed-del" className="text-xs sm:text-sm font-medium text-gray-700">
                                    Запретить удаление устройств
                                </Label>
                            </div>
                        </div>

                        <div className="space-y-2 sm:space-y-3">
                            <Label className="block text-xs sm:text-sm font-medium text-gray-700">Настройки
                                сервоприводов</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label htmlFor="servo1-min" className="text-xs sm:text-sm">Servo 1 Min (°)</Label>
                                    <Input
                                        type="text"
                                        value={servo1MinInput}
                                        onChange={(e) => handleServoInputChange(setServo1MinInput, e.target.value)}
                                        onBlur={(e) => handleServoInputBlur('servo1Min', e.target.value)}
                                        placeholder="0"
                                        className="bg-gray-700 text-white border-gray-600"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="servo1-max" className="text-xs sm:text-sm">Servo 1 Max (°)</Label>
                                    <Input
                                        type="text"
                                        value={servo1MaxInput}
                                        onChange={(e) => handleServoInputChange(setServo1MaxInput, e.target.value)}
                                        onBlur={(e) => handleServoInputBlur('servo1Max', e.target.value)}
                                        placeholder="0"
                                        className={`bg-gray-700 text-white border-gray-600 ${parseInt(servo1MaxInput || '0') < servo1MinAngle ? 'border-red-500' : ''}`}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="servo2-min" className="text-xs sm:text-sm">Servo 2 Min (°)</Label>
                                    <Input
                                        type="text"
                                        value={servo2MinInput}
                                        onChange={(e) => handleServoInputChange(setServo2MinInput, e.target.value)}
                                        onBlur={(e) => handleServoInputBlur('servo2Min', e.target.value)}
                                        placeholder="0"
                                        className="bg-gray-700 text-white border-gray-600"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="servo2-max" className="text-xs sm:text-sm">Servo 2 Max (°)</Label>
                                    <Input
                                        type="text"
                                        value={servo2MaxInput}
                                        onChange={(e) => handleServoInputChange(setServo2MaxInput, e.target.value)}
                                        onBlur={(e) => handleServoInputBlur('servo2Max', e.target.value)}
                                        placeholder="0"
                                        className={`bg-gray-700 text-white border-gray-600 ${parseInt(servo2MaxInput || '0') < servo2MinAngle ? 'border-red-500' : ''}`}
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={() => setLogVisible(!logVisible)}
                            variant="outline"
                            className="w-full border-gray-300 bg-transparent hover:bg-gray-100/50 h-8 sm:h-10 text-xs sm:text-sm"
                        >
                            {logVisible ? (
                                <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 mr-2"/>
                            ) : (
                                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 mr-2"/>
                            )}
                            {logVisible ? "Скрыть логи" : "Показать логи"}
                        </Button>

                        {logVisible && (
                            <div
                                className="border border-gray-200 rounded-md overflow-hidden bg-transparent backdrop-blur-sm">
                                <div className="h-32 sm:h-48 overflow-y-auto p-2 bg-transparent text-xs font-mono">
                                    {log.length === 0 ? (
                                        <div className="text-gray-500 italic">Логов пока нет</div>
                                    ) : (
                                        log.slice().reverse().map((entry, index) => (
                                            <div
                                                key={index}
                                                className={`truncate py-1 ${
                                                    entry.ty === 'client' ? 'text-blue-600' :
                                                        entry.ty === 'esp' ? 'text-green-600' :
                                                            entry.ty === 'server' ? 'text-purple-600' :
                                                                entry.ty === 'success' ? 'text-teal-600' :
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
                <Joystick
                    mo="A"
                    onChange={handleMotorAControl}
                    direction={motorADirection}
                    sp={motorASpeed}
                />

                <Joystick
                    mo="B"
                    onChange={handleMotorBControl}
                    direction={motorBDirection}
                    sp={motorBSpeed}
                />

                <div className="fixed bottom-3 left-1/2 transform -translate-x-1/2 flex flex-col space-y-2 z-50">
                    {showServos && (
                        <>
                            <div className="flex flex-col items-center">
                                <div className="flex items-center justify-center space-x-2">
                                    <Button
                                        onClick={() => adjustServo('1', -180)}
                                        className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 p-2 rounded-full transition-all"
                                    >
                                        <ArrowLeft className="h-5 w-5"/>
                                    </Button>
                                    <Button
                                        onClick={() => adjustServo('1', -15)}
                                        className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 p-2 rounded-full"
                                    >
                                        <ArrowDown className="h-5 w-5"/>
                                    </Button>
                                    <Button
                                        onClick={() => adjustServo('1', 15)}
                                        className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 p-2 rounded-full"
                                    >
                                        <ArrowUp className="h-5 w-5"/>
                                    </Button>
                                    <Button
                                        onClick={() => adjustServo('1', 180)}
                                        className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 p-2 rounded-full"
                                    >
                                        <ArrowRight className="h-5 w-5"/>
                                    </Button>
                                </div>
                                <span className="text-sm font-medium text-gray-700 mt-1">{servoAngle}°</span>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="flex items-center justify-center space-x-2">
                                    <Button
                                        onClick={() => adjustServo('2', -180)}
                                        className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 p-2 rounded-full"
                                    >
                                        <ArrowLeft className="h-5 w-5"/>
                                    </Button>
                                    <Button
                                        onClick={() => adjustServo('2', -15)}
                                        className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 p-2 rounded-full"
                                    >
                                        <ArrowDown className="h-5 w-5"/>
                                    </Button>
                                    <Button
                                        onClick={() => adjustServo('2', 15)}
                                        className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 p-2 rounded-full"
                                    >
                                        <ArrowUp className="h-5 w-5"/>
                                    </Button>
                                    <Button
                                        onClick={() => adjustServo('2', 180)}
                                        className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 p-2 rounded-full"
                                    >
                                        <ArrowRight className="h-5 w-5"/>
                                    </Button>
                                </div>
                                <span className="text-sm font-medium text-gray-700 mt-1">{servo2Angle}°</span>
                            </div>
                        </>
                    )}

                    {inputVoltage !== null && (
                        <span
                            className="text-xl font-medium text-green-600 bg-transparent rounded-full flex items-center justify-center"
                        >
                            {inputVoltage.toFixed(2)}
                        </span>
                    )}

                    <div className="flex items-center justify-center space-x-2">
                        {button1State !== null && (
                            <Button
                                onClick={() => {
                                    const newState = button1State ? 'off' : 'on';
                                    sendCommand('RLY', {pin: 'D0', state: newState});
                                }}
                                className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 p-2 rounded-full transition-all flex items-center"
                            >
                                {button1State ? (
                                    <img width={'25px'} height={'25px'} src="/off.svg" alt="Image"/>
                                ) : (
                                    <img width={'25px'} height={'25px'} src="/on.svg" alt="Image"/>
                                )}
                            </Button>
                        )}

                        {button2State !== null && (
                            <Button
                                onClick={() => {
                                    const newState = button2State ? 'off' : 'on';
                                    sendCommand('RLY', {pin: '3', state: newState});
                                    // Не обновляем состояние локально, ждём ответа сервера
                                }}
                                className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 p-2 rounded-full transition-all flex items-center"
                            >
                                {button2State ? (
                                    <img width={'25px'} height={'25px'} src="/off.svg" alt="Image"/>
                                ) : (
                                    <img width={'25px'} height={'25px'} src="/on.svg" alt="Image"/>
                                )}
                            </Button>
                        )}

                        {showServos !== null && (
                            <Button
                                onClick={toggleServosVisibility}
                                className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 p-2 rounded-full transition-all flex items-center"
                                title={showServos ? 'Скрыть сервоприводы' : 'Показать сервоприводы'}
                            >
                                {showServos ? (
                                    <img width={'25px'} height={'25px'} src="/turn2.svg" alt="Image"/>
                                ) : (
                                    <img width={'25px'} height={'25px'} src="/turn1.svg" alt="Image"/>
                                )}
                            </Button>
                        )}

                        <Button
                            onClick={handleCloseControls}
                            className="bg-transparent hover:bg-gray-700/30 backdrop-blur-sm border border-gray-600 p-2 rounded-full transition-all flex items-center"
                        >
                            {activeTab === 'controls' ? (
                                <img width={'25px'} height={'25px'} src="/settings2.svg" alt="Image"/>
                            ) : (
                                <img width={'25px'} height={'25px'} src="/settings1.svg" alt="Image"/>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// file: docker-ardua-444/components/webrtc/VideoCallApp.tsx
'use client'

import { useWebRTC } from './hooks/useWebRTC'
import styles from './styles.module.css'
import { VideoPlayer } from './components/VideoPlayer'
import { DeviceSelector } from './components/DeviceSelector'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import SocketClient from '../control/SocketClient'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { getSavedRooms, saveRoom, deleteRoom, setDefaultRoom, updateAutoConnect } from '@/app/actions'
import { debounce } from 'lodash';

type VideoSettings = {
rotation: number
flipH: boolean
flipV: boolean
}

type SavedRoom = {
id: string
isDefault: boolean
autoConnect: boolean
}

export const VideoCallApp = () => {
const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
const [selectedDevices, setSelectedDevices] = useState({
video: '',
audio: ''
})
const [showLocalVideo, setShowLocalVideo] = useState(true)
const [videoTransform, setVideoTransform] = useState('')
const [roomId, setRoomId] = useState('')
const [username, setUsername] = useState('user_' + Math.floor(Math.random() * 1000))
const [hasPermission, setHasPermission] = useState(false)
const [devicesLoaded, setDevicesLoaded] = useState(false)
const [isJoining, setIsJoining] = useState(false)
const [autoJoin, setAutoJoin] = useState(false)
const [activeMainTab, setActiveMainTab] = useState<'webrtc' | 'esp' | null>(null)
const [showControls, setShowControls] = useState(false)
const [showCam, setShowCam] = useState(false)
const [videoSettings, setVideoSettings] = useState<VideoSettings>({
rotation: 0,
flipH: false,
flipV: false
})
const [muteLocalAudio, setMuteLocalAudio] = useState(false)
const [muteRemoteAudio, setMuteRemoteAudio] = useState(false)
const videoContainerRef = useRef<HTMLDivElement>(null)
const [isFullscreen, setIsFullscreen] = useState(false)
const remoteVideoRef = useRef<HTMLVideoElement>(null)
const localAudioTracks = useRef<MediaStreamTrack[]>([])
const [useBackCamera, setUseBackCamera] = useState(false)
const [savedRooms, setSavedRooms] = useState<SavedRoom[]>([])
const [showDeleteDialog, setShowDeleteDialog] = useState(false)
const [roomToDelete, setRoomToDelete] = useState<string | null>(null)
const [selectedCodec, setSelectedCodec] = useState<'VP8' | 'H264'>('VP8')
const [isDeviceConnected, setIsDeviceConnected] = useState(false)
const [isClient, setIsClient] = useState(false)

    const webRTCRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setIsClient(true)
    }, [])

    const {
        localStream,
        remoteStream,
        users,
        joinRoom,
        leaveRoom,
        isCallActive,
        isConnected,
        isInRoom,
        error,
        setError,
        ws,
        activeCodec
    } = useWebRTC(selectedDevices, username, roomId.replace(/-/g, ''), selectedCodec);

    useEffect(() => {
        console.log('Состояния:', { isConnected, isInRoom, isCallActive, error });
        if (isInRoom && isCallActive && activeMainTab !== 'esp') {
            setActiveMainTab('esp');
        }
    }, [isConnected, isInRoom, isCallActive, error]);

    useEffect(() => {
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

        const loadSavedRooms = async () => {
            try {
                const rooms = await getSavedRooms()
                setSavedRooms(rooms)
                const defaultRoom = rooms.find(r => r.isDefault)
                if (defaultRoom) {
                    setRoomId(formatRoomId(defaultRoom.id))
                    setAutoJoin(defaultRoom.autoConnect)
                }
            } catch (e) {
                console.error('Failed to load saved rooms', e)
            }
        }

        const savedMuteLocal = localStorage.getItem('muteLocalAudio')
        if (savedMuteLocal !== null) {
            setMuteLocalAudio(savedMuteLocal === 'true')
        }

        const savedMuteRemote = localStorage.getItem('muteRemoteAudio')
        if (savedMuteRemote !== null) {
            setMuteRemoteAudio(savedMuteRemote === 'true')
        }

        const savedShowLocalVideo = localStorage.getItem('showLocalVideo')
        if (savedShowLocalVideo !== null) {
            setShowLocalVideo(savedShowLocalVideo === 'true')
        }

        const savedCameraPref = localStorage.getItem('useBackCamera')
        if (savedCameraPref !== null) {
            setUseBackCamera(savedCameraPref === 'true')
        }

        const savedAutoJoin = localStorage.getItem('autoJoin') === 'true'
        setAutoJoin(savedAutoJoin)
        setActiveMainTab(savedAutoJoin ? 'esp' : 'webrtc');

        const savedCodec = localStorage.getItem('selectedCodec')
        if (savedCodec === 'VP8' || savedCodec === 'H264') {
            setSelectedCodec(savedCodec)
        }

        loadSettings()
        loadSavedRooms()
        loadDevices()
    }, [])

    useEffect(() => {
        const savedAutoShowControls = localStorage.getItem('autoShowControls')
        if (savedAutoShowControls === 'true' && isDeviceConnected) {
            setActiveMainTab('esp')
        }
    }, [isDeviceConnected])

    const handleCodecChange = useCallback(
        debounce((e: React.ChangeEvent<HTMLSelectElement>) => {
            const codec = e.target.value as 'VP8' | 'H264'
            setSelectedCodec(codec)
            localStorage.setItem('selectedCodec', codec)
        }, 300),
        []
    )

    const formatRoomId = (id: string): string => {
        const cleanedId = id.replace(/[^A-Z0-9]/gi, '')
        return cleanedId.replace(/(.{4})(?=.)/g, '$1-')
    }

    const handleRoomIdChange = useCallback(
        debounce((e: React.ChangeEvent<HTMLInputElement>) => {
            const input = e.target.value.toUpperCase()
            let cleanedInput = input.replace(/[^A-Z0-9-]/gi, '')
            if (cleanedInput.length > 19) {
                cleanedInput = cleanedInput.substring(0, 19)
            }
            const formatted = formatRoomId(cleanedInput)
            setRoomId(formatted)
        }, 300),
        []
    )

    const isRoomIdComplete = roomId.replace(/-/g, '').length === 16

    const handleSaveRoom = useCallback(
        debounce(async () => {
            if (!isRoomIdComplete) return

            try {
                await saveRoom(roomId.replace(/-/g, ''), autoJoin)
                const updatedRooms = await getSavedRooms()
                setSavedRooms(updatedRooms)
            } catch (err) {
                console.error('Ошибка сохранения комнаты:', err)
                setError((err as Error).message)
            }
        }, 300),
        [roomId, autoJoin]
    )

    const handleDeleteRoom = useCallback(
        debounce((roomIdWithoutDashes: string) => {
            setRoomToDelete(roomIdWithoutDashes)
            setShowDeleteDialog(true)
        }, 300),
        []
    )

    const confirmDeleteRoom = useCallback(
        debounce(async () => {
            if (!roomToDelete) return

            try {
                await deleteRoom(roomToDelete)
                const updatedRooms = await getSavedRooms()
                setSavedRooms(updatedRooms)

                if (roomId.replace(/-/g, '') === roomToDelete) {
                    setRoomId('')
                    setAutoJoin(false)
                }
            } catch (err) {
                console.error('Ошибка удаления комнаты:', err)
                setError((err as Error).message)
            }

            setShowDeleteDialog(false)
            setRoomToDelete(null)
        }, 300),
        [roomToDelete, roomId]
    )

    const handleSelectRoom = useCallback(
        debounce((roomIdWithoutDashes: string) => {
            const selectedRoom = savedRooms.find(r => r.id === roomIdWithoutDashes)
            if (selectedRoom) {
                setRoomId(formatRoomId(roomIdWithoutDashes))
                setAutoJoin(selectedRoom.autoConnect)
            }
        }, 300),
        [savedRooms]
    )

    const handleSetDefaultRoom = useCallback(
        debounce(async (roomIdWithoutDashes: string) => {
            try {
                await setDefaultRoom(roomIdWithoutDashes)
                const updatedRooms = await getSavedRooms()
                setSavedRooms(updatedRooms)
            } catch (err) {
                console.error('Ошибка установки комнаты по умолчанию:', err)
                setError((err as Error).message)
            }
        }, 300),
        []
    )

    const toggleCamera = useCallback(
        debounce(() => {
            const newCameraState = !useBackCamera
            setUseBackCamera(newCameraState)
            localStorage.setItem('useBackCamera', String(newCameraState))

            if (isConnected && ws) {
                try {
                    ws.send(JSON.stringify({
                        type: "switch_camera",
                        useBackCamera: newCameraState,
                        room: roomId,
                        username: username
                    }))
                    console.log('Sent camera switch command:', { useBackCamera: newCameraState })
                } catch (err) {
                    console.error('Error sending camera switch command:', err)
                    setError('Failed to switch camera')
                }
            } else {
                console.error('Not connected to WebRTC server')
                setError('No connection to server')
            }
        }, 300),
        [useBackCamera, isConnected, ws, roomId, username]
    )

    useEffect(() => {
        if (localStream) {
            localAudioTracks.current = localStream.getAudioTracks();
            localAudioTracks.current.forEach(track => {
                track.enabled = !muteLocalAudio; // Removed extra parenthesis
            });
        }
    }, [localStream, muteLocalAudio]);

    useEffect(() => {
        if (remoteStream) {
            remoteStream.getAudioTracks().forEach(track => {
                track.enabled = !muteRemoteAudio;
            });
        }
    }, [remoteStream, muteRemoteAudio])

    useEffect(() => {
        if (autoJoin && hasPermission && !isInRoom && isRoomIdComplete) {
            handleJoinRoom()
        }
    }, [autoJoin, hasPermission, isRoomIdComplete])

    const applyVideoTransform = useCallback((settings: VideoSettings) => {
        const { rotation, flipH, flipV } = settings
        let transform = ''
        if (rotation !== 0) transform += `rotate(${rotation}deg) `
        transform += `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`
        setVideoTransform(transform)

        if (remoteVideoRef.current) {
            remoteVideoRef.current.style.transform = transform
            remoteVideoRef.current.style.transformOrigin = 'center center'
        }
    }, [])

    const saveSettings = useCallback((settings: VideoSettings) => {
        localStorage.setItem('videoSettings', JSON.stringify(settings))
    }, [])

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

            setSelectedDevices({
                video: savedVideoDevice || '',
                audio: savedAudioDevice || ''
            })
        } catch (error) {
            console.error('Device access error:', error)
            setHasPermission(false)
            setDevicesLoaded(true)
        }
    }

    const toggleLocalVideo = useCallback(
        debounce(() => {
            const newState = !showLocalVideo
            setShowLocalVideo(newState)
            localStorage.setItem('showLocalVideo', String(newState))
        }, 300),
        [showLocalVideo]
    )

    const updateVideoSettings = useCallback((newSettings: Partial<VideoSettings>) => {
        const updated = { ...videoSettings, ...newSettings }
        setVideoSettings(updated)
        applyVideoTransform(updated)
        saveSettings(updated)
    }, [videoSettings, applyVideoTransform, saveSettings])

    const handleDeviceChange = useCallback(
        debounce((type: 'video' | 'audio', deviceId: string) => {
            setSelectedDevices(prev => ({
                ...prev,
                [type]: deviceId
            }))
            localStorage.setItem(`${type}Device`, deviceId)
        }, 300),
        []
    )

    const handleJoinRoom = useCallback(
        debounce(async () => {
            if (!isRoomIdComplete) {
                console.warn('ID комнаты не полный, подключение невозможно')
                setError('ID комнаты должен состоять из 16 символов')
                return
            }

            setIsJoining(true)
            console.log('Попытка подключения к комнате:', roomId)
            try {
                await handleSetDefaultRoom(roomId.replace(/-/g, ''))
                await joinRoom(username)
                console.log('Успешно подключено к комнате:', roomId)
                setActiveMainTab('esp')
            } catch (error) {
                console.error('Ошибка подключения к комнате:', error)
                setError('Ошибка подключения к комнате: ' + (error instanceof Error ? error.message : String(error)))
            } finally {
                setIsJoining(false)
                console.log('Состояние isJoining сброшено')
            }
        }, 300),
        [isRoomIdComplete, roomId, username, joinRoom, setError, handleSetDefaultRoom]
    )

    const handleCancelJoin = useCallback(
        debounce(() => {
            console.log('Пользователь прервал попытку подключения')
            setIsJoining(false)
            setError(null)
            if (webRTCRetryTimeoutRef.current) {
                clearTimeout(webRTCRetryTimeoutRef.current)
                webRTCRetryTimeoutRef.current = null
            }
            leaveRoom()
            setActiveMainTab('webrtc')
        }, 300),
        [leaveRoom]
    )

    const toggleFullscreen = useCallback(
        debounce(async () => {
            if (!videoContainerRef.current) return

            try {
                if (!document.fullscreenElement) {
                    await videoContainerRef.current.requestFullscreen()
                    setIsFullscreen(true)
                } else {
                    await document.exitFullscreen()
                    setIsFullscreen(false)
                }
            } catch (err) {
                console.error('Fullscreen error:', err)
                setError('Failed to toggle fullscreen')
            }
        }, 300),
        []
    )

    const toggleMuteLocalAudio = useCallback(
        debounce(() => {
            const newState = !muteLocalAudio
            setMuteLocalAudio(newState)
            localStorage.setItem('muteLocalAudio', String(newState))

            localAudioTracks.current.forEach(track => {
                track.enabled = !newState
            })
        }, 300),
        [muteLocalAudio]
    )

    const toggleMuteRemoteAudio = useCallback(
        debounce(() => {
            const newState = !muteRemoteAudio
            setMuteRemoteAudio(newState)
            localStorage.setItem('muteRemoteAudio', String(newState))

            if (remoteStream) {
                remoteStream.getAudioTracks().forEach(track => {
                    track.enabled = !newState
                })
            }
        }, 300),
        [muteRemoteAudio, remoteStream]
    )

    const rotateVideo = useCallback(
        debounce((degrees: number) => {
            updateVideoSettings({ rotation: degrees })

            if (remoteVideoRef.current) {
                if (degrees === 90 || degrees === 270) {
                    remoteVideoRef.current.classList.add(styles.rotated)
                } else {
                    remoteVideoRef.current.classList.remove(styles.rotated)
                }
            }
        }, 300),
        [updateVideoSettings]
    )

    const flipVideoHorizontal = useCallback(
        debounce(() => {
            updateVideoSettings({ flipH: !videoSettings.flipH })
        }, 300),
        [videoSettings, updateVideoSettings]
    )

    const flipVideoVertical = useCallback(
        debounce(() => {
            updateVideoSettings({ flipV: !videoSettings.flipV })
        }, 300),
        [videoSettings, updateVideoSettings]
    )

    const resetVideo = useCallback(
        debounce(() => {
            updateVideoSettings({ rotation: 0, flipH: false, flipV: false })
        }, 300),
        [updateVideoSettings]
    )

    const toggleFlashlight = useCallback(
        debounce(() => {
            if (isConnected && ws) {
                try {
                    ws.send(JSON.stringify({
                        type: "toggle_flashlight",
                        room: roomId.replace(/-/g, ''),
                        username: username
                    }))
                    console.log('Sent flashlight toggle command')
                } catch (err) {
                    console.error('Error sending flashlight command:', err)
                    setError('Failed to toggle flashlight')
                }
            } else {
                console.error('Not connected to server')
                setError('No connection to server')
            }
        }, 300),
        [isConnected, ws, roomId, username, setError]
    )

    const toggleTab = useCallback(
        debounce((tab: 'webrtc' | 'esp' | 'cam' | 'controls') => {
            if (tab === 'cam') {
                setShowCam(!showCam)
            } else if (tab === 'controls') {
                setShowControls(!showControls)
                setActiveMainTab(null)
            } else {
                setActiveMainTab(activeMainTab === tab ? null : tab)
                setShowControls(false)
            }
        }, 300),
        [showCam, showControls, activeMainTab]
    )

    return (
        <div className={styles.container} suppressHydrationWarning>
            <div ref={videoContainerRef} className={styles.remoteVideoContainer} suppressHydrationWarning>
                {isClient && (
                    <VideoPlayer
                        stream={remoteStream}
                        className={styles.remoteVideo}
                        transform={videoTransform}
                        videoRef={remoteVideoRef}
                    />
                )}
            </div>

            {showLocalVideo && (
                <div className={styles.localVideoContainer}>
                    <VideoPlayer
                        stream={localStream}
                        muted
                        className={styles.localVideo}
                    />
                </div>
            )}

            <div className={styles.topControls}>
                <div className={styles.tabsContainer}>
                    <button
                        onClick={() => toggleTab('webrtc')}
                        onTouchEnd={() => toggleTab('webrtc')}
                        className={[styles.tabButton, activeMainTab === 'webrtc' ? styles.activeTab : ''].join(' ')}
                    >
                        {activeMainTab === 'webrtc' ? '▲' : '▼'} <img src="/cam.svg" alt="Camera" />
                    </button>
                    <button
                        onClick={() => toggleTab('esp')}
                        onTouchEnd={() => toggleTab('esp')}
                        className={[styles.tabButton, activeMainTab === 'esp' ? styles.activeTab : ''].join(' ')}
                    >
                        {activeMainTab === 'esp' ? '▲' : '▼'} <img src="/joy.svg" alt="Joystick" />
                    </button>
                    <button
                        onClick={() => toggleTab('cam')}
                        onTouchEnd={() => toggleTab('cam')}
                        className={[styles.tabButton, showCam ? styles.activeTab : ''].join(' ')}
                    >
                        {showCam ? '▲' : '▼'} <img src="/img.svg" alt="Image" />
                    </button>
                </div>
            </div>

            {activeMainTab === 'webrtc' && (
                <div className={[styles.tabContent, styles.webrtcTab].join(' ')}>
                    {error && <div className={styles.error}>{error}</div>}
                    <div className={styles.controls}>
                        <div className={styles.connectionStatus}>
                            Статус: {isConnected ? (isInRoom ? `В комнате ${roomId}` : 'Подключено') : 'Отключено'}
                            {isCallActive && ' (Звонок активен)'}
                            {activeCodec && ` [Кодек: ${activeCodec}]`}
                            {users.length > 0 && (
                                <div>
                                    Роль: "Ведомый"
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className={styles.error}>
                                {error === 'Room does not exist. Leader must join first.'
                                    ? 'Ожидание создания комнаты ведущим... Повторная попытка через 5 секунд'
                                    : error}
                            </div>
                        )}

                        <div className={styles.inputGroup}>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="autoJoin"
                                    checked={autoJoin}
                                    disabled={!isRoomIdComplete}
                                    onCheckedChange={(checked) => {
                                        setAutoJoin(!!checked)
                                        if (isRoomIdComplete) {
                                            updateAutoConnect(roomId.replace(/-/g, ''), !!checked)
                                        }
                                        localStorage.setItem('autoJoin', checked ? 'true' : 'false')
                                    }}
                                    suppressHydrationWarning
                                />
                                <Label htmlFor="autoJoin">Автоматическое подключение</Label>
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <Label htmlFor="room">ID комнаты</Label>
                            <Input
                                id="room"
                                value={roomId}
                                onChange={handleRoomIdChange}
                                disabled={isInRoom || isJoining}
                                placeholder="XXXX-XXXX-XXXX-XXXX"
                                maxLength={19}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <Label htmlFor="username">Ваше имя</Label>
                            <Input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={isInRoom || isJoining}
                                placeholder="Ваше имя"
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            {isInRoom ? (
                                <Button
                                    onClick={leaveRoom}
                                    disabled={!isConnected}
                                    className={styles.button}
                                >
                                    Покинуть комнату
                                </Button>
                            ) : isJoining ? (
                                <Button
                                    onClick={handleCancelJoin}
                                    className={styles.button}
                                    variant="destructive"
                                >
                                    Отменить подключение
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleJoinRoom}
                                    disabled={!hasPermission || !isRoomIdComplete}
                                    className={styles.button}
                                >
                                    Войти в комнату
                                </Button>
                            )}
                        </div>

                        <div className={styles.inputGroup}>
                            <Button
                                onClick={handleSaveRoom}
                                disabled={!isRoomIdComplete || savedRooms.some((r) => r.id === roomId.replace(/-/g, ''))}
                                className={styles.button}
                            >
                                Сохранить ID комнаты
                            </Button>
                        </div>

                        {savedRooms.length > 0 && (
                            <div className={styles.savedRooms}>
                                <h3>Сохраненные комнаты:</h3>
                                <ul>
                                    {savedRooms.map((room) => (
                                        <li key={room.id} className={styles.savedRoomItem}>
                                            <span
                                                onClick={() => handleSelectRoom(room.id)}
                                                onTouchEnd={() => handleSelectRoom(room.id)}
                                                className={room.isDefault ? styles.defaultRoom : ''}
                                            >
                                                {formatRoomId(room.id)}
                                                {room.isDefault && ' (по умолчанию)'}
                                            </span>
                                            {!room.isDefault && (
                                                <button
                                                    onClick={() => handleSetDefaultRoom(room.id)}
                                                    onTouchEnd={() => handleSetDefaultRoom(room.id)}
                                                    className={styles.defaultRoomButton}
                                                >
                                                    Сделать по умолчанию
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteRoom(room.id)}
                                                onTouchEnd={() => handleDeleteRoom(room.id)}
                                                className={styles.deleteRoomButton}
                                            >
                                                Удалить
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <div className={styles.inputGroup}>
                                    <Label htmlFor="codec">Кодек трансляции</Label>
                                    <select
                                        id="codec"
                                        value={selectedCodec}
                                        onChange={handleCodecChange}
                                        disabled={isInRoom}
                                        className={styles.codecSelect}
                                    >
                                        <option value="VP8">VP8</option>
                                        <option value="AV1" disabled>AV1 - в разработке</option>
                                        <option value="H264" disabled>H264 - в разработке</option>
                                        <option value="VP9" disabled>VP9 - в разработке</option>
                                    </select>
                                </div>
                            </div>
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

            {activeMainTab === 'esp' && (
                <div className={[styles.tabContent, styles.espTabContent].join(' ')}>
                    <SocketClient />
                </div>
            )}

            {showCam && (
                <div className={styles.tabContent}>
                    <div className={styles.videoControlsTab}>
                        <div className={styles.controlButtons}>
                            <button
                                onClick={toggleCamera}
                                onTouchEnd={toggleCamera}
                                className={[styles.controlButton, useBackCamera ? styles.active : ''].join(' ')}
                                title={useBackCamera ? 'Переключить на фронтальную камеру' : 'Переключить на заднюю камеру'}
                            >
                                {useBackCamera ? '📷⬅️' : '📷➡️'}
                            </button>
                            <button
                                onClick={() => rotateVideo(0)} // Исправлено: стрелочная функция
                                onTouchEnd={() => rotateVideo(0)} // Исправлено: стрелочная функция
                                className={[styles.controlButton, videoSettings.rotation === 0 ? styles.active : ''].join(' ')}
                                title="Обычная ориентация"
                            >
                                ↻0°
                            </button>
                            <button
                                onClick={() => rotateVideo(90)} // Исправлено: стрелочная функция
                                onTouchEnd={() => rotateVideo(90)} // Исправлено: стрелочная функция
                                className={[styles.controlButton, videoSettings.rotation === 90 ? styles.active : ''].join(' ')}
                                title="Повернуть на 90°"
                            >
                                ↻90°
                            </button>
                            <button
                                onClick={() => rotateVideo(180)} // Исправлено: стрелочная функция
                                onTouchEnd={() => rotateVideo(180)} // Исправлено: стрелочная функция
                                className={[styles.controlButton, videoSettings.rotation === 180 ? styles.active : ''].join(' ')}
                                title="Повернуть на 180°"
                            >
                                ↻180°
                            </button>
                            <button
                                onClick={() => rotateVideo(270)} // Исправлено: стрелочная функция
                                onTouchEnd={() => rotateVideo(270)} // Исправлено: стрелочная функция
                                className={[styles.controlButton, videoSettings.rotation === 270 ? styles.active : ''].join(' ')}
                                title="Повернуть на 270°"
                            >
                                ↻270°
                            </button>
                            <button
                                onClick={flipVideoHorizontal}
                                onTouchEnd={flipVideoHorizontal}
                                className={[styles.controlButton, videoSettings.flipH ? styles.active : ''].join(' ')}
                                title="Отразить по горизонтали"
                            >
                                ⇄
                            </button>
                            <button
                                onClick={flipVideoVertical}
                                onTouchEnd={flipVideoVertical}
                                className={[styles.controlButton, videoSettings.flipV ? styles.active : ''].join(' ')}
                                title="Отразить по вертикали"
                            >
                                ⇅
                            </button>
                            <button
                                onClick={resetVideo}
                                onTouchEnd={resetVideo}
                                className={styles.controlButton}
                                title="Сбросить настройки"
                            >
                                ⟲
                            </button>
                            <button
                                onClick={toggleFullscreen}
                                onTouchEnd={toggleFullscreen}
                                className={styles.controlButton}
                                title={isFullscreen ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим'}
                            >
                                {isFullscreen ? '✕' : '⛶'}
                            </button>
                            <button
                                onClick={toggleLocalVideo}
                                onTouchEnd={toggleLocalVideo}
                                className={[styles.controlButton, !showLocalVideo ? styles.active : ''].join(' ')}
                                title={showLocalVideo ? 'Скрыть локальное видео' : 'Показать локальное видео'}
                            >
                                {showLocalVideo ? '👁' : '👁‍🗨'}
                            </button>
                            <button
                                onClick={toggleMuteLocalAudio}
                                onTouchEnd={toggleMuteLocalAudio}
                                className={[styles.controlButton, muteLocalAudio ? styles.active : ''].join(' ')}
                                title={muteLocalAudio ? 'Включить микрофон' : 'Отключить микрофон'}
                            >
                                {muteLocalAudio ? '🚫🎤' : '🎤'}
                            </button>
                            <button
                                onClick={toggleMuteRemoteAudio}
                                onTouchEnd={toggleMuteRemoteAudio}
                                className={[styles.controlButton, muteRemoteAudio ? styles.active : ''].join(' ')}
                                title={muteRemoteAudio ? 'Включить звук' : 'Отключить звук'}
                            >
                                {muteRemoteAudio ? '🔇' : '🔈'}
                            </button>
                            <button
                                onClick={toggleFlashlight}
                                onTouchEnd={toggleFlashlight}
                                className={styles.controlButton}
                                title="Включить/выключить фонарик"
                            >
                                💡
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Удалить комнату?</DialogTitle>
                    </DialogHeader>
                    <p>Вы уверены, что хотите удалить комнату {roomToDelete ? formatRoomId(roomToDelete) : ''}?</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Отмена
                        </Button>
                        <Button variant="destructive" onClick={confirmDeleteRoom}>
                            Удалить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\app\actions.ts
'use server';
import {prisma} from '@/prisma/prisma-client';
import {getUserSession} from '@/components/lib/get-user-session';
import {Prisma} from '@prisma/client';
import {hashSync} from 'bcrypt';
import * as z from 'zod'
import { revalidatePath } from 'next/cache';


export async function updateUserInfo(body: Prisma.UserUpdateInput) {
try {
const currentUser = await getUserSession();

    if (!currentUser) {
      throw new Error('Пользователь не найден');
    }

    const findUser = await prisma.user.findFirst({
      where: {
        id: Number(currentUser.id),
      },
    });

    await prisma.user.update({
      where: {
        id: Number(currentUser.id),
      },
      data: {
        fullName: body.fullName,
        email: body.email,
        password: body.password ? hashSync(body.password as string, 10) : findUser?.password,
      },
    });
} catch (err) {
throw err;
}
}
export async function registerUser(body: Prisma.UserCreateInput) {
console.log('Input data:', body);
try {
const user = await prisma.user.findFirst({
where: {
email: body.email,
},
});
console.log('Existing user:', user);
if (user) {
throw new Error('Пользователь уже существует');
}
const newUser = await prisma.user.create({
data: {
fullName: body.fullName,
email: body.email,
password: hashSync(body.password, 10),
},
});
console.log('Created user:', newUser);
return { message: 'User created successfully', user: newUser };
} catch (err) {
console.error('Error [CREATE_USER]', err);
throw err;
}
}


const deviceIdSchema = z.string().length(16, 'ID устройства должен содержать ровно 16 символов (без тире)').regex(/^[A-Z0-9]+$/, 'ID должен содержать только заглавные латинские буквы и цифры');

// Получение списка устройств пользователя
export async function getDevices() {
const session = await getUserSession();
if (!session) {
throw new Error('Пользователь не аутентифицирован');
}

const devices = await prisma.devices.findMany({
where: { userId: parseInt(session.id) },
include: { settings: true },
orderBy: { createdAt: 'asc' },
});

return devices.map(device => ({
idDevice: device.idDevice,
autoReconnect: device.autoReconnect,
autoConnect: device.autoConnect,
closedDel: device.closedDel,
settings: device.settings[0] || null,
}));
}

// Добавление нового устройства
export async function addDevice(idDevice: string, autoConnect: boolean = false, autoReconnect: boolean = false, closedDel: boolean = false) {
const session = await getUserSession();
if (!session) {
throw new Error('Пользователь не аутентифицирован');
}

const parsedIdDevice = deviceIdSchema.safeParse(idDevice);
if (!parsedIdDevice.success) {
throw new Error(parsedIdDevice.error.errors[0].message);
}

const userId = parseInt(session.id);

// Проверяем существование устройства по idDevice
const existingDevice = await prisma.devices.findUnique({
where: { idDevice: parsedIdDevice.data },
});

if (existingDevice) {
throw new Error('Устройство с таким ID уже существует');
}

const deviceCount = await prisma.devices.count({
where: { userId },
});

const newDevice = await prisma.devices.create({
data: {
userId,
idDevice: parsedIdDevice.data,
autoReconnect,
autoConnect,
closedDel,
diviceName: 'ArduA',
},
});

// Создаем настройки с начальными значениями для всех полей
await prisma.settings.create({
data: {
devicesId: newDevice.id,
servo1MinAngle: 0,
servo1MaxAngle: 180,
servo2MinAngle: 0,
servo2MaxAngle: 180,
b1: false,
b2: false,
servoView: true,
},
});

revalidatePath('/');
return newDevice;
}

// Удаление устройства
export async function deleteDevice(idDevice: string) {
const session = await getUserSession();
if (!session) {
throw new Error('Пользователь не аутентифицирован');
}

const parsedIdDevice = deviceIdSchema.safeParse(idDevice);
if (!parsedIdDevice.success) {
throw new Error(parsedIdDevice.error.errors[0].message);
}

const userId = parseInt(session.id);

const device = await prisma.devices.findUnique({
where: { idDevice: parsedIdDevice.data },
});

if (!device || device.userId !== userId) {
throw new Error('Устройство не найдено или доступ запрещен');
}

await prisma.settings.deleteMany({
where: { devicesId: device.id },
});

await prisma.devices.delete({
where: { idDevice: parsedIdDevice.data },
});

revalidatePath('/');
}

// Обновление настроек устройства
export async function updateDeviceSettings(idDevice: string, settings: { autoReconnect?: boolean, autoConnect?: boolean, closedDel?: boolean }) {
const session = await getUserSession();
if (!session) {
throw new Error('Пользователь не аутентифицирован');
}

const parsedIdDevice = deviceIdSchema.safeParse(idDevice);
if (!parsedIdDevice.success) {
throw new Error(parsedIdDevice.error.errors[0].message);
}

const userId = parseInt(session.id);

const device = await prisma.devices.findUnique({
where: { idDevice: parsedIdDevice.data },
});

if (!device || device.userId !== userId) {
throw new Error('Устройство не найдено или доступ запрещен');
}

await prisma.devices.update({
where: { idDevice: parsedIdDevice.data },
data: {
autoReconnect: settings.autoReconnect ?? device.autoReconnect,
autoConnect: settings.autoConnect ?? device.autoConnect,
closedDel: settings.closedDel ?? device.closedDel,
},
});

revalidatePath('/');
}

// Обновление настроек сервоприводов
export async function updateServoSettings(
idDevice: string,
settings: {
servo1MinAngle?: number;
servo1MaxAngle?: number;
servo2MinAngle?: number;
servo2MaxAngle?: number;
b1?: boolean;
b2?: boolean;
servoView?: boolean;
}
) {
const session = await getUserSession();
if (!session) {
throw new Error('Пользователь не аутентифицирован');
}

const parsedIdDevice = deviceIdSchema.safeParse(idDevice);
if (!parsedIdDevice.success) {
throw new Error(parsedIdDevice.error.errors[0].message);
}

const userId = parseInt(session.id);

const device = await prisma.devices.findUnique({
where: { idDevice: parsedIdDevice.data },
});

if (!device || device.userId !== userId) {
throw new Error('Устройство не найдено или доступ запрещен');
}

const updateData: any = {};
if (settings.servo1MinAngle !== undefined) updateData.servo1MinAngle = settings.servo1MinAngle;
if (settings.servo1MaxAngle !== undefined) updateData.servo1MaxAngle = settings.servo1MaxAngle;
if (settings.servo2MinAngle !== undefined) updateData.servo2MinAngle = settings.servo2MinAngle;
if (settings.servo2MaxAngle !== undefined) updateData.servo2MaxAngle = settings.servo2MaxAngle;
if (settings.b1 !== undefined) updateData.b1 = settings.b1;
if (settings.b2 !== undefined) updateData.b2 = settings.b2;
if (settings.servoView !== undefined) updateData.servoView = settings.servoView;

if (Object.keys(updateData).length === 0) {
console.log('Нет данных для обновления в Settings');
return;
}

await prisma.settings.upsert({
where: { devicesId: device.id },
update: updateData,
create: {
devicesId: device.id,
servo1MinAngle: settings.servo1MinAngle ?? 0,
servo1MaxAngle: settings.servo1MaxAngle ?? 180,
servo2MinAngle: settings.servo2MinAngle ?? 0,
servo2MaxAngle: settings.servo2MaxAngle ?? 180,
b1: settings.b1 ?? false,
b2: settings.b2 ?? false,
servoView: settings.servoView ?? true,
},
});

revalidatePath('/');
}


const roomIdSchema = z.string().length(16, 'ID комнаты должен содержать ровно 16 символов (без тире)');
export async function getSavedRooms() {
const session = await getUserSession();
if (!session) {
throw new Error('Пользователь не аутентифицирован');
}

const rooms = await prisma.savedRoom.findMany({
where: { userId: parseInt(session.id) },
orderBy: { createdAt: 'asc' },
});

return rooms.map((room) => ({
id: room.roomId,
isDefault: room.isDefault,
autoConnect: room.autoConnect,
}));
}
export async function saveRoom(roomId: string, autoConnect: boolean = false) {
const session = await getUserSession();
if (!session) {
throw new Error('Пользователь не аутентифицирован');
}

const parsedRoomId = roomIdSchema.safeParse(roomId.replace(/-/g, ''));
if (!parsedRoomId.success) {
throw new Error(parsedRoomId.error.errors[0].message);
}

const userId = parseInt(session.id);

const existingRoom = await prisma.savedRoom.findUnique({
where: { roomId },
});

if (existingRoom) {
throw new Error('Комната уже сохранена');
}

const roomCount = await prisma.savedRoom.count({
where: { userId },
});

await prisma.savedRoom.create({
data: {
roomId,
userId,
isDefault: roomCount === 0,
autoConnect,
},
});

revalidatePath('/');
}
export async function deleteRoom(roomId: string) {
const session = await getUserSession();
if (!session) {
throw new Error('Пользователь не аутентифицирован');
}

const parsedRoomId = roomIdSchema.safeParse(roomId);
if (!parsedRoomId.success) {
throw new Error(parsedRoomId.error.errors[0].message);
}

const userId = parseInt(session.id);

const deletedRoom = await prisma.savedRoom.delete({
where: { roomId, userId },
});

if (deletedRoom.isDefault) {
const nextRoom = await prisma.savedRoom.findFirst({
where: { userId },
orderBy: { createdAt: 'asc' },
});

    if (nextRoom) {
      await prisma.savedRoom.update({
        where: { id: nextRoom.id },
        data: { isDefault: true },
      });
    }
}

revalidatePath('/');
}
export async function setDefaultRoom(roomId: string) {
const session = await getUserSession();
if (!session) {
throw new Error('Пользователь не аутентифицирован');
}

const parsedRoomId = roomIdSchema.safeParse(roomId);
if (!parsedRoomId.success) {
console.error(`Некорректный ID комнаты: ${roomId}, ошибка: ${parsedRoomId.error.errors[0].message}`);
return;
}

const userId = parseInt(session.id);

const existingRoom = await prisma.savedRoom.findUnique({
where: { roomId, userId },
});

if (!existingRoom) {
console.error(`Комната с ID ${roomId} не найдена для пользователя ${userId}`);
return;
}

await prisma.savedRoom.updateMany({
where: { userId },
data: { isDefault: false },
});

await prisma.savedRoom.update({
where: { roomId, userId },
data: { isDefault: true },
});

revalidatePath('/');
}
export async function updateAutoConnect(roomId: string, autoConnect: boolean) {
const session = await getUserSession();
if (!session) {
throw new Error('Пользователь не аутентифицирован');
}

const parsedRoomId = roomIdSchema.safeParse(roomId);
if (!parsedRoomId.success) {
console.error(`Некорректный ID комнаты для autoConnect: ${roomId}, ошибка: ${parsedRoomId.error.errors[0].message}`);
return;
}

const userId = parseInt(session.id);

const existingRoom = await prisma.savedRoom.findUnique({
where: { roomId, userId },
});

if (!existingRoom) {
console.error(`Комната с ID ${roomId} не найдена для обновления autoConnect для пользователя ${userId}`);
return;
}

await prisma.savedRoom.update({
where: { roomId, userId },
data: { autoConnect },
});

revalidatePath('/');
}


export async function sendDeviceSettingsToESP(idDevice: string) {
const session = await getUserSession();
if (!session) {
throw new Error('Пользователь не аутентифицирован');
}

const parsedIdDevice = deviceIdSchema.safeParse(idDevice);
if (!parsedIdDevice.success) {
throw new Error(parsedIdDevice.error.errors[0].message);
}

const userId = parseInt(session.id);

const device = await prisma.devices.findUnique({
where: { idDevice: parsedIdDevice.data },
include: { settings: true },
});

if (!device || device.userId !== userId) {
throw new Error('Устройство не найдено или доступ запрещен');
}

// Проверяем, есть ли настройки
const deviceSettings = device.settings[0]; // Берем первый объект настроек
if (!deviceSettings) {
throw new Error('Настройки устройства не найдены');
}

return {
servo1MinAngle: deviceSettings.servo1MinAngle ?? 0, // Используем значение по умолчанию, если null
servo1MaxAngle: deviceSettings.servo1MaxAngle ?? 180,
servo2MinAngle: deviceSettings.servo2MinAngle ?? 0,
servo2MaxAngle: deviceSettings.servo2MaxAngle ?? 180,
b1: deviceSettings.b1,
b2: deviceSettings.b2,
servoView: deviceSettings.servoView,
};
}

Я добавил поля связь один к одному:
1) model SavedRoom  devicesId   Int?  devices     Devices?  @relation(fields: [devicesId], references: [id])
2) model Devices savedRoom     SavedRoom

мне нужно чтобы в
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\components\webrtc\VideoCallApp.tsx
\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\components\control\SocketClient.tsx
можно было сделать их взаимодействие

рядом с
<div className={styles.inputGroup}>
<Label htmlFor="room">ID комнаты</Label>
<Input
id="room"
value={roomId}
onChange={handleRoomIdChange}
disabled={isInRoom || isJoining}
placeholder="XXXX-XXXX-XXXX-XXXX"
maxLength={19}
/>
</div>

рядом с этим блоком добавить:
показывать выпадающий список своих model Devices idDevice
можно было привязать-добавить одно устройство
показывать устройство которое привязано к model SavedRoom и кнопку удалить devices
кнопку удаления привязки

когда устройство привязано, в блоке
<SelectContent className="bg-transparent backdrop-blur-sm border border-gray-200">
{deviceList.map(id => (
<SelectItem key={id} value={id}
className="hover:bg-gray-100/50 text-xs sm:text-sm">
{formatDeviceId(id)}
</SelectItem>
))}
</SelectContent>
устройство idDevice автоматически подставлялось и была подпись снизу к какой roomId комнате idDevice привязан.

измени логику подключения idDevice  ,
если в SavedRoom привязано устройство то checkbox
Автоматическое переподключение при смене устройства
Автоматическое подключение при загрузке страницы
Запретить удаление устройств
нельзя изменить, они должны быть неактивны.
отвечай на русском