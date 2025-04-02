Если используете Docker
Создайте Dockerfile:

Dockerfile
Copy
FROM golang:1.22-alpine

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o /webrtc-server

EXPOSE 8080

CMD ["/webrtc-server"]
Соберите и запустите контейнер:

bash
Copy
docker build -t webrtc-server .
docker run -p 8080:8080 webrtc-server
Возможные проблемы и решения
Если нет прав на установку:

bash
Copy
sudo chown -R $USER:$USER /usr/local/go
Если go get не работает:

bash
Copy
export GO111MODULE=on
Для ARM процессоров (Raspberry Pi):

bash
Copy
wget https://go.dev/dl/go1.22.2.linux-arm64.tar.gz
После установки Go и зависимостей сервер должен запускаться командой go run main.go.