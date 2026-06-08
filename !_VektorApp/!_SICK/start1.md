### Поддержка параметров в GigE Vision (GenICam)

| Параметр                      | Поддержка              | Как настраивается                                      |
|-------------------------------|------------------------|--------------------------------------------------------|
| **Разрешение (Width/Height)** | Полностью              | Через ROI (`Width`, `Height`, `OffsetX`, `OffsetY`)   |
| **Экспозиция (Exposure)**     | Полностью              | `ExposureTime`, `ExposureAuto`                         |
| **FPS (частота кадров)**      | Полностью              | `AcquisitionFrameRate`, `AcquisitionMode`              |
| **Усиление (Gain)**           | Полностью              | `Gain`, `GainAuto`                                     |
| **Pixel Format**              | Полностью              | `Mono8`, `BayerRG8`, `RGB8` и другие                   |
| **Триггер**                   | Полностью              | `TriggerMode`, `TriggerSource`, `TriggerDelay` и др.  |
| **ROI**                       | Полностью              | Полная поддержка                                       |
| **Другие параметры**          | Полностью              | Баланс белого, Sharpness, Gamma, Saturation и т.д.    |