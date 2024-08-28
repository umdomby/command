Вариант 2 — Установка Node.js с помощью Apt через архив NodeSource PPA
Вариант 3 — Установка Node с помощью Node Version Manager
nvm list-remote
nvm list
nvm install v20.11.1
nvm use v20.11.1
nvm alias default v20.11.1

Если вы использовали Homebrew , запустите:  

brew update  # This updates Homebrew to latest version  
brew upgrade node  
Если вы используете nvm , запустите:  

which node
node -v
nvm list-remote
nvm use v16.14.0
nvm alias default v22.3.0

nvm current node -v  # Checks your current version  
nvm install <version>  # Example: nvm install 12.14.1  
yarn config set ignore-engines true

#reinstall  
sudo apt-get remove nodejs  
sudo apt-get remove npm  
sudo apt-get update  
sudo rm -rf /usr/local/bin/npm  
sudo rm -rf /usr/local/share/man/man1/node*  
sudo rm -rf /usr/local/lib/dtrace/node.d  
rm -rf ~/.npm  
rm -rf ~/.node-gyp  
sudo rm -rf /opt/local/bin/node  
sudo rm -rf /opt/local/include/node  
sudo rm -rf /opt/local/lib/node_modules  
sudo rm -rf /usr/local/lib/node*  
sudo rm -rf /usr/local/include/node*  
sudo rm -rf /usr/local/bin/node*
sudo apt-get remove nodejs npm node  
sudo apt-get purge nodejs  
#or
sudo apt-get purge --auto-remove nodejs npm

#install nvm
curl -o- HTTPS_REACT://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
touch .bashrc
reset terminal

npm install --global yarn
npm install -g npm@10.8.2
npm install npm@latest
