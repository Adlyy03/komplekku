import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { Button } from './Button';

interface EmptyStateProps {
  /** Headline text */
  title: string;
  /** Supporting description (1-2 lines) */
  description?: string;
  /** Optional CTA button */
  actionLabel?: string;
  /** CTA callback */
  onAction?: () => void;
  style?: ViewStyle;
}

/**
 * Empty state — desain.md §25
 * Centered column: icon area + headline + body + optional CTA.
 * "Every empty state explains *why* it's empty and gives one clear next action."
 */
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Icon placeholder — will use Phosphor icons once available */}
      <View style={styles.iconContainer}>
        <Text style={styles.iconPlaceholder}>○</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
          style={styles.action}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[8],
    backgroundColor: Colors.stone[25],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: Colors.stone[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  iconPlaceholder: {
    fontSize: 32,
    color: Colors.stone[300],
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
  action: {
    marginTop: Spacing[5],
  },
});
