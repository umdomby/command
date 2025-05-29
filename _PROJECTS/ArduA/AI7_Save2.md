//listening-port=3478
//tls-listening-port=5349
//# Укажите версии TLS (вам уже настроено no-tlsv1/no-tlsv1_1)
//cipher-list="ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384"
//listening-ip=0.0.0.0
//external-ip=213.184.249.66
//min-port=50000
//max-port=50100
//cert=/etc/coturn/certs/fullchain.pem
//pkey=/etc/coturn/certs/privkey.pem
//verbose
//fingerprint
//lt-cred-mech
//user=user1:pass1
//realm=ardua.site
//log-file=/var/log/turn.log
//simple-log
//no-tlsv1
//no-tlsv1_1
//no-stdout-log


# Порты для STUN/TURN
listening-port=3478
tls-listening-port=5349
cipher-list="ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384"
listening-ip=0.0.0.0
external-ip=213.184.249.66
min-port=49152
max-port=50000
cert=/etc/coturn/certs/fullchain.pem
pkey=/etc/coturn/certs/privkey.pem
verbose
fingerprint
lt-cred-mech
use-auth-secret
static-auth-secret=ardua_secret_symbol
realm=ardua.site
log-file=/var/log/coturn/turn.log
simple-log
no-tlsv1
no-tlsv1_1
no-stdout-log
