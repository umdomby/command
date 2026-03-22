HiWatch DS-1400 2.8мм нужна программа C# где я выберу файл, а программа будет мне присылать RTSP поток  программу

нет мне нужно файл .mp4 перевести в RTSP поток для работы с ИИ моделями YOLO , можешь сразу добавить YOLO и рассказать как создать базу определения упавшей бутылки на движущимся конвейере . Какие размеры скриншотов ? я могу сделать их  в photoshop , как из этих моделей сделать симуляцию и т.д Запись видео для теста там есть упавшие бутылки. Я хочу этим видео тестировать программу распознавания, видео файл .mp4  симуляция RTSP поток из камеры



Выбираешь файл .mp4 (твоя запись с упавшими бутылками на конвейере)
Один клик → запускается бесконечный RTSP-поток (как будто это живая камера HiWatch DS-1400)
Этот поток можно подключать к любой YOLO-модели (Python, C#, любой фреймворк)
Добавлена интеграция YOLOv8+ прямо в C# (через современную библиотеку YoloDotNet v4.2) — можешь сразу тестировать детекцию упавших бутылок в самой программе


я могу запустить RTSP поток из VLC player а программой и YOLO их принимать? мне нужно протестировать програму, там определить по нескольким скриншотам уже точно упавшей бутылки, мне нужна таккая тестовая программа как быстро и без сложностей это реализовать?


Да, ты можешь запустить RTSP-поток из VLC (из твоего .mp4 файла в бесконечном цикле), а в C# программе принимать этот поток в живом окне (PictureBox) с таймером и накладывать YOLO-детекцию поверх видео в реальном времени.


"F:\bootle\172.16.99.55_01_20260320115522894_1.mp4"
"C:\ProgramData\Microsoft\Windows\Start Menu\Programs\VideoLAN\VLC media player.lnk"



:sout=#transcode{vcodec=hevc,acodec=mpga,ab=128,channels=2,samplerate=44100,scodec=none} :no-sout-all :sout-keep




global::System.Windows.Forms.Application.SetHighDpiMode(HighDpiMode.SystemAware);
TypeLoadException: Could not load type 'System.Private.Windows.Core.OsVersion' from assembly 'System.Private.Windows.Core, Version=10.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089'.
System.TypeInitializationException: "The type initializer for 'System.Windows.Forms.ScaleHelper' threw an exception."



:sout=#transcode{vcodec=hevc,acodec=mpga,ab=128,channels=2,samplerate=44100,scodec=none} :no-sout-all :sout-keep

:sout=#transcode{vcodec=hevc,acodec=mpga,ab=128,channels=2,samplerate=44100,scodec=none} :no-sout-all :sout-keep

VLC из файла нужно отправлять RTSP поток, а программа C# должна ег опринимать.



vlc "C:\Videos\test.mp4" --loop ^
--sout "#transcode{vcodec=h264,vb=2000,acodec=mpga,ab=128,channels=2,samplerate=44100}:rtp{sdp=rtsp://:8554/mystream}" ^
--sout-keep --rtsp-host 0.0.0.0:8554


rtsp://127.0.0.1:8554/stream
rtsp://192.168.1.ХХ:8554/stream


