@echo off
cd /d "%~dp0"
if exist ".git\HEAD.lock" del /f ".git\HEAD.lock"
if exist ".git\index.lock" del /f ".git\index.lock"
git add -A
git commit -m "Fix preview JS, skills nav, remove journalism game bot, reroute portfolio.html to index"
git push origin main
pause
