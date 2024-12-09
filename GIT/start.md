git push -f origin master

u2 No/
u33 ASa

git reset --hard
git pull

or

git stash
git stash drop
git pull

# отменить изменения в ветке перед git pull
git checkout -f origin/main

# git pull <remote> <branch>
git branch --set-upstream origin/main

git branch --set-upstream-to=origin/main


git checkout origin/main


git pull --no-rebase
git reset --hard HEAD
git reset --hard HEAD~1 




# Чтобы удалить конфликты, вы можете использовать
git mergetool