# Create group with root and nodeuser as members
$ sudo addgroup nodecert
$ sudo adduser pi nodecert
$ sudo adduser root pi

# Make the relevant letsencrypt folders owned by said group.
$ sudo chgrp -R nodecert /etc/letsencrypt/live
$ sudo chgrp -R nodecert /etc/letsencrypt/archive

# Allow group to open relevant folders
$ sudo chmod -R 750 /etc/letsencrypt/live
$ sudo chmod -R 750 /etc/letsencrypt/archive
Это должно позволить узлу получить доступ к папкам с сертификатами, не открывая их никому другому.

После этих изменений вам следует перезагрузиться или, по крайней мере, выйти и снова войти в систему.
(Многие изменения разрешений и групп требуют нового сеанса, и у нас были проблемы с PM2 до перезагрузки.)

На экземпляре ec2 вы можете сделать sudo reboot.

Если что-то пойдет не так и вы захотите вернуться к исходным настройкам, следуйте этим инструкциям.

# Delete Group
$ sudo groupdel nodecert

# Reset Permission
$ sudo chown -R :root /etc/letsencrypt/live
$ sudo chown -R :root /etc/letsencrypt/archive

# Check Permissions
$ sudo ll /etc/letsencrypt/