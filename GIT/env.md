# Установи git-filter-repo (если ещё нет)
# На WSL/Ubuntu:
sudo apt update && sudo apt install git-filter-repo

# Удали все .env файлы из ВСЕЙ истории репозитория
git filter-repo --path docker-ardu/.env-443 --path docker-ardu/.env-444 --invert-paths --force

# Или более широкий вариант — удали все файлы, содержащие .env в имени
git filter-repo --path-glob '*.env*' --invert-paths --force

git push origin main --force


# 1. Добавь remote origin заново (твой репозиторий)
git remote add origin https://github.com/umdomby/prod.git

# 2. Проверь, что remote добавился
git remote -v

# 3. Теперь force push — это безопасно, потому что ты переписал историю локально
git push origin main --force-with-lease  or  push