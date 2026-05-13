@echo off
chcp 65001 >nul
title TCP Сервер (порт 5025)

echo ========================================
echo       TCP Сервер (Admin Mode)
echo ========================================

cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Unrestricted -Command ^
    $port = 5025; ^
    Write-Host '--- Проверка порта $port ---' -ForegroundColor Gray; ^
    $oldProcess = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue ^| Select-Object -ExpandProperty OwningProcess -First 1; ^
    if ($oldProcess) { ^
        Write-Host ('Порт занят PID: ' + $oldProcess + '. Завершаю...') -ForegroundColor Yellow; ^
        Stop-Process -Id $oldProcess -Force -ErrorAction SilentlyContinue; ^
        Start-Sleep -Seconds 1; ^
    } ^
    $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $port); ^
    try { ^
        $listener.Start(); ^
        Write-Host '✅ Сервер запущен. Ожидание подключений...' -ForegroundColor Green; ^
        while ($true) { ^
            if ($listener.Pending()) { ^
                $client = $listener.AcceptTcpClient(); ^
                Write-Host ('[+] Подключен: ' + $client.Client.RemoteEndPoint) -ForegroundColor Cyan; ^
                $stream = $client.GetStream(); ^
                $buffer = New-Object byte[] 1024; ^
                try { ^
                    while ($true) { ^
                        $read = $stream.Read($buffer, 0, $buffer.Length); ^
                        if ($read -eq 0) { break }; ^
                        $data = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $read); ^
                        Write-Host ('Получено: ' + $data) -ForegroundColor Green; ^
                    } ^
                } catch { ^
                    Write-Host '[-] Ошибка связи или принудительный разрыв' -ForegroundColor DarkYellow; ^
                } finally { ^
                    $client.Close(); ^
                    $client.Dispose(); ^
                    Write-Host '[-] Клиент отключен. Ожидаю следующего...' -ForegroundColor Gray; ^
                } ^
            } else { ^
                Start-Sleep -Milliseconds 200; ^
            } ^
        } ^
    } catch { ^
        Write-Host ('Критическая ошибка: ' + $_.Exception.Message) -ForegroundColor Red; ^
    } finally { ^
        if ($listener) { $listener.Stop() } ^
    }

pause