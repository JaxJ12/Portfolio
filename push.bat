@echo off
cd /d "%~dp0"
if exist ".git\HEAD.lock" del /f ".git\HEAD.lock"
if exist ".git\index.lock" del /f ".git\index.lock"
if exist ".git\index" del /f ".git\index"
git reset HEAD
git add -A
git commit -m "Move View Webpage to card top row, remove chatbot from all integrated pages"
git push origin main
pause
