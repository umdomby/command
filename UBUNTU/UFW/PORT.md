# STUN/TURN (UDP + TCP)
sudo ufw allow 3478/udp
sudo ufw allow 3478/tcp

# TURN-over-TLS/DTLS
sudo ufw allow 5349/tcp
sudo ufw allow 5349/udp

# Диапазон для ретрансляции
sudo ufw allow 49152:65535/udp