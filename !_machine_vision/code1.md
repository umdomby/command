Кодек: H264 - MPEG-4 AVC (part 10) (h264)
Размеры буфера: 2560x1440
Разрешение видео.: 2560x1440
Частота кадров: 20
Ориентация: Верхняя-левая
Тип: Видео
Декодированный формат: DX11
Основные цвета: ITU-R BT.709
Функция переноса цвета: ITU-R BT.709
Цветовое пространство: ITU-R BT.709 диапазон

Кодек: CVD subtitles (cvd )


есть поток RTSP нужно добавить YOLO , движущийся конвейер с бутылками, нужно отслеживать упавшие бутылки, расскажи как мне создать картинки для отслеживания, какие папки нужны , где нормально а где нужно дать тревогу, как вносить логику оповещения от ложных сработок. какие размеры нужны?


ip 192.168.1.121

netsh advfirewall set allprofiles state off
netsh advfirewall set allprofiles state on


"F:\bootle\172.16.99.55_01_20260320115522894_1.mp4"
"C:\ProgramData\Microsoft\Windows\Start Menu\Programs\VideoLAN\VLC media player.lnk"


"C:\Program Files\VideoLAN\VLC\vlc.exe" "F:\bootle\172.16.99.55_01_20260320115522894_1.mp4" --loop --sout "#rtp{mux=ts,sdp=rtsp://:8554/mystream}" --sout-keep


"C:\Program Files\VideoLAN\VLC\vlc.exe" ^
"F:\bootle\172.16.99.55_01_20260320115522894_1.mp4" ^
--loop ^
--sout "#rtp{mux=ts,dst=127.0.0.1,port=8554,sdp=rtsp://:8554/mystream}" ^
--sout-keep ^
--no-audio


"C:\Program Files\VideoLAN\VLC\vlc.exe" ^
"F:\bootle\172.16.99.55_01_20260320115522894_1.mp4" ^
--loop ^
--sout "#rtp{mux=ts,dst=127.0.0.1,port=8554,sdp=rtsp://:8554/mystream}" ^
--sout-keep ^
--no-audio ^
--rtsp-host=127.0.0.1


☐ Использовать RTP поверх RTSP (TCP)
(на английском: Use RTP over RTSP (TCP))

rtsp://127.0.0.1:8554/mystream