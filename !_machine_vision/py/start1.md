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


py -3.11 train_bottles.py

#### 
py -3.11

from ultralytics import YOLO
model = YOLO(r"C:\Users\umdom\source\repos\RtspTest\runs\classify\train2\weights\best.pt")
success = model.export(format="onnx", imgsz=224, opset=17, simplify=True)


create file best.onnx
