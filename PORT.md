netstat -ntlp | grep LISTEN  
sudo kill -9 `sudo lsof -t -i:3000`  or  sudo kill -9 $(sudo lsof -t -i:9001)  

sudo kill -9 -ID-  

#80 
https://stackoverflow.com/questions/60372618/nodejs-listen-eacces-permission-denied-0-0-0-080  
sudo apt-get install libcap2-bin   
sudo setcap cap_net_bind_service=+ep `readlink -f \`which node\``  

sudo node app.js  

sudo apt-get install libcap2-bin  
sudo setcap cap_net_bind_service=+ep /usr/local/bin/node
sudo setcap cap_net_bind_service=+ep /usr/local/node   

Вы можете остановить все службы, использующие порт 80, используя следующую команду:  
net stop http  
