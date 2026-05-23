-- 0004_add_production_indexes.sql
-- Production query-performance indexes. Column names match lib/db/schema.ts.

CREATE INDEX IF NOT EXISTS idx_products_category_is_active    ON products(category_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_is_active ON products(subcategory_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at            ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_brand                 ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_old_price             ON products(old_price) WHERE old_price > 0;
CREATE INDEX IF NOT EXISTS idx_orders_user_id                 ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status                  ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id           ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_hero_slides_active_sort        ON hero_slides(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id           ON categories(parent_id);
