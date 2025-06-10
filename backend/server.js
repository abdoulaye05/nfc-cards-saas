const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const { cards: initialCards } = require('./data/mock-data');
const { pool, testConnection } = require('./config/database');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://localhost:3002',
    'https://nfc-cards-mobydev.vercel.app',
    /\.vercel\.app$/,
    /\.railway\.app$/
  ],
  credentials: true
}));
app.use(express.json());

// Variables pour gérer la base de données
let isDatabaseConnected = false;
let cardsData = [...initialCards.map(card => ({ ...card }))];

// Stockage des scans (en mémoire pour cette démo)
let cardScans = [];

// Validation et réparation automatique des données
const validateAndFixData = () => {
  let fixed = 0;
  
  // Réparer les cartes avec ID null
  const cardsWithNullIds = cardsData.filter(card => card.id === null || card.id === undefined);
  if (cardsWithNullIds.length > 0) {
    const validIds = cardsData.map(card => card.id).filter(id => id !== null && id !== undefined);
    let nextId = validIds.length > 0 ? Math.max(...validIds) + 1 : 1;
    
    cardsWithNullIds.forEach(card => {
      console.log(`🔧 Réparation carte ${card.cardCode}: ID null → ${nextId}`);
      card.id = nextId++;
      fixed++;
    });
  }
  
  if (fixed > 0) {
    console.log(`✅ ${fixed} carte(s) réparée(s) automatiquement`);
  }
  
  return fixed;
};

// Initialisation de la connexion à la base de données
const initializeDatabase = async () => {
  try {
    isDatabaseConnected = await testConnection();
    if (isDatabaseConnected) {
      console.log('🗄️ Mode: PostgreSQL connecté');
      // Charger les cartes depuis la base de données
      const queryResult = await pool.query('SELECT * FROM cards ORDER BY id');
      if (queryResult.rows.length > 0) {
        cardsData = queryResult.rows.map(row => ({
          id: row.id,
          firstName: row.first_name,
          lastName: row.last_name,
          company: row.company,
          jobTitle: row.job_title,
          email: row.email,
          phone: row.phone,
          website: row.website,
          cardCode: row.card_code,
          isActive: row.is_active,
          createdAt: row.created_at,
          theme: row.theme || 'gradient-blue'
        }));
        console.log(`📊 ${cardsData.length} cartes chargées depuis PostgreSQL`);
      }
    } else {
      console.log('🗃️ Mode: Données mockées (PostgreSQL indisponible)');
    }
    
    // Validation et réparation automatique des données
    validateAndFixData();
    
  } catch (error) {
    console.error('⚠️ Erreur lors de l\'initialisation de la base de données:', error.message);
    console.log('🗃️ Mode fallback: Utilisation des données mockées');
    isDatabaseConnected = false;
    
    // Validation même en mode fallback
    validateAndFixData();
  }
};

// Routes de base
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Backend NFC Cards - Mode Développement Complet',
    version: '2.0.0',
    features: ['auth', 'cards-crud', 'qr-codes', 'toggle-status'],
    timestamp: new Date().toISOString()
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Vérification COMPLÈTE des identifiants
  if (email === 'admin@mobydev.com' && password === 'Azerty123*') {
    res.json({
      success: true,
      data: {
        token: 'dev-token-' + Date.now(),
        user: {
          id: 1,
          email: email,
          role: 'admin',
          firstName: 'Admin',
          lastName: 'Mobydev'
        }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Email ou mot de passe incorrect'
    });
  }
});

// Routes cartes
app.get('/api/cards', (req, res) => {
  res.json({
    success: true,
    data: {
      cards: cardsData,
      total: cardsData.length
    }
  });
});

app.get('/api/cards/:id', (req, res) => {
  const cardId = parseInt(req.params.id);
  const foundCard = cardsData.find(card => card.id === cardId);
  
  if (!foundCard) {
    return res.status(404).json({
      success: false,
      message: 'Carte non trouvée'
    });
  }
  
  res.json({
    success: true,
    data: { card: foundCard }
  });
});

