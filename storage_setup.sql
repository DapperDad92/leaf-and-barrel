-- Create storage buckets for cigars and bottles
-- Note: Buckets can only be created through Supabase Dashboard or using INSERT statements

-- First, check if buckets exist and create them if they don't
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('cigars', 'cigars', true, null, null),
  ('bottles', 'bottles', true, null, null)
ON CONFLICT (id) DO NOTHING;

-- Wait a moment for bucket creation to complete
-- Then set up the storage policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "public_read_cigars_bottles" ON storage.objects;
DROP POLICY IF EXISTS "dev_anyone_upload_cigars_bottles" ON storage.objects;
DROP POLICY IF EXISTS "dev_anyone_update_cigars_bottles" ON storage.objects;
DROP POLICY IF EXISTS "dev_anyone_delete_cigars_bottles" ON storage.objects;

-- Allow public read access to photos in cigars and bottles buckets
CREATE POLICY "public_read_cigars_bottles"
  ON storage.objects
  FOR SELECT
  USING (bucket_id IN ('cigars', 'bottles'));

-- Allow anonymous and authenticated users to upload photos
CREATE POLICY "dev_anyone_upload_cigars_bottles"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id IN ('cigars', 'bottles'));

-- Allow anonymous and authenticated users to update photos
CREATE POLICY "dev_anyone_update_cigars_bottles"
  ON storage.objects
  FOR UPDATE
  TO anon, authenticated
  USING (bucket_id IN ('cigars', 'bottles'))
  WITH CHECK (bucket_id IN ('cigars', 'bottles'));

-- Allow anonymous and authenticated users to delete photos
CREATE POLICY "dev_anyone_delete_cigars_bottles"
  ON storage.objects
  FOR DELETE
  TO anon, authenticated
  USING (bucket_id IN ('cigars', 'bottles'));

-- Verify buckets were created
SELECT id, name, public FROM storage.buckets WHERE id IN ('cigars', 'bottles');