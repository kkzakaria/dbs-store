-- Create stores table for physical store locations
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  commune VARCHAR(100),
  phone VARCHAR(20) NOT NULL,
  hours VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for active stores lookup
CREATE INDEX idx_stores_active ON stores(is_active) WHERE is_active = true;

-- Create index for city-based lookup
CREATE INDEX idx_stores_city ON stores(city);

-- Add trigger for updated_at
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active stores
CREATE POLICY "Anyone can view active stores"
  ON stores
  FOR SELECT
  USING (is_active = true);

-- Policy: Only admins can manage stores
CREATE POLICY "Admins can manage stores"
  ON stores
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Insert default stores
INSERT INTO stores (name, address, city, commune, phone, hours, latitude, longitude) VALUES
  ('DBS Store - Plateau', 'Rue du Commerce, Immeuble Alpha 2000', 'Abidjan', 'Plateau', '+225 07 00 00 00 00', 'Lun-Sam: 9h-19h', 5.3167, -4.0167),
  ('DBS Store - Cocody', 'Boulevard des Martyrs, Centre Commercial Cap Sud', 'Abidjan', 'Cocody', '+225 07 00 00 00 01', 'Lun-Sam: 9h-20h', 5.3489, -3.9908),
  ('DBS Store - Yopougon', 'Rue Princesse, Face Station Total', 'Abidjan', 'Yopougon', '+225 07 00 00 00 02', 'Lun-Sam: 8h-19h', 5.3167, -4.0833);

COMMENT ON TABLE stores IS 'Physical store locations for in-store pickup';
