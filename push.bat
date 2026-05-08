@echo off
cd /d "%~dp0"
git add about.html portfolio.html index.html class-projects.html contact.html project-n8n.html project-langchain.html project-aistudio.html project-ml.html project-skillswap.html project-chatbot.html project-page-theme.css push.bat
git commit -m "Tighten AI project overviews and update course naming"
git push origin main
pause
