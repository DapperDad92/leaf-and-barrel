# Supabase Database Migration Guide for Leaf & Barrel

## Overview
This guide will help you set up the complete database schema for your Leaf & Barrel app in Supabase.

## Prerequisites
- Supabase project created
- Supabase credentials configured in your `.env` file
- Access to Supabase Dashboard

## Step-by-Step Migration Instructions

### 1. Access Supabase SQL Editor
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project (hpfasvhdbevserkyajld)
3. Navigate to **SQL Editor** in the left sidebar

### 2. Run the Schema Migration
1. Click **New query** in the SQL Editor
2. Copy the entire contents of `supabase_schema_complete.sql`
3. Paste it into the SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### 3. Verify the Migration
After running the schema, verify everything was created correctly:

```sql
-- Check all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

### 4. Generate TypeScript Types
1. In Supabase Dashboard, go to **API Docs**
2. Scroll to **Introduction** section
3. Copy the TypeScript definitions
4. Replace the contents of `src/types/database.ts` with the generated types

### 5. Test RLS Policies
Before going to production, test your Row Level Security:

1. Go to **Authentication** → **Policies** in Supabase Dashboard
2. Use the policy editor to test different scenarios
3. Ensure authenticated users can perform CRUD operations
4. Verify anonymous users can only read data

### 6. Initial Data (Optional)
If you want to add some test data:

```sql
-- Insert sample cigars
INSERT INTO cigars (brand, line, vitola, size_ring_gauge, size_length_in, wrapper, strength)
VALUES 
  ('Padron', '1964 Anniversary', 'Torpedo', 52, 6.0, 'Natural', 'full'),
  ('Arturo Fuente', 'Opus X', 'Robusto', 50, 5.25, 'Dominican', 'full'),
  ('Montecristo', 'White Series', 'Toro', 54, 6.0, 'Ecuador Connecticut', 'mild');

-- Insert sample bottles
INSERT INTO bottles (brand, expression, type, proof, abv, age_years)
VALUES 
  ('Buffalo Trace', 'Single Barrel', 'bourbon', 90, 45.0, NULL),
  ('Macallan', '12 Year', 'scotch', 86, 43.0, 12),
  ('Redbreast', '15 Year', 'irish', 92, 46.0, 15);

-- Create inventory items for the samples
INSERT INTO inventory_items (kind, ref_id, quantity, location)
SELECT 'cigar', id, 5, 'Humidor 1' FROM cigars LIMIT 1;

INSERT INTO inventory_items (kind, ref_id, quantity, location)
SELECT 'bottle', id, 1, 'Bar Cabinet' FROM bottles LIMIT 1;
```

## Important Notes

### Security Considerations
- The current RLS policies are basic and allow all authenticated users full access
- For production, consider implementing user-specific policies:
  ```sql
  -- Example: Users can only see their own inventory
  CREATE POLICY "Users can view own inventory" ON inventory_items
    FOR SELECT USING (auth.uid() = user_id);
  ```

### Performance Tips
1. The schema includes indexes on commonly queried fields
2. The GIN index on `alt_barcodes` enables fast array searches
3. The `inventory_items_detailed` view simplifies complex queries

### Backup Strategy
Always backup your data before major changes:
```bash
# Using Supabase CLI
supabase db dump -f backup.sql
```

### Monitoring
- Monitor slow queries in **Database** → **Query Performance**
- Check index usage regularly
- Review RLS policy performance impact

## Troubleshooting

### Common Issues

1. **"permission denied for schema public"**
   - Ensure you're running the migration as the postgres user
   - Check your connection credentials

2. **"relation already exists"**
   - The schema uses `IF NOT EXISTS` clauses, but if you need to start fresh:
   ```sql
   -- WARNING: This will delete all data!
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```

3. **RLS policies blocking access**
   - Temporarily disable RLS for testing:
   ```sql
   ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;
   ```
   - Remember to re-enable it!

### Next Steps
1. Update your app's TypeScript types
2. Test the API endpoints with your new schema
3. Implement proper error handling for database operations
4. Consider adding database triggers for business logic
5. Set up regular backups

## Additional Resources
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)