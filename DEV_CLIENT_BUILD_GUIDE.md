# Leaf & Barrel - iOS Dev Client Build Guide

## Overview

This guide explains how to build and run the Leaf & Barrel app using Expo Dev Client. Since the app will use `react-native-vision-camera` for barcode scanning functionality, it requires a custom development client instead of Expo Go.

## Prerequisites

1. **Expo Account**: You need an Expo account to use EAS Build
   - Create one at https://expo.dev/signup
   - Login using: `npx expo login`

2. **EAS CLI** (for cloud builds):
   ```bash
   npm install -g eas-cli
   ```

3. **For Local iOS Builds**:
   - macOS with Xcode installed
   - iOS Simulator or physical iOS device
   - Apple Developer account (for device builds)

## Configuration Details

### iOS Configuration (app.config.ts)
- **Bundle Identifier**: `com.leafandbarrel.app`
- **Minimum iOS Version**: 13.0 (required for react-native-vision-camera)
- **Camera Permission**: "This app uses the camera to scan barcodes on cigar bands and bottle labels for quick identification and inventory management."

### Android Configuration (for future)
- **Package Name**: `com.leafandbarrel.app`
- **Camera Permission**: `android.permission.CAMERA`

## Build Options

### Option 1: EAS Build (Recommended for Team Development)

1. **Configure EAS Build**:
   ```bash
   npm run eas:configure
   ```
   This will create an `eas.json` file and link your project to EAS.

2. **Build Development Client for iOS**:
   ```bash
   npm run build:development
   ```
   Or manually:
   ```bash
   eas build --profile development --platform ios
   ```

3. **Install on Device/Simulator**:
   - Download the build from your Expo dashboard
   - For Simulator: Drag the .app file to the simulator
   - For Device: Use the QR code or install link provided by EAS

### Option 2: Local Build (Requires macOS)

1. **Prebuild the Native Projects**:
   ```bash
   npm run prebuild
   ```
   This generates the `ios` and `android` folders.

2. **Run on iOS Simulator**:
   ```bash
   npm run dev:ios
   ```

3. **Run on Physical Device**:
   - Open `ios/LeafBarrel.xcworkspace` in Xcode
   - Select your device
   - Build and run

## Running the Dev Client

Once the dev client is installed:

1. **Start the Development Server**:
   ```bash
   npm start
   ```
   This will start with the `--dev-client` flag automatically.

2. **Connect Your App**:
   - Open the Leaf & Barrel app on your device/simulator
   - It will automatically connect to your development server
   - If not, scan the QR code or enter the URL manually

## Important Notes

### Why Dev Client Instead of Expo Go?

- **Camera Access**: react-native-vision-camera requires native code that isn't available in Expo Go
- **Performance**: Dev client provides better performance for camera operations
- **Custom Native Modules**: Allows integration of any native modules in the future

### Camera Permissions

The app will request camera permissions when first attempting to use the scanner. Users will see:
> "This app uses the camera to scan barcodes on cigar bands and bottle labels for quick identification and inventory management."

### Troubleshooting

1. **"expo-dev-client" module not found**:
   ```bash
   npm install expo-dev-client
   ```

2. **Build fails with "No bundle URL present"**:
   - Ensure your development server is running
   - Check that your device/simulator can reach your development machine

3. **Camera permission denied**:
   - iOS: Go to Settings > Leaf & Barrel > Camera
   - Android: Go to Settings > Apps > Leaf & Barrel > Permissions

## Next Steps

After setting up the dev client:

1. Install react-native-vision-camera when ready:
   ```bash
   npm install react-native-vision-camera
   ```

2. Rebuild the dev client after adding new native dependencies

3. Implement the barcode scanning functionality

## Scripts Reference

- `npm start` - Start dev server with dev client
- `npm run dev:ios` - Run iOS dev client locally
- `npm run prebuild` - Generate native projects
- `npm run build:development` - Build dev client with EAS
- `npm run eas:configure` - Configure EAS for your project