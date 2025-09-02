# Leaf & Barrel

A personal inventory management app for cigar and whiskey enthusiasts, built with React Native and Expo.

## Features

- **Barcode Scanning**: Quick inventory management with known/unknown item resolution
- **Offline-First Architecture**: Full functionality without internet, with automatic sync when online
- **Smart Scanner**:
  - Real-time barcode detection with haptic and audio feedback
  - Torch control for low-light scanning
  - Conflict resolution for multiple matches
  - Offline scanner with queue sync
- **Inventory Management**: Track cigars and bottles with photos and details
- **Dark Mode UI**: Elegant interface optimized for low-light environments

## User Flows

- **Scanner Flow**: See [Scanner Flow Documentation](docs/flows/scanner.md) for detailed barcode scanning workflow

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: TanStack React Query
- **Backend**: Supabase
- **UI Theme**: Dark mode with custom color palette

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or Android Emulator
- **Important for iOS**: Project must be located in a path without spaces or special characters

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Add your Supabase credentials to the `.env` file:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
### Running the App

#### Important: Dev Client Required

This app uses native modules (camera for barcode scanning) that are not available in Expo Go. You must use a custom development client. See [DEV_CLIENT_BUILD_GUIDE.md](./DEV_CLIENT_BUILD_GUIDE.md) for detailed build instructions.

**Quick Start with Dev Client:**

```bash
# Start the development server (with dev client)
npm start

# Run on iOS (local build, requires macOS)
npm run dev:ios

# Run on Android (local build)
npm run dev:android

# Build development client with EAS
npm run build:development
```

**Legacy Expo Go commands (won't work with camera features):**
```bash
# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

### iOS Setup for Barcode Scanning

The app uses `react-native-vision-camera` with its built-in code scanner for barcode scanning functionality. Here are the setup steps for iOS:

#### Prerequisites
- macOS with Xcode installed
- CocoaPods (`sudo gem install cocoapods`)
- **Project path must not contain spaces or special characters** (see Path Requirements below)

#### Setup Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Install iOS pods**:
   ```bash
   cd ios
   pod install
   cd ..
   ```

3. **Important iOS Configuration**:
   - The app includes a bridging header at `ios/LeafBarrel/LeafBarrel-Bridging-Header.h` that imports VisionCamera headers
   - The Podfile includes custom configuration for VisionCamera header search paths
   - The app uses VisionCamera v3's built-in useCodeScanner hook, so no external barcode scanning plugin is required

4. **Build and run**:
   ```bash
   npm run ios
   ```

#### Path Requirements for iOS Builds

**Important**: iOS builds will fail if your project path contains spaces or special characters. The build system automatically checks for this before running iOS commands.

Problematic characters that must be avoided:
- Spaces
- Special characters: `& ( ) { } [ ] ! # $ ' " \`

If you see the error "Path Safety Check Failed!", move your project to a path without these characters. For example:
- ❌ Bad: `/Users/YourName/My Projects/Leaf & Barrel`
- ✅ Good: `/Users/YourName/Projects/LeafAndBarrel`

The path check runs automatically before:
- `npm run ios`
- `npm run dev:ios`
- `npm run prebuild`
- `npm run build:ios`
- `npm run build:development`

#### Troubleshooting iOS Build Issues

If you encounter the error `'VisionCamera/FrameProcessorPlugin.h' file not found`:

1. Clean the build:
   ```bash
   cd ios
   rm -rf build
   cd ..
   ```

2. Reinstall pods:
   ```bash
   cd ios
   pod deintegrate
   pod install
   cd ..
   ```

3. If the issue persists, ensure the patches are applied:
   ```bash
   npx patch-package
   ```

### Network Configuration (Corporate/VPN Users)

This project is configured to use **tunnel mode** by default for Expo, which allows connections through corporate firewalls and VPNs. When you run `npm start`, the Metro bundler will automatically use a tunnel URL instead of a LAN connection.

#### Expo Connection Modes

- **LAN** (default Expo behavior): Uses local network (exp://10.x.x.x:8081). Fast but blocked by firewalls/VPNs.
- **Tunnel** (our default): Uses secure tunnel (exp://xxx.exp.direct:80). Works through firewalls but slightly slower.
- **Localhost**: Only for iOS simulator/Android emulator on the same machine.

The tunnel configuration is set in `.expo/settings.json`. If you need to temporarily use a different mode:

```bash
# Use LAN mode (faster when on open networks)
npx expo start --lan

# Use localhost (for emulators only)
npx expo start --localhost

# Force tunnel mode (already default)
npx expo start --tunnel
```

## Project Structure

```
├── src/
│   ├── api/          # Supabase client and API calls
│   ├── components/   # Reusable UI components
│   ├── screens/      # Screen components
│   ├── navigation/   # Navigation configuration
│   ├── types/        # TypeScript type definitions
│   ├── utils/        # Utility functions
│   ├── hooks/        # Custom React hooks
│   ├── services/     # Business logic services
│   └── store/        # Offline queue and state management
├── docs/             # Documentation
│   └── flows/        # User flow documentation
├── assets/           # Images, fonts, and other static assets
├── .env.example      # Environment variables template
├── app.json          # Expo configuration
├── babel.config.js   # Babel configuration with path aliases
└── tsconfig.json     # TypeScript configuration
```

## Development

This project uses TypeScript with strict mode enabled and path aliases configured for cleaner imports:

- `@/` - src directory
- `@api/` - src/api directory
- `@components/` - src/components directory
- `@screens/` - src/screens directory
- `@navigation/` - src/navigation directory
- `@types/` - src/types directory
- `@utils/` - src/utils directory

## Color Palette

- Deep Charcoal: #1C1C1C
- Oak Brown: #5A3E2B
- Gold: #C6A664
- Ember: #D14E24
- Warm Cream: #F3E9DC

## License

This project is private and proprietary.