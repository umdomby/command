def main():
    load_config() # Загружаем линии при старте
    if not os.path.exists(SAVE_PATH):
        os.makedirs(SAVE_PATH)

    # Инициализация модели YOLO (режим классификации)
    model = YOLO(MODEL_PATH, task='classify')

    # Инициализация камеры IDS
    h_cam = ueye.HIDS(0) # Дескриптор камеры
    mem_ptr = ueye.c_mem_p() # Указатель на память кадра
    mem_id = ueye.int() # ID области памяти

    try:
        ueye.is_InitCamera(h_cam, None) # Запуск камеры
        ueye.is_StopLiveVideo(h_cam, ueye.IS_WAIT) # Остановка видео для настройки параметров

        # Настройка области захвата (AOI)
        rect_aoi = ueye.IS_RECT()
        rect_aoi.s32X = ueye.int(pos_x)
        rect_aoi.s32Y = ueye.int(pos_y)
        rect_aoi.s32Width = ueye.int(WIDTH)
        rect_aoi.s32Height = ueye.int(HEIGHT)
        ueye.is_AOI(h_cam, ueye.IS_AOI_IMAGE_SET_AOI, rect_aoi, ueye.sizeof(rect_aoi))

        # Настройка цветового режима (Сырой 8-битный формат с сенсора)
        ueye.is_SetColorMode(h_cam, ueye.IS_CM_SENSOR_RAW8)
        # Выделение памяти под кадр
        ueye.is_AllocImageMem(h_cam, WIDTH, HEIGHT, 8, mem_ptr, mem_id)
        ueye.is_SetImageMem(h_cam, mem_ptr, mem_id)
        ueye.is_CaptureVideo(h_cam, ueye.IS_DONT_WAIT) # Запуск живого потока

        # Настройка графического окна
        win_name = 'picoCam - Row Inspection'
        cv2.namedWindow(win_name, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(win_name, 1300, 550)
        cv2.setMouseCallback(win_name, mouse_event)

        # Создание интерфейса управления (ползунки)
        cv2.createTrackbar('Gain', win_name, DEFAULT_GAIN, 100, on_change)
        cv2.createTrackbar('Exposure', win_name, DEFAULT_EXPOSURE, 200, on_change)
        cv2.createTrackbar('FPS', win_name, DEFAULT_FPS, 100, on_change)
        cv2.createTrackbar('Delay(x0.01s)', win_name, DEFAULT_DELAY, 100, on_change)
        cv2.setTrackbarMin('Delay(x0.01s)', win_name, 5) # Минимум 0.05 сек
        cv2.createTrackbar('Conf (%)', win_name, DEFAULT_CONF, 100, on_change)
        cv2.createTrackbar('Margin (%)', win_name, DEFAULT_MARGIN, 30, on_change)
        cv2.setTrackbarMin('Margin (%)', win_name, 1)

        # Буферы для фильтрации шума детекции
        # Если в последних 6 кадрах 4 раза был "Yes", считаем ряд начатым
        yes_buffer = deque(maxlen=6)
        no_buffer = deque(maxlen=8)
        CONFIRM_YES = 4 # Порог подтверждения наличия триггера
        CONFIRM_NO = 6  # Порог подтверждения пустоты

        total_rows = 0 # Счетчик обработанных рядов
        last_detection_time = 0 # Время последнего зафиксированного ряда
        is_row_active = False # Флаг: находимся ли мы сейчас "внутри" ряда
        prev_time = time.perf_counter() # Для контроля FPS

        while True:
            # Считывание текущих значений с ползунков
            g_val = cv2.getTrackbarPos('Gain', win_name)
            e_val = max(1, cv2.getTrackbarPos('Exposure', win_name))
            f_val = max(1, cv2.getTrackbarPos('FPS', win_name))
            delay_sec = cv2.getTrackbarPos('Delay(x0.01s)', win_name) / 100.0
            conf_threshold = cv2.getTrackbarPos('Conf (%)', win_name) / 100.0
            MIN_MARGIN = cv2.getTrackbarPos('Margin (%)', win_name) / 100.0

            # Применение настроек к камере "на лету"
            ueye.is_SetHardwareGain(h_cam, g_val, ueye.IS_IGNORE_PARAMETER,
                                    ueye.IS_IGNORE_PARAMETER, ueye.IS_IGNORE_PARAMETER)
            ueye.is_Exposure(h_cam, ueye.IS_EXPOSURE_CMD_SET_EXPOSURE, ueye.double(e_val), 8)
            ueye.is_SetFrameRate(h_cam, ueye.double(f_val), ueye.double())

            # Копирование данных из памяти камеры в массив Python
            data = ueye.get_data(mem_ptr, WIDTH, HEIGHT, 8, WIDTH, copy=True)
            if data is None: continue

            # Преобразование в формат OpenCV (Bayer -> BGR)
            raw_frame = np.frombuffer(data, dtype=np.uint8).reshape((HEIGHT, WIDTH))
            color_frame = cv2.cvtColor(raw_frame, cv2.COLOR_BayerRG2BGR)

            # --- Шаг 1: Поиск триггер-маркера на всем кадре ---
            results = model.predict(color_frame, imgsz=224, verbose=False)[0]
            probs = results.probs.data.cpu().numpy() # Вероятности всех классов
            names = results.names # Имена классов

            # Поиск индексов классов триггера в модели
            idx_yes = next((k for k, v in names.items() if v == TRIGGER_YES), None)
            idx_no = next((k for k, v in names.items() if v == TRIGGER_NO), None)

            p_yes = float(probs[idx_yes]) if idx_yes is not None else 0.0
            p_no = float(probs[idx_no]) if idx_no is not None else 0.0

            # Логика определения: "Да" (маркер есть) или "Нет" (маркер отсутствует)
            is_yes = (p_yes >= conf_threshold) and (p_yes - p_no >= MIN_MARGIN)
            is_no_high_conf = (p_no >= 0.70) and (p_no - p_yes >= MIN_MARGIN)

            yes_buffer.append(is_yes)
            no_buffer.append(is_no_high_conf)

            # Проверка подтверждения через буфер (защита от мерцания)
            yes_confirmed = sum(yes_buffer) >= CONFIRM_YES
            no_confirmed = sum(no_buffer) >= CONFIRM_NO

            current_time = time.time()

            # === Шаг 2: Обработка "Золотого кадра" (момент срабатывания) ===
            if yes_confirmed and not is_row_active:
                # Если прошло достаточно времени с прошлого ряда
                if (current_time - last_detection_time) > delay_sec:
                    total_rows += 1
                    is_row_active = True
                    last_detection_time = current_time

                    print(f"\n✅ РЯД #{total_rows:04d} СОХРАНЁН  |  p_yes={p_yes:.4f}  p_no={p_no:.4f}")

                    # === Шаг 3: Анализ каждой ячейки внутри ряда ===
                    row_report = []
                    for i in range(0, 11):
                        if i == 5: # Пропускаем "пустой" промежуток в центре блистера (между 6 и 7 линией)
                            continue

                        x1, x2 = LINE_X[i], LINE_X[i + 1] # Границы текущей ячейки
                        if x2 - x1 < 10: # Если линии слишком близко, ячейка некорректна
                            row_report.append("?")
                            continue

                        # Вырезаем фрагмент кадра (ячейку)
                        cell = color_frame[:, x1:x2]
                        # Классифицируем только этот фрагмент
                        cell_res = model.predict(cell, imgsz=224, verbose=False)[0]

                        # Берем самый вероятный класс
                        cell_top_idx = cell_res.probs.top1
                        cls_name = cell_res.names[cell_top_idx]
                        val = MAP_CLASSES.get(cls_name, "0") # Переводим в короткий код

                        row_report.append(val)

                    # Вывод итоговой строки ряда в консоль
                    print(f"📦 РЯД {total_rows:04d} | {' | '.join(row_report)}")

            # Сброс триггера, когда видим пустоту (пробел между рядами)
            if no_confirmed and is_row_active:
                is_row_active = False
                print("--- Просвет между рядами ---\n")

            # === Шаг 4: Визуализация ===
            top_cls = names[results.probs.top1] # Лучший класс на всем кадре
            top_conf = results.probs.top1conf.item() # Уверенность

            # Подсветка текста: зеленый если ряд активен
            text_color = (0, 255, 0) if is_row_active else (255, 255, 255)
            label = f"ROWS: {total_rows} | {top_cls} ({top_conf:.3f}) | THR:{conf_threshold:.2f} | Margin:{MIN_MARGIN:.2f}"

            # Рисуем черную плашку под текст и сам текст
            cv2.rectangle(color_frame, (0, 0), (620, 28), (0, 0, 0), -1)
            cv2.putText(color_frame, label, (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.52, text_color, 2)

            # Рисуем разделительные линии ячеек
            for lx in LINE_X:
                cv2.line(color_frame, (lx, 0), (lx, HEIGHT), (0, 255, 0), 1)

            cv2.imshow(win_name, color_frame)

            # Точный контроль частоты кадров (FPS)
            target = 1.0 / f_val
            while (time.perf_counter() - prev_time) < target:
                time.sleep(0.001)
            prev_time = time.perf_counter()

            # Обновление заголовка окна
            cv2.setWindowTitle(win_name, f"FPS: {f_val} | TOTAL ROWS: {total_rows}")

            # Обработка клавиш
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'): # Выход
                break
            elif key == ord('s'): # Сохранить линии вручную
                save_config()

    except Exception:
        traceback.print_exc() # Вывод ошибки в консоль, если что-то упало
    finally:
        # Корректное освобождение камеры и закрытие окон
        ueye.is_ExitCamera(h_cam)
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()