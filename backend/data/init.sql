-- Script d'initialisation PostgreSQL pour NFC Cards

-- Créer la base de données (à exécuter manuellement)
-- CREATE DATABASE nfc_cards;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'employee',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des cartes NFC
CREATE TABLE IF NOT EXISTS cards (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(100),
    job_title VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    website VARCHAR(255),
    card_code VARCHAR(20) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des scans (historique)
CREATE TABLE IF NOT EXISTS scans (
    id SERIAL PRIMARY KEY,
    card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
    scan_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scan_location VARCHAR(255),
    ip_address INET,
    user_agent TEXT
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_cards_code ON cards(card_code);
CREATE INDEX IF NOT EXISTS idx_cards_active ON cards(is_active);
CREATE INDEX IF NOT EXISTS idx_scans_card_date ON scans(card_id, scan_date);

-- Insérer l'utilisateur admin par défaut
INSERT INTO users (email, password_hash, first_name, last_name, role) 
VALUES ('admin@mobydev.com', '$2a$10$placeholder', 'Admin', 'Mobydev', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insérer les cartes de test
INSERT INTO cards (first_name, last_name, company, job_title, email, phone, website, card_code, is_active) VALUES
('John', 'Doe', 'Mobydev', 'Développeur Senior', 'john@mobydev.com', '+33 1 23 45 67 89', 'https://johndoe.dev', 'NFC001', true),
('Jane', 'Smith', 'Mobydev', 'Designer UX/UI', 'jane@mobydev.com', '+33 1 23 45 67 90', 'https://janesmith.pro', 'NFC002', true),
('Pierre', 'Martin', 'Mobydev', 'Chef de Projet', 'pierre@mobydev.com', '+33 1 23 45 67 91', 'https://pierremartin.fr', 'NFC003', true),
('Marie', 'Dubois', 'Mobydev', 'Consultante Business', 'marie@mobydev.com', '+33 1 23 45 67 92', 'https://mariedubois.com', 'NFC004', false),
('Ahmed', 'Ben Ali', 'Mobydev', 'Développeur Mobile', 'ahmed@mobydev.com', '+33 1 23 45 67 93', 'https://ahmedbenali.net', 'NFC005', true),
('Sarah', 'Johnson', 'Mobydev', 'Data Analyst', 'sarah@mobydev.com', '+33 1 23 45 67 94', 'https://sarahjohnson.io', 'NFC006', true),
('Lucas', 'Garcia', 'Mobydev', 'DevOps Engineer', 'lucas@mobydev.com', '+33 1 23 45 67 95', 'https://lucasgarcia.es', 'NFC007', false),
('Emma', 'Wilson', 'Mobydev', 'Marketing Manager', 'emma@mobydev.com', '+33 1 23 45 67 96', 'https://emmawilson.uk', 'NFC008', true)
ON CONFLICT (card_code) DO NOTHING; 