High-level

Client-first, offline-friendly: scan → queue → optimistic UI → sync.

Data model (MVP): Cigar, Bottle, InventoryItem, ScanSession, ScanEvent, RemovalEvent.

No pairing requirement; Pairing entity reserved for later.

API (if Supabase)

Use Row Level Security tied to user (even if single-user).

Supabase “RPC” for batch add; otherwise standard CRUD on tables.

Image upload → get public URL → save on item.

API (if .NET)

Endpoints:

POST /scans/start, POST /scans/:id/record, POST /scans/:id/finish

GET/POST/PUT for /cigars, /bottles

POST /inventory (upsert), GET /inventory?kind=, PATCH /inventory/:id/adjust, POST /inventory/:id/remove

GET /lookup/barcode/:code

Barcode strategy

Primary: vision-camera-code-scanner (fast, native, iOS/Android)

Schema: store barcode and alt_barcodes[] on InventoryItem

Unknown barcode → Manual Add, save barcode for next time

Photos (MVP)

Capture or upload; store URL on item; display in lists/detail.

No OCR/recognition yet.

Offline & batching

Local queue (SQLite/mmkv) of pending scans.

Background sync on reconnect.

Optimistic UI: show added counts immediately; rollback only on hard failure.