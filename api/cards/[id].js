// API pour une carte spécifique avec Supabase
const { supabase } = require('../_supabase');

export default async function handler(req, res) {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;
  const cardId = parseInt(id);

  if (req.method === 'GET') {
    try {
      // Récupérer une carte par ID depuis Supabase
      const { data: card, error } = await supabase
        .from('cards')
        .select('*')
        .eq('id', cardId)
        .single();
      
      if (error || !card) {
        return res.status(404).json({
          success: false,
          message: 'Carte non trouvée'
        });
      }

      // Formater la réponse
      const formattedCard = {
        id: card.id,
        firstName: card.first_name,
        lastName: card.last_name,
        company: card.company,
        jobTitle: card.job_title,
        email: card.email,
        phone: card.phone,
        website: card.website,
        cardCode: card.card_code,
        isActive: card.is_active,
        createdAt: card.created_at,
        theme: card.theme
      };

      res.status(200).json({
        success: true,
        data: { card: formattedCard }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la carte'
      });
    }
  } else if (req.method === 'PUT') {
    try {
      // Mettre à jour une carte dans Supabase
      const { data: updatedCard, error } = await supabase
        .from('cards')
        .update({
          first_name: req.body.firstName,
          last_name: req.body.lastName,
          company: req.body.company,
          job_title: req.body.jobTitle,
          email: req.body.email,
          phone: req.body.phone,
          website: req.body.website,
          theme: req.body.theme
        })
        .eq('id', cardId)
        .select()
        .single();

      if (error || !updatedCard) {
        return res.status(404).json({
          success: false,
          message: 'Carte non trouvée'
        });
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
        message: 'Carte mise à jour avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la carte'
      });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Supprimer une carte de Supabase
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);

      if (error) {
        throw error;
      }
      
      res.status(200).json({
        success: true,
        message: 'Carte supprimée avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la carte'
      });
    }
  } else {
    res.status(405).json({
      success: false,
      message: 'Méthode non autorisée'
    });
  }
} 