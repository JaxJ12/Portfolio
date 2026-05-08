@echo off
cd /d "%~dp0"
git add contact.html project-n8n.html project-langchain.html project-aistudio.html project-ml.html project-skillswap.html project-chatbot.html project-page-theme.css push.bat
git commit -m "Unify project page styling and refine SAP contact hero"
git push origin main
pause
