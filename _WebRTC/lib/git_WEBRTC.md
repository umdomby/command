# удаленные ветки WebRTC
cd /home/pi/webrtc-android/src
git ls-remote origin 'refs/branch-heads/*'

# Получаем все ветки с удалённого репозитория
git fetch origin

# Проверяем, что нужная ветка есть
git ls-remote origin 'refs/branch-heads/*' | grep 7103

# Создаём локальную ветку и переключаемся на неё
git checkout -b branch-heads-7103 2c8f5be6924d507ee74191b1aeadcec07f747f21

git status
git branch
# Показать имя текущей ветки (удобно для скриптов):
git rev-parse --abbrev-ref HEAD

# Если нужно больше информации (например, удалённые ветки):
git branch -a


2c8f5be6924d507ee74191b1aeadcec07f747f21        refs/branch-heads/7103



#### ✅ Шаги для переключения на актуальную версию WebRTC
1. Перейди в директорию исходников WebRTC
   cd ~/webrtc-android/src
2. Сброси текущее состояние (если был checkout ветки branch-heads/7103):
   git reset --hard
   git clean -fd
3. Обнови origin и переключись на актуальный main
   git fetch origin
   git checkout main
   git pull
   📝 Если main не существует, можно посмотреть доступные ветки:

git branch -r
