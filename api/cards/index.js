// API des cartes avec Supabase
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

  if (req.method === 'GET') {
    try {
      // Récupérer toutes les cartes depuis Supabase
      const { data: cards, error } = await supabase
        .from('cards')
        .select('*')
        .order('id');

      if (error) {
        throw error;
      }

      // Convertir les noms de colonnes PostgreSQL vers le format frontend
      const formattedCards = cards.map(card => ({
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
      }));

      res.status(200).json({
        success: true,
        data: {
          cards: formattedCards,
          total: formattedCards.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des cartes'
      });
    }
  } else if (req.method === 'POST') {
    try {
      // Créer une nouvelle carte dans Supabase
      const { data: existingCards, error: countError } = await supabase
        .from('cards')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);

      if (countError) {
        throw countError;
      }

      const maxId = existingCards.length > 0 ? existingCards[0].id : 0;
      const newCardCode = `NFC${String(maxId + 1).padStart(3, '0')}`;

      const { data: newCard, error } = await supabase
        .from('cards')
        .insert([
          {
            first_name: req.body.firstName,
            last_name: req.body.lastName,
            company: req.body.company,
            job_title: req.body.jobTitle,
            email: req.body.email,
            phone: req.body.phone,
            website: req.body.website,
            card_code: newCardCode,
            is_active: true,
            theme: req.body.theme || 'gradient-blue'
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Formater la réponse
      const formattedCard = {
        id: newCard.id,
        firstName: newCard.first_name,
        lastName: newCard.last_name,
        company: newCard.company,
        jobTitle: newCard.job_title,
        email: newCard.email,
        phone: newCard.phone,
        website: newCard.website,
        cardCode: newCard.card_code,
        isActive: newCard.is_active,
        createdAt: newCard.created_at,
        theme: newCard.theme
      };

      res.status(201).json({
        success: true,
        data: { card: formattedCard },
        message: 'Carte créée avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la carte'
      });
    }
  } else {
    res.status(405).json({
      success: false,
      message: 'Méthode non autorisée'
    });
  }
} 