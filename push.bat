@echo off
cd /d "%~dp0"
git add about.html contact.html project-n8n.html project-langchain.html project-aistudio.html project-ml.html project-skillswap.html project-chatbot.html project-page-theme.css push.bat
git commit -m "Align about nav and unify portfolio project palette"
git push origin main
pause
