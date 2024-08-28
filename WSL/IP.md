sudo apt install net-tools
ifconfig

wsl
netsh interface portproxy add v4tov4 listenaddress=192.168.0.151 \
listenport=8080 connectaddress=172.26.38.5 connectport=80

netsh interface portproxy add v4tov4 listenaddress=192.168.0.151 \
listenport=4433 connectaddress=172.26.38.5 connectport=443


netsh interface portproxy add v4tov4 listenport=3000 listenaddress=192.168.0.151 connectport=3000 connectaddress=172.26.38.5
netsh interface portproxy add v4tov4 listenport=443 listenaddress=192.168.0.151 connectport=443 connectaddress=172.26.38.5
netsh interface portproxy add v4tov4 listenport=80 listenaddress=192.168.0.151 connectport=80 connectaddress=172.24.152.235
netsh interface portproxy add v4tov4 listenport=5000 listenaddress=192.168.0.151 connectport=5000 connectaddress=172.26.38.5
netsh interface portproxy add v4tov4 listenport=5000 listenaddress=192.168.0.151 connectport=5000 connectaddress=172.26.38.5



netsh interface portproxy add v4tov4 listenport=80 listenaddress=172.24.152.235 connectport=80 connectaddress=192.168.0.151
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=192.168.0.151
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=172.26.38.5 connectport=3000 connectaddress=192.168.0.151
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=192.168.0.151
netsh interface portproxy add v4tov4 listenport=5432 listenaddress=0.0.0.0 connectport=5432 connectaddress=192.168.0.151
netsh interface portproxy dump
wsl --shutdown

delete
netsh interface portproxy delete v4tov4 listenport=433 listenaddress=192.168.0.151
netsh interface portproxy delete v4tov4 listenport=80 listenaddress=172.24.152.235
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0
netsh interface portproxy delete v4tov4 listenport=5432 listenaddress=192.168.0.151
netsh interface portproxy dump

netsh interface portproxy add v4tov4 listenaddress=192.168.0.151 \ listenport=3000 connectaddress=172.26.38.5 connectport=3000