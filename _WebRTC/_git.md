cd ~/webrtc/src
git fetch origin
git branch -r | grep branch-heads



cd /home/pi/webrtc/src
# Обновите список удаленных веток:
git fetch origin
git branch -r

https://chromiumdash.appspot.com/branches
# 125  не доступен
git checkout branch-heads/6422
# 126
git checkout branch-heads/6478
# 136
git checkout -b m136 branch-heads/7103

sudo chmod -R 755 ~/android-sdk
sudo chmod -R 755 ~/webrtc

# После успешного переключения на ветку branch-heads/6478 (если команда выше выполнится без ошибок),
# не забудьте ОБЯЗАТЕЛЬНО синхронизировать зависимости:
gclient sync -D -f -R