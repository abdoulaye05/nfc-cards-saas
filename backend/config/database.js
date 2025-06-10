const { Pool } = require('pg');

// Configuration PostgreSQL simple
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'nfc_cards',
  password: '', // Pas de mot de passe sur macOS par défaut
  port: 5432,
});

// Events de connexion
pool.on('connect', () => {
  console.log('✅ PostgreSQL connecté');
});

pool.on('error', (err) => {
  console.error('❌ Erreur PostgreSQL:', err.message);
});

// Fonction de test de connexion
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('🔌 Test connexion PostgreSQL OK');
    client.release();
    return true;
  } catch (error) {
    console.error('💥 Connexion PostgreSQL échoué:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  testConnection
}; 