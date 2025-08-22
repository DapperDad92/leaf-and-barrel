import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

const PairingsScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Pairings</Text>
        <Text style={styles.subtitle}>Coming soon...</Text>
        <Text style={styles.description}>
          Discover perfect cigar and spirit pairings
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1C', // Deep Charcoal
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#C6A664', // Gold
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#F3E9DC', // Warm Cream
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#F3E9DC', // Warm Cream
    opacity: 0.7,
    textAlign: 'center',
  },
});

export default PairingsScreen;