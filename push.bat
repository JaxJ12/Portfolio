@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ==========================================
echo Portfolio push (with reorganization cleanup)
echo ==========================================
echo.

REM --- Clean up any stale git locks ---
if exist ".git\HEAD.lock" del /f /q ".git\HEAD.lock"
if exist ".git\index.lock" del /f /q ".git\index.lock"
if exist ".git\modules\sap-pitch-repo\config.lock" del /f /q ".git\modules\sap-pitch-repo\config.lock"

REM --- SAP submodule conversion (idempotent — only runs first time) ---
if exist ".gitmodules" (
    echo Converting sap-pitch-repo from submodule to regular folder...
    git submodule deinit -f -- sap-pitch-repo 2>nul
    git rm --cached -f sap-pitch-repo
    if exist "sap-pitch-repo\.git" del /f /q "sap-pitch-repo\.git"
    if exist ".git\modules\sap-pitch-repo" rmdir /s /q ".git\modules\sap-pitch-repo"
    if exist ".gitmodules" del /f /q ".gitmodules"
    if exist "sap-pitch-repo\Downloads" rmdir /s /q "sap-pitch-repo\Downloads"
    if exist "sap-pitch-repo\OneDrive" rmdir /s /q "sap-pitch-repo\OneDrive"
    echo Submodule conversion complete.
    echo.
)

REM --- Reorganization cleanup: delete originals that have been moved ---
REM Project pages now live in projects/
if exist "projects\project-aistudio.html" if exist "project-aistudio.html" del /f /q "project-aistudio.html"
if exist "projects\project-chatbot.html"  if exist "project-chatbot.html"  del /f /q "project-chatbot.html"
if exist "projects\project-langchain.html" if exist "project-langchain.html" del /f /q "project-langchain.html"
if exist "projects\project-ml.html"       if exist "project-ml.html"       del /f /q "project-ml.html"
if exist "projects\project-n8n.html"      if exist "project-n8n.html"      del /f /q "project-n8n.html"
if exist "projects\project-skillswap.html" if exist "project-skillswap.html" del /f /q "project-skillswap.html"

REM Dashboard pages now live in dashboards/
if exist "dashboards\Creed_Jax_Dashboard.html" if exist "Creed_Jax_Dashboard.html" del /f /q "Creed_Jax_Dashboard.html"
if exist "dashboards\Gartner_Demo.html" if exist "Gartner_Demo.html" del /f /q "Gartner_Demo.html"

REM alpha-omega-tool.html was orphaned (no inbound links) — remove stray copy in dashboards/
if exist "dashboards\alpha-omega-tool.html" del /f /q "dashboards\alpha-omega-tool.html"

REM Stray diagnostic file from earlier
if exist "test-write-perms.tmp" del /f /q "test-write-perms.tmp"

REM --- Stage everything (adds new folders + records deletions) ---
echo Staging all changes...
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
    git commit -m "Reorganize portfolio: move project pages to projects/ and dashboards to dashboards/"
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
echo Pushing to GitHub...
git push origin main
if errorlevel 1 (
    echo Push failed! Check the error above.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo Push successful!
echo Vercel/Render will redeploy automatically.
echo ==========================================
pause
