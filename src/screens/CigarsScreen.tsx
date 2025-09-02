import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { supabase } from '../api/supabase';
import CigarListItem from '../components/CigarListItem';
import FloatingActionButton from '../components/FloatingActionButton';
import { CigarsStackParamList } from '../navigation/types';
import { Cigar } from '../types/database';

// Extended type to include quantity from inventory_items
type CigarWithQuantity = Cigar & {
  quantity?: number;
};

type NavigationProp = NativeStackNavigationProp<CigarsStackParamList, 'CigarsList'>;

// Type guards
const isCigarsArray = (data: any): data is CigarWithQuantity[] => {
  return Array.isArray(data);
};

const isErrorResponse = (data: any): data is { error: { message: string } } => {
  return data && typeof data === 'object' && 'error' in data;
};

const CigarsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  // Handle cigar press
  const handleCigarPress = (cigar: CigarWithQuantity) => {
    // TODO: Navigate to cigar detail screen
    console.log('Cigar pressed:', cigar.id);
  };

  // Handle FAB press - TEMPORARILY navigate to Scanner for testing
  const handleFABPress = () => {
    // TEMPORARY: Navigate to Scanner instead of AddCigar for testing
    navigation.navigate('Scanner' as any);
    
    // Original code (commented out for testing):
    // navigation.navigate('AddCigar', {});
  };

  // Fetch cigars from Supabase with inventory quantities
  const { data: cigarsData, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['cigars'],
    queryFn: async () => {
      // First, get all cigars
      const { data: cigarsData, error: cigarsError } = await supabase
        .from('cigars')
        .select('*')
        .order('created_at', { ascending: false });

      if (cigarsError) {
        console.error('Error fetching cigars:', cigarsError);
        return { error: cigarsError };
      }

      if (!cigarsData || cigarsData.length === 0) {
        return [];
      }

      // Then, get inventory items for these cigars
      const cigarIds = cigarsData.map(cigar => cigar.id);
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('ref_id, quantity')
        .eq('kind', 'cigar')
        .in('ref_id', cigarIds);

      if (inventoryError) {
        console.error('Error fetching inventory:', inventoryError);
        // Continue without quantities if inventory fetch fails
      }

      // Create a map of cigar quantities
      const quantityMap = new Map<string, number>();
      if (inventoryData) {
        inventoryData.forEach(item => {
          quantityMap.set(item.ref_id, item.quantity);
        });
      }

      // Combine cigars with their quantities
      const cigarsWithQuantity: CigarWithQuantity[] = cigarsData.map(cigar => ({
        ...cigar,
        quantity: quantityMap.get(cigar.id) || 0
      }));

      return cigarsWithQuantity;
    },
  });

  // Render loading state
  if (isLoading && !isRefetching) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#C6A664" />
          <Text style={styles.loadingText}>Loading your collection...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (isError || (cigarsData && !isCigarsArray(cigarsData))) {
    const errorMessage = cigarsData && isErrorResponse(cigarsData)
      ? cigarsData.error.message
      : 'Failed to load cigars';

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <Text style={styles.pullToRefresh}>Pull down to try again</Text>
        </View>
        <FlatList
          data={[]}
          renderItem={null}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#C6A664"
              colors={['#C6A664']}
            />
          }
        />
      </SafeAreaView>
    );
  }

  const cigars = isCigarsArray(cigarsData) ? cigarsData : [];

  // Render empty state
  if (cigars.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <FlatList
          data={[]}
          renderItem={null}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#C6A664"
              colors={['#C6A664']}
            />
          }
          contentContainerStyle={styles.emptyContainer}
          ListEmptyComponent={
            <View style={styles.emptyContent}>
              <Text style={styles.emptyIcon}>🍂</Text>
              <Text style={styles.emptyTitle}>No Cigars Yet</Text>
              <Text style={styles.emptyMessage}>
                Start building your collection by adding your first cigar
              </Text>
            </View>
          }
        />
        <FloatingActionButton onPress={handleFABPress} />
      </SafeAreaView>
    );
  }
  // Render cigars list
  // Calculate total quantity
  const totalQuantity = cigars.reduce((sum, cigar) => sum + (cigar.quantity || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Collection</Text>
        <Text style={styles.count}>
          {cigars.length} {cigars.length === 1 ? 'cigar' : 'cigars'}
          {totalQuantity > 0 && ` (${totalQuantity} total)`}
        </Text>
      </View>
      
      <FlatList
        data={cigars}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CigarListItem
            cigar={item}
            onPress={handleCigarPress}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#C6A664"
            colors={['#C6A664']}
          />
        }
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      
      <FloatingActionButton onPress={handleFABPress} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1C', // Deep Charcoal
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#5A3E2B', // Oak Brown
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#C6A664', // Gold
    marginBottom: 5,
  },
  count: {
    fontSize: 16,
    color: '#F3E9DC', // Warm Cream
    opacity: 0.8,
  },
  listContent: {
    paddingBottom: 100, // Space for FAB
  },
  separator: {
    height: 1,
    backgroundColor: '#5A3E2B', // Oak Brown
    marginHorizontal: 20,
    opacity: 0.3,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#F3E9DC', // Warm Cream
    opacity: 0.8,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#C6A664', // Gold
    marginBottom: 10,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#F3E9DC', // Warm Cream
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 22,
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#C6A664', // Gold
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#F3E9DC', // Warm Cream
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 20,
  },
  pullToRefresh: {
    fontSize: 14,
    color: '#F3E9DC', // Warm Cream
    opacity: 0.6,
    fontStyle: 'italic',
  },
});

export default CigarsScreen;