import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

/**
 * ProductSkeleton — desain.md §26
 * Mirrors ListingCard 2-column grid layout with 1:1 square block and text bars.
 */
export function ProductSkeleton() {
  return (
    <View style={styles.grid}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.card}>
          <View style={styles.imageBlock} />
          <View style={styles.content}>
            <View style={styles.titleBar} />
            <View style={styles.priceBar} />
            <View style={styles.metaBar} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
    paddingHorizontal: Spacing[4],
  },
  card: {
    width: '48%',
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    overflow: 'hidden',
    marginBottom: Spacing[2],
  },
  imageBlock: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.stone[100],
  },
  content: {
    padding: Spacing[3],
    gap: Spacing[2],
  },
  titleBar: {
    width: '80%',
    height: 12,
    borderRadius: 4,
    backgroundColor: Colors.stone[100],
  },
  priceBar: {
    width: '45%',
    height: 14,
    borderRadius: 4,
    backgroundColor: Colors.stone[100],
  },
  metaBar: {
    width: '60%',
    height: 10,
    borderRadius: 4,
    backgroundColor: Colors.stone[50],
  },
});
