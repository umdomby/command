#REACT  
npx create-react-app@latest my-app-name    or    .  

#NODE  
https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-20-04  
https://stackoverflow.com/questions/32426601/how-can-i-completely-uninstall-nodejs-npm-and-node-in-ubuntu  

sudo apt-get remove nodejs npm node  
sudo apt-get purge nodejs  

sudo rm -rf /usr/local/bin/npm  
sudo rm -rf /usr/local/share/man/man1/node*  
sudo rm -rf /usr/local/lib/dtrace/node.d  
sudo rm -rf ~/.npm  
sudo rm -rf ~/.node-gyp  
sudo rm -rf /opt/local/bin/node  
sudo rm -rf opt/local/include/node  
sudo rm -rf /opt/local/lib/node_modules  

sudo rm -rf /usr/local/lib/node*  
sudo rm -rf /usr/local/include/node*  
sudo rm -rf /usr/local/bin/node*  

which node  
which nodejs  
which npm  

###############################################################################
--Option 3 — Installing Node Using the Node Version Manager
ln -s "$(which node)" /usr/local/bin/node

curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.39.0/install.sh | bash  
export NVM_DIR="$HOME/.nvm"  
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm  
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion  

nvm --version  
nvm install node  
nvm install --lts  

node --version  or node -v  
nvm list-remote
nvm install v17.3.1
nvm use v17.3.1
mkdir ~/.npm-global  
npm config set prefix '~/.npm-global'  
PATH="$HOME/.npm-global/bin:$PATH"  
source ~/.profile  

--Option 2 — Installing Node.js with Apt Using a NodeSource PPA  
sudo apt-get remove nodejs  
sudo apt-get remove npm  
Then go to /etc/apt/sources.list.d and remove any node list if you have. Then do a 

  nodesource.list  
deb [signed-by=/usr/share/keyrings/nodesource.gpg] https://deb.nodesource.com/node_17.x focal main  
deb-src [signed-by=/usr/share/keyrings/nodesource.gpg] https://deb.nodesource.com/node_17.x focal main  

  nodesource.list.save  
deb [signed-by=/usr/share/keyrings/nodesource.gpg] https://deb.nodesource.com/node_17.x focal main  
deb-src [signed-by=/usr/share/keyrings/nodesource.gpg] https://deb.nodesource.com/node_17.x focal main  
sudo apt-get update  
which node  
