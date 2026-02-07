@echo off
cd /d "F:\GridLegends"
start "" "GridLegends.exe"
:loop
tasklist /fi "imagename eq GridLegends.exe" 2>NUL | find /i "GridLegends.exe" >NUL
if "%errorlevel%"=="0" (timeout /t 3 /nobreak >NUL & goto loop)
tasklist /fi "imagename eq GridLegends-Win64-Shipping.exe" 2>NUL | find /i "GridLegends-Win64-Shipping.exe" >NUL
if "%errorlevel%"=="0" (timeout /t 3 /nobreak >NUL & goto loop)
tasklist /fi "imagename eq EasyAntiCheat.exe" 2>NUL | find /i "EasyAntiCheat.exe" >NUL
if "%errorlevel%"=="0" (timeout /t 3 /nobreak >NUL & goto loop)
exit