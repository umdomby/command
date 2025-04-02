curl -I https://anybet.site/ws


HTTP/2 400
server: nginx/1.27.4
date: Sun, 30 Mar 2025 20:23:06 GMT
content-type: text/plain; charset=utf-8
content-length: 12
sec-websocket-version: 13
x-content-type-options: nosniff



# Установите wscat (если нет)
npm install -g wscat

# Тестирование
wscat -c wss://anybet.site/ws



curl -v http://127.0.0.1:8080/healthcheck

curl -v http://192.168.0.151:8080/healthcheck

ps aux | grep 192.168.0.151:8080

curl -v https://anybet.site/healthcheck
wscat -c wss://anybet.site/ws


# В одном терминале:
wscat -c ws://192.168.0.151:8080/ws
> {"event":"join","data":""}

# В другом терминале:
wscat -c ws://192.168.0.151:8080/ws
> {"event":"join","data":"982fe5ef-73d8-486f-b30b-d8e65e0b1276"}
> 
> 
>

# В одном терминале:
wscat -c wss://anybet.site/ws
> {"event":"join","data":""}

# В другом терминале:
wscat -c wss://anybet.site/ws
> {"event":"join","data":"396cda0b-6e36-48d8-afa8-12a0746aaea2"}
