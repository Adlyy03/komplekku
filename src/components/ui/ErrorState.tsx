import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { Button } from './Button';

interface ErrorStateProps {
  /** Error headline */
  title?: string;
  /** Error description */
  description?: string;
  /** Retry callback */
  onRetry?: () => void;
  /** Fill entire parent */
  fullScreen?: boolean;
  style?: ViewStyle;
}

/**
 * Error state — desain.md §27
 * "Errors are calm and actionable, never alarming red-screen panic."
 * Warning icon + headline + plain-language reason + retry button.
 */
export function ErrorState({
  title = 'Gagal memuat data',
  description = 'Terjadi kesalahan. Silakan coba lagi.',
  onRetry,
  fullScreen = true,
  style,
}: ErrorStateProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen, style]}>
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>!</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {onRetry && (
        <Button
          label="Coba lagi"
          onPress={onRetry}
          variant="primary"
          style={styles.retryButton}
        />
      )}
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
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.semantic.error[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  iconText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.semantic.error[500],
  },
  title: {
    ...Typography.h3,
    color: Colors.stone[700],
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  description: {
    ...Typography.bodyM,
    color: Colors.stone[500],
    textAlign: 'center',
    maxWidth: 280,
  },
  retryButton: {
    marginTop: Spacing[5],
  },
});
