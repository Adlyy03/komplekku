import React from 'react';
import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

interface LoadingStateProps {
  /** Fill entire parent (flex: 1) */
  fullScreen?: boolean;
  /** Custom message — not rendered, just for semantics */
  style?: ViewStyle;
  /** Size of the spinner */
  size?: 'small' | 'large';
}

/**
 * Loading indicator — centered spinner.
 * desain.md §26: skeleton states are component-specific;
 * this is the generic spinner fallback for full-screen initial loads.
 */
export function LoadingState({ fullScreen = true, style, size = 'large' }: LoadingStateProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen, style]}>
      <ActivityIndicator size={size} color={Colors.primary[600]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[8],
  },
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.stone[25],
  },
});
