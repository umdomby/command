sudo npm install pm2@latest -g

npm install pm2@latest -g  
# or 
npm install pm2 -g
# or
yarn global add pm2


pm2 update

pm2 startup systemd
-->
sudo env PATH=$PATH:/home/pi2/.nvm/versions/node/v20.15.1/bin /home/pi2/.nvm/versions/node/v20.15.1/lib/node_modules/pm2/bin/pm2 startup systemd -u pi2 --hp /home/pi2
pm2 save

sudo systemctl start pm2-pi2



https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-20-04-ru