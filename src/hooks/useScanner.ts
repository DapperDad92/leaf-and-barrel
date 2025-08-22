import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
  Code,
} from 'react-native-vision-camera';
import { Vibration } from 'react-native';

interface UseScannerOptions {
  onCodeScanned?: (code: string, type: string) => void;
  scanDelay?: number; // Delay in ms before allowing another scan
  vibrate?: boolean;
}

export function useScanner({
  onCodeScanned,
  scanDelay = 1000,
  vibrate = true,
}: UseScannerOptions = {}) {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [isActive, setIsActive] = useState(true);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const lastScanTime = useRef<number>(0);
  const cameraRef = useRef<Camera>(null);

  // Request permission on mount
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // Handle code scanning
  const handleCodeScanned = useCallback(
    (codes: Code[]) => {
      if (!isActive || codes.length === 0) return;

      const code = codes[0];
      const now = Date.now();

      // Check if we should process this scan
      if (
        code.value &&
        code.value !== lastScannedCode &&
        now - lastScanTime.current > scanDelay
      ) {
        // Update scan tracking
        lastScanTime.current = now;
        setLastScannedCode(code.value);

        // Vibrate if enabled
        if (vibrate) {
          Vibration.vibrate(100);
        }

        // Call the callback
        onCodeScanned?.(code.value, code.type || 'unknown');
      }
    },
    [isActive, lastScannedCode, scanDelay, vibrate, onCodeScanned]
  );

  const codeScanner = useCodeScanner({
    codeTypes: [
      'qr',
      'ean-13',
      'ean-8',
      'upc-a',
      'upc-e',
      'code-39',
      'code-93',
      'code-128',
      'itf',
      'aztec',
      'data-matrix',
      'pdf-417',
    ],
    onCodeScanned: handleCodeScanned,
  });

  // Pause scanning
  const pauseScanning = useCallback(() => {
    setIsActive(false);
  }, []);

  // Resume scanning
  const resumeScanning = useCallback(() => {
    setIsActive(true);
    setLastScannedCode(null);
    lastScanTime.current = 0;
  }, []);

  // Reset scanner state
  const resetScanner = useCallback(() => {
    setLastScannedCode(null);
    lastScanTime.current = 0;
  }, []);

  // Take a photo (for manual entry)
  const takePhoto = useCallback(async () => {
    if (!cameraRef.current) return null;

    try {
      const photo = await cameraRef.current.takePhoto();
      return photo;
    } catch (error) {
      console.error('Failed to take photo:', error);
      return null;
    }
  }, []);

  return {
    // Camera state
    device,
    hasPermission,
    isActive,
    lastScannedCode,
    cameraRef,

    // Scanner configuration
    codeScanner,

    // Actions
    pauseScanning,
    resumeScanning,
    resetScanner,
    takePhoto,
    requestPermission,
  };
}