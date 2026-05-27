Lidar xiaomi Delta2C-PRO_D_V001 подключения к ESP32S3

нужен код ESP32 (RX - GPIO16 (пин 15) = RX от лидара, TX не используется) и C# который будет делать 3D карту
узнай как правильно парсить Lidar xiaomi Delta2C-PRO_D_V001
и дай мне карту. В программе дай пользователю выбрать порт
[env:esp32-s3-devkitc-1]
platform = espressif32
board = esp32-s3-devkitc-1
framework = arduino


нужен код ESP32 (RX - GPIO16 (пин 15) = RX от лидара, TX не используется)

[env:esp32-s3-devkitc-1]
platform = espressif32
board = esp32-s3-devkitc-1
framework = arduino
давай выведем данные в сериал порт от лидара


напиши программу C# - пользователь выбирает порт и получает 3D карту от лидара