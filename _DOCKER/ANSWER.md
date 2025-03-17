curl http://gamerecords.site:8081/.well-known/acme-challenge/test
curl: (52) Empty reply from server


ip addr show

     location /.well-known/acme-challenge/ {
         proxy_pass http://172.30.46.88:8081;
     }
docker-compose ps

docker-compose logs nginx
docker-compose logs certbot

curl http://gamerecords.site:8081/.well-known/acme-challenge/test
curl http://gamerecords.site:8080/.well-known/acme-challenge/test



Шаги для настройки webroot

server {
listen 8080;
server_name gamerecords.site;

       location /.well-known/acme-challenge/ {
           root /var/www/certbot;
       }

       location / {
           root /usr/share/nginx/html;
           index index.html;
       }
}
sudo chmod u+w .
sudo chown $(whoami):$(whoami) .
mkdir -p ./certbot/www/.well-known/acme-challenge

sudo chown $(whoami):$(whoami) ~/Projects/docker-start/certbot/www/.well-known/acme-challenge/test/index.html
docker-compose down
docker-compose up -d


ls -l ~/certbot/www/.well-known/acme-challenge/index.html
echo '<html><body><h1>Hello from NGINX!</h1></body></html>' > ~/certbot/www/.well-known/acme-challenge/index.html
chmod 644 ~/certbot/www/.well-known/acme-challenge/index.html

-Проверьте монтирование в Docker
docker-compose exec nginx ls /var/www/certbot/.well-known/acme-challenge

docker-compose run certbot certonly --webroot -w /var/www/certbot -d gamerecords.site