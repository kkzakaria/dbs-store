-- ============================================
-- DBS STORE - Consolidate RLS Policies
-- Fix multiple permissive policies warnings
-- Strategy: Combine admin + user conditions into single policies
-- ============================================

-- =====================
-- USERS TABLE
-- =====================
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;

-- Consolidated SELECT: user sees own OR admin sees all
CREATE POLICY "users_select_policy" ON public.users
  FOR SELECT USING (
    (SELECT auth.uid()) = id
    OR public.is_admin()
  );

-- Consolidated UPDATE: user updates own OR admin updates all
CREATE POLICY "users_update_policy" ON public.users
  FOR UPDATE USING (
    (SELECT auth.uid()) = id
    OR public.is_admin()
  );

-- Admin only DELETE
CREATE POLICY "users_delete_policy" ON public.users
  FOR DELETE USING (public.is_admin());

-- Admin only INSERT
CREATE POLICY "users_insert_policy" ON public.users
  FOR INSERT WITH CHECK (public.is_admin());

-- =====================
-- ADDRESSES TABLE
-- =====================
DROP POLICY IF EXISTS "Users can view own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Admins can view all addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON public.addresses;

-- Consolidated SELECT: user sees own OR admin sees all
CREATE POLICY "addresses_select_policy" ON public.addresses
  FOR SELECT USING (
    (SELECT auth.uid()) = user_id
    OR public.is_admin()
  );

-- User inserts own
CREATE POLICY "addresses_insert_policy" ON public.addresses
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- User updates own
CREATE POLICY "addresses_update_policy" ON public.addresses
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- User deletes own
CREATE POLICY "addresses_delete_policy" ON public.addresses
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- =====================
-- ORDERS TABLE
-- =====================
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

-- Consolidated SELECT: user sees own OR admin sees all
CREATE POLICY "orders_select_policy" ON public.orders
  FOR SELECT USING (
    (SELECT auth.uid()) = user_id
    OR public.is_admin()
  );

-- User creates own orders
CREATE POLICY "orders_insert_policy" ON public.orders
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- Admin only UPDATE
CREATE POLICY "orders_update_policy" ON public.orders
  FOR UPDATE USING (public.is_admin());

-- Admin only DELETE
CREATE POLICY "orders_delete_policy" ON public.orders
  FOR DELETE USING (public.is_admin());

-- =====================
-- ORDER_ITEMS TABLE
-- =====================
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can delete order items" ON public.order_items;

-- Consolidated SELECT: user sees own order items OR admin sees all
CREATE POLICY "order_items_select_policy" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_items.order_id
      AND user_id = (SELECT auth.uid())
    )
    OR public.is_admin()
  );

-- User inserts items for own orders
CREATE POLICY "order_items_insert_policy" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_items.order_id
      AND user_id = (SELECT auth.uid())
    )
  );

-- Admin only UPDATE
CREATE POLICY "order_items_update_policy" ON public.order_items
  FOR UPDATE USING (public.is_admin());

-- Admin only DELETE
CREATE POLICY "order_items_delete_policy" ON public.order_items
  FOR DELETE USING (public.is_admin());

-- =====================
-- REVIEWS TABLE
-- =====================
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can view own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can update all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;

-- Consolidated SELECT: approved reviews OR own reviews OR admin
CREATE POLICY "reviews_select_policy" ON public.reviews
  FOR SELECT USING (
    is_approved = true
    OR (SELECT auth.uid()) = user_id
    OR public.is_admin()
  );

-- User creates own reviews
CREATE POLICY "reviews_insert_policy" ON public.reviews
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- Consolidated UPDATE: user updates own OR admin updates all
CREATE POLICY "reviews_update_policy" ON public.reviews
  FOR UPDATE USING (
    (SELECT auth.uid()) = user_id
    OR public.is_admin()
  );

-- Admin only DELETE
CREATE POLICY "reviews_delete_policy" ON public.reviews
  FOR DELETE USING (public.is_admin());

-- =====================
-- LOYALTY_HISTORY TABLE
-- =====================
DROP POLICY IF EXISTS "Users can view own loyalty" ON public.loyalty_history;
DROP POLICY IF EXISTS "Admins can view all loyalty" ON public.loyalty_history;
DROP POLICY IF EXISTS "Admins can insert loyalty" ON public.loyalty_history;
DROP POLICY IF EXISTS "Admins can update loyalty" ON public.loyalty_history;
DROP POLICY IF EXISTS "Admins can delete loyalty" ON public.loyalty_history;

-- Consolidated SELECT: user sees own OR admin sees all
CREATE POLICY "loyalty_history_select_policy" ON public.loyalty_history
  FOR SELECT USING (
    (SELECT auth.uid()) = user_id
    OR public.is_admin()
  );

-- Admin only INSERT
CREATE POLICY "loyalty_history_insert_policy" ON public.loyalty_history
  FOR INSERT WITH CHECK (public.is_admin());

-- Admin only UPDATE
CREATE POLICY "loyalty_history_update_policy" ON public.loyalty_history
  FOR UPDATE USING (public.is_admin());

-- Admin only DELETE
CREATE POLICY "loyalty_history_delete_policy" ON public.loyalty_history
  FOR DELETE USING (public.is_admin());

-- =====================
-- PRODUCTS TABLE
-- =====================
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

-- Consolidated SELECT: active products OR admin sees all
CREATE POLICY "products_select_policy" ON public.products
  FOR SELECT USING (
    is_active = true
    OR public.is_admin()
  );

-- Admin only INSERT
CREATE POLICY "products_insert_policy" ON public.products
  FOR INSERT WITH CHECK (public.is_admin());

