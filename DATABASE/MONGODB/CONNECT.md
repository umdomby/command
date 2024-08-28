//connect local
mongodb://192.168.0.151:27017/kafka
mongodb://localhost:27017/mongo

Если вы хотите, чтобы MongoDB запускалась автоматически при загрузке, выполните следующую команду.  
#sudo systemctl enable mongod  

Запустите MongoDB, выполнив следующую команду.  
#sudo systemctl start mongod  

Если MongoDB не запускается, выполните приведенную ниже команду для перезагрузки.  
#sudo systemctl daemon-reload  

Подтвердите, работает ли MongoDB.  
#sudo systemctl status mongod  
