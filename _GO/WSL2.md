sudo apt update && sudo apt upgrade -y

https://go.dev/dl/go1.24.1.linux-amd64.tar.gz
go1.24.1.linux-amd64.tar.gz


wget https://go.dev/dl/go1.24.1.linux-amd64.tar.gz


3. Удалите старую версию (если есть)
sudo rm -rf /usr/local/go

sudo tar -C /usr/local -xzf go1.24.1.linux-amd64.tar.gz

nano ~/.bashrc
Добавьте в конец файла:

export PATH=$PATH:/usr/local/go/bin
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin

source ~/.bashrc

rm go1.24.1.linux-amd64.tar.gz



2. Скачайте последнюю версию Go
   Перейдите на официальный сайт Go и найдите ссылку на последнюю версию (например, go1.21.0.linux-amd64.tar.gz).

Используйте wget для загрузки:

wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz


4. Распакуйте архив в /usr/local
   sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz