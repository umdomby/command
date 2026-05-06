Перетащи файл → Choose function → H.264
В настройках:
Codec: H.264 (x264)
CRF: 18 (или 16–20)
Preset: Slow (или Slower, если не жалко времени)
Pix_fmt: yuv420p (обязательно, чтобы Premiere не ругался)
Bitrate не трогай (CRF лучше)
Галочка GPU включи, если есть NVIDIA/AMD — будет быстрее

Encode

"C:\_VIDEO\172.16.99.55_01_20260320115522894_1.mp4"
ffmpeg -i "C1_VIDEO172.116.99.55_01_2026030115522894_1.mp4" -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -c:a copy output_for_premiere.mp4
"C:\_PROG\ffmpeg-master-latest-win64-gpl-shared\bin\ffmpeg.exe"



"C:\_PROG\ffmpeg-master-latest-win64-gpl-shared\bin\ffmpeg.exe" -i "C:\_VIDEO\172.16.99.55_01_20260320115522894_1.mp4" -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -c:a copy "C:\_VIDEO\output_for_premiere.mp4"
or
"C:\_PROG\ffmpeg-master-latest-win64-gpl-shared\bin\ffmpeg.exe" -i "C:\_VIDEO\172.16.99.55_01_20260320115522894_1.mp4" -c:v prores -profile:v 2 -pix_fmt yuv422p10le -c:a copy "C:\_VIDEO\output_prores.mov"