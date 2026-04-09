Microsoft.ML.OnnxRuntime.Gpu 1.24.4 кастомная сборка с поддержкой  sm_120

Самая простая и рекомендуемая — собрать самому (это официальный способ для кастомных архитектур).
Клонируй репозиторий:Bash
git clone --recursive https://github.com/microsoft/onnxruntime.git
cd onnxruntime
git checkout v1.24.4   # или rel-1.24.4
На Windows используй команду сборки с поддержкой C# и sm_120 (пример для CUDA 12.x / 13.x):bat


Visual Studio 2022 Community заново через Visual Studio Installer:

Убедись, что выбран Desktop development with C++
Обязательно поставь MSVC v143 - VS 2022 C++ x64/x86 build tools (latest)

```dev_vs2022
cd C:\_GIT\onnxruntime
rmdir /s /q build

.\build.bat --config=Release ^
  --build_shared_lib ^
  --build_csharp ^
  --build_nuget ^
  --use_cuda ^
  --cuda_version=13.2 ^
  --cuda_home "C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v13.2" ^
  --cudnn_home "C:\Program Files\NVIDIA\CUDNN\v9.20" ^
  --cmake_generator "Visual Studio 17 2022" ^
  --cmake_extra_defines "CMAKE_CUDA_ARCHITECTURES=120" "CMAKE_CXX_FLAGS=/Zc:preprocessor /wd4211 /WX-" "CMAKE_CUDA_FLAGS=-Xcompiler /Zc:preprocessor -Xcompiler /wd4211 -Xcompiler /WX- --Wno-error" ^
  --parallel 4 ^
  --skip_tests
````
```dev_vs2022
.\build.bat --config=Release ^
  --build_shared_lib --build_csharp --build_nuget ^
  --use_cuda --cuda_version=13.2 ^
  --cuda_home "C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v13.2" ^
  --cudnn_home "C:\Program Files\NVIDIA\CUDNN\v9.20" ^
  --cmake_extra_defines "CMAKE_CUDA_ARCHITECTURES=120" "CMAKE_CXX_FLAGS=/Zc:preprocessor /wd4211 /WX-" "CMAKE_CUDA_FLAGS=-Xcompiler /Zc:preprocessor -Xcompiler /wd4211 -Xcompiler /WX- --Wno-error" ^
  --disable_contrib_ops ^
  --skip_tests
```

```cmd
.\build.bat --config Release ^
  --build_shared_lib --build_csharp --build_nuget ^
  --use_cuda --cuda_version 13.2 ^
  --cuda_home "C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v13.2" ^
  --cudnn_home "C:\Program Files\NVIDIA\CUDNN\v9.20" ^
  --cmake_extra_defines "CMAKE_CUDA_ARCHITECTURES=120" ^
  --cmake_extra_defines "CMAKE_CXX_FLAGS=/Zc:preprocessor /wd4211 /WX-" ^
  --cmake_extra_defines "CMAKE_CUDA_FLAGS=-Xcompiler /Zc:preprocessor -Xcompiler /wd4211 -Xcompiler /WX- --Wno-error" ^
  --disable_contrib_ops ^
  --skip_tests ^
  --parallel 4
```
сделано:`
set CUDNN_HOME=C:\Program Files\NVIDIA\CUDNN\v9.20
set CUDA_PATH=C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v13.2
set PATH=%CUDNN_HOME%\bin;%CUDNN_HOME%\lib\13.2\x64;%PATH%


1. Откуда копировать
   Перейдите в папку:
   C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v13.2\extras\visual_studio_integration\MSBuildExtensions

Там вы увидите файлы:

CUDA 13.2.props

CUDA 13.2.targets

CUDA 13.2.xml

Nvda.Build.CudaTasks.v13.2.dll

2. Куда копировать
   Вам нужно вставить эти файлы в папку BuildCustomizations вашей Visual Studio. Для вашей версии (Community 2022) путь будет таким:
   C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Microsoft\VC\v170\BuildCustomizations

Примечание: Если папки v170 нет, проверьте соседние (например, v160), но для VS 2022 стандарт — это v170.

3. Повторный запуск



```
dumpbin /dependents "C:\Users\user\source\repos\picoCam-303C\picoCam-303C\bin\Debug\net8.0-windows\onnxruntime_providers_cuda.dll"
Это покажет список конкретных имен DLL, которые она ищет.
```
cublasLt64_13.dll
cublas64_13.dll
cudnn64_9.dll

### 
После завершения (теперь это должно занять около 20-30 минут) проверьте папку:
C:\_GIT\onnxruntime\build\Windows\Release\Release

Там должны лежать:

onnxruntime.dll
onnxruntime_providers_cuda.dll (самый важный файл для работы на GPU)
.nupkg файлы (если вы планируете использовать их в C# проекте).

C:\_GIT\onnxruntime\build\Windows\Release\Release

Там должны появиться:
onnxruntime.dll
onnxruntime_providers_cuda.dll
onnxruntime_providers_shared.dll
А где будет NuGet?
Поскольку вы добавили флаг --build_nuget, ищите его здесь:
C:\_GIT\onnxruntime\build\Windows\Release\nuget-artifacts



Это .bat файл — build_custom_gpu.bat, который лежит прямо в корне репозитория (C:\_GIT\onnxruntime\build_custom_gpu.bat).

После успешной сборки NuGet-пакеты будут лежать в:
C:\_GIT\onnxruntime\build\Windows\Release\nuget-artifacts\


Многие пользователи с Blackwell (sm_120) именно так и делают: ставят CUDA 12.8 + cuDNN 9.x и успешно собирают.
Если ты не хочешь менять CUDA, попробуем собрать с дополнительными флагами для стабильности на CUDA 13.2.




Ключевой параметр: --cmake_extra_defines CMAKE_CUDA_ARCHITECTURES=... — обязательно добавь 120.
Если используешь CUDA 13.x, добавь --cuda_version=13.0 (или нужную).

После сборки NuGet-пакет появится в папке build/Windows/Release/Microsoft.ML.OnnxRuntime.Gpu*.nupkg (или аналогично). Установи его локально через dotnet add package с путём к .nupkg.
Готовые кастомные сборки от сообщества (для похожих версий):
На Hugging Face есть сборка 1.24.0 с CUDA 13.0 + sm_120 (Windows):
https://huggingface.co/ussoewwin/onnxruntime-gpu-1.24.0
Там явно указан CMAKE_CUDA_ARCHITECTURES=89;90;120. Можно попробовать использовать DLL-ки вручную или переупаковать в NuGet.
Ищи похожие сборки по запросу «onnxruntime gpu blackwell sm_120 custom» или «onnxruntime 1.24 cuda13 sm_120 nuget».