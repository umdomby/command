



sudo ln -s /etc/nginx/sites-available/serbot.online /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/cryptoid.store /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/gamerecords.site /etc/nginx/sites-enabled/



sudo nano /etc/nginx/sites-available/serbot.online
sudo nano /etc/nginx/sites-available/cryptoid.store.server

sudo nano /etc/nginx/sites-enabled/serbot.online
sudo nano /etc/nginx/sites-enabled/cryptoid.store

sudo rm /etc/nginx/sites-available/cryptoid.store.server
sudo rm /etc/nginx/sites-enabled/cryptoid.store.server

sudo rm /etc/nginx/sites-available/gamerecords.site.server
sudo rm /etc/nginx/sites-enabled/gamerecords.site.server

sudo service nginx restart
systemctl status nginx