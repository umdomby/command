#!/usr/bin/env.md python3
# MTK Flash Client — упрощённая версия для Redmi 9 lancelot (без fuse, без конфликтов)

import argparse
import sys
import os

# Автоустановка colorama
try:
    import colorama
except ImportError:
    print("colorama не найден → устанавливаю...")
    os.system(f"{sys.executable} -m pip install colorama --quiet")
    import colorama
    colorama.init()

from mtkclient.Library.mtk_main import Main

info = "MTK Flash/Exploit Client — Redmi 9 lancelot (unlock + frp + super)"

if __name__ == '__main__':
    print(info + "\n")

    parser = argparse.ArgumentParser(description=info, formatter_class=argparse.RawTextHelpFormatter)
    subparsers = parser.add_subparsers(dest="cmd", help="Команды")

    # === da seccfg unlock / lock ===
    parser_da = subparsers.add_parser("da", help="DA команды (unlock, frp и т.д.)")
    da_sub = parser_da.add_subparsers(dest="subcmd")
    da_unlock = da_sub.add_parser("seccfg", help="Разблокировка/блокировка загрузчика")
    da_unlock.add_argument("flag", choices=["unlock", "lock"], help="unlock или lock")

    # === reset (frp или обычная перезагрузка) ===
    parser_reset = subparsers.add_parser("reset", help="Сброс FRP или перезагрузка")
    parser_reset.add_argument("type", nargs="?", default="normal", choices=["frp", "normal"],
                              help="frp — сброс Google, без аргумента — обычная перезагрузка")

    # === write partition ===
    parser_w = subparsers.add_parser("w", help="Запись раздела")
    parser_w.add_argument("partition", help="Имя раздела (super, vbmeta, vbmeta_system, vbmeta_vendor и т.д.)")
    parser_w.add_argument("filename", help="Путь к img-файлу")

    # === общие параметры для всех команд ===
    for p in [parser_da, parser_w, parser_reset]:
        p.add_argument('--preloader', help='preloader.bin (если требуется)')
        p.add_argument('--loader', help='конкретный DA loader')
        p.add_argument('--vid', help='VID устройства')
        p.add_argument('--pid', help='PID устройства')

    args = parser.parse_args()

    if not args.cmd:
        parser.print_help()
        sys.exit(0)

    # Запуск
    mtk = Main(args)
    mtk.run(parser)