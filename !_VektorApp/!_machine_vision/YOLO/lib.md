1. Полностью кастомные файлы
picoCam-303C.exe — главный исполняемый файл твоего приложения.
picoCam-303C.pdb — отладочные символы (debug info) для твоего .exe.
config_default.json — конфигурационный файл проекта (настройки камеры, модели, параметров и т.д.).
img.ico — иконка приложения.

2. Библиотеки, которые почти всегда кастомные или сильно модифицированные под проект
cvextern.dll — это Emgu CV (C#/.NET wrapper для OpenCV). Она собирается/копируется под конкретную сборку проекта. Часто содержит кастомные компиляции OpenCV.
uEyeDotNet.dll — официальная .NET-библиотека от IDS Imaging (uEye камеры). Используется именно для работы с твоей камерой picoCam-303C (или аналогичной IDS).

3. AI/ML-стек (частично кастомный)
LibTorchSharp.dll — биндинги TorchSharp (PyTorch для .NET). Обычно тянется из NuGet, но версия и CUDA-поддержка часто подбираются под проект.
Microsoft.ML.OnnxRuntime.dll
onnxruntime.dll
onnxruntime_providers_cuda.dll
onnxruntime_providers_shared.dll — ONNX Runtime + CUDA-провайдер
cublas64_13.dll, cublasLt64_13.dll, cudnn64_9.dll — NVIDIA CUDA/cuDNN. Стандартные, но версия 13 именно под твою карту и модель.

— Стандартные зависимости

Все msvcp140*, vcruntime140*, concrt140.dll — Visual C++ Redistributable 2015–2019.
libSkiaSharp.dll — SkiaSharp (графика, рендеринг).
libusb-1.0.dll — стандартная libusb.
opencv_videoio_ffmpeg4120_64.dll — OpenCV FFMPEG backend.
zlibwapi.lib — (немного странно видеть .lib в publish, обычно .dll).

Вывод под анализ ИИ:
Это .NET-приложение для машинного зрения на базе:
Камера IDS uEye (uEyeDotNet.dll)
ONNX Runtime + CUDA (инференс нейросетей YOLO)
Emgu CV (OpenCV) для обработки изображения
TorchSharp (запасной/дополнительный PyTorch)
SkiaSharp для UI/рендеринга

### onnxruntime.dll - то что я собрал
RTX 5060 (Blackwell, compute capability sm_120) на момент твоей сборки ещё не имела полноценной официальной поддержки в предсобранных пакетах ONNX Runtime.

Официальные onnxruntime-gpu из PyPI / NuGet долгое время поддерживали только до Ada Lovelace (sm_89).
Для Blackwell часто возникала ошибка cudaErrorNoKernelImageForDevice.

собрать onnxruntime.dll (и связанные провайдеры) под RTX 5060 (Blackwell, sm_120) + CUDA 13 — довольно сложно, особенно в первый раз. Это не "просто нажать кнопку".
Что делает эта кастомная сборка?
onnxruntime.dll — это ядро ONNX Runtime. Оно:

Загружает ONNX-модели (например, твою YOLO).
Выполняет инференс (forward pass).
Через CUDA Execution Provider (onnxruntime_providers_cuda.dll) отправляет вычисления на GPU.
Поддерживает оптимизации: fused kernels, Tensor Cores, graph optimizations, memory planning и т.д.

Кастомная сборка нужна, чтобы включить архитектуру sm_120 (Blackwell), которой в официальных бинарниках на тот момент не было. Без этого возникает ошибка cudaErrorNoKernelImageForDevice.
Сложность сборки
Уровень: Средний/Высокий (для разработчика).
Время: 1–4 часа в первый раз + возможные баги.
Проблемы, с которыми сталкиваются почти все:

Огромный объём исходников (~2–3 ГБ после субмодулей).
Требует много RAM (рекомендуется 32+ ГБ).
Долгая компиляция (30–90 минут на мощном ПК).
Конфликты версий CUDA / cuDNN / Visual Studio.
Иногда нужно патчить код.

Основные шаги сборки (Windows)

Установи prerequisites:
CUDA Toolkit 13.0 (или 13.x)
cuDNN 9.x (соответствующей версии)
Visual Studio 2022 (с C++ workload)
CMake 3.26+
Git
Python (для скриптов)

PS - sm_120 в стандартных предсобранных пакетах ONNX Runtime (PyPI) пока нет