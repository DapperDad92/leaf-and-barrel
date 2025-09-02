import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuantityModalProps {
  visible: boolean;
  item: {
    id: string;
    kind: 'cigar' | 'bottle';
    ref_id: string;
    quantity: number;
    brand?: string;
    type?: string;
    line?: string;
    expression?: string;
  } | null;
  optimisticQuantity?: number;
  onAdd: (quantity: number) => void;
  onCancel: () => void;
}

export default function QuantityModal({
  visible,
  item,
  optimisticQuantity = 0,
  onAdd,
  onCancel,
}: QuantityModalProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customQuantity, setCustomQuantity] = useState('1');

  const handleAddOne = () => {
    onAdd(1);
    resetState();
  };

  const handleCustomAdd = () => {
    const qty = parseInt(customQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a positive number');
      return;
    }
    onAdd(qty);
    resetState();
  };

  const handleCancel = () => {
    resetState();
    onCancel();
  };

  const resetState = () => {
    setShowCustomInput(false);
    setCustomQuantity('1');
  };

  if (!item) return null;

  const itemName = item.kind === 'cigar' 
    ? `${item.brand || 'Unknown'} ${item.line || ''}`.trim()
    : `${item.brand || 'Unknown'} ${item.expression || ''}`.trim();

  const itemType = item.kind === 'cigar' ? 'Cigar' : 'Bottle';
  
  // Calculate display quantity including optimistic updates
  const displayQuantity = item.quantity + optimisticQuantity;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleCancel}
        />
        
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Item Found</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#F3E9DC" />
            </TouchableOpacity>
          </View>

          {/* Item Details */}
          <View style={styles.itemDetails}>
            <Ionicons
              name={item.kind === 'cigar' ? 'flame' : 'wine'}
              size={48}
              color="#C6A664"
            />
            <Text style={styles.itemName}>{itemName}</Text>
            <Text style={styles.itemType}>{itemType}</Text>
            <Text style={styles.currentQuantity}>
              Current Quantity: {displayQuantity}
              {optimisticQuantity > 0 && (
                <Text style={styles.optimisticIndicator}> (+{optimisticQuantity} pending)</Text>
              )}
            </Text>
          </View>

          {/* Action Buttons */}
          {!showCustomInput ? (
            <View style={styles.buttonContainer}>
              {/* Primary Button - Add 1 */}
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleAddOne}
              >
                <Text style={styles.primaryButtonText}>Add 1</Text>
              </TouchableOpacity>

              {/* Secondary Button - Custom */}
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => setShowCustomInput(true)}
              >
                <Text style={styles.secondaryButtonText}>Custom...</Text>
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.customInputContainer}>
              <Text style={styles.customInputLabel}>Enter Quantity</Text>
              
              <View style={styles.inputRow}>
                <TouchableOpacity
                  onPress={() => {
                    const current = parseInt(customQuantity, 10) || 0;
                    if (current > 1) {
                      setCustomQuantity(String(current - 1));
                    }
                  }}
                  style={styles.stepperButton}
                >
                  <Ionicons name="remove" size={24} color="#F3E9DC" />
                </TouchableOpacity>

                <TextInput
                  style={styles.quantityInput}
                  value={customQuantity}
                  onChangeText={(text) => {
                    const num = text.replace(/[^0-9]/g, '');
                    setCustomQuantity(num || '0');
                  }}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  autoFocus
                />

                <TouchableOpacity
                  onPress={() => {
                    const current = parseInt(customQuantity, 10) || 0;
                    setCustomQuantity(String(current + 1));
                  }}
                  style={styles.stepperButton}
                >
                  <Ionicons name="add" size={24} color="#F3E9DC" />
                </TouchableOpacity>
              </View>

              <View style={styles.customButtonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setShowCustomInput(false);
                    setCustomQuantity('1');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleCustomAdd}
                >
                  <Text style={styles.primaryButtonText}>
                    Add {customQuantity}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  content: {
    backgroundColor: '#1C1C1C',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F3E9DC',
  },
  closeButton: {
    padding: 4,
  },
  itemDetails: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F3E9DC',
    marginTop: 12,
    textAlign: 'center',
  },
  itemType: {
    fontSize: 14,
    color: '#C6A664',
    marginTop: 4,
  },
  currentQuantity: {
    fontSize: 16,
    color: '#F3E9DC',
    marginTop: 12,
    opacity: 0.8,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#C6A664',
  },
  primaryButtonText: {
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#2C2C2C',
    borderWidth: 1,
    borderColor: '#C6A664',
  },
  secondaryButtonText: {
    color: '#C6A664',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#2C2C2C',
  },
  cancelButtonText: {
    color: '#F3E9DC',
    fontSize: 16,
    fontWeight: '500',
  },
  customInputContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  customInputLabel: {
    fontSize: 16,
    color: '#F3E9DC',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2C2C2C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityInput: {
    width: 80,
    height: 44,
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    color: '#F3E9DC',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  customButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optimisticIndicator: {
    color: '#C6A664',
    fontSize: 14,
    fontStyle: 'italic',
  },
});