@echo off
cd /d "%~dp0"
if exist ".git\HEAD.lock" del /f ".git\HEAD.lock"
if exist ".git\index.lock" del /f ".git\index.lock"
if exist ".git\index" del /f ".git\index"
git reset HEAD
git add -A
git commit -m "Skills page back-nav, remove chatbot from integrated pages, card UX + knowledge base updates"
git push origin main
pause
