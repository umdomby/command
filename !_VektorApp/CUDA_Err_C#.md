AppendExecutionProvider_CUDA(0) падает с ошибкой:
Failed to load shared library
MakeSessionOptionWithCudaProvider(0) тоже падает с той же ошибкой.
Программа переключается на CPU и работает (warmup 25 мс — это типично для CPU).

Почему так происходит
Официальный пакет Microsoft.ML.OnnxRuntime.Gpu 1.24.4, который стоит у тебя, не содержит поддержку архитектуры Blackwell (sm_120) — твоей RTX 5060.
Он собран без sm_120 в CUDA kernels, поэтому не может загрузить CUDA-провайдер, хотя CUDA 13.2 + cuDNN у тебя стоят правильно.
В Python (onnxruntime-gpu) это работает, потому что там используется другая сборка/механизм.
Самое быстрое рабочее решение на апрель 2026
Нужно заменить нативные DLL из кастомной сборки ONNX Runtime с поддержкой Blackwell (sm_120) + CUDA 13.0/13.2.
Рекомендуемая сборка (самая популярная сейчас):

Перейди по ссылке:
https://huggingface.co/ussoewwin/onnxruntime-gpu-1.24.0
Скачай файл (обычно это zip или папка с lib / runtimes).
Распакуй и скопируй все .dll файлы из папки runtimes\win-x64\native (или просто из главной папки) в твою папку:textC:\Users\user\source\repos\CUDA\CUDA\bin\Debug\net8.0-windows\Замени существующие файлы:
onnxruntime.dll
onnxruntime_providers_cuda.dll
onnxruntime_providers_shared.dll
и все остальные onnxruntime_*

Перезапусти проект (F5).

После этого в логе должно появиться:
✅ CUDAExecutionProvider успешно добавлен
Если не хочешь скачивать с HuggingFace
Можно попробовать ночную сборку от Microsoft для CUDA 13:
Bash# В PowerShell / cmd (но это для Python, для C# проще скачать готовые DLL)
Но для C# проще всего именно кастомные DLL с HF.
Что сделать прямо сейчас
Скачай кастомную сборку по ссылке выше → замени DLL → запусти и пришли новый вывод из окна "Вывод".