docker network inspect sharednetwork



docker network ls

docker network create sharednetwork

Проверка правильности подключения между контейнерами:
docker exec -it <your_app_container_id> ping kafka


-проверка сети
root@e6d6596eaa83:/# docker run -it --rm --network sharednetwork busybox


# / # nc -zv kafka 9093

nc -zv kafka 9093
-kafka (172.20.0.7:9093) open

