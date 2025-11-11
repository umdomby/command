import socket
import time
import struct
import random

# === НАСТРОЙКИ ===
target_ip = "127.0.0.1"
target_port = 20777

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
print(f"🚗 Grid Legends ТЕСТОВЫЕ ПАКЕТЫ (264 байта) → {target_ip}:{target_port}")
print("Нажми Ctrl+C для остановки\n")

def generate_grid_legends_packet():
    # === 1. ЗАГОЛОВОК (40 байт) ===
    packet_format = 2024      # ushort
    game_major = 1            # byte  
    game_minor = 22           # byte
    packet_version = 1        # byte
    packet_id = 0             # byte (Motion)
    session_uid = 1234567890  # ulong
    session_time = time.time() % 60.0  # float
    frame_id = int(time.time() * 60) % (2**32)  # uint
    player_car_index = 0      # byte
    secondary_player_index = 255  # byte
    header_padding = b'\x00' * 16

    # === 2. ОСНОВНЫЕ ДАННЫЕ ===
    data_padding1 = b'\x00' * 36  # 36 байт padding

    # Углы (12 байт)
    pitch = random.uniform(-1.5, 1.5)
    roll = random.uniform(-2.0, 2.0)
    yaw = random.uniform(-3.0, 3.0)

    # G-Forces (12 байт)
    g_lateral = random.uniform(-2.5, 2.5)
    g_longitudinal = random.uniform(-4.0, 4.0)
    g_vertical = random.uniform(-1.5, 1.5)

    # Телеметрия (36 байт = 9 * float)
    speed_mps = random.uniform(0, 80)  # 0-288 км/ч
    engine_rpm_raw = random.uniform(40, 36)  # 40*250=10000 RPM, 36*250=9000 RPM
    max_engine_rpm_raw = 36.0  # 36*250=9000 RPM
    brake = random.uniform(0, 1)
    throttle = random.uniform(0, 1)
    steer = random.uniform(-1, 1)
    clutch = random.uniform(0, 1)
    unused_brake = 0.0
    gear = random.choice([-1.0, 0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0])

    # === УПАКОВКА В БАЙТЫ (little-endian) ===
    packet = bytearray()

    # Заголовок (40 байт)
    packet += struct.pack('<HBBBB', packet_format, game_major, game_minor, packet_version, packet_id)
    packet += struct.pack('<Q', session_uid)
    packet += struct.pack('<f', session_time)
    packet += struct.pack('<I', frame_id)
    packet += struct.pack('<BB', player_car_index, secondary_player_index)
    packet += header_padding

    # Основные данные
    packet += data_padding1  # 36 байт

    # Углы
    packet += struct.pack('<fff', pitch, roll, yaw)

    # G-Forces
    packet += struct.pack('<fff', g_lateral, g_longitudinal, g_vertical)

    # Телеметрия (9 float = 36 байт)
    packet += struct.pack('<f', speed_mps)
    packet += struct.pack('<f', engine_rpm_raw)      # *250 в C#
    packet += struct.pack('<f', max_engine_rpm_raw)  # *250 в C#
    packet += struct.pack('<f', brake)
    packet += struct.pack('<f', throttle)
    packet += struct.pack('<f', steer)
    packet += struct.pack('<f', clutch)
    packet += struct.pack('<f', unused_brake)
    packet += struct.pack('<f', gear)

    # Финальный padding до 264 байт
    padding_needed = 264 - len(packet)
    packet += b'\x00' * padding_needed

    return bytes(packet), speed_mps, engine_rpm_raw*250, gear, throttle, brake, steer

# === ТЕСТОВЫЙ ЦИКЛ ===
try:
    packet_count = 0
    while True:
        packet, speed, rpm, gear, throttle, brake, steer = generate_grid_legends_packet()
        sock.sendto(packet, (target_ip, target_port))
        
        packet_count += 1
        if packet_count % 50 == 0:  # Каждые 5 сек
            gear_str = "R" if gear == -1 else "N" if gear == 0 else str(int(gear))
            print(f"[{packet_count}] Скорость: {speed*3.6:.1f} км/ч | RPM: {rpm:.0f} | Передача: {gear_str} | Газ: {throttle*100:.0f}%")
        
        time.sleep(0.1)  # 10 FPS
except KeyboardInterrupt:
    print(f"\n✅ Остановлено. Отправлено пакетов: {packet_count}")
    sock.close()