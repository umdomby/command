sudo fuser -vn tcp 80
sudo lsof -ti tcp:80 | xargs kill

netstat -ntlp | grep LISTEN  
or  
sudo lsof -nP -i | grep LISTEN

sudo apt-get install libcap2-bin
sudo setcap cap_net_bind_service=+ep `readlink -f \`which node\``
Вы можете использовать lsof, чтобы увидеть, какое приложение прослушивает порт 80:
```
sudo lsof -i TCP:80
```

sudo kill -9 `sudo lsof -t -i:3000`  or  sudo kill -9 $(sudo lsof -t -i:9001)
sudo kill -9 `sudo lsof -t -i:8081`
sudo kill -9 `sudo lsof -t -i:8000`
sudo kill -9 `sudo lsof -t -i:80`
sudo kill -9 `sudo lsof -t -i:443`

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




