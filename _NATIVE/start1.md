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

expo start --tunnel


hostname -I

expo start --lan --host 172.30.46.88


http://172.30.46.88:19000

http://192.168.1.151:19000
http://192.168.1.151:8081