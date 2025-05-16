Проблема с ADB в WSL2 возникает из-за особенностей работы USB в этой среде. Вот как это исправить:

🔧 Решение для WSL2:
1. Установите ADB в Windows (обязательно!)
   powershell
# В PowerShell (от админа):
winget install "Android SDK Platform-Tools"
После установки проверьте в CMD:

cmd
adb version
2. Перенаправление USB в WSL2
   bash
# В WSL2 выполните:
export ADB_SERVER_SOCKET=tcp:$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):5037
3. Подключение телефона:
   Подключите телефон по USB к Windows

В PowerShell:

powershell
adb devices  # Должен показать устройство
adb tcpip 5555
adb connect 192.168.1.179:5555
4. Автоматизация (добавьте в ~/.bashrc):
   bash
   echo "export ADB_SERVER_SOCKET=tcp:\$(grep nameserver /etc/resolv.conf | awk '{print \$2}'):5037" >> ~/.bashrc
   source ~/.bashrc
   🌟 Альтернативные решения:
   Используйте usbipd для проброса USB в WSL2:

powershell
# В PowerShell (админ):
winget install usbipd
usbipd wsl attach --busid <ID-устройства>
Работайте напрямую через Windows-ADB:

bash
# В WSL2:
/mnt/c/Windows/System32/cmd.exe /c "adb devices"
Для Wi-Fi подключения (если USB не работает):

bash
adb connect 192.168.1.179:5555
⚠️ Важно:
WSL2 не имеет прямого доступа к USB-устройствам

Все операции с USB должны идти через Windows-host

Для отладки по Wi-Fi сначала нужно активировать режим через USB (хотя бы раз)

Попробуйте эти варианты и сообщите, какой сработал! 🚀