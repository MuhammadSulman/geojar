import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {Text} from 'react-native-paper';

type Variant = 'success' | 'error' | 'info';

interface ToastMessage {
  text: string;
  variant: Variant;
}

interface ToastContextValue {
  showToast: (text: string, variant?: Variant) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const VARIANT_COLORS: Record<Variant, string> = {
  success: '#16A34A',
  error: '#EF4444',
  info: '#3B82F6',
};

const AUTO_DISMISS = 2500;

export function ToastProvider({children}: {children: React.ReactNode}) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const translateY = useRef(new Animated.Value(100)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(translateY, {
      toValue: 100,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [translateY]);

  const showToast = useCallback(
    (text: string, variant: Variant = 'success') => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setToast({text, variant});
      translateY.setValue(100);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();
      timerRef.current = setTimeout(hide, AUTO_DISMISS);
    },
    [translateY, hide],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <ToastContext.Provider value={{showToast}}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: VARIANT_COLORS[toast.variant],
              transform: [{translateY}],
            },
          ]}>
          <View style={styles.content}>
            <Text style={styles.text}>{toast.text}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 48,
    left: 16,
    right: 16,
    borderRadius: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
