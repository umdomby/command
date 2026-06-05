import sys
import serial
import serial.tools.list_ports
import time
import threading
import msvcrt

# ========================= CONFIG =========================
BAUD_RATE = 115200
START_FRAME = 0xABCD
TIME_SEND = 50

MAX_SPEED = 1000
SPEED_STEP = 100
STEER_STEP = 40

class HoverboardController:
    def __init__(self):
        self.ser = None
        self.running = True
        self.speed = 0
        self.steer = 0
        self.brake_level = 0          # 0..9
        self.feedback = {'speedR':0, 'speedL':0, 'batVoltage':0, 'boardTemp':0}
        self.last_send = 0

    def list_ports(self):
        ports = serial.tools.list_ports.comports()
        print("Доступные COM-порты:")
        for i, port in enumerate(ports):
            print(f"{i+1}: {port.device} - {port.description}")
        if not ports:
            print("COM-порты не найдены!")
            return None
        choice = input(f"Выбери порт (1-{len(ports)}): ")
        try:
            return ports[int(choice)-1].device
        except:
            return ports[0].device if ports else None

    def connect(self, port):
        try:
            self.ser = serial.Serial(port, BAUD_RATE, timeout=0.1)
            print(f"✅ Подключено к {port}")
            return True
        except Exception as e:
            print(f"❌ Ошибка: {e}")
            return False

    def send_command(self):
        if not self.ser: return
        try:
            current_speed = self.speed

            if self.brake_level > 0:
                # НОВАЯ формула — гораздо сильнее и с заметной разницей
                brake_force = 180 + (self.brake_level ** 2) * 28   # 1→208, 5→880, 9→2448 (обрежется на ~1000)
                current_speed = -brake_force

            checksum = START_FRAME ^ self.steer ^ current_speed
            cmd = bytearray([
                START_FRAME & 0xFF, (START_FRAME >> 8) & 0xFF,
                self.steer & 0xFF, (self.steer >> 8) & 0xFF,
                current_speed & 0xFF, (current_speed >> 8) & 0xFF,
                checksum & 0xFF, (checksum >> 8) & 0xFF
            ])
            self.ser.write(cmd)
        except:
            pass

    def receive(self):
        if not self.ser or not self.ser.in_waiting: return
        try:
            data = self.ser.read(self.ser.in_waiting)
            idx = 0
            while idx < len(data) - 1:
                if data[idx] == 0xCD and data[idx+1] == 0xAB and idx + 18 <= len(data):
                    packet = data[idx:idx+18]
                    self.feedback['speedR'] = int.from_bytes(packet[6:8], 'little', signed=True)
                    self.feedback['speedL'] = int.from_bytes(packet[8:10], 'little', signed=True)
                    self.feedback['batVoltage'] = int.from_bytes(packet[10:12], 'little', signed=True) / 100.0
                    self.feedback['boardTemp'] = int.from_bytes(packet[12:14], 'little', signed=True) / 10.0
                    idx += 18
                else:
                    idx += 1
        except:
            pass

    def print_status(self):
        brake_str = f" | BRAKE:{self.brake_level}" if self.brake_level > 0 else ""
        print(f"\rSpeed: {self.speed:4d} | Steer: {self.steer:4d}{brake_str} | "
              f"R:{self.feedback['speedR']:4d} L:{self.feedback['speedL']:4d} | "
              f"Bat: {self.feedback['batVoltage']:.1f}V | Temp: {self.feedback['boardTemp']:.1f}°C   ",
              end='', flush=True)

    def keyboard_thread(self):
        print("\n=== Управление ===")
        print("↑ ↓ — скорость (±100)")
        print("← → — руль")
        print("1-9 — УДЕРЖИВАТЬ = тормоз (разница теперь большая)")
        print("0 или отпустить — снять тормоз")
        print("Пробел — полный стоп")
        print("Q — выход")
        print("="*70)

        while self.running:
            if msvcrt.kbhit():
                key = msvcrt.getch()
                if key == b'\x00' or key == b'\xe0':
                    key = msvcrt.getch()
                    if key == b'H': self.speed = min(self.speed + SPEED_STEP, MAX_SPEED)
                    elif key == b'P': self.speed = max(self.speed - SPEED_STEP, -MAX_SPEED)
                    elif key == b'K': self.steer = max(self.steer - STEER_STEP, -1000)
                    elif key == b'M': self.steer = min(self.steer + STEER_STEP, 1000)
                elif key in b'123456789':
                    self.brake_level = int(key.decode())
                elif key in b'0':
                    self.brake_level = 0
                elif key == b' ':
                    self.speed = 0
                    self.steer = 0
                    self.brake_level = 0
                elif key in [b'q', b'Q']:
                    self.running = False
            else:
                if self.brake_level > 0:
                    self.brake_level = 0
            time.sleep(0.02)

    def run(self):
        port = self.list_ports()
        if not port or not self.connect(port):
            return
        threading.Thread(target=self.keyboard_thread, daemon=True).start()
        try:
            while self.running:
                now = time.time() * 1000
                if now - self.last_send > TIME_SEND:
                    self.send_command()
                    self.last_send = now
                self.receive()
                self.print_status()
                time.sleep(0.01)
        finally:
            self.running = False
            if self.ser: self.ser.close()
            print("\n✅ Отключено.")

if __name__ == "__main__":
    HoverboardController().run()