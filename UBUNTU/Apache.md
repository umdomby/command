sudo service apache2 stop
sudo apt-get purge apache2 apache2-utils apache2.2-bin apache2-common
sudo apt-get autoremove
sudo apt remove apache2


Наконец, надо проверить наличие конфигурационных файлов или мануалов, связанных с Apache2, но до сих пор не удаленных.

$ whereis apache2
Я в ответ получил такую строчку: apache2: /etc/apache2

Это значит, что директория /etc/apache2 все еще существует. 
Но раз теперь эта директория (и содержащиеся в ней файлы) никем не используется, удалите ее вручную.

$ sudo rm -rf /etc/apache2