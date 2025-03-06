curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list

sudo apt-get update
sudo apt-get install redis

sudo service redis-server start



Подключиться к Redis
После запуска Redis вы можете протестировать его, выполнив redis-cli:

redis-cli
Проверьте соединение с помощью pingкоманды:

127.0.0.1:6379> ping
PONG


После запуска экземпляра Redis вам может потребоваться:

Попробуйте руководство по Redis CLI  https://redis.io/docs/latest/develop/tools/cli/
Подключитесь с помощью одного из клиентов Redis https://redis.io/docs/latest/develop/clients/
Установите Redis «правильно» для использования в производственных целях. https://redis.io/docs/latest/operate/oss_and_stack/install/install-redis/#install-redis-properly