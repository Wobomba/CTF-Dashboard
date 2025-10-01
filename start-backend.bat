@echo off
echo Starting CyberLab Academy Backend...
echo.

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Navigating to backend directory...
cd backend

echo Starting Flask server...
python app.py

pause
