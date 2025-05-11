1. Проверьте наличие Python 3
   bash
   python3 --version
   Если Python 3 установлен, вы увидите версию (например, Python 3.10.12).

2. Запустите HTTP-сервер через Python 3
   bash
   python3 -m http.server 3001
3. (Опционально) Свяжите python с python3
   Если хотите использовать короткую команду python вместо python3:

bash
sudo apt update
sudo apt install python-is-python3
После этого команда python будет работать как python3.

# simple server
python -m http.server 3001