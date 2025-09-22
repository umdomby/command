Windows 11 Pro
24H2
13.09.2025
26100.6584
Пакет интерфейса компонентов Windows 1000.26100.234.0
NVIDIA GeForce RTX 4070 SUPER
SSD 980 PRO 500 GB

# Убедимся, что h264_nvenc поддерживается:
docker-compose run --rm ffmpeg ffmpeg -codecs | grep nvenc


# Также проверьте NVIDIA Container Toolkit:
sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk cdi generate --output=/etc/cdi/nvidia.yaml
sudo systemctl restart docker
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi

# Проверьте содержимое папки в реальном времени:
watch -n 1 ls -la /home/umdom/projects/prod/docker-nginx-444/videos


# File | Settings  and  Editor | File Types  and   Ignore files and folders
*.ts
*.m3u8

# Определите путь к жесткому диску
lsblk
df -h

# Найдите устройство (например, /dev/sdb1) и его монтируемую точку.

# Предположим, ваш жесткий диск смонтирован как /mnt/hdd/videos.
# Создайте структуру папок, если нужно:
sudo mkdir -p /mnt/hdd/videos

```
location /videos/ {
    root /mnt/hdd;  # Указываем путь к жесткому диску
    add_header Access-Control-Allow-Origin "https://champcup.site:444";
    add_header Cache-Control "no-cache";
}

- ./site2:/usr/share/nginx/html/site2
      - ./certbot/www:/var/www/certbot
      - /mnt/hdd/videos:/var/www/videos  # Новый volume для жесткого диска
    restart: unless-stopped
```