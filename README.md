# Leaf & Barrel

A personal inventory management app for cigar and whiskey enthusiasts, built with React Native and Expo.

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
│   └── utils/        # Utility functions
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