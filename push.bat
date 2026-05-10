@echo off
cd /d "%~dp0"
if exist ".git\HEAD.lock" del /f ".git\HEAD.lock"
if exist ".git\index.lock" del /f ".git\index.lock"
if exist ".git\index" del /f ".git\index"
git reset HEAD
git add -A
git commit -m "Update chatbot knowledge base, fix LinkedIn reposts, card UX improvements, skills nav fix"
git push origin main
pause
