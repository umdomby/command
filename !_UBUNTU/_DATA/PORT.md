sudo ss -tulnp | grep 8080
sudo kill -9 58195

sudo netstat -ltpn

netstat -ntlp | grep LISTEN  
or  
sudo lsof -nP -i | grep LISTEN  

Вы можете использовать lsof, чтобы увидеть, какое приложение прослушивает порт 80:
```
sudo lsof -i TCP:80
sudo lsof -i TCP:3003
```

sudo kill -9 `sudo lsof -t -i:3001`  or  sudo kill -9 $(sudo lsof -t -i:9001)
sudo kill -9 `sudo lsof -t -i:8081`
sudo kill -9 `sudo lsof -t -i:8080`
sudo kill -9 `sudo lsof -t -i:80`
sudo kill -9 `sudo lsof -t -i:443`
sudo kill -9 `sudo lsof -t -i:81`
sudo kill -9 `sudo lsof -t -i:5000`
sudo kill -9 `sudo lsof -t -i:3000`
sudo kill -9 `sudo lsof -t -i:3005`
sudo kill -9 `sudo lsof -t -i:5001`
sudo kill -9 `sudo lsof -t -i:1337`
sudo kill -9 -ID-  

#80  or 443
#HTTPS_REACT://stackoverflow.com/questions/60372618/nodejs-listen-eacces-permission-denied-0-0-0-080  
sudo apt-get install libcap2-bin   
sudo setcap cap_net_bind_service=+ep `readlink -f \`which node\``  

sudo setcap 'cap_net_bind_service=+ep' /usr/local/bin/node
sudo setcap 'cap_net_bind_service=+ep' `which node`


sudo node app.js  

sudo apt-get install libcap2-bin  
sudo setcap cap_net_bind_service=+ep /usr/local/bin/node
sudo setcap cap_net_bind_service=+ep /usr/local/node   

Вы можете остановить все службы, использующие порт 80, используя следующую команду:  
net stop http  


navatar@navatar-X58-USB3:~$ ps -e | grep telegram
3316 ?        00:02:17 telegram-desktop
navatar@navatar-X58-USB3:~$ kill -9 3316

killall -9 firefox

# port 80
sudo apt-get install libcap2-bin
sudo setcap cap_net_bind_service=+ep `readlink -f \`which node\``
# Now, when you tell a Node application that you want it to run on port 80, it will not


