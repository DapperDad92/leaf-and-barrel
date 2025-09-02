import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

import CigarsScreen from '../screens/CigarsScreen';
import ScannerScreen from '../screens/ScannerScreen';
import BottlesScreen from '../screens/BottlesScreen';
import PairingsScreen from '../screens/PairingsScreen';
import { AddCigarScreen } from '../screens/AddCigarScreen';
import { AddBottleScreen } from '../screens/AddBottleScreen';
import { RootTabParamList, CigarsStackParamList, BottlesStackParamList } from './types';
import { withErrorBoundary } from '../components/ErrorBoundary';

const Tab = createBottomTabNavigator<RootTabParamList>();
const CigarsStack = createNativeStackNavigator<CigarsStackParamList>();
const BottlesStack = createNativeStackNavigator<BottlesStackParamList>();

// Wrap add screens with error boundaries
const AddCigarScreenWithErrorBoundary = withErrorBoundary(AddCigarScreen);
const AddBottleScreenWithErrorBoundary = withErrorBoundary(AddBottleScreen);

// Cigars Stack Navigator
const CigarsStackNavigator: React.FC = () => {
  return (
    <CigarsStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1C1C1C', // Deep Charcoal
        },
        headerTintColor: '#C6A664', // Gold
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitle: 'Back',
      }}
    >
      <CigarsStack.Screen
        name="CigarsList"
        component={CigarsScreen}
        options={{
          headerShown: false,
        }}
      />
      <CigarsStack.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          title: 'Scan Barcode',
        }}
      />
      <CigarsStack.Screen
        name="AddCigar"
        component={AddCigarScreenWithErrorBoundary}
        options={{
          title: 'Add Cigar',
        }}
      />
    </CigarsStack.Navigator>
  );
};

// Bottles Stack Navigator
const BottlesStackNavigator: React.FC = () => {
  return (
    <BottlesStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1C1C1C', // Deep Charcoal
        },
        headerTintColor: '#C6A664', // Gold
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitle: 'Back',
      }}
    >
      <BottlesStack.Screen
        name="BottlesList"
        component={BottlesScreen}
        options={{
          headerShown: false,
        }}
      />
      <BottlesStack.Screen
        name="AddBottle"
        component={AddBottleScreenWithErrorBoundary}
        options={{
          title: 'Add Bottle',
        }}
      />
    </BottlesStack.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#C6A664', // Gold
        tabBarInactiveTintColor: '#F3E9DC', // Warm Cream
        tabBarStyle: {
          backgroundColor: '#1C1C1C', // Deep Charcoal
          borderTopColor: '#5A3E2B', // Oak Brown
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          paddingTop: 5,
          height: Platform.OS === 'ios' ? 85 : 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#1C1C1C', // Deep Charcoal
          borderBottomColor: '#5A3E2B', // Oak Brown
          borderBottomWidth: 1,
        },
        headerTintColor: '#C6A664', // Gold
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Cigars"
        component={CigarsStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flame" size={size} color={color} />
          ),
          headerTitle: 'My Cigars',
        }}
      />
      <Tab.Screen
        name="Bottles"
        component={BottlesStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wine" size={size} color={color} />
          ),
          headerTitle: 'My Bottles',
        }}
      />
      <Tab.Screen
        name="Pairings"
        component={PairingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="git-merge" size={size} color={color} />
          ),
          headerTitle: 'Pairings',
        }}
      />
    </Tab.Navigator>
  );
};

export default AppNavigator;