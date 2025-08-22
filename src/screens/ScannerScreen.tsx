import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Camera } from 'react-native-vision-camera';
import { Ionicons } from '@expo/vector-icons';
import { ScannerScreenProps } from '../navigation/types';
import { useScanner } from '../hooks/useScanner';
import { useScanSession } from '../hooks/useScanSession';
import QuantityModal from '../components/QuantityModal';

type ScanMode = 'cigar' | 'bottle';

interface PendingScan {
  barcode: string;
  mode: ScanMode;
}

export default function ScannerScreen({ navigation }: ScannerScreenProps) {
  const [scanMode, setScanMode] = useState<ScanMode>('cigar');
  const [pendingScan, setPendingScan] = useState<PendingScan | null>(null);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [sessionStats, setSessionStats] = useState({ added: 0, failed: 0 });

  const {
    session,
    isActive: isSessionActive,
    startSession,
    addScanEvent,
    endSession,
    isBarcodeScanned,
    isStarting,
    isAddingEvent,
    addEventError,
  } = useScanSession();

  const {
    device,
    hasPermission,
    isActive: isScannerActive,
    cameraRef,
    codeScanner,
    pauseScanning,
    resumeScanning,
  } = useScanner({
    onCodeScanned: (code, type) => {
      handleBarcodeScanned(code, type);
    },
    scanDelay: 1500,
  });

  // Start session when component mounts
  useEffect(() => {
    if (!isSessionActive && !isStarting) {
      startSession();
    }
  }, []);

  // Clean up session when component unmounts
  useEffect(() => {
    return () => {
      if (isSessionActive) {
        endSession();
      }
    };
  }, [isSessionActive]);

  // Update session stats
  useEffect(() => {
    if (session) {
      setSessionStats({
        added: session.items_added,
        failed: session.items_failed,
      });
    }
  }, [session]);

  const handleBarcodeScanned = useCallback(
    (barcode: string, type: string) => {
      // Check if already scanned in this session
      if (isBarcodeScanned(barcode)) {
        Alert.alert(
          'Already Scanned',
          'This item has already been scanned in this session.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Pause scanning and show quantity modal
      pauseScanning();
      setPendingScan({ barcode, mode: scanMode });
      setShowQuantityModal(true);
    },
    [scanMode, isBarcodeScanned, pauseScanning]
  );

  const handleQuantityConfirm = useCallback(
    async (quantity: number) => {
      if (!pendingScan) return;

      setShowQuantityModal(false);

      try {
        await addScanEvent({
          barcode: pendingScan.barcode,
          quantity,
          kind: pendingScan.mode,
        });

        // Show success feedback
        Alert.alert(
          'Added to Inventory',
          `Successfully added ${quantity} ${pendingScan.mode}${quantity > 1 ? 's' : ''}`,
          [
            {
              text: 'Scan Another',
              onPress: () => {
                setPendingScan(null);
                resumeScanning();
              },
            },
            {
              text: 'Done',
              onPress: () => {
                navigation.goBack();
              },
            },
          ]
        );
      } catch (error) {
        Alert.alert(
          'Error',
          'Failed to add item to inventory. Please try again.',
          [
            {
              text: 'OK',
              onPress: () => {
                setPendingScan(null);
                resumeScanning();
              },
            },
          ]
        );
      }
    },
    [pendingScan, addScanEvent, resumeScanning, navigation]
  );

  const handleQuantityCancel = useCallback(() => {
    setShowQuantityModal(false);
    setPendingScan(null);
    resumeScanning();
  }, [resumeScanning]);

  const toggleScanMode = () => {
    setScanMode((prev) => (prev === 'cigar' ? 'bottle' : 'cigar'));
  };

  const handleEndSession = () => {
    Alert.alert(
      'End Scanning Session',
      `You've scanned ${sessionStats.added} items successfully${
        sessionStats.failed > 0 ? ` and ${sessionStats.failed} failed` : ''
      }. End this session?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: () => {
            endSession();
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={80} color="#C6A664" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            To scan barcodes, Leaf & Barrel needs access to your camera.
          </Text>
        </View>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#C6A664" />
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isScannerActive && !showQuantityModal}
        codeScanner={codeScanner}
      />

      {/* Header Overlay */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleEndSession}
        >
          <Ionicons name="close" size={28} color="#F3E9DC" />
        </TouchableOpacity>

        <View style={styles.sessionInfo}>
          <Text style={styles.sessionText}>
            Scanned: {sessionStats.added}
          </Text>
          {sessionStats.failed > 0 && (
            <Text style={styles.sessionFailedText}>
              Failed: {sessionStats.failed}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            Alert.alert(
              'Scanning Tips',
              '• Hold the camera steady\n• Ensure good lighting\n• Center the barcode in view\n• Keep 6-12 inches away',
              [{ text: 'OK' }]
            );
          }}
        >
          <Ionicons name="help-circle-outline" size={28} color="#F3E9DC" />
        </TouchableOpacity>
      </View>

      {/* Scan Frame */}
      <View style={styles.scanFrame}>
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomContainer}>
        <Text style={styles.instructionText}>
          Position barcode within frame
        </Text>

        <TouchableOpacity
          style={styles.modeToggle}
          onPress={toggleScanMode}
        >
          <Ionicons
            name={scanMode === 'cigar' ? 'flame' : 'wine'}
            size={24}
            color="#1C1C1C"
          />
          <Text style={styles.modeText}>
            Scanning {scanMode === 'cigar' ? 'Cigars' : 'Bottles'}
          </Text>
          <Ionicons name="swap-horizontal" size={20} color="#1C1C1C" />
        </TouchableOpacity>

        {isAddingEvent && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color="#C6A664" />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        )}
      </View>

      {/* Quantity Modal */}
      {pendingScan && (
        <QuantityModal
          visible={showQuantityModal}
          onClose={handleQuantityCancel}
          onConfirm={handleQuantityConfirm}
          itemType={pendingScan.mode}
          barcode={pendingScan.barcode}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1C',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
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
    lineHeight: 22,
    opacity: 0.8,
  },
  loadingText: {
    color: '#F3E9DC',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(28, 28, 28, 0.9)',
    zIndex: 1,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionInfo: {
    alignItems: 'center',
  },
  sessionText: {
    color: '#F3E9DC',
    fontSize: 16,
    fontWeight: '600',
  },
  sessionFailedText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: 2,
  },
  scanFrame: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#C6A664',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: 'rgba(28, 28, 28, 0.9)',
    alignItems: 'center',
  },
  instructionText: {
    color: '#F3E9DC',
    fontSize: 16,
    marginBottom: 20,
    opacity: 0.8,
  },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C6A664',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  modeText: {
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '600',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  processingText: {
    color: '#C6A664',
    fontSize: 14,
  },
});