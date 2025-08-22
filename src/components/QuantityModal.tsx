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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuantityModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  itemType: 'cigar' | 'bottle';
  barcode: string;
}

export default function QuantityModal({
  visible,
  onClose,
  onConfirm,
  itemType,
  barcode,
}: QuantityModalProps) {
  const [quantity, setQuantity] = useState('1');

  const handleConfirm = () => {
    const qty = parseInt(quantity, 10);
    if (qty > 0) {
      onConfirm(qty);
      setQuantity('1'); // Reset for next scan
    }
  };

  const handleClose = () => {
    setQuantity('1'); // Reset on close
    onClose();
  };

  const incrementQuantity = () => {
    setQuantity((prev) => String(parseInt(prev, 10) + 1));
  };

  const decrementQuantity = () => {
    setQuantity((prev) => {
      const current = parseInt(prev, 10);
      return String(Math.max(1, current - 1));
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Add to Inventory</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#F3E9DC" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={styles.itemInfo}>
              <Ionicons
                name={itemType === 'cigar' ? 'flame-outline' : 'wine-outline'}
                size={40}
                color="#C6A664"
              />
              <Text style={styles.itemType}>
                {itemType === 'cigar' ? 'Cigar' : 'Bottle'}
              </Text>
            </View>

            <Text style={styles.barcodeText}>Barcode: {barcode}</Text>

            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Quantity</Text>
              
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  onPress={decrementQuantity}
                  style={styles.quantityButton}
                >
                  <Ionicons name="remove" size={24} color="#F3E9DC" />
                </TouchableOpacity>

                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={(text) => {
                    const num = text.replace(/[^0-9]/g, '');
                    if (num === '' || parseInt(num, 10) > 0) {
                      setQuantity(num || '1');
                    }
                  }}
                  keyboardType="number-pad"
                  selectTextOnFocus
                />

                <TouchableOpacity
                  onPress={incrementQuantity}
                  style={styles.quantityButton}
                >
                  <Ionicons name="add" size={24} color="#F3E9DC" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Add to Inventory</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: '#2C2C2C',
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
    borderBottomColor: '#3C3C3C',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F3E9DC',
  },
  closeButton: {
    padding: 4,
  },
  body: {
    padding: 20,
  },
  itemInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  itemType: {
    fontSize: 18,
    fontWeight: '500',
    color: '#F3E9DC',
    marginTop: 8,
  },
  barcodeText: {
    fontSize: 14,
    color: '#F3E9DC',
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  quantitySection: {
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 16,
    color: '#F3E9DC',
    marginBottom: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3C3C3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityInput: {
    width: 80,
    height: 44,
    backgroundColor: '#3C3C3C',
    borderRadius: 8,
    color: '#F3E9DC',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#3C3C3C',
  },
  cancelButtonText: {
    color: '#F3E9DC',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#C6A664',
  },
  confirmButtonText: {
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '600',
  },
});