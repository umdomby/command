go 1.24
cd ~ && wget https://go.dev/dl/go1.24.6.linux-amd64.tar.gz && sudo tar -C /usr/local -xzf go1.24.6.linux-amd64.tar.gz && echo 'export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin' >> ~/.bashrc && echo 'export GOPATH=$HOME/go' >> ~/.bashrc && source ~/.bashrc && go version
go version


go mod tidy

go mod download
go build

Запуск сервера:
go run main.go

Или для запуска на определенном порту:
go run main.go -port 8080

Для сборки бинарного файла:
go build -o webrtc-server



go run main.go rooms.go signaling.go


mkdir handlers
mv rooms.go signaling.go handlers/


# Переинициализируйте модуль
go mod init webrtc-server

# Обновите зависимости
go mod tidy

# Запустите сервер
go run .


sudo apt update
sudo apt install snapd -y
sudo snap install go --classic


cd server
go mod init server
go mod tidy
go run main.go

go clean -modcache
go mod download
go run main.go


Сначала удалите текущие файлы зависимостей:
rm -rf go.mod go.sum

go mod init server

go mod tidy
go mod vendor

###
go clean -modcache
rm -rf go.sum
go mod download
go run main.go