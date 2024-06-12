https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-20-04-ru
Вариант 2 — Установка Node.js с помощью Apt через архив NodeSource PPA

 --- Вариант 3 — Установка Node с помощью Node Version Manager
nvm list-remote
nvm list
nvm install v20.11.1
nvm use v20.11.1
nvm alias default v20.11.1


npm install --global yarn
yarn --version

#prod
npm install -g serve
serve -s build
serve -s build -l 3000