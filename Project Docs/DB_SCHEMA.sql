-- Core tables
create table cigars (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  line text,
  vitola text,
  size_ring_gauge int,
  size_length_in numeric(4,2),
  wrapper text,
  strength text check (strength in ('mild','medium','full')) ,
  photo_url text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table bottles (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  expression text,
  type text check (type in ('bourbon','rye','scotch','irish','rum','tequila','mezcal','other')),
  proof int,
  abv numeric(5,2),
  age_years int,
  photo_url text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('cigar','bottle')),
  ref_id uuid not null,
  quantity int not null default 1,
  location text,
  barcode text,
  alt_barcodes text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sessions & events (telemetry + UX analytics)
create table scan_sessions (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz default now(),
  ended_at timestamptz,
  items_added int default 0,
  items_failed int default 0
);

create table scan_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references scan_sessions(id) on delete cascade,
  kind text check (kind in ('cigar','bottle')),
  barcode text,
  matched_ref_id uuid,
  quantity int default 1,
  status text check (status in ('matched','manual','failed')),
  photo_url text,
  created_at timestamptz default now()
);

create table removal_events (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid references inventory_items(id) on delete set null,
  quantity_removed int not null,
  reason text check (reason in ('smoked','empty','adjustment')),
  created_at timestamptz default now()
);
