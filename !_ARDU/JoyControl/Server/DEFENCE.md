| Вариант | Как работает | Сложность обхода | Минусы | Рекомендую для твоего проекта? |
|---------|--------------|-------------------|--------|--------------------------------|
| 1. Текущий (MachineGuid + VolumeSerial) | HWID = SHA256(MachineGuid + VolumeSerial C:) | Средний | Сброс реестра + форматирование C: | Да (уже хорошо) |
| 2. Добавить ProcessorId + Motherboard Serial | HWID = SHA256(MachineGuid + VolumeSerial + ProcessorId + BaseBoardSerial) | Высокий | Требует WMI, может не работать на некоторых ПК | Да, если хочешь +1 уровень |
| 3. Привязка к MAC-адресу сетевой карты | Добавь в HWID MAC основного адаптера | Средний-высокий | Легко меняется в виртуалках, но сложно на реальном ПК | Можно добавить |
| 4. Серверная проверка на частоту создания триалов | Если один IP создал > N триалов за день → бан IP | Средний | Ложные блокировки (один роутер — много пользователей) | Нет, рискованно |
| 5. Привязка к аккаунту + email-подтверждение | Требуй подтверждение email при каждом новом триале | Высокий | Усложняет UX | Нет, для игр слишком жёстко |
| 6. Аппаратная привязка (TPM, Secure Boot) | Использовать TPM 2.0 для генерации уникального ключа | Очень высокий | Не все ПК имеют TPM, сложный код | Нет |

(Processor ID + MachineGuid + VolumeSerial C:)

```c#
private static string GetOrCreateDeviceId()
{
var components = new List<string?>();

    // 1. MachineGuid — самый стабильный
    try {
        components.Add(Registry.GetValue(
            @"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Cryptography",
            "MachineGuid", null)?.ToString());
    } catch { }

    // 2. Volume Serial C:
    try {
        var drive = new DriveInfo("C");
        components.Add(drive.VolumeSerialNumber);
    } catch { }

    // 3. Processor ID — сильно усложняет сброс
    try {
        var searcher = new System.Management.ManagementObjectSearcher("SELECT ProcessorId FROM Win32_Processor");
        foreach (var obj in searcher.Get()) {
            components.Add(obj["ProcessorId"]?.ToString());
            break; // берём первый процессор
        }
    } catch { }

    // 4. Если ничего не собрали — случайный GUID
    string combined = string.Join("", components.Where(c => !string.IsNullOrEmpty(c)));
    if (string.IsNullOrWhiteSpace(combined)) {
        combined = Guid.NewGuid().ToString();
    }

    return ComputeSha256(combined);
}
```