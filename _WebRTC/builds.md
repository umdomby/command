Официальные сборки Google WebRTC:

Исходный код WebRTC от Google поддерживает H.264. Однако, чтобы активировать его при самостоятельной сборке из исходников, 
необходимо использовать соответствующие флаги сборки в gn args. Обычно это:
proprietary_codecs=true
ffmpeg_branding="Chrome"
rtc_use_h264=true // Этот флаг может быть уже не нужен или включен по умолчанию в свежих версиях, если proprietary_codecs=true
Google предоставляет официальные бинарные сборки WebRTC для Android (aar) через свой Maven репозиторий (org.webrtc:google-webrtc). 
Начиная примерно с версии M86 и далее, эти официальные сборки включают поддержку H.264 по умолчанию. 
Таким образом, если вы используете официальную библиотеку org.webrtc:google-webrtc свежей версии (например, 1.0.XXXXX или более новые, 
соответствующие последним milestone, таким как M126), она должна поддерживать H.264 "из коробки".


Отлично, что вы скачали исходный код WebRTC! Сборка собственной библиотеки (AAR) для Android с поддержкой H.264 и VP8 — это выполнимая задача, хотя и требует внимания к деталям, особенно при работе в WSL. VP8 поддерживается по умолчанию, а для H.264 действительно нужны флаги, которые вы упомянули.

Вот пошаговое руководство, как это сделать:

Перед началом:

WSL и Пути: Поскольку вы работаете в WSL (\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src), убедитесь, что все пути к зависимостям (Android SDK, NDK) корректно доступны изнутри WSL. Часто проще всего установить Android SDK и NDK прямо внутрь файловой системы WSL, чтобы избежать проблем с путями /mnt/c/....
depot_tools: Я предполагаю, что у вас уже установлен depot_tools от Chromium и он добавлен в PATH вашей WSL-среды, так как вы смогли скачать исходники. Если нет, установите его в первую очередь.
Актуальность исходников: Перед сборкой рекомендуется обновить исходный код и зависимости:
Bash

cd /home/pi/webrtc/src  # Перейдите в директорию с исходниками
git checkout main      # Или конкретную ветку/тег, если нужно
gclient sync



###
Исходный код WebRTC от Google поддерживает H.264. Однако, чтобы активировать его при самостоятельной сборке из исходников,

необходимо использовать соответствующие флаги сборки в gn args. Обычно это:

proprietary_codecs=true

ffmpeg_branding="Chrome"

rtc_use_h264=true // Этот флаг может быть уже не нужен или включен по умолчанию в свежих версиях, если proprietary_codecs=true

Google предоставляет официальные бинарные сборки WebRTC для Android (aar) через свой Maven репозиторий (org.webrtc:google-webrtc).

Начиная примерно с версии M86 и далее, эти официальные сборки включают поддержку H.264 по умолчанию.

Таким образом, если вы используете официальную библиотеку org.webrtc:google-webrtc свежей версии (например, 1.0.XXXXX или более новые,

соответствующие последним milestone, таким как M126), она должна поддерживать H.264 "из коробки".

мне нужна собственная сборка поддержка H264 и VP8

я скачал webrtc

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\.git"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\api"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\audio"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\base"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\build"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\build_overrides"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\buildtools"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\call"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\common_audio"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\common_video"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\data"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\docs"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\examples"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\experiments"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\g3doc"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\infra"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\logging"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\media"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\modules"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\net"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\out"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\p2p"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\pc"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\resources"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\rtc_base"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\rtc_tools"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\sdk"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\stats"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\system_wrappers"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\test"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\testing"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\third_party"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\tools"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\tools_webrtc"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\video"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\.clang-format"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\.git-blame-ignore-revs"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\.gitignore"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\.gn"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\.landmines"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\.mailmap"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\.style.yapf"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\.vpython3"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\AUTHORS"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\BUILD.gn"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\CODE_OF_CONDUCT.md"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\codereview.settings"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\DEPS"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\DIR_METADATA"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\ENG_REVIEW_OWNERS"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\gn_gen.log"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\LICENSE"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\license_template.txt"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\native-api.md"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\OWNERS"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\OWNERS_INFRA"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\PATENTS"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\PRESUBMIT.py"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\presubmit_test.py"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\presubmit_test_mocks.py"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\pylintrc"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\pylintrc_old_style"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\README.chromium"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\README.md"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\WATCHLISTS"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\webrtc.gni"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\webrtc_lib_link_test.cc"

"\\wsl.localhost\Ubuntu-24.04\home\pi\webrtc\src\whitespace.txt"



как мне сделать такую сборку для Android приложений?