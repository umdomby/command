https://evershop.io/docs/development/deployment/deploy-evershop-to-aws


pm2 start npm -- start

pm2 stop all


pm2 start npm -- start

To assign a name to the PM2 process, use the --name option:

pm2 start npm --name "app name" -- start

pm2 start npm --name evershop1 -- start