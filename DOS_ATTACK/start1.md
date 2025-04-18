DoS-атака (Denial of Service) — это кибератака, направленная на нарушение доступности сервиса, сети или приложения путем его перегрузки запросами или эксплуатации уязвимостей. Цель — сделать ресурс недоступным для легитимных пользователей.

Типы DoS-атак:
Флуд (Flood)

HTTP-флуд: Массовая отправка HTTP-запросов (GET/POST).

SYN-флуд: Отправка поддельных SYN-пакетов для исчерпания ресурсов сервера.

UDP-флуд: Перегрузка сети UDP-пакетами.

Атаки на уязвимости

Эксплуатация слабых мест в коде или инфраструктуре (например, Slowloris, который держит соединения открытыми, исчерпывая лимиты сервера).

DDoS (Distributed DoS)

Атака с множества устройств (ботнет), что делает ее сложнее для блокировки.

Инструменты для DoS/DDoS-атак:
LOIC (Low Orbit Ion Cannon): Простой инструмент для UDP/TCP/HTTP-флуда.

HOIC (High Orbit Ion Cannon): Усовершенствованная версия LOIC с поддержкой скриптов.

Slowloris: Держит множество медленных HTTP-соединений, истощая ресурсы сервера.

Xerxes: Модификация Slowloris для усиления воздействия.

R.U.D.Y. (R-U-Dead-Yet): Атака через длинные POST-запросы.

Botnets: Сети зараженных устройств (например, Mirai, созданный для атак через IoT-устройства).


Защита от DoS/DDoS:
Firewall и IPS/IDS: Фильтрация подозрительного трафика.

CDN (Cloudflare, Akamai): Распределение нагрузки и блокировка атак.

Ограничение запросов: Настройка лимитов на количество соединений с одного IP.

Мониторинг: Анализ трафика в реальном времени для выявления аномалий.

Аппаратные решения: Специализированные устройства (например, Arbor Networks).

Используйте знания для защиты инфраструктуры, а не для атак! 🔒


