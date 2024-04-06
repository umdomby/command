add SSH  

sudo apt install git-all  
git clone repository  

nvm  github.com/nvm-sh/nvm  
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash  

add  

export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm -v  
nvm install version  

NGINX   or  PM2  
NGINX  
cd /etc/nginx#  
apt install vim  
vim nginx.conf  
Esc :q!  выход без сохранения  

cd /etc/nginx/sites-enabled  
o:wq  
root /var/www/dist

console delete folder rm -rf html
mv dist ../../var/www
sudo service nginx restart  

gzip  
vim nginx.conf   gzip on;  delete #6
sudo service nginx restart 

letsencrypt.org certbot.eff.org  
add server_nave domain www.domain
nginx -t  проверка
git pull  

cd etc/nginx/sites/
cat default   #copy
folder .nginx add nginx.conf  #paste

docker
Dockerfile #deit path


