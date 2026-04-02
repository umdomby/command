import cv2
import numpy as np
from pyueye import ueye
from ultralytics import YOLO
import traceback
import time
import os
from collections import deque

# ========================= НАСТРОЙКИ =========================
SAVE_PATH = r"C:\_VIDEO\picoCam-303C-I2D303C-RCA11-BLISTER\png"
MODEL_PATH = os.path.join(SAVE_PATH, "best.onnx")
CONFIG_FILE = os.path.join(SAVE_PATH, "line.txt")

# Классы триггера
TRIGGER_YES = "trigger_mark_yes"
TRIGGER_NO = "trigger_mark_no"

# Зоны деления (можно двигать мышкой в окне)
LINE_X = [0, 109, 218, 327, 436, 545, 640, 749, 858, 967, 1076, 1200]

# Отображение классов в консоли (trigger_mark удалён)
MAP_CLASSES = {
    "empty": "0",
    "tablet_g_no": "g_no",
    "tablet_g_od": "g_od",
    "tablet_g_ok": "g_ok",
    "tablet_w_no": "w_no",
    "tablet_w_od": "w_od",
    "tablet_w_ok": "w_ok"
}

# Параметры по умолчанию
DEFAULT_GAIN = 0
DEFAULT_EXPOSURE = 9
DEFAULT_FPS = 100
DEFAULT_DELAY = 5
DEFAULT_CONF = 55
DEFAULT_MARGIN = 5

