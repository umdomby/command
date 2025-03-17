New-NetFirewallRule -DisplayName "Allow HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
netstat -ano | findstr :80

docker ps
docker run -d -p 80:80 --name my-nginx nginx

docker-compose down
docker-compose up -d