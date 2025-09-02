import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { isNetworkAvailable, subscribeToNetworkChanges } from '../utils/offline';

interface AddItemFormProps {
  children: React.ReactNode;
  onSave: (photoUri?: string) => Promise<void>;
  onCancel: () => void;
  saveDisabled?: boolean;
}

export const AddItemForm: React.FC<AddItemFormProps> = ({
  children,
  onSave,
  onCancel,
  saveDisabled = false,
}) => {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check initial network status
    const checkNetwork = async () => {
      const online = await isNetworkAvailable();
      setIsOnline(online);
    };
    checkNetwork();

    // Subscribe to network changes
    const unsubscribe = subscribeToNetworkChanges(
      () => setIsOnline(true),
      () => setIsOnline(false)
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to add photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your camera to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const showPhotoOptions = () => {
    if (!isOnline) {
      Alert.alert(
        'Offline Mode',
        'Photos can be added, but will be uploaded when your connection is restored.',
        [
          { text: 'Camera', onPress: takePhoto },
          { text: 'Photo Library', onPress: pickImage },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true }
      );
    } else {
      Alert.alert(
        'Add Photo',
        'Choose a photo source',
        [
          { text: 'Camera', onPress: takePhoto },
          { text: 'Photo Library', onPress: pickImage },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true }
      );
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(photoUri || undefined);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      {/* Network Status Indicator */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color="#fff" />
          <Text style={styles.offlineText}>Offline Mode - Changes will sync when connected</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo Section */}
        <View style={styles.photoSection}>
          <View style={styles.photoHeader}>
            <Text style={styles.sectionTitle}>Photo</Text>
            {!isOnline && (
              <View style={styles.offlineIndicator}>
                <Ionicons name="cloud-offline-outline" size={16} color="#C6A664" />
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.photoContainer}
            onPress={showPhotoOptions}
            activeOpacity={0.8}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={48} color="#666" />
                <Text style={styles.photoPlaceholderText}>Add Photo</Text>
                {!isOnline && (
                  <Text style={styles.offlinePhotoText}>Will upload when online</Text>
                )}
              </View>
            )}
          </TouchableOpacity>
          {photoUri && (
            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={() => setPhotoUri(null)}
            >
              <Text style={styles.removePhotoText}>Remove Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Form Fields */}
        {children}
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.button,
            styles.saveButton,
            (saveDisabled || loading) && styles.disabledButton
          ]}
          onPress={handleSave}
          disabled={saveDisabled || loading}
        >
          {loading ? (
            <ActivityIndicator color="#1C1C1C" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

// Form Input Components
interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  multiline?: boolean;
  required?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  required = false,
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>
      {label}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
    <TextInput
      style={[styles.input, multiline && styles.textArea]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#666"
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      returnKeyType={multiline ? 'default' : 'done'}
      blurOnSubmit={!multiline}
    />
  </View>
);

interface FormPickerProps {
  label: string;
  value: string;
  onPress: () => void;
  placeholder?: string;
}

export const FormPicker: React.FC<FormPickerProps> = ({
  label,
  value,
  onPress,
  placeholder = 'Select...',
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity style={styles.pickerButton} onPress={onPress}>
      <Text style={[styles.pickerText, !value && styles.placeholderText]}>
        {value || placeholder}
      </Text>
      <Ionicons name="chevron-down" size={20} color="#666" />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  offlineBanner: {
    backgroundColor: '#5A3E2B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  photoSection: {
    marginBottom: 24,
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#5A3E2B',
    borderStyle: 'dashed',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    color: '#666',
    marginTop: 8,
    fontSize: 16,
  },
  offlinePhotoText: {
    color: '#C6A664',
    marginTop: 4,
    fontSize: 12,
  },
  removePhotoButton: {
    marginTop: 8,
    alignSelf: 'center',
  },
  removePhotoText: {
    color: '#C6A664',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
  },
  required: {
    color: '#C6A664',
  },
  input: {
    backgroundColor: '#1C1C1C',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerButton: {
    backgroundColor: '#1C1C1C',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  pickerText: {
    fontSize: 16,
    color: '#fff',
  },
  placeholderText: {
    color: '#666',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#1C1C1C',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#C6A664',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '600',
  },
});