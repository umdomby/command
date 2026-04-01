import cv2
import numpy as np
from pyueye import ueye
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
    # ---------------------

    SENSOR_WIDTH, SENSOR_HEIGHT = 1936, 1216
    resolutions = {
        "1": (640, 480), "2": (800, 600), "3": (1024, 768),
        "4": (1280, 720), "5": (1920, 1080), "6": (1936, 1216)
    }

    print("\n--- picoCam-303C: Настройка ---")
    for k, v in resolutions.items():
        suffix = " (Full HD)" if k == "5" else (" (NATIVE)" if k == "6" else "")
        print(f"{k} - {v[0]}x{v[1]}{suffix}")
    print("7 - Пользовательское разрешение (Custom)")

    res_choice = input("Ваш выбор (1-7) [6]: ") or "6"

    if res_choice == "7":
        try:
            custom_w = int(input(f"Введите ширину (макс. {SENSOR_WIDTH}): "))
            custom_h = int(input(f"Введите высоту (макс. {SENSOR_HEIGHT}): "))

            width = (custom_w & ~7)
            height = (custom_h & ~1)

            if width < 32: width = 32
            if height < 32: height = 32

            width = min(width, SENSOR_WIDTH)
            height = min(height, SENSOR_HEIGHT)
            print(f"📏 Скорректировано до: {width}x{height} (кратность 8)")
        except ValueError:
            print("Ошибка ввода, выбрано нативное разрешение.")
            width, height = 1936, 1216
    else:
        width, height = resolutions.get(res_choice, (1936, 1216))

    width = width & ~1
    height = height & ~1
    pos_x = ((SENSOR_WIDTH - width) // 2) & ~1
    pos_y = ((SENSOR_HEIGHT - height) // 2) & ~1

    h_cam = ueye.HIDS(0)
    mem_ptr = ueye.c_mem_p()
    mem_id = ueye.int()

    save_dir = r"C:\_VIDEO\picoCam-303C-I2D303C-RCA11-BLISTER\png"
    podlojka_dir = r"C:\_VIDEO\picoCam-303C-I2D303C-RCA11-BLISTER\pngp"
    for d in [save_dir, podlojka_dir]:
        if not os.path.exists(d): os.makedirs(d)

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

        win_name = 'picoCam - LIVE'
        orig_win_name = 'ORIGINAL (1:1)'
        cv2.namedWindow(win_name, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(win_name, 480, 640)

        cv2.createTrackbar('Gain', win_name, DEFAULT_GAIN, 100, on_change)
        cv2.createTrackbar('Exposure', win_name, DEFAULT_EXPOSURE, 200, on_change)
        cv2.createTrackbar('FPS', win_name, DEFAULT_FPS, 100, on_change)
        cv2.createTrackbar('Thresh', win_name, DEFAULT_THRESH, 255, on_change)
        cv2.createTrackbar('Exp Load %', win_name, 0, 100, on_change)

        ueye.is_CaptureVideo(h_cam, ueye.IS_DONT_WAIT)

        print("\n" + "="*60)
        print("🚀 КАМЕРА ГОТОВА")
        print("S - Подложка | I - Объекты | F - Полный кадр | O - Оригинал | Q - Выход")
        print("В окне ORIGINAL: C - Выделить область мышкой")
        print(f"Разрешение: {width}x{height} (Центр: X={pos_x}, Y={pos_y})")
        print("="*60 + "\n")

        prev_time = time.perf_counter()
        show_original = False

        while True:
            g_val = cv2.getTrackbarPos('Gain', win_name)
            e_val = cv2.getTrackbarPos('Exposure', win_name) or 1
            f_val = cv2.getTrackbarPos('FPS', win_name) or 1
            t_val = cv2.getTrackbarPos('Thresh', win_name)

            ueye.is_SetHardwareGain(h_cam, g_val, ueye.IS_IGNORE_PARAMETER, ueye.IS_IGNORE_PARAMETER, ueye.IS_IGNORE_PARAMETER)
            ueye.is_Exposure(h_cam, ueye.IS_EXPOSURE_CMD_SET_EXPOSURE, ueye.double(e_val), 8)
            ueye.is_SetFrameRate(h_cam, ueye.double(f_val), ueye.double())

            max_exp = 1000.0 / f_val
            load_pct = int(min((e_val / max_exp) * 100, 100))
            cv2.setTrackbarPos('Exp Load %', win_name, load_pct)

            target_delay = 1.0 / f_val
            while (time.perf_counter() - prev_time) < target_delay:
                time.sleep(0.001)

            real_fps = 1.0 / (time.perf_counter() - prev_time)
            prev_time = time.perf_counter()

            data = ueye.get_data(mem_ptr, width, height, 8, width, copy=True)
            if data is not None:
                raw_frame = np.frombuffer(data, dtype=np.uint8).reshape((height, width))
                color_frame = cv2.cvtColor(raw_frame, cv2.COLOR_BayerRG2BGR)

                cv2.setWindowTitle(win_name, f"picoCam | Real FPS: {real_fps:.1f}")

                view_w = 960
                view_h = int(height * (960 / width))
                cv2.imshow(win_name, cv2.resize(color_frame, (view_w, view_h)))

                if show_original:
                    cv2.imshow(orig_win_name, color_frame)

                key = cv2.waitKey(1) & 0xFF

                if key in [ord('s'), ord('S'), 1099, 1067]:
                    cv2.imwrite(os.path.join(podlojka_dir, "podlojka.jpg"), color_frame)
                    print("🖼️ Подложка сохранена")

                if key in [ord('f'), ord('F'), 1072, 1040]:
                    ts_full = int(time.time())
                    fname = os.path.join(save_dir, f"full_frame_{ts_full}.png")
                    cv2.imwrite(fname, color_frame)
                    print(f"📸 Кадр сохранен: {fname}")

                if key in [ord('i'), ord('I'), 1096, 1064]:
                    gray = cv2.cvtColor(color_frame, cv2.COLOR_BGR2GRAY)
                    _, mask = cv2.threshold(gray, t_val, 255, cv2.THRESH_BINARY)
                    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                    saved = 0
                    ts = int(time.time())
                    for i, cnt in enumerate(contours):
                        if cv2.contourArea(cnt) > 300:
                            x, y, w_obj, h_obj = cv2.boundingRect(cnt)
                            roi_color = color_frame[y:y+h_obj, x:x+w_obj].copy()
                            obj_mask = np.zeros((h_obj, w_obj), dtype=np.uint8)
                            cv2.drawContours(obj_mask, [cnt - [x, y]], -1, 255, -1)
                            b, g, r = cv2.split(roi_color)
                            rgba = cv2.merge([b, g, r, obj_mask])
                            cv2.imwrite(os.path.join(save_dir, f"obj_{ts}_{i}.png"), rgba)
                            saved += 1
                    print(f"✅ Сохранено объектов: {saved}")

                if key in [ord('o'), ord('O'), 1097, 1065]:
                    if not show_original:
                        cv2.namedWindow(orig_win_name, cv2.WINDOW_AUTOSIZE)
                        show_original = True
                        print("📺 Оригинальное окно открыто")
                    else:
                        cv2.destroyWindow(orig_win_name)
                        show_original = False
                        print("📺 Оригинальное окно закрыто")

                # --- НОВЫЙ ФУНКЦИОНАЛ: ВЫДЕЛЕНИЕ ОБЛАСТИ МЫШКОЙ ---
                if show_original and key in [ord('c'), ord('C'), 1089, 1057]:
                    print("🖱️ Выделите область в окне ORIGINAL и нажмите ENTER (или ESC для отмены)")
                    roi = cv2.selectROI(orig_win_name, color_frame, fromCenter=False, showCrosshair=True)
                    x_roi, y_roi, w_roi, h_roi = roi
                    if w_roi > 0 and h_roi > 0:
                        crop = color_frame[y_roi:y_roi+h_roi, x_roi:x_roi+w_roi]
                        ts_crop = int(time.time())
                        crop_name = os.path.join(save_dir, f"manual_crop_{ts_crop}.png")
                        cv2.imwrite(crop_name, crop)
                        print(f"✂️ Область сохранена: {crop_name}")
                    else:
                        print("Отменено")

                if key == ord('q'): break

    except Exception:
        traceback.print_exc()
    finally:
        ueye.is_ExitCamera(h_cam)
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()