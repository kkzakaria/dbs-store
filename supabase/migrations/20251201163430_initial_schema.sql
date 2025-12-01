-- ============================================
-- DBS STORE - Database Schema
-- Supabase PostgreSQL Migration
-- Version: 1.0.0
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- ENUM TYPES
-- =====================

CREATE TYPE user_role AS ENUM ('customer', 'admin', 'super_admin');
CREATE TYPE stock_type AS ENUM ('physical', 'dropshipping');
CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
);
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('wave', 'cinetpay', 'cash_on_delivery');
CREATE TYPE promo_type AS ENUM ('percentage', 'fixed_amount', 'free_shipping');
CREATE TYPE loyalty_type AS ENUM ('earned', 'redeemed', 'expired', 'bonus');

-- =====================
-- TABLES
-- =====================

-- Users (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(20) UNIQUE,
  email VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,
  role user_role DEFAULT 'customer',
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(12, 0) NOT NULL,
  compare_price DECIMAL(12, 0),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  brand VARCHAR(255),
  sku VARCHAR(100) UNIQUE,
  stock_quantity INTEGER DEFAULT 0,
  stock_type stock_type DEFAULT 'physical',
  low_stock_threshold INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  specifications JSONB DEFAULT '{}',
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Images
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt VARCHAR(255),
  position INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Addresses
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  commune VARCHAR(100),
  landmark TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipping Zones
CREATE TABLE public.shipping_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  cities TEXT[] NOT NULL,
  fee DECIMAL(10, 0) NOT NULL,
  estimated_days VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipping Partners
CREATE TABLE public.shipping_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  contact_phone VARCHAR(20),
  tracking_url_template TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promotions
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type promo_type NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  min_purchase DECIMAL(12, 0) DEFAULT 0,
  max_discount DECIMAL(12, 0),
  max_uses INTEGER,
  max_uses_per_user INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id),
  address_id UUID REFERENCES public.addresses(id),
  shipping_address JSONB NOT NULL,
  status order_status DEFAULT 'pending',
  subtotal DECIMAL(12, 0) NOT NULL,
  discount DECIMAL(12, 0) DEFAULT 0,
  shipping_fee DECIMAL(10, 0) DEFAULT 0,
  total DECIMAL(12, 0) NOT NULL,
  promo_code VARCHAR(50),
  promo_id UUID REFERENCES public.promotions(id),
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  payment_ref VARCHAR(255),
  shipping_partner_id UUID REFERENCES public.shipping_partners(id),
  tracking_number VARCHAR(100),
  notes TEXT,
  loyalty_points_earned INTEGER DEFAULT 0,
  loyalty_points_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_snapshot JSONB NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12, 0) NOT NULL,
  total_price DECIMAL(12, 0) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  is_approved BOOLEAN DEFAULT false,
  is_verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- Loyalty History
CREATE TABLE public.loyalty_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id),
  points INTEGER NOT NULL,
  type loyalty_type NOT NULL,
  description TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wishlist
CREATE TABLE public.wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Promo Usage
CREATE TABLE public.promo_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_id UUID NOT NULL REFERENCES public.promotions(id),
  user_id UUID NOT NULL REFERENCES public.users(id),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(promo_id, user_id, order_id)
);

-- =====================
-- INDEXES
-- =====================

CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_active ON public.products(is_active);
CREATE INDEX idx_products_featured ON public.products(is_featured);
CREATE INDEX idx_products_search ON public.products USING gin(
  to_tsvector('french', name || ' ' || COALESCE(description, ''))
);

CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);

CREATE INDEX idx_reviews_product ON public.reviews(product_id);
CREATE INDEX idx_reviews_approved ON public.reviews(is_approved);

CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_parent ON public.categories(parent_id);

CREATE INDEX idx_addresses_user ON public.addresses(user_id);
CREATE INDEX idx_wishlist_user ON public.wishlist(user_id);
CREATE INDEX idx_loyalty_user ON public.loyalty_history(user_id);

-- =====================
-- FUNCTIONS
-- =====================

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  today_count INTEGER;
  today_str TEXT;
