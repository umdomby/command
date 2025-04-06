# Установите Expo CLI если еще не установлен
npm install -g expo-cli

# Создайте новый проект
expo init MyWebRTCApp
# Выберите template: "blank (TypeScript)"

# Перейдите в папку проекта
cd MyWebRTCApp

# Установите необходимые зависимости
expo install react-native-webrtc @types/react-native-webrtc

npx expo login

hostname -I


http://172.30.46.88:19000

http://192.168.1.151:19000
http://192.168.1.151:8081

yarn start --tunnel
yarn start -c --tunnel

yarn start --clear


yarn start --lan
yarn start --host=192.168.1.151
yarn start --host=213.184.249.66

npm install -g eas-cli
eas build --profile development --platform ios


npx expo run:ios

watchman watch-del-all
start -- --reset-cache


npx expo install expo-dev-client
eas build --profile development --platform ios