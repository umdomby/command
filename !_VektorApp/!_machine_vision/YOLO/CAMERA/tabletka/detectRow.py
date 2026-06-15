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
    # --- БЛОК НАСТРОЕК (ТВОИ ОРИГИНАЛЬНЫЕ) ---
    DEFAULT_GAIN = 0
    DEFAULT_EXPOSURE = 9
    DEFAULT_FPS = 100
    DEFAULT_THRESH = 25
    
    MODEL_PATH = r"C:\_VIDEO\picoCam-303C-I2D303C-RCA11-BLISTER\png\best.onnx"
    TRIGGER_CLASS = "trigger_mark"      # Класс: Ряд в кадре
    EMPTY_CLASS = "trigger_mark_no"    # Класс: Пустота (нет ряда)
    
    CONF_THRESHOLD = 0.90              # Порог срабатывания
    # ------------------------------------------

    SENSOR_WIDTH, SENSOR_HEIGHT = 1936, 1216
    width, height = 1200, 110
    
    width = width & ~7
    height = height & ~1
    pos_x = ((SENSOR_WIDTH - width) // 2) & ~1
    pos_y = ((SENSOR_HEIGHT - height) // 2) & ~1

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
        cv2.resizeWindow(win_name, 1200, 300)

        cv2.createTrackbar('Gain', win_name, DEFAULT_GAIN, 100, on_change)
        cv2.createTrackbar('Exposure', win_name, DEFAULT_EXPOSURE, 200, on_change)
        cv2.createTrackbar('FPS', win_name, DEFAULT_FPS, 100, on_change)
        cv2.createTrackbar('Thresh', win_name, DEFAULT_THRESH, 255, on_change)

        ueye.is_CaptureVideo(h_cam, ueye.IS_DONT_WAIT)

        # ПЕРЕМЕННЫЕ СЧЕТЧИКА
        prev_time = time.perf_counter()
        total_rows = 0
        is_active = False # Флаг: "Сейчас ряд считается активным"

        while True:
            # Настройки камеры (Твоя база)
            g_val = cv2.getTrackbarPos('Gain', win_name)
            e_val = cv2.getTrackbarPos('Exposure', win_name) or 1
            f_val = cv2.getTrackbarPos('FPS', win_name) or 1
            
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

                # --- ЛОГИКА ПОДСЧЕТА (TRIGGER_MARK vs TRIGGER_MARK_NO) ---
                
                # 1. Если видим РЯД и флаг опущен -> Считаем +1 и поднимаем флаг
                if cls_name == TRIGGER_CLASS and conf >= CONF_THRESHOLD:
                    if not is_active:
                        total_rows += 1
                        is_active = True
                        print(f"[{time.strftime('%H:%M:%S')}] ✅ РЯД №{total_rows}")

                # 2. Если видим ПУСТОТУ (trigger_mark_no) -> Опускаем флаг (сброс)
                # Это позволит посчитать следующий ряд, когда он появится
                if cls_name == EMPTY_CLASS and conf >= 0.50:
                    is_active = False

                # Отрисовка
                color = (0, 255, 0) if is_active else (0, 0, 255)
                label = f"TOTAL ROWS: {total_rows} | {cls_name} ({conf:.2f})"
                
                # Подложка и текст (чтобы было видно на любом фоне)
                cv2.rectangle(color_frame, (0, 0), (650, 45), (0, 0, 0), -1)
                cv2.putText(color_frame, label, (10, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
                
                cv2.imshow(win_name, color_frame)
                cv2.setWindowTitle(win_name, f"FPS: {real_fps:.1f} | Active: {is_active}")

                if cv2.waitKey(1) & 0xFF == ord('q'): break

    except Exception:
        traceback.print_exc()
    finally:
        ueye.is_ExitCamera(h_cam)
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()