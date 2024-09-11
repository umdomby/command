sudo apt install net-tools
ifconfig

wsl
netsh interface portproxy add v4tov4 listenaddress=192.168.0.151 \
listenport=8080 connectaddress=172.26.38.5 connectport=80

netsh interface portproxy add v4tov4 listenaddress=192.168.0.151 \
listenport=4433 connectaddress=172.26.38.5 connectport=443


netsh interface portproxy add v4tov4 listenport=3000 listenaddress=192.168.0.151 connectport=3000 connectaddress=172.24.152.235
netsh interface portproxy add v4tov4 listenport=443 listenaddress=192.168.0.151 connectport=443 connectaddress=172.24.152.235
netsh interface portproxy add v4tov4 listenport=80 listenaddress=192.168.0.151 connectport=80 connectaddress=172.24.152.235
netsh interface portproxy add v4tov4 listenport=5000 listenaddress=192.168.0.151 connectport=5000 connectaddress=172.24.152.235
netsh interface portproxy add v4tov4 listenport=5005 listenaddress=192.168.0.151 connectport=5005 connectaddress=172.24.152.235
netsh interface portproxy add v4tov4 listenport=5006 listenaddress=192.168.0.151 connectport=5006 connectaddress=172.24.152.235
netsh interface portproxy add v4tov4 listenport=5432 listenaddress=213.184.249.66 connectport=5432 connectaddress=172.24.152.235
netsh interface portproxy add v4tov4 listenport=5432 listenaddress=192.168.0.151 connectport=5432 connectaddress=172.24.152.235
netsh interface portproxy add v4tov4 listenport=445 listenaddress=192.168.0.151 connectport=445 connectaddress=172.24.152.235
netsh interface portproxy add v4tov4 listenport=8082 listenaddress=192.168.0.151 connectport=8082 connectaddress=172.24.152.235
netsh interface portproxy add v4tov4 listenport=8081 listenaddress=192.168.0.151 connectport=8081 connectaddress=172.24.152.235

213.184.249.66:5432

netsh interface portproxy add v4tov4 listenport=80 listenaddress=172.24.152.235 connectport=80 connectaddress=192.168.0.151

netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=192.168.0.151

netsh interface portproxy add v4tov4 listenport=3000 listenaddress=172.26.38.5 connectport=3000 connectaddress=192.168.0.151

netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=192.168.0.151
netsh interface portproxy add v4tov4 listenport=5005 listenaddress=172.24.152.235 connectport=3000 connectaddress=192.168.0.151

netsh interface portproxy add v4tov4 listenport=5432 listenaddress=0.0.0.0 connectport=5432 connectaddress=192.168.0.151
netsh interface portproxy dump
wsl --shutdown

delete
netsh interface portproxy delete v4tov4 listenport=80 listenaddress=172.24.152.235
netsh interface portproxy delete v4tov4 listenport=443 listenaddress=192.168.0.151
netsh interface portproxy delete v4tov4 listenport=80 listenaddress=172.24.152.235
netsh interface portproxy delete v4tov4 listenport=2005 listenaddress=192.168.0.151
netsh interface portproxy delete v4tov4 listenport=5432 listenaddress=213.184.249.66
netsh interface portproxy delete v4tov4 listenport=5002 listenaddress=192.168.0.151
netsh interface portproxy delete v4tov4 listenport=5005 listenaddress=192.168.0.151
netsh interface portproxy dump

netsh interface portproxy add v4tov4 listenaddress=192.168.0.151 \ listenport=3000 connectaddress=172.26.38.5 connectport=3000