https://docs.docker.com/desktop/setup/install/linux/ubuntu/             # Install Docker Desktop on Ubuntu


1. Устранение конфликта с containerd
   Конфликт между containerd.io и containerd нужно устранить. Выполните следующие шаги:

Проверьте, какие пакеты containerd установлены:

dpkg -l | grep containerd
Если установлен containerd.io, удалите его:

sudo apt remove containerd.io
Удалите старую версию containerd, если она есть:

sudo apt remove containerd
Установите docker.io, чтобы получить совместимую версию containerd:

sudo apt update
sudo apt install docker.io
Если конфликт сохраняется, попробуйте очистить кэш apt и исправить зависимости:

sudo apt clean
sudo apt update
sudo apt install -f
2. Проверка и запуск Docker Desktop
   После устранения конфликта с containerd проверьте, запускается ли Docker Desktop:

Запустите службу:

systemctl --user start docker-desktop
Проверьте статус:

systemctl --user status docker-desktop
Если служба не запускается или показывает ошибки, проверьте логи снова:

journalctl --user -u docker-desktop
3. Проверка виртуализации
   Логи показывают, что виртуализация включена (Virtualization enabled), но убедитесь, что KVM работает корректно:


kvm-ok
Если вывод указывает, что виртуализация не поддерживается или KVM не работает, включите поддержку виртуализации в BIOS/UEFI вашей системы (например, включите Intel VT-x или AMD-V).

4. Проверка Docker CLI
   Убедитесь, что Docker CLI работает:

   
docker --version
Если команда возвращает версию, проверьте контекст:


docker context ls
Убедитесь, что активен контекст desktop-linux. Если он не активен, переключитесь:


docker context use desktop-linux
5. Проверка символьной ссылки
   Вывод ln: не удалось создать символьную ссылку '/usr/local/bin/docker': Файл существует указывает, что ссылка уже есть. Проверьте, куда она указывает:

   
ls -l /usr/local/bin/docker
Если ссылка указывает на неверный файл или сломана, удалите её и создайте заново:


sudo rm /usr/local/bin/docker
sudo ln -s /usr/bin/docker /usr/local/bin/docker
6. Полная переустановка Docker Desktop
   Если проблема сохраняется, попробуйте полностью переустановить Docker Desktop:


sudo apt remove --purge docker-desktop
rm -rf ~/.docker/desktop
sudo apt update
sudo apt install ./docker-desktop-amd64.deb
После этого снова запустите:


systemctl --user start docker-desktop
7. Проверка графического интерфейса
   Попробуйте запустить Docker Desktop через меню приложений GNOME/KDE. Если вы не приняли лицензионное соглашение, оно может появиться при первом запуске. Убедитесь, что вы его принимаете.

8. Устранение возможных конфликтов с другими инструментами
   Если на вашей системе установлен Podman или другой контейнерный инструмент, он может конфликтовать с Docker Desktop. Удалите его:

   
sudo apt remove podman
Если проблема не решена
Если после выполнения этих шагов Docker Desktop всё ещё не запускается, пожалуйста, предоставьте:

Вывод команды systemctl --user status docker-desktop.
Полные логи journalctl --user -u docker-desktop (если есть дополнительные ошибки после новых попыток).
Вывод docker info (если Docker CLI работает).
Информацию о вашем окружении (например, используете ли вы GNOME, KDE или другое).

Pi, [30.05.2025 12:16]
1. Разблокировать службу docker-desktop
   Сначала нужно разблокировать (unmask) службу docker-desktop:


systemctl --user unmask docker-desktop
Проверьте статус службы после этого:


systemctl --user status docker-desktop
2. Переустановка Docker Desktop
   Поскольку docker-desktop был удалён при установке docker.io, нужно переустановить его:

Убедитесь, что у вас есть файл docker-desktop-amd64.deb в папке ~/Загрузки. Если его нет, скачайте последнюю версию с официального сайта Docker:
Скачать Docker Desktop.
Удалите docker.io, чтобы избежать конфликтов:

sudo apt remove --purge docker.io
sudo apt autoremove
Установите docker-desktop заново:

sudo apt update
sudo apt install ./docker-desktop-amd64.deb
3. Проверка и настройка зависимостей
   После переустановки убедитесь, что все зависимости корректно настроены:


sudo apt install -f
4. Запуск Docker Desktop
   Попробуйте запустить службу:


systemctl --user start docker-desktop
Проверьте статус:

systemctl --user status docker-desktop
Если служба запускается, но Docker Desktop всё ещё не работает, проверьте логи:


journalctl --user -u docker-desktop
5. Проверка контекста Docker
   После переустановки убедитесь, что используется правильный контекст Docker:


docker context ls
Если контекст desktop-linux отсутствует или не активен, создайте его:


docker context create desktop-linux --docker host=unix:///var/run/docker.sock
docker context use desktop-linux
6. Проверка виртуализации
   Убедитесь, что виртуализация работает:

   
kvm-ok
Если виртуализация не поддерживается, включите Intel VT-x или AMD-V в BIOS/UEFI.

7. Очистка остаточных файлов
   Если проблема сохраняется, удалите остаточные файлы Docker Desktop и начните с чистого листа:


sudo apt remove --purge docker-desktop
rm -rf ~/.docker/desktop
sudo apt update
sudo apt install ./docker-desktop-amd64.deb
8. Проверка графического интерфейса
   После переустановки попробуйте запустить Docker Desktop через меню приложений GNOME/KDE. При первом запуске примите лицензионное соглашение.

9. Удаление ненужных пакетов
   Вывод apt показал, что есть много автоматически установленных пакетов, которые больше не нужны. Очистите их:


sudo apt autoremove