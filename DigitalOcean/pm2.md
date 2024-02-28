npm install pm2 -g
https://nodejsdev.ru/guides/webdraftt/pm2/#_1
https://pm2.keymetrics.io/docs/usage/log-management/

sudo apt purge apache*
sudo systemctl stop nginx
sudo apt-get purge nginx ls

pm2 start index.js
pm2 ls
pm2 delete index.js
pm2 stop index.js

pm2 logs  
pm2 monit
???
pm2 install pm2-logrotate
https://pm2.keymetrics.io/docs/usage/log-management/
pm2 uninstall pm2-logrotate
???
