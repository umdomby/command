grep nameserver /etc/resolv.conf | awk '{print $2}'

cat /etc/hosts | grep 172.; test $? -eq 0 && $1 || echo -e "$(grep nameserver /etc/resolv.conf | awk '{print $2, " host"}')\n$(cat /etc/hosts)" | sudo tee /etc/hosts