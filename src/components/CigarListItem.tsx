import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { Cigar } from '../types/database';

interface CigarListItemProps {
  cigar: Cigar;
  onPress?: (cigar: Cigar) => void;
}

const CigarListItem: React.FC<CigarListItemProps> = ({ cigar, onPress }) => {
  const formatSize = () => {
    if (cigar.size_ring_gauge && cigar.size_length_in) {
      return `${cigar.size_ring_gauge} × ${cigar.size_length_in}"`;
    }
    return null;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={() => onPress?.(cigar)}
      disabled={!onPress}
    >
      {/* Gold divider line at top */}
      <View style={styles.topDivider} />
      
      <View style={styles.content}>
        {/* Main cigar band area */}
        <View style={styles.bandArea}>
          {/* Brand - prominent display */}
          <Text style={styles.brand} numberOfLines={1}>
            {cigar.brand}
          </Text>
          
          {/* Line - secondary display */}
          {cigar.line && (
            <Text style={styles.line} numberOfLines={1}>
              {cigar.line}
            </Text>
          )}
        </View>
        
        {/* Details section */}
        <View style={styles.details}>
          {/* Vitola */}
          {cigar.vitola && (
            <Text style={styles.vitola} numberOfLines={1}>
              {cigar.vitola}
            </Text>
          )}
          
          {/* Size and Strength */}
          <View style={styles.specs}>
            {formatSize() && (
              <Text style={styles.size}>{formatSize()}</Text>
            )}
            {cigar.strength && (
              <View style={styles.strengthBadge}>
                <Text style={styles.strengthText}>
                  {cigar.strength.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Notes preview if available */}
        {cigar.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            {cigar.notes}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1C', // Deep Charcoal
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  topDivider: {
    height: 3,
    backgroundColor: '#C6A664', // Gold
  },
  content: {
    padding: 16,
  },
  bandArea: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#5A3E2B', // Oak Brown
  },
  brand: {
    fontSize: 24,
    fontWeight: '700',
    color: '#C6A664', // Gold
    letterSpacing: 0.5,
    // Serif-like font styling
    fontFamily: 'serif',
  },
  line: {
    fontSize: 18,
    fontWeight: '500',
    color: '#F3E9DC', // Warm Cream
    marginTop: 4,
    fontFamily: 'serif',
  },
  details: {
    marginBottom: 8,
  },
  vitola: {
    fontSize: 16,
    color: '#F3E9DC', // Warm Cream
    fontWeight: '500',
    marginBottom: 6,
  },
  specs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  size: {
    fontSize: 14,
    color: '#C6A664', // Gold
    fontWeight: '500',
  },
  strengthBadge: {
    backgroundColor: '#5A3E2B', // Oak Brown
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C6A664', // Gold
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C6A664', // Gold
    letterSpacing: 0.5,
  },
  notes: {
    fontSize: 14,
    color: '#F3E9DC', // Warm Cream
    opacity: 0.8,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default CigarListItem;