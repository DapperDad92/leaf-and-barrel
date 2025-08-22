# Product Spec — MVP (Leaf & Barrel)

## Product Goal
A lightning-fast personal inventory for cigars and bottles to eliminate decision fatigue.

## Core Principles
- Efficiency first: batch scanning, minimal taps
- Independence: cigars and bottles work alone; pairing is optional
- Future-ready: structure anticipates OCR, enrichment, and AI, but not in MVP

## MVP User Flows
1) Add Item (Cigar/Bottle)
- Open Scan Screen → scan barcode
- If match: set quantity (default 1) → Confirm & Add Another (stay in scan) or Done
- If no match: Manual Add (brand/name + minimal fields), optional photo; save barcode for future
- All scans logged to a ScanSession + ScanEvents for telemetry

2) Remove Item
- Swipe left → choose Remove 1 or Remove All → creates RemovalEvent

3) Browse
- Separate tabs: Cigars, Bottles
- Photo-first list, quick search later

## Data Model (MVP)
- Cigar(id, brand, line, vitola, size, wrapper, strength, photo_url, notes?, created_at, updated_at)
- Bottle(id, brand, expression, type, proof/abv, age_years, photo_url, notes?, created_at, updated_at)
- InventoryItem(id, kind, ref_id, quantity, location?, barcode?, alt_barcodes[], created_at, updated_at)
- ScanSession(id, started_at, ended_at, items_added, items_failed)
- ScanEvent(id, session_id, kind, barcode?, matched_ref_id?, quantity, status, photo_url?, created_at)
- RemovalEvent(id, inventory_item_id, quantity_removed, reason, created_at)
- (Future) Pairing(id, cigar_id, bottle_id, rating?, notes?, created_at)

## API (MVP)
- POST/GET/PUT for cigars & bottles
- Inventory: POST /inventory, GET /inventory, PATCH /inventory/:id/adjust, POST /inventory/:id/remove
- Scans: POST /scans/start, POST /scans/:sessionId/record, POST /scans/:sessionId/finish
- Lookup: GET /lookup/barcode/:code

## Non-Goals (MVP)
- Ratings, reviews, AI suggestions, official data imports
- Social or sharing features
