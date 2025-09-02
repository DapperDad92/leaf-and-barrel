import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const IS_DEV = process.env.APP_ENV !== 'production';

  return {
    ...config,
    name: 'Leaf & Barrel',
    slug: 'leaf-and-barrel',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    scheme: 'leafandbarrel', // fine; slug already provides exp+leaf-and-barrel for dev
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#1C1C1C', // (optional) align with dark brand
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.leafandbarrel.app',
      buildNumber: '1',
      infoPlist: {
        // You had these:
        NSCameraUsageDescription:
          'This app uses the camera to scan barcodes on cigar bands and bottle labels for quick identification and inventory management.',
        MinimumOSVersion: '13.0',
        ITSAppUsesNonExemptEncryption: false,

        // Add these:
        NSPhotoLibraryUsageDescription:
          'Allow access to choose photos for your items.',
        NSPhotoLibraryAddUsageDescription:
          'Allow saving photos to your library.',
        NSLocalNetworkUsageDescription:
          'Allow local network access to connect to the development server on your network.',

        // DEV ONLY: allow cleartext HTTP to the Metro server (http://<ip>:8081)
        ...(IS_DEV
          ? {
              NSAppTransportSecurity: {
                NSAllowsArbitraryLoads: true,
              },
            }
          : {}),
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.leafandbarrel.app',
      versionCode: 1,
      permissions: ['android.permission.CAMERA'],
    },
    web: { favicon: './assets/favicon.png' },
    plugins: [
      // Needed for real-device dev builds that open exp+... URLs
      'expo-dev-client',

      [
        'react-native-vision-camera',
        {
          enableCodeScanner: true,
          cameraPermissionText:
            'Leaf & Barrel uses the camera to scan barcodes and add items quickly.',
          enableMicrophonePermission: false,
        },
      ],

      // If you use expo-image-picker anywhere, it's fine to add:
      // 'expo-image-picker',
    ],
    extra: {
      eas: { projectId: '38e08e2b-99be-48eb-81f0-e9e1fd1ab275' },
    },
  };
};
