Введите в консоли: python --version
Если написало Python 3.12.x, значит, ты победил систему.

# Устанавливаем "двигатель" для RTX 5060
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124

# Устанавливаем саму YOLOv11
pip install ultralytics


Проверка (Момент истины)
python -c "import torch; print('---'); print('GPU ДОСТУПЕН:', torch.cuda.is_available()); print('КАРТА:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'НЕТ СВЯЗИ'); print('---')"


GPU ДОСТУПЕН: True
C:\Users\user\AppData\Local\Programs\Python\Python312\Lib\site-packages\torch\cuda\__init__.py:235: UserWarning:
NVIDIA GeForce RTX 5060 with CUDA capability sm_120 is not compatible with the current PyTorch installation.
The current PyTorch install supports CUDA capabilities sm_50 sm_60 sm_61 sm_70 sm_75 sm_80 sm_86 sm_90.
If you want to use the NVIDIA GeForce RTX 5060 GPU with PyTorch, please check the instructions at https://pytorch.org/get-started/locally/

warnings.warn(
КАРТА: NVIDIA GeForce RTX 5060


Ситуация понятная: твоя RTX 5060 (архитектура Blackwell, sm_120) настолько новая, что текущий стабильный PyTorch ее "официально" еще не знает. Но карта физически видна, и мы можем заставить ее работать через "хак" — эмуляцию.
Мы скажем системе: «Эй, считай, что эта карта — RTX 4090 (Lovelace/Ada)», и она начнет считать на тензорных ядрах без ошибок.
Исправленный скрипт для обучения YOLOv11
Я добавил в начало скрипта переменные окружения, которые отключают проверку совместимости и заставляют карту работать. Сохрани этот код в файл (например,

# Устанавливаем "двигатель" для RTX 5060
"C:\Users\user\AppData\Local\Programs\Python\Python312\python.exe" -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128
# Проверка
"C:\Users\user\AppData\Local\Programs\Python\Python312\python.exe" -c "import torch; print('CUDA Version:', torch.version.cuda); print('Карта:', torch.cuda.get_device_name(0)); print('Доступна:', torch.cuda.is_available())"