BEGIN
  today_str := TO_CHAR(NOW(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO today_count
  FROM public.orders
  WHERE DATE(created_at) = CURRENT_DATE;
  RETURN 'DBS-' || today_str || '-' || LPAD(today_count::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger for order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := generate_order_number();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_products_updated
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_orders_updated
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_categories_updated
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_addresses_updated
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_promotions_updated
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Calculate loyalty points (1 point per 1000 FCFA)
CREATE OR REPLACE FUNCTION calculate_loyalty_points(order_total DECIMAL)
RETURNS INTEGER AS $$
BEGIN
  RETURN FLOOR(order_total / 1000);
END;
$$ LANGUAGE plpgsql;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- ROW LEVEL SECURITY
-- =====================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_usage ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage users" ON public.users
  FOR ALL USING (is_admin());

-- Addresses policies
CREATE POLICY "Users can manage own addresses" ON public.addresses
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all addresses" ON public.addresses
  FOR SELECT USING (is_admin());

-- Orders policies
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all orders" ON public.orders
  FOR ALL USING (is_admin());

-- Order items policies
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
  );
CREATE POLICY "Admins can manage order items" ON public.order_items
  FOR ALL USING (is_admin());

-- Reviews policies
CREATE POLICY "Anyone can view approved reviews" ON public.reviews
  FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can view own reviews" ON public.reviews
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage reviews" ON public.reviews
  FOR ALL USING (is_admin());

-- Wishlist policies
CREATE POLICY "Users can manage own wishlist" ON public.wishlist
  FOR ALL USING (auth.uid() = user_id);

-- Loyalty policies
CREATE POLICY "Users can view own loyalty" ON public.loyalty_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage loyalty" ON public.loyalty_history
  FOR ALL USING (is_admin());

-- Products policies (public read)
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (is_admin());

-- Product images policies
CREATE POLICY "Anyone can view product images" ON public.product_images
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage product images" ON public.product_images
  FOR ALL USING (is_admin());

-- Categories policies (public read)
CREATE POLICY "Anyone can view active categories" ON public.categories
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (is_admin());

-- Promotions policies
CREATE POLICY "Anyone can view active promotions" ON public.promotions
  FOR SELECT USING (is_active = true AND NOW() BETWEEN starts_at AND ends_at);
CREATE POLICY "Admins can manage promotions" ON public.promotions
  FOR ALL USING (is_admin());

-- Shipping zones policies
CREATE POLICY "Anyone can view shipping zones" ON public.shipping_zones
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage shipping zones" ON public.shipping_zones
  FOR ALL USING (is_admin());

-- Shipping partners policies
CREATE POLICY "Anyone can view shipping partners" ON public.shipping_partners
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage shipping partners" ON public.shipping_partners
  FOR ALL USING (is_admin());

-- Promo usage policies
CREATE POLICY "Admins can view promo usage" ON public.promo_usage
  FOR SELECT USING (is_admin());
CREATE POLICY "System can insert promo usage" ON public.promo_usage
  FOR INSERT WITH CHECK (true);

-- =====================
-- INITIAL DATA
-- =====================

-- Insert default shipping zones for Cote d'Ivoire
INSERT INTO public.shipping_zones (name, cities, fee, estimated_days, is_active) VALUES
('Abidjan - Centre', ARRAY['Plateau', 'Cocody', 'Marcory', 'Treichville', 'Koumassi'], 1500, '1-2 jours', true),
('Abidjan - Peripherie', ARRAY['Yopougon', 'Abobo', 'Anyama', 'Bingerville', 'Port-Bouet'], 2500, '2-3 jours', true),
('Hors Abidjan', ARRAY['Bouake', 'San-Pedro', 'Yamoussoukro', 'Daloa', 'Korhogo'], 5000, '3-5 jours', true);

-- Insert default categories
INSERT INTO public.categories (name, slug, description, position, is_active) VALUES
('Smartphones', 'smartphones', 'Telephones portables et accessoires', 1, true),
('Ordinateurs', 'ordinateurs', 'PC portables, desktops et accessoires', 2, true),
('Accessoires', 'accessoires', 'Tous les accessoires electroniques', 3, true),
('Audio', 'audio', 'Ecouteurs, casques et enceintes', 4, true),
('Tablettes', 'tablettes', 'Tablettes tactiles', 5, true);

-- Insert sample promotion
INSERT INTO public.promotions (code, name, description, type, value, min_purchase, starts_at, ends_at, is_active) VALUES
('BIENVENUE10', 'Bienvenue -10%', '10% de reduction pour votre premiere commande', 'percentage', 10, 25000, NOW(), NOW() + INTERVAL '1 year', true);
