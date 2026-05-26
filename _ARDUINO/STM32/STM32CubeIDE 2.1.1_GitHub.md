STM32CubeIDE

# GIT

# Установи EGit  (СМОТРИ ниже)

В STM32CubeIDE перейди в меню:
Help → Eclipse Marketplace
В строке поиска напиши: EGit
Найди плагин "EGit - Git Integration for Eclipse" и нажми Install
Прими все лицензии, подтверди установку.
Перезапусти STM32CubeIDE (обязательно!).


Шаг 2: После перезапуска

Снова правой кнопкой по проекту → Team → Share Project
Теперь должен появиться Git в списке.
Выбери Git → Next



# Установить EGit вручную (рекомендую)

Закрой текущее окно установки.
Перейди:
Help → Install New Software
В поле Work with вставь эту ссылку и нажми Add:texthttps://archive.eclipse.org/egit/updates-6.9
В появившемся окне:
Поставь галочку Git Integration for Eclipse
Нажми Next

Прими лицензии → Finish
После установки перезапусти STM32CubeIDE.


# Cоздать новую ветку в STM32CubeIDE (EGit)
Вот самые удобные способы:
Способ 1: Самый быстрый (рекомендую)

Внизу IDE открой вкладку Git Repositories (если её нет — Window → Show View → Other → Git → Git Repositories)
В этом окне разверни свой репозиторий.
Правой кнопкой кликни по Branches → Local
Выбери Create Branch...
В окне:
Branch name: введи название новой ветки (например: feature/lidar или dev-usb)
Поставь галочку Checkout new branch
Нажми Finish