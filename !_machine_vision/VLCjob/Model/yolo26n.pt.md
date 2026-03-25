упавшая бутылка создаёт характерное тёмное пятно с контуром, в которое другие бутылки не могут встать (пустое место + неправильная форма/тень). Это классическая локальная аномалия на паллете/конвейере.
Текущая модель (классификация всего кадра) плохо справляется с такой задачей — она «смазывает» одну упавшую бутылку среди сотен нормальных. Тайлинг (4×4), который я дал раньше, уже лучше, но всё равно не идеально.
Самое правильное и точное решение в 2026 году
Перейди с classification на object detection (YOLO26n / YOLO26s).
Модель будет рисовать bounding box именно вокруг упавшей бутылки / пятна и выдавать класс, например:

fallen_bottle
missing_position
anomaly_spot

Это стандартный подход для инспекции бутылок на производстве (conveyor/pallet inspection).
Шаг 1: Подготовка датасета (самое важное)

Собери 300–800 фотографий паллет/конвейера.
На каждой фото, где есть упавшая бутылка, нарисуй bounding box вокруг пятна/упавшей бутылки.
Классы (минимум 2):
normal_bottle (опционально, если хочешь считать все стоящие)
fallen или anomaly (главный класс)

Используй Roboflow или LabelImg → экспорт в YOLO format.

Шаг 2: Обучение (самый лучший скрипт на сегодня)
Pythonfrom ultralytics import YOLO

# Лучшая модель 2026 года для такой задачи
model = YOLO("yolo26n.pt")      # или "yolo26s.pt" для большей точности

results = model.train(
data="dataset.yaml",        # твой yaml с путями к train/val
epochs=120,
imgsz=640,                  # для detection лучше 640 чем 224
batch=16,
patience=25,
device=0,                   # GPU
name="fallen_bottle_detector",
augment=True
)
После обучения экспортируй:
Pythonmodel = YOLO("runs/detect/fallen_bottle_detector/weights/best.pt")
model.export(format="onnx", imgsz=640, opset=17, simplify=True, half=False)
Шаг 3: Новый C# код для детекции (полная замена DetectAnomaly)
Замени весь метод DetectAnomaly и добавь поддержку нескольких боксов:
C#private bool DetectAndDrawFallenBottles(Mat frame)
{
if (net == null) return false;

    try
    {
        // Для detection рекомендуется размер 640x640
        using var blob = CvDnn.BlobFromImage(frame, 
            scaleFactor: 1.0 / 255.0, 
            size: new Size(640, 640), 
            mean: new Scalar(0, 0, 0), 
            swapRB: true, 
            crop: false);

        lock (net)
        {
            net.SetInput(blob);
            using var output = net.Forward();   // для YOLO detection выходов обычно несколько

            // YOLO detection post-processing (упрощённый вариант)
            output.GetArray(out float[] detections);   // нужно правильно парсить

            // Лучше использовать готовый YOLO post-process от Ultralytics или написать NMS
            // Пока простой вариант — предполагаем, что модель экспортирована с одним выходом
            // (рекомендую использовать ONNX Runtime вместо чистого OpenCvSharp для detection — он проще)

            bool hasFallen = false;
            float maxConf = 0f;

            // Пример парсинга (адаптируй под свою модель — обычно 25200 x (5 + num_classes))
            // Здесь упрощённо — покажи вывод detections.Length, если не работает

            // Временный заглушка — замени на реальный парсинг
            // for each detection...
            // if (class == fallen && confidence > 0.5)
            // {
            //     Cv2.Rectangle(frame, rect, Scalar.Red, 3);
            //     hasFallen = true;
            //     maxConf = Math.Max(maxConf, confidence);
            // }

            currentConfidence = maxConf * 100f;
            return hasFallen;
        }
    }
    catch (Exception ex)
    {
        Debug.WriteLine("Ошибка детекции: " + ex.Message);
        return false;
    }
}
Важно: Для полноценного YOLO detection в C# проще и надёжнее использовать ONNX Runtime вместо OpenCvSharp.Dnn (OpenCV иногда плохо парсит YOLO outputs).
Хочешь — я дам тебе готовый вариант на ONNX Runtime (быстрее и проще с NMS).
Что делать прямо сейчас?

Попробуй тайлинг 4x4 из предыдущего сообщения — он уже должен лучше находить «пятно».
Если не хватает точности — переходи на detection (рекомендую сильно).

Скажи:

Какой размер кадров приходит с RTSP (640x480, 1920x1080 и т.д.)?
Сколько примерно примеров упавших бутылок у тебя уже есть?
Хочешь полный код на ONNX Runtime + YOLO detection (самый удобный вариант)?

Тогда я сразу дам тебе готовый проектный код без головной боли с парсингом.