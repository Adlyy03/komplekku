import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import type { Category } from '@/types/database';

interface CategoryPillsProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  style?: ViewStyle;
}

/**
 * CategoryPills — desain.md §13.2
 * Horizontal chip scroll for category sub-filtering.
 * Active segment: stone-800 bg + white text. Inactive: stone-50 bg + stone-700 text.
 */
export function CategoryPills({
  categories,
  selectedCategoryId,
  onSelectCategory,
  style,
}: CategoryPillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, style]}
    >
      {/* 'Semua' pill */}
      <Pressable
        onPress={() => onSelectCategory(null)}
        style={[
          styles.pill,
          selectedCategoryId === null && styles.pillActive,
        ]}
      >
        <Text
          style={[
            styles.pillText,
            selectedCategoryId === null && styles.pillTextActive,
          ]}
        >
          Semua
        </Text>
      </Pressable>

      {/* Dynamic category pills */}
      {categories.map((cat) => {
        const isSelected = selectedCategoryId === cat.id;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelectCategory(cat.id)}
            style={[styles.pill, isSelected && styles.pillActive]}
          >
            <Text
              style={[
                styles.pillText,
                isSelected && styles.pillTextActive,
              ]}
            >
              {cat.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing[4],
    gap: Spacing[2],
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    backgroundColor: Colors.stone[50],
    borderWidth: 1,
    borderColor: Colors.stone[100],
  },
  pillActive: {
    backgroundColor: Colors.stone[800],
    borderColor: Colors.stone[800],
  },
  pillText: {
    ...Typography.bodyS,
    fontWeight: '500',
    color: Colors.stone[700],
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
