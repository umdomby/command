import serial
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation

# --- НАСТРОЙКИ ---
SERIAL_PORT = 'COM4'
BAUD_RATE = 115200

try:
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=0.05)
except Exception as e:
    print(f"Ошибка: {e}. Закройте Serial Monitor в PlatformIO/VS Code!")
    exit()

lidar_data = {angle: 0 for angle in range(360)}

fig, ax = plt.subplots(subplot_kw={'projection': 'polar'})
ax.set_ylim(0, 5000)  # Радиус обзора 5 метров
line, = ax.plot([], [], 'ro', ms=2)  # Красные точки

# Переменная для эмуляции вращения, если пакеты не содержат явного угла
current_virtual_angle = 0

def parse_bruteforce():
    global current_virtual_angle
    if ser.in_waiting >= 2:
        raw_bytes = ser.read(ser.in_waiting)
        
        # Идем по всему массиву байт с шагом 2
        for i in range(0, len(raw_bytes) - 1, 2):
            low_byte = raw_bytes[i]
            high_byte = raw_bytes[i+1]
            
            # Собираем дистанцию из двух байт
            distance = low_byte | ((high_byte & 0x3F) << 8)
            
            # Если значение похоже на реальное расстояние (от 15 см до 5 метров)
            if 150 < distance < 5000:
                lidar_data[current_virtual_angle] = distance
                # Сдвигаем угол для следующей точки
                current_virtual_angle = (current_virtual_angle + 1) % 360

def update_plot(frame):
    parse_bruteforce()
    angles_rad = np.radians(list(lidar_data.keys()))
    distances = list(lidar_data.values())
    line.set_data(angles_rad, distances)
    return line,

print("Запуск всеядного режима отрисовки...")
ani = animation.FuncAnimation(fig, update_plot, blit=True, interval=30, cache_frame_data=False)
plt.show()
ser.close()