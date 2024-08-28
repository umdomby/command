Чтобы изменить пароль пользователя PostgreSQL, выполните следующие действия:

войдите в консоль psql:

```sudo -u postgres psql```
Затем в консоли psql измените пароль и выйдите:

```postgres=# \password postgres```
```Enter new password: <new-password>```
```postgres=# \q```
Или используя запрос:

```ALTER USER postgres PASSWORD '<new-password>'```
Или в одну строку

```sudo -u postgres psql -c "ALTER USER postgres PASSWORD '<new-password>'```

sudo service postgresql restart