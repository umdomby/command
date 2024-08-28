https://pm2.keymetrics.io/docs/usage/quick-start/

pm2 start app.js

$ pm2 restart app_name
$ pm2 reload app_name
$ pm2 stop app_name
$ pm2 delete app
pm2 monit

pm2 start ecosystem.config.js

$ cd /path/to/my/app
$ pm2 start env.js --watch --ignore-watch="node_modules"

pm2 status

pm2 start frontend --no-pmx --name="frontend" -- start
pm2 startup ubuntu
pm2 startup
pm2 save

listen EACCES: permission denied 0.0.0.0:80
sudo apt-get install libcap2-bin
sudo setcap cap_net_bind_service=+ep `readlink -f \`which node\``