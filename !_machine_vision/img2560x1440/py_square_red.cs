import cv2
import numpy as np
import os
import time
import random

# ====================== НАСТРОЙКИ ======================
rtsp_url = "rtsp://127.0.0.1:8554/mystream"

# Как часто сохранять в val (0.25 = 25% кадров в валидацию)
VAL_RATIO = 0.25

# Минимальная площадь бокса (в пикселях), чтобы отсечь шум
MIN_AREA = 800

# =====================================================

# Создаём все нужные папки
base_dir = "dataset"
folders = [
    f"{base_dir}/images/train",
    f"{base_dir}/images/val",
    f"{base_dir}/labels/train",
    f"{base_dir}/labels/val"
]

for folder in folders:
    os.makedirs(folder, exist_ok=True)

cap = cv2.VideoCapture(rtsp_url)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 2560)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1440)

frame_count = 0
print("🚀 Авто-разметка запущена (красный прямоугольник = fallen)")
print(f"   → {int(VAL_RATIO*100)}% кадров будут автоматически идти в val\n")

try:
    while True:
        ret, frame = cap.read()
        if not ret:
            print("⚠️  Потеря соединения с RTSP, пытаюсь переподключиться...")
            time.sleep(3)
            cap = cv2.VideoCapture(rtsp_url)
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 2560)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1440)
            continue

        # Определяем, куда сохранять этот кадр
        is_val = random.random() < VAL_RATIO
        subfolder = "val" if is_val else "train"

        img_name = f"frame_{frame_count:06d}.jpg"
        img_path = os.path.join(base_dir, "images", subfolder, img_name)

        # Сохраняем изображение
        cv2.imwrite(img_path, frame, [cv2.IMWRITE_JPEG_QUALITY, 95])

        # === Авто-поиск красных прямоугольников ===
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

        # Улучшенные диапазоны для красного цвета
        lower1 = np.array([0,   80,  80])
        upper1 = np.array([10,  255, 255])
        lower2 = np.array([170, 80,  80])
        upper2 = np.array([180, 255, 255])

        mask1 = cv2.inRange(hsv, lower1, upper1)
        mask2 = cv2.inRange(hsv, lower2, upper2)
        mask = cv2.bitwise_or(mask1, mask2)

        # Немного сглаживаем маску
        mask = cv2.medianBlur(mask, 5)

        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        labels = []
        height, width = frame.shape[:2]

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < MIN_AREA:
                continue

            x, y, w, h = cv2.boundingRect(cnt)

            # Нормализуем в формат YOLO
            center_x = (x + w / 2) / width
            center_y = (y + h / 2) / height
            norm_w = w / width
            norm_h = h / height

            # Добавляем с запасом (чуть увеличиваем бокс)
            norm_w = min(norm_w * 1.08, 1.0)
            norm_h = min(norm_h * 1.08, 1.0)

            labels.append(f"0 {center_x:.6f} {center_y:.6f} {norm_w:.6f} {norm_h:.6f}")

        # Сохраняем .txt файл
        label_path = os.path.join(base_dir, "labels", subfolder, f"frame_{frame_count:06d}.txt")

        if labels:
            with open(label_path, 'w') as f:
                f.write('\n'.join(labels))
            print(f"✓ Кадр {frame_count:06d} → {subfolder} | Найдено упавших: {len(labels)}")
        else:
            # Создаём пустой .txt файл (важно для YOLO!)
            open(label_path, 'w').close()
            print(f"○ Кадр {frame_count:06d} → {subfolder} | Упавших не найдено")

        frame_count += 1

        time.sleep(1.0)   # Раз в секунду. Можно поставить 1.5 или 2.0

except KeyboardInterrupt:
    print(f"\n\n⛔ Захват остановлен пользователем. Всего сохранено кадров: {frame_count}")
except Exception as e:
    print(f"\n❌ Ошибка: {e}")
finally:
    cap.release()
    print("Камера освобождена.")