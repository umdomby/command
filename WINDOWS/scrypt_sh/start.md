https://blog.geekbrains.by/poleznye-skripty-powershell-dlja-windows/#3

# Для начала работы необходимо изменить настройку политики запуска на RemoteSigned, используя команду 
Set-ExecutionPolicy

Restricted — выполнение скриптов запрещено. Стандартная конфигурация;
AllSigned — можно запускать скрипты, подписанные доверенным разработчиком; перед запуском скрипта PowerShell запросит у вас подтверждение;
RemoteSigned — можно запускать собственные скрипты или те, что подписаны доверенным разработчиком;
Unrestricted — можно запускать любые скрипты.



PowerShell_ise

создать файл
команда
netsh interface portproxy reset
сохранить



touch myscript.sh


# ################
gpedit.msc
Конфигурация компьютера — Административные шаблоны — Компоненты Windows — Windows Powershell
Нажимаем два раза на «Включить выполнение скриптов». Выбираем «Включить», и ниже «Разрешить все».
Затем создаем cmd файл в любой папке, например C:\script\ics.cmd, такого содержания:
PowerShell C:\SCRIPT\ics_reenable.ps1
Где ics_reenable.ps1 — сам powershell скрипт.
И создаем в планировщике задачу, с триггером «включение компьютера» или «вход в систему».
Также при необходимости ставим галочки «запускать с наивысшими правами» и «запускать независимо от входа пользователя в систему».

taskschd.msc