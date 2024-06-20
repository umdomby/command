sudo apt remove certbot
install snapd
sudo snap install --classic certbot
sudo rm /usr/bin/certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

sudo certbot certonly --standalone
sudo certbot certonly --webroot
sudo certbot renew --dry-run