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

:: --- Runs after server stops (Ctrl+C) ---
echo.
echo [INFO] Arret du serveur. Nettoyage en cours...

:: Delete the database
if exist "database\forum.db" (
    del /f /q "database\forum.db"
    echo [OK] Base de donnees supprimee.
)

:: Delete any temp files (add more patterns as needed)
if exist "tmp\" (
    rd /s /q "tmp"
    echo [OK] Dossier tmp supprime.
)

:: Delete nodemon log if it exists
if exist "nodemon-debug.log" (
    del /f /q "nodemon-debug.log"
    echo [OK] nodemon-debug.log supprime.
)

echo [INFO] Nettoyage termine.
pause