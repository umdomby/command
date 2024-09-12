pm2 start npm -- start

To assign a name to the PM2 process, use the --name option:

pm2 start npm --name "app name" -- start

pm2 start npm --name evershop1 -- start


pm2 start npm --name gamefront -- start

pm2 dump & pm2 kill & pm2 resurrect 



sudo env PATH=$PATH:/home/pi/.nvm/versions/node/v20.17.0/bin /home/pi/.nvm/versions/node/v20.17.0/lib/node_modules/pm2/bin/pm2 startup systemd -u pi --hp /home/pi

pm2 startup pi -u www --hp /home/pi