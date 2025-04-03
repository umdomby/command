4d1e6f1c396186667679c47381261bc73acc04607dc7a5a3a08b700530b26e25
docker exec -it 4d1e6f1c396186667679c47381261bc73acc04607dc7a5a3a08b700530b26e25 bash

telnet localhost 3478
telnet 213.184.249.66 3478

telnet localhost 5349
telnet 213.184.249.66 5349

docker logs 4d1e6f1c396186667679c47381261bc73acc04607dc7a5a3a08b700530b26e25 | grep -i "listening"


sudo apt update && sudo apt install -y coturn

turnutils_uclient -v -u user1 -w pass1 -e 127.0.0.2 127.0.0.1
turnutils_uclient -v -u user1 -w pass1 -S -e 127.0.0.2 127.0.0.1
turnutils_uclient -v -u user1 -w pass1 -y 127.0.0.1


https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

				"turn:213.184.249.66:3478",
				Username:       "user1",
				Credential:     "pass1",


turnutils_uclient -v -u user1 -w pass1 -e 127.0.0.2 213.184.249.66 -y

turnutils_uclient -v -u user1 -w pass1 -e 127.0.0.2 213.184.249.66 -y -X -W 5000


external-ip=213.184.249.66/172.20.0.8


docker logs coturn | grep -A 10 'relay addresses discovered'

turnutils_uclient -v -u user1 -w pass1 -e 127.0.0.2 213.184.249.66 -y -X -W 10000 | grep "relay addr"

turnutils_uclient -v -u user1 -w pass1 213.184.249.66

turnutils_uclient -v -u user1 -w pass1 -y 213.184.249.66


candidate:246899885 1 udp 16777215 213.184.249.66 50017 typ relay


netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=8080 connectaddress=172.30.46.88


          {
            urls: 'turn:213.184.249.66:3478',
            username: 'user1',
            credential: 'pass1'
          },
          {
            urls: 'turns:213.184.249.66:5349',
            username: 'user1',
            credential: 'pass1'
          }
