<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net9.0-windows</TargetFramework>
    <Nullable>enable</Nullable>
    <UseWindowsForms>true</UseWindowsForms>
    <ImplicitUsings>enable</ImplicitUsings>
    <ApplicationIcon>icon.ico</ApplicationIcon>
  </PropertyGroup>

  <ItemGroup>
    <Content Include="icon.ico" />
  </ItemGroup>

  <ItemGroup>
    <PackageReference Include="HidSharp" Version="2.6.4" />
    <PackageReference Include="Nefarius.ViGEm.Client" Version="1.21.256" />
    <PackageReference Include="SharpDX.DirectInput" Version="4.2.0" />
    <PackageReference Include="SharpDX.XInput" Version="4.2.0" />
  </ItemGroup>

</Project>

### 

<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net9.0-windows</TargetFramework>
    <Nullable>enable</Nullable>
    <UseWindowsForms>true</UseWindowsForms>
    <ImplicitUsings>enable</ImplicitUsings>
    <ApplicationIcon>icon.ico</ApplicationIcon>

    <!-- Включаем Native AOT -->
    <PublishAot>true</PublishAot>

    <!-- Trim (удаление неиспользуемого кода) — обязательно для AOT -->
    <PublishTrimmed>true</PublishTrimmed>

    <!-- Один файл — самый удобный для распространения -->
    <PublishSingleFile>true</PublishSingleFile>
    <IncludeAllContentForSelfExtract>true</IncludeAllContentForSelfExtract>
    <IncludeNativeLibrariesForSelfExtract>true</IncludeNativeLibrariesForSelfExtract>

    <!-- Анализаторы помогут найти проблемы заранее -->
    <EnableTrimAnalyzer>true</EnableTrimAnalyzer>
    <EnableAotAnalyzer>true</EnableAotAnalyzer>

    <!-- Оптимизации (можно попробовать включить позже) -->
    <!-- <InvariantGlobalization>true</InvariantGlobalization> -->
    <!-- <OptimizationPreference>Size</OptimizationPreference> -->
  </PropertyGroup>

  <ItemGroup>
    <Content Include="icon.ico" />
  </ItemGroup>

  <ItemGroup>
    <PackageReference Include="HidSharp" Version="2.6.4" />
    <PackageReference Include="Nefarius.ViGEm.Client" Version="1.21.256" />
    <PackageReference Include="SharpDX.DirectInput" Version="4.2.0" />
    <PackageReference Include="SharpDX.XInput" Version="4.2.0" />
  </ItemGroup>

</Project>

###
# Выполни команду (в Developer PowerShell / обычном терминале в папке проекта):
dotnet clean
dotnet build
dotnet publish -c Release -r win-x64
or
dotnet publish -c Release -r win-x64 -p:PublishAot=true -p:PublishTrimmed=true -p:PublishSingleFile=true

C:\Users\umdom\source\repos\JoyControl\JoyControl\bin\Release\net9.0-windows\win-x64\publish

+ Native-протекторы поверх готового .exe (самый сильный шаг):

# обойти запрет на trimming (рискованно)
<_SuppressWinFormsTrimError>true</_SuppressWinFormsTrimError>

Онлайн-проверки лицензии — твой JWT + HWID остаётся главным барьером. Делай проверки в нескольких местах кода, как обсуждали раньше.

Visual Studio Installer

Source Generation
