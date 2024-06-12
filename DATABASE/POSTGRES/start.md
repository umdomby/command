sudo apt install postgresql
https://www.digitalocean.com/community/tutorials/how-to-install-and-use-postgresql-on-ubuntu-20-04

sudo systemctl start postgresql.service
sudo -i -u postgres
sudo su - postgres
sudo -u postgres psql


sudo service postgresql restart

sudo service postgresql status
sudo service postgresql start
sudo service postgresql restart

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