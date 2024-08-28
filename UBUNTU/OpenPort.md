sudo ufw allow 5000

sudo ufw allow 3000
sudo ufw allow 80
sudo ufw allow 81
sudo ufw allow 5001
sudo ufw allow 5432
 sudo iptables -A INPUT -p tcp --dport 5432 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 5000 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 5001 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 81 -j ACCEPT

sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

sudo setcap 'cap_net_bind_service=+ep' /usr/local/bin/node

Note: If you don't know the location of node, follow below command.
sudo setcap 'cap_net_bind_service=+ep' `which node`




https://losst.pro/kak-otkryt-port-ubuntu

sudo iptables -L
sudo iptables -A INPUT -i lo -j ACCEPT
sudo iptables -A OUTPUT -o lo -j ACCEPT
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 5000 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -nvL
sudo iptables -P INPUT DROP

