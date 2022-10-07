#загрузочная HTTPS_REACT://losst.ru/kak-sdelat-zagruzochnuyu-fleshku-ubuntu

sudo dpkg -i  .dep #установка пакета
sudo apt-get install gdebi
кликаем правой кнопкой мыши по файлу, выбираем открыть с помощью и gdebi

JDK
HTTPS_REACT://www.digitalocean.com/community/tutorials/how-to-install-java-with-apt-on-ubuntu-22-04

sudo apt install curl
HTTPS_REACT://www.digitalocean.com/community/tutorials/how-to-install-java-with-apt-on-ubuntu-22-04

npm install --global yarn

#80port
sudo apt-get install libcap2-bin 
sudo setcap cap_net_bind_service=+ep `readlink -f \`which node\``
