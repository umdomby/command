dotnet clean
dotnet publish -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true -o ./publish

dotnet publish -c Release -r win-x64 --self-contained true /p:PublishAot=true /p:PublishSingleFile=true -o ./publish


EXEC : error Failed to load assembly 'DockPanelSuite'  - я могу заменить 'DockPanelSuite' на более стабильно Native AOT без переписывания кода?


Альтернатива — удалить DockPanelSuite и сделать обычный SplitContainer с панелями (как у вас уже есть _splitContainer). Но это много работы. Проще отключить AOT.
дай краткие изменения для преобразования в обычный SplitContainer 

Заменить DockPanelSuite на TabControl