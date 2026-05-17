@echo off
echo Adding all files...
git add .

echo.
echo Committing files...
git commit -m "Update code"

echo.
echo Pushing to GitHub (main branch)...
git push origin main

echo.
echo Done!
pause
