@echo off
title js-forum Server

echo ================================
echo        js-forum Server
echo ================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installe.
    echo Telecharge-le sur https://nodejs.org
    pause
    exit /b 1
)

:: Check if node_modules exists, install if missing
if not exist "node_modules\" (
    echo [INFO] Installation des dependances...
    npm install
    echo.
)

:: Check if .env exists
if not exist ".env" (
    echo [ATTENTION] Fichier .env introuvable.
    echo Copie .env.exemple vers .env et remplis les variables.
    pause
    exit /b 1
)

:: Start the server
echo [INFO] Demarrage du serveur...
echo.
npm run dev

pause