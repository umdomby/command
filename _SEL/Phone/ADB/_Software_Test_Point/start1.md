Программа: Huawei_HiSilicon_FRP_Remove_Tool_v3.1 (2025) или HiSilicon SPTool 2024
# Software Test Point — какие процессоры и режимы (2025 год)

| Производитель       | Процессоры / чипы                              | Режим после замыкания тест-поинта         | Порт в диспетчере устройств (Windows)        | Основные инструменты для работы                     |
|---------------------|------------------------------------------------|--------------------------------------------|-----------------------------------------------|-----------------------------------------------------|
| **MediaTek**        | MT6261, MT65xx, MT67xx, MT68xx, MT69xx, Helio G/P/X, Dimensity | **BROM** (BootROM)                         | MediaTek Preloader USB VCOM → BROM            | mtkclient, SP Flash Tool (после обхода SLA), Kamakiri |
| **Qualcomm**        | Snapdragon 200–8 Gen 3, 8 Elite                | **EDL** (Emergency Download Mode, Qualcomm HS-USB QDLoader 9008) | Qualcomm HS-USB QDLoader 9008 (COMxx)         | QPST, QFIL, MiFlash, Hydra Tool, UFI Box, Pandora   |
| **HiSilicon (Huawei/Honor)** | Kirin 620, 650, 659, 710, 960, 970–990   | **Manufacture Mode / FastbootD**           | HUAWEI USB COM 1.0 (COMxx)                    | HiSilicon FRP Tool, HCU Client, DC-Phoenix, Ministry Tool |
| **Unisoc / Spreadtrum** | SC7715, SC7731, SC9832, SC9863, Tiger T3xx/T6xx/T7xx | **DL Mode / SPRD BootROM**             | Spreadtrum Phone / SciU2S U2S USB (COMxx)     | ResearchDownload, UpgradeDownload, SPD Factory Tool |
| **Samsung Exynos**  | Exynos 7570, 7870, 8890, 9810, 990, 2200 и др. | **Download Mode** (иногда через тест-поинт) | Samsung Download Mode или COM-порт            | Odin3 (обычно без тест-поинта)                      |
| **Rockchip**        | RK30xx, RK31xx, RK33xx                         | **MaskROM Mode**                           | Rockchip USB Loader                           | RKDevTool, AndroidTool                             |
| **Allwinner**       | A10, A20, A64, A83T и др.                      | **FEL Mode**                               | Allwinner USB FEL                             | PhoenixUSBPro, LiveSuit                             |

### Важные заметки 2025 года
- На всех MediaTek 2020+ (включая твой Redmi 9 lancelot) тест-поинт — единственный 100%-ный способ попасть в BROM при включённом SLA/DAA.
- На новых Snapdragon 8 Gen 2/3 и выше (2023–2025) тест-поинт часто убрали с платы — остаётся только программный EDL через ADB.
- На Huawei/Honor после 2020 года (Kirin 9000+) тест-поинт убрали почти полностью — только старые модели до Kirin 990.