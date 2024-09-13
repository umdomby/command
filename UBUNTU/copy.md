https://firstvds.ru/technology/linux-permissions

sudo cp -r /etc/nginx/sites-enabled /home/pi

# get right
ls -l

lsattr
sudo chattr -R -i sites-enabled
sudo chattr -R -e sites-enabled

/etc/nginx/sites-enabled