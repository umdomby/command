dotnet clean
dotnet publish -c Release -r win-x64 --self-contained true
dotnet publish -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true -o ./publish
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishAot=true -o ./publish

dotnet publish -c Release -r win-x64 --self-contained true /p:PublishAot=true /p:PublishSingleFile=true -o ./publish

# no AOT
dotnet publish -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true /p:IncludeNativeLibrariesForSelfExtract=true /p:IncludeAllContentForSelfExtract=true /p:EnableCompressionInSingleFile=true -o ./publish

# AOT
dotnet publish -c Release -r win-x64 --self-contained true /p:PublishAOT=true /p:PublishSingleFile=true /p:IncludeNativeLibrariesForSelfExtract=true /p:EnableCompressionInSingleFile=true -o ./publish
## ЭТА
dotnet publish -c Release -r win-x64 --self-contained true /p:PublishAOT=true /p:PublishSingleFile=true /p:IncludeNativeLibrariesForSelfExtract=true /p:IncludeAllContentForSelfExtract=true /p:EnableCompressionInSingleFile=true -o ./publish

dotnet publish -c Release -r win-x64 --self-contained true

dotnet publish -c Release -r win-x64 --self-contained true --property:PublishSingleFile=true --property:IncludeAllContentForSelfExtract=true

### LOG
.\picoCam-303C.exe 2>&1 | Out-File -Encoding utf8 error.log
type error.log


EXEC : error Failed to load assembly 'DockPanelSuite'  - я могу заменить 'DockPanelSuite' на более стабильно Native AOT без переписывания кода?


Альтернатива — удалить DockPanelSuite и сделать обычный SplitContainer с панелями (как у вас уже есть _splitContainer). Но это много работы. Проще отключить AOT.
дай краткие изменения для преобразования в обычный SplitContainer 

Заменить DockPanelSuite на TabControl
Avalonia UI (самый популярный сейчас) — отлично поддерживает Native AOT, кросс-платформенный, современный.
WinUI 3 / Uno Platform — хорошая AOT-поддержка.
DockPanelSuite только без тем (дефолтный ThemeBase).
###
exe не запускается, я хочу запустить Native AOT c DockPanelSuite
поставь DockPanelSuite только без тем (дефолтный ThemeBase) - это решит проболему?
PS C:\Users\user\source\repos\NativeAOT\NativeAOT> dotnet publish -c Release -r win-x64 --self-contained true
Восстановление завершено (0,2 с)
NativeAOT net9.0-windows win-x64 успешно выполнено с предупреждениями (6) (14,2 с) → bin\Release\net9.0-windows\win-x64\publish\
C:\Users\user\.nuget\packages\microsoft.windowsdesktop.app.runtime.win-x64\9.0.17\runtimes\win-x64\lib\net9.0\System.Windows.Forms.Primitives.dll : warning IL3053: Assembly 'System.Windows.Forms.Primitives' produced AOT analysis warnings.
ILC : warning IL3000: System.Windows.Forms.ThreadExceptionDialog.ThreadExceptionDialog(Exception): 'System.Reflection.Assembly.Location.get' always returns an empty string for assemblies embedded in a single-file app. If the path to the app directory is needed, consider calling 'System.AppContext.BaseDirectory'.
C:\Users\user\.nuget\packages\microsoft.windowsdesktop.app.runtime.win-x64\9.0.17\runtimes\win-x64\lib\net9.0\System.Windows.Forms.dll : warning IL3053: Assembly 'System.Windows.Forms' produced AOT analysis warnings.
C:\Users\user\.nuget\packages\runtime.win-x64.microsoft.dotnet.ilcompiler\9.0.17\framework\System.ComponentModel.TypeConverter.dll : warning IL3053: Assembly 'System.ComponentModel.TypeConverter' produced AOT analysis warnings.
ILC : warning IL3000: System.Windows.Forms.Control.ControlVersionInfo.OwnerIsInMemoryAssembly.get: 'System.Reflection.Assembly.Location.get' always returns an empty string for assemblies embedded in a single-file app. If the path to the app directory is needed, consider calling 'System.AppContext.BaseDirectory'.
C:\Users\user\.nuget\packages\microsoft.windowsdesktop.app.runtime.win-x64\9.0.17\runtimes\win-x64\lib\net9.0\System.Formats.Nrbf.dll : warning IL3053: Assembly 'System.Formats.Nrbf' produced AOT analysis warnings.

