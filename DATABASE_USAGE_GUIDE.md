# Database Usage Guide for Leaf & Barrel

## Quick Reference

### Importing Types
```typescript
import { supabase } from './src/api/supabase';
import type { 
  Cigar, 
  Bottle, 
  InventoryItem, 
  ScanSession,
  ScanEvent,
  RemovalEvent,
  InventoryItemDetailed 
} from './src/types/database';
```

### Common Queries

#### 1. Fetch All Cigars
```typescript
const { data: cigars, error } = await supabase
  .from('cigars')
  .select('*')
  .order('brand');
```

#### 2. Fetch All Bottles
```typescript
const { data: bottles, error } = await supabase
  .from('bottles')
  .select('*')
  .order('brand');
```

#### 3. Get Inventory with Details (using the view)
```typescript
const { data: inventory, error } = await supabase
  .from('inventory_items_detailed')
  .select('*')
  .order('brand');
```

#### 4. Search by Barcode
```typescript
const { data: results, error } = await supabase
  .rpc('search_by_barcode', { p_barcode: '123456789' });
```

#### 5. Get Current Inventory Count
```typescript
const { data: count, error } = await supabase
  .rpc('get_current_inventory', { 
    p_kind: 'cigar', 
    p_ref_id: 'uuid-here' 
  });
```

### Creating Records

#### Add a New Cigar
```typescript
const { data, error } = await supabase
  .from('cigars')
  .insert({
    brand: 'Padron',
    line: '1964 Anniversary',
    vitola: 'Torpedo',
    size_ring_gauge: 52,
    size_length_in: 6.0,
    wrapper: 'Natural',
    strength: 'full'
  })
  .select()
  .single();
```

#### Add a New Bottle
```typescript
const { data, error } = await supabase
  .from('bottles')
  .insert({
    brand: 'Buffalo Trace',
    expression: 'Single Barrel',
    type: 'bourbon',
    proof: 90,
    abv: 45.0
  })
  .select()
  .single();
```

#### Create Inventory Item
```typescript
const { data, error } = await supabase
  .from('inventory_items')
  .insert({
    kind: 'cigar',
    ref_id: cigarId,
    quantity: 5,
    location: 'Humidor 1',
    barcode: '123456789'
  })
  .select()
  .single();
```

### Scanning Workflow

#### 1. Start a Scan Session
```typescript
const { data: session, error } = await supabase
  .from('scan_sessions')
  .insert({})
  .select()
  .single();
```

#### 2. Record a Scan Event
```typescript
const { data, error } = await supabase
  .from('scan_events')
  .insert({
    session_id: session.id,
    kind: 'cigar',
    barcode: '123456789',
    matched_ref_id: cigarId,
    quantity: 1,
    status: 'matched'
  });
```

#### 3. End Scan Session
```typescript
const { error } = await supabase
  .from('scan_sessions')
  .update({ 
    ended_at: new Date().toISOString(),
    items_added: 10,
    items_failed: 2
  })
  .eq('id', session.id);
```

### Recording Removals

```typescript
const { data, error } = await supabase
  .from('removal_events')
  .insert({
    inventory_item_id: inventoryId,
    quantity_removed: 1,
    reason: 'smoked' // or 'empty', 'adjustment'
  });
```

### Real-time Subscriptions

#### Subscribe to Inventory Changes
```typescript
const subscription = supabase
  .channel('inventory_changes')
  .on(
    'postgres_changes',
    { 
      event: '*', 
      schema: 'public', 
      table: 'inventory_items' 
    },
    (payload) => {
      console.log('Inventory changed:', payload);
    }
  )
  .subscribe();

// Don't forget to unsubscribe when done
subscription.unsubscribe();
```

### Error Handling

Always check for errors:
```typescript
const { data, error } = await supabase.from('cigars').select('*');

if (error) {
  console.error('Error fetching cigars:', error);
  // Handle error appropriately
  return;
}

// Use data safely
console.log('Cigars:', data);
```

### Type-Safe Inserts/Updates

Use the helper types for type safety:
```typescript
import type { Insertable, Updatable } from './src/types/database';

// Type-safe insert
const newCigar: Insertable<'cigars'> = {
  brand: 'Cohiba',
  line: 'Blue',
  strength: 'medium'
};

// Type-safe update
const updateData: Updatable<'cigars'> = {
  notes: 'Excellent draw and construction'
};
```

## Best Practices

1. **Always handle errors** - Supabase operations can fail due to network issues or RLS policies
2. **Use the view for complex queries** - `inventory_items_detailed` joins the data for you
3. **Batch operations when possible** - Use `.insert([...])` for multiple records
4. **Clean up subscriptions** - Always unsubscribe from real-time channels when components unmount
5. **Use RLS policies** - The schema has RLS enabled, ensure your app handles authentication

## Common Patterns

### Get Items with Current Stock
```typescript
const { data: cigarsWithStock, error } = await supabase
  .from('cigars')
  .select(`
    *,
    inventory_items!inner(
      quantity,
      location
    )
  `)
  .gt('inventory_items.quantity', 0);
```

### Search Items by Name
```typescript
const { data, error } = await supabase
  .from('cigars')
  .select('*')
  .ilike('brand', `%${searchTerm}%`);
```

### Get Recent Scan Sessions
```typescript
const { data: recentSessions, error } = await supabase
  .from('scan_sessions')
  .select(`
    *,
    scan_events(count)
  `)
  .order('started_at', { ascending: false })
  .limit(10);
```

## Troubleshooting

### RLS Policy Errors
If you get "permission denied" errors:
1. Check if you're authenticated
2. Verify the RLS policies in Supabase Dashboard
3. Test with the service role key (development only)

### Type Errors
If TypeScript types don't match:
1. Regenerate types from Supabase Dashboard
2. Update `src/types/database.ts`
3. Restart TypeScript server in VSCode

### Performance Issues
1. Check if indexes are being used (Query Performance in Dashboard)
2. Use `.select()` with specific columns instead of `*`
3. Implement pagination for large datasets