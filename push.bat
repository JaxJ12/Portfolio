@echo off
cd /d "%~dp0"
if exist ".git\HEAD.lock" del /f ".git\HEAD.lock"
if exist ".git\index.lock" del /f ".git\index.lock"
git add about.html portfolio.html dashboards.html
git commit -m "Fix preview frame sizing — requestAnimationFrame defer + min-height placeholder"
git push origin main
pause
