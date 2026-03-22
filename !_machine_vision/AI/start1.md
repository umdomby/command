https://roboflow.com
https://app.roboflow.com/join/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3b3Jrc3BhY2VJZCI6ImRGMGpjMlo0VThoUUFSTDZ0aVVDc0g2M1JzQzMiLCJyb2xlIjoib3duZXIiLCJpbnZpdGVyIjoidW1kb20yQGdtYWlsLmNvbSIsImlhdCI6MTc3NDE3OTg4Nn0.W21wREljfqgBYnONNJBaKFt4ZXg9cX0zqNuChor10s8
нужно добавить ИИ модель и создать ее и изменить код, мы запускаем RTSP поток видим аномалии показываем красный кружочек, все хорошо зеленый


dataset-bottles/
├── train/
│   ├── normal/          ← все или почти все "нормальные" бутылки
│   └── anomaly/         ← все или почти все "аномальные"
└── val/                 ← хотя бы по 1–5 картинок в каждом классе (очень желательно)
├── normal/
└── anomaly/


Самый быстрый и надёжный способ исправить (рекомендую именно этот)

Открой Параметры Windows → Приложения → Дополнительные возможности приложений (или "Расширенные параметры приложений")
→ Псевдонимы выполнения приложений (App execution aliases)
(в поиске Windows набери: "псевдонимы выполнения" или "manage app execution aliases")
Найди в списке две строки:
python.exe
python3.exe

Выключи оба переключателя (поставь в OFF).
Это удалит/отключит те самые заглушки в папке WindowsApps.



from ultralytics import YOLO

model = YOLO("yolov8n-cls.pt")           # или s/m/l в зависимости от желаемой точности
model.train(
data   = r"C:\Users\umdom\source\repos\RtspTest\dataset-bottles",
epochs = 50,
imgsz  = 224,
batch  = 16,
# patience=20,          # ранняя остановка, если нет улучшений
# device=0,             # если есть GPU
)