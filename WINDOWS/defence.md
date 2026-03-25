netsh advfirewall set allprofiles state off
netsh advfirewall set allprofiles state on


reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" /v "ConsentPromptBehaviorAdmin" /t REG_DWORD /d 0 /f