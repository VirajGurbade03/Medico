@echo off
title AI Clinical Assistant Startup Script
color 0B
echo ===================================================
echo     Starting AI Clinical Assistant Infrastructure    
echo ===================================================
echo.

echo [1/2] Launching Python FastAPI Backend...
:: Open a new command prompt window, activate the venv, and run the backend
start "Medico Backend (FastAPI)" cmd /c "cd backend && venv\Scripts\activate && python main.py"

echo.
echo [2/2] Launching Next.js Frontend Development Server...
:: Open a new command prompt window and run the frontend
start "Medico Frontend (Next.js)" cmd /c "cd frontend && npm run dev"

echo.
echo ===================================================
echo Both servers are now starting in separate windows!
echo Backend API will be available at: http://127.0.0.1:8080
echo Frontend UI will be available at: http://localhost:3000
echo.
echo You can close this window safely. 
echo To stop the servers later, simply close their respective pop-up windows.
echo ===================================================
timeout /t 5 >nul
exit
