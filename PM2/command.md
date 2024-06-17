зь2https://pm2.keymetrics.io/docs/usage/quick-start/

pm2 start app.js

$ pm2 restart app_name
$ pm2 reload app_name
$ pm2 stop app_name
$ pm2 delete app_name


pm2 logs
pm2 logs --lines 200
pm2 monit

pm2 start ecosystem.config.js

$ cd /path/to/my/app
$ pm2 start env.js --watch --ignore-watch="node_modules"

pm2 status

pm2 start strapi --no-pmx --name="strapi" -- start
