Как подключить и запустить

Подключите SRR8200 (IN-порт) к порту с TwinCAT real-time driver (Intel I210).
Скачайте ESI-файл (EtherCAT Slave Information) для SRR8200 с сайта Sinsegye (help.sinsegye.com или их техническая поддержка). Если нет — обратитесь к производителю.
В TwinCAT 3 (System Manager):
Добавьте устройство → EtherCAT → EtherCAT Master.
Сканируйте шину (Scan или Automatic Configuration).
Или вручную импортируйте ESI-файл.

Подключайте дальше модули ввода/вывода серии SRR (цифровые/аналоговые и т.д.).