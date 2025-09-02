# T2 - Manual Add + Photo Upload Feature Test Checklist

This document provides comprehensive manual testing steps for the T2 feature, which includes manual item addition, photo upload, barcode scanning integration, and offline resilience.

## Prerequisites

- [ ] App is installed on test device
- [ ] Test device has camera access enabled
- [ ] Test device has both online and offline testing capabilities
- [ ] Test barcodes available (both known and unknown)
- [ ] Sample photos ready for upload testing

## Test Scenarios

### 1. Scanner Flow - Unknown Barcode

**Steps:**
1. [ ] Navigate to Scanner tab
2. [ ] Scan an unknown barcode (not in database)
3. [ ] Verify "Unknown Item" modal appears
4. [ ] Verify modal shows the scanned barcode number
5. [ ] Verify two options are presented: "Add as Cigar" and "Add as Bottle"

**Add as Cigar:**
6. [ ] Tap "Add as Cigar"
7. [ ] Verify navigation to AddCigarScreen
8. [ ] Verify all form fields are empty
9. [ ] Fill in required field (Brand)
10. [ ] Fill in optional fields (Line, Vitola, Size, Wrapper, Strength, Notes)
11. [ ] Tap "Add Photo" button
12. [ ] Select photo from gallery or take new photo
13. [ ] Verify photo preview appears
14. [ ] Tap "Save"
15. [ ] Verify success toast message appears
16. [ ] Verify navigation back to Scanner
17. [ ] Re-scan the same barcode
18. [ ] Verify the item is now recognized and shows cigar details

**Add as Bottle:**
19. [ ] Repeat steps 1-5 with a different unknown barcode
20. [ ] Tap "Add as Bottle"
21. [ ] Verify navigation to AddBottleScreen
22. [ ] Fill in required fields (Brand, Expression)
23. [ ] Fill in optional fields (Type, Age, Proof, ABV, Notes)
24. [ ] Add photo and save
25. [ ] Verify success and navigation back to Scanner

### 2. Direct Add via FAB Button

**Cigars Tab:**
1. [ ] Navigate to Cigars tab
2. [ ] Tap the floating action button (+)
3. [ ] Verify navigation to AddCigarScreen
4. [ ] Verify no barcode is associated
5. [ ] Fill in all fields and add photo
6. [ ] Save and verify navigation to Cigars list
7. [ ] Verify new cigar appears in the list with photo

**Bottles Tab:**
8. [ ] Navigate to Bottles tab
9. [ ] Tap the floating action button (+)
10. [ ] Complete bottle addition flow
11. [ ] Verify new bottle appears in the list

### 3. Photo Upload Scenarios

**Successful Upload (Online):**
1. [ ] Ensure device is online
2. [ ] Add new item with photo
3. [ ] Verify photo uploads immediately
4. [ ] Check item in list shows photo thumbnail
5. [ ] Tap item to view details
6. [ ] Verify full-size photo is displayed

**Offline Photo Queue:**
7. [ ] Enable airplane mode
8. [ ] Add new item with photo
9. [ ] Verify "Offline Mode" toast appears
10. [ ] Verify item is saved successfully
11. [ ] Check item appears in list (without photo)
12. [ ] Disable airplane mode
13. [ ] Wait for automatic retry or restart app
14. [ ] Verify "Photos Uploaded" success toast
15. [ ] Verify photo now appears with item

**Upload Failure Recovery:**
16. [ ] Add item with very large photo (>10MB)
17. [ ] If upload fails, verify "Photo Saved Locally" toast
18. [ ] Verify item is saved without photo
19. [ ] Check photo uploads on next app launch

### 4. Form Validation

**Required Fields:**
1. [ ] Try to save cigar without Brand
2. [ ] Verify Save button is disabled
3. [ ] Enter Brand name
4. [ ] Verify Save button becomes enabled
5. [ ] Try to save bottle without Brand
6. [ ] Verify appropriate validation

