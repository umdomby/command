ssh-keygen -t ed25519 -C "umdomby@yandex.ru"
git remote -v
git remote set-url origin git@github.com:umdomby/command.git
git remote set-url origin git@github.com:umdomby/prod.git
git remote -v
ssh -T git@github.com
```
The authenticity of host 'github.com (140.82.121.3)' can't be established.
ED25519 key fingerprint is SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
```
```
Hi umdomby! You've successfully authenticated, but GitHub does not provide shell access.
```

copy page .ssh in home

# На новой машине
mkdir -p ~/.ssh
tar -xzf ssh_backup.tar.gz -C ~/
chmod 700 ~/.ssh
chmod 600 ~/.ssh/*
chmod 644 ~/.ssh/*.pub
chmod 644 ~/.ssh/known_hosts  # если есть

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
