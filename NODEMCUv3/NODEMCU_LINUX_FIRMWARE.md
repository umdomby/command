#SEARCH PORT  
dmesg | grep tty    
OR   
ls -l /dev/ttyUSB* && ls -l /dev/ttyS*  

HTTPS_REACT://nodemcu.readthedocs.io/en/release/flash/  

sudo apt install python3-pip    
pip install pyserial  
pip install esptool
esptool.py --port /dev/ttyUSB0 write_flash -fm dio 0x00000 firmware.bin  


