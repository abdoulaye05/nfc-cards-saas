#!/bin/bash

echo "🚀 LANCEMENT NFC CARDS"

# Variables
FRONTEND_PORT=3000
BACKEND_PORT=5001

# Nettoyer les processus
echo "🧹 Nettoyage..."
pkill -f "react-scripts" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true
sleep 1

# Démarrer le backend existant
echo "🔧 Démarrage du backend (server.js)..."
cd backend

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
  echo "📦 Installation des dépendances backend..."
  npm install
fi

echo "✅ Utilisation du serveur principal : server.js"

# Config frontend
echo "⚛️ Frontend..."
cd ../frontend
echo "REACT_APP_API_URL=http://localhost:$BACKEND_PORT" > .env

# Lancement
echo "🚀 Démarrage..."
cd ../backend
PORT=$BACKEND_PORT node server.js &
BACKEND_PID=$!

sleep 2

cd ../frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ LANCÉ !"
echo "📱 Frontend: http://localhost:$FRONTEND_PORT"
echo "🔧 Backend:  http://localhost:$BACKEND_PORT"
echo "🔐 Login: admin@mobydev.com"
echo ""
echo "Ctrl+C pour arrêter"

# Nettoyage
cleanup() {
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM
wait $BACKEND_PID $FRONTEND_PID 