https://dvmn.org/encyclopedia/deploy/renewing-certbot-certificates-for-nginx-using-a-systemd-timer/

sudo certbot renew --force-renewal --post-hook "systemctl reload nginx"


# Пишем service-файл
```
# Содержимое файла /etc/systemd/system/certbot-renewal.service
[Unit]
Description=Certbot Renewal

[Service]
ExecStart={полный путь к certbot} renew --force-renewal --post-hook "systemctl reload nginx.service"
```

# whereis certbot
certbot: /usr/bin/certbot /snap/bin/certbot

```
# Содержимое файла /etc/systemd/system/certbot-renewal.service
[Unit]
Description=Certbot Renewal

[Service]
ExecStart=/usr/bin/certbot renew --force-renewal --post-hook "systemctl reload nginx.service"
```


# Проверим работу юнита: запустим его, дождёмся окончания работы, проверим обновились ли настройки Nginx:

# systemctl start certbot-renewal.service
# systemctl status certbot-renewal.service
# # ... ждём завершения работы "сервиса" ...
# systemctl status nginx.service


```
# Файл /etc/systemd/system/certbot-renewal.timer
[Unit]
Description=Timer for Certbot Renewal

[Timer]
OnBootSec=300
OnUnitActiveSec=1w

[Install]
WantedBy=multi-user.target
```

# Включим таймер, чтобы он начал свой отсчёт:
sudo systemctl start certbot-renewal.timer

# Настроим автоматическое включение таймера на случай перезапуска сервера:
sudo systemctl enable certbot-renewal.timer


# Заглянем в статус таймера, чтобы узнать когда было последнее обновление SSL-сертификата и когда планируется следующее:
systemctl status certbot-renewal.timer


# Вывод в консоль показывает, что последний запуск обновления сертификатов был три минуты назад, а следующий планируется через шесть дней. Как раз то, что нужно.
# Для верности заглянем ещё раз в логи Nginx и проверим, есть ли там отчёт о последней “свежей” перезагрузке конфигурации:
systemctl status nginx.service 

