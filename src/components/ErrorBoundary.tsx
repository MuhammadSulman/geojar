import React, {Component, ErrorInfo, ReactNode} from 'react';
import {View, StyleSheet} from 'react-native';
import {Button, Text} from 'react-native-paper';
import {useAppTheme, type AppTheme} from '@/constants/theme';

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
    try {
      const DevSettings = require('react-native').DevSettings;
      DevSettings?.reload?.();
    } catch {
      this.setState({hasError: false, error: null});
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          onRestart={this.handleRestart}
        />
      );
    }
    return this.props.children;
  }
}

interface FallbackProps {
  error: Error | null;
  onRestart: () => void;
}

function ErrorFallback({error, onRestart}: FallbackProps) {
  const theme = useAppTheme();
  const styles = makeStyles(theme);
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>😵</Text>
      <Text variant="headlineSmall" style={styles.title}>
        Something went wrong
      </Text>
      <Text style={styles.message}>
        The app encountered an unexpected error. Please try restarting.
      </Text>
      {__DEV__ && error && (
        <Text style={styles.errorDetail}>{error.message}</Text>
      )}
      <Button
        mode="contained"
        onPress={onRestart}
        style={styles.button}
        buttonColor={theme.appColors.primary}>
        Restart
      </Button>
    </View>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: t.appColors.background,
      padding: 24,
    },
    emoji: {
      fontSize: 64,
      marginBottom: 16,
    },
    title: {
      color: t.appColors.onSurface,
      marginBottom: 12,
    },
    message: {
      color: t.appColors.onSurfaceMuted,
      fontSize: 15,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 16,
    },
    errorDetail: {
      color: t.appColors.error,
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
