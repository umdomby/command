# Запусти PowerShell ОТ ИМЕНИ АДМИНИСТРАТОРА

$certName     = "My Dev Code Signing 2026"
$friendlyName = "MyTestApp Code Sign"
$password     = "123456"   # ← поменяй на свой!

# Создаём сертификат — ТОЛЬКО рабочие параметры
$cert = New-SelfSignedCertificate `
    -Subject "CN=$certName" `
-FriendlyName $friendlyName `
    -Type CodeSigningCert `
-CertStoreLocation "Cert:\CurrentUser\My" `
    -KeyExportPolicy Exportable `
-KeySpec Signature `
-KeyLength 4096

# Проверяем, что сертификат создался
if ($cert) {
Write-Host "Сертификат создан успешно. Thumbprint: $($cert.Thumbprint)"
} else {
Write-Host "Ошибка при создании сертификата!"
return
}

# Экспорт в .pfx
$pfxPath = "$HOME\Desktop\mydevcert.pfx"
$securePass = ConvertTo-SecureString -String $password -Force -AsPlainText

Export-PfxCertificate `
    -Cert $cert `
-FilePath $pfxPath `
-Password $securePass

Write-Host ""
Write-Host "Готово! Файл сохранён: $pfxPath"
Write-Host "Пароль: $password"
Write-Host "Теперь подписывай exe через signtool"