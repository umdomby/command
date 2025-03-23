Использование Expo Dev Client
Expo Dev Client — это кастомное приложение для разработки, которое позволяет использовать нативные модули, включая WebRTC.

Создайте Dev Client:

Установите expo-dev-client:

bash
Copy
expo install expo-dev-client
Создайте Dev Client:

bash
Copy
eas build --profile development --platform ios
Установите react-native-webrtc:

Установите библиотеку react-native-webrtc:

bash
Copy
npm install react-native-webrtc
Для iOS также потребуется установить зависимости через CocoaPods:

bash
Copy
cd ios && pod install
Протестируйте приложение:

Установите Dev Client на iPhone 13.

Запустите проект через Dev Client.