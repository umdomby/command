OpenCV и Albumentations


Albumentations: Самая мощная библиотека для аугментации. Она умеет менять яркость, добавлять шум, искажения и размытие, чтобы синтетика выглядела как реальное фото с вашей камеры

Copy-Paste Augmentation: Это специальный метод, когда объекты из одних фото «вклеиваются» в другие. Это именно то, что вы описали.

BlenderProc (если нужно 3D): Если у вас есть 3D-модель болта, можно генерировать тысячи фото в Blender через Python, меняя свет и тени. Но для вашей задачи с болтами на плоскости хватит и обычного 2D наложения в OpenCV.

ROI_X1, ROI_Y1 = 203, 1
ROI_X2, ROI_Y2 = 1628, 1214



на одно фото - от одного до двух элементов на подложку  "C:\_VIDEO\picoCam-303C-I2D303C-RCA11\pico_sentetic\crop_1_1_transparent.png
на тоже фото от 3 до 8 элементов на подлжку RCA11\pico_sentetic\crop_1_1_transparent.png"
"C:\_VIDEO\picoCam-303C-I2D303C-RCA11\pico_sentetic\crop_1_transparent.png"
подложка- размерый ее не меняй! "C:\_VIDEO\picoCam-303C-I2D303C-RCA11\pico_sentetic\crop_1774611288.jpg"
как и в прошлом скрипте разбросай их но чтобы они не лажились один на другой
получается на одном фото будет как минимум 4 элемента и максимум  10



этот скрипт рабочий, только возьми оригинальный размер подложки "C:\_VIDEO\picoCam-303C-I2D303C-RCA11\pico_sentetic\crop_1774611288.jpg"
и не изменяй размеры
"C:\_VIDEO\picoCam-303C-I2D303C-RCA11\pico_sentetic\crop_1_1_transparent.png"
"C:\_VIDEO\picoCam-303C-I2D303C-RCA11\pico_sentetic\crop_1_transparent.png"
"C:\_VIDEO\picoCam-303C-I2D303C-RCA11\pico_sentetic\crop_1774611288.jpg"



