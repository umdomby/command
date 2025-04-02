Решение проблемы
Сначала полностью удалите существующую установку Go:

bash
Copy
sudo rm -rf /usr/local/go
sudo apt remove --purge golang-go gccgo-go
sudo snap remove go
Установите Go вручную (выберите версию 1.21.x, которая стабильна для WebRTC):

Для ARM (Raspberry Pi):

bash
Copy
wget https://go.dev/dl/go1.21.7.linux-arm64.tar.gz
sudo tar -C /usr/local -xzf go1.21.7.linux-arm64.tar.gz
Для AMD64:

bash
Copy
wget https://go.dev/dl/go1.21.7.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.7.linux-amd64.tar.gz
Настройте переменные окружения:

bash
Copy
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
echo 'export GOPATH=$HOME/go' >> ~/.bashrc
echo 'export PATH=$PATH:$GOPATH/bin' >> ~/.bashrc
source ~/.bashrc
Проверьте установку:

bash
Copy
go version