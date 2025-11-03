AMD Ryzen 7 7700 8-Core Processor               (3.80 GHz)
Nvidia GeForce 4070 SUPER
Memory 2x16 4800MHz
AsusTek TUF GAMING B650-PLUS + 2 выхода на мониторы, + 4 Nvidia GeForce 4070 SUPER
задача нужно отключать мониторы на Nvidia GeForce 4070 SUPER, чтобы был максимальный FPS в гоночках Grid Legends
проблема, можно отключать в панели управления NVIDIA, но потом как их включаешь настройки сбиваются и нужно настраивать их по новому,
в игре есть полноэкранный режим, но например выйти с полного экрана игры изменить музыку, идет нагрузка на систему.
Я хочу чтобы можно было легко отключить 3 нужных монитора для стабильной игры в Grid Legends, а потом включить с настройками которые были.

сколько будет FPS на максимальных настройках в Grid Legends ?
и на минимальных

3. Как повысить выше 200 FPS?
   Настройка	+FPS	Как сделать
   PBO Enable	+10-20 FPS	BIOS → AMD Overclocking → PBO Advanced
   RAM XMP	+5-15 FPS	BIOS → Ai Tweaker → XMP Profile 1
   Windows Tweaks	+10 FPS	Отключить Game Mode + High Performance
   Process Lasso	+5-10 FPS	Приоритет CPU → High
   DLSS/FSR	+20%	В игре: FSR Performance

Если всё правильно настроить (PBO ON, XMP 4800MHz, NVIDIA Reflex ON, V-Sync OFF, свежие драйверы 566.xx+), 
в Grid Legends на максимальных (Ultra/High) настройках при 1920x1080 ожидается:

Acer 24.5" Монитор XV250QF3bmiiprx IPS, 320Hz, 1920х1080, черный

- Войдите в BIOS (Del при загрузке).
- Precision Boost Overdrive (PBO) → Advanced → Enabled (PPT 120W, TDC 90A).
- Curve Optimizer → All Core Negative 20-30 (тестируйте стабильность Cinebench).
- Результат: All-core 4.8-5.1 GHz sustained → меньше троттлинг.
- NVIDIA Control Panel:
    * Low Latency Mode → Ultra.
    * Max Frame Rate → OFF (или 317 для теста).
    * V-Sync → OFF, G-Sync → ON (если монитор поддерживает).
- В игре:
    * NVIDIA Reflex → ON + Boost.
    * FSR 2.0 → OFF (max графика).
    * V-Sync → OFF.
- Результат: Стабильные frametime, нет tearing на 320Hz.
- - Power Plan → High Performance + HAGS (ON в Graphics Settings).
- Отключите: Game Bar, Background Apps, Xbox Game DVR.
- Драйверы: 566.xx+ (GeForce Experience).
- MSI Afterburner: Cap FPS OFF, RTSS для мониторинга.