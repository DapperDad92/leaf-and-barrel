-- Leaf & Barrel Complete Database Schema for Supabase
-- This includes tables, constraints, indexes, RLS policies, and triggers

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- CIGARS TABLE
CREATE TABLE IF NOT EXISTS cigars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  line TEXT,
  vitola TEXT,
  size_ring_gauge INT CHECK (size_ring_gauge > 0 AND size_ring_gauge <= 100),
  size_length_in NUMERIC(4,2) CHECK (size_length_in > 0 AND size_length_in <= 20),
  wrapper TEXT,
  strength TEXT CHECK (strength IN ('mild', 'medium', 'full')),
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger for cigars updated_at
CREATE TRIGGER update_cigars_updated_at BEFORE UPDATE ON cigars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- BOTTLES TABLE
CREATE TABLE IF NOT EXISTS bottles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  expression TEXT,
  type TEXT CHECK (type IN ('bourbon', 'rye', 'scotch', 'irish', 'rum', 'tequila', 'mezcal', 'other')),
  proof INT CHECK (proof > 0 AND proof <= 200),
  abv NUMERIC(5,2) CHECK (abv >= 0 AND abv <= 100),
  age_years INT CHECK (age_years >= 0),
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger for bottles updated_at
CREATE TRIGGER update_bottles_updated_at BEFORE UPDATE ON bottles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- INVENTORY ITEMS TABLE
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('cigar', 'bottle')),
  ref_id UUID NOT NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  location TEXT,
  barcode TEXT,
  alt_barcodes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger for inventory_items updated_at
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SCAN SESSIONS TABLE
CREATE TABLE IF NOT EXISTS scan_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  items_added INT DEFAULT 0 CHECK (items_added >= 0),
  items_failed INT DEFAULT 0 CHECK (items_failed >= 0),
  CONSTRAINT valid_session_times CHECK (ended_at IS NULL OR ended_at >= started_at)
);

