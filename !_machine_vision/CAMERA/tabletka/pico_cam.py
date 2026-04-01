import cv2
import numpy as np
from pyueye import ueye
import os

# --- БЛОК ЖЕСТКИХ ПАРАМЕТРОВ ---
DEFAULT_GAIN = 0
DEFAULT_EXPOSURE = 9
DEFAULT_FPS = 100
DEFAULT_THRESH = 25

# Новое разрешение
width = 1200
height = 110

# Нативные размеры сенсора для центрирования
SENSOR_WIDTH, SENSOR_HEIGHT = 1936, 1216

# Расчет координат для установки AOI по центру (с выравниванием по четным числам)
pos_x = ((SENSOR_WIDTH - width) // 2) & ~1
pos_y = ((SENSOR_HEIGHT - height) // 2) & ~1

# Гарантируем кратность 2 для ширины и высоты (требование uEye)
width = width & ~1
height = height & ~1

# --- ИНИЦИАЛИЗАЦИЯ КАМЕРЫ ---
h_cam = ueye.HIDS(0)
mem_ptr = ueye.c_mem_p()
mem_id = ueye.int()

try:
    if ueye.is_InitCamera(h_cam, None) != ueye.IS_SUCCESS:
        print("❌ Камера не найдена!")
    else:
        # 1. Останавливаем видео для настройки
        ueye.is_StopLiveVideo(h_cam, ueye.IS_WAIT)

        # 2. Установка области интереса (AOI) - 1200x110 по центру
        rect_aoi = ueye.IS_RECT()
        rect_aoi.s32X = ueye.int(pos_x)
        rect_aoi.s32Y = ueye.int(pos_y)
        rect_aoi.s32Width = ueye.int(width)
        rect_aoi.s32Height = ueye.int(height)
        ueye.is_AOI(h_cam, ueye.IS_AOI_IMAGE_SET_AOI, rect_aoi, ueye.sizeof(rect_aoi))

        # 3. Настройка памяти и цветового режима
        ueye.is_SetColorMode(h_cam, ueye.IS_CM_SENSOR_RAW8)
        ueye.is_AllocImageMem(h_cam, width, height, 8, mem_ptr, mem_id)
        ueye.is_SetImageMem(h_cam, mem_ptr, mem_id)

        # 4. Применение базовых параметров
        ueye.is_SetHardwareGain(h_cam, DEFAULT_GAIN, ueye.IS_IGNORE_PARAMETER, ueye.IS_IGNORE_PARAMETER, ueye.IS_IGNORE_PARAMETER)
        ueye.is_Exposure(h_cam, ueye.IS_EXPOSURE_CMD_SET_EXPOSURE, ueye.double(DEFAULT_EXPOSURE), 8)
        ueye.is_SetFrameRate(h_cam, ueye.double(DEFAULT_FPS), ueye.double())

        # 5. Запуск
        ueye.is_CaptureVideo(h_cam, ueye.IS_DONT_WAIT)
        
        print(f"🚀 Камера запущена в режиме {width}x{height}")
        print(f"📍 Координаты центра AOI: X={pos_x}, Y={pos_y}")
        print(f"⚙️ Настройки: Gain={DEFAULT_GAIN}, Exp={DEFAULT_EXPOSURE}, FPS={DEFAULT_FPS}")

        # Цикл предпросмотра
        while True:
            data = ueye.get_data(mem_ptr, width, height, 8, width, copy=True)
            if data is not None:
                raw_frame = np.frombuffer(data, dtype=np.uint8).reshape((height, width))
                color_frame = cv2.cvtColor(raw_frame, cv2.COLOR_BayerRG2BGR)
                
                # Отображаем узкую полосу (можно растянуть для удобства)
                cv2.imshow('picoCam 1200x110', color_frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

finally:
    ueye.is_ExitCamera(h_cam)
    cv2.destroyAllWindows()