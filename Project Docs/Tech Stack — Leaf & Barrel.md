# Tech Stack — Leaf & Barrel

## Guiding Principles
- **MVP = ultra‑fast inventory.** Batch barcode scans, minimal taps, offline‑tolerant.
- **Cigars & bottles are independent**; pairing is optional and comes later.
- **Photos are display‑only in MVP** (no recognition yet). Future: OCR → label recognition → official review enrichment → AI.
- **Docs stay current**: ChatGPT acts as AI Product & Architecture Copilot (owns tech choices & docs), Roo codes.

---

## Decision Summary (MVP → Future)
- **Mobile:** React Native (**Expo**)  
- **Scanning & Camera:** `react-native-vision-camera` + `vision-camera-code-scanner`
- **Data & Auth (MVP):** **Supabase** (Postgres + Storage + simple Auth)
- **Local queue/offline:** SQLite (via `expo-sqlite`) or `react-native-mmkv` for small queues
- **Navigation:** `@react-navigation/native` (Tabs: Cigars | Bottles | Pairings)
- **Server (Future scale / enterprise):** **.NET 8 Minimal APIs** + Azure Postgres + Azure Blob

Why this path?  
- **Ship fastest** with Expo + Supabase.  
- Keep schema/API portable so we can move to **.NET** without rewriting the mobile app.

---

## Mobile App (Expo)
**Core**
- React Native (Expo Managed Workflow)
- Navigation: `@react-navigation/native` (3 tabs)
- State/Data: TanStack React Query (caching + retries)
- Local queue: `expo-sqlite` (preferred) or `react-native-mmkv` for simple key/value
- Theming: dark mode default; palette/typography per style guide

**Camera & Scanning**
- `react-native-vision-camera`
- `vision-camera-code-scanner` (fast native scanning, iOS/Android)
- MVP: batch scanning, quantity prompt, confirm & add another, Done/Finish
- Fallback: Manual Add sheet if barcode unknown
- Photos: `expo-image-picker` *or* Vision Camera capture (stored in Supabase Storage)

**UI**
- Design language: Dark mode; Deep Charcoal (#1C1C1C), Oak Brown (#5A3E2B), Gold (#C6A664), Ember (#D14E24), Cream (#F3E9DC)
- Typography: Serif for names/titles (e.g., Playfair/Cormorant/Cinzel), Sans for UI (Inter/SF Pro/Roboto)
- Components:
  - **Cigars**: list rows styled like cigar bands (gold dividers)
  - **Bottles**: whiskey‑label style cards (cream card with serif brand)
  - **Pairings**: placeholder (future)

---

## Backend (MVP): Supabase
- **Database:** Postgres (tables: `cigars`, `bottles`, `inventory_items`, `scan_sessions`, `scan_events`, `removal_events`)
- **Storage:** Supabase Storage buckets `cigars/` & `bottles/` for photos
- **Auth:** Magic link/email (single user to start; multi‑user later with RLS)
- **APIs:** Use Supabase auto‑generated APIs; optional RPC for batch add telemetry

**MVP Operations**
- **Lookup:** GET barcode in `inventory_items` (or dedicated lookup table later)
- **Add/Adjust:** Upsert inventory with quantity & saved barcode
- **Remove:** “Remove 1” or “Remove All” (create `removal_events`)
- **Telemetry:** `scan_sessions` + `scan_events` (for UX speed & failure analysis)

> Schema is defined in `docs/DB_SCHEMA.sql`. Keep it as the single source of truth for both Supabase and .NET.

---

## Backend (Future): .NET 8 + Azure
- **API:** .NET 8 Minimal APIs (REST)
- **DB:** Azure Database for PostgreSQL (Flexible Server)
- **Storage:** Azure Blob for photos
- **Auth:** Auth0 or Azure AD B2C (when we need true multi‑user)
- **Caching:** Redis (later) for hot lookups
- **Endpoints (portable, matches MVP):**
  - `POST /scans/start`, `POST /scans/:id/record`, `POST /scans/:id/finish`
  - `GET/POST/PUT` `/cigars`, `/bottles`
  - `POST /inventory` (add/upsert), `GET /inventory?kind=`, `PATCH /inventory/:id/adjust`, `POST /inventory/:id/remove`
  - `GET /lookup/barcode/:code`

---

## Offline & Sync Strategy
- **Optimistic UI:** update counts immediately, write to local queue
- **Background sync:** flush queue when online; reconcile conflicts by last‑write‑wins at MVP
- **Recovery:** if failure on push, show toast and keep item pending

---

## Security & Privacy (MVP)
- Single user: RLS can be disabled initially; enable when multi‑user arrives
- Signed Storage URLs (time‑limited) for photos (or public during MVP if simpler)
- Basic input validation on client; server constraints in DB schema

---

## Observability
- App analytics: Expo + lightweight event logging (screen views, scan success/fail)
- Telemetry tables: `scan_sessions` and `scan_events`
- Performance budget: camera cold start < 300ms; scan→confirm loop < 2 taps

---

## Library List (MVP)
- `expo` (Managed Workflow)
- `react-native-vision-camera`
- `vision-camera-code-scanner`
- `@react-navigation/native` (+ bottom tabs)
- `@tanstack/react-query`
- `expo-sqlite` (or `react-native-mmkv`)
- `expo-image-picker` (optional if not using camera capture for photos)
- `zod` (lightweight client validation)
- `@supabase/supabase-js`

---

## Build & Dev
- **Environments:** `.env` (Supabase URL/Key), `EXPO_PUBLIC_*` for client env
- **Profiles:** `development`, `preview`, `production`
- **CI (later):** EAS Build + store artifacts; lint (& basic Detox/E2E optional)

---

## Roadmap: Tech Layers After MVP
1) **OCR Assist** for failed scans (Edge Function + vision API)
2) **Label Recognition** (closed‑world model for *your* collection first)
3) **Official Data Enrichment** (Cigar Aficionado / whiskey DBs, licensing as needed)
4) **AI Pairing & Personalization** (based on your notes/consumption history)
5) **.NET API** migration when we need enterprise‑grade extensibility

---

## Roo Actionables (Quick Start)
- Scaffold Expo app with 3 tabs (Cigars | Bottles | Pairings placeholder)
- Implement Scan Screen:
  - Vision Camera + Code Scanner
  - On scan: lookup → quantity prompt → confirm & add another (stay in scan) or Done
  - Manual Add fallback when unknown; store barcode for next time
- Lists & Detail:
  - Cigars list rows (band style) & Bottles cards (label style)
  - Swipe left → Remove 1 / Remove All → write `removal_events`
- Supabase:
  - Apply `docs/DB_SCHEMA.sql`
  - Buckets `cigars/`, `bottles/`; image upload helper
  - Minimal RPC for `scan_events` (optional)
