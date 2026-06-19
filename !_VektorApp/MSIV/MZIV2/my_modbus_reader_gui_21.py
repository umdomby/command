import tkinter as tk
from tkinter import ttk
from pymodbus.client import ModbusTcpClient
import time
import threading

# ==================== НАСТРОЙКИ ====================
IP_ADDRESS = "192.168.1.1"
PORT = 502
DEVICE_ID = 1                 # Slave / Unit ID
UPDATE_INTERVAL = 800         # ms
# ===================================================

class ModbusApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Modbus TCP Reader — Все регистры")
        self.root.geometry("800x920")
        self.root.resizable(True, True)
        
        self.client = None
        self.running = False
        self.thread = None
        
        self.create_widgets()
        
    def create_widgets(self):
        # Заголовок
        tk.Label(self.root, text="Modbus TCP Reader", font=("Arial", 20, "bold")).pack(pady=15)
        tk.Label(self.root, text=f"IP: {IP_ADDRESS}    Порт: {PORT}    Slave: {DEVICE_ID}", 
                font=("Arial", 12)).pack(pady=5)

        # Значения регистров
        reg_frame = tk.LabelFrame(self.root, text="Значения регистров", padx=25, pady=20)
        reg_frame.pack(pady=15, padx=30, fill="x")

        self.reg_labels = {}

        registers_info = [
            ("40001", "Основное значение"),
            ("40002", "Линия 1"),
            ("40003", "Линия 2"),
            ("40004", "Установка")
        ]

        for reg, desc in registers_info:
            frame = tk.Frame(reg_frame)
            frame.pack(fill="x", pady=10)

            tk.Label(frame, text=f"{reg}:", font=("Arial", 13, "bold"), width=10, anchor="w").pack(side="left")
            
            self.reg_labels[reg] = tk.Label(frame, text="---", font=("Arial", 18, "bold"), 
                                          fg="blue", width=12, anchor="center")
            self.reg_labels[reg].pack(side="left", padx=20)
            
            tk.Label(frame, text=desc, font=("Arial", 12)).pack(side="left")

        # Статусы
        status_frame = tk.LabelFrame(self.root, text="Статус оборудования", padx=25, pady=20)
        status_frame.pack(pady=15, padx=30, fill="x")

        self.status1 = tk.Label(status_frame, text="Линия 1: Работает", font=("Arial", 13), fg="green")
        self.status1.pack(anchor="w", pady=8)

        self.status2 = tk.Label(status_frame, text="Линия 2: Работает", font=("Arial", 13), fg="green")
        self.status2.pack(anchor="w", pady=8)

        self.status3 = tk.Label(status_frame, text="Установка: Работает", font=("Arial", 13), fg="green")
        self.status3.pack(anchor="w", pady=8)

        # Общий статус
        self.status_label = tk.Label(self.root, text="Не подключено", 
                                   font=("Arial", 12), fg="red")
        self.status_label.pack(pady=15)

        # Кнопки
        btn_frame = tk.Frame(self.root)
        btn_frame.pack(pady=25)

        self.start_btn = ttk.Button(btn_frame, text="▶ Запустить чтение", command=self.start_reading, width=20)
        self.start_btn.grid(row=0, column=0, padx=15)

        self.stop_btn = ttk.Button(btn_frame, text="⏹ Стоп", command=self.stop_reading, state="disabled", width=20)
        self.stop_btn.grid(row=0, column=1, padx=15)

        ttk.Button(btn_frame, text="Выход", command=self.on_close, width=15).grid(row=0, column=2, padx=15)

    def log(self, message, color="black"):
        print(f"[LOG] {message}")
        self.root.after(0, lambda: self.status_label.config(text=message, fg=color))

    def update_status(self, text, color="black"):
        """Совместимый метод для обновления статуса"""
        self.root.after(0, lambda: self.status_label.config(text=text, fg=color))

    def connect(self):
        try:
            if self.client is None:
                self.client = ModbusTcpClient(
                    host=IP_ADDRESS, 
                    port=PORT, 
                    timeout=5
                )
            
            if not self.client.connect():
                self.update_status("❌ Не удалось подключиться", "red")
                return False

            self.update_status("✅ Подключено успешно", "green")
            return True
        except Exception as e:
            self.update_status(f"❌ Ошибка подключения: {e}", "red")
            return False

    def read_loop(self):
        while self.running:
            try:
                if not self.client or not self.client.is_socket_open():
                    if not self.connect():
                        time.sleep(3)
                        continue

                # Читаем 4 регистра начиная с адреса 0 (40001)
                response = self.client.read_holding_registers(
                    address=0,
                    count=4,
                    device_id=DEVICE_ID
                )

                if response.isError():
                    self.root.after(0, self.log, "❌ Ошибка чтения Modbus", "orange")
                else:
                    values = response.registers
                    self.root.after(0, self.update_display, values)

            except Exception as e:
                self.root.after(0, self.log, f"❌ Ошибка: {e}", "red")

            time.sleep(UPDATE_INTERVAL / 1000)

    def update_display(self, values):
        regs = ["40001", "40002", "40003", "40004"]
        for i, reg in enumerate(regs):
            val = values[i]
            self.reg_labels[reg].config(text=str(val), fg="green")

        # Логика статусов (как в оригинальном v2)
        if values[1] > 0:
            self.status1.config(text="Линия 1: ОСТАНОВЛЕНА", fg="red")
        else:
            self.status1.config(text="Линия 1: Работает", fg="green")

        if values[2] > 0:
            self.status2.config(text="Линия 2: ОСТАНОВЛЕНА", fg="red")
        else:
            self.status2.config(text="Линия 2: Работает", fg="green")

        if values[3] > 0:
            self.status3.config(text="Установка: ОСТАНОВЛЕНА", fg="red")
        else:
            self.status3.config(text="Установка: Работает", fg="green")

        self.log("Чтение успешно", "green")

    def start_reading(self):
        if self.running:
            return
        self.running = True
        self.start_btn.config(state="disabled")
        self.stop_btn.config(state="normal")
        self.log("Запуск чтения...", "blue")

        self.thread = threading.Thread(target=self.read_loop, daemon=True)
        self.thread.start()

    def stop_reading(self):
        self.running = False
        self.start_btn.config(state="normal")
        self.stop_btn.config(state="disabled")
        self.log("Остановлено", "orange")

    def on_close(self):
        self.running = False
        time.sleep(0.5)
        if self.client:
            try:
                self.client.close()
            except:
                pass
        self.root.destroy()


if __name__ == "__main__":
    root = tk.Tk()
    app = ModbusApp(root)
    root.protocol("WM_DELETE_WINDOW", app.on_close)
    root.mainloop()