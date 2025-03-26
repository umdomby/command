docker run -p 8085:8085 docker-ardua-ardua-1



Проверка доступности файлов:
После запуска контейнера, вы можете войти в контейнер и убедиться, что файлы сертификатов доступны по указанному пути:

     docker exec -it <container_id> /bin/bash
     ls -l /etc/letsencrypt/live/ardu.site/