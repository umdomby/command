https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-20-04-ru
--- Вариант 3 — Установка Node с помощью Node Version Manager

     yarn cache clean
     rm -rf node_modules
     yarn install

        yarn add react-scripts@latest

        yarn install --legacy-peer-deps
        yarn install --force

Вариант 2 — Установка Node.js с помощью Apt через архив NodeSource PPA

nvm list-remote
nvm list
nvm install v22.14.0

nvm use v22.14.0

nvm alias default v22.14.0

npm ls -g --depth=0

npm install --global yarn
yarn --version

#prod
npm install -g serve
serve -s build
serve -s build -l 3000


npm install npm@latest
npm install -g npm@latest