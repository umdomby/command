#SEARCH PORT  
dmesg | grep tty    
OR   
ls -l /dev/ttyUSB* && ls -l /dev/ttyS*  

https://nodemcu.readthedocs.io/en/release/flash/  

sudo apt install python3-pip    
pip install pyserial  
pip install esptool  

navatar@navatar-X58-USB3:~/Arduino/BinFile$  
esptool.py --port /dev/ttyUSB1 write_flash -fm dio 0x00000 firmware.bin  


