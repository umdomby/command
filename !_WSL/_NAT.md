    Проверим NAT-проброс в WSL:

bash

sudo iptables -t nat -L -n -v | grep 3001

Если вывод пустой, добавим правило:
bash

sudo iptables -t nat -A PREROUTING -p tcp --dport 3001 -j DNAT --to-destination 127.0.0.1:3001



    Проверим привязку сервера в WSL:

bash

netstat -tulnp | grep 3001


Если False, выполните:
powershell

Restart-NetAdapter -Name "vEthernet (WSL)"



    Временное решение:

bash

sudo python3 -m http.server 3001 --bind 0.0.0.0