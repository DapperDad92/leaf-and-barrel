import React, { useState, useEffect, useCallback, useReducer, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  Linking,
  ToastAndroid,
} from 'react-native';
import { Camera } from 'react-native-vision-camera';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { ScannerScreenProps } from '../navigation/types';
import { useScanner } from '../hooks/useScanner';
import { useScanSession } from '../hooks/useScanSession';
import QuantityModal from '../components/QuantityModal';
import { findItemByBarcode } from '../api/barcodes';
import { incrementQuantity } from '../api/inventory';
import { REPEAT_LOCK_MS, RESOLVE_TIMEOUT_MS } from '../constants/scanner';
import { hapticFeedback } from '../lib/haptics';
import { enqueue } from '../store/offlineQueue';
import { isNetworkAvailable, subscribeToNetworkChanges } from '../utils/offline';
import { processOfflineQueue } from '../services/syncService';

type ScanMode = 'cigar' | 'bottle';

interface PendingScan {
  barcode: string;
  mode: ScanMode;
}

// State machine states
type ScannerState =
  | 'idle'
  | 'detecting'
  | 'found'
  | 'resolving'
  | 'known'
  | 'unknown'
  | 'conflict'
  | 'timeout';

// State machine actions
type ScannerAction =
  | { type: 'START_DETECTING' }
  | { type: 'BARCODE_FOUND'; barcode: string }
  | { type: 'START_RESOLVING' }
  | { type: 'RESOLUTION_KNOWN'; items: any[] }
  | { type: 'RESOLUTION_UNKNOWN' }
  | { type: 'RESOLUTION_CONFLICT'; items: any[] }
  | { type: 'RESOLUTION_TIMEOUT' }
  | { type: 'RESET' };

interface ScannerStateData {
  state: ScannerState;
  barcode: string | null;
  items: any[];
  lastScanTime: number;
}

// State machine reducer
function scannerReducer(state: ScannerStateData, action: ScannerAction): ScannerStateData {
  switch (action.type) {
    case 'START_DETECTING':
      return { ...state, state: 'detecting' };
    
    case 'BARCODE_FOUND':
      return {
        ...state,
        state: 'found',
        barcode: action.barcode,
        lastScanTime: Date.now()
      };
    
    case 'START_RESOLVING':
      return { ...state, state: 'resolving' };
    
    case 'RESOLUTION_KNOWN':
      return { ...state, state: 'known', items: action.items };
    
    case 'RESOLUTION_UNKNOWN':
      return { ...state, state: 'unknown', items: [] };
    
    case 'RESOLUTION_CONFLICT':
      return { ...state, state: 'conflict', items: action.items };
    
    case 'RESOLUTION_TIMEOUT':
      return { ...state, state: 'timeout' };
    
    case 'RESET':
      return {
        state: 'idle',
        barcode: null,
        items: [],
        lastScanTime: state.lastScanTime
      };
    
    default:
      return state;
  }
}

