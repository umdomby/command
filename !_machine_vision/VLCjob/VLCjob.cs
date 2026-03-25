"C:\Program Files (x86)\VideoLAN\VLC\vlc.exe"

"C:\_VIDEO\shampan\172.16.99.55_01_20260320111052317_1.mp4"



taskkill /F /IM vlc.exe >nul 2>&1 & "C:\Program Files (x86)\VideoLAN\VLC\vlc.exe" "C:\_VIDEO\shampan\172.16.99.55_01_20260320115522894_1.mp4" --start-time=170 --loop --sout "#rtp{mux=ts,sdp=rtsp://:8554/mystream}" --sout-keep