-- SCAN EVENTS TABLE
CREATE TABLE IF NOT EXISTS scan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES scan_sessions(id) ON DELETE CASCADE,
  kind TEXT CHECK (kind IN ('cigar', 'bottle')),
  barcode TEXT,
  matched_ref_id UUID,
  quantity INT DEFAULT 1 CHECK (quantity > 0),
  status TEXT CHECK (status IN ('matched', 'manual', 'failed')),
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REMOVAL EVENTS TABLE
CREATE TABLE IF NOT EXISTS removal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  quantity_removed INT NOT NULL CHECK (quantity_removed > 0),
  reason TEXT CHECK (reason IN ('smoked', 'empty', 'adjustment')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to validate inventory_items ref_id
CREATE OR REPLACE FUNCTION validate_inventory_ref_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.kind = 'cigar' THEN
    IF NOT EXISTS (SELECT 1 FROM cigars WHERE id = NEW.ref_id) THEN
      RAISE EXCEPTION 'ref_id must reference an existing cigar';
    END IF;
  ELSIF NEW.kind = 'bottle' THEN
    IF NOT EXISTS (SELECT 1 FROM bottles WHERE id = NEW.ref_id) THEN
      RAISE EXCEPTION 'ref_id must reference an existing bottle';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory_items ref_id validation
CREATE TRIGGER validate_inventory_ref_id_trigger
  BEFORE INSERT OR UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_inventory_ref_id();

-- INDEXES FOR PERFORMANCE

-- Cigars indexes
CREATE INDEX idx_cigars_brand ON cigars(brand);
CREATE INDEX idx_cigars_strength ON cigars(strength) WHERE strength IS NOT NULL;
CREATE INDEX idx_cigars_created_at ON cigars(created_at);

-- Bottles indexes
CREATE INDEX idx_bottles_brand ON bottles(brand);
CREATE INDEX idx_bottles_type ON bottles(type) WHERE type IS NOT NULL;
CREATE INDEX idx_bottles_created_at ON bottles(created_at);

-- Inventory items indexes
CREATE INDEX idx_inventory_items_kind ON inventory_items(kind);
CREATE INDEX idx_inventory_items_ref_id ON inventory_items(ref_id);
CREATE INDEX idx_inventory_items_barcode ON inventory_items(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_inventory_items_kind_ref_id ON inventory_items(kind, ref_id);
CREATE INDEX idx_inventory_items_alt_barcodes ON inventory_items USING GIN(alt_barcodes);

-- Scan events indexes
CREATE INDEX idx_scan_events_session_id ON scan_events(session_id);
CREATE INDEX idx_scan_events_barcode ON scan_events(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_scan_events_status ON scan_events(status);
CREATE INDEX idx_scan_events_created_at ON scan_events(created_at);

-- Removal events indexes
CREATE INDEX idx_removal_events_inventory_item_id ON removal_events(inventory_item_id);
CREATE INDEX idx_removal_events_reason ON removal_events(reason);
CREATE INDEX idx_removal_events_created_at ON removal_events(created_at);

-- ROW LEVEL SECURITY (RLS)

-- Enable RLS on all tables
ALTER TABLE cigars ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE removal_events ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
-- For now, these are permissive policies. Adjust based on your auth strategy.

-- Cigars policies
CREATE POLICY "Enable read access for all users" ON cigars
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON cigars
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON cigars
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON cigars
  FOR DELETE USING (auth.role() = 'authenticated');

-- Bottles policies
CREATE POLICY "Enable read access for all users" ON bottles
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON bottles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON bottles
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON bottles
  FOR DELETE USING (auth.role() = 'authenticated');

-- Inventory items policies
CREATE POLICY "Enable read access for all users" ON inventory_items
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON inventory_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON inventory_items
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON inventory_items
  FOR DELETE USING (auth.role() = 'authenticated');

-- Scan sessions policies
CREATE POLICY "Enable read access for all users" ON scan_sessions
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON scan_sessions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON scan_sessions
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON scan_sessions
  FOR DELETE USING (auth.role() = 'authenticated');

-- Scan events policies
CREATE POLICY "Enable read access for all users" ON scan_events
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON scan_events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON scan_events
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON scan_events
  FOR DELETE USING (auth.role() = 'authenticated');

-- Removal events policies
CREATE POLICY "Enable read access for all users" ON removal_events
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON removal_events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON removal_events
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON removal_events
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create views for easier querying

-- View for inventory items with their referenced items
CREATE OR REPLACE VIEW inventory_items_detailed AS
SELECT 
  ii.id,
  ii.kind,
  ii.ref_id,
  ii.quantity,
  ii.location,
  ii.barcode,
  ii.alt_barcodes,
  ii.created_at,
  ii.updated_at,
  CASE 
    WHEN ii.kind = 'cigar' THEN c.brand
    WHEN ii.kind = 'bottle' THEN b.brand
  END AS brand,
  CASE 
    WHEN ii.kind = 'cigar' THEN c.line
    WHEN ii.kind = 'bottle' THEN b.expression
  END AS line_or_expression,
  CASE 
    WHEN ii.kind = 'cigar' THEN c.vitola
    WHEN ii.kind = 'bottle' THEN b.type
  END AS variant_info,
  CASE 
    WHEN ii.kind = 'cigar' THEN c.photo_url
    WHEN ii.kind = 'bottle' THEN b.photo_url
  END AS photo_url
FROM inventory_items ii
LEFT JOIN cigars c ON ii.kind = 'cigar' AND ii.ref_id = c.id
LEFT JOIN bottles b ON ii.kind = 'bottle' AND ii.ref_id = b.id;

-- Grant permissions on the view
GRANT SELECT ON inventory_items_detailed TO authenticated;
GRANT SELECT ON inventory_items_detailed TO anon;

-- Helpful functions

-- Function to get current inventory count for an item
CREATE OR REPLACE FUNCTION get_current_inventory(p_kind TEXT, p_ref_id UUID)
RETURNS INT AS $$
DECLARE
  total_added INT;
  total_removed INT;
BEGIN
  -- Get total quantity added
  SELECT COALESCE(SUM(quantity), 0) INTO total_added
  FROM inventory_items
  WHERE kind = p_kind AND ref_id = p_ref_id;
  
  -- Get total quantity removed
  SELECT COALESCE(SUM(re.quantity_removed), 0) INTO total_removed
  FROM removal_events re
  JOIN inventory_items ii ON re.inventory_item_id = ii.id
  WHERE ii.kind = p_kind AND ii.ref_id = p_ref_id;
  
  RETURN total_added - total_removed;
END;
$$ LANGUAGE plpgsql;

-- Function to search items by barcode
CREATE OR REPLACE FUNCTION search_by_barcode(p_barcode TEXT)
RETURNS TABLE (
  id UUID,
  kind TEXT,
  ref_id UUID,
  brand TEXT,
  line_or_expression TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ii.id,
    ii.kind,
    ii.ref_id,
    CASE 
      WHEN ii.kind = 'cigar' THEN c.brand
      WHEN ii.kind = 'bottle' THEN b.brand
    END AS brand,
    CASE 
      WHEN ii.kind = 'cigar' THEN c.line
      WHEN ii.kind = 'bottle' THEN b.expression
    END AS line_or_expression
  FROM inventory_items ii
  LEFT JOIN cigars c ON ii.kind = 'cigar' AND ii.ref_id = c.id
  LEFT JOIN bottles b ON ii.kind = 'bottle' AND ii.ref_id = b.id
  WHERE ii.barcode = p_barcode OR p_barcode = ANY(ii.alt_barcodes);
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE cigars IS 'Stores cigar product information';
COMMENT ON TABLE bottles IS 'Stores bottle/spirit product information';
COMMENT ON TABLE inventory_items IS 'Tracks inventory quantities and locations for both cigars and bottles';
COMMENT ON TABLE scan_sessions IS 'Records barcode scanning sessions';
COMMENT ON TABLE scan_events IS 'Individual scan events within a session';
COMMENT ON TABLE removal_events IS 'Tracks when items are removed from inventory';

COMMENT ON COLUMN inventory_items.kind IS 'Type of item: either cigar or bottle';
COMMENT ON COLUMN inventory_items.ref_id IS 'References either cigars.id or bottles.id based on kind';
COMMENT ON COLUMN inventory_items.alt_barcodes IS 'Array of alternative barcodes for the same item';