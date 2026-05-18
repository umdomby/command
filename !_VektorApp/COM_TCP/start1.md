# для теста на одном компьютере
IP: 127.0.0.1 
Порт: 5025

# убрать подпись проверки драйвера
bcdedit.exe /set loadoptions DDISABLE_INTEGRITY_CHECKS
bcdedit.exe /set TESTSIGNING ON

# Простой TCP Listener для тестирования
```
$port = 5025                    # ← поменяй, если нужно
$ip = "0.0.0.0"                 # слушать все интерфейсы

$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Parse($ip), $port)
$listener.Start()
Write-Host "✅ TCP сервер запущен на порту $port" -ForegroundColor Green
Write-Host "Ожидание подключения от твоей программы..." -ForegroundColor Yellow

while ($true) {
$client = $listener.AcceptTcpClient()
Write-Host "`nКлиент подключился: $($client.Client.RemoteEndPoint)" -ForegroundColor Cyan

    $stream = $client.GetStream()
    $buffer = New-Object byte[] 1024
    $encoding = [System.Text.Encoding]::UTF8
    
    try {
        while ($client.Connected) {
            $bytesRead = $stream.Read($buffer, 0, $buffer.Length)
            if ($bytesRead -gt 0) {
                $data = $encoding.GetString($buffer, 0, $bytesRead)
                Write-Host "Получено: $data" -ForegroundColor Green
            } else {
                break
            }
        }
    } catch {}
    
    $client.Close()
    Write-Host "Клиент отключился" -ForegroundColor Yellow
}
```

# Вариант 2 — netcat (ncat) — самый удобный
Скачай Nmap: https://nmap.org/download.html
После установки запусти:
```
cmdncat -l -p 5025 -v -k
```
(-k — не закрывать после отключения клиента)


# Вариант 3 — Python (если есть Python)
```
python -c "
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.bind(('0.0.0.0', 5025))
s.listen(1)
print('Listening on port 5025...')
while True:
    conn, addr = s.accept()
    print('Connected:', addr)
    while True:
        data = conn.recv(1024)
        if not data: break
        print('Received:', data.decode('utf-8', errors='ignore'))
"
```
