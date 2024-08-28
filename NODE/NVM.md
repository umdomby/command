```
sudo apt install curl
curl -V
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

nvm -v


curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh

source ~/.bashrc

nvm list-remote

which node
nvm list-remote
nvm install v20.17.0
nvm use v20.17.0
nvm alias default v20.17.0
node -v



nvm install v16.20.2
nvm use v16.20.2
nvm alias default v16.20.2
node -v
