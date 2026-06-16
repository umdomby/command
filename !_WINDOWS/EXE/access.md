https://account.live.com/consent/Manage?fn=email


"C:\Users\umdom\Desktop\mydevcert.pfx"
"C:\Users\umdom\source\repos\JoyControl\JoyControl\bin\Release\net9.0-windows\win-x64\publish\JoyControl.exe"

"C:\Program Files (x86)\Windows Kits\10\bin\10.0.26100.0\x64\signtool.exe"



"C:\Program Files (x86)\Windows Kits\10\bin\10.0.26100.0\x64\signtool.exe" sign ^
/f "C:\Users\umdom\Desktop\mydevcert.pfx" ^
/p 123456 ^
/fd SHA256 ^
/tr http://timestamp.digicert.com ^
/td SHA256 ^
/v ^
"C:\Users\umdom\source\repos\JoyControl\JoyControl\bin\Release\net9.0-windows\win-x64\publish\JoyControl.exe"





Если знаешь реальный SHA256 — обязательно вставь (это сильно ускоряет обработку).
Посчитать можно в PowerShell (открой PowerShell в папке с файлом):

Get-FileHash .\JoyControl.exe -Algorithm SHA256

https://www.microsoft.com/en-us/wdsi/filesubmission
SmartScreen reputation block / unknown publisher

This is my own developed .NET 9 AOT single-file executable (JoyControl.exe) — a legitimate gamepad / joystick emulator for Windows using the open-source Nefarius.ViGEm.Client library (ViGEmBus).
The application is signed with a self-signed certificate for development and testing purposes only. It is not malware, PUA or any malicious software.
Scanned clean on VirusTotal (no detections). No network activity, no suspicious behavior.
Please review the file and improve its reputation in Microsoft Defender SmartScreen to remove the "unknown publisher" warning for legitimate users.
SHA256: 36E40BFE419A74D585B5814521FA283BADD604FB7BA4FCFEE913D74B3D50B69F

https://www.microsoft.com/en-us/wdsi/submission/c9dbedf0-8b1a-4b65-8a7e-42a200dc3cd1
joycontrol.exeSubmission ID: c9dbedf0-8b1a-4b65-8a7e-42a200dc3cd1Status: SubmittedSubmitted by: umdom2@gmail.comSubmitted: Mar 6, 2026 17:46:28User Opinion: Incorrect detectionAnalyst comments:



cmd
cd %ProgramFiles%\Windows Defender
MpCmdRun.exe -removedefinitions -dynamicsignatures
MpCmdRun.exe -SignatureUpdate