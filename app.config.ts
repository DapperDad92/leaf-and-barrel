import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Leaf & Barrel',
  slug: 'leaf-and-barrel',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  scheme: 'leafandbarrel',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.leafandbarrel.app',
    buildNumber: '1',
    infoPlist: {
      NSCameraUsageDescription: 'This app uses the camera to scan barcodes on cigar bands and bottle labels for quick identification and inventory management.',
      // Minimum iOS version for react-native-vision-camera
      MinimumOSVersion: '13.0'
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.leafandbarrel.app',
    versionCode: 1,
    permissions: [
      'android.permission.CAMERA'
    ]
  },
  web: {
    favicon: './assets/favicon.png'
  },
  plugins: [
    // expo-dev-client plugin will be automatically included when installed
  ],
  extra: {
    // EAS Build configuration
    eas: {
      projectId: 'your-project-id' // This will be generated when you run eas build:configure
    }
  }
});