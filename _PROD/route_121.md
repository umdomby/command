config redirect
        option name 'Port_80_TCP'
        option src 'wan'
        option proto 'tcp'
        option src_dport '80'
        option dest 'lan'
        option dest_ip '192.168.1.121'
        option dest_port '80'
        option enabled '1'

config redirect
        option name 'Port_443_TCP'
        option src 'wan'
        option proto 'tcp'
        option src_dport '443'
        option dest 'lan'
        option dest_ip '192.168.1.121'
        option dest_port '443'
        option enabled '1'

config redirect
        option name 'Port_3478_TCP'
        option src 'wan'
        option proto 'tcp'
        option src_dport '3478'
        option dest 'lan'
        option dest_ip '192.168.1.121'
        option dest_port '3478'
        option enabled '1'

config redirect
        option name 'Port_5349_TCP'
        option src 'wan'
        option proto 'tcp'
        option src_dport '5349'
        option dest 'lan'
        option dest_ip '192.168.1.121'
        option dest_port '5349'
        option enabled '1'

config redirect
        option name 'Port_3001_TCP'
        option src 'wan'
        option proto 'tcp'
        option src_dport '3001'
        option dest 'lan'
        option dest_ip '192.168.1.121'
        option dest_port '3001'
        option enabled '1'

config redirect
        option name 'Ports_8080-8099_TCP'
        option src 'wan'
        option proto 'tcp'
        option src_dport '8080-8099'
        option dest 'lan'
        option dest_ip '192.168.1.121'
        option dest_port '8080-8099'
        option enabled '1'

config redirect
        option name 'UDP_High_Ports'
        option src 'wan'
        option proto 'udp'
        option src_dport '49152-49800'
        option dest 'lan'
        option dest_ip '192.168.1.121'
        option dest_port '49152-49800'
        option enabled '1'