**Field Constraints:**
7. [ ] Test Strength picker (Cigars)
   - [ ] Select Mild
   - [ ] Select Medium
   - [ ] Select Full
   - [ ] Clear selection
8. [ ] Test Type picker (Bottles)
   - [ ] Select each type option
   - [ ] Verify correct value is saved

### 5. Navigation & State Management

**Back Navigation:**
1. [ ] Start adding item from Scanner
2. [ ] Fill some fields
3. [ ] Press back/cancel
4. [ ] Verify return to Scanner
5. [ ] Verify no partial data is saved

**From Different Entry Points:**
6. [ ] Add item from Scanner → Verify returns to Scanner
7. [ ] Add item from FAB → Verify navigates to list
8. [ ] Test navigation with and without photos

### 6. Error Handling

**Network Errors:**
1. [ ] Disable internet but keep WiFi on
2. [ ] Try to save new item
3. [ ] Verify appropriate error message
4. [ ] Re-enable internet and retry
5. [ ] Verify successful save

**Database Errors:**
6. [ ] Try to save with extremely long text in notes
7. [ ] Verify graceful error handling
8. [ ] Verify no data loss

### 7. Alternative Barcode Management

1. [ ] Scan unknown barcode and add as cigar
2. [ ] Scan different unknown barcode
3. [ ] Add as same cigar (select from list)
4. [ ] Verify both barcodes now map to same item
5. [ ] Check inventory_items table has alt_barcodes array

### 8. Performance Testing

1. [ ] Add item with high-resolution photo
2. [ ] Verify reasonable upload time
3. [ ] Check list scrolling performance with many photos
4. [ ] Test rapid addition of multiple items

### 9. Edge Cases

1. [ ] Add item with all fields empty except Brand
2. [ ] Add item with all fields filled
3. [ ] Add item with special characters in text fields
4. [ ] Cancel photo selection and verify form state
5. [ ] Background app during photo upload
6. [ ] Kill app during save operation and verify data integrity

## Acceptance Criteria Verification

- [ ] ✅ Users can manually add cigars with all fields
- [ ] ✅ Users can manually add bottles with all fields
- [ ] ✅ Photo capture/selection works on both platforms
- [ ] ✅ Photos upload successfully when online
- [ ] ✅ Offline photos queue and upload when connection restored
- [ ] ✅ Unknown barcodes can be associated with new items
- [ ] ✅ Navigation flows correctly from all entry points
- [ ] ✅ Form validation prevents invalid submissions
- [ ] ✅ Error messages are clear and actionable
- [ ] ✅ Success feedback is provided for all operations

## Platform-Specific Testing

### iOS
- [ ] Test photo selection from iCloud photos
- [ ] Test camera permissions flow
- [ ] Verify ActionSheet styling for pickers

### Android
- [ ] Test photo selection from Google Photos
- [ ] Test back button behavior
- [ ] Verify picker dialog styling

## Scanner Feature Testing

### 10. Permission Flows

**Camera Permission Denied:**
1. [ ] Deny camera permission in system settings
2. [ ] Navigate to Scanner tab
3. [ ] Verify permission sheet appears with options:
   - [ ] Grant Permission button
   - [ ] Add Manually button
   - [ ] Pick Photo button
4. [ ] Tap "Grant Permission"
5. [ ] Verify navigation to system settings
6. [ ] Enable camera permission and return to app
7. [ ] Verify scanner is now active

**Limited Permission:**
8. [ ] Set camera permission to "Limited" (iOS 14+)
9. [ ] Navigate to Scanner tab
10. [ ] Verify appropriate messaging
11. [ ] Test fallback options work correctly

### 11. Known Barcode Scanning

**Quantity Update Flow:**
1. [ ] Scan a barcode for item already in inventory
2. [ ] Verify haptic feedback on scan
3. [ ] Verify audio beep plays
4. [ ] Verify camera freezes for 1.5 seconds
5. [ ] Verify QuantityModal appears with:
   - [ ] Current item name and details
   - [ ] Current quantity displayed
   - [ ] +1 as default increment
