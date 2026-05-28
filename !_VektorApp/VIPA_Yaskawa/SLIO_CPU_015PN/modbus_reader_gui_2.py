import tkinter as tk
from tkinter import ttk
from pymodbus.client import ModbusTcpClient
import time
import threading

# ==================== НАСТРОЙКИ ====================
IP_ADDRESS = "192.168.1.1"
PORT = 502
REGISTER_ADDRESS = 0          # 40001
DEVICE_ID = 1                 # бывший UNIT_ID / slave
UPDATE_INTERVAL = 500         # ms
# ===================================================

class ModbusApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Modbus TCP Reader — 40001")
        self.root.geometry("680x480")
        self.root.resizable(True, True)
        
        self.client = None
        self.running = False
        self.thread = None
        
        self.create_widgets()

    def create_widgets(self):
        title = tk.Label(self.root, text="Modbus TCP Reader", font=("Arial", 18, "bold"))
        title.pack(pady=10)

        tk.Label(self.root, text=f"IP: {IP_ADDRESS}   Порт: {PORT}   Регистр: 40001 (0)",
                 font=("Arial", 10)).pack(pady=5)

        self.value_label = tk.Label(self.root, text="---", font=("Arial", 42, "bold"), fg="blue")
        self.value_label.pack(pady=30)

        self.signed_label = tk.Label(self.root, text="signed int16: ---", font=("Arial", 14))
        self.signed_label.pack(pady=5)

        self.status_label = tk.Label(self.root, text="Не подключено", font=("Arial", 11), fg="red")
        self.status_label.pack(pady=10)

        btn_frame = tk.Frame(self.root)
        btn_frame.pack(pady=20)
        
        self.start_btn = ttk.Button(btn_frame, text="▶ Запустить", command=self.start_reading)
        self.start_btn.grid(row=0, column=0, padx=10)
        
        self.stop_btn = ttk.Button(btn_frame, text="⏹ Стоп", command=self.stop_reading, state="disabled")
        self.stop_btn.grid(row=0, column=1, padx=10)
        
        ttk.Button(btn_frame, text="Выход", command=self.on_close).grid(row=0, column=2, padx=10)

    def connect(self):
        try:
            if self.client is None:
                self.client = ModbusTcpClient(
                    host=IP_ADDRESS, 
                    port=PORT, 
                    timeout=3
                )
            
            if not self.client.connect():
                self.update_status("❌ Не удалось подключиться", "red")
                return False

            self.update_status("✅ Подключено успешно", "green")
            return True
        except Exception as e:
            self.update_status(f"Ошибка подключения: {e}", "red")
            return False

    def read_loop(self):
        while self.running:
            try:
                if not self.client or not self.client.is_socket_open():
                    if not self.connect():
                        time.sleep(2)
                        continue

                # Для pymodbus 3.13+ используем device_id=
                response = self.client.read_holding_registers(
                    address=REGISTER_ADDRESS,
                    count=1,
                    device_id=DEVICE_ID
                )

                if response.isError():
                    self.root.after(0, self.update_status, f"Modbus ошибка: {response}", "orange")
                else:
                    value = response.registers[0]
                    signed = value if value < 32768 else value - 65536
                    
                    self.root.after(0, self.update_display, value, signed)

            except Exception as e:
                self.root.after(0, self.update_status, f"Ошибка: {str(e)[:90]}", "red")
            
            time.sleep(UPDATE_INTERVAL / 1000)

    def update_display(self, value, signed):
        self.value_label.config(text=str(value), fg="green")
        self.signed_label.config(text=f"signed int16: {signed}  (0x{value:04X})")

    def update_status(self, text, color="black"):
        self.status_label.config(text=text, fg=color)

    def start_reading(self):
        if self.running: 
            return
        self.running = True
        self.start_btn.config(state="disabled")
        self.stop_btn.config(state="normal")
        self.update_status("Чтение запущено...", "blue")

        self.thread = threading.Thread(target=self.read_loop, daemon=True)
        self.thread.start()

    def stop_reading(self):
        self.running = False
        self.start_btn.config(state="normal")
        self.stop_btn.config(state="disabled")
        self.update_status("Остановлено", "orange")

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