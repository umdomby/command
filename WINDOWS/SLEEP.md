# PowerShell(администратор).
# Dism /Online /Cleanup-Image /RestoreHealth

Попробуйте удалить папку C:\$WINDOWS.~BT(если она есть), 
остановить службу обновлений, очистить содержимое папки c:\Windows\SoftwareDistribution\, проверьте и установите обновления.

Понаблюдал за процессом MoUsoCoreWorker.exe через powercfg -requests. Он то появляется, то пропадает. Так вот в то время, 
когда он есть ПК в режим сна не переходит, как я описывал. Соответственно, когда его нет - все нормально переходит.

В поиске наберите Планировщик и откройте планировщик заданий. Отключите в нем все задания в секции Библиотека планировщика. Нажмите Win+R, 
в поле напечатайте taskmgr /0 /startup и нажмите Enter. Отключите все что есть в автозагрузке. Перезагрузите компьютер.