Сборка успешно выполнено с предупреждениями (6) через 14,7 с
PS C:\Users\user\source\repos\NativeAOT\NativeAOT>


PS C:\Users\user\source\repos\NativeAOT\NativeAOT\bin\Release\net9.0-windows\win-x64\publish> .\NativeAOT.exe 2>&1 | Out-File -Encoding utf8 error.log
PS C:\Users\user\source\repos\NativeAOT\NativeAOT\bin\Release\net9.0-windows\win-x64\publish> type error.log
.\NativeAOT.exe : Unhandled exception. System.IO.FileNotFoundException: Could not resolve assembly 'System.Reflection.M
etadata.AssemblyNameInfo'.
строка:1 знак:1
+ .\NativeAOT.exe 2>&1 | Out-File -Encoding utf8 error.log
+ ~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (Unhandled excep...emblyNameInfo'.:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError

   at System.Reflection.TypeNameResolver.ResolveAssembly(AssemblyNameInfo) + 0x7f
   at System.Reflection.TypeNameResolver.GetType(String, ReadOnlySpan`1, TypeName) + 0x69
   at System.Reflection.TypeNameResolver.GetSimpleType(TypeName) + 0x4b
   at System.Reflection.TypeNameResolver.GetType(String, Func`2, Func`4, Boolean, Boolean, Boolean, String) + 0xb1
   at System.Resources.ManifestBasedResourceGroveler.InternalGetResourceSetFromSerializedData(Stream, String, String, R
esourceManager.ResourceManagerMediator) + 0x56
at System.Resources.ManifestBasedResourceGroveler.GrovelForResourceSet(CultureInfo, Dictionary`2, Boolean, Boolean)
+ 0x164
  at System.Resources.ResourceManager.InternalGetResourceSet(CultureInfo, Boolean, Boolean) + 0x1a7
  at System.Resources.ResourceManager.GetObject(String, CultureInfo, Boolean) + 0x14f
  at WeifenLuo.WinFormsUI.ThemeVS2012.Resources.get_Dockindicator_PaneDiamond_Hotspot() + 0x23
  at WeifenLuo.WinFormsUI.ThemeVS2012.ImageService..ctor(ThemeBase) + 0x5c
  at WeifenLuo.WinFormsUI.ThemeVS2015.VS2015ThemeBase..ctor(Byte[]) + 0xb5
  at NativeAOT.Form1.SetupDockPanel() + 0x64
  at NativeAOT.Program.Main() + 0x6c
  PS C:\Users\user\source\repos\NativeAOT\NativeAOT\bin\Release\net9.0-windows\win-x64\publish>

# AcrylicUI
Сделай проект на AcrylicUI и чтобы он работал с NativeAOT
нужно переделать весь проект с DockPanelSuite на AcrylicUI, отнесись внимательно, дай полные изменения не сокращай (чтобы я сам ничего не дописывал),
дай код полными функциями где нужно заменить, указывай файл где заменить эту функцию или метод.
И чтобы весь функционал остался прежним - логика программы вообще чтобы не нарушилась!
я могу изменять строчками одно на другое в целом проекте, указывай что на что мне во всем проекте заминить
# Krypton.Docking
мне нужно убрать DockPanelSuite , не нужно визуальное изменения окно и их соранения, удали все что с ним связано, оставь простой интерфейс,
но чтобы вся логика приложения работала, только визуальное DockPanelSuite
я могу изменять во всем проекте во всех файлах строчками одно на другое, указывай что на что мне во всем проекте заминить

Я могу быстро заменить DockPanelSuite на простое - чтобы собрать NativeAOT ? я могу изменять во всем проекте во всех файлах строчками одно на другое, указывай что на что мне во всем проекте заминить

нужно в правой стороне в вверху окна (меню) вывести кнопки переключения панелей и выводить их, чтобы логика работы приложения сохранилась
PanelAIModel.cs"
PanelCamera.cs"
PanelConsole.cs"
PanelSettings.cs"
PanelTrigger.cs"

