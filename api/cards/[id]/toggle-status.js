// API pour changer le statut d'une carte avec Supabase
const { supabase } = require('../../_supabase');

export default async function handler(req, res) {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({
      success: false,
      message: 'Méthode non autorisée'
    });
  }

  const { id } = req.query;
  const cardId = parseInt(id);

  try {
    // Récupérer la carte actuelle
    const { data: currentCard, error: fetchError } = await supabase
      .from('cards')
      .select('is_active')
      .eq('id', cardId)
      .single();

    if (fetchError || !currentCard) {
      return res.status(404).json({
        success: false,
        message: 'Carte non trouvée'
      });
    }

    // Inverser le statut
    const newStatus = !currentCard.is_active;
    
    const { data: updatedCard, error: updateError } = await supabase
      .from('cards')
      .update({ is_active: newStatus })
      .eq('id', cardId)
      .select('*')
      .single();

    if (updateError) {
      throw updateError;
    }

    // Formater la réponse
    const formattedCard = {
      id: updatedCard.id,
      firstName: updatedCard.first_name,
      lastName: updatedCard.last_name,
      company: updatedCard.company,
      jobTitle: updatedCard.job_title,
      email: updatedCard.email,
      phone: updatedCard.phone,
      website: updatedCard.website,
      cardCode: updatedCard.card_code,
      isActive: updatedCard.is_active,
      createdAt: updatedCard.created_at,
      theme: updatedCard.theme
    };
    
    res.status(200).json({
      success: true,
      data: { card: formattedCard },
      message: `Carte ${formattedCard.isActive ? 'activée' : 'désactivée'} avec succès`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de statut'
    });
  }
} 