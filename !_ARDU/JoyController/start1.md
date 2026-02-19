###
# Выполни команду (в Developer PowerShell / обычном терминале в папке проекта):
dotnet clean
dotnet build
dotnet publish -c Release -r win-x64
or
dotnet publish -c Release -r win-x64 -p:PublishAot=true -p:PublishTrimmed=true -p:PublishSingleFile=true

C:\Users\umdom\source\repos\JoyControl\JoyControl\bin\Release\net9.0-windows\win-x64\publish

+ Native-протекторы поверх готового .exe (самый сильный шаг):

# обойти запрет на trimming (рискованно)
<_SuppressWinFormsTrimError>true</_SuppressWinFormsTrimError>

Онлайн-проверки лицензии — твой JWT + HWID остаётся главным барьером. Делай проверки в нескольких местах кода, как обсуждали раньше.

Visual Studio Installer

Source Generation