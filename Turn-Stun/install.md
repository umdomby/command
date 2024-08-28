https://cloudkul.com/blog/how-to-install-turn-stun-server-on-aws-ubuntu-20-04/  

sudo apt-get -y update  
sudo apt-get install coturn -y  
service coturn status  

service coturn start  
service coturn stop  

vi /etc/default/coturn  
#TURNSERVER_ENABLED=1  

mv /etc/turnserver.conf turnserver.conf.bak  

touch /etc/turnserver.conf  


listening-port=3478  
tls-listening-port=5349  
listening-ip=0.0.0.0  
#listening-ip=10.207.21.238  
#listening-ip=2607:f0d0:1002:51::4  
min-port=49152  
max-port=65535  
verbose  
fingerprint  
lt-cred-mech  
user=admin:webkul123  
#user=username2:key2  
log-file=/var/log/turn.log  
syslog  
web-admin  
web-admin-ip=0.0.0.0  
# Web-admin server port. Default is 8080.  


service coturn restart  

#.env  
REACT_APP_STUN_SERVERS=stun:serbot.online  
REACT_APP_TURN_SERVERS=turn:serbot.online  
REACT_APP_TURN_USERNAME=webkul123  