-- Admin only UPDATE
CREATE POLICY "products_update_policy" ON public.products
  FOR UPDATE USING (public.is_admin());

-- Admin only DELETE
CREATE POLICY "products_delete_policy" ON public.products
  FOR DELETE USING (public.is_admin());

-- =====================
-- CATEGORIES TABLE
-- =====================
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can view all categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

-- Consolidated SELECT: active categories OR admin sees all
CREATE POLICY "categories_select_policy" ON public.categories
  FOR SELECT USING (
    is_active = true
    OR public.is_admin()
  );

-- Admin only INSERT
CREATE POLICY "categories_insert_policy" ON public.categories
  FOR INSERT WITH CHECK (public.is_admin());

-- Admin only UPDATE
CREATE POLICY "categories_update_policy" ON public.categories
  FOR UPDATE USING (public.is_admin());

-- Admin only DELETE
CREATE POLICY "categories_delete_policy" ON public.categories
  FOR DELETE USING (public.is_admin());

-- =====================
-- PROMOTIONS TABLE
-- =====================
DROP POLICY IF EXISTS "Anyone can view active promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins can view all promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins can insert promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins can update promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins can delete promotions" ON public.promotions;

-- Consolidated SELECT: active and valid promotions OR admin sees all
CREATE POLICY "promotions_select_policy" ON public.promotions
  FOR SELECT USING (
    (is_active = true AND NOW() BETWEEN starts_at AND ends_at)
    OR public.is_admin()
  );

-- Admin only INSERT
CREATE POLICY "promotions_insert_policy" ON public.promotions
  FOR INSERT WITH CHECK (public.is_admin());

-- Admin only UPDATE
CREATE POLICY "promotions_update_policy" ON public.promotions
  FOR UPDATE USING (public.is_admin());

-- Admin only DELETE
CREATE POLICY "promotions_delete_policy" ON public.promotions
  FOR DELETE USING (public.is_admin());

-- =====================
-- SHIPPING_ZONES TABLE
-- =====================
DROP POLICY IF EXISTS "Anyone can view active shipping zones" ON public.shipping_zones;
DROP POLICY IF EXISTS "Admins can view all shipping zones" ON public.shipping_zones;
DROP POLICY IF EXISTS "Admins can insert shipping zones" ON public.shipping_zones;
DROP POLICY IF EXISTS "Admins can update shipping zones" ON public.shipping_zones;
DROP POLICY IF EXISTS "Admins can delete shipping zones" ON public.shipping_zones;

-- Consolidated SELECT: active zones OR admin sees all
CREATE POLICY "shipping_zones_select_policy" ON public.shipping_zones
  FOR SELECT USING (
    is_active = true
    OR public.is_admin()
  );

-- Admin only INSERT
CREATE POLICY "shipping_zones_insert_policy" ON public.shipping_zones
  FOR INSERT WITH CHECK (public.is_admin());

-- Admin only UPDATE
CREATE POLICY "shipping_zones_update_policy" ON public.shipping_zones
  FOR UPDATE USING (public.is_admin());

-- Admin only DELETE
CREATE POLICY "shipping_zones_delete_policy" ON public.shipping_zones
  FOR DELETE USING (public.is_admin());

-- =====================
-- SHIPPING_PARTNERS TABLE
-- =====================
DROP POLICY IF EXISTS "Anyone can view active shipping partners" ON public.shipping_partners;
DROP POLICY IF EXISTS "Admins can view all shipping partners" ON public.shipping_partners;
DROP POLICY IF EXISTS "Admins can insert shipping partners" ON public.shipping_partners;
DROP POLICY IF EXISTS "Admins can update shipping partners" ON public.shipping_partners;
DROP POLICY IF EXISTS "Admins can delete shipping partners" ON public.shipping_partners;

-- Consolidated SELECT: active partners OR admin sees all
CREATE POLICY "shipping_partners_select_policy" ON public.shipping_partners
  FOR SELECT USING (
    is_active = true
    OR public.is_admin()
  );

-- Admin only INSERT
CREATE POLICY "shipping_partners_insert_policy" ON public.shipping_partners
  FOR INSERT WITH CHECK (public.is_admin());

-- Admin only UPDATE
CREATE POLICY "shipping_partners_update_policy" ON public.shipping_partners
  FOR UPDATE USING (public.is_admin());

-- Admin only DELETE
CREATE POLICY "shipping_partners_delete_policy" ON public.shipping_partners
  FOR DELETE USING (public.is_admin());

-- =====================
-- PROMO_USAGE TABLE
-- =====================
DROP POLICY IF EXISTS "Admins can view promo usage" ON public.promo_usage;
DROP POLICY IF EXISTS "Users can view own promo usage" ON public.promo_usage;
DROP POLICY IF EXISTS "System can insert promo usage" ON public.promo_usage;

-- Consolidated SELECT: user sees own OR admin sees all
CREATE POLICY "promo_usage_select_policy" ON public.promo_usage
  FOR SELECT USING (
    (SELECT auth.uid()) = user_id
    OR public.is_admin()
  );

-- System can insert (for order processing)
CREATE POLICY "promo_usage_insert_policy" ON public.promo_usage
  FOR INSERT WITH CHECK (true);

-- =====================
-- PRODUCT_IMAGES TABLE (no changes needed - already optimized)
-- =====================
-- Anyone can view is a single policy, admin policies are separate by action

-- =====================
-- WISHLIST TABLE (no changes needed - user only)
-- =====================
-- User-only policies, no admin overlap
