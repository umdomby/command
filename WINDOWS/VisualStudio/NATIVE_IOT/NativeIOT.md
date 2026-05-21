

<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net9.0-windows</TargetFramework>
    <Nullable>enable</Nullable>
    <UseWindowsForms>true</UseWindowsForms>
    <ImplicitUsings>enable</ImplicitUsings>
    <ApplicationIcon>icon.ico</ApplicationIcon>

    <!-- === Native AOT === -->
    <PublishAot>true</PublishAot>
    <PublishTrimmed>true</PublishTrimmed>
    <TrimMode>partial</TrimMode>

    <!-- Single File -->
    <PublishSingleFile>true</PublishSingleFile>
    <IncludeAllContentForSelfExtract>true</IncludeAllContentForSelfExtract>
    <IncludeNativeLibrariesForSelfExtract>true</IncludeNativeLibrariesForSelfExtract>
    <EnableCompressionInSingleFile>true</EnableCompressionInSingleFile>

    <!-- Оптимизации -->
    <InvariantGlobalization>true</InvariantGlobalization>
    <OptimizationPreference>Size</OptimizationPreference>

    <!-- Важно для WinForms -->
    <_SuppressWinFormsTrimError>true</_SuppressWinFormsTrimError>
    <CustomResourceTypesSupport>true</CustomResourceTypesSupport>

    <!-- Анализаторы и предупреждения -->
    <EnableTrimAnalyzer>true</EnableTrimAnalyzer>
    <EnableAotAnalyzer>true</EnableAotAnalyzer>
    <NoWarn>$(NoWarn);IL3000;IL3001;IL2026;IL2057;IL2072;IL2075;IL3050;IL2093;IL2101</NoWarn>

    <!-- JSON -->
    <JsonSerializerIsReflectionEnabledByDefault>false</JsonSerializerIsReflectionEnabledByDefault>
  </PropertyGroup>

  <ItemGroup>
    <Content Include="icon.ico">
      <CopyToOutputDirectory>Always</CopyToOutputDirectory>
    </Content>
  </ItemGroup>

  <ItemGroup>
    <PackageReference Include="System.IO.Ports" Version="9.0.0" />
    <PackageReference Include="System.Text.Json" Version="9.0.0" />
    <PackageReference Include="System.Management" Version="9.0.0" />
  </ItemGroup>

  <!-- Защита от обрезания -->
  <ItemGroup>
    <TrimmerRootAssembly Include="System.Windows.Forms" />
    <TrimmerRootAssembly Include="System.Windows.Forms.Primitives" />
    <TrimmerRootAssembly Include="Microsoft.VisualBasic.Forms" />
    <TrimmerRootAssembly Include="System.IO.Ports" />
  </ItemGroup>

</Project>