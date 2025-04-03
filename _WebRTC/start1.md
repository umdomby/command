https://github.com/pion/webrtc

3478 для STUN и 3478 или 5349 для TURN

https://github.com/pion/webrtc/tree/master/examples/pion-to-pion

https://github.com/pion/webrtc/tree/master/examples/pion-to-pion сделай мне сервер GO и клиент React для примера в локальной сети и на одном компьютере



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
###

go get github.com/pion/ion-sfu/pkg/sfu@v1.11.0
go get github.com/gorilla/websocket@v1.5.3
go get github.com/sourcegraph/jsonrpc2@v0.2.0