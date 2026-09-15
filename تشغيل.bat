@echo off
title Qirtas School System
color 0A

echo.
echo  =============================================
echo     Qirtas System - Starting up...
echo  =============================================
echo.

:: Install if needed
if not exist node_modules (
    echo  Installing dependencies for the first time...
    npm install
    echo.
)

echo  System is running! The browser will open automatically...
echo  To stop the system, close this window.
echo.

:: Open browser after 3 seconds
start /b cmd /c "timeout /t 3 > nul && start http://localhost:3000"

:: Start the system
npm start

