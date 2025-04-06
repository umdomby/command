у меня WSL2 WebStorm для CLI

# Установите JDK (для Android)
sudo apt install -y openjdk-11-jdk

# Установите Watchman (для React Native)
sudo apt install -y watchman

# Установите React Native CLI глобально
npm install -g react-native-cli

# Создание проекта
npx @react-native-community/cli init WebRTCProject --template react-native-template-typescript

npx @react-native-community/cli init WebRTCProject --version 0.72.6

cd WebRTCProject

yarn add react-native-webrtc

