import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getBottles, isBottlesArray, type BottleWithQuantity } from '../api/bottles';
import { isErrorResponse } from '../utils/error';
import BottleListItem from '../components/BottleListItem';
import FloatingActionButton from '../components/FloatingActionButton';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottlesStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<BottlesStackParamList, 'BottlesList'>;

const BottlesScreen: React.FC<Props> = ({ navigation }) => {
  // React Query hook for fetching bottles
  const {
    data: bottlesData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['bottles'],
    queryFn: getBottles,
    // Refetch on mount and focus
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Handle bottle item press (for future navigation)
  const handleBottlePress = (bottle: BottleWithQuantity) => {
    // TODO: Navigate to bottle detail screen
    Alert.alert('Bottle Selected', `${bottle.brand} ${bottle.expression || ''}`);
  };

  // Handle FAB press - navigate to AddBottle
  const handleFABPress = () => {
    navigation.navigate('AddBottle', {});
  };

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
  if (isError || (bottlesData && !isBottlesArray(bottlesData))) {
    const errorMessage = bottlesData && isErrorResponse(bottlesData)
      ? bottlesData.error.message
      : 'Failed to load bottles';

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
          contentContainerStyle={styles.emptyList}
        />
      </SafeAreaView>
    );
  }

  // Get bottles array
  const bottles = bottlesData && isBottlesArray(bottlesData) ? bottlesData : [];

  // Render empty state
  if (bottles.length === 0) {
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
              <Text style={styles.emptyIcon}>🍾</Text>
              <Text style={styles.emptyTitle}>No Bottles Yet</Text>
              <Text style={styles.emptyMessage}>
                Start building your collection by adding your first bottle
              </Text>
            </View>
          }
        />
        <FloatingActionButton onPress={handleFABPress} />
      </SafeAreaView>
    );
  }

  // Calculate total quantity
  const totalQuantity = bottles.reduce((sum, bottle) => sum + (bottle.quantity || 0), 0);

  // Render bottles list
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Collection</Text>
        <Text style={styles.count}>
          {bottles.length} {bottles.length === 1 ? 'bottle' : 'bottles'}
          {totalQuantity > 0 && ` (${totalQuantity} total)`}
        </Text>
      </View>
      
      <FlatList
        data={bottles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BottleListItem
            bottle={item}
            onPress={handleBottlePress}
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
        showsVerticalScrollIndicator={false}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#5A3E2B', // Oak Brown
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#C6A664', // Gold
    fontFamily: 'serif',
  },
  count: {
    fontSize: 16,
    color: '#F3E9DC', // Warm Cream
    marginTop: 4,
    opacity: 0.8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#F3E9DC', // Warm Cream
    marginTop: 16,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D14E24', // Ember
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#F3E9DC', // Warm Cream
    textAlign: 'center',
    marginBottom: 16,
  },
  pullToRefresh: {
    fontSize: 14,
    color: '#C6A664', // Gold
    fontStyle: 'italic',
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#C6A664', // Gold
    marginBottom: 12,
    fontFamily: 'serif',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#F3E9DC', // Warm Cream
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
  },
  listContent: {
    paddingVertical: 8,
  },
  separator: {
    height: 4,
  },
});

export default BottlesScreen;