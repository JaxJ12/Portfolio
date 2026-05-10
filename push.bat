@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ==========================================
echo Portfolio push (with submodule conversion)
echo ==========================================
echo.

REM --- Clean up any stale git locks ---
if exist ".git\HEAD.lock" del /f /q ".git\HEAD.lock"
if exist ".git\index.lock" del /f /q ".git\index.lock"
if exist ".git\modules\sap-pitch-repo\config.lock" del /f /q ".git\modules\sap-pitch-repo\config.lock"

REM --- Check if sap-pitch-repo is still a submodule (idempotent) ---
if exist ".gitmodules" (
    echo Converting sap-pitch-repo from submodule to regular folder...
    echo This may take a moment as ~186MB of files are processed.
    echo.

    REM Deregister the submodule (ignore errors if it's not registered)
    git submodule deinit -f -- sap-pitch-repo 2>nul

    REM Remove submodule entry from index AND from .gitmodules (keeps working files)
    git rm --cached -f sap-pitch-repo

    REM Remove the .git pointer file inside the submodule folder so it becomes a normal directory
    if exist "sap-pitch-repo\.git" del /f /q "sap-pitch-repo\.git"

    REM Remove submodule metadata from .git/modules
    if exist ".git\modules\sap-pitch-repo" rmdir /s /q ".git\modules\sap-pitch-repo"

    REM Force-delete .gitmodules in case it's left behind empty
    if exist ".gitmodules" del /f /q ".gitmodules"

    REM Remove bloat subdirectories accidentally committed in the SAP-Pitch repo
    if exist "sap-pitch-repo\Downloads" rmdir /s /q "sap-pitch-repo\Downloads"
    if exist "sap-pitch-repo\OneDrive" rmdir /s /q "sap-pitch-repo\OneDrive"

    echo Conversion complete.
    echo.
)

REM --- Stage everything (regular folder + config changes + deletions) ---
echo Staging changes...
git add -A

REM --- Show what's about to be committed ---
echo.
echo === Status ===
git status --short
echo.

REM --- Commit if there are staged changes ---
git diff --cached --quiet
if errorlevel 1 (
    echo Committing changes...
    git commit -m "Convert sap-pitch-repo from submodule to regular folder for reliable deployment"
    if errorlevel 1 (
        echo Commit failed!
        pause
        exit /b 1
    )
) else (
    echo No staged changes to commit.
)

REM --- Push to GitHub ---
echo.
echo Pushing to GitHub (this may take a few minutes for the large initial push)...
git push origin main
if errorlevel 1 (
    echo Push failed! Check the error above.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo Push successful!
echo The site should redeploy on Vercel/Render automatically.
echo ==========================================
pause
