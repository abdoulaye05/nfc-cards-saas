// API pour générer les QR codes avec Supabase
const { supabase } = require('../../_supabase');

export default async function handler(req, res) {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Méthode non autorisée'
    });
  }

  const { id } = req.query;
  const cardId = parseInt(id);
  
  // Récupérer la carte depuis Supabase
  const { data: targetCard, error } = await supabase
    .from('cards')
    .select('*')
    .eq('id', cardId)
    .single();
  
  if (error || !targetCard) {
    return res.status(404).json({
      success: false,
      message: 'Carte non trouvée'
    });
  }

  try {
    // Utiliser les bons noms de champs PostgreSQL
    const qrCodeUrl = targetCard.website || `https://mobydev.com/card/${targetCard.card_code}`;
    
    // Génération d'un QR code simple (pour la démo, on utilise un QR code basique)
    // En production, vous pourriez utiliser la librairie qrcode
    const qrCodeDataUrl = `data:image/svg+xml;base64,${Buffer.from(`
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
        <rect width="300" height="300" fill="white"/>
        <rect x="20" y="20" width="260" height="260" fill="none" stroke="black" stroke-width="2"/>
        <text x="150" y="140" text-anchor="middle" font-family="Arial" font-size="12" fill="black">QR Code</text>
        <text x="150" y="160" text-anchor="middle" font-family="Arial" font-size="10" fill="black">${targetCard.card_code}</text>
        <text x="150" y="180" text-anchor="middle" font-family="Arial" font-size="8" fill="black">${qrCodeUrl}</text>
      </svg>
    `).toString('base64')}`;

    res.status(200).json({
      success: true,
      data: {
        qrCode: qrCodeDataUrl,
        url: qrCodeUrl,
        cardCode: targetCard.card_code
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du QR Code'
    });
  }
} 