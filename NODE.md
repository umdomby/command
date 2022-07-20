Если вы использовали Homebrew , запустите:  

brew update  # This updates Homebrew to latest version  
brew upgrade node  
Если вы используете nvm , запустите:  

node -v
nvm list-remote
nvm use v16.14.0

nvm current node -v  # Checks your current version  
nvm install <version>  # Example: nvm install 12.14.1  

yarn config set ignore-engines true  

#Error: error:0308010C:digital envelope routines::unsupported
export NODE_OPTIONS=--openssl-legacy-provider
or
"start": "react-scripts --openssl-legacy-provider start"

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
