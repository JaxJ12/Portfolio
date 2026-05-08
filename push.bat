@echo off
cd /d "%~dp0"
git add index.html portfolio.html push.bat
git commit -m "Edit Index and Portfolio"
git push origin main
pause
