https://www.gyan.dev/ffmpeg/builds/
https://github.com/BtbN/FFmpeg-Builds/releases


ffmpeg-master-latest-win64-gpl.zip  gpl — полная версия с максимальным набором кодеков (включая патентованные, как AAC, H.264/265, и т.д.), без ограничений




Удобный вариант — добавить в PATH (чтобы не писать полный путь каждый раз)
Правой кнопкой на «Этот компьютер» → Свойства → Дополнительные параметры системы → Переменные среды
В разделе «Системные переменные» найди переменную Path → Изменить → Новый
Вставь:
F:\Program\!VIDEO\ffmpeg-master-latest-win64-gpl\ffmpeg-master-latest-win64-gpl\bin
OK → OK → OK
Закрой и снова открой cmd
Теперь можно просто писать ffmpeg -version, ffplay ... без полного пути



"C:\Program Files\VideoLAN\VLC\vlc.exe" ^
"F:\bootle\172.16.99.55_01_20260320115522894_1.mp4" ^
--loop ^
--sout "#rtp{mux=ts,dst=127.0.0.1,port=8554,sdp=rtsp://:8554/mystream}" ^
--sout-keep ^
--no-audio



"F:\Program\!VIDEO\ffmpeg-master-latest-win64-gpl\ffmpeg-master-latest-win64-gpl\bin\ffplay.exe" -rtsp_transport tcp rtsp://127.0.0.1:8554/mystream


отладка
"F:\Program\!VIDEO\ffmpeg-master-latest-win64-gpl\ffmpeg-master-latest-win64-gpl\bin\ffplay.exe" -loglevel verbose -rtsp_transport tcp rtsp://127.0.0.1:8554/mystream



Решение: заставь VLC перекодировать видео на лету
Это самый надёжный способ для looped mp4 → RTSP (работает в 90% случаев по форумам и StackOverflow). Добавь transcode в sout — VLC сам перекодирует H.264 в свежий поток с правильными ключевыми кадрами.
Рабочая команда (запускай от имени администратора, если порт занят):

"C:\Program Files\VideoLAN\VLC\vlc.exe" ^
"F:\bootle\172.16.99.55_01_20260320115522894_1.mp4" ^
--loop ^
--sout "#transcode{vcodec=h264,vb=2000,acodec=none}:rtp{mux=ts,dst=127.0.0.1,port=8554,sdp=rtsp://:8554/mystream}" ^
--sout-keep ^
--no-audio
