C:\Windows\System32>py --version
Python 3.14.0

C:\Windows\System32>py -0
-V:3.14 *        Python 3.14.0
-V:3.11          Python 3.11 (64-bit)

C:\Windows\System32>py -0p
-V:3.14 *        C:\Users\umdom\AppData\Local\Python\pythoncore-3.14-64\python.exe
-V:3.11          C:\Users\umdom\AppData\Local\Programs\Python\Python311\python.exe


py -3.11 -m pip install --upgrade pip
py -3.11 -m pip install ultralytics


```
from ultralytics import YOLO

# Можно взять yolov8n-cls.pt (самая лёгкая и быстрая)
# Или yolov8s-cls.pt / yolov11n-cls.pt для лучшей точности
model = YOLO("yolov8n-cls.pt")

results = model.train(
data   = r"C:\Users\umdom\source\repos\RtspTest\dataset-bottles",
epochs = 50,
imgsz  = 224,
batch  = 8,           # уменьшил, т.к. датасет маленький — меньше памяти
# patience=15,        # раскомментировать, если хочешь авто-остановку
# device='cpu',       # явно cpu, если нет нормальной видеокарты
# или device=0 для GPU, если есть NVIDIA + CUDA
)

```

```
from ultralytics import YOLO

# === САМЫЙ ЛУЧШИЙ ВАРИАНТ ===
model = YOLO("yolo26n-cls.pt")      # самый быстрый и лёгкий
# model = YOLO("yolo26s-cls.pt")    # чуть точнее, но медленнее и тяжелее
# model = YOLO("yolo26m-cls.pt")    # если у тебя мощная видеокарта и хочешь максимальную точность

results = model.train(
    data=r"C:\_GIT\RtspTest\dataset-bottles",   # путь к твоему датасету
    epochs=100,                                 # увеличил до 100 (с early stopping)
    imgsz=224,
    batch=16,                                   # можно 32, если хватает VRAM
    patience=20,                                # ранняя остановка
    device=0,                                   # 0 = GPU, 'cpu' или None
    optimizer='auto',
    amp=True,                                   # автоматический mixed precision
    # augment=True,                             # можно оставить по умолчанию
    name='yolo26n_cls_bottles'
)

print("Обучение завершено! Лучшая модель:", results.best)
```




C:\Users\user\AppData\Local\Programs\Python\Python314\python.exe -m pip install ultralytics

C:\_GIT\RtspTest
py -3.11 train_bottles.py
py -3.14 train_bottles.py

#### 
py -3.14
>>>
from ultralytics import YOLO
model = YOLO(r"C:\_GIT\RtspTest\runs\classify\train\weights\best.pt")
success = model.export(format="onnx", imgsz=224, opset=17, simplify=True)

```
yolo export model=runs/classify/train/weights/best.pt format=onnx imgsz=224 opset=17 simplify=True half=False
```
create file best.onnx
