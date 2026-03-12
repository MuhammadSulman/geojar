import React, {Component, ErrorInfo, ReactNode} from 'react';
import {View, StyleSheet} from 'react-native';
import {Button, Text} from 'react-native-paper';
import RNRestart from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = {hasError: false, error: null};

  static getDerivedStateFromError(error: Error): State {
    return {hasError: true, error};
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRestart = () => {
    this.setState({hasError: false, error: null});
    // DevSettings.reload() is available in dev, production apps
    // would use a library like react-native-restart
    try {
      const DevSettings = require('react-native').DevSettings;
      DevSettings?.reload?.();
    } catch {
      // Fallback: reset error state to re-render children
      this.setState({hasError: false, error: null});
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>😵</Text>
          <Text variant="headlineSmall" style={styles.title}>
            Something went wrong
          </Text>
          <Text style={styles.message}>
            The app encountered an unexpected error. Please try restarting.
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.errorDetail}>
              {this.state.error.message}
            </Text>
          )}
          <Button
            mode="contained"
            onPress={this.handleRestart}
            style={styles.button}
            buttonColor="#16A34A">
            Restart
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0F14',
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    color: '#F0F2F8',
    marginBottom: 12,
  },
  message: {
    color: '#7B82A0',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  errorDetail: {
    color: '#EF4444',
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'monospace',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  button: {
    marginTop: 8,
  },
});
