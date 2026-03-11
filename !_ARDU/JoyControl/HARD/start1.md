// LicenseService.cs → GetOrCreateDeviceId()
private static string GetOrCreateDeviceId()
{
string? guid = null;
try
{
guid = Registry.GetValue(
@"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Cryptography",
"MachineGuid", null)?.ToString();
}
catch { }

    guid ??= Guid.NewGuid().ToString();
    return ComputeSha256(guid);   // SHA256 → 64 символа hex lowercase
}

Это уникальный отпечаток Windows-машины. Меняется только при переустановке Windows или очень серьёзной смене железа.
Отправляется в каждом запросе (login, validate, heartbeat).
Где хранится на сервере:
joy_licenses.deviceId (строка).
Когда проверяется:

/validate
/heartbeat