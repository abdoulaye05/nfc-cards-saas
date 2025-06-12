// Client Supabase pour les fonctions API Vercel
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase avec variables d'environnement et fallback
const supabaseUrl = process.env.SUPABASE_URL || 'https://cfqoidzorptyplkfkoao.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmcW9pZHpvcnB0eXBsa2Zrb2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzkzNjQsImV4cCI6MjA2NTIxNTM2NH0.WYrMeT6ONSSgnHYOM8_3IYYj4dr6yyTIi7GV4LcSynA';

// Créer le client Supabase
export const supabase = createClient(supabaseUrl, supabaseKey); 