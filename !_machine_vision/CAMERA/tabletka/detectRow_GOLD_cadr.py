import cv2
import numpy as np
from pyueye import ueye
from ultralytics import YOLO
import traceback
import time
import os
from collections import deque

def on_change(val):
    pass

def main():
    # --- БЛОК НАСТРОЕК ---
    DEFAULT_GAIN = 0
    DEFAULT_EXPOSURE = 9
    DEFAULT_FPS = 100
    DEFAULT_THRESH = 25
    DEFAULT_CONF = 55
    DEFAULT_DELAY = 5
    DEFAULT_MARGIN = 1        # новое: 5 = 0.05 (5%)

    SAVE_PATH = r"C:\_VIDEO\picoCam-303C-I2D303C-RCA11-BLISTER\png"
    MODEL_PATH = os.path.join(SAVE_PATH, "best.onnx")
    CLASS_YES = "trigger_mark_yes"
    CLASS_NO = "trigger_mark_no"
    
    # Создаем папку, если её нет
    if not os.path.exists(SAVE_PATH):
        os.makedirs(SAVE_PATH)
    
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

        win_name = 'picoCam - YOLO Inspection'
        cv2.namedWindow(win_name, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(win_name, 1200, 400)   

        cv2.createTrackbar('Gain', win_name, DEFAULT_GAIN, 100, on_change)
        cv2.createTrackbar('Exposure', win_name, DEFAULT_EXPOSURE, 200, on_change)
        cv2.createTrackbar('FPS', win_name, DEFAULT_FPS, 100, on_change)
        cv2.createTrackbar('Thresh', win_name, DEFAULT_THRESH, 255, on_change)
        cv2.createTrackbar('Delay(x0.01s)', win_name, DEFAULT_DELAY, 100, on_change)
        cv2.setTrackbarMin('Delay(x0.01s)', win_name, 5)
        cv2.createTrackbar('Conf (%)', win_name, DEFAULT_CONF, 100, on_change)
        cv2.createTrackbar('Margin (%)', win_name, DEFAULT_MARGIN, 30, on_change)
        cv2.setTrackbarMin('Margin (%)', win_name, 1)

        ueye.is_CaptureVideo(h_cam, ueye.IS_DONT_WAIT)

        total_rows = 0
        last_detection_time = 0
        is_row_active = False

        yes_buffer = deque(maxlen=6)
        no_buffer = deque(maxlen=8)

        CONFIRM_YES = 4
        CONFIRM_NO = 6

        prev_time = time.perf_counter()

        while True:
            g_val = cv2.getTrackbarPos('Gain', win_name)
            e_val = cv2.getTrackbarPos('Exposure', win_name) or 1
            f_val = cv2.getTrackbarPos('FPS', win_name) or 1
            delay_sec = cv2.getTrackbarPos('Delay(x0.01s)', win_name) / 100.0
            conf_threshold = cv2.getTrackbarPos('Conf (%)', win_name) / 100.0
            margin_percent = cv2.getTrackbarPos('Margin (%)', win_name)
            MIN_MARGIN = margin_percent / 100.0

            ueye.is_SetHardwareGain(h_cam, g_val, ueye.IS_IGNORE_PARAMETER, ueye.IS_IGNORE_PARAMETER, ueye.IS_IGNORE_PARAMETER)
            ueye.is_Exposure(h_cam, ueye.IS_EXPOSURE_CMD_SET_EXPOSURE, ueye.double(e_val), 8)
            ueye.is_SetFrameRate(h_cam, ueye.double(f_val), ueye.double())

            data = ueye.get_data(mem_ptr, width, height, 8, width, copy=True)
            if data is None:
                continue

            raw_frame = np.frombuffer(data, dtype=np.uint8).reshape((height, width))
            color_frame = cv2.cvtColor(raw_frame, cv2.COLOR_BayerRG2BGR)

            results = model.predict(color_frame, imgsz=224, verbose=False)[0]
            conf = results.probs.top1conf.item()
            cls_name = results.names[results.probs.top1]

            names = results.names
            idx_yes = next((k for k, v in names.items() if v == CLASS_YES), None)
            idx_no = next((k for k, v in names.items() if v == CLASS_NO), None)
            
            p_yes = results.probs.data[idx_yes].item() if idx_yes is not None else 0.0
            p_no = results.probs.data[idx_no].item() if idx_no is not None else 0.0

            current_time = time.time()

            is_yes = (p_yes >= conf_threshold) and (p_yes - p_no >= MIN_MARGIN)
            is_no_high_conf = (p_no >= 0.70) and (p_no - p_yes >= MIN_MARGIN)

            yes_buffer.append(is_yes)
            no_buffer.append(is_no_high_conf)

            yes_confirmed = sum(yes_buffer) >= CONFIRM_YES
            no_confirmed = sum(no_buffer) >= CONFIRM_NO

            if yes_confirmed and not is_row_active:
                if (current_time - last_detection_time) > delay_sec:
                    total_rows += 1
                    is_row_active = True
                    last_detection_time = current_time
                    
                    # --- СОХРАНЕНИЕ ЗОЛОТОГО СНИМКА ---
                    img_name = os.path.join(SAVE_PATH, f"row_{total_rows:04d}.png")
                    cv2.imwrite(img_name, color_frame)
                    
                    print(f"✅ РЯД #{total_rows} СОХРАНЕН | p_yes={p_yes:.4f}  p_no={p_no:.4f}")

            if no_confirmed and is_row_active:
                is_row_active = False
                print(f"--- Просвет --- | p_yes={p_yes:.4f}  p_no={p_no:.4f}")

            text_color = (0, 255, 0) if is_row_active else (255, 255, 255)
            label = f"ROWS: {total_rows} | {cls_name} ({conf:.2f}) | THR: {conf_threshold:.2f}"

            cv2.rectangle(color_frame, (0, 0), (450, 25), (0, 0, 0), -1)
            cv2.putText(color_frame, label, (10, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.4, text_color, 1)

            cv2.imshow(win_name, color_frame)

            target_interval = 1.0 / f_val
            while (time.perf_counter() - prev_time) < target_interval:
                time.sleep(0.001)
            real_fps = 1.0 / (time.perf_counter() - prev_time)
            prev_time = time.perf_counter()

            cv2.setWindowTitle(win_name, f"FPS: {real_fps:.1f} | TOTAL: {total_rows}")

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    except Exception:
        traceback.print_exc()
    finally:
        ueye.is_ExitCamera(h_cam)
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()