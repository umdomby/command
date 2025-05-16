ls -R ~/android-sdk/extras/android/m2repository/androidx/test/
Ожидаемый вывод должен включать:

text

Копировать
runner/1.5.2/runner-1.5.2.aar
core/1.5.0/core-1.5.0.aar
ext/junit/1.1.5/junit-1.1.5.aar
rules/1.5.0/rules-1.5.0.aar
Если какие-то файлы отсутствуют, повторите их загрузку:

bash

Копировать
mkdir -p ~/android-sdk/extras/android/m2repository/androidx/test/runner/1.5.2
wget -O ~/android-sdk/extras/android/m2repository/androidx/test/runner/1.5.2/runner-1.5.2.aar https://dl.google.com/dl/android/maven2/androidx/test/runner/1.5.2/runner-1.5.2.aar

mkdir -p ~/android-sdk/extras/android/m2repository/androidx/test/core/1.5.0
wget -O ~/android-sdk/extras/android/m2repository/androidx/test/core/1.5.0/core-1.5.0.aar https://dl.google.com/dl/android/maven2/androidx/test/core/1.5.0/core-1.5.0.aar

mkdir -p ~/android-sdk/extras/android/m2repository/androidx/test/ext/junit/1.1.5
wget -O ~/android-sdk/extras/android/m2repository/androidx/test/ext/junit/1.1.5/junit-1.1.5.aar https://dl.google.com/dl/android/maven2/androidx/test/ext/junit/1.1.5/junit-1.1.5.aar

mkdir -p ~/android-sdk/extras/android/m2repository/androidx/test/rules/1.5.0
wget -O ~/android-sdk/extras/android/m2repository/androidx/test/rules/1.5.0/rules-1.5.0.aar https://dl.google.com/dl/