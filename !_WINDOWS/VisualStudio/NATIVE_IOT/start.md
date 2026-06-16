https://favicon.io/favicon-generator/
dotnet publish -c Release -r win-x64

```
public Form1()
{
    InitializeComponent();
    
    // === Явная загрузка иконки (важно для AOT) ===
    try
    {
        if (File.Exists("icon.ico"))
        {
            this.Icon = new Icon("icon.ico");
        }
    }
    catch { }

    SetupBaseUI();
    LoadSettings();
}
```
```
// === JSON Source Generation для AOT ===
[JsonSerializable(typeof(ServerSettings))]
[JsonSerializable(typeof(List<PortState>))]
[JsonSerializable(typeof(PortState))]
[JsonSourceGenerationOptions(WriteIndented = true)]
internal partial class AppJsonContext : JsonSerializerContext { }
```
```
private void SaveSettings()
{
    if (isLoading) return;

    var s = new ServerSettings
    {
        MinToTray = chkMinToTray.Checked,
        Ports = serverRows.Select(r => new PortState
        {
            Port = int.Parse(r.TxtPort.Text),
            BaudRate = (int)r.CmbBaud.SelectedItem,
            IsOpen = r.IsRunning,
            ComName = r.CmbComPort.SelectedItem?.ToString() ?? r.SelectedCom,
            ForwardComToTcp = r.ChkForwardComToTcp.Checked,
            ForwardTcpToCom = r.ChkForwardTcpToCom.Checked
        }).ToList()
    };

    try
    {
        var options = new JsonSerializerOptions { WriteIndented = true };
        string json = JsonSerializer.Serialize(s, AppJsonContext.Default.ServerSettings);
        File.WriteAllText("server_settings.json", json);
    }
    catch (Exception ex)
    {
        LogTcp($"[!] Ошибка сохранения: {ex.Message}");
    }
}

private void LoadSettings()
{
    isLoading = true;

    if (File.Exists("server_settings.json"))
    {
        try
        {
            string json = File.ReadAllText("server_settings.json");
            var s = JsonSerializer.Deserialize(json, AppJsonContext.Default.ServerSettings);

            if (s != null)
            {
                chkMinToTray.Checked = s.MinToTray;

                foreach (var p in s.Ports)
                {
                    AddServerRow(p.Port, p.BaudRate, p.ComName);
                    var last = serverRows.Last();

                    last.ChkForwardComToTcp.Checked = p.ForwardComToTcp;
                    last.ChkForwardTcpToCom.Checked = p.ForwardTcpToCom;

                    if (p.IsOpen && last.CmbComPort.Items.Contains(p.ComName))
                    {
                        last.CmbComPort.SelectedItem = p.ComName;
                        last.CmbBaud.SelectedItem = p.BaudRate;
                        ToggleServer(last);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            LogTcp($"[!] Ошибка загрузки настроек: {ex.Message}");
            try { File.Delete("server_settings.json"); } catch { }
        }
    }

    isLoading = false;
}
```