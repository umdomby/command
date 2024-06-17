sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

sudo setcap 'cap_net_bind_service=+ep' /usr/local/bin/node

Note: If you don't know the location of node, follow below command.
sudo setcap 'cap_net_bind_service=+ep' `which node`