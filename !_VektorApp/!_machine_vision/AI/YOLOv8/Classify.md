Classify
from ultralytics import YOLO
import os

# 1. Создаем конфигурацию данных (путь к вашим папкам train/val)
dataset_path = r"C:\_VIDEO\model"

# 2. Загружаем предобученную модель (nano-версия самая быстрая)
model = YOLO('yolov8n.pt')

if __name__ == "__main__":
# 3. Обучаем модель.
# Если у вас в папках только вырезанные бутылки,
# модель научится узнавать их характерные черты.
model.train(
data='coco8.yaml', # Для полноценного обучения нужны .txt файлы,
epochs=50,         # но если вы просто хотите искать "похожее",
imgsz=640,         # можно дообучить на существующих данных.
project=r'C:\_VIDEO\runs',
name='bottle_model'
)