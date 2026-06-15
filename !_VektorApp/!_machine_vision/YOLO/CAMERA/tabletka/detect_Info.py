import cv2 # Библиотека компьютерного зрения для обработки кадров и GUI
import numpy as np # Библиотека для работы с массивами данных (изображениями)
from pyueye import ueye # SDK для работы с промышленными камерами IDS
from ultralytics import YOLO # Фреймворк для запуска нейросети YOLOv8
import traceback # Модуль для детального вывода ошибок при сбоях
import time # Модуль для работы с временными задержками и FPS
import os # Модуль для работы с файловой системой и путями
from collections import deque # Очередь с фиксированной длиной для сглаживания триггера

# ========================= НАСТРОЙКИ (КОНСТАНТЫ) =========================
SAVE_PATH = r"C:\_VIDEO\picoCam-303C-I2D303C-RCA11-BLISTER\png" # Папка проекта
MODEL_PATH = os.path.join(SAVE_PATH, "best.onnx") # Путь к файлу нейросети в формате ONNX
CONFIG_FILE = os.path.join(SAVE_PATH, "line.txt") # Файл, где хранятся координаты X для линий

# Названия классов, которые модель выдает для определения наличия/отсутствия ряда
TRIGGER_YES = "trigger_mark_yes" # Класс: метка обнаружена (начало ряда)
TRIGGER_NO = "trigger_mark_no"   # Класс: метки нет (пустое пространство)

# Начальные координаты X для вертикальных линий, разделяющих ячейки (12 линий = 11 зон)
LINE_X = [0, 109, 218, 327, 436, 545, 640, 749, 858, 967, 1076, 1200]

# Словарь для замены длинных имен классов на короткие символы для вывода в консоль
MAP_CLASSES = {
    "empty": "0",          # Пустая ячейка
    "tablet_g_no": "g_no", # Зеленая таблетка отсутствует
    "tablet_g_od": "g_od", # Зеленая таблетка с дефектом
    "tablet_g_ok": "g_ok", # Зеленая таблетка норма
    "tablet_w_no": "w_no", # Белая таблетка отсутствует
    "tablet_w_od": "w_od", # Белая таблетка с дефектом
    "tablet_w_ok": "w_ok"  # Белая таблетка норма
}

# Значения параметров по умолчанию для интерфейса
DEFAULT_GAIN = 0      # Усиление сигнала матрицы
DEFAULT_EXPOSURE = 9  # Время экспозиции (выдержка)
DEFAULT_FPS = 100     # Желаемая частота кадров
DEFAULT_DELAY = 5     # Задержка между срабатываниями (x0.01 сек)
DEFAULT_CONF = 55     # Порог уверенности нейросети в процентах
DEFAULT_MARGIN = 5    # Минимальный разрыв между вероятностями классов в процентах

