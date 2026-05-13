@echo off
chcp 65001 >nul
title TCP Сервер (порт 5025)

echo ========================================
echo       TCP Сервер (Admin Mode)
echo ========================================

cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Unrestricted -Command ^
    $port = 5025; ^
    $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $port); ^
    try { ^
        $listener.Start(); ^
        Write-Host '✅ Сервер запущен. Ожидание подключений...' -ForegroundColor Green; ^
        while ($true) { ^
            $client = $listener.AcceptTcpClient(); ^
            Write-Host ('[+] Подключен: ' + $client.Client.RemoteEndPoint) -ForegroundColor Cyan; ^
            $stream = $client.GetStream(); ^
            $buffer = New-Object byte[] 1024; ^
            try { ^
                while ($client.Connected) { ^
                    $read = $stream.Read($buffer, 0, $buffer.Length); ^
                    if ($read -eq 0) { break }; ^
                    $data = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $read); ^
                    Write-Host ('Получено: ' + $data) -ForegroundColor Green; ^
                } ^
            } catch { ^
                Write-Host '[-] Соединение разорвано или ошибка чтения' -ForegroundColor Yellow; ^
            } finally { ^
                $client.Close(); ^
                $client.Dispose(); ^
                Write-Host '[-] Клиент отключен, ожидаю нового...' -ForegroundColor Gray; ^
            } ^
        } ^
    } catch { ^
        Write-Host ('Критическая ошибка: ' + $_.Exception.Message) -ForegroundColor Red; ^
    } finally { ^
        $listener.Stop(); ^
    }

pause