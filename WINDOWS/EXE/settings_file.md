# Добавь настройки в проект
Открой Project → Properties → Settings (или правой кнопкой по проекту → Properties → Settings)
Добавь следующие настройки:

Name            Type        Scope       Value
ServerIpForJson string      User        192.168.1.122
ModbusIp        string      User        192.168.1.1



```
namespace SIV_QR_CLIENT_REAL
{
    public static class AppSettings
    {
        public static string ServerIpForQr
        {
            get => Properties.Settings.Default.ServerIpForQr;
            set
            {
                Properties.Settings.Default.ServerIpForQr = value;
                Properties.Settings.Default.Save();
            }
        }

        public static string ServerIpForJson
        {
            get => Properties.Settings.Default.ServerIpForJson;
            set
            {
                Properties.Settings.Default.ServerIpForJson = value;
                Properties.Settings.Default.Save();
            }
        }

        public static string ModbusIp
        {
            get => Properties.Settings.Default.ModbusIp;
            set
            {
                Properties.Settings.Default.ModbusIp = value;
                Properties.Settings.Default.Save();
            }
        }

        public static void SaveAll()
        {
            Properties.Settings.Default.Save();
        }
    }
}
```









