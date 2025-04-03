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