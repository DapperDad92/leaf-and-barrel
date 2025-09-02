# Scanner Flow Documentation

## Overview

The Leaf & Barrel scanner feature provides a seamless barcode scanning experience for quickly adding cigars and bottles to inventory. The scanner implements an offline-first architecture with intelligent known/unknown item resolution, real-time feedback, and graceful error handling.

## Scanner Flow Diagram

```mermaid
flowchart TD
    A[Entry Point] --> B{Camera permission?}
    B -- Granted --> C[Scanner Tab]
    B -- Denied/Limited --> B1[Sheet: Grant / Add Manually / Pick Photo] -->|Add Manually| H

    C --> D[Real-time Scan]
    D --> E{Barcode Found?}
    E -- No --> D
    E -- Yes --> F[Freeze + Haptic + Beep] --> G[Resolve Barcode]

    G --> G1{Known in inventory?}
    G1 -- Yes --> Q[Quantity Modal (+1 default)] --> Q1[Save change] --> Z[Toast + Return to Scanner]
    G1 -- No --> I[Sheet: Add as Cigar or Bottle] --> H[Add Screen (barcode prefilled)]

    H --> J[Manual Entry + Photo]
    J --> K[Save]
    K --> L{Online?}
    L -- Yes --> M[Create item + inventory + photo upload]
    L -- No --> N[Create item + inventory (queued); photo retry later]
    M --> Z
    N --> Z

    Z[Toast "Added" + Go Back]
```

## Detailed Flow Paths

### 1. Permission Flow
- **Entry Point**: User navigates to Scanner tab
- **Permission Check**: System checks camera permission status
  - **Granted**: Proceeds to scanner interface
  - **Denied/Limited**: Shows action sheet with options:
    - Grant Permission: Opens system settings
    - Add Manually: Navigates to manual entry
    - Pick Photo: Opens photo library for barcode detection

### 2. Scanning Flow
- **Real-time Scan**: Camera actively scans for barcodes
- **Barcode Detection**: 
  - Continuous scanning until barcode found
  - On detection: Immediate freeze frame, haptic feedback, and audio beep
  - 1500ms debounce prevents duplicate scans

### 3. Barcode Resolution
- **Known Item Path**:
  - Item exists in user's inventory
  - Shows QuantityModal with +1 default
  - User can adjust quantity or cancel
  - Save updates inventory count
  - Success toast and return to scanner

- **Unknown Item Path**:
  - Item not in inventory
  - Shows action sheet: "Add as Cigar" or "Add as Bottle"
  - Navigates to appropriate add screen with barcode prefilled
  - User completes item details and photo

### 4. Item Creation
- **Online Mode**:
  - Creates item in database
  - Adds to inventory with quantity
  - Uploads photo to storage
  - Shows success toast

- **Offline Mode**:
  - Creates item locally
  - Queues for sync when online
  - Photo cached for later upload
  - Shows success toast with offline indicator

## Technical Implementation Details

### State Machine
The scanner implements a finite state machine with the following states:
- `idle`: Scanner ready, no active scan
- `scanning`: Actively processing camera frames
- `processing`: Barcode detected, resolving item
- `frozen`: Display frozen after scan (1500ms)

### Debounce Mechanism
- 1500ms lockout period after successful scan
- Prevents duplicate processing of same barcode
- Allows user to see frozen frame with feedback

### Offline Behavior
- All scanner operations work offline
- Items queued in AsyncStorage
- Automatic sync when connection restored
- Photos cached and uploaded when online

### Feedback Mechanisms

#### Haptic Feedback
- Light impact on barcode detection
- Medium impact on successful save
- Heavy impact on errors

#### Audio Feedback
- System sound on barcode detection
- Different sounds for known/unknown items
- Error sound for failures

#### Visual Feedback
- Frame freeze on detection
- Loading states during processing
- Success/error toasts
- Offline indicators when applicable

### Error Handling
- Permission denied: Clear call-to-action
- Camera unavailable: Fallback to manual entry
- Network errors: Automatic offline mode
- Invalid barcodes: User-friendly error message

### Conflict Resolution
When multiple items match a barcode:
- Shows selection sheet with all matches
- User selects correct item
- System learns from selection for future scans

## Integration Points

### API Endpoints
- `GET /api/barcodes/:barcode` - Resolve barcode to item
- `POST /api/inventory` - Add item to inventory
- `PATCH /api/inventory/:id` - Update quantity
- `POST /api/storage/upload` - Upload item photo

### Local Storage
- Offline queue: `@leafandbarrel/offline-queue`
- Scanner state: `@leafandbarrel/scanner-state`
- Photo cache: `@leafandbarrel/photo-cache`

### Navigation
- Deep links to add screens with barcode parameter
- Modal presentation for quantity updates
- Sheet presentation for action selections

## Performance Considerations
- Camera preview at 30fps
- Barcode processing throttled to 10fps
- Efficient memory management for photo handling
- Background queue processing for offline sync