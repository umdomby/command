













#######################################################END
npm install mongoose
yarn add mongoose

На данный момент у MongoDb нет официальной сборки для Ubuntu 22.04.  
Ubuntu 22.04 обновил libssl до версии 3 и не предлагает libssl1.1.  
Вы можете принудительно установить libssl1.1, добавив исходный код Ubuntu 20.04:  

#echo "deb http://security.ubuntu.com/ubuntu focal-security main" | sudo tee /etc/apt/sources.list.d/focal-security.list  
#sudo apt-get update  
#sudo apt-get install libssl1.1

Затем используйте свои команды для установки mongodb-org.  
Затем удалите только что созданный файл списка фокальной безопасности:  
#rm /etc/apt/sources.list.d/focal-security.list  

HTTPS_REACT://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/

#sudo systemctl start mongod  
#sudo systemctl daemon-reload  
#sudo systemctl status mongod  
#sudo systemctl enable mongod
#sudo systemctl restart mongod  
#mongosh  

COMPAS
HTTPS_REACT://www.mongodb.com/docs/compass/current/install/
#wget HTTPS_REACT://downloads.mongodb.com/compass/mongodb-compass_1.33.1_amd64.deb  
#sudo dpkg -i mongodb-compass_1.33.1_amd64.deb  

1. Остановите mongodпроцесс, введя следующую команду:

   sudo service mongod stop

2. Удалите все пакеты MongoDB, которые вы установили ранее:

   sudo apt-get purge mongodb-org*

3. Удалите базы данных MongoDB и файлы журналов: -

   sudo rm -r /var/log/mongodb
   sudo rm -r /var/lib/mongodb

4.Затем переустановите mangodb 4.4.8

5. Импортируйте открытый ключ, используемый системой управления пакетами:

   wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -

6. Следующая инструкция предназначена для Ubuntu 20.04 (Focal):

   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list

7. Обновить приложение

   sudo apt-get update

8.Установите монгодб

    sudo apt-get install mongodb-org=4.4.8 mongodb-org-server=4.4.8 mongodb-org-shell=4.4.8 mongodb-org-mongos=4.4.8 mongodb-org-tools=4.4.8

9.Используйте mongod --version, чтобы проверить, успешно ли он установлен .

10. Если вы столкнулись с какой-либо ошибкой при использованииmongod

    sudo mkdir /data
    cd /data
    sudo mkdir db
    sudo pkill -f mongod

11. Затем используйте команду sudo mongod.
12. sudo systemctl status mongod
