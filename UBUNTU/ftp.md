sudo apt install vsftpd
sodo nano /etc/vsftpd.conf
write_enable=YES
sudo systemctl restart vsftpd.service