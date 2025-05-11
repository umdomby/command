sudo nano /etc/wsl-net.sh

# С таким содержимым:

#!/bin/bash
# Очистка предыдущих настроек
sudo ip route del default 2>/dev/null
sudo ip addr flush eth0 2>/dev/null

# Настройка статического IP (подставьте свои значения)
sudo ip addr add 192.168.1.200/24 dev eth0
sudo ip route add default via 192.168.1.1

# Настройка DNS через resolvconf
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
echo "nameserver 1.1.1.1" | sudo tee -a /etc/resolv.conf



# Сделайте исполняемым:
sudo chmod +x /etc/wsl-net.sh


# Автозапуск через .bashrc
echo "sudo /etc/wsl-net.sh" | sudo tee -a ~/.bashrc


# Закройте и снова откройте WSL, затем проверьте:
ip a
ping google.com


# Чтобы удалить попытку выполнения несуществующего скрипта /etc/network.sh при загрузке WSL2, выполните следующие шаги:

1. Проверьте автозагрузочные файлы Проверьте следующие файлы, где мог быть добавлен вызов скрипта:
nano ~/.bashrc
nano ~/.bash_profile
nano ~/.profile
nano /etc/profile

3. Проверьте systemd сервисы (если используются)
sudo systemctl list-unit-files | grep network
sudo rm /etc/systemd/system/network-config.service 2>/dev/null

4. Очистите кэш После изменений выполните:
source ~/.bashr


or
Создайте пустой файл вместо скрипта:

bash
sudo touch /etc/network.sh
sudo chmod +x /etc/network.sh
Или добавьте проверку в .bashrc:

bash
echo "[[ -f /etc/network.sh ]] && sudo /etc/network.sh || true" >> ~/.bashrc


### SUDO 
1. Истек срок действия кеша sudo
   По умолчанию sudo запоминает пароль на 15 минут. Решение:

bash
sudo -k  # Принудительно сбросить кеш
После этого введите пароль заново.

2. Вы впервые используете sudo в этой сессии
   WSL2 запрашивает пароль при первом использовании sudo после запуска.

3. Изменения в файлах sudoers
   Проверьте логи:

bash
sudo cat /var/log/auth.log | grep sudo
4. Проблема с правами
   Если вы ранее меняли права на /etc/sudoers:

bash
ls -l /etc/sudoers  # Должно быть -r--r-----
5. Автоматические скрипты
   Если у вас в .bashrc/.zshrc есть команды с sudo, они будут запрашивать пароль.

Как отключить запрос пароля (если нужно):
Откройте файл sudoers:

bash
sudo visudo
Добавьте строку (замените username на ваше имя пользователя):

username ALL=(ALL) NOPASSWD: ALL


. Восстановление стандартных настроек сети
Выполните в WSL2:

bash
sudo rm -f /etc/resolv.conf
sudo ln -s /run/resolvconf/resolv.conf /etc/resolv.conf
sudo dpkg-reconfigure resolvconf
2. Удаление проблемных скриптов
   bash
   sudo rm -f /etc/network.sh /etc/wsl-net.sh
   sudo sed -i '/network.sh/d' ~/.bashrc
   sudo sed -i '/wsl-net.sh/d' ~/.bashrc
3. Настройка sudo без пароля (если нужно)
   Откройте конфигурацию:

bash
sudo visudo
Добавьте в конец файла:

pi ALL=(ALL) NOPASSWD: ALL
Сохраните (Ctrl+X → Y → Enter)

4. Альтернативный способ настройки DNS
   Создайте новый безопасный скрипт:

bash
sudo nano /etc/wsl-dns.sh


6. Фикс прав
   bash
   sudo chmod 644 /run/resolvconf/resolv.conf
   sudo chmod +x /etc/wsl-dns.sh