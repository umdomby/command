Что делать дальше (пошагово):

Сделай видимым Hardware Catalog (если его нет справа)
→ В меню сверху: View → Catalog (или нажми иконку с двумя стрелками в панели инструментов).
Добавь CP 343-1 (это нужно для Ethernet PG/OP)
В правой панели Hardware Catalog раскрой:
SIMATIC 300 → CP-300 → Industrial Ethernet

Найди CP 343-1 (лучше всего CP 343-1 Lean или просто CP 343-1)
Перетащи его мышкой в слот 4 (пустое место после CPU).
После добавления должно выглядеть примерно так:
Slot 2: CPU 315-2 PN/DP
Slot 4: CP 343-1

Настрой IP-адрес на CP 343-1
Дважды кликни на CP 343-1 (в слоте 4)
Перейди на вкладку Ethernet Interface (или X1, Properties)
Поставь галочку IP address
Введи:
IP-Address: 192.168.0.1
Subnet mask: 255.255.255.0

Нажми OK

Сохрани конфигурацию
В меню: Station → Save and Compile (или кнопка с дискетой)


В главном окне Hardware Configuration нажми:
Station → Save and Compile
(или кнопку с дискетой + Compile)

Должно появиться сообщение, что всё успешно скомпилировано. Нажми OK.


В открытом окне Properties - CP 343-1 Lean найди кнопку Properties... (она справа от надписи Networked: No).
Нажми на эту кнопку Properties...
Откроется новое окно Properties – Ethernet Interface или Subnet.
В этом окне нажми кнопку New… (или Add / Create)
Дай имя подсети, например Ethernet_SLIO и нажми OK.
После этого в поле Networked должно появиться название твоей новой подсети.
Нажми OK в окне Properties CP 343-1.
Теперь в главном окне HW Config нажми Station → Save and Compile