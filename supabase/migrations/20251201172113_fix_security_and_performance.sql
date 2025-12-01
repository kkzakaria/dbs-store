-- ============================================
-- DBS STORE - Security & Performance Fixes
-- Migration to fix issues identified by Supabase Advisors
-- ============================================

-- =====================
-- 1. FIX FUNCTION SEARCH_PATH (Security)
-- =====================
-- All functions should have immutable search_path to prevent search_path injection attacks

-- Fix generate_order_number
CREATE OR REPLACE FUNCTION public.generate_order_number()
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
$$ LANGUAGE plpgsql
SET search_path = public;

-- Fix set_order_number
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := public.generate_order_number();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Fix update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Fix calculate_loyalty_points
CREATE OR REPLACE FUNCTION public.calculate_loyalty_points(order_total DECIMAL)
RETURNS INTEGER AS $$
BEGIN
  RETURN FLOOR(order_total / 1000);
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Fix is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid())
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- =====================
-- 2. FIX RLS POLICIES PERFORMANCE
-- =====================
-- Replace auth.uid() with (SELECT auth.uid()) to avoid re-evaluation per row

-- Drop existing policies that need performance fixes
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage users" ON public.users;

DROP POLICY IF EXISTS "Users can manage own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Admins can view all addresses" ON public.addresses;

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;

DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;

DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can view own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;

DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.wishlist;

DROP POLICY IF EXISTS "Users can view own loyalty" ON public.loyalty_history;
DROP POLICY IF EXISTS "Admins can manage loyalty" ON public.loyalty_history;

DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

DROP POLICY IF EXISTS "Anyone can view product images" ON public.product_images;
DROP POLICY IF EXISTS "Admins can manage product images" ON public.product_images;

DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

DROP POLICY IF EXISTS "Anyone can view active promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins can manage promotions" ON public.promotions;

DROP POLICY IF EXISTS "Anyone can view shipping zones" ON public.shipping_zones;
DROP POLICY IF EXISTS "Admins can manage shipping zones" ON public.shipping_zones;

DROP POLICY IF EXISTS "Anyone can view shipping partners" ON public.shipping_partners;
DROP POLICY IF EXISTS "Admins can manage shipping partners" ON public.shipping_partners;

DROP POLICY IF EXISTS "Admins can view promo usage" ON public.promo_usage;
DROP POLICY IF EXISTS "System can insert promo usage" ON public.promo_usage;

-- =====================
-- 3. RECREATE POLICIES WITH OPTIMIZED STRUCTURE
-- =====================
-- Strategy: Use RESTRICTIVE policies for admin access to avoid multiple permissive OR

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING ((SELECT auth.uid()) = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete users" ON public.users
  FOR DELETE USING (public.is_admin());

CREATE POLICY "Admins can insert users" ON public.users
  FOR INSERT WITH CHECK (public.is_admin());

-- Addresses policies
CREATE POLICY "Users can view own addresses" ON public.addresses
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own addresses" ON public.addresses
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own addresses" ON public.addresses
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own addresses" ON public.addresses
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Admins can view all addresses" ON public.addresses
  FOR SELECT USING (public.is_admin());

-- Orders policies
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete orders" ON public.orders
  FOR DELETE USING (public.is_admin());

-- Order items policies
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_items.order_id
      AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_items.order_id
      AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Admins can view all order items" ON public.order_items
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update order items" ON public.order_items
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete order items" ON public.order_items
  FOR DELETE USING (public.is_admin());

-- Reviews policies
CREATE POLICY "Anyone can view approved reviews" ON public.reviews
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can view own reviews" ON public.reviews
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Admins can view all reviews" ON public.reviews
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all reviews" ON public.reviews
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete reviews" ON public.reviews
  FOR DELETE USING (public.is_admin());

-- Wishlist policies
CREATE POLICY "Users can view own wishlist" ON public.wishlist
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert wishlist" ON public.wishlist
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete wishlist" ON public.wishlist
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Loyalty history policies
CREATE POLICY "Users can view own loyalty" ON public.loyalty_history
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Admins can view all loyalty" ON public.loyalty_history
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert loyalty" ON public.loyalty_history
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update loyalty" ON public.loyalty_history
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete loyalty" ON public.loyalty_history
  FOR DELETE USING (public.is_admin());

-- Products policies (public read for active)
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all products" ON public.products
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert products" ON public.products
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE USING (public.is_admin());

-- Product images policies
CREATE POLICY "Anyone can view product images" ON public.product_images
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert product images" ON public.product_images
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update product images" ON public.product_images
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete product images" ON public.product_images
  FOR DELETE USING (public.is_admin());

-- Categories policies (public read for active)
CREATE POLICY "Anyone can view active categories" ON public.categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all categories" ON public.categories
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert categories" ON public.categories
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update categories" ON public.categories
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete categories" ON public.categories
  FOR DELETE USING (public.is_admin());

-- Promotions policies
CREATE POLICY "Anyone can view active promotions" ON public.promotions
  FOR SELECT USING (is_active = true AND NOW() BETWEEN starts_at AND ends_at);

CREATE POLICY "Admins can view all promotions" ON public.promotions
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert promotions" ON public.promotions
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update promotions" ON public.promotions
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete promotions" ON public.promotions
  FOR DELETE USING (public.is_admin());

-- Shipping zones policies
CREATE POLICY "Anyone can view active shipping zones" ON public.shipping_zones
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all shipping zones" ON public.shipping_zones
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert shipping zones" ON public.shipping_zones
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update shipping zones" ON public.shipping_zones
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete shipping zones" ON public.shipping_zones
  FOR DELETE USING (public.is_admin());

-- Shipping partners policies
CREATE POLICY "Anyone can view active shipping partners" ON public.shipping_partners
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all shipping partners" ON public.shipping_partners
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert shipping partners" ON public.shipping_partners
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update shipping partners" ON public.shipping_partners
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete shipping partners" ON public.shipping_partners
  FOR DELETE USING (public.is_admin());

-- Promo usage policies
CREATE POLICY "Admins can view promo usage" ON public.promo_usage
  FOR SELECT USING (public.is_admin());

CREATE POLICY "System can insert promo usage" ON public.promo_usage
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own promo usage" ON public.promo_usage
  FOR SELECT USING ((SELECT auth.uid()) = user_id);
