
https://chatgpt.com/c/67de7787-3ea8-8012-bad7-18d53712dd07  umdom44@gmail.com
load testing

нагрузочного тестирования Redis Kafka Socket SSR SSE Next Prisma

1. Пример скрипта на K6 (load_test.js): https://ardu.site/api/players
```js
import http from 'k6/http';
import { check, sleep } from 'k6';

export default function () {
    const res = http.get('https://ardu.site/api/players'); // Пример API-запроса
    check(res, {
        'is status 200': (r) => r.status === 200,
    });
    sleep(1);
}
```
Этот скрипт будет делать GET-запросы к API вашего Next.js приложения (имитируя нагрузку) и проверять, что статус ответа равен 200.

2. Пример использования Artillery
Если ты хочешь использовать Artillery, можно добавить еще один сервис в docker-compose.yml, настроив его на выполнение тестов:
```
  artillery:
    image: artilleryio/artillery
    container_name: artillery
    volumes:
      - ./artillery-scripts:/scripts
    entrypoint: ["artillery", "run", "/scripts/load_test.yml"]
    networks:
      - test_network
```
И в /artillery-scripts/load_test.yml написать конфигурацию для нагрузочного теста:

```
config:
  target: 'http://nextjs:3000'
  phases:
    - duration: 60
      arrivalRate: 5  # 5 запросов в секунду
scenarios:
  - flow:
      - get:
          url: "/api/endpoint"
```

