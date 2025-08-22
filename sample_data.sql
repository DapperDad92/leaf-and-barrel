-- Sample Data for Leaf & Barrel App
-- Run this in your Supabase SQL Editor to populate your database with test data

-- Insert sample cigars
INSERT INTO cigars (brand, line, vitola, size_ring_gauge, size_length_in, wrapper, strength, notes)
VALUES 
  ('Padron', '1964 Anniversary', 'Torpedo', 52, 6.0, 'Natural', 'full', 'Rich and complex with notes of cocoa and coffee'),
  ('Arturo Fuente', 'Opus X', 'Robusto', 50, 5.25, 'Dominican', 'full', 'Rare and highly sought after, perfect construction'),
  ('Montecristo', 'White Series', 'Toro', 54, 6.0, 'Ecuador Connecticut', 'mild', 'Smooth and creamy with hints of vanilla'),
  ('Romeo y Julieta', '1875', 'Churchill', 50, 7.0, 'Indonesian TBN', 'medium', 'Classic Cuban heritage brand'),
  ('Cohiba', 'Blue', 'Robusto', 50, 5.5, 'Honduras', 'medium', 'Excellent construction with cedar notes'),
  ('Oliva', 'Serie V', 'Double Toro', 60, 6.0, 'Sun Grown', 'full', 'Bold and spicy with leather undertones'),
  ('My Father', 'Le Bijou 1922', 'Toro', 52, 6.0, 'Habano Oscuro', 'full', 'Box pressed beauty with chocolate notes'),
  ('Davidoff', 'Nicaragua', 'Robusto', 50, 5.0, 'Habano', 'medium', 'Refined and elegant smoke');

-- Insert sample bottles
INSERT INTO bottles (brand, expression, type, proof, abv, age_years, notes)
VALUES 
  ('Buffalo Trace', 'Single Barrel Select', 'bourbon', 90, 45.0, NULL, 'Smooth with caramel and vanilla notes'),
  ('Macallan', '12 Year Double Cask', 'scotch', 86, 43.0, 12, 'Sherry influence with dried fruits and spice'),
  ('Redbreast', '15 Year', 'irish', 92, 46.0, 15, 'Full bodied with Christmas spices'),
  ('Blanton''s', 'Single Barrel', 'bourbon', 93, 46.5, NULL, 'Sweet with citrus and oak'),
  ('Lagavulin', '16 Year', 'scotch', 86, 43.0, 16, 'Intense smoke and peat with sea salt'),
  ('Four Roses', 'Small Batch', 'bourbon', 90, 45.0, NULL, 'Fruity and floral with a spicy finish'),
  ('Jameson', 'Black Barrel', 'irish', 80, 40.0, NULL, 'Charred barrels give rich, intense flavor'),
  ('Glenfiddich', '18 Year', 'scotch', 86, 43.0, 18, 'Remarkably rich with dried fruit and candy'),
  ('Woodford Reserve', 'Double Oaked', 'bourbon', 90, 45.2, NULL, 'Sweet oak and caramel from second barreling'),
  ('Don Julio', '1942', 'tequila', 80, 40.0, NULL, 'Smooth añejo with caramel and chocolate notes');

-- Create inventory items for some cigars
INSERT INTO inventory_items (kind, ref_id, quantity, location, barcode)
SELECT 
  'cigar',
  id,
  CASE 
    WHEN brand = 'Padron' THEN 5
    WHEN brand = 'Arturo Fuente' THEN 2
    WHEN brand = 'Montecristo' THEN 10
    WHEN brand = 'Romeo y Julieta' THEN 8
    ELSE 3
  END,
  CASE 
    WHEN brand IN ('Padron', 'Arturo Fuente') THEN 'Humidor 1 - Top Shelf'
    WHEN brand IN ('Montecristo', 'Romeo y Julieta') THEN 'Humidor 1 - Middle Shelf'
    ELSE 'Humidor 2'
  END,
  -- Generate fake barcodes
  CONCAT('CIG', SUBSTRING(REPLACE(CAST(id AS TEXT), '-', ''), 1, 12))
FROM cigars;

-- Create inventory items for some bottles
INSERT INTO inventory_items (kind, ref_id, quantity, location, barcode)
SELECT 
  'bottle',
  id,
  CASE 
    WHEN type = 'bourbon' THEN 1
    WHEN type = 'scotch' THEN 1
    ELSE 2
  END,
  CASE 
    WHEN type = 'bourbon' THEN 'Bar Cabinet - Bourbon Shelf'
    WHEN type = 'scotch' THEN 'Bar Cabinet - Scotch Shelf'
    WHEN type = 'irish' THEN 'Bar Cabinet - Irish Shelf'
    ELSE 'Bar Cabinet - Bottom Shelf'
  END,
  -- Generate fake barcodes
  CONCAT('BTL', SUBSTRING(REPLACE(CAST(id AS TEXT), '-', ''), 1, 12))
FROM bottles;

-- Create a sample scan session
INSERT INTO scan_sessions (items_added, items_failed, ended_at)
VALUES (5, 0, NOW());

-- Add some scan events to the session
INSERT INTO scan_events (session_id, kind, barcode, matched_ref_id, quantity, status)
SELECT 
  (SELECT id FROM scan_sessions ORDER BY created_at DESC LIMIT 1),
  'cigar',
  CONCAT('CIG', SUBSTRING(REPLACE(CAST(id AS TEXT), '-', ''), 1, 12)),
  id,
  1,
  'matched'
FROM cigars
LIMIT 5;

-- Verify the data was inserted
SELECT 'Cigars:' as table_name, COUNT(*) as count FROM cigars
UNION ALL
SELECT 'Bottles:', COUNT(*) FROM bottles
UNION ALL
SELECT 'Inventory Items:', COUNT(*) FROM inventory_items
UNION ALL
SELECT 'Scan Sessions:', COUNT(*) FROM scan_sessions
UNION ALL
SELECT 'Scan Events:', COUNT(*) FROM scan_events;