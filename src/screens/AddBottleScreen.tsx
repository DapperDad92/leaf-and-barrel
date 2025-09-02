import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActionSheetIOS, Platform } from 'react-native';
import { AddBottleScreenProps } from '../navigation/types';
import { AddItemForm, FormInput, FormPicker } from '../components/AddItemForm';
import { createBottle, updateBottlePhoto } from '../api/bottles';
import { createInventoryItem } from '../api/inventory';
import { uploadPhoto } from '../api/storage';
import Toast from 'react-native-toast-message';
import { isNetworkAvailable, queuePhotoUpload, retryPendingUploads } from '../utils/offline';
import { useQueryClient } from '@tanstack/react-query';

const BOTTLE_TYPES = [
  'bourbon',
  'rye',
  'scotch',
  'irish',
  'rum',
  'tequila',
  'mezcal',
  'other',
] as const;

export const AddBottleScreen: React.FC<AddBottleScreenProps> = ({ navigation, route }) => {
  const { fromScanner, barcode } = route.params || {};
  const queryClient = useQueryClient();
  
  // Form state
  const [brand, setBrand] = useState('');
  const [expression, setExpression] = useState('');
  const [type, setType] = useState<typeof BOTTLE_TYPES[number] | ''>('');
  const [proof, setProof] = useState('');
  const [age, setAge] = useState('');
  const [notes, setNotes] = useState('');

  // Check for pending uploads on mount
  useEffect(() => {
    const checkPendingUploads = async () => {
      const isOnline = await isNetworkAvailable();
      if (isOnline) {
        const uploadFunction = async (itemId: string, itemType: 'cigar' | 'bottle', photoUri: string) => {
          if (itemType === 'bottle') {
            const photoUrl = await uploadPhoto(photoUri, 'bottles', itemId);
            await updateBottlePhoto(itemId, photoUrl);
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

  const handleSave = async (photoUri?: string) => {
    try {
      // Check network status
      const isOnline = await isNetworkAvailable();
      
      // Create the bottle data
      const proofValue = proof ? parseFloat(proof) : null;
      const bottleData = {
        brand,
        expression: expression || null,
        type: (type || null) as typeof BOTTLE_TYPES[number] | null,
        proof: proofValue,
        abv: proofValue ? proofValue / 2 : null, // ABV = Proof / 2
        age_years: age ? parseInt(age, 10) : null,
        photo_url: null,
        notes: notes || null,
      };

      // Optimistic UI: Show success immediately
      Toast.show({
        type: 'success',
        text1: 'Bottle Added',
        text2: `${brand}${expression ? ' ' + expression : ''} has been added to your collection`,
        position: 'bottom',
      });

      // Navigate immediately for better UX
      if (fromScanner) {
        navigation.goBack();
      } else {
        navigation.navigate('BottlesList');
      }

      // Create the bottle
      const bottle = await createBottle(bottleData);

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['bottles'] });

      // Handle photo upload
      if (photoUri) {
        if (isOnline) {
          try {
            const photoUrl = await uploadPhoto(photoUri, 'bottles', bottle.id);
            await updateBottlePhoto(bottle.id, photoUrl);
            queryClient.invalidateQueries({ queryKey: ['bottles'] });
          } catch (error) {
            console.error('Failed to upload photo:', error);
            // Queue for later retry
            await queuePhotoUpload(bottle.id, 'bottle', photoUri);
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
          await queuePhotoUpload(bottle.id, 'bottle', photoUri);
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
            kind: 'bottle',
            ref_id: bottle.id,
            quantity: 1,
            barcode,
          });
        } catch (error) {
          console.error('Failed to create inventory item:', error);
          // Non-critical error, don't show to user
        }
      }
    } catch (error) {
      console.error('Failed to save bottle:', error);
      
      // More user-friendly error messages
      let errorMessage = 'Unable to save bottle. ';
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

  const showTypePicker = () => {
    if (Platform.OS === 'ios') {
      const options = ['Cancel', ...BOTTLE_TYPES.map(t => t.charAt(0).toUpperCase() + t.slice(1)), 'Clear'];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          destructiveButtonIndex: options.length - 1,
        },
        (buttonIndex) => {
          if (buttonIndex > 0 && buttonIndex < options.length - 1) {
            setType(BOTTLE_TYPES[buttonIndex - 1]);
          } else if (buttonIndex === options.length - 1) {
            setType('');
          }
        }
      );
    } else {
      // For Android, you would typically use a modal picker
      Alert.alert(
        'Select Type',
        '',
        [
          ...BOTTLE_TYPES.map(option => ({
            text: option.charAt(0).toUpperCase() + option.slice(1),
            onPress: () => setType(option),
          })),
          { text: 'Clear', onPress: () => setType('') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleProofChange = (text: string) => {
    // Allow only numbers and decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      setProof(parts[0] + '.' + parts.slice(1).join(''));
    } else {
      setProof(cleaned);
    }
  };

  const handleAgeChange = (text: string) => {
    // Allow only numbers
    const cleaned = text.replace(/[^0-9]/g, '');
    setAge(cleaned);
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
          label="Expression"
          value={expression}
          onChangeText={setExpression}
          placeholder="e.g., Single Barrel, 12 Year"
        />
        
        <FormPicker
          label="Type"
          value={type ? type.charAt(0).toUpperCase() + type.slice(1) : ''}
          onPress={showTypePicker}
          placeholder="Select type"
        />
        
        <FormInput
          label="Proof"
          value={proof}
          onChangeText={handleProofChange}
          placeholder="e.g., 90"
          keyboardType="decimal-pad"
        />
        
        <FormInput
          label="Age (Years)"
          value={age}
          onChangeText={handleAgeChange}
          placeholder="e.g., 12"
          keyboardType="numeric"
        />
        
        <FormInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any notes..."
          multiline
        />
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