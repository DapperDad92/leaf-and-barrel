import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Define the param list for the Cigars stack navigator
export type CigarsStackParamList = {
  CigarsList: undefined;
  Scanner: undefined;
};

// Define the param list for the bottom tab navigator
export type RootTabParamList = {
  Cigars: NavigatorScreenParams<CigarsStackParamList>;
  Bottles: undefined;
  Pairings: undefined;
};

// Define the root stack param list (for future use when adding stack navigators)
export type RootStackParamList = {
  Main: NavigatorScreenParams<RootTabParamList>;
};

// Screen props types
export type CigarsScreenProps = NativeStackScreenProps<CigarsStackParamList, 'CigarsList'>;
export type ScannerScreenProps = NativeStackScreenProps<CigarsStackParamList, 'Scanner'>;
export type BottlesScreenProps = BottomTabScreenProps<RootTabParamList, 'Bottles'>;
export type PairingsScreenProps = BottomTabScreenProps<RootTabParamList, 'Pairings'>;

// For future use with nested navigators
export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

export type RootTabScreenProps<T extends keyof RootTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

// Declare global types for React Navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}