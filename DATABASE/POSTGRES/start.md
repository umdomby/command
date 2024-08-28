https://www.digitalocean.com/community/tutorials/how-to-install-postgresql-on-ubuntu-22-04-quickstart

sudo apt update
sudo apt install postgresql postgresql-contrib

sudo nano /etc/postgresql/14/main/postgresql.conf
listen_address = '*'

==> pg_hba.conf

sudo service postgresql restart

```
listen_addresses = '*'
затем откройте файл с именемpg_hba.conf

sudo vi pg_hba.conf
и добавьте эту строку в этот файл

host  all  all 0.0.0.0/0 md5
sudo /etc/init.d/postgresql restart2

```

sudo -i -u postgres
psql
\password postgres

psql -h winhost -p 5432 -U postgres

alter system set ssl=off
select pg_reload_conf()
\q
exit


sudo -u postgres
psql "sslmode=require host=localhost dbname=evershop"
sudo -i -u postgres
createdb online_game
sudo -u postgres createuser --interactive
sudo -u postgres createdb online_game

psql -h 192.168.0.151 -p 5432 -U postgres

psql -h 127.0.0.1 -p 5432 -U postgres

sudo systemctl restart postgresql
sudo service postgresql restart
/etc/init.d/postgresql restart
systemctl reload postgresql-14.service
systemctl status postgresql

#reboot postgres
```
sudo apt-get --purge remove postgresql*
sudo rm -r /etc/postgresql/
sudo rm -r /etc/postgresql-common/
sudo rm -r /var/lib/postgresql/
sudo userdel -r postgres
sudo groupdel postgres
sudo apt-get install postgresql postgresql-client postgresql-contrib libpq-dev

```

sudo apt install postgresql

sudo systemctl start postgresql.service
sudo -i -u postgres
sudo su - postgres
sudo -u postgres psql


sudo service postgresql restart

sudo service postgresql status
sudo service postgresql start
sudo service postgresql restart
sudo service postgresql stop

sudo systemctl status 'postgresql*'

sudo systemctl enable postgresql

# re install problem
sudo pg_dropcluster --stop 12 main
sudo pg_dropcluster --stop 14 main
sudo apt remove postgresql-14
sudo apt purge postgresql*
sudo apt install postgresql-14

sudo systemctl start postgresql

pg_lsclusters
sudo pg_ctlcluster 14 main start
sudo chown postgres -R /var/lib/postgresql/9.6/main/

# or
#set user to group back with
sudo gpasswd -a postgres ssl-cert

# Fixed ownership and mode
sudo chown root:ssl-cert  /etc/ssl/private/ssl-cert-snakeoil.key
sudo chmod 740 /etc/ssl/private/ssl-cert-snakeoil.key

sudo service postgresql restart

# start
ps -ef | grep postgres

# Install the public key for the repository (if not done previously):
curl -fsS https://www.pgadmin.org/static/packages_pgadmin_org.pub | sudo gpg --dearmor -o /usr/share/keyrings/packages-pgadmin-org.gpg

# Create the repository configuration file:
sudo sh -c 'echo "deb [signed-by=/usr/share/keyrings/packages-pgadmin-org.gpg] https://ftp.postgresql.org/pub/pgadmin/pgadmin4/apt/$(lsb_release -cs) pgadmin4 main" > /etc/apt/sources.list.d/pgadmin4.list && apt update'