#!/bin/bash

echo "================================"
echo "       js-forum Server"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERREUR] Node.js n'est pas installé."
    echo "Télécharge-le sur https://nodejs.org"
    exit 1
fi

# Check if node_modules exists, install if missing
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installation des dépendances..."
    npm install
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "[ATTENTION] Fichier .env introuvable."
    echo "Copie .env.exemple vers .env et remplis les variables."
    exit 1
fi

# Start the server
echo "[INFO] Démarrage du serveur..."
echo ""
npm run dev