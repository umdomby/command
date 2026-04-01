import cv2
import numpy as np
from pyueye import ueye
from ultralytics import YOLO
import traceback
import time

def on_change(val):
    pass

def main():
    # --- НАСТРОЙКИ ПЕРЕХОДА ---
    MODEL_PATH = r"C:\_VIDEO\picoCam-303C-I2D303C-RCA11-BLISTER\png\best.onnx"
    TRIGGER_CLASS = "trigger_mark"
    
    # ПОРОГИ: 
    # Считаем "1", если уверенность выше 0.90
    # Считаем "0", если уверенность упала ниже 0.50
    START_CONF = 0.90
    RESET_CONF = 0.50
    # -------------------------

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
            return

        ueye.is_StopLiveVideo(h_cam, ueye.IS_WAIT)

        rect_aoi = ueye.IS_RECT()
        rect_aoi.s32X, rect_aoi.s32Y = ueye.int(pos_x), ueye.int(pos_y)
        rect_aoi.s32Width, rect_aoi.s32Height = ueye.int(width), ueye.int(height)
        ueye.is_AOI(h_cam, ueye.IS_AOI_IMAGE_SET_AOI, rect_aoi, ueye.sizeof(rect_aoi))

        ueye.is_SetColorMode(h_cam, ueye.IS_CM_SENSOR_RAW8)
        ueye.is_AllocImageMem(h_cam, width, height, 8, mem_ptr, mem_id)
        ueye.is_SetImageMem(h_cam, mem_ptr, mem_id)
        
        win_name = 'picoCam - FINAL COUNTER'
        cv2.namedWindow(win_name, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(win_name, 1200, 250)

        cv2.createTrackbar('Gain', win_name, 0, 100, on_change)
        cv2.createTrackbar('Exposure', win_name, 9, 200, on_change)
        cv2.createTrackbar('FPS', win_name, 100, 100, on_change)

        ueye.is_CaptureVideo(h_cam, ueye.IS_DONT_WAIT)

        prev_time = time.perf_counter()
        
        # ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
        total_rows = 0
        is_active = False  # Текущее состояние триггера

        print("🚀 Счётчик запущен. Жду переходы 0 -> 1", flush=True)

        while True:
            # Настройки камеры (оригинал)
            g_val = cv2.getTrackbarPos('Gain', win_name)
            e_val = cv2.getTrackbarPos('Exposure', win_name) or 1
            f_val = cv2.getTrackbarPos('FPS', win_name) or 1
            
            ueye.is_SetHardwareGain(h_cam, g_val, ueye.IS_IGNORE_PARAMETER, 0, 0)
            ueye.is_Exposure(h_cam, ueye.IS_EXPOSURE_CMD_SET_EXPOSURE, ueye.double(e_val), 8)
            ueye.is_SetFrameRate(h_cam, ueye.double(f_val), ueye.double())

            target_delay = 1.0 / f_val
            while (time.perf_counter() - prev_time) < target_delay:
                time.sleep(0.001)
            prev_time = time.perf_counter()

            data = ueye.get_data(mem_ptr, width, height, 8, width, copy=True)
            if data is not None:
                raw_frame = np.frombuffer(data, dtype=np.uint8).reshape((height, width))
                color_frame = cv2.cvtColor(raw_frame, cv2.COLOR_BayerRG2BGR)

                # Детекция
                results = model.predict(color_frame, imgsz=224, verbose=False)[0]
                conf = results.probs.top1conf.item()
                cls_name = results.names[results.probs.top1]

                # --- ЛОГИКА ПЕРЕХОДА ---
                
                # Если видим метку четко (>= 0.90) и до этого был "0"
                if cls_name == TRIGGER_CLASS and conf >= START_CONF:
                    if not is_active:
                        total_rows += 1
                        print(f"[{time.strftime('%H:%M:%S')}] ✅ СЧЁТ +1 | ИТОГО: {total_rows}", flush=True)
                        is_active = True
                
                # СБРОС: если уверенность упала ниже 0.50 ИЛИ сменился класс
                elif conf < RESET_CONF or cls_name != TRIGGER_CLASS:
                    is_active = False

                # Отрисовка
                color = (0, 255, 0) if is_active else (0, 0, 255)
                label = f"{cls_name} {conf:.2f} | Rows: {total_rows}"
                cv2.putText(color_frame, label, (15, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 3)
                
                cv2.imshow(win_name, color_frame)

            if cv2.waitKey(1) & 0xFF == ord('q'): break

    except Exception:
        traceback.print_exc()
    finally:
        ueye.is_ExitCamera(h_cam)
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()