@echo off
cd /d "%~dp0"
if exist ".git\HEAD.lock" del /f ".git\HEAD.lock"
if exist ".git\index.lock" del /f ".git\index.lock"
git status
echo.
echo Pushing to GitHub...
git push origin main
if errorlevel 1 (
    echo Push failed! Check the error above.
    pause
    exit /b 1
)
echo.
echo Push successful!
pause
