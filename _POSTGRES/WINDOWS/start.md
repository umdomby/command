services.msc

C:\Program Files\PostgreSQL\16\data

host    replication     all             192.168.0.151/32            scram-sha-256


ALTER ROLE postgres WITH PASSWORD 'We'


Set-Location 'C:\Program Files\PostgreSQL\16\bin'
$env:PGPASSWORD = 'Weterr123'
.\psql --% -U postgres -w postgres