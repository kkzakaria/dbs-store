-- ===========================================
-- DBS STORE - Seed Data
-- ===========================================
-- Ce fichier crée des données de test pour le développement local
--
-- Utilisateurs de test (email/mot de passe):
-- - superadmin@dbs-store.ci / password123 (super_admin)
-- - admin@dbs-store.ci / password123 (admin)
-- - client@dbs-store.ci / password123 (customer)
-- ===========================================

-- Nettoyer les données existantes (dans l'ordre des dépendances)
TRUNCATE public.reviews CASCADE;
TRUNCATE public.order_items CASCADE;
TRUNCATE public.orders CASCADE;
TRUNCATE public.cart_items CASCADE;
TRUNCATE public.wishlist CASCADE;
TRUNCATE public.addresses CASCADE;
TRUNCATE public.users CASCADE;
TRUNCATE public.products CASCADE;
TRUNCATE public.promotions CASCADE;
TRUNCATE public.categories CASCADE;
TRUNCATE public.shipping_zones CASCADE;

-- Nettoyer auth.users pour les emails de test (éviter les conflits)
DELETE FROM auth.users WHERE email IN ('superadmin@dbs-store.ci', 'admin@dbs-store.ci', 'client@dbs-store.ci');

-- ===========================================
-- Créer les utilisateurs de test
-- ===========================================
-- Note: Le trigger handle_new_user() crée automatiquement le profil
-- dans public.users avec role='customer'. On UPDATE ensuite pour
-- définir le rôle et le nom correct.
-- Mot de passe pour tous: password123

-- Super Admin: superadmin@dbs-store.ci
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'superadmin@dbs-store.ci',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Super Admin DBS"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

UPDATE public.users SET
  full_name = 'Super Admin DBS',
  role = 'super_admin'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- Admin: admin@dbs-store.ci
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  'a0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@dbs-store.ci',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Admin DBS"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

UPDATE public.users SET
  full_name = 'Admin DBS',
  role = 'admin'
WHERE id = 'a0000000-0000-0000-0000-000000000002';

-- Client standard: client@dbs-store.ci
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  'a0000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'client@dbs-store.ci',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Client Test"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

UPDATE public.users SET
  full_name = 'Client Test',
  loyalty_points = 500
WHERE id = 'a0000000-0000-0000-0000-000000000003';

-- ===========================================
-- 3. Créer les catégories
-- ===========================================

INSERT INTO public.categories (id, name, slug, description, image_url, is_active, position, created_at) VALUES
  (gen_random_uuid(), 'Smartphones', 'smartphones', 'Les derniers smartphones des grandes marques', NULL, true, 1, NOW()),
  (gen_random_uuid(), 'Ordinateurs', 'ordinateurs', 'Laptops et ordinateurs de bureau', NULL, true, 2, NOW()),
  (gen_random_uuid(), 'Tablettes', 'tablettes', 'Tablettes tactiles pour le travail et les loisirs', NULL, true, 3, NOW()),
  (gen_random_uuid(), 'Accessoires', 'accessoires', 'Accessoires pour vos appareils électroniques', NULL, true, 4, NOW()),
  (gen_random_uuid(), 'Audio', 'audio', 'Casques, écouteurs et enceintes', NULL, true, 5, NOW()),
  (gen_random_uuid(), 'TV & Écrans', 'tv-ecrans', 'Téléviseurs et moniteurs', NULL, true, 6, NOW());

-- ===========================================
-- 4. Créer les zones de livraison
-- ===========================================

INSERT INTO public.shipping_zones (id, name, cities, fee, estimated_days, is_active, created_at) VALUES
  (gen_random_uuid(), 'Abidjan Centre', ARRAY['Plateau', 'Cocody', 'Marcory', 'Treichville'], 1500, '1-2 jours', true, NOW()),
  (gen_random_uuid(), 'Abidjan Périphérie', ARRAY['Yopougon', 'Abobo', 'Bingerville', 'Port-Bouët'], 2500, '2-3 jours', true, NOW()),
  (gen_random_uuid(), 'Intérieur du pays', ARRAY['Bouaké', 'Yamoussoukro', 'San-Pédro', 'Korhogo'], 5000, '3-5 jours', true, NOW());

-- ===========================================
-- 5. Créer quelques produits de test
-- ===========================================

-- Récupérer l'ID de la catégorie Smartphones
DO $$
DECLARE
  cat_smartphones UUID;
  cat_ordinateurs UUID;
  cat_accessoires UUID;
  cat_audio UUID;
BEGIN
  SELECT id INTO cat_smartphones FROM public.categories WHERE slug = 'smartphones' LIMIT 1;
  SELECT id INTO cat_ordinateurs FROM public.categories WHERE slug = 'ordinateurs' LIMIT 1;
  SELECT id INTO cat_accessoires FROM public.categories WHERE slug = 'accessoires' LIMIT 1;
  SELECT id INTO cat_audio FROM public.categories WHERE slug = 'audio' LIMIT 1;

  -- Smartphones (4 products)
  INSERT INTO public.products (id, category_id, name, slug, description, price, compare_price, sku, stock_quantity, is_active, is_featured, brand, specifications, created_at) VALUES
    (gen_random_uuid(), cat_smartphones, 'iPhone 15 Pro Max 256GB', 'iphone-15-pro-max-256gb', 'Le smartphone le plus puissant d''Apple avec la puce A17 Pro, ecran Super Retina XDR 6.7 pouces, systeme de camera pro avec zoom optique 5x et chassis en titane.', 1450000, 1550000, 'APL-IPH15PM-256', 15, true, true, 'Apple', '{"couleurs": ["Titane naturel", "Titane bleu", "Titane blanc", "Titane noir"], "stockage": "256 Go", "ecran": "6.7 pouces Super Retina XDR", "processeur": "A17 Pro", "camera": "48MP + 12MP + 12MP", "batterie": "4422 mAh", "os": "iOS 17"}', NOW()),
    (gen_random_uuid(), cat_smartphones, 'Samsung Galaxy S24 Ultra 512GB', 'samsung-galaxy-s24-ultra-512gb', 'Le Galaxy S24 Ultra repousse les limites avec son ecran Dynamic AMOLED 2X de 6.8 pouces, le processeur Snapdragon 8 Gen 3 et des fonctionnalites Galaxy AI revolutionnaires. Inclut le S Pen integre.', 1350000, NULL, 'SAM-S24U-512', 20, true, true, 'Samsung', '{"couleurs": ["Violet Titane", "Gris Titane", "Noir Titane", "Jaune Titane"], "stockage": "512 Go", "ecran": "6.8 pouces Dynamic AMOLED 2X", "processeur": "Snapdragon 8 Gen 3", "camera": "200MP + 50MP + 12MP + 10MP", "batterie": "5000 mAh", "ram": "12 Go"}', NOW()),
    (gen_random_uuid(), cat_smartphones, 'Xiaomi 14 Pro 256GB', 'xiaomi-14-pro-256gb', 'Smartphone haut de gamme avec optiques Leica, ecran LTPO AMOLED 120Hz, Snapdragon 8 Gen 3 et charge rapide 120W. Un rapport qualite-prix imbattable.', 750000, 850000, 'XIA-14P-256', 25, true, false, 'Xiaomi', '{"couleurs": ["Noir", "Blanc", "Vert jade"], "stockage": "256 Go", "ecran": "6.73 pouces LTPO AMOLED", "processeur": "Snapdragon 8 Gen 3", "camera": "50MP Leica + 50MP + 50MP", "batterie": "4880 mAh", "charge": "120W filaire"}', NOW()),
    (gen_random_uuid(), cat_smartphones, 'Google Pixel 8 Pro 128GB', 'google-pixel-8-pro-128gb', 'L''experience Android pure avec le processeur Google Tensor G3, 7 ans de mises a jour et les meilleures capacites photo IA du marche.', 650000, NULL, 'GOO-PX8P-128', 12, true, false, 'Google', '{"couleurs": ["Obsidienne", "Porcelaine", "Bleu Azur"], "stockage": "128 Go", "ecran": "6.7 pouces LTPO OLED", "processeur": "Google Tensor G3", "camera": "50MP + 48MP + 48MP", "batterie": "5050 mAh", "os": "Android 14"}', NOW());

  -- Ordinateurs (4 products)
  INSERT INTO public.products (id, category_id, name, slug, description, price, compare_price, sku, stock_quantity, is_active, is_featured, brand, specifications, created_at) VALUES
    (gen_random_uuid(), cat_ordinateurs, 'MacBook Pro 14" M3 Pro 512GB', 'macbook-pro-14-m3-pro-512gb', 'Puissance professionnelle avec la puce M3 Pro, ecran Liquid Retina XDR 14.2 pouces, jusqu''a 18h d''autonomie. Ideal pour le developpement et le montage video.', 1950000, 2100000, 'APL-MBP14-M3P-512', 8, true, true, 'Apple', '{"processeur": "Apple M3 Pro 11 coeurs", "ram": "18 Go", "stockage": "512 Go SSD", "ecran": "14.2 pouces Liquid Retina XDR", "ports": ["3x Thunderbolt 4", "HDMI", "SD Card", "MagSafe 3"], "autonomie": "18 heures", "poids": "1.61 kg"}', NOW()),
    (gen_random_uuid(), cat_ordinateurs, 'Dell XPS 15 Intel Core i7 16GB', 'dell-xps-15-i7-16gb', 'Ultrabook premium avec ecran OLED 3.5K tactile, Intel Core i7 de 13e generation, design InfinityEdge et construction en aluminium.', 1250000, NULL, 'DEL-XPS15-I7-16', 10, true, false, 'Dell', '{"processeur": "Intel Core i7-13700H", "ram": "16 Go DDR5", "stockage": "512 Go SSD NVMe", "ecran": "15.6 pouces OLED 3.5K tactile", "gpu": "Intel Iris Xe", "poids": "1.86 kg"}', NOW()),
    (gen_random_uuid(), cat_ordinateurs, 'Lenovo ThinkPad X1 Carbon Gen 11', 'lenovo-thinkpad-x1-carbon-gen11', 'L''ultrabook professionnel de reference avec Intel Core i7 vPro, ecran 2.8K OLED et clavier legendaire ThinkPad.', 1450000, 1550000, 'LEN-X1C-G11-I7', 6, true, false, 'Lenovo', '{"processeur": "Intel Core i7-1365U vPro", "ram": "16 Go LPDDR5", "stockage": "512 Go SSD", "ecran": "14 pouces 2.8K OLED", "securite": ["Lecteur empreintes", "IR Camera", "TPM 2.0"], "autonomie": "15 heures", "poids": "1.12 kg"}', NOW()),
    (gen_random_uuid(), cat_ordinateurs, 'ASUS ROG Zephyrus G14 RTX 4060', 'asus-rog-zephyrus-g14-rtx4060', 'PC portable gaming ultra-fin avec AMD Ryzen 9, NVIDIA RTX 4060, ecran ROG Nebula 165Hz. Gaming AAA dans un format compact.', 1150000, NULL, 'ASU-G14-R9-4060', 14, true, true, 'ASUS', '{"processeur": "AMD Ryzen 9 7940HS", "ram": "16 Go DDR5", "stockage": "1 To SSD NVMe", "ecran": "14 pouces QHD+ 165Hz", "gpu": "NVIDIA RTX 4060 8GB", "clavier": "RGB per-key", "poids": "1.72 kg"}', NOW());

  -- Accessoires (4 products)
  INSERT INTO public.products (id, category_id, name, slug, description, price, compare_price, sku, stock_quantity, is_active, is_featured, brand, specifications, created_at) VALUES
    (gen_random_uuid(), cat_accessoires, 'Apple AirPods Pro 2e generation', 'apple-airpods-pro-2', 'Ecouteurs sans fil avec reduction de bruit active 2x plus puissante, audio spatial personnalise et boitier MagSafe avec localisation.', 185000, 210000, 'APL-APP2-WHT', 50, true, true, 'Apple', '{"type": "Intra-auriculaires", "anc": "Reduction de bruit active 2x", "audio_spatial": true, "autonomie": "6h (30h avec boitier)", "resistance": "IPX4", "connectivite": "Bluetooth 5.3", "boitier": "MagSafe + USB-C"}', NOW()),
    (gen_random_uuid(), cat_accessoires, 'Chargeur MagSafe Duo Apple', 'chargeur-magsafe-duo-apple', 'Station de charge pliable pour iPhone et Apple Watch. Charge rapide 15W pour iPhone, design compact pour les voyages.', 95000, NULL, 'APL-MSGD-WHT', 35, true, false, 'Apple', '{"puissance": "15W iPhone, 5W Apple Watch", "compatibilite": ["iPhone 12+", "Apple Watch Series 3+"], "pliable": true, "cable": "USB-C 1m inclus"}', NOW()),
    (gen_random_uuid(), cat_accessoires, 'Coque iPhone 15 Pro Max Cuir', 'coque-iphone-15-pro-max-cuir', 'Coque en cuir veritable tannage vegetal pour iPhone 15 Pro Max. Protection elegante avec finition premium. Compatible MagSafe.', 45000, 55000, 'APL-CASE-15PM-BLK', 80, true, false, 'Apple', '{"materiau": "Cuir veritable", "compatibilite": "iPhone 15 Pro Max", "magsafe": true, "couleurs": ["Noir", "Havane", "Glycine"]}', NOW()),
    (gen_random_uuid(), cat_accessoires, 'Samsung Galaxy Watch 6 Classic 47mm', 'samsung-galaxy-watch-6-classic-47mm', 'Montre connectee premium avec lunette rotative iconique, suivi sante complet (ECG, tension, sommeil), GPS integre et jusqu''a 40h d''autonomie.', 295000, 350000, 'SAM-GW6C-47-BLK', 20, true, false, 'Samsung', '{"taille": "47mm", "ecran": "1.5 pouces Super AMOLED", "lunette": "Rotative physique", "sante": ["ECG", "Tension arterielle", "Sommeil"], "autonomie": "40 heures", "etancheite": "5ATM + IP68", "os": "Wear OS 4"}', NOW());

  -- Audio (3 products)
  INSERT INTO public.products (id, category_id, name, slug, description, price, compare_price, sku, stock_quantity, is_active, is_featured, brand, specifications, created_at) VALUES
    (gen_random_uuid(), cat_audio, 'Sony WH-1000XM5 Noir', 'sony-wh-1000xm5-noir', 'Le casque a reduction de bruit de reference mondiale. Processeur V1 integre, 8 microphones pour une ANC inegalee, 30h d''autonomie. Son Hi-Res Audio.', 295000, 350000, 'SON-WH1000XM5-BLK', 25, true, true, 'Sony', '{"type": "Circum-aural ferme", "anc": "8 microphones + Processeur V1", "autonomie": "30 heures ANC active", "audio": "Hi-Res Audio, LDAC, 360 Reality Audio", "pliable": true, "poids": "250g"}', NOW()),
    (gen_random_uuid(), cat_audio, 'JBL Charge 5 Bleu', 'jbl-charge-5-bleu', 'Enceinte Bluetooth portable avec son JBL Pro puissant, basses profondes et 20h d''autonomie. Etanche IP67 et powerbank integree.', 125000, NULL, 'JBL-CHG5-BLU', 40, true, false, 'JBL', '{"puissance": "40W (30W woofer + 10W tweeter)", "autonomie": "20 heures", "etancheite": "IP67", "powerbank": "Oui, USB-A out", "bluetooth": "5.1", "poids": "960g"}', NOW()),
    (gen_random_uuid(), cat_audio, 'Bose QuietComfort Ultra Earbuds', 'bose-quietcomfort-ultra-earbuds', 'Ecouteurs true wireless avec le meilleur son Bose et la reduction de bruit de classe mondiale. Audio immersif Bose, modes Aware et Quiet.', 225000, 265000, 'BOS-QCUE-BLK', 18, true, false, 'Bose', '{"type": "True Wireless", "anc": "Reduction de bruit Bose", "audio": "Bose Immersive Audio", "autonomie": "6h (24h avec boitier)", "resistance": "IPX4", "modes": ["Quiet", "Aware", "Immersion"]}', NOW());
END $$;

-- ===========================================
-- 5b. Ajouter les images des produits
-- ===========================================

INSERT INTO public.product_images (product_id, url, alt, position, is_primary)
SELECT
    p.id,
    'https://picsum.photos/seed/' || p.slug || '/800/800',
    p.name || ' - Image principale',
    0,
    true
FROM public.products p;

-- Secondary images for featured products
INSERT INTO public.product_images (product_id, url, alt, position, is_primary)
SELECT
    p.id,
    'https://picsum.photos/seed/' || p.slug || '-2/800/800',
    p.name || ' - Vue arriere',
    1,
    false
FROM public.products p WHERE p.is_featured = true;

INSERT INTO public.product_images (product_id, url, alt, position, is_primary)
SELECT
    p.id,
    'https://picsum.photos/seed/' || p.slug || '-3/800/800',
    p.name || ' - Vue detail',
    2,
    false
FROM public.products p WHERE p.is_featured = true;

-- ===========================================
-- 6. Créer une promotion active
-- ===========================================

INSERT INTO public.promotions (id, code, name, description, type, value, min_purchase, max_discount, max_uses, used_count, starts_at, ends_at, is_active, created_at) VALUES
  (gen_random_uuid(), 'BIENVENUE10', 'Bienvenue -10%', '10% de réduction pour les nouveaux clients', 'percentage', 10, 25000, 50000, 100, 5, NOW(), NOW() + INTERVAL '30 days', true, NOW()),
  (gen_random_uuid(), 'NOEL2024', 'Promo Noël', '5000 FCFA de réduction pour Noël', 'fixed_amount', 5000, 30000, NULL, 200, 0, NOW(), NOW() + INTERVAL '60 days', true, NOW());

-- ===========================================
-- 7. Adresses de test
-- ===========================================
-- NOTE: Les adresses seront créées après la connexion
-- des utilisateurs de test via l'interface

-- ===========================================
-- Résumé des utilisateurs de test
-- ===========================================
--
-- | Email                    | Mot de passe | Rôle        | Nom              |
-- |--------------------------|--------------|-------------|------------------|
-- | client@dbs-store.ci      | password123  | customer    | Client Test      |
-- | admin@dbs-store.ci       | password123  | admin       | Admin DBS        |
-- | superadmin@dbs-store.ci  | password123  | super_admin | Super Admin DBS  |
--
-- Ces utilisateurs sont créés automatiquement par le seed.
-- Connectez-vous avec l'email et le mot de passe.
--
-- Pour accéder au dashboard admin: /admin
-- ===========================================
