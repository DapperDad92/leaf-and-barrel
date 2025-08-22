🔢 Priority & Cut Line (when to deploy to TestFlight)

T1 – Barcode Scanning (Batch Add)

T2 – Manual Add + Photo Upload

T3 – Remove Flow (Remove 1 / Remove All)

T4 – Bottles List (Parity with Cigars)

T5 – Auth (Magic Link)

T6 – Inventory Read Model (DB View)

T7 – Polish & Safety Nets

👉 Ship a TestFlight build after T1–T4 (fully usable MVP loop).
👉 Add Auth + Read Model + Polishes in the next build (keeps scope tight, but gives you a stable app ASAP).

T1 — Barcode Scanning (Batch Add MVP)

Goal: Replace scan stub with native scanner; implement batch add loop.
Refs: MVP flows and data model (ScanSession/ScanEvent, Inventory)

Tasks

Integrate react-native-vision-camera + vision-camera-code-scanner.

Permission flow + camera preview; throttle scans (1 result per ~1s).

On detection:

Call search_by_barcode(:code) RPC (if added) or select on inventory_items/known tables.

If match → show “Quantity” sheet (default 1).

If no match → navigate to Manual Add (T2) and pass barcode.

Create scan_sessions on entry; write scan_events for each detection (matched/manual/failed).

Buttons: Confirm & Add Another (stay in camera) / Done (finish session).

DoD

Can scan multiple barcodes in one session and add quantities quickly.

Unknown barcode routes to Manual Add, preserving barcode.

scan_sessions/scan_events rows appear correctly in DB.

T2 — Manual Add (Cigar/Bottle) + Photo Upload

Goal: Minimal create forms + optional photo; supports unknown barcodes.
Refs: Entities & fields for cigars/bottles in schema.

Tasks

Screens: Add Cigar, Add Bottle (brand required; others optional).

If navigated from scanner, prefill hidden barcode state → on save, also store barcode on inventory_items.barcode or append to alt_barcodes[].

Optional photo capture/upload to storage bucket; store public URL on item (display only in MVP).

After save: success toast → back to Scan (if came from scan flow) or list.

DoD

Can add an unknown cigar/bottle with brand (+optional fields), plus photo.

If launched from scanner, barcode is saved for future matches; next scan of same code resolves.

T3 — Remove Flow (Swipe → Remove 1 / Remove All)

Goal: Adjust inventory down with event audit.
Refs: Removal events schema & flow.

Tasks

Implement swipe actions on list rows: Remove 1, Remove All.

Create removal_events rows; update client cache optimistically (React Query).

If optimistic update fails, roll back and show error.

DoD

Visible quantity changes immediately; events are logged; errors handled gracefully.

T4 — Bottles List (Parity with Cigars)

Goal: Mirror Cigars list for Bottles.
Refs: Bottle fields & UI style guide cues.

Tasks

Bottle list screen: card layout, quick info.

Pulls from bottles (or Read Model view in T6 once ready).

FAB → Scan (kind=bottle) → batch add flow.

DoD

Bottles tab works like Cigars (read + navigate to add/remove).

T5 — Auth (Email Magic Link)

Goal: Minimal sign‑in to satisfy RLS policies while keeping single‑user UX simple.
Refs: Architecture & README (Supabase w/ RLS guidance).

Tasks

Add email magic link sign‑in (Supabase Auth) + session persistence.

“Write” actions (scan add, manual add, remove) require session; read allowed for anon.

Handle 401/403: show a bottom sheet “Sign in to continue,” with email field.

Add “Sign out” in a hidden Dev/Settings screen for now.

DoD

Signed‑out users can browse; attempting to add/remove prompts sign‑in; writes succeed post‑login. (If you kept RLS off for MVP, gate writes anyway to keep a consistent UX later.)

T6 — Inventory Read Model (DB View)

Goal: Use a DB view to simplify list queries (joined names, computed quantities).
Refs: Read‑model guidance in architecture + schema intent.

Tasks

Create/read from inventory_items_detailed (or similar) view (brand/line/type joined, latest quantity computed). If Roo already made one, switch the list query to use it.

Add useInventory(kind?: 'cigar'|'bottle') hook (React Query) that queries the view and filters by kind.

DoD

Lists render from the view, fewer client joins, faster UI. Filtering by kind works.

T7 — Polish & Safety Nets

Goal: Tighten UX and prevent common pitfalls.
Refs: Style guide colors/typography, MVP flows.

Tasks

Env guard in supabase.ts → throw friendly error if URL/key missing (you saw the Hermes “Invalid URL” earlier).

Empty/Loading/Error states: consistent components; pull‑to‑refresh on lists.

Accessibility: min tap targets, announce loading/errors.

README updates:

“Run at work” (tunnel default, hotspot fallback, Dev Client vs Expo Go).

“First‑run with Supabase” (where to get keys, restart with -c).

Icons/Theming: ensure charcoal/oak/gold applied; serif headers / sans body.

DoD

No crashes with missing env; clean UI states; README has run + deploy guidance.

Deployment guidance

After T1–T4: cut a TestFlight (development) build so you can start real‑world use (scanning, adding, removing) on your iPhone without Metro.

After T5–T7: ship the next TestFlight with Auth, faster lists via view, and QA‑level polish.