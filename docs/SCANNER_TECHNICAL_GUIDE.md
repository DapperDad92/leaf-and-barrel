# Scanner Technical Guide

## Overview

The Leaf & Barrel scanner is built using React Native Vision Camera v3 with its built-in code scanner functionality. This guide covers the technical implementation details, architecture decisions, and best practices for maintaining and extending the scanner feature.

## Architecture

### Core Components

1. **ScannerScreen** (`src/screens/ScannerScreen.tsx`)
   - Main scanner interface
   - Manages camera lifecycle
   - Handles permission flows
   - Coordinates scanner state

2. **useScanner Hook** (`src/hooks/useScanner.ts`)
   - Scanner state machine implementation
   - Barcode processing logic
   - Debounce mechanism
   - Error handling

3. **useScanSession Hook** (`src/hooks/useScanSession.ts`)
   - Session management
   - Torch state persistence
   - Scanner analytics

4. **QuantityModal** (`src/components/QuantityModal.tsx`)
   - Quantity adjustment interface
   - Optimistic updates
   - Offline support

### State Machine Implementation

The scanner uses a finite state machine with four states:

```typescript
type ScannerState = 'idle' | 'scanning' | 'processing' | 'frozen';

// State transitions:
// idle -> scanning (on camera ready)
// scanning -> processing (on barcode detected)
// processing -> frozen (on successful process)
// frozen -> idle (after 1500ms timeout)
```

### Debounce Mechanism

To prevent duplicate scans and provide visual feedback:

```typescript
const SCAN_COOLDOWN_MS = 1500;

// After successful scan:
1. Set state to 'frozen'
2. Disable scanner
3. Show visual feedback
4. Wait 1500ms
5. Reset to 'idle'
```

## Offline Queue Architecture

### Queue Structure

```typescript
interface QueuedOperation {
  id: string;
  type: 'create_item' | 'update_quantity' | 'upload_photo';
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}
```

### Queue Processing

1. **Enqueue**: Operations added to AsyncStorage queue
2. **Process**: Background service attempts sync
3. **Retry**: Exponential backoff for failures
4. **Complete**: Remove from queue on success

### Storage Keys

```
@leafandbarrel/offline-queue - Main operation queue
@leafandbarrel/scanner-state - Scanner preferences
@leafandbarrel/photo-cache - Temporary photo storage
```

## API Endpoints

### Barcode Resolution
```
GET /api/barcodes/:barcode
Response: {
  items: Array<{
    id: string;
    type: 'cigar' | 'bottle';
    name: string;
    brand: string;
  }>;
  count: number;
}
```

### Inventory Operations
```
POST /api/inventory
Body: {
  item_id: string;
  item_type: 'cigar' | 'bottle';
  quantity: number;
}

PATCH /api/inventory/:id
Body: {
  quantity: number;
}
```

### Photo Upload
```
POST /api/storage/upload
Body: FormData {
  file: Blob;
  path: string;
}
```

## Error Handling Strategies

### Permission Errors
- Clear messaging about camera requirements
- Direct links to system settings
- Alternative manual entry options

### Network Errors
- Automatic offline mode activation
- Queue operations for later sync
- Visual indicators of offline state

### Camera Errors
- Graceful degradation to manual entry
- Error boundary to prevent crashes
- Diagnostic logging for debugging

### Barcode Errors
- Invalid format detection
- User-friendly error messages
- Fallback to manual entry

## Performance Optimizations

### Camera Configuration
```typescript
const device = useCameraDevice('back', {
  physicalDevices: ['wide-angle-camera']
});

// Optimize for scanning
const format = useCameraFormat(device, [
  { fps: 30 },
  { videoResolution: { width: 1280, height: 720 } }
]);
```

### Frame Processing
- Process every 3rd frame (10fps effective rate)
- Skip processing during state transitions
- Release camera resources when backgrounded

### Memory Management
- Compress photos before caching
- Clear photo cache after successful upload
- Limit queue size to prevent storage issues

## Testing Recommendations

### Unit Tests
- State machine transitions
- Debounce logic
- Queue operations
- Error handling

### Integration Tests
- API endpoint mocking
- Offline/online transitions
- Permission flows
- Photo upload

### E2E Tests
- Full scan flow
- Known/unknown item paths
- Offline scanning
- Error scenarios

### Manual Testing
- Various lighting conditions
- Different barcode types
- Network interruptions
- Permission changes

## Security Considerations

1. **Input Validation**
   - Sanitize barcode data
   - Validate API responses
   - Prevent injection attacks

2. **Photo Handling**
   - Compress before upload
   - Clear cache after use
   - Validate file types

3. **API Security**
   - Use authenticated endpoints
   - Implement rate limiting
   - Validate user permissions

## Debugging Tips

### Enable Debug Logging
```typescript
// In development
if (__DEV__) {
  console.log('[Scanner]', state, event);
}
```

### Common Issues

1. **Scanner not detecting barcodes**
   - Check camera focus
   - Verify adequate lighting
   - Test barcode format support

2. **Duplicate scans**
   - Verify debounce timing
   - Check state transitions
   - Review event handlers

3. **Offline sync failures**
   - Inspect queue contents
   - Check network status
   - Verify API availability

## Future Enhancements

1. **Multi-barcode scanning**
   - Batch operations
   - Shopping list mode

2. **Advanced recognition**
   - OCR for labels
   - Image recognition

3. **Analytics**
   - Scan success rates
   - Popular items
   - Usage patterns

4. **Performance**
   - WebAssembly decoder
   - GPU acceleration
   - Predictive caching