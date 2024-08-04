SSH (англ. Secure Shell — «безопасная оболочка») — сетевой протокол прикладного уровня, позволяющий производить удалённое 
управление операционной системой и туннелирование TCP-соединений (например, для передачи файлов).

ssh root@111.111.111.111

--> password
```
sudo apt install openssh-server
sudo apt update && sudo apt upgrade
sudo systemctl enable --now sshsudo

sudo apt install openssh-server -y
sudo systemctl enable ssh
sudo systemctl status ssh

ssh username@ip-address/hostname


Error connect
ssh-keygen -R 192.168.0.161      #удаляет ключи

//off
sudo systemctl disable ssh --now
```
