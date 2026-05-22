sudo apt update
sudo apt install nginx -y

# Запусти NGINX и добавь в автозагрузку
sudo systemctl start nginx
sudo systemctl enable nginx


# Проверь, что NGINX работает
sudo systemctl status nginx


# редактор nano (удобный для новичков):
sudo nano /etc/nginx/sites-available/default

# Полностью удали всё содержимое 
удалить строку Ctrl + K 

# Проверь конфигурацию и перезапусти NGINX:
sudo nginx -t
sudo systemctl restart nginx
