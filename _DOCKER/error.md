мы обсудили все причины по каким причинам приложение из Docker не может подключиться к kafka  которая в docker контейнере ?


SKIP_KAFKA_CHECK: "true"


pkill docker
iptables -t nat -F
ifconfig docker0 down
brctl delbr docker0
docker-compose down