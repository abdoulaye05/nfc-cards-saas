// API d'authentification pour Vercel
export default function handler(req, res) {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Méthode non autorisée'
    });
  }

  const { email, password } = req.body;
  
  // Vérification des identifiants
  if (email === 'admin@mobydev.com' && password === 'Azerty123*') {
    res.status(200).json({
      success: true,
      data: {
        token: 'vercel-token-' + Date.now(),
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
} 