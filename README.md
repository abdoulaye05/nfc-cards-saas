# 🚀 NFC Cards - Projet Fullstack

Plateforme SaaS moderne pour cartes de visite NFC avec interface admin React et backend Node.js/PostgreSQL.

## 🌟 **URLs de Production**

- **Frontend (Vercel)** : `https://nfc-cards-app.vercel.app`
- **Backend (Railway)** : `https://nfc-backend-mobydev.railway.app`
- **Scan des cartes** : `https://nfc-backend-mobydev.railway.app/scan/[CODE]`

---

## 📋 Table des matières

- [🎯 Vue d'ensemble](#-vue-densemble)
- [⚡ Architecture](#-architecture)
- [🔧 Stack technique](#-stack-technique)
- [🚀 Démarrage rapide](#-démarrage-rapide)
- [📊 Base de données](#-base-de-données)
- [📱 Utilisation](#-utilisation)
- [🌐 Déploiement](#-déploiement)

## 🎯 Vue d'ensemble

**NFC Cards** est une solution complète de cartes de visite numériques avec :

- **Interface admin moderne** : Gestion complète des cartes via React
- **Cartes intelligentes** : 8 thèmes de couleur, QR codes automatiques
- **📱 QR codes intelligents** : Factory Pattern + Services API + formatters
- **📊 Analytics avancées** : CardsController statistics + Recharts integration
- **🔐 Authentification sécurisée** : JWT + bcrypt + validation complète
- **💾 Persistance PostgreSQL** : Données sécurisées + backup automatique
- **🎨 Design responsive** : Tailwind CSS + composants réutilisables
- **📈 Performances optimisées** : Lazy loading + mise en cache intelligente

### **✨ Architecture MVC Complète**

#### **✅ Séparation claire**
- ✅ **Séparation des responsabilités** : Models/Views/Controllers isolés
- ✅ **Code réutilisable** : Components UI + Business logic centralisée
- ✅ **Tests facilités** : Chaque couche testable indépendamment
- ✅ **Évolutivité** : Ajout features sans casser l'existant

#### **🚀 Performance**
- ✅ **Singletons Controllers** : Évite re-instanciations multiples
- ✅ **Factory Models** : Création optimisée objets depuis API
- ✅ **Services centralisés** : Cache + évite requêtes redondantes
- ✅ **Getters intelligents** : Formatage calculé à la demande

#### **👥 Collaboration**
- ✅ **Collaboration facilitée** : Frontend/Backend découplés
- ✅ **Spécialisation équipe** : UI developers vs Logic developers
- ✅ **Onboarding rapide** : Structure claire + documentation
- ✅ **Code review efficace** : Responsabilités bien définies

---

## ⚡ Architecture

```
📁 nfc-cards/
├── 📱 frontend/                    # React App (Vercel)
│   ├── 📊 src/models/              # Modèles de données + validation
│   ├── 🎮 src/controllers/         # Logique métier + état
│   ├── 🎨 src/views/               # Interface utilisateur
│   ├── 🔧 src/services/            # API calls + utils
│   └── 📋 src/utils/               # Formatters + helpers
├── 🖥️ backend/                     # Node.js API (Railway)
│   ├── 📊 models/                  # Modèles PostgreSQL
│   ├── 🔌 routes/                  # Routes API Express
│   ├── 🎮 controllers/             # Contrôleurs métier
│   └── 💾 config/                  # Configuration DB
└── 🚀 vercel.json                  # Configuration déploiement
```

## 🔧 Stack technique

### **Frontend**
- **React 18** + Hooks + Context
- **Tailwind CSS** pour le design
- **Recharts** pour les graphiques
- **React Router** pour la navigation

### **Backend**  
- **Node.js** + Express.js
- **PostgreSQL** pour la persistance
- **JWT** pour l'authentification
- **CORS** configuré pour la production

### **Déploiement**
- **Frontend** : Vercel (CDN global)
- **Backend** : Railway (PostgreSQL inclus)
- **DNS** : Domaines personnalisés supportés

---

## 🚀 Installation rapide

```bash
# Cloner le projet
git clone https://github.com/votre-username/nfc-cards.git
cd nfc-cards

# Installation et lancement
./launch.sh
```

**Automatiquement disponible sur :**
- Frontend : http://localhost:3000
- Backend : http://localhost:5001

## 🚀 Démarrage rapide

### **🔧 Installation complète**

```bash
# Frontend
cd frontend
npm install

# Backend  
cd ../backend
npm install

# PostgreSQL (Mac)
brew install postgresql@14
brew services start postgresql@14
createdb nfc_cards
```

### **🚀 Lancement rapide**
```bash
# Script automatique (recommandé)
./launch.sh

# Ou manuellement
cd frontend && npm start  # Port 3000
cd backend && node server.js  # Port 5001
```

### 📍 Accès à l'application

- **🌐 Frontend** : http://localhost:3000
- **🔧 Backend API** : http://localhost:5001
- **📱 Scan test** : http://localhost:5001/scan/NFC001

---

## 🌐 Déploiement

### **🚀 Déploiement Vercel (Frontend)**

```bash
# Installation Vercel CLI
npm i -g vercel

# Déploiement
vercel --prod

# Configuration automatique via vercel.json
```

### **🚀 Déploiement Railway (Backend)**

```bash
# Installation Railway CLI  
npm install -g @railway/cli

# Login et déploiement
railway login
railway init
railway up
```

### **🔗 URLs de production**
- **Frontend** : `https://nfc-cards-app.vercel.app`
- **Backend** : `https://nfc-backend-mobydev.railway.app`

---

## 📊 Base de données

### **PostgreSQL Schema**
```sql
CREATE TABLE cards (
  id SERIAL PRIMARY KEY,
  card_code VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  job_title VARCHAR(200),
  company VARCHAR(200),
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(500),
  theme VARCHAR(50) DEFAULT 'gradient-blue',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **🎨 Thèmes disponibles**
- `gradient-blue` (défaut)
- `gradient-green`
- `gradient-purple` 
- `gradient-orange`
- `gradient-dark`
- `gradient-sunset`
- `gradient-ocean`
- `gradient-forest`

---

## 📱 Utilisation

### **🔐 Connexion Admin**
```
Email : admin@mobydev.com
Mot de passe : admin123
```

### **📋 Fonctionnalités**
1. **📊 Dashboard** : Vue d'ensemble + statistiques
2. **➕ Créer carte** : Formulaire complet + thèmes
3. **👁️ Prévisualiser** : Voir la carte scannée
4. **🔧 Modifier** : Édition inline + sauvegarde auto
5. **📱 QR Code** : Génération automatique
6. **📈 Analytics** : Tracking des scans + géolocalisation

### **🚀 Production**

**Frontend (Vercel)** : Interface admin pour gérer les cartes
**Backend (Railway)** : API + PostgreSQL + pages de scan publiques

**🔗 Liens utiles :**
- Admin : https://nfc-cards-app.vercel.app
- API : https://nfc-backend-mobydev.railway.app/api
- Scan exemple : https://nfc-backend-mobydev.railway.app/scan/NFC001

---

**🚀 Application prête à l'emploi ! Déployer avec Vercel + Railway pour une solution complète !** 