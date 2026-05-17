@echo off
echo Initializing Git repository...
git init

echo.
echo Creating and switching to 'dev' branch...
git checkout -b dev

echo.
echo Adding all files...
git add .

echo.
echo Committing files...
git commit -m "Initial commit"

echo.
echo Adding remote repository...
git remote add origin git@github.com:suyash2000/rss-bhatapara.git

echo.
echo Pushing to GitHub...
git push -u origin dev

echo.
echo Done!
pause
