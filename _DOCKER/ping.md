docker exec -it 430c3f7877a3538342bc127bd476972536e8253305784b13d673ec8ed84f10ae /bin/bash

apt-get update && apt-get install -y iputils-ping


ping kafka  
# или
ping 172.20.0.6
