# Проверьте текущие версии зависимостей
npm list --depth=0

## UPDATE
# Установите npm-check-updates
npm install -g npm-check-updates

# Запустите ncu, чтобы проверить доступные обновления
ncu

# Если вы хотите обновить package.json до последних версий, выполните
ncu -u

npm install
# or
yarn install

# Очистка кэша (при необходимости)
npm cache clean --force