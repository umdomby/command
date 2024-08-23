https://redis.io/docs/latest/operate/oss_and_stack/install/install-redis/install-redis-on-linux/

sudo apt-get update
sudo apt-get install redis


sudo snap start redis
sudo snap stop redis
sudo snap restart redis
sudo snap services redis

redis-cli


127.0.0.1:6379> ping
PONG