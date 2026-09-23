import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
  type TextStyle,
  Animated,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

/**
 * Button — desain.md §30
 * Press: scale to 0.97, 100ms. Release springs back.
 * Loading: label replaced by spinner, width preserved, disabled.
 * Variants: primary (Pine 600), secondary (stone border), destructive (error), ghost.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  icon,
}: ButtonProps) {
  const [scaleAnim] = useState(() => new Animated.Value(1));

  const handlePressIn = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const isDisabled = disabled || loading;

  const containerStyle = getContainerStyle(variant, isDisabled);
  const textStyle = getTextStyle(variant, isDisabled);

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          styles.base,
          containerStyle,
          fullWidth && styles.fullWidth,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' ? '#FFFFFF' : Colors.primary[600]}
          />
        ) : (
          <>
            {icon}
            <Text style={[styles.label, textStyle]}>{label}</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

function getContainerStyle(variant: ButtonVariant, disabled: boolean): ViewStyle {
  if (disabled) {
    return {
      backgroundColor: Colors.stone[100],
      borderWidth: 0,
    };
  }
  switch (variant) {
    case 'primary':
      return { backgroundColor: Colors.primary[600] };
    case 'secondary':
      return {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.stone[200],
      };
    case 'destructive':
      return {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.semantic.error[500],
      };
    case 'ghost':
      return { backgroundColor: 'transparent' };
  }
}

function getTextStyle(variant: ButtonVariant, disabled: boolean): TextStyle {
  if (disabled) {
    return { color: Colors.stone[400] };
  }
  switch (variant) {
    case 'primary':
      return { color: '#FFFFFF' };
    case 'secondary':
      return { color: Colors.stone[700] };
    case 'destructive':
      return { color: Colors.semantic.error[500] };
    case 'ghost':
      return { color: Colors.primary[600] };
  }
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // §10 tap target
    flexDirection: 'row',
    gap: Spacing[2],
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    ...Typography.label,
  },
});
