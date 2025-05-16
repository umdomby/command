Скачивание нового репозитория WebRTC
Установка depot_tools:
Если depot_tools уже установлен, пропустите этот шаг. Иначе установите его:

bash

Копировать
cd ~
git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
export PATH=$HOME/depot_tools:$PATH
echo 'export PATH=$HOME/depot_tools:$PATH' >> ~/.bashrc
source ~/.bashrc
Создание директории для нового репозитория:
Создайте новую папку для WebRTC:

bash

Копировать
mkdir ~/webrtc && cd ~/webrtc
Скачивание исходного кода WebRTC:
Используйте fetch из depot_tools для загрузки WebRTC:

bash

Копировать
fetch webrtc
Это создаст папку ~/webrtc/src с исходным кодом WebRTC и всеми зависимостями. Команда fetch webrtc автоматически выполнит gclient sync, чтобы загрузить зависимости для ветки main.

Проверка структуры:
Убедитесь, что репозиторий загружен:

bash

Копировать
ls ~/webrtc/src
Ожидаемый вывод включает папки и файлы, такие как BUILD.gn, DEPS, third_party, и т.д.

Переключение на ветку M136
Поиск ветки для M136:
После загрузки нового репозитория проверьте доступные ветки:

bash

Копировать
cd ~/webrtc/src
git fetch origin
git branch -r | grep branch-heads | sort -V


####


cd ~/webrtc/src
git fetch origin
git branch -r | grep branch-heads | sort -V
git checkout -b m136 origin/branch-heads/7103
git fetch origin --prune
git checkout -b m136 origin/branch-heads/7103






cd C:\webrtc\src
gn gen out/Debug --args='is_debug=true target_os="android" target_cpu="arm64" rtc_use_h264=true proprietary_codecs=true android_ndk_root="C:/android-ndk-r27c"'
Объяснение изменений:
android_ndk_root="C:/android-ndk-r27c": Путь к NDK теперь использует прямые слэши / и заключен в кавычки, как требуется в gn.
Остальные аргументы (target_os="android", target_cpu="arm64", etc.) уже корректны.
Примечание:
Если вы хотите поддерживать 32-битные устройства (например, Samsung SM-J710F), позже можно собрать дополнительную версию с target_cpu="arm":
powershell

Копировать
gn gen out/Debug-arm --args='is_debug=true target_os="android" target_cpu="arm" rtc_use_h264=true proprietary_codecs=true android_ndk_root="C:/android-ndk-r27c"'

sysdm.cpl
cd C:\install
cd C:\webrtc\src
ninja --version
gn --version
$env:DEPOT_TOOLS_WIN_TOOLCHAIN = "0"
$env:GYP_MSVS_VERSION = "2022"
$env:ANDROID_NDK_ROOT = "C:\Users\PC1\AppData\Local\Android\Sdk\ndk\25.2.9519653"
$env:ANDROID_HOME = "C:\Users\PC1\AppData\Local\Android\Sdk"
$env:PATH += ";C:\Users\PC1\AppData\Local\Android\Sdk\platform-tools"
gn gen out/Debug --args='is_debug=true target_os="android" target_cpu="arm64" rtc_use_h264=true proprietary_codecs=true'


cd C:\webrtc\src\third_party
git status
Это покажет изменённые файлы.
Решите, что делать:
Если изменения не нужны:
powershell

Копировать
git reset --hard
git clean -fd
Сбрасывает изменения и удаляет неотслеживаемые файлы.
Если изменения важны:
powershell

Копировать
git add .
git commit -m "Temporary commit to resolve gclient sync"
Или:
powershell

Копировать
git stash
Повторите gclient sync:
powershell

Копировать
cd C:\webrtc\src
gclient sync

C:\Users\PC1\AppData\Local\Android\Sdk\ndk\29.0.13113456
gn gen out/Debug --args='is_debug=true target_os="android" target_cpu="arm64" rtc_use_h264=true proprietary_codecs=true android_ndk_root="C:\Users\PC1\AppData\Local\Android\Sdk\ndk\25.2.9519653"'
gn gen out/Debug --args='is_debug=true target_os="android" target_cpu="arm64" rtc_use_h264=true proprietary_codecs=true'


Убедитесь, что переменные установлены:
powershell

Копировать
cd C:\webrtc\src
echo $env:DEPOT_TOOLS_WIN_TOOLCHAIN
echo $env:GYP_MSVS_VERSION
echo $env:ANDROID_NDK_ROOT
Ожидаемый вывод: 0, 2022, C:\Users\PC1\AppData\Local\Android\Sdk\ndk\25.2.9519653.

Сделайте переменные постоянными (если не сделано):
Win + R → sysdm.cpl → «Advanced» → «Environment Variables» → «System Variables»:
DEPOT_TOOLS_WIN_TOOLCHAIN = 0
GYP_MSVS_VERSION = 2022
ANDROID_NDK_ROOT = C:\Users\PC1\AppData\Local\Android\Sdk\ndk\29.0.13113456
ANDROID_HOME = C:\Users\PC1\AppData\Local\Android\Sdk