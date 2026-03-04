Установи ILSpy или dnSpy или dnSpyEx, → открой JoyControl.exe
GitHub: https://github.com/dnSpyEx/dnSpy/releases

dumpbin /headers "JoyControl.exe" | findstr machine

dumpbin /disasm "JoyControl.exe" | more


#### GHIDRA ####

Официальный сайт NSA с описанием и ссылками:
https://www.nsa.gov/ghidra/
https://github.com/NationalSecurityAgency/ghidra/releases
# плагин для .NET Native AOT
https://github.com/Washi1337/ghidra-nativeaot


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