app.post('/api/cards', async (req, res) => {
  try {
    // Filtrer les IDs valides et calculer le max
    const validIds = cardsData.map(card => card.id).filter(id => id !== null && id !== undefined);
    const maxId = validIds.length > 0 ? Math.max(...validIds) : 0;
    
    const newCard = {
      id: maxId + 1,
      ...req.body,
      cardCode: `NFC${String(maxId + 1).padStart(3, '0')}`,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    if (isDatabaseConnected) {
      // Sauvegarder dans PostgreSQL
      const query = `
        INSERT INTO cards (first_name, last_name, company, job_title, email, phone, website, card_code, is_active, created_at, theme)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      const values = [
        newCard.firstName, newCard.lastName, newCard.company, newCard.jobTitle,
        newCard.email, newCard.phone, newCard.website, newCard.cardCode,
        newCard.isActive, newCard.createdAt, newCard.theme || 'gradient-blue'
      ];
      
      const result = await pool.query(query, values);
      const savedCard = {
        id: result.rows[0].id,
        firstName: result.rows[0].first_name,
        lastName: result.rows[0].last_name,
        company: result.rows[0].company,
        jobTitle: result.rows[0].job_title,
        email: result.rows[0].email,
        phone: result.rows[0].phone,
        website: result.rows[0].website,
        cardCode: result.rows[0].card_code,
        isActive: result.rows[0].is_active,
        createdAt: result.rows[0].created_at,
        theme: result.rows[0].theme
      };
      
      // Mettre à jour le cache mémoire
      cardsData.push(savedCard);
      
      res.json({
        success: true,
        data: { card: savedCard },
        message: 'Carte créée avec succès et sauvegardée'
      });
    } else {
      // Mode fallback: sauvegarder seulement en mémoire
      cardsData.push(newCard);
      
      res.json({
        success: true,
        data: { card: newCard },
        message: 'Carte créée avec succès (mode mémoire)'
      });
    }
  } catch (error) {
    console.error('Erreur création carte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la carte'
    });
  }
});

app.get('/api/cards/:id/qr-code', async (req, res) => {
  try {
    const cardId = parseInt(req.params.id);
    const targetCard = cardsData.find(card => card.id === cardId);
    
    if (!targetCard) {
      return res.status(404).json({
        success: false,
        message: 'Carte non trouvée'
      });
    }

    const qrCodeUrl = targetCard.website || `https://mobydev.com/card/${targetCard.cardCode}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.json({
      success: true,
      data: {
        qrCode: qrCodeDataUrl,
        url: qrCodeUrl,
        cardCode: targetCard.cardCode
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du QR Code'
    });
  }
});

// Route pour changer le statut d'une carte (activer/désactiver)
app.patch('/api/cards/:id/toggle-status', (req, res) => {
  const cardId = parseInt(req.params.id);
  const cardIndex = cardsData.findIndex(card => card.id === cardId);
  
  if (cardIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Carte non trouvée'
    });
  }

  // Inverser le statut actuel
  cardsData[cardIndex].isActive = !cardsData[cardIndex].isActive;
  
  res.json({
    success: true,
    data: {
      card: cardsData[cardIndex]
    },
    message: `Carte ${cardsData[cardIndex].isActive ? 'activée' : 'désactivée'} avec succès`
  });
});

// Route pour supprimer une carte
app.delete('/api/cards/:id', (req, res) => {
  const cardId = parseInt(req.params.id);
  const cardIndex = cardsData.findIndex(card => card.id === cardId);
  
  if (cardIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Carte non trouvée'
    });
  }

  // Supprimer la carte du tableau
  const deletedCard = cardsData.splice(cardIndex, 1)[0];
  
  res.json({
    success: true,
    data: {
      card: deletedCard
    },
    message: 'Carte supprimée avec succès'
  });
});

// Route pour mettre à jour une carte
app.put('/api/cards/:id', (req, res) => {
  const cardId = parseInt(req.params.id);
  const cardIndex = cardsData.findIndex(card => card.id === cardId);
  
  if (cardIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Carte non trouvée'
    });
  }

  // Mettre à jour les données de la carte
  cardsData[cardIndex] = {
    ...cardsData[cardIndex],
    ...req.body,
    id: cardId, // Préserver l'ID
    cardCode: cardsData[cardIndex].cardCode, // Préserver le code de la carte
    createdAt: cardsData[cardIndex].createdAt // Préserver la date de création
  };
  
  res.json({
    success: true,
    data: {
      card: cardsData[cardIndex]
    },
    message: 'Carte mise à jour avec succès'
  });
});

// 📱 Route de tracking des scans NFC (publique)
app.get('/scan/:cardCode', (req, res) => {
  const { cardCode } = req.params;
  
  // Trouver la carte
  const card = cardsData.find(c => c.cardCode === cardCode);
  
  // Thème par défaut ou personnalisé
  const theme = card.theme || 'gradient-blue';
  
  if (!card) {
    return res.status(404).send(`
      <h1>❌ Carte non trouvée</h1>
      <p>Code carte: ${cardCode}</p>
    `);
  }

  if (!card.isActive) {
    return res.status(410).send(`
      <h1>🚫 Carte désactivée</h1>
      <p>Cette carte NFC n'est plus active.</p>
    `);
  }

  // Enregistrer le scan avec analytics
  const scanData = {
    id: Date.now(),
    cardCode: cardCode,
    cardId: card.id,
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'] || 'Unknown',
    ip: req.ip || req.connection.remoteAddress || 'Unknown',
    referer: req.headers.referer || null
  };
  
  cardScans.push(scanData);
  
  console.log(`📱 Scan NFC: ${cardCode} par ${scanData.ip} à ${scanData.timestamp}`);

  // Redirection vers le site de la personne
  const redirectUrl = card.website || `https://linkedin.com/in/${card.firstName.toLowerCase()}-${card.lastName.toLowerCase()}`;
  
  // Page d'informations complète (pas de redirection automatique)
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${card.firstName} ${card.lastName} - ${card.company}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="description" content="${card.firstName} ${card.lastName}, ${card.jobTitle} chez ${card.company}">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        /* Thèmes de couleurs */
        .gradient-blue { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .gradient-green { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
        .gradient-purple { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .gradient-orange { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        .gradient-dark { background: linear-gradient(135deg, #434343 0%, #000000 100%); }
        .gradient-sunset { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
        .gradient-ocean { background: linear-gradient(135deg, #2196F3 0%, #00BCD4 100%); }
        .gradient-forest { background: linear-gradient(135deg, #134E5E 0%, #71B280 100%); }
        
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; min-height: 100vh; padding: 20px; }
        
        /* Bouton retour */
        .back-button-container { 
          max-width: 450px; 
          margin: 0 auto 15px; 
          text-align: left; 
        }
        .back-btn { 
          background: rgba(255, 255, 255, 0.95); 
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 12px 18px; 
          border-radius: 30px; 
          font-size: 14px; 
          font-weight: 600; 
          color: #333; 
          cursor: pointer; 
          display: inline-flex; 
          align-items: center; 
          gap: 8px; 
          transition: all 0.3s ease;
          backdrop-filter: blur(15px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        .back-btn:hover { 
          background: rgba(255, 255, 255, 1); 
          transform: translateY(-3px); 
          box-shadow: 0 12px 35px rgba(0,0,0,0.2);
          border-color: rgba(102, 126, 234, 0.3);
        }
        .back-btn:active {
          transform: translateY(-1px);
        }
        .theme-bg { min-height: 100vh; padding: 20px; }
        .profile-card { background: white; border-radius: 20px; max-width: 450px; margin: 20px auto; box-shadow: 0 15px 35px rgba(0,0,0,0.2); overflow: hidden; }
        .header { color: white; padding: 30px; text-align: center; }
        .avatar { width: 80px; height: 80px; border-radius: 50%; background: rgba(255,255,255,0.2); margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; }
        .name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .title { font-size: 16px; opacity: 0.9; }
        .company { font-size: 14px; opacity: 0.8; margin-top: 5px; }
        .content { padding: 30px; }
        .contact-info { margin-bottom: 25px; }
        .contact-item { display: flex; align-items: center; margin-bottom: 12px; padding: 10px; background: #f8f9fa; border-radius: 10px; }
        .contact-icon { width: 20px; margin-right: 12px; opacity: 0.7; display: flex; align-items: center; }
        .contact-icon svg { color: #667eea; }
        .actions { text-align: center; }
        .btn { display: inline-flex; align-items: center; padding: 12px 25px; margin: 5px; border-radius: 25px; text-decoration: none; font-weight: 500; transition: all 0.3s; }
        .btn svg { vertical-align: middle; }
        .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .btn-secondary { border: 2px solid #667eea; color: #667eea; background: transparent; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; background: #f8f9fa; }
        .nfc-badge { background: #667eea; color: white; padding: 5px 10px; border-radius: 15px; font-size: 11px; margin-top: 10px; display: flex; align-items: center; gap: 6px; }
      </style>
    </head>
    <body>
      <div class="theme-bg ${theme}">
        <!-- Bouton retour pour admin -->
        <div class="back-button-container">
          <button onclick="goBack()" class="back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 5L5 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Retour
          </button>
        </div>
        
        <div class="profile-card">
          <div class="header ${theme}">
          <div class="avatar">${card.firstName.charAt(0)}${card.lastName.charAt(0)}</div>
          <div class="name">${card.firstName} ${card.lastName}</div>
          <div class="title">${card.jobTitle}</div>
          <div class="company">${card.company}</div>
                      <div class="nfc-badge">
              <svg class="nfc-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 7C2 5.34315 3.34315 4 5 4H19C20.6569 4 22 5.34315 22 7V17C22 18.6569 20.6569 20 19 20H5C3.34315 20 2 18.6569 2 17V7Z" stroke="currentColor" stroke-width="2"/>
                <path d="M8 8V16M16 8V16M12 8V16" stroke="currentColor" stroke-width="2"/>
              </svg>
              Carte NFC • ${card.cardCode}
            </div>
        </div>
        
        <div class="content">
          <div class="contact-info">
            ${card.email ? `
              <div class="contact-item">
                <div class="contact-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                </div>
                <div><a href="mailto:${card.email}" style="color: #333; text-decoration: none;">${card.email}</a></div>
              </div>
            ` : ''}
            
            ${card.phone ? `
              <div class="contact-item">
                <div class="contact-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                </div>
                <div><a href="tel:${card.phone}" style="color: #333; text-decoration: none;">${card.phone}</a></div>
              </div>
            ` : ''}
            
            ${card.website ? `
              <div class="contact-item">
                <div class="contact-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-1.95-.49-3.5-1.93-4.62-3.93h4.62v3.93zm0-5.93H6.26c-.22-1.31-.22-2.69 0-4h4.74v4zm0-6H6.26c1.12-2 2.67-3.44 4.62-3.93V7zm2 0V3.07c1.95.49 3.5 1.93 4.62 3.93H13zm0 2h4.74c.22 1.31.22 2.69 0 4H13V9zm0 6h4.62c-1.12 2-2.67 3.44-4.62 3.93V15z" fill="currentColor"/>
                  </svg>
                </div>
                <div><a href="${card.website}" target="_blank" style="color: #333; text-decoration: none;">Site web</a></div>
              </div>
            ` : ''}
          </div>
          
          <div class="actions">
            ${card.email ? `<a href="mailto:${card.email}" class="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
                <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              Envoyer un email
            </a>` : ''}
            ${card.phone ? `<a href="tel:${card.phone}" class="btn btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
                <path d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              Appeler
            </a>` : ''}
            ${card.website ? `<a href="${card.website}" target="_blank" class="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-1.95-.49-3.5-1.93-4.62-3.93h4.62v3.93zm0-5.93H6.26c-.22-1.31-.22-2.69 0-4h4.74v4zm0-6H6.26c1.12-2 2.67-3.44 4.62-3.93V7zm2 0V3.07c1.95.49 3.5 1.93 4.62 3.93H13zm0 2h4.74c.22 1.31.22 2.69 0 4H13V9zm0 6h4.62c-1.12 2-2.67 3.44-4.62 3.93V15z" fill="currentColor"/>
              </svg>
              Voir le site
            </a>` : ''}
            
            <div style="margin-top: 15px;">
              <button onclick="addToContacts()" class="btn btn-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
                  <path d="M19 14C20.49 14 22 15.5 22 17V20H2V17C2 15.5 3.51 14 5 14H6.22C6.43 13.5 6.72 13.06 7.1 12.7L9 10.8V8C9 5.79 10.79 4 13 4H16C18.21 4 20 5.79 20 8V10.8L21.9 12.7C22.28 13.06 22.57 13.5 22.78 14H19ZM18 8C18 6.9 17.1 6 16 6H13C11.9 6 11 6.9 11 8V10.8L9.1 12.7C8.72 13.06 8.43 13.5 8.22 14H19C19 13.5 18.72 13.06 18.35 12.7L16.9 11.25C16.77 11.12 16.7 10.94 16.7 10.75V8ZM5 16H19V18H5V16Z" fill="currentColor"/>
                </svg>
                Ajouter aux contacts
              </button>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; margin-right: 5px; vertical-align: middle;">
            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor"/>
          </svg>
          Carte NFC propulsée par <strong>Mobydev</strong><br>
          <small>Scannée le ${new Date().toLocaleString('fr-FR')}</small>
          </div>
        </div>
      </div>
      
      <script>
        function goBack() {
          try {
            // Essayer d'abord de revenir en arrière
            if (window.history.length > 1) {
              window.history.back();
            } else {
              // Si pas d'historique, ouvrir l'admin
              window.location.href = 'http://localhost:3000';
            }
          } catch (error) {
            // En cas d'erreur, rediriger vers l'admin
            console.log('Redirection vers admin...');
            window.location.href = 'http://localhost:3000';
          }
        }
        
        function addToContacts() {
          // Créer un fichier vCard pour ajouter aux contacts
          const vcard = \`BEGIN:VCARD
VERSION:3.0
FN:${card.firstName} ${card.lastName}
N:${card.lastName};${card.firstName}
ORG:${card.company}
TITLE:${card.jobTitle}
${card.email ? 'EMAIL:' + card.email : ''}
${card.phone ? 'TEL:' + card.phone : ''}
${card.website ? 'URL:' + card.website : ''}
END:VCARD\`;
          
          const blob = new Blob([vcard], { type: 'text/vcard' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = '${card.firstName}_${card.lastName}.vcf';
          a.click();
          window.URL.revokeObjectURL(url);
        }
      </script>
    </body>
    </html>
  `);
});

// 🔍 Route pour valider l'intégrité des données
app.get('/api/cards/validate', (req, res) => {
  const issues = [];
  
  // Vérifier les IDs null
  const cardsWithNullIds = cardsData.filter(card => card.id === null || card.id === undefined);
  if (cardsWithNullIds.length > 0) {
    issues.push({
      type: 'null_ids',
      count: cardsWithNullIds.length,
      cards: cardsWithNullIds.map(card => card.cardCode)
    });
  }
  
  // Vérifier les IDs dupliqués
  const ids = cardsData.map(card => card.id).filter(id => id !== null);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    issues.push({
      type: 'duplicate_ids',
      ids: [...new Set(duplicateIds)]
    });
  }
  
  // Vérifier les cardCodes dupliqués
  const cardCodes = cardsData.map(card => card.cardCode);
  const duplicateCodes = cardCodes.filter((code, index) => cardCodes.indexOf(code) !== index);
  if (duplicateCodes.length > 0) {
    issues.push({
      type: 'duplicate_card_codes',
      codes: [...new Set(duplicateCodes)]
    });
  }
  
  res.json({
    success: true,
    isValid: issues.length === 0,
    issues,
    message: issues.length === 0 ? 'Toutes les cartes sont valides' : `${issues.length} problème(s) détecté(s)`
  });
});

// 🔧 Route pour réparer les cartes avec ID null
app.post('/api/cards/fix-null-ids', (req, res) => {
  const cardsWithNullIds = cardsData.filter(card => card.id === null || card.id === undefined);
  
  if (cardsWithNullIds.length === 0) {
    return res.json({
      success: true,
      message: 'Aucune carte à réparer',
      fixed: 0
    });
  }
  
  // Obtenir le prochain ID disponible
  const validIds = cardsData.map(card => card.id).filter(id => id !== null && id !== undefined);
  let nextId = validIds.length > 0 ? Math.max(...validIds) + 1 : 1;
  
  // Réparer chaque carte avec ID null
  cardsWithNullIds.forEach(card => {
    card.id = nextId++;
  });
  
  res.json({
    success: true,
    message: `${cardsWithNullIds.length} carte(s) réparée(s)`,
    fixed: cardsWithNullIds.length,
    repairedCards: cardsWithNullIds.map(card => ({
      id: card.id,
      cardCode: card.cardCode,
      name: `${card.firstName} ${card.lastName}`
    }))
  });
});

// 📊 Route analytics des scans
app.get('/api/cards/:id/scans', (req, res) => {
  const cardId = parseInt(req.params.id);
  const card = cardsData.find(c => c.id === cardId);
  
  if (!card) {
    return res.status(404).json({
      success: false,
      message: 'Carte non trouvée'
    });
  }

  const cardScanData = cardScans.filter(scan => scan.cardId === cardId);
  
  // Calculer les visiteurs uniques (par IP)
  const uniqueVisitors = new Set(cardScanData.map(scan => scan.ip)).size;
  
  res.json({
    success: true,
    data: {
      totalScans: cardScanData.length,
      uniqueVisitors: uniqueVisitors,
      scans: cardScanData.slice(-50), // Derniers 50 scans
      analytics: {
        avgScansPerVisitor: uniqueVisitors > 0 ? (cardScanData.length / uniqueVisitors).toFixed(1) : 0,
        firstScan: cardScanData[0]?.timestamp || null,
        lastScan: cardScanData[cardScanData.length - 1]?.timestamp || null
      }
    }
  });
});

// Route par défaut
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API NFC Cards - Mode Développement',
    endpoints: {
      health: '/api/health',
      login: 'POST /api/auth/login',
      cards: '/api/cards',
      scan: '/scan/:cardCode (public)'
    }
  });
});

const PORT = process.env.PORT || 5001;

// Démarrage du serveur avec initialisation DB
const startServer = async () => {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 Backend NFC Cards complet démarré sur le port ${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/api/health`);
    console.log(`🎯 Fonctionnalités: Auth, CRUD cartes, QR codes, Toggle statut`);
    console.log(`📊 ${cardsData.length} cartes disponibles avec sites web`);
    console.log(`💾 Base de données: ${isDatabaseConnected ? 'PostgreSQL' : 'Données mockées'}`);
  });
};

startServer().catch(console.error);

module.exports = app; 