6. [ ] Tap "+" multiple times
7. [ ] Verify quantity updates correctly
8. [ ] Tap "-" to decrease
9. [ ] Verify cannot go below 0
10. [ ] Save and verify success toast
11. [ ] Check inventory reflects new quantity

### 12. Unknown Barcode Resolution

**New Item Addition:**
1. [ ] Scan unknown barcode
2. [ ] Verify freeze and feedback
3. [ ] Verify "Unknown Item" sheet with barcode number
4. [ ] Test both "Add as Cigar" and "Add as Bottle" paths
5. [ ] Verify barcode is pre-filled in add form
6. [ ] Complete item addition
7. [ ] Re-scan same barcode
8. [ ] Verify item is now recognized

### 13. Conflict Resolution

**Multiple Matches:**
1. [ ] Create scenario with multiple items sharing barcode
2. [ ] Scan the shared barcode
3. [ ] Verify selection sheet appears
4. [ ] Verify all matching items are listed
5. [ ] Select one item
6. [ ] Verify correct item quantity modal appears

### 14. Scanner UX Features

**Torch Control:**
1. [ ] Tap torch icon in scanner
2. [ ] Verify torch turns on
3. [ ] Navigate away and back
4. [ ] Verify torch state persists
5. [ ] Close app and reopen
6. [ ] Verify torch state is remembered
7. [ ] Test torch in low light conditions

**Visual Feedback:**
8. [ ] Scan barcode and verify:
   - [ ] Camera frame freezes
   - [ ] Haptic feedback occurs
   - [ ] Audio beep plays
   - [ ] 1.5 second freeze before reset
9. [ ] Try rapid scanning
10. [ ] Verify debounce prevents double scans

### 15. Offline Scanner Behavior

**Offline Scanning:**
1. [ ] Enable airplane mode
2. [ ] Scan known barcode
3. [ ] Verify quantity update works offline
4. [ ] Scan unknown barcode
5. [ ] Add as new item
6. [ ] Verify "Offline Mode" indicator
7. [ ] Disable airplane mode
8. [ ] Verify queued operations sync
9. [ ] Check success notifications

**Queue Management:**
10. [ ] Create multiple offline operations
11. [ ] Check operations complete in order
12. [ ] Verify no data loss
13. [ ] Test with intermittent connectivity

### 16. Scanner Error Handling

**Camera Unavailable:**
1. [ ] Use app on device without camera
2. [ ] Navigate to Scanner tab
3. [ ] Verify appropriate error message
4. [ ] Verify manual add option is prominent

**Invalid Barcodes:**
5. [ ] Scan damaged/partial barcode
6. [ ] Verify no crash occurs
7. [ ] Verify user-friendly error message

### 17. Scanner Performance

1. [ ] Test scanning speed in good lighting
2. [ ] Test scanning speed in poor lighting
3. [ ] Verify smooth camera preview (30fps)
4. [ ] Test with various barcode types:
   - [ ] UPC-A
   - [ ] UPC-E
   - [ ] EAN-13
   - [ ] EAN-8
   - [ ] Code 128
   - [ ] QR Code
5. [ ] Monitor battery usage during extended scanning

### 18. Scanner Edge Cases

1. [ ] Background app during scan
2. [ ] Receive call during scanning
3. [ ] Low battery during scan
4. [ ] Scan while device is rotating
5. [ ] Scan very small barcodes
6. [ ] Scan reflective/shiny barcodes
7. [ ] Multiple barcodes in frame
8. [ ] Scan at extreme angles

## Regression Testing

- [ ] Existing items still display correctly
- [ ] Scanner still recognizes known barcodes
- [ ] List filtering/search still works
- [ ] Pull-to-refresh updates new items
- [ ] No impact on pairing functionality

## Notes Section

Use this section to document any issues found, device-specific behaviors, or suggestions for improvement:

```
Date: ___________
Tester: ___________
Device: ___________
OS Version: ___________

Issues Found:
1. 
2. 
3. 

Suggestions:
1. 
2. 
3. 