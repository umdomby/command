cd "C:\Users\user\Documents\NEW"
yolo classify train data=. model=yolo11n-cls.pt epochs=10 imgsz=224 batch=8 project=. name=train exist_ok=True device=cpu