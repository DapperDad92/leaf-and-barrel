import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle-outline" size={64} color="#C6A664" />
            </View>
            
            <Text style={styles.title}>Oops! Something went wrong</Text>
            
            <Text style={styles.message}>
              We're sorry for the inconvenience. The app encountered an unexpected error.
            </Text>

            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details (Dev Only):</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorStack}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

// Functional component wrapper for easier use with hooks
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#C6A664',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '600',
  },
  errorDetails: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#1C1C1C',
    borderRadius: 8,
    width: '100%',
  },
  errorTitle: {
    color: '#C6A664',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 8,
  },
  errorStack: {
    color: '#666',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});