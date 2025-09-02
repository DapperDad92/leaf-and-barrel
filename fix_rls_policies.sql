-- First, drop existing policies on cigars table
DROP POLICY IF EXISTS "Enable all for dev" ON cigars;
DROP POLICY IF EXISTS "Allow all operations" ON cigars;
DROP POLICY IF EXISTS "Enable read access for all users" ON cigars;
DROP POLICY IF EXISTS "Enable insert for all users" ON cigars;
DROP POLICY IF EXISTS "Enable update for all users" ON cigars;
DROP POLICY IF EXISTS "Enable delete for all users" ON cigars;

-- Create new policies that explicitly allow anonymous access
-- These policies will work for both authenticated and anonymous users

-- Allow anyone to read cigars
CREATE POLICY "Allow anonymous read" ON cigars
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone to insert cigars
CREATE POLICY "Allow anonymous insert" ON cigars
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to update cigars
CREATE POLICY "Allow anonymous update" ON cigars
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow anyone to delete cigars
CREATE POLICY "Allow anonymous delete" ON cigars
FOR DELETE
TO anon, authenticated
USING (true);

-- Apply the same policies to other tables that might need them

-- Bottles table
DROP POLICY IF EXISTS "Enable all for dev" ON bottles;
DROP POLICY IF EXISTS "Allow all operations" ON bottles;
DROP POLICY IF EXISTS "Enable read access for all users" ON bottles;
DROP POLICY IF EXISTS "Enable insert for all users" ON bottles;
DROP POLICY IF EXISTS "Enable update for all users" ON bottles;
DROP POLICY IF EXISTS "Enable delete for all users" ON bottles;

CREATE POLICY "Allow anonymous read" ON bottles
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow anonymous insert" ON bottles
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow anonymous update" ON bottles
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anonymous delete" ON bottles
FOR DELETE
TO anon, authenticated
USING (true);

-- Inventory items table
DROP POLICY IF EXISTS "Enable all for dev" ON inventory_items;
DROP POLICY IF EXISTS "Allow all operations" ON inventory_items;
DROP POLICY IF EXISTS "Enable read access for all users" ON inventory_items;
DROP POLICY IF EXISTS "Enable insert for all users" ON inventory_items;
DROP POLICY IF EXISTS "Enable update for all users" ON inventory_items;
DROP POLICY IF EXISTS "Enable delete for all users" ON inventory_items;

CREATE POLICY "Allow anonymous read" ON inventory_items
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow anonymous insert" ON inventory_items
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow anonymous update" ON inventory_items
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anonymous delete" ON inventory_items
FOR DELETE
TO anon, authenticated
USING (true);

-- Verify RLS is enabled on all tables
ALTER TABLE cigars ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Optional: If you want to completely disable RLS for development
-- (uncomment these lines if the above doesn't work)
-- ALTER TABLE cigars DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE bottles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;