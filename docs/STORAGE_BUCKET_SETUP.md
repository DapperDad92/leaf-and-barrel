# Storage Bucket Setup for Leaf & Barrel

## Option 1: SQL Method (Recommended)

Run the `storage_setup.sql` file in your Supabase SQL Editor. This will:
1. Create the storage buckets if they don't exist
2. Set up the necessary policies for photo uploads

```sql
-- Run the contents of storage_setup.sql
```

## Option 2: Supabase Dashboard (Manual)

If the SQL method fails, you can create the buckets manually:

### Step 1: Create Buckets

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Create two buckets:
   - Name: `cigars`, Public: Yes
   - Name: `bottles`, Public: Yes

### Step 2: Set Up Policies

After creating the buckets, you need to add policies:

1. Click on the bucket name (e.g., `cigars`)
2. Go to the **Policies** tab
3. Click **New policy**
4. Create these policies for BOTH buckets:

**Policy 1: Public Read**
- Name: `public_read`
- Allowed operation: `SELECT`
- Target roles: Leave empty (applies to all)
- Policy definition: `true`

**Policy 2: Anonymous Upload**
- Name: `anon_upload`
- Allowed operation: `INSERT`
- Target roles: `anon`, `authenticated`
- Policy definition: `true`

**Policy 3: Anonymous Update**
- Name: `anon_update`
- Allowed operation: `UPDATE`
- Target roles: `anon`, `authenticated`
- Policy definition: `true`

**Policy 4: Anonymous Delete**
- Name: `anon_delete`
- Allowed operation: `DELETE`
- Target roles: `anon`, `authenticated`
- Policy definition: `true`

## Option 3: Simplified SQL (If Option 1 Fails)

If the INSERT statement doesn't work, try this simplified approach:

```sql
-- Just create the policies (assuming buckets exist)
-- Run this after manually creating buckets in the dashboard

-- Allow public read
CREATE POLICY "public_read_cigars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cigars');

CREATE POLICY "public_read_bottles"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bottles');

-- Allow anonymous upload
CREATE POLICY "anon_upload_cigars"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'cigars');

CREATE POLICY "anon_upload_bottles"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'bottles');

-- Allow anonymous update
CREATE POLICY "anon_update_cigars"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'cigars')
  WITH CHECK (bucket_id = 'cigars');

CREATE POLICY "anon_update_bottles"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'bottles')
  WITH CHECK (bucket_id = 'bottles');

-- Allow anonymous delete
CREATE POLICY "anon_delete_cigars"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'cigars');

CREATE POLICY "anon_delete_bottles"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'bottles');
```

## Troubleshooting

### Error: "Bucket not found"
- The bucket doesn't exist. Create it using Option 2 (Dashboard method)

### Error: "new row violates row-level security policy"
- The policies aren't set up correctly. Re-run the policy creation SQL

### Error: "function storage.create_bucket does not exist"
- This function isn't available in your Supabase version. Use Option 2 or 3

### Photos upload but don't display
- Check that the bucket is set to public
- Verify the public read policy is in place
- Ensure the photo_url is being saved correctly in the database

## Testing Photo Upload

After setting up storage:

1. Open the app
2. Go to Cigars or Bottles tab
3. Tap the + button
4. Fill in the brand
5. Tap "Add Photo"
6. Select or take a photo
7. Save the item
8. The photo should appear in the list view

If photos still don't work after following these steps, check the browser console or React Native logs for specific error messages.