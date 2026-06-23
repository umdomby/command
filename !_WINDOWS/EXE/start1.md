C:\Users\user\AppData\Local\MSIV_QR_CLIENT_REAL

dotnet clean
dotnet publish -c Release -r win-x64 --self-contained true
dotnet publish -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true -o ./publish
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishAot=true -o ./publish

dotnet publish -c Release -r win-x64 --self-contained true /p:PublishAot=true /p:PublishSingleFile=true -o ./publish

# no AOT
dotnet publish -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true /p:IncludeNativeLibrariesForSelfExtract=true /p:IncludeAllContentForSelfExtract=true /p:EnableCompressionInSingleFile=true -o ./publish

# AOT
dotnet publish -c Release -r win-x64 --self-contained true /p:PublishAOT=true /p:PublishSingleFile=true /p:IncludeNativeLibrariesForSelfExtract=true /p:EnableCompressionInSingleFile=true -o ./publish
## ЭТА
dotnet publish -c Release -r win-x64 --self-contained true /p:PublishAOT=true /p:PublishSingleFile=true /p:IncludeNativeLibrariesForSelfExtract=true /p:IncludeAllContentForSelfExtract=true /p:EnableCompressionInSingleFile=true -o ./publish

dotnet publish -c Release -r win-x64 --self-contained true

dotnet publish -c Release -r win-x64 --self-contained true --property:PublishSingleFile=true --property:IncludeAllContentForSelfExtract=true

### LOG
.\picoCam-303C.exe 2>&1 | Out-File -Encoding utf8 error.log
type error.log


EXEC : error Failed to load assembly 'DockPanelSuite'  - я могу заменить 'DockPanelSuite' на более стабильно Native AOT без переписывания кода?





dotnet publish -c Release -r win-x64 --self-contained true

Установи ILSpy или dnSpy или dnSpyEx, → открой JoyControl.exe
GitHub: https://github.com/dnSpyEx/dnSpy/releases

dumpbin /headers "JoyControl.exe" | findstr machine

dumpbin /disasm "JoyControl.exe" | more


#### GHIDRA ####

Официальный сайт NSA с описанием и ссылками:
https://www.nsa.gov/ghidra/

https://github.com/NationalSecurityAgency/ghidra/releases
# JDK
https://adoptium.net/temurin/releases/?version=21

# плагин для .NET Native AOT
https://github.com/Washi1337/ghidra-nativeaot


Пошаговая установка плагина ghidra-nativeaot:

В открытом меню File выбери Install Extensions (как на твоём скриншоте).
Откроется окно Install Extensions.
В этом окне нажми кнопку + (Add Extension) в правом верхнем углу.
Выбери скачанный ZIP-файл плагина:
ghidra-nativeaot-v1.1.0.zip (или как он у тебя называется).

Нажми OK.
Поставь галочку напротив появившегося плагина NativeAOT.
Нажми OK внизу окна.
Ghidra предложит перезапуститься — нажми Yes.


После перезапуска Ghidra:

Открой свой проект.
Выбери picoCam-303C.exe.
Сделай Analysis → Clear Analysis (чтобы очистить старый анализ).
Затем Analysis → Auto Analyze...
В списке анализаторов найди и включи NativeAOT (или .NET NativeAOT).
Нажми Analyze.

После этого в Symbol Tree → Classes и Namespaces должно появиться намного больше информации.

# AOT
dotnet publish -c Release -r win-x64 --self-contained true


Добавь Java в PATH (самый важный шаг — без этого Ghidra не найдёт java.exe):
Нажми Win + S → введи "Переменные среды" → открой Изменение системных переменных среды.
В разделе Системные переменные (нижняя часть) → найди переменную Path → Изменить.
Нажми Создать → добавь путь к bin папке JDK:
Для Adoptium: C:\Program Files\Eclipse Adoptium\jdk-21.0.x-hotspot\bin
(точный путь проверь в проводнике после установки).
Для Oracle: C:\Program Files\Java\jdk-21.x.x\bin

Нажми OK → OK → OK (все окна).
Перезагрузи компьютер или хотя бы закрой/открой PowerShell/CMD (чтобы PATH обновился).
Альтернатива: укажи JAVA_HOME (некоторые предпочитают):
В тех же Системных переменных → Создать новую переменную:
Имя: JAVA_HOME
Значение: C:\Program Files\Eclipse Adoptium\jdk-21.0.x-hotspot (без \bin!)

Затем в Path добавь %JAVA_HOME%\bin

Проверь, что Java работает:
Открой новую PowerShell или CMD.
Введи:textjava -version
Должен показать что-то вроде:textopenjdk version "21.0.5" 2024-10-15
OpenJDK Runtime Environment Temurin-21.0.5+11 (build 21.0.5+11)
OpenJDK 64-Bit Server VM Temurin-21.0.5+11 (build 21.0.5+11, mixed mode, sharing)
Если ошибка — вернись к шагу 3, проверь путь.

Запусти Ghidra заново:
Перейди в распакованную папку Ghidra → запусти ghidraRun.bat.
Если всё ок — откроется Ghidra.


Если Ghidra всё равно ругается на версию

Убедись, что это именно JDK 21 (не 17, не 22 — некоторые версии Ghidra строгие к диапазону [21+]).
Если предлагает ввести путь вручную — укажи папку JDK (не bin!): например C:\Program Files\Eclipse Adoptium\jdk-21.0.5+11-hotspot.