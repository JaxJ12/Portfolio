@echo off
cd /d "%~dp0"
if exist ".git\HEAD.lock" del /f ".git\HEAD.lock"
if exist ".git\index.lock" del /f ".git\index.lock"
git add api/portfolio-chat.js assistant.css
git commit -m "Switch chatbot to Claude Haiku, replace blue AI icon with gold portfolio tones"
git push origin main
pause
