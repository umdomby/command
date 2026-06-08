picoCam-303C I2D303C-RCA11
и
MV-CS016-10GC  
MV-CS020-10GC  

| Параметр                  | picoCam-303C (SICK)              | MV-CS016 / MV-CS020 (Hikrobot)              |
|---------------------------|----------------------------------|---------------------------------------------|
| **SDK**                   | uEye (IDS)                       | MvCameraControl (Hikrobot)                  |
| **Библиотека**            | `uEyeDotNet.dll`                 | `MvCameraControl.Net.dll`                   |
| **Способ подключения**    | `uEye.Camera`                    | `DeviceEnumerator` + `DeviceFactory`        |
| **Разрешение по умолчанию** | 1936×1216                      | 1440×1080 или 1920×1200 (зависит от модели)|
| **Управление параметрами**| uEye API                         | GenICam (через `Parameters`)                |
| **ROI / Width/Height**    | Через uEye                       | Через `Width`, `Height`, `OffsetX/Y`        |

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


https://www.hikrobotics.com/en/machinevision/productdetail/?id=5091

https://www.hikrobotics.com/en/machinevision/service/download/