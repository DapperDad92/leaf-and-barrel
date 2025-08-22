# Leaf & Barrel 🍂🥃

An inventory app for cigar and whiskey enthusiasts.  
The goal: eliminate decision fatigue by keeping an ultra-fast, visual inventory of what you own and making it simple to add, track, and remove items.

---

## 📌 What Problem This Solves
Cigars and bottles stack up quickly. Choosing what to enjoy can feel overwhelming. Leaf & Barrel gives you:
- **Fast inventory tracking** — scan or snap to add cigars and bottles.
- **Batch scanning** — add multiple items back-to-back without breaking flow.
- **Quick remove** — swipe to mark a cigar smoked or a bottle empty.
- **Photos for browsing** — visual humidor & rackhouse, no guesswork.

MVP is personal, single-user, utility-first. Future phases add reviews, pairing suggestions, official data enrichment, and AI personalization.

---

## 🎯 MVP Scope
**In Scope**
- Independent inventories: **Cigars** and **Bottles**
- Add via **barcode scan**, **manual entry**, or **photo (display only)**
- **Batch scanning mode**: confirm quantity → stay in scan mode until “Done”
- **Remove** via swipe (choose *Remove 1* or *Remove All*)
- **Dark mode UI** with Leaf & Barrel style guide (charcoal/oak/gold)

**Out of Scope (for MVP)**
- Ratings and reviews
- Pairing suggestions
- OCR/label recognition
- AI personalization
- Community/social features

---

## 🛠️ Tech Stack

### Mobile App
- **Framework:** React Native (Expo)
- **Navigation:** `@react-navigation/native` (3 tabs: Cigars | Bottles | Pairings)
- **State/Data:** TanStack React Query
- **Offline Queue:** `expo-sqlite` (preferred) or `react-native-mmkv`
- **UI/Styling:** Dark mode first, per [Leaf & Barrel Style Guide](./Leaf_And_Barrel_Style_Guide.pdf)

### Camera & Scanning
- `react-native-vision-camera`
- `vision-camera-code-scanner`
- MVP: batch scanning + quantity prompt
- Fallback: manual add if barcode unknown
- Photo capture: display only (stored in backend)

### Backend (MVP)
- **Supabase** (Postgres + Auth + Storage)
- Tables: `cigars`, `bottles`, `inventory_items`, `scan_sessions`, `scan_events`, `removal_events`
- Storage: buckets `cigars/` and `bottles/` for photos
- Auth: email magic link (single-user MVP)
- RPCs: optional batch add / scan telemetry

### Backend (Future)
- **.NET 8 Minimal APIs** + Azure Postgres + Azure Blob
- Same schema for portability
- Auth: Auth0 or Azure AD B2C
- Caching: Redis (later)
- Enterprise-grade extensibility when scaling

---

## 🗂️ Data Model (MVP)
- **Cigar**: brand, line, vitola, wrapper, strength, photo, notes
- **Bottle**: brand, expression, type, proof/abv, age, photo, notes
- **InventoryItem**: kind (cigar/bottle), ref_id, quantity, barcode(s), location
- **ScanSession**: start/end, items added/failed
- **ScanEvent**: barcode, matched_ref_id, quantity, status, photo
- **RemovalEvent**: quantity removed, reason (smoked/empty/adjustment)
- *(Future)* **Pairing**: cigar_id + bottle_id + notes/rating

See [`docs/DB_SCHEMA.sql`](./docs/DB_SCHEMA.sql) for full SQL schema.

---

## 🔄 User Flows

### Add Items
1. Tap “Add Cigar” or “Add Bottle”
2. Scan barcode → if match, prompt quantity (default 1)
3. Confirm & Add Another (stay in scan) OR Done (finish session)
4. Unknown barcode → Manual Add + optional photo → save barcode for future

### Remove Items
- Swipe left on item → *Remove 1* or *Remove All*
- Records `RemovalEvent`

### Browse
- **Cigars:** list styled like cigar bands
- **Bottles:** card styled like whiskey labels
- **Pairings:** placeholder tab for future

---

## 🎨 Style Guide
See [Leaf & Barrel Style Guide](./Leaf_And_Barrel_Style_Guide.pdf).

- **Colors:** Deep Charcoal #1C1C1C, Oak Brown #5A3E2B, Gold #C6A664, Ember #D14E24, Warm Cream #F3E9DC
- **Typography:** Serif (Playfair, Cormorant, Cinzel) for names/titles; Sans (Inter, SF Pro, Roboto) for body/UI
- **UI Patterns:** 
  - Cigars → band-styled rows
  - Bottles → whiskey card UI
  - Pairings → future “Leaf + Barrel” merge animation

---

## 📈 Roadmap

### Near-Future
- OCR assist for failed scans
- Notes & ratings (personal reviews)
- Manual pairing history
- “Pick for Me” randomizer

### Mid-Future
- Label recognition (closed-world model for your collection first)
- Official data enrichment (Cigar Aficionado, whiskey DBs)
- Smart pairing suggestions (rule-based → ML personalization)

### Long-Term
- AI personalization (“you tend to like medium cigars with high-rye bourbons”)
- Multi-user & sharing
- Community/social discovery

---

## 📂 Repo Structure
