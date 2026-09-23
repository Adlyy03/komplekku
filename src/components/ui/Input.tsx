import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  helperText?: string;
  containerStyle?: ViewStyle;
}

/**
 * Input — desain.md §3-7, §27
 * Warm neutral styling, 10px radius, 44px min height.
 * Inline calm error state with error text.
 */
export function Input({
  label,
  error,
  helperText,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const hasError = Boolean(error);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          hasError && styles.inputError,
          style,
        ]}
        placeholderTextColor={Colors.stone[400]}
        {...props}
      />
      {hasError ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing[1], // 4px
    width: '100%',
  },
  label: {
    ...Typography.label,
    color: Colors.stone[700],
    marginBottom: 2,
  },
  input: {
    ...Typography.bodyM,
    minHeight: 44, // 44px tap target
    paddingHorizontal: Spacing[3], // 12px
    paddingVertical: Spacing[2], // 8px
    backgroundColor: Colors.stone[0],
    borderWidth: 1,
    borderColor: Colors.stone[100],
    borderRadius: Radius.sm, // 10px
    color: Colors.stone[800],
  },
  inputError: {
    borderColor: Colors.semantic.error[500],
  },
  errorText: {
    ...Typography.bodyS,
    color: Colors.semantic.error[700],
    marginTop: 2,
  },
  helperText: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    marginTop: 2,
  },
});