export default function ScannerScreen({ navigation }: ScannerScreenProps) {
  const [scanMode, setScanMode] = useState<ScanMode>('cigar');
  const [pendingScan, setPendingScan] = useState<PendingScan | null>(null);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [sessionStats, setSessionStats] = useState({ added: 0, failed: 0 });
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showPermissionSheet, setShowPermissionSheet] = useState(false);
  const [showUnknownBarcodeSheet, setShowUnknownBarcodeSheet] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, number>>(new Map());
  const [returnedFromAdd, setReturnedFromAdd] = useState(false);
  
  // Audio refs
  const soundRef = useRef<Audio.Sound | null>(null);
  
  // Network listener ref
  const networkUnsubscribeRef = useRef<(() => void) | null>(null);
  
  // State machine
  const [scannerState, dispatch] = useReducer(scannerReducer, {
    state: 'idle',
    barcode: null,
    items: [],
    lastScanTime: 0,
  });
  
  // Timeout ref
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      // Check debounce
      const now = Date.now();
      if (scannerState.barcode === code &&
          now - scannerState.lastScanTime < REPEAT_LOCK_MS) {
        return; // Ignore repeated scan within debounce period
      }
      
      if (scannerState.state === 'idle' || scannerState.state === 'detecting') {
        dispatch({ type: 'BARCODE_FOUND', barcode: code });
      }
    },
    scanDelay: 0, // We handle debounce in state machine
  });

  // Load beep sound
  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' },
          { shouldPlay: false, volume: 0.5 }
        );
        soundRef.current = sound;
      } catch (error) {
        console.log('Failed to load sound:', error);
      }
    };
    
    loadSound();
    
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Set up network listener for queue processing
  useEffect(() => {
    networkUnsubscribeRef.current = subscribeToNetworkChanges(
      async () => {
        console.log('Network came online, processing offline queue');
        await processOfflineQueue();
      },
      () => {
        console.log('Network went offline');
      }
    );

    return () => {
      if (networkUnsubscribeRef.current) {
        networkUnsubscribeRef.current();
      }
    };
  }, []);

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

  // Handle navigation focus to reset state when returning from add screens
  useFocusEffect(
    useCallback(() => {
      // Check if we're returning from an add screen with unknown barcode
      if (scannerState.state === 'unknown' && showUnknownBarcodeSheet === false && !returnedFromAdd) {
        // Show success feedback
        setReturnedFromAdd(true);
        hapticFeedback.success();
        Alert.alert(
          'Item Added',
          'Successfully added new item to your collection',
          [
            {
              text: 'OK',
              onPress: () => {
                setReturnedFromAdd(false);
                dispatch({ type: 'RESET' });
                resumeScanning();
              },
            },
          ]
        );
      }
    }, [scannerState.state, showUnknownBarcodeSheet, resumeScanning, returnedFromAdd])
  );

  // Update session stats
  useEffect(() => {
    if (session) {
      setSessionStats({
        added: session.items_added,
        failed: session.items_failed,
      });
    }
  }, [session]);

  // Handle state machine transitions
  useEffect(() => {
    const handleStateTransition = async () => {
      switch (scannerState.state) {
        case 'found':
          // Haptic feedback and sound
          hapticFeedback.medium();
          if (soundRef.current) {
            soundRef.current.replayAsync().catch(() => {});
          }
          
          // Pause scanning and start resolving
          pauseScanning();
          dispatch({ type: 'START_RESOLVING' });
          
          // Set timeout
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            dispatch({ type: 'RESOLUTION_TIMEOUT' });
            hapticFeedback.error();
          }, RESOLVE_TIMEOUT_MS);
          
          try {
            // Find items by barcode
            const items = await findItemByBarcode(scannerState.barcode!);
            
            // Clear timeout if successful
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            
            // Filter by scan mode
            const matchedItems = items.filter((item: any) => item.kind === scanMode);
            
            if (matchedItems.length === 0) {
              dispatch({ type: 'RESOLUTION_UNKNOWN' });
            } else if (matchedItems.length === 1) {
              dispatch({ type: 'RESOLUTION_KNOWN', items: matchedItems });
            } else {
              dispatch({ type: 'RESOLUTION_CONFLICT', items: matchedItems });
            }
          } catch (error) {
            console.error('Error finding barcode:', error);
            dispatch({ type: 'RESOLUTION_TIMEOUT' });
          }
          break;
          
        case 'known':
          // Check if already scanned in session
          if (isBarcodeScanned(scannerState.barcode!)) {
            Alert.alert(
              'Already Scanned',
              'This item has already been scanned in this session.',
              [{
                text: 'OK',
                onPress: () => {
                  dispatch({ type: 'RESET' });
                  resumeScanning();
                }
              }]
            );
          } else {
            // Show quantity modal for known item
            setPendingScan({
              barcode: scannerState.barcode!,
              mode: scanMode
            });
            
            // Set the selected item with the data from barcode API
            const inventoryItem = scannerState.items[0];
            setSelectedItem(inventoryItem);
            setShowQuantityModal(true);
          }
          break;
          
        case 'unknown':
          // Show bottom sheet for unknown barcode
          setShowUnknownBarcodeSheet(true);
          break;
          
        case 'conflict':
          // Multiple items found - for now treat as unknown
          hapticFeedback.warning();
          Alert.alert(
            'Multiple Items Found',
            'This barcode matches multiple items. Please select the correct one.',
            [
              {
                text: 'OK',
                onPress: () => {
                  dispatch({ type: 'RESET' });
                  resumeScanning();
                },
              },
            ]
          );
          break;
          
        case 'timeout':
          hapticFeedback.error();
          Alert.alert(
            'Timeout',
            'Barcode lookup timed out. Please try again.',
            [
              {
                text: 'OK',
                onPress: () => {
                  dispatch({ type: 'RESET' });
                  resumeScanning();
                },
              },
            ]
          );
          break;
          
        case 'idle':
          // Start detecting when idle
          if (isScannerActive && !showQuantityModal) {
            dispatch({ type: 'START_DETECTING' });
          }
          break;
      }
    };
    
    handleStateTransition();
  }, [
    scannerState.state,
    scannerState.barcode,
    scanMode,
    isBarcodeScanned,
    pauseScanning,
    resumeScanning,
    navigation,
    isScannerActive,
    showQuantityModal
  ]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
