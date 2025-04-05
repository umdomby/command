HTTPS_REACT://kumarvinay.com/how-to-enable-bluetooth-headset-microphone-support-in-ubuntu-20-04/

Installing Pipewire in ubuntu 20.04  
To Install pipewire, you need to add a pipewire repository. Type the following command in Terminal:  

sudo add-apt-repository ppa:pipewire-debian/pipewire-upstream  
sudo apt update  
sudo apt install pipewire  
sudo apt install libspa-0.2-bluetooth  
sudo apt install pipewire-audio-client-libraries  

Once updated, you will need to reload bluetooth services and mask pulseaudio.  

systemctl --user daemon-reload  
systemctl --user --now disable pulseaudio.service pulseaudio.socket  
systemctl --user mask pulseaudio  
systemctl --user --now enable pipewire-media-session.service  

If you run into some issues in the last command, which I did too. The best way is to restart pipewire or reboot your system.  

systemctl --user restart pipewire  
sudo reboot  
# make sure eveything is working  
pactl info  
