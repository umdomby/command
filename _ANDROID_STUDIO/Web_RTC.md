https://central.sonatype.com/artifact/com.dafruits/webrtc

https://w3c.github.io/webrtc-pc/

https://github.com/webrtc-sdk/android

webrtc Android pion-to-pion  server Go

камера на Pixel 5 Virtual Device не открывается, нет изображения

Android Huawei PRA-LA1 черный экран

pion-to-pion

Android Kotlin Gradle WebRTC клиент для Pion-to-Pion проекта GoLang server
android, go lang - webrtc  pion-to-pion project отвечай на русском, улучшений не надо! Нужен проект на Android от 8 версии и выше

Android! Gradle
[versions]
agp = "8.9.1"
kotlin = "2.0.21"
coreKtx = "1.15.0"
junit = "4.13.2"
junitVersion = "1.2.1"
espressoCore = "3.6.1"
lifecycleRuntimeKtx = "2.8.7"
activityCompose = "1.10.1"
composeBom = "2024.09.00"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
junit = { group = "junit", name = "junit", version.ref = "junit" }
androidx-junit = { group = "androidx.test.ext", name = "junit", version.ref = "junitVersion" }
androidx-espresso-core = { group = "androidx.test.espresso", name = "espresso-core", version.ref = "espressoCore" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
androidx-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-ui-test-manifest = { group = "androidx.compose.ui", name = "ui-test-manifest" }
androidx-ui-test-junit4 = { group = "androidx.compose.ui", name = "ui-test-junit4" }
androidx-material3 = { group = "androidx.compose.material3", name = "material3" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }


вот React версия, сделай Android




###   ##################################

Если тебе нужен рабочий WebRTC на Android (API 26+), вот актуальные способы (2024):

✅ Способ 1: Официальная сборка через JitPack
gradle
Copy
// settings.gradle  
dependencyResolutionManagement {  
repositories {  
maven { url 'https://jitpack.io' }  
}  
}

// build.gradle (app)  
implementation 'com.github.webrtc-sdk:android:104.5112.0'  
(Это последняя стабильная версия WebRTC от Google.)

✅ Способ 2: Скачать AAR вручную
Качай .aar отсюда: webrtc-sdk/android

Клади в app/libs/libwebrtc.aar

Подключай:

gradle
Copy
implementation files('libs/libwebrtc.aar')  
✅ Способ 3: Использовать старую версию (если критично)
gradle
Copy
implementation 'org.webrtc:google-webrtc:1.0.50772'  
(Но лучше брать свежую через JitPack.)

Вывод
Да, я ошибся — org.webrtc:google-webrtc:1.0.32006 больше нет в Maven Central.

Но решение есть — бери актуальную версию через JitPack или AAR.

Если нужна помощь с кодом — скажи, дам рабочий пример.