# Геометрия сенсора и настройки окна захвата (Area of Interest)
SENSOR_WIDTH, SENSOR_HEIGHT = 1936, 1216
WIDTH, HEIGHT = 1200, 110 # Размер области сканирования (полоса над блистером)
WIDTH = WIDTH & ~7 # Выравнивание ширины кратно 8 (требование драйвера uEye)
HEIGHT = HEIGHT & ~1 # Выравнивание высоты кратно 2
pos_x = ((SENSOR_WIDTH - WIDTH) // 2) & ~1 # Центрирование по X
pos_y = ((SENSOR_HEIGHT - HEIGHT) // 2) & ~1 # Центрирование по Y

# ============================================================

def load_config():
    """Загружает сохраненные координаты линий из текстового файла"""
    global LINE_X
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r") as f:
                content = f.read().strip()
                if content:
                    # Читаем строку, разделяем по запятой, преобразуем в int и сортируем
                    LINE_X = sorted([int(x) for x in content.split(",")])
        except:
            pass

def save_config():
    """Сохраняет текущее положение линий в текстовый файл"""
    try:
        with open(CONFIG_FILE, "w") as f:
            f.write(",".join(map(str, sorted(LINE_X))))
        print("💾 Конфиг линий сохранён")
    except:
        print("❌ Ошибка сохранения конфига")

def on_change(val):
    """Пустая функция для callback-событий трекбаров OpenCV"""
    pass

def mouse_event(event, x, y, flags, param):
    """Обработчик событий мыши для перемещения линий на экране"""
    if event == cv2.EVENT_LBUTTONDOWN: # Если нажата левая кнопка мыши
        # Находим индекс линии, которая ближе всего к координате клика X
        distances = [abs(x - lx) for lx in LINE_X]
        idx = distances.index(min(distances))
        LINE_X[idx] = x # Присваиваем линии новую координату X
        LINE_X.sort() # Сортируем список, чтобы порядок линий не нарушался
        print(f"→ Линия {idx} перемещена на x = {x}")

def main():
    """Основная функция программы"""
    load_config() # Пытаемся загрузить настройки линий
    if not os.path.exists(SAVE_PATH):
        os.makedirs(SAVE_PATH) # Создаем папку, если её нет

    # Инициализация модели классификации YOLO
    model = YOLO(MODEL_PATH, task='classify')

    # Инициализация камеры
    h_cam = ueye.HIDS(0) # Получаем дескриптор камеры (0 - первая доступная)
    mem_ptr = ueye.c_mem_p() # Указатель на выделенную память для кадра
    mem_id = ueye.int() # Идентификатор области памяти

    try:
        ueye.is_InitCamera(h_cam, None) # Запуск камеры
        ueye.is_StopLiveVideo(h_cam, ueye.IS_WAIT) # Остановка видео для настройки параметров

        # Установка области интереса (AOI) — захватываем только нужную полосу
        rect_aoi = ueye.IS_RECT()
        rect_aoi.s32X = ueye.int(pos_x)
        rect_aoi.s32Y = ueye.int(pos_y)
        rect_aoi.s32Width = ueye.int(WIDTH)
        rect_aoi.s32Height = ueye.int(HEIGHT)
        ueye.is_AOI(h_cam, ueye.IS_AOI_IMAGE_SET_AOI, rect_aoi, ueye.sizeof(rect_aoi))

        # Настройка цветового режима и выделение памяти под буфер изображения
        ueye.is_SetColorMode(h_cam, ueye.IS_CM_SENSOR_RAW8)
        ueye.is_AllocImageMem(h_cam, WIDTH, HEIGHT, 8, mem_ptr, mem_id)
        ueye.is_SetImageMem(h_cam, mem_ptr, mem_id)
        ueye.is_CaptureVideo(h_cam, ueye.IS_DONT_WAIT) # Запуск захвата видео

        # Создание графического окна OpenCV
        win_name = 'picoCam - Row Inspection'
        cv2.namedWindow(win_name, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(win_name, 1300, 550)
        cv2.setMouseCallback(win_name, mouse_event) # Привязка событий мыши

        # Создание ползунков (трекбаров) для управления параметрами в реальном времени
        cv2.createTrackbar('Gain', win_name, DEFAULT_GAIN, 100, on_change)
        cv2.createTrackbar('Exposure', win_name, DEFAULT_EXPOSURE, 200, on_change)
        cv2.createTrackbar('FPS', win_name, DEFAULT_FPS, 100, on_change)
        cv2.createTrackbar('Delay(x0.01s)', win_name, DEFAULT_DELAY, 100, on_change)
        cv2.setTrackbarMin('Delay(x0.01s)', win_name, 5) # Минимум 0.05 сек
        cv2.createTrackbar('Conf (%)', win_name, DEFAULT_CONF, 100, on_change)
        cv2.createTrackbar('Margin (%)', win_name, DEFAULT_MARGIN, 30, on_change)
        cv2.setTrackbarMin('Margin (%)', win_name, 1)

        # Буферы для накопления результатов детекции (фильтрация ложных срабатываний)
        yes_buffer = deque(maxlen=6) # Память на последние 6 кадров для триггера "ДА"
        no_buffer = deque(maxlen=8)  # Память на последние 8 кадров для триггера "НЕТ"
        CONFIRM_YES = 4 # Нужно 4 кадра "ДА" из 6, чтобы считать ряд начавшимся
        CONFIRM_NO = 6  # Нужно 6 кадров "НЕТ" из 8, чтобы считать, что ряд закончился

        total_rows = 0 # Счетчик пройденных рядов
        last_detection_time = 0 # Время последней фиксации ряда
        is_row_active = False # Флаг текущего состояния (мы сейчас внутри ряда или в просвете)
        prev_time = time.perf_counter() # Время для замера дельты кадров

        while True:
            # Считывание значений с трекбаров интерфейса
            g_val = cv2.getTrackbarPos('Gain', win_name)
            e_val = max(1, cv2.getTrackbarPos('Exposure', win_name))
            f_val = max(1, cv2.getTrackbarPos('FPS', win_name))
            delay_sec = cv2.getTrackbarPos('Delay(x0.01s)', win_name) / 100.0
            conf_threshold = cv2.getTrackbarPos('Conf (%)', win_name) / 100.0
            MIN_MARGIN = cv2.getTrackbarPos('Margin (%)', win_name) / 100.0

            # Применение настроек камеры из трекбаров
            ueye.is_SetHardwareGain(h_cam, g_val, ueye.IS_IGNORE_PARAMETER,
                                    ueye.IS_IGNORE_PARAMETER, ueye.IS_IGNORE_PARAMETER)
            ueye.is_Exposure(h_cam, ueye.IS_EXPOSURE_CMD_SET_EXPOSURE, ueye.double(e_val), 8)
            ueye.is_SetFrameRate(h_cam, ueye.double(f_val), ueye.double())

            # Захват данных кадра из памяти камеры
            data = ueye.get_data(mem_ptr, WIDTH, HEIGHT, 8, WIDTH, copy=True)
            if data is None:
                continue

            # Превращение сырых данных в массив numpy и конвертация в цвет BGR (Bayer -> BGR)
            raw_frame = np.frombuffer(data, dtype=np.uint8).reshape((HEIGHT, WIDTH))
            color_frame = cv2.cvtColor(raw_frame, cv2.COLOR_BayerRG2BGR)

            # --- Анализ кадра нейросетью ---
            results = model.predict(color_frame, imgsz=224, verbose=False)[0]
            probs = results.probs.data.cpu().numpy() # Массив вероятностей всех классов
            names = results.names # Список имен классов модели

            # Определяем вероятности для триггер-классов
            idx_yes = next((k for k, v in names.items() if v == TRIGGER_YES), None)
            idx_no = next((k for k, v in names.items() if v == TRIGGER_NO), None)

            p_yes = float(probs[idx_yes]) if idx_yes is not None else 0.0
            p_no = float(probs[idx_no]) if idx_no is not None else 0.0

            # Условия детекции: уверенность выше порога и отрыв от конкурента больше Margin
            is_yes = (p_yes >= conf_threshold) and (p_yes - p_no >= MIN_MARGIN)
            is_no_high_conf = (p_no >= 0.70) and (p_no - p_yes >= MIN_MARGIN)

            # Добавляем результаты кадра в буфер
            yes_buffer.append(is_yes)
            no_buffer.append(is_no_high_conf)

            # Проверяем, подтверждено ли состояние накопленной статистикой
            yes_confirmed = sum(yes_buffer) >= CONFIRM_YES
            no_confirmed = sum(no_buffer) >= CONFIRM_NO

            current_time = time.time()

            # === ЛОГИКА ОБРАБОТКИ РЯДА (ЗОЛОТОЙ КАДР) ===
            if yes_confirmed and not is_row_active:
                # Если сработал триггер и мы еще не считаем этот ряд (проверка задержки)
                if (current_time - last_detection_time) > delay_sec:
                    total_rows += 1
                    is_row_active = True
                    last_detection_time = current_time

                    print(f"\n✅ РЯД #{total_rows:04d} СОХРАНЁН  |  p_yes={p_yes:.4f}  p_no={p_no:.4f}")

                    # === Анализ содержимого ячеек (нарезаем кадр по линиям LINE_X) ===
                    row_report = []
                    for i in range(0, 11):
                        if i == 5: # Между 6-й и 7-й линией (индекс 5) пустая зона (середина блистера)
                            continue

                        x1, x2 = LINE_X[i], LINE_X[i + 1] # Границы ячейки
                        if x2 - x1 < 10: # Если зона слишком узкая, пропускаем
                            row_report.append("?")
                            continue

                        # Обрезаем кадр по границам ячейки
                        cell = color_frame[:, x1:x2]
                        # Классифицируем конкретную ячейку
                        cell_res = model.predict(cell, imgsz=224, verbose=False)[0]

                        cell_top_idx = cell_res.probs.top1 # Индекс самого вероятного класса
                        cls_name = cell_res.names[cell_top_idx] # Имя этого класса
                        val = MAP_CLASSES.get(cls_name, "0") # Получаем короткое обозначение

                        row_report.append(val)

                    # Вывод результатов ряда одной строкой в консоль
                    print(f"📦 РЯД {total_rows:04d} | {' | '.join(row_report)}")

            # Если видим "НЕТ" (пустоту), сбрасываем состояние активности ряда
            if no_confirmed and is_row_active:
                is_row_active = False
                print("--- Просвет между рядами ---\n")

            # === ОТОБРАЖЕНИЕ ИНФОРМАЦИИ НА ЭКРАНЕ ===
            top_cls = names[results.probs.top1] # Класс всего кадра
            top_conf = results.probs.top1conf.item() # Уверенность кадра

            # Цвет текста: зеленый если ряд зафиксирован
            text_color = (0, 255, 0) if is_row_active else (255, 255, 255)
            label = f"ROWS: {total_rows} | {top_cls} ({top_conf:.3f}) | THR:{conf_threshold:.2f} | Margin:{MIN_MARGIN:.2f}"

            # Рисуем подложку и текст информации
            cv2.rectangle(color_frame, (0, 0), (620, 28), (0, 0, 0), -1)
            cv2.putText(color_frame, label, (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.52, text_color, 2)

            # Отрисовка вертикальных разделительных линий
            for lx in LINE_X:
                cv2.line(color_frame, (lx, 0), (lx, HEIGHT), (0, 255, 0), 1)

            cv2.imshow(win_name, color_frame) # Показ кадра

            # Принудительное ограничение FPS для стабильности обработки
            target = 1.0 / f_val
            while (time.perf_counter() - prev_time) < target:
                time.sleep(0.001)
            prev_time = time.perf_counter()

            # Обновление заголовка окна текущими данными
            cv2.setWindowTitle(win_name, f"FPS: {f_val} | TOTAL ROWS: {total_rows}")

            # Опрос клавиатуры
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'): # Выход на 'q'
                break
            elif key == ord('s'): # Сохранение конфига линий на 's'
                save_config()

    except Exception:
        traceback.print_exc() # Вывод ошибки в лог при падении программы
    finally:
        # Корректное закрытие ресурсов камеры и окон
        ueye.is_ExitCamera(h_cam)
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main() # Запуск основной функции