const handleQuantityAdd = useCallback(
  async (quantity: number) => {
    if (!selectedItem) return;

    setShowQuantityModal(false);

    try {
      // Check network status
      const isOnline = await isNetworkAvailable();
      
      if (isOnline) {
        // Online: call API directly
        await incrementQuantity(selectedItem.id, quantity);
      } else {
        // Offline: update local state optimistically and enqueue job
        const currentOptimistic = optimisticUpdates.get(selectedItem.id) || 0;
        setOptimisticUpdates(new Map(optimisticUpdates.set(selectedItem.id, currentOptimistic + quantity)));
        
        // Enqueue the increment job
        await enqueue({
          type: 'increment',
          itemId: selectedItem.id,
          by: quantity,
          timestamp: Date.now(),
        });
        
        // Show offline toast
        if (Platform.OS === 'android') {
          ToastAndroid.show('Added offline, will sync when connected', ToastAndroid.SHORT);
        }
      }
      
      // Add to scan session
      if (pendingScan) {
        await addScanEvent({
          barcode: pendingScan.barcode,
          quantity,
          kind: pendingScan.mode,
        });
      }

      // Show success feedback
      hapticFeedback.success();
      const message = isOnline
        ? `Successfully added ${quantity} ${selectedItem.kind}${quantity > 1 ? 's' : ''}`
        : `Added ${quantity} ${selectedItem.kind}${quantity > 1 ? 's' : ''} (offline)`;
        
      Alert.alert(
        'Added to Inventory',
        message,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset state and continue scanning
              setPendingScan(null);
              setSelectedItem(null);
              dispatch({ type: 'RESET' });
              resumeScanning();
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
              setSelectedItem(null);
              dispatch({ type: 'RESET' });
              resumeScanning();
            },
          },
        ]
      );
    }
  },
  [selectedItem, pendingScan, addScanEvent, resumeScanning, optimisticUpdates]
);

  const handleQuantityCancel = useCallback(() => {
    setShowQuantityModal(false);
    setPendingScan(null);
    setSelectedItem(null);
    dispatch({ type: 'RESET' });
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

  const handleOpenSettings = () => {
    setShowPermissionSheet(false);
    Linking.openSettings();
  };

  const handleAddManually = (kind: 'cigar' | 'bottle') => {
    setShowPermissionSheet(false);
    setShowUnknownBarcodeSheet(false);
    
    const barcode = scannerState.barcode || undefined;
    
    if (kind === 'cigar') {
      if (scanMode === 'cigar') {
        navigation.navigate('AddCigar', {
          fromScanner: true,
          barcode,
        });
      } else {
        navigation.getParent()?.navigate('Cigars', {
          screen: 'AddCigar',
          params: {
            fromScanner: true,
            barcode,
          },
        });
      }
    } else {
      navigation.getParent()?.navigate('Bottles', {
        screen: 'AddBottle',
        params: {
          fromScanner: true,
          barcode,
        },
      });
    }
    
    // Don't reset here - wait for return
  };

  const handleCancelUnknownBarcode = () => {
    setShowUnknownBarcodeSheet(false);
    dispatch({ type: 'RESET' });
    resumeScanning();
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
          
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => setShowPermissionSheet(true)}
          >
            <Text style={styles.permissionButtonText}>Grant Access</Text>
          </TouchableOpacity>
        </View>

        {/* Permission Bottom Sheet */}
        <Modal
          visible={showPermissionSheet}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPermissionSheet(false)}
        >
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setShowPermissionSheet(false)}
          />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Camera Access Required</Text>
              <TouchableOpacity
                onPress={() => setShowPermissionSheet(false)}
                style={styles.sheetCloseButton}
              >
                <Ionicons name="close" size={24} color="#F3E9DC" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.sheetContent}>
              <TouchableOpacity
                style={styles.sheetOption}
                onPress={handleOpenSettings}
              >
                <Ionicons name="settings-outline" size={24} color="#C6A664" />
                <View style={styles.sheetOptionText}>
                  <Text style={styles.sheetOptionTitle}>Grant camera access</Text>
                  <Text style={styles.sheetOptionSubtitle}>Open device settings</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetOption}
                onPress={() => handleAddManually('cigar')}
              >
                <Ionicons name="flame-outline" size={24} color="#C6A664" />
                <View style={styles.sheetOptionText}>
                  <Text style={styles.sheetOptionTitle}>Add cigar manually</Text>
                  <Text style={styles.sheetOptionSubtitle}>Enter details without scanning</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetOption}
                onPress={() => handleAddManually('bottle')}
              >
                <Ionicons name="wine-outline" size={24} color="#C6A664" />
                <View style={styles.sheetOptionText}>
                  <Text style={styles.sheetOptionTitle}>Add bottle manually</Text>
                  <Text style={styles.sheetOptionSubtitle}>Enter details without scanning</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetOption, styles.sheetOptionDisabled]}
                disabled
              >
                <Ionicons name="image-outline" size={24} color="#666" />
                <View style={styles.sheetOptionText}>
                  <Text style={[styles.sheetOptionTitle, styles.sheetOptionTextDisabled]}>
                    Pick photo from library
                  </Text>
                  <Text style={[styles.sheetOptionSubtitle, styles.sheetOptionTextDisabled]}>
                    Coming soon
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
        isActive={isScannerActive && scannerState.state !== 'resolving'}
        codeScanner={codeScanner}
        enableZoomGesture
        torch={torchOn ? 'on' : 'off'}
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
            {sessionStats.added} Scanned
          </Text>
          {sessionStats.failed > 0 && (
            <Text style={styles.sessionFailedText}>
              {sessionStats.failed} Failed
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.headerButton, torchOn && styles.torchButtonActive]}
          onPress={() => setTorchOn(!torchOn)}
        >
          <Ionicons
            name={torchOn ? "flash" : "flash-off"}
            size={24}
            color={torchOn ? "#C6A664" : "#F3E9DC"}
          />
        </TouchableOpacity>
      </View>

      {/* Scan Frame */}
      <View style={styles.scanFrame}>
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
        
        {/* Visual feedback overlay */}
        {scannerState.state === 'resolving' && (
          <View style={styles.resolvingOverlay}>
            <ActivityIndicator size="large" color="#C6A664" />
            <Text style={styles.resolvingText}>Hold still...</Text>
          </View>
        )}
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

        {(isAddingEvent || scannerState.state === 'resolving') && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color="#C6A664" />
            <Text style={styles.processingText}>
              {scannerState.state === 'resolving' ? 'Looking up barcode...' : 'Processing...'}
            </Text>
          </View>
        )}
      </View>

      {/* Quantity Modal */}
      <QuantityModal
        visible={showQuantityModal}
        item={selectedItem}
        optimisticQuantity={selectedItem ? (optimisticUpdates.get(selectedItem.id) || 0) : 0}
        onAdd={handleQuantityAdd}
        onCancel={handleQuantityCancel}
      />

      {/* Unknown Barcode Bottom Sheet */}
      <Modal
        visible={showUnknownBarcodeSheet}
        transparent
        animationType="slide"
        onRequestClose={handleCancelUnknownBarcode}
      >
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={handleCancelUnknownBarcode}
        />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Unknown Barcode</Text>
            <TouchableOpacity
              onPress={handleCancelUnknownBarcode}
              style={styles.sheetCloseButton}
            >
              <Ionicons name="close" size={24} color="#F3E9DC" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.sheetContent}>
            <Text style={styles.unknownBarcodeText}>
              This barcode was not found in our database.
            </Text>
            <Text style={styles.unknownBarcodeSubtext}>
              Would you like to add it as a new item?
            </Text>

            <TouchableOpacity
              style={[styles.sheetButton, styles.sheetButtonPrimary]}
              onPress={() => handleAddManually('cigar')}
            >
              <Ionicons name="flame" size={20} color="#1C1C1C" />
              <Text style={styles.sheetButtonPrimaryText}>Add as Cigar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetButton, styles.sheetButtonPrimary]}
              onPress={() => handleAddManually('bottle')}
            >
              <Ionicons name="wine" size={20} color="#1C1C1C" />
              <Text style={styles.sheetButtonPrimaryText}>Add as Bottle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetButton, styles.sheetButtonSecondary]}
              onPress={handleCancelUnknownBarcode}
            >
              <Text style={styles.sheetButtonSecondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  torchButtonActive: {
    backgroundColor: 'rgba(198, 166, 100, 0.2)',
    borderRadius: 22,
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
  permissionButton: {
    marginTop: 24,
    backgroundColor: '#C6A664',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '600',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  bottomSheet: {
    backgroundColor: '#1C1C1C',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F3E9DC',
  },
  sheetCloseButton: {
    padding: 4,
  },
  sheetContent: {
    padding: 20,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    marginBottom: 12,
  },
  sheetOptionDisabled: {
    opacity: 0.5,
  },
  sheetOptionText: {
    marginLeft: 16,
    flex: 1,
  },
  sheetOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F3E9DC',
    marginBottom: 2,
  },
  sheetOptionSubtitle: {
    fontSize: 14,
    color: '#F3E9DC',
    opacity: 0.7,
  },
  sheetOptionTextDisabled: {
    color: '#666',
  },
  unknownBarcodeText: {
    fontSize: 16,
    color: '#F3E9DC',
    textAlign: 'center',
    marginBottom: 8,
  },
  unknownBarcodeSubtext: {
    fontSize: 14,
    color: '#F3E9DC',
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 24,
  },
  sheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  sheetButtonPrimary: {
    backgroundColor: '#C6A664',
  },
  sheetButtonPrimaryText: {
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '600',
  },
  sheetButtonSecondary: {
    backgroundColor: '#2C2C2C',
  },
  sheetButtonSecondaryText: {
    color: '#F3E9DC',
    fontSize: 16,
    fontWeight: '500',
  },
  resolvingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  resolvingText: {
    color: '#F3E9DC',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
});