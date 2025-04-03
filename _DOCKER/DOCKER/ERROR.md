wsl -l -v

# stop docker
wsl --unregister docker-desktop


bcdedit /enum | findstr -i hypervisorlaunchtype
bcdedit /set hypervisorlaunchtype Auto

wsl --update