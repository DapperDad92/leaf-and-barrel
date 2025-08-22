import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Bottle } from '../types/database';

interface BottleListItemProps {
  bottle: Bottle;
  onPress: (bottle: Bottle) => void;
}

export default function BottleListItem({ bottle, onPress }: BottleListItemProps) {
  const handlePress = () => {
    onPress(bottle);
  };

  const getTypeIcon = (type: string | null) => {
    switch (type) {
      case 'bourbon':
      case 'rye':
        return '🥃';
      case 'scotch':
      case 'irish':
        return '🥃';
      case 'rum':
        return '🍹';
      case 'tequila':
      case 'mezcal':
        return '🌵';
      default:
        return '🍾';
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {bottle.photo_url ? (
          <Image source={{ uri: bottle.photo_url }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.typeIcon}>{getTypeIcon(bottle.type)}</Text>
          </View>
        )}
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.brand} numberOfLines={1}>
            {bottle.brand}
          </Text>
          {bottle.age_years && (
            <View style={styles.ageBadge}>
              <Text style={styles.ageText}>{bottle.age_years}yr</Text>
            </View>
          )}
        </View>

        {bottle.expression && (
          <Text style={styles.expression} numberOfLines={1}>
            {bottle.expression}
          </Text>
        )}

        <View style={styles.detailsRow}>
          {bottle.type && (
            <View style={styles.detailItem}>
              <Text style={styles.detailText}>
                {bottle.type.charAt(0).toUpperCase() + bottle.type.slice(1)}
              </Text>
            </View>
          )}
          {bottle.proof && (
            <View style={styles.detailItem}>
              <Text style={styles.detailText}>{bottle.proof}°</Text>
            </View>
          )}
          {bottle.abv && (
            <View style={styles.detailItem}>
              <Text style={styles.detailText}>{bottle.abv}% ABV</Text>
            </View>
          )}
        </View>

        {bottle.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            {bottle.notes}
          </Text>
        )}
      </View>

      <View style={styles.chevronContainer}>
        <Ionicons name="chevron-forward" size={20} color="#C6A664" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imageContainer: {
    marginRight: 12,
  },
  image: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#3A3A3A',
  },
  placeholderImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 32,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  brand: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F3E9DC',
    flex: 1,
  },
  ageBadge: {
    backgroundColor: '#5A3E2B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  ageText: {
    fontSize: 12,
    color: '#C6A664',
    fontWeight: '600',
  },
  expression: {
    fontSize: 16,
    color: '#C6A664',
    marginBottom: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  detailItem: {
    marginRight: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#F3E9DC',
    opacity: 0.7,
  },
  notes: {
    fontSize: 14,
    color: '#F3E9DC',
    opacity: 0.6,
    fontStyle: 'italic',
    marginTop: 4,
  },
  chevronContainer: {
    marginLeft: 8,
  },
});