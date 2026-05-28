-- migrations/0006_product_variants.sql
CREATE TABLE product_variants (
  id             TEXT    NOT NULL PRIMARY KEY,
  product_id     TEXT    NOT NULL REFERENCES products(id),
  color_name     TEXT    NOT NULL,
  color_hex      TEXT    NOT NULL,
  stock          INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  price_override INTEGER,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     INTEGER NOT NULL
);

CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);

ALTER TABLE order_items ADD COLUMN variant_id  TEXT;
ALTER TABLE order_items ADD COLUMN color_name  TEXT;
ALTER TABLE order_items ADD COLUMN color_hex   TEXT;

-- Migrer les couleurs JSON existantes vers product_variants
-- json_each() déroule le tableau JSON en lignes
INSERT INTO product_variants (id, product_id, color_name, color_hex, stock, sort_order, created_at)
SELECT
  lower(hex(randomblob(16)))                                              AS id,
  p.id                                                                    AS product_id,
  json_extract(c.value, '$.name')                                         AS color_name,
  json_extract(c.value, '$.hex')                                          AS color_hex,
  CASE
    WHEN json_array_length(p.colors) > 0
    THEN CAST(ROUND(CAST(p.stock AS REAL) / json_array_length(p.colors)) AS INTEGER)
    ELSE 0
  END                                                                     AS stock,
  c.key                                                                   AS sort_order,
  CAST(strftime('%s', 'now') AS INTEGER)                                  AS created_at
FROM products p, json_each(p.colors) AS c
WHERE json_array_length(p.colors) > 0;
