import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActionSheetIOS, Platform, Button } from 'react-native';
import { AddCigarScreenProps } from '../navigation/types';
import { AddItemForm, FormInput, FormPicker } from '../components/AddItemForm';
import { createCigar, updateCigarPhoto } from '../api/cigars';
import { createInventoryItem } from '../api/inventory';
import { uploadPhoto } from '../api/storage';
import Toast from 'react-native-toast-message';
import { isNetworkAvailable, queuePhotoUpload, retryPendingUploads } from '../utils/offline';
import { useQueryClient } from '@tanstack/react-query';
import { debugSupabaseConnection } from '../lib/supabase';

const STRENGTH_OPTIONS = ['mild', 'medium', 'full'] as const;

export const AddCigarScreen: React.FC<AddCigarScreenProps> = ({ navigation, route }) => {
  const { fromScanner, barcode } = route.params || {};
  const queryClient = useQueryClient();
  
  // Form state
  const [brand, setBrand] = useState('');
  const [line, setLine] = useState('');
  const [vitola, setVitola] = useState('');
  const [size, setSize] = useState('');
  const [wrapper, setWrapper] = useState('');
  const [strength, setStrength] = useState<'mild' | 'medium' | 'full' | ''>('');
  const [notes, setNotes] = useState('');

  // Check for pending uploads on mount
  useEffect(() => {
    const checkPendingUploads = async () => {
      const isOnline = await isNetworkAvailable();
      if (isOnline) {
        const uploadFunction = async (itemId: string, itemType: 'cigar' | 'bottle', photoUri: string) => {
          if (itemType === 'cigar') {
            const photoUrl = await uploadPhoto(photoUri, 'cigars', itemId);
            await updateCigarPhoto(itemId, photoUrl);
          }
        };
        
        const results = await retryPendingUploads(uploadFunction);
        if (results.successful > 0) {
          Toast.show({
            type: 'success',
            text1: 'Photos Uploaded',
            text2: `${results.successful} pending photo(s) uploaded successfully`,
            position: 'bottom',
          });
        }
      }
    };

    checkPendingUploads();
  }, []);

  // Debug function
  const handleDebugConnection = async () => {
    console.log('[DEBUG] Running connection test...');
    const result = await debugSupabaseConnection();
    Alert.alert(
      'Connection Test Results',
      `Auth: ${result.authOk ? '✅' : '❌'}\n` +
      `SELECT: ${result.selectOk ? '✅' : '❌'}\n` +
      `INSERT: ${result.insertOk ? '✅' : '❌'}\n\n` +
      'Check console logs for details'
    );
  };

  const handleSave = async (photoUri?: string) => {
    try {
      // Check network status
      const isOnline = await isNetworkAvailable();
      
      // Create the cigar data
      const cigarData = {
        brand,
        line: line || null,
        vitola: vitola || null,
        size_ring_gauge: null,
        size_length_in: null,
        wrapper: wrapper || null,
        strength: (strength || null) as 'mild' | 'medium' | 'full' | null,
        photo_url: null,
        notes: notes || null,
      };

      // Optimistic UI: Show success immediately
      Toast.show({
        type: 'success',
        text1: 'Cigar Added',
        text2: `${brand} has been added to your collection`,
        position: 'bottom',
      });

      // Navigate immediately for better UX
      if (fromScanner) {
        navigation.goBack();
      } else {
        navigation.navigate('CigarsList');
      }

      // Create the cigar
      const cigar = await createCigar(cigarData);

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['cigars'] });

      // Handle photo upload
      if (photoUri) {
        if (isOnline) {
          try {
            const photoUrl = await uploadPhoto(photoUri, 'cigars', cigar.id);
            await updateCigarPhoto(cigar.id, photoUrl);
            queryClient.invalidateQueries({ queryKey: ['cigars'] });
          } catch (error) {
            console.error('Failed to upload photo:', error);
            // Queue for later retry
            await queuePhotoUpload(cigar.id, 'cigar', photoUri);
            Toast.show({
              type: 'info',
              text1: 'Photo Saved Locally',
              text2: 'Photo will be uploaded when connection is restored',
              position: 'bottom',
              visibilityTime: 3000,
            });
          }
        } else {
          // Queue photo for later upload
          await queuePhotoUpload(cigar.id, 'cigar', photoUri);
          Toast.show({
            type: 'info',
            text1: 'Offline Mode',
            text2: 'Photo will be uploaded when connection is restored',
            position: 'bottom',
            visibilityTime: 3000,
          });
        }
      }

      // Create inventory item with barcode if provided
      if (barcode) {
        try {
          await createInventoryItem({
            kind: 'cigar',
            ref_id: cigar.id,
            quantity: 1,
            barcode,
          });
        } catch (error) {
          console.error('Failed to create inventory item:', error);
          // Non-critical error, don't show to user
        }
      }
    } catch (error) {
      console.error('Failed to save cigar:', error);
      
      // More user-friendly error messages
      let errorMessage = 'Unable to save cigar. ';
      const isOnline = await isNetworkAvailable();
      
      if (!isOnline) {
        errorMessage += 'Please check your internet connection and try again.';
      } else {
        errorMessage += 'Please try again or contact support if the problem persists.';
      }
      
      Alert.alert(
        'Unable to Save',
        errorMessage,
        [{ text: 'OK' }]
      );
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const showStrengthPicker = () => {
    if (Platform.OS === 'ios') {
      const options = ['Cancel', ...STRENGTH_OPTIONS, 'Clear'];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          destructiveButtonIndex: options.length - 1,
        },
        (buttonIndex) => {
          if (buttonIndex > 0 && buttonIndex < options.length - 1) {
            setStrength(STRENGTH_OPTIONS[buttonIndex - 1]);
          } else if (buttonIndex === options.length - 1) {
            setStrength('');
          }
        }
      );
    } else {
      // For Android, you would typically use a modal picker
      Alert.alert(
        'Select Strength',
        '',
        [
          ...STRENGTH_OPTIONS.map(option => ({
            text: option.charAt(0).toUpperCase() + option.slice(1),
            onPress: () => setStrength(option),
          })),
          { text: 'Clear', onPress: () => setStrength('') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <AddItemForm
        onSave={handleSave}
        onCancel={handleCancel}
        saveDisabled={!brand.trim()}
      >
        <FormInput
          label="Brand"
          value={brand}
          onChangeText={setBrand}
          placeholder="Enter brand name"
          required
        />
        
        <FormInput
          label="Line"
          value={line}
          onChangeText={setLine}
          placeholder="Enter line name"
        />
        
        <FormInput
          label="Vitola"
          value={vitola}
          onChangeText={setVitola}
          placeholder="Enter vitola"
        />
        
        <FormInput
          label="Size"
          value={size}
          onChangeText={setSize}
          placeholder="e.g., 5 x 50"
        />
        
        <FormInput
          label="Wrapper"
          value={wrapper}
          onChangeText={setWrapper}
          placeholder="Enter wrapper type"
        />
        
        <FormPicker
          label="Strength"
          value={strength ? strength.charAt(0).toUpperCase() + strength.slice(1) : ''}
          onPress={showStrengthPicker}
          placeholder="Select strength"
        />
        
        <FormInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any notes..."
          multiline
        />
        
        {/* Debug button - temporary for testing */}
        <View style={{ marginTop: 20, marginHorizontal: 20 }}>
          <Button
            title="🔧 Test Supabase Connection"
            onPress={handleDebugConnection}
            color="#ff6b6b"
          />
        </View>
      </AddItemForm>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});