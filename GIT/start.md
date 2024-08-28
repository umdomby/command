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