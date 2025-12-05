-- ============================================
-- Product Variants Support
-- ============================================

-- =====================
-- NEW TABLES
-- =====================

-- Product Options (defines option types per product)
CREATE TABLE public.product_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  values JSONB NOT NULL DEFAULT '[]',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Variants (individual variant instances)
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE NOT NULL,
  price DECIMAL(12, 0) NOT NULL,
  compare_price DECIMAL(12, 0),
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  options JSONB NOT NULL DEFAULT '{}',
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- MODIFY EXISTING TABLES
-- =====================

-- Add has_variants flag to products
ALTER TABLE public.products ADD COLUMN has_variants BOOLEAN DEFAULT false;

-- Add variant_id to product_images (NULL = product-level image)
ALTER TABLE public.product_images
ADD COLUMN variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;

-- Modify cart_items to support variants
ALTER TABLE public.cart_items
DROP CONSTRAINT cart_items_user_id_product_id_key;

ALTER TABLE public.cart_items
ADD COLUMN variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX cart_items_unique_idx
ON public.cart_items(user_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'));

-- Add variant_id to order_items
ALTER TABLE public.order_items
ADD COLUMN variant_id UUID REFERENCES public.product_variants(id);

-- Modify wishlist to support variants
ALTER TABLE public.wishlist
DROP CONSTRAINT wishlist_user_id_product_id_key;

ALTER TABLE public.wishlist
ADD COLUMN variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX wishlist_unique_idx
ON public.wishlist(user_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'));

-- =====================
-- INDEXES
-- =====================

CREATE INDEX idx_product_options_product_id ON public.product_options(product_id);
CREATE INDEX idx_product_options_position ON public.product_options(product_id, position);

CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON public.product_variants(sku);
CREATE INDEX idx_product_variants_position ON public.product_variants(product_id, position);
CREATE INDEX idx_product_variants_active ON public.product_variants(product_id, is_active);

CREATE INDEX idx_product_images_variant_id ON public.product_images(variant_id);
CREATE INDEX idx_cart_items_variant_id ON public.cart_items(variant_id);
CREATE INDEX idx_order_items_variant_id ON public.order_items(variant_id);
CREATE INDEX idx_wishlist_variant_id ON public.wishlist(variant_id);

-- =====================
-- TRIGGERS
-- =====================

-- Update updated_at for product_variants
CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================
-- ROW LEVEL SECURITY
-- =====================

ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Product Options: Public read, admin write
CREATE POLICY "product_options_select" ON public.product_options
  FOR SELECT TO public USING (true);

CREATE POLICY "product_options_admin_insert" ON public.product_options
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "product_options_admin_update" ON public.product_options
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "product_options_admin_delete" ON public.product_options
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Product Variants: Public read (active only), admin full access
CREATE POLICY "product_variants_select" ON public.product_variants
  FOR SELECT TO public USING (true);

CREATE POLICY "product_variants_admin_insert" ON public.product_variants
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "product_variants_admin_update" ON public.product_variants
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "product_variants_admin_delete" ON public.product_variants
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- =====================
-- COMMENTS
-- =====================

COMMENT ON TABLE public.product_options IS 'Defines option types (color, size, storage) available for a product';
COMMENT ON TABLE public.product_variants IS 'Individual product variants with their own SKU, price, and stock';
COMMENT ON COLUMN public.product_options.values IS 'JSON array of option values, e.g., ["Noir", "Blanc", "Bleu"]';
COMMENT ON COLUMN public.product_variants.options IS 'JSON object of selected options, e.g., {"Couleur": "Noir", "Stockage": "256GB"}';
COMMENT ON COLUMN public.products.has_variants IS 'Flag indicating if product uses variant system';