SENSOR_WIDTH, SENSOR_HEIGHT = 1936, 1216
WIDTH, HEIGHT = 1200, 110
WIDTH = WIDTH & ~7
HEIGHT = HEIGHT & ~1
pos_x = ((SENSOR_WIDTH - WIDTH) // 2) & ~1
pos_y = ((SENSOR_HEIGHT - HEIGHT) // 2) & ~1

# ============================================================

def load_config():
    global LINE_X
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r") as f:
                content = f.read().strip()
                if content:
                    LINE_X = sorted([int(x) for x in content.split(",")])
        except:
            pass

def save_config():
    try:
        with open(CONFIG_FILE, "w") as f:
            f.write(",".join(map(str, sorted(LINE_X))))
        print("💾 Конфиг линий сохранён")
    except:
        print("❌ Ошибка сохранения конфига")

def on_change(val):
    pass

def mouse_event(event, x, y, flags, param):
    if event == cv2.EVENT_LBUTTONDOWN:
        distances = [abs(x - lx) for lx in LINE_X]
        idx = distances.index(min(distances))
        LINE_X[idx] = x
        LINE_X.sort()
        print(f"→ Линия {idx} перемещена на x = {x}")

def main():
    load_config()
    if not os.path.exists(SAVE_PATH):
        os.makedirs(SAVE_PATH)

    model = YOLO(MODEL_PATH, task='classify')

    h_cam = ueye.HIDS(0)
    mem_ptr = ueye.c_mem_p()
    mem_id = ueye.int()

    try:
        ueye.is_InitCamera(h_cam, None)
        ueye.is_StopLiveVideo(h_cam, ueye.IS_WAIT)

        rect_aoi = ueye.IS_RECT()
        rect_aoi.s32X = ueye.int(pos_x)
        rect_aoi.s32Y = ueye.int(pos_y)
        rect_aoi.s32Width = ueye.int(WIDTH)
        rect_aoi.s32Height = ueye.int(HEIGHT)
        ueye.is_AOI(h_cam, ueye.IS_AOI_IMAGE_SET_AOI, rect_aoi, ueye.sizeof(rect_aoi))

        ueye.is_SetColorMode(h_cam, ueye.IS_CM_SENSOR_RAW8)
        ueye.is_AllocImageMem(h_cam, WIDTH, HEIGHT, 8, mem_ptr, mem_id)
        ueye.is_SetImageMem(h_cam, mem_ptr, mem_id)
        ueye.is_CaptureVideo(h_cam, ueye.IS_DONT_WAIT)

        win_name = 'picoCam - Row Inspection'
        cv2.namedWindow(win_name, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(win_name, 1300, 550)
        cv2.setMouseCallback(win_name, mouse_event)

        # Трекбары
        cv2.createTrackbar('Gain', win_name, DEFAULT_GAIN, 100, on_change)
        cv2.createTrackbar('Exposure', win_name, DEFAULT_EXPOSURE, 200, on_change)
        cv2.createTrackbar('FPS', win_name, DEFAULT_FPS, 100, on_change)
        cv2.createTrackbar('Delay(x0.01s)', win_name, DEFAULT_DELAY, 100, on_change)
        cv2.setTrackbarMin('Delay(x0.01s)', win_name, 5)
        cv2.createTrackbar('Conf (%)', win_name, DEFAULT_CONF, 100, on_change)
        cv2.createTrackbar('Margin (%)', win_name, DEFAULT_MARGIN, 30, on_change)
        cv2.setTrackbarMin('Margin (%)', win_name, 1)

        yes_buffer = deque(maxlen=6)
        no_buffer = deque(maxlen=8)
        CONFIRM_YES = 4
        CONFIRM_NO = 6

        total_rows = 0
        last_detection_time = 0
        is_row_active = False
        prev_time = time.perf_counter()

        while True:
            # Чтение параметров с трекбаров
            g_val = cv2.getTrackbarPos('Gain', win_name)
            e_val = max(1, cv2.getTrackbarPos('Exposure', win_name))
            f_val = max(1, cv2.getTrackbarPos('FPS', win_name))
            delay_sec = cv2.getTrackbarPos('Delay(x0.01s)', win_name) / 100.0
            conf_threshold = cv2.getTrackbarPos('Conf (%)', win_name) / 100.0
            MIN_MARGIN = cv2.getTrackbarPos('Margin (%)', win_name) / 100.0

            # Настройки камеры
            ueye.is_SetHardwareGain(h_cam, g_val, ueye.IS_IGNORE_PARAMETER,
                                    ueye.IS_IGNORE_PARAMETER, ueye.IS_IGNORE_PARAMETER)
            ueye.is_Exposure(h_cam, ueye.IS_EXPOSURE_CMD_SET_EXPOSURE, ueye.double(e_val), 8)
            ueye.is_SetFrameRate(h_cam, ueye.double(f_val), ueye.double())

            # Получение кадра
            data = ueye.get_data(mem_ptr, WIDTH, HEIGHT, 8, WIDTH, copy=True)
            if data is None:
                continue

            raw_frame = np.frombuffer(data, dtype=np.uint8).reshape((HEIGHT, WIDTH))
            color_frame = cv2.cvtColor(raw_frame, cv2.COLOR_BayerRG2BGR)

            # Классификация всего кадра для определения триггера
            results = model.predict(color_frame, imgsz=224, verbose=False)[0]
            probs = results.probs.data.cpu().numpy()
            names = results.names

            # Получаем вероятности триггер-классов
            idx_yes = next((k for k, v in names.items() if v == TRIGGER_YES), None)
            idx_no = next((k for k, v in names.items() if v == TRIGGER_NO), None)

            p_yes = float(probs[idx_yes]) if idx_yes is not None else 0.0
            p_no = float(probs[idx_no]) if idx_no is not None else 0.0

            is_yes = (p_yes >= conf_threshold) and (p_yes - p_no >= MIN_MARGIN)
            is_no_high_conf = (p_no >= 0.70) and (p_no - p_yes >= MIN_MARGIN)

            yes_buffer.append(is_yes)
            no_buffer.append(is_no_high_conf)

            yes_confirmed = sum(yes_buffer) >= CONFIRM_YES
            no_confirmed = sum(no_buffer) >= CONFIRM_NO

            current_time = time.time()

            # === Обработка золотого кадра ===
            if yes_confirmed and not is_row_active:
                if (current_time - last_detection_time) > delay_sec:
                    total_rows += 1
                    is_row_active = True
                    last_detection_time = current_time

                    print(f"\n✅ РЯД #{total_rows:04d} СОХРАНЁН  |  p_yes={p_yes:.4f}  p_no={p_no:.4f}")

                    # === Анализ содержимого ячеек ===
                    row_report = []
                    # Для 12 линий имеем 11 промежутков. Инспекция ячеек: 
                    for i in range(0, 11): 
                        if i == 5: # Между 6-й и 7-й линией (индекс 5) пустая зона
                            continue

                        x1, x2 = LINE_X[i], LINE_X[i + 1]
                        if x2 - x1 < 10:
                            row_report.append("?")
                            continue

                        cell = color_frame[:, x1:x2]
                        cell_res = model.predict(cell, imgsz=224, verbose=False)[0]

                        cell_top_idx = cell_res.probs.top1
                        cls_name = cell_res.names[cell_top_idx]
                        val = MAP_CLASSES.get(cls_name, "0")

                        row_report.append(val)

                    print(f"📦 РЯД {total_rows:04d} | {' | '.join(row_report)}")

            if no_confirmed and is_row_active:
                is_row_active = False
                print("--- Просвет между рядами ---\n")

            # === Отображение на экране ===
            top_cls = names[results.probs.top1]
            top_conf = results.probs.top1conf.item()

            text_color = (0, 255, 0) if is_row_active else (255, 255, 255)
            label = f"ROWS: {total_rows} | {top_cls} ({top_conf:.3f}) | THR:{conf_threshold:.2f} | Margin:{MIN_MARGIN:.2f}"
            
            cv2.rectangle(color_frame, (0, 0), (620, 28), (0, 0, 0), -1)
            cv2.putText(color_frame, label, (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.52, text_color, 2)

            # Линии зон
            for lx in LINE_X:
                cv2.line(color_frame, (lx, 0), (lx, HEIGHT), (0, 255, 0), 1)

            cv2.imshow(win_name, color_frame)

            # Контроль FPS
            target = 1.0 / f_val
            while (time.perf_counter() - prev_time) < target:
                time.sleep(0.001)
            prev_time = time.perf_counter()

            cv2.setWindowTitle(win_name, f"FPS: {f_val} | TOTAL ROWS: {total_rows}")

            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('s'):
                save_config()

    except Exception:
        traceback.print_exc()
    finally:
        ueye.is_ExitCamera(h_cam)
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()