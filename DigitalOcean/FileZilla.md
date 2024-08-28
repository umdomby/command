FileZilla  (FTP)
manual
https://docs.digitalocean.com/support/how-do-i-get-my-droplets-ftp-credentials/

ssh to ppk
$ sudo apt-get update
$ sudo apt-get install -y putty-tools
$ puttygen --version

puttygen: Release 0.73
Build platform: 64-bit Unix
Compiler: gcc 9.3.0
Source commit: 745ed3ad3beaf52fc623827e770b3a068b238dd5

$ puttygen id_rsa.pem -O private -o id_rsa_private.ppk
$ puttygen id_rsa.pem -O public -o id_rsa_public.ppk
