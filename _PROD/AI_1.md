



alert("Пожалуйста, разрешите доступ к датчикам устройства в появившемся окне.");   не появляется кнопки на разрешение - только надпись -закрыть
Virtual box: Активен Orientation: запрещено Motion: запрещено

data: {"message":"Информация об устройстве: iOS=true, версия=18, UserAgent=Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1","type":"info","timestamp":"2025-06-30T09:28:57.577Z"}

data: {"message":"Поддержка сенсоров: Orientation=true, Motion=true, OrientationPermission=true, MotionPermission=true","type":"info","timestamp":"2025-06-30T09:28:57.601Z"}
iphone 13 не выводит положение осей
отвечай на русском, дай точечные изменения где что изменить.



Логика кнопки для VirtualBox:
В коде есть кнопка, которая переключает состояние isVirtualBoxActive и запрашивает разрешения для DeviceOrientationEvent и DeviceMotionEvent,
если это необходимо. Однако, если VirtualBox уже активен, повторное нажатие должно деактивировать его, но этого не происходит, 
или деактивация не срабатывает должным образом.