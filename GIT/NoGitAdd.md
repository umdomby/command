git rm --cache .env
git rm -f --cached .env
git rm -r --cached .env

# отменить изменения в ветке перед git pull
git checkout -f origin/main

#Зафиксируйте изменение, используя
git commit -m "My message"

# Спрячьте это.
# Сохранение действует как стек, куда вы можете помещать изменения, а затем извлекать их в обратном порядке.

# Чтобы спрятать, введите

git stash
# Выполните слияние, а затем извлеките тайник:

git stash pop
# Отменить локальные изменения
# используя 
git reset --hard
# или
git checkout -t -f remote/branch

# Или: Отменить локальные изменения для определенного файла
# с использованием
git checkout filename