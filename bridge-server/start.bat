@echo off
echo ╔════════════════════════════════════════════╗
echo ║   Starting PULSE Bridge Server...         ║
echo ╚════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules\" (
    echo 📦 Installing dependencies...
    call npm install
    echo.
)

echo 🚀 Starting server...
echo.
node server.js
