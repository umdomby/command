taskkill /F /IM vlc.exe

/F /IM vlc.exe >nul 2>&1 & "C:\Program Files\VideoLAN\VLC\vlc.exe" "F:\bootle\172.16.99.55_01_20260320115522894_1.mp4" --loop --sout "#rtp{mux=ts,sdp=rtsp://:8554/mystream}" --sout-keep

### time
taskkill /F /IM vlc.exe >nul 2>&1 & "C:\Program Files\VideoLAN\VLC\vlc.exe" "F:\bootle\172.16.99.55_01_20260320115522894_1.mp4" --start-time=213 --loop --sout "#rtp{mux=ts,sdp=rtsp://:8554/mystream}" --sout-keep
taskkill /F /IM vlc.exe >nul 2>&1 & "C:\Program Files\VideoLAN\VLC\vlc.exe" "F:\bootle\172.16.99.55_01_20260320115522894_1.mp4" --start-time=213 --loop --sout "#rtp{dst=127.0.0.1,port=8554,mux=ts,sdp=rtsp://127.0.0.1:8554/mystream}" --sout-keep
taskkill /F /IM vlc.exe >nul 2>&1 & "C:\Program Files\VideoLAN\VLC\vlc.exe" "F:\bootle\172.16.99.55_01_20260320115522894_1.mp4" --start-time=213 --loop --rtsp-host=127.0.0.1 --rtsp-port=8554 --sout "#rtp{dst=127.0.0.1,port=8554,mux=ts,sdp=rtsp://127.0.0.1:8554/mystream}" --sout-keep


console
"C:\Program Files\VideoLAN\VLC\vlc.exe" "F:\bootle\172.16.99.55_01_20260320115522894_1.mp4" --loop --sout "#rtp{mux=ts,sdp=rtsp://:8554/mystream}"

```
tasklist | findstr /i vlc
C:\Users\umdom>tasklist | findstr /i vlc
vlc.exe                      23672 Console                    1    58 756 КБ
vlc.exe                      12296 Console                    1    59 060 КБ

taskkill /F /IM vlc.exe
tasklist | findstr /i vlc
```


ffmpeg
"F:\Program\!VIDEO\ffmpeg-master-latest-win64-gpl\ffmpeg-master-latest-win64-gpl\bin\ffplay.exe" -rtsp_transport tcp rtsp://127.0.0.1:8554/mystream
отладка
"F:\Program\!VIDEO\ffmpeg-master-latest-win64-gpl\ffmpeg-master-latest-win64-gpl\bin\ffplay.exe" -loglevel verbose -rtsp_transport tcp rtsp://127.0.0.1:8554/mystream





"F:\Program\!VIDEO\ffmpeg-master-latest-win64-gpl\ffmpeg-master-latest-win64-gpl\bin\ffmpeg.exe" -stream_loop -1 -i "F:\bootle\172.16.99.55_01_20260320115522894_1.mp4" -c copy -f rtsp -rtsp_flags listen rtsp://127.0.0.1:8554/mystream

