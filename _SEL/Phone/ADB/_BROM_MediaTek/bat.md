@echo off
cd /d "F:\Program\ANDROID\mtkclient-2.0.1.freeze"
echo.
echo === Снятие SLA/DAA и разблокировка загрузчика ===
echo Подключи ВЫКЛЮЧЕННЫЙ телефон и нажми Enter
pause
python -m mtkclient da seccfg unlock
echo.
echo === Удаление FRP ===
echo Подключи ещё раз выключенный телефон и нажми Enter
pause
python -m mtkclient reset frp
echo.
echo === Заливка системы (это долго) ===
python -m mtkclient w super "C:\lancelot_global_images_V13.0.4.0.SJCMIXM_20230111.0000.00_12.0_global\images\super.img"
python -m mtkclient w vbmeta "C:\lancelot_global_images_V13.0.4.0.SJCMIXM_...\images\vbmeta.img"
python -m mtkclient w vbmeta_system "C:\lancelot_global_images_V13.0.4.0.SJCMIXM_...\images\vbmeta_system.img"
python -m mtkclient w vbmeta_vendor "C:\lancelot_global_images_V13.0.4.0.SJCMIXM_...\images\vbmeta_vendor.img"
echo.
echo === Перезагрузка ===
python -m mtkclient reset
echo ГОТОВО! Телефон живой, чистый и открытый.
pause