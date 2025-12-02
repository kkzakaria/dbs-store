-- ===========================================
-- DBS STORE - Seed Data
-- ===========================================
-- Ce fichier crée des données de test pour le développement local
--
-- IMPORTANT: Les utilisateurs de test sont créés automatiquement lors
-- de la première connexion OTP. Ce seed ne crée PAS d'utilisateurs
-- dans auth.users pour éviter les conflits de format de numéro.
--
-- Numéros de test OTP configurés dans config.toml:
-- +2250700000000, +2250700000001, +2250700000002, +2250707070707
-- Code OTP pour tous: 123456
--
-- Lors de la première connexion avec ces numéros, un utilisateur
-- sera créé automatiquement dans auth.users et public.users.
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

-- Nettoyer auth.users pour les numéros de test (éviter les conflits)
DELETE FROM auth.users WHERE phone IN ('+2250700000000', '+2250700000001', '+2250700000002', '+2250707070707', '2250700000000', '2250700000001', '2250700000002', '2250707070707');

-- ===========================================
-- NOTE: Les utilisateurs sont créés automatiquement
-- lors de la première connexion OTP
-- ===========================================

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

  -- Smartphones
  INSERT INTO public.products (id, category_id, name, slug, description, price, compare_price, sku, stock_quantity, is_active, is_featured, brand, specifications, created_at) VALUES
    (gen_random_uuid(), cat_smartphones, 'iPhone 15 Pro Max 256GB', 'iphone-15-pro-max-256gb', 'Le dernier iPhone avec puce A17 Pro, écran Super Retina XDR et système de caméra professionnel.', 850000, 950000, 'IPH15PM256', 15, true, true, 'Apple', '{"Écran": "6.7 pouces", "Stockage": "256 Go", "RAM": "8 Go", "Batterie": "4441 mAh"}', NOW()),
    (gen_random_uuid(), cat_smartphones, 'Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra', 'Le smartphone Galaxy le plus puissant avec S Pen intégré et caméra 200MP.', 780000, NULL, 'SGS24U256', 20, true, true, 'Samsung', '{"Écran": "6.8 pouces", "Stockage": "256 Go", "RAM": "12 Go", "Batterie": "5000 mAh"}', NOW()),
    (gen_random_uuid(), cat_smartphones, 'Google Pixel 8 Pro', 'google-pixel-8-pro', 'L''expérience Google pure avec les meilleures capacités IA.', 550000, 600000, 'GP8P128', 12, true, false, 'Google', '{"Écran": "6.7 pouces", "Stockage": "128 Go", "RAM": "12 Go", "Batterie": "5050 mAh"}', NOW());

  -- Ordinateurs
  INSERT INTO public.products (id, category_id, name, slug, description, price, compare_price, sku, stock_quantity, is_active, is_featured, brand, specifications, created_at) VALUES
    (gen_random_uuid(), cat_ordinateurs, 'MacBook Pro 14" M3 Pro', 'macbook-pro-14-m3-pro', 'Puissance professionnelle avec puce M3 Pro, écran Liquid Retina XDR.', 1450000, NULL, 'MBP14M3P', 8, true, true, 'Apple', '{"Écran": "14.2 pouces", "Processeur": "M3 Pro", "RAM": "18 Go", "SSD": "512 Go"}', NOW()),
    (gen_random_uuid(), cat_ordinateurs, 'Dell XPS 15', 'dell-xps-15', 'Laptop premium avec écran OLED 3.5K et processeur Intel Core i7.', 980000, 1100000, 'DXPS15I7', 10, true, false, 'Dell', '{"Écran": "15.6 pouces OLED", "Processeur": "Intel i7-13700H", "RAM": "16 Go", "SSD": "512 Go"}', NOW());

  -- Accessoires
  INSERT INTO public.products (id, category_id, name, slug, description, price, compare_price, sku, stock_quantity, is_active, is_featured, brand, specifications, created_at) VALUES
    (gen_random_uuid(), cat_accessoires, 'Chargeur MagSafe 15W', 'chargeur-magsafe-15w', 'Chargeur sans fil magnétique pour iPhone.', 35000, NULL, 'MAGSAFE15', 50, true, false, 'Apple', '{"Puissance": "15W", "Compatibilité": "iPhone 12+"}', NOW()),
    (gen_random_uuid(), cat_accessoires, 'Coque iPhone 15 Pro Silicone', 'coque-iphone-15-pro-silicone', 'Coque officielle Apple en silicone avec MagSafe.', 25000, 35000, 'CASEIPH15', 100, true, false, 'Apple', '{"Matériau": "Silicone", "MagSafe": "Oui"}', NOW());

  -- Audio
  INSERT INTO public.products (id, category_id, name, slug, description, price, compare_price, sku, stock_quantity, is_active, is_featured, brand, specifications, created_at) VALUES
    (gen_random_uuid(), cat_audio, 'AirPods Pro 2ème génération', 'airpods-pro-2', 'Écouteurs sans fil avec réduction de bruit active et audio spatial.', 175000, 195000, 'APP2', 30, true, true, 'Apple', '{"ANC": "Oui", "Autonomie": "6h", "Boîtier": "MagSafe"}', NOW()),
    (gen_random_uuid(), cat_audio, 'Sony WH-1000XM5', 'sony-wh-1000xm5', 'Le meilleur casque à réduction de bruit du marché.', 250000, NULL, 'SONYWH5', 15, true, true, 'Sony', '{"ANC": "Oui", "Autonomie": "30h", "Pliable": "Oui"}', NOW());
END $$;

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
-- Résumé des numéros de test OTP
-- ===========================================
--
-- | Téléphone       | OTP    | Description            |
-- |-----------------|--------|------------------------|
-- | 07 00 00 00 00  | 123456 | Client standard        |
-- | 07 00 00 00 01  | 123456 | Client niveau Or       |
-- | 07 00 00 00 02  | 123456 | Admin                  |
-- | 07 07 07 07 07  | 123456 | Super Admin            |
--
-- Lors de la première connexion, un profil sera créé
-- automatiquement avec le rôle 'customer'. Pour donner
-- les droits admin, mettre à jour manuellement:
--
-- UPDATE public.users SET role = 'admin' WHERE phone LIKE '%0700000002';
-- UPDATE public.users SET role = 'super_admin' WHERE phone LIKE '%0707070707';
--
-- ===========================================
