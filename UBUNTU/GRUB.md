ls
set prefix=(hd0,gpt3)/boot/grub
set root=(hd0,gpt3)
ls /boot/grub
insmod ext2
insmod normal
normal

#grub-customizer (settings to file grub loader /dev/sda3)
sudo add-apt-repository ppa:danielrichter2007/grub-customizer
sudo apt-get update
sudo apt-get install grub-customizer
grub-customizer

#disk
sudo apt install gparted
gparted


#no-test
sudo add-apt-repository ppa:yannubuntu/boot-repair && sudo apt update
sudo apt install -y boot-repair && boot-repair



Error sudo rm /boot/grub/grub. cfg