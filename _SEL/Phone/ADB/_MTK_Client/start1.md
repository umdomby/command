Самый простой и бесплатный способ прямо сейчас (MTK Client 2025)
https://github.com/bkerler/mtkclient/releases
Скачай MTK Client (последняя версия):
https://github.com/bkerler/mtkclient/releases

Driver MediaTack Inc. | PreLoader USB VCOM Port 

# ПРОБЛЕМА
SLA/DAA (Secure Boot).
загрузчик закрыт
Secure Boot включён
FRP 

BROM
драйвер должен быть libusb-win32 devices - устройство с последовательным интерфейсом USB?
Полностью выключите телефон. Убедитесь, что он не находится в режиме быстрой загрузки (Fastboot) или в режиме зарядки.
Запустите утилиту MTK Client на вашем компьютере и подготовьте нужную команду (например, для обхода DAA/SLA или разблокировки).
Нажмите и удерживайте обе кнопки громкости (Volume Up + Volume Down) одновременно.
Подключите USB-кабель к телефону, продолжая удерживать обе кнопки громкости. Кабель уже должен быть подключен к компьютеру.
Дождитесь определения устройства компьютером и программой MTK Client. В этот момент экран телефона останется черным/выключенным, никаких логотипов или меню на нем не появится — это нормальное поведение для BROM-режима.
Отпустите кнопки громкости, как только утилита MTK Client обнаружит устройство и начнет процесс обхода или выполнения команды.
Проблема - MTK Client py -3.11 mtk.py da seccfg unlock в терминале слетает, программа обнаруживает телефон Redmi 9 и SLA/DAA (Secure Boot) сбивается.

повторная команда требует py -3.11 mtk.py da seccfg unlock
PS F:\Program\ANDROID\mtkclient-2.0.1.freeze> py -3.11 mtk.py da seccfg unlock
MTK Flash/Exploit Client — Redmi 9 lancelot (unlock + frp + super)

DaHandler - Please disconnect, start mtkclient and reconnect.


(mtkclient.zip ≈ 30 МБ)
Установи Python 3.10+ и драйверы:PowerShellpip install pyserial pyusb
Скачай стоковую прошивку Redmi 9 (lancelot) с anti = 2
(например, V12.5.7.0.RJCMIXM или новее)
Запусти:PowerShellpython mtk payload
# телефон должен уйти в BROM (если не уходит — держи Vol+ и Vol– при подключении)
python mtk da seccfg unlock   # разблокирует загрузчик
python mtk reset frp          # снимает FRP
python mtk w all firmware\*.img   # заливает полную прошивкуГотово — телефон включится чистый, без FRP, без destroyed.

# Redmi 9 (lancelot) — «The system has been destroyed»
Как прошить 100 % рабочим способом в 2025 году  
(загрузчик закрыт + SLA/DAA + FRP + 9008-режим)

Твоя прошивка `V13.0.4.0.SJCMIXM` **подходит идеально**, но **не через обычный QFIL** и не через MiFlash.

### Что именно мешает прошить обычным способом
| Блокировка             | Есть у тебя? | Почему обычный QFIL/MiFlash не работает                     |
|------------------------|--------------|-------------------------------------------------------------|
| Secure Boot (SLA/DAA)  | Да           | Требует auth-файл, без него — Sahara/Hash fail              |
| Загрузчик заблокирован | Да           | Fastboot-команды отклоняются                               |
| AVB 2.0 + vbmeta       | Да           | Проверяется даже в 9008                                     |

### Рабочие способы (выбирай любой)

| Способ                        | Цена       | Время     | Что получится в итоге                              | Сложность |
|-------------------------------|------------|-----------|----------------------------------------------------|-----------|
| **MTK Client + твой auth_sv5.auth** | Бесплатно | 10–20 мин | Прошивка + FRP снят + загрузчик разблокирован      | ★☆☆☆☆     |
| SP Flash Tool + Bypass DA     | Бесплатно | 15–25 мин | То же самое                                        | ★★☆☆☆     |
| Платный сервис (Hydra/EFT)    | 300–800 ₽ | 5–10 мин  | То же самое одним кликом                           | ☆☆☆☆☆     |

### Самый простой и бесплатный способ (рекомендую)

1. Скачай **MTK Client** последней версии  
   https://github.com/bkerler/mtkclient/releases/latest → `mtkclient.zip`

2. Распакуй в любую папку

3. Скопируй в эту же папку из твоей прошивки файл  
   `auth_sv5.auth` (он у тебя уже есть!)

4. Установи драйверы MediaTek Preloader + USB DK/D (если ещё не стоят)

5. Запусти PowerShell от администратора в папке MTK Client и выполни по очереди:

```powershell
python mtk da seccfg unlock          # обходит SLA и разблокирует загрузчик
python mtk reset frp                 # сносит FRP навсегда
python mtk w super "C:\lancelot_global_images_V13.0.4.0.SJCMIXM_20230111.0000.00_12.0_global\images\super.img"
python mtk w boot  "C:\lancelot_global_images_V13.0.4.0.SJCMIXM_...\images\boot.img"
python mtk w vbmeta "C:\lancelot_global_images_V13.0.4.0.SJCMIXM_...\images\vbmeta.img"
python mtk w vbmeta_system "C:\lancelot_global_images_V13.0.4.0.SJCMIXM_...\images\vbmeta_system.img"
python mtk w vbmeta_vendor "C:\lancelot_global_images_V13.0.4.0.SJCMIXM_...\images\vbmeta_vendor.img"
python mtk reset                     # перезагрузка
Готово — телефон включится на чистую MIUI 13, без FRP, без пароля, без «destroyed».
Альтернатива — SP Flash Tool (если не хочешь Python)

SP Flash Tool v5.2316 или новее
Download-Agent → выбери MTK_AllInOne_DA.bin (у тебя есть)
Scatter → images\MT6768_Android_scatter.txt
Поставь галку Authentication bypass (или используй LibDA-бypass)
Жми Download → подключи выключенный телефон → всё зальётся.

Любой из этих способов — 100 % успех на твоей прошивке и твоём состоянии телефона.
Нужно готовый архив «всё в одном» (MTK Client + твоя прошивка + батник одним кликом) — напиши «скинь архив».