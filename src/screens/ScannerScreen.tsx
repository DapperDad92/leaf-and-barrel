import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { ScannerScreenProps } from '../navigation/types';

export default function ScannerScreen({}: ScannerScreenProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={80} color="#C6A664" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            To scan cigar barcodes, Leaf & Barrel needs access to your camera.
          </Text>
          <TouchableOpacity style={styles.settingsButton} onPress={openSettings}>
            <Text style={styles.settingsButtonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.placeholderContainer}>
        <Ionicons name="scan-outline" size={100} color="#C6A664" />
        <Text style={styles.placeholderTitle}>Scanner Coming Soon</Text>
        <Text style={styles.placeholderText}>
          The barcode scanner feature will be implemented with{'\n'}
          react-native-vision-camera in a future update.
        </Text>
        <View style={styles.featureList}>
          <Text style={styles.featureItem}>• Scan cigar barcodes</Text>
          <Text style={styles.featureItem}>• Instant product information</Text>
          <Text style={styles.featureItem}>• Add to your collection</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#F3E9DC',
    fontSize: 16,
    fontFamily: 'System',
  },
  permissionContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    color: '#F3E9DC',
    fontSize: 24,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    color: '#F3E9DC',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
    opacity: 0.8,
  },
  settingsButton: {
    backgroundColor: '#C6A664',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  placeholderTitle: {
    color: '#F3E9DC',
    fontSize: 28,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 16,
  },
  placeholderText: {
    color: '#F3E9DC',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
    opacity: 0.8,
  },
  featureList: {
    alignItems: 'flex-start',
  },
  featureItem: {
    color: '#C6A664',
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '500',
  },
});