использует библиотеку Albumentations — это золотой стандарт для подготовки данных в компьютерном зрении. 
Она умеет менять яркость, контраст и вращать изображения, сохраняя их качество.


```
import cv2
import os
import numpy as np
import random

def rotate_image(image, angle):
    """Вращение изображения на произвольный угол с сохранением размера."""
    height, width = image.shape[:2]
    center = (width // 2, height // 2)
    matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    # Используем BORDER_REPLICATE или BORDER_CONSTANT, чтобы края не были черными
    rotated = cv2.warpAffine(image, matrix, (width, height), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, value=(0,0,0,0))
    return rotated

def apply_light_effects(image):
    """Случайное изменение яркости и контраста."""
    alpha = random.uniform(0.8, 1.2) # Контраст
    beta = random.randint(-20, 20)    # Яркость
    adjusted = cv2.convertScaleAbs(image, alpha=alpha, beta=beta)
    return adjusted

def main():
    base_paths = [
        r"C:\_VIDEO\picoCam-303C-I2D303C-RCA11-BLISTER\png\empty",
        r"C:\_VIDEO\picoCam-303C-I2D303C-RCA11-BLISTER\png\tablet_g_no",
        r"C:\_VIDEO\picoCam-303C-I2D303C-RCA11-BLISTER\png\tablet_g_od",
        r"C:\_VIDEO\picoCam-303C-I2D303C-RCA11-BLISTER\png\tablet_g_ok",
        r"C:\_VIDEO\picoCam-303C-I2D303C-RCA11-BLISTER\png\tablet_w_no",
        r"C:\_VIDEO\picoCam-303C-I2D303C-RCA11-BLISTER\png\tablet_w_od",
        r"C:\_VIDEO\picoCam-303C-I2D303C-RCA11-BLISTER\png\tablet_w_ok"
    ]

    total_simulations = 30
    angle_step = 360 / total_simulations

    print("--- YOLO11 Simulation: Full 360° Rotation ---")
    input("Нажмите ENTER для запуска генерации...")

    for folder in base_paths:
        if not os.path.exists(folder):
            print(f"⚠️ Пропуск (папка не найдена): {folder}")
            continue

        # Берем только оригиналы (не аугментированные ранее)
        images = [f for f in os.listdir(folder) if f.lower().endswith(('.png', '.jpg')) 
                  and "_step_" not in f]

        if not images:
            print(f"📁 В {os.path.basename(folder)} пусто.")
            continue

        print(f"🔄 Обработка {os.path.basename(folder)}...")

        for img_name in images:
            img_path = os.path.join(folder, img_name)
            # Читаем с альфа-каналом (IMREAD_UNCHANGED) для PNG объектов
            image = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
            if image is None: continue

            name_only, ext = os.path.splitext(img_name)

            for i in range(total_simulations):
                current_angle = i * angle_step
                
                # 1. Вращаем
                rotated = rotate_image(image, current_angle)
                
                # 2. Меняем свет (только для RGB каналов, не трогая прозрачность)
                if rotated.shape[2] == 4: # Если есть альфа-канал
                    rgb = rotated[:, :, :3]
                    alpha_channel = rotated[:, :, 3]
                    rgb_adjusted = apply_light_effects(rgb)
                    final_img = cv2.merge([rgb_adjusted, alpha_channel])
                else:
                    final_img = apply_light_effects(rotated)

                # 3. Сохраняем
                save_name = f"{name_only}_step_{i}{ext}"
                cv2.imwrite(os.path.join(folder, save_name), final_img)

    print("\n✅ Генерация 360° завершена. Теперь у вас есть по 30 вариаций каждого фото.")

if __name__ == "__main__":
    main()
```