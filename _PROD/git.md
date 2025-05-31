sudo apt install gh  # Ubuntu/Debian
gh auth login

git status
git add .
git commit -m "edit"
git push -u origin main
git push

# Пример полного цикла
cd ~/projects/my-repo
git status                 # Проверить изменения
git add .                  # Добавить все файлы
git commit -m "Update README"
git push origin main       # Отправить в ветку main