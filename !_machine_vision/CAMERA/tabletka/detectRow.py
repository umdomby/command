import cv2
import numpy as np
from pyueye import ueye
from ultralytics import YOLO
import traceback
import os
import time

def on_change(val):
    pass

def main():
    # --- БЛОК НАСТРОЕК ---
    DEFAULT_GAIN = 0
    DEFAULT_EXPOSURE = 9
    DEFAULT_FPS = 100
    DEFAULT_THRESH = 25

    # Настройки нейросети
    MODEL_PATH = r"C:\_VIDEO\picoCam-303C-I2D303C-RCA11-BLISTER\png\best.onnx"
    TRIGGER_CLASS = "trigger_mark"
    CONF_THRESHOLD = 0.60 # Планка снижена на 20%
    # ---------------------

    SENSOR_WIDTH, SENSOR_HEIGHT = 1936, 1216

    # Твое разрешение
    width, height = 1200, 110

    # Кратность для uEye (обязательно)
    width = width & ~7
    height = height & ~1
    pos_x = ((SENSOR_WIDTH - width) // 2) & ~1
    pos_y = ((SENSOR_HEIGHT - height) // 2) & ~1

    # Загрузка модели
    model = YOLO(MODEL_PATH, task='classify')

    h_cam = ueye.HIDS(0)
    mem_ptr = ueye.c_mem_p()
    mem_id = ueye.int()

    try:
        if ueye.is_InitCamera(h_cam, None) != ueye.IS_SUCCESS:
            print("❌ Камера не найдена!")
            return

        ueye.is_StopLiveVideo(h_cam, ueye.IS_WAIT)

        rect_aoi = ueye.IS_RECT()
        rect_aoi.s32X = ueye.int(pos_x)
        rect_aoi.s32Y = ueye.int(pos_y)
        rect_aoi.s32Width = ueye.int(width)
        rect_aoi.s32Height = ueye.int(height)
        ueye.is_AOI(h_cam, ueye.IS_AOI_IMAGE_SET_AOI, rect_aoi, ueye.sizeof(rect_aoi))

        ueye.is_SetColorMode(h_cam, ueye.IS_CM_SENSOR_RAW8)
        ueye.is_AllocImageMem(h_cam, width, height, 8, mem_ptr, mem_id)
        ueye.is_SetImageMem(h_cam, mem_ptr, mem_id)
        ueye.is_SetAutoParameter(h_cam, ueye.IS_SET_ENABLE_AUTO_GAIN, ueye.double(0), ueye.double(0))

        win_name = 'picoCam - YOLO Inspection'
        cv2.namedWindow(win_name, cv2.WINDOW_NORMAL)
        # Масштабируем окно для удобства, так как 110px по высоте — это очень узко
        cv2.resizeWindow(win_name, 1200, 250)

        cv2.createTrackbar('Gain', win_name, DEFAULT_GAIN, 100, on_change)
        cv2.createTrackbar('Exposure', win_name, DEFAULT_EXPOSURE, 200, on_change)
        cv2.createTrackbar('FPS', win_name, DEFAULT_FPS, 100, on_change)
        cv2.createTrackbar('Thresh', win_name, DEFAULT_THRESH, 255, on_change)

        ueye.is_CaptureVideo(h_cam, ueye.IS_DONT_WAIT)

        prev_time = time.perf_counter()
        is_row_active = False # Флаг для исключения дублей

        while True:
            # Читаем параметры из трекбаров (как в твоем оригинале)
            g_val = cv2.getTrackbarPos('Gain', win_name)
            e_val = cv2.getTrackbarPos('Exposure', win_name) or 1
            f_val = cv2.getTrackbarPos('FPS', win_name) or 1
            t_val = cv2.getTrackbarPos('Thresh', win_name)

            ueye.is_SetHardwareGain(h_cam, g_val, ueye.IS_IGNORE_PARAMETER, ueye.IS_IGNORE_PARAMETER, ueye.IS_IGNORE_PARAMETER)
            ueye.is_Exposure(h_cam, ueye.IS_EXPOSURE_CMD_SET_EXPOSURE, ueye.double(e_val), 8)
            ueye.is_SetFrameRate(h_cam, ueye.double(f_val), ueye.double())

            # Контроль FPS
            target_delay = 1.0 / f_val
            while (time.perf_counter() - prev_time) < target_delay:
                time.sleep(0.001)
            real_fps = 1.0 / (time.perf_counter() - prev_time)
            prev_time = time.perf_counter()

            data = ueye.get_data(mem_ptr, width, height, 8, width, copy=True)
            if data is not None:
                raw_frame = np.frombuffer(data, dtype=np.uint8).reshape((height, width))
                color_frame = cv2.cvtColor(raw_frame, cv2.COLOR_BayerRG2BGR)

                # --- РАБОТА YOLO ---
                results = model.predict(color_frame, imgsz=224, verbose=False)[0]
                conf = results.probs.top1conf.item()
                cls_name = results.names[results.probs.top1]

                # Логика "Один ряд — Один вывод"
                if cls_name == TRIGGER_CLASS and conf >= CONF_THRESHOLD:
                    if not is_row_active:
                        # ВЫВОДИМ В КОНСОЛЬ БЕЗ ДУБЛИРОВАНИЯ
                        print(f"[{time.strftime('%H:%M:%S')}] ✅ РЯД ОПРЕДЕЛЕН: {cls_name} (Conf: {conf:.2f})")
                        is_row_active = True

                # Сброс флага (гистерезис), когда объект уехал
                elif conf < (CONF_THRESHOLD - 0.1):
                    is_row_active = False

                # Отрисовка статуса на кадре
                cv2.setWindowTitle(win_name, f"Inspection | Real FPS: {real_fps:.1f}")

                # Текст для визуализации
                label = f"{cls_name} {conf:.2f}"
                color = (0, 255, 0) if is_row_active else (0, 0, 255)
                cv2.putText(color_frame, label, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

                # Если яркость ниже t_val (твоя логика из оригинала), можно добавить доп. условие

                cv2.imshow(win_name, color_frame)

                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'): break

    except Exception:
        traceback.print_exc()
    finally:
        ueye.is_ExitCamera(h_cam)
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()