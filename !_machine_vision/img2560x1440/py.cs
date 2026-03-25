import cv2
import time
import os

rtsp_url = "rtsp://127.0.0.1:8554/mystream"   # твой поток

cap = cv2.VideoCapture(rtsp_url)

# Важно: просим оригинальное разрешение
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 2560)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1440)

save_folder = "dataset/images/train"
os.makedirs(save_folder, exist_ok=True)

frame_count = 0

print("Начинаю захват кадров в 2560x1440... (нажми Ctrl+C чтобы остановить)")

while True:
    ret, frame = cap.read()
    if not ret:
        print("Не удалось прочитать кадр, переподключаюсь...")
        time.sleep(1)
        continue

    # Сохраняем в полном разрешении
    filename = os.path.join(save_folder, f"frame_{frame_count:06d}.jpg")
    cv2.imwrite(filename, frame, [cv2.IMWRITE_JPEG_QUALITY, 95])

    print(f"Сохранён кадр {frame_count} — 2560x1440")
    frame_count += 1

    time.sleep(1.0)        # раз в секунду (можно 1.5–2.0, чтобы не было слишком много одинаковых кадров)

cap.release()


$py -3.11 scrypt.py