import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { ShoppingBagOpen } from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { formatRupiah, formatTimeAgo, type ProductWithDetails } from '@/services/products';

interface ProductCardProps {
  product: ProductWithDetails;
  onPress: () => void;
  style?: ViewStyle;
}

/**
 * Listing card (grid variant) — desain.md §13.3
 * 1:1 image ratio with top rounded corners.
 * Truncated title, tabular Rupiah price, seller store name + relative time.
 */
export function ProductCard({ product, onPress, style }: ProductCardProps) {
  const primaryImage = product.images?.[0]?.storage_path;
  const isOutOfStock = product.stock <= 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        style,
      ]}
    >
      {/* 1:1 Image container */}
      <View style={styles.imageContainer}>
        {primaryImage ? (
          <Image
            source={{ uri: primaryImage }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <ShoppingBagOpen size={28} color={Colors.stone[400]} />
          </View>
        )}

        {/* Status badges */}
        {isOutOfStock ? (
          <View style={styles.soldOverlay}>
            <Text style={styles.soldText}>Habis</Text>
          </View>
        ) : product.stock < 5 ? (
          <View style={styles.lowStockBadge}>
            <Text style={styles.lowStockText}>Sisa {product.stock}</Text>
          </View>
        ) : null}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {product.name}
        </Text>

        <Text style={styles.price}>{formatRupiah(product.price)}</Text>

        {/* Seller info row */}
        <View style={styles.sellerRow}>
          <Text style={styles.sellerName} numberOfLines={1}>
            {product.seller?.store_name || 'Toko Warga'}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.time}>{formatTimeAgo(product.created_at)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.stone[50],
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.stone[50],
  },
  placeholderIcon: {
    fontSize: 32,
    opacity: 0.5,
  },
  soldOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(28,25,21,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldText: {
    ...Typography.overline,
    color: '#FFFFFF',
    backgroundColor: Colors.stone[900],
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  lowStockBadge: {
    position: 'absolute',
    top: Spacing[2],
    left: Spacing[2],
    backgroundColor: Colors.semantic.warning[50],
    borderWidth: 1,
    borderColor: Colors.semantic.warning[500],
    paddingHorizontal: Spacing[1],
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  lowStockText: {
    ...Typography.overline,
    color: Colors.semantic.warning[700],
    fontSize: 9,
  },
  content: {
    padding: Spacing[3],
    gap: 2,
  },
  title: {
    ...Typography.h3,
    fontSize: 14,
    color: Colors.stone[800],
  },
  price: {
    ...Typography.numericPrice,
    fontSize: 15,
    color: Colors.stone[900],
    marginTop: 2,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing[1],
  },
  sellerName: {
    ...Typography.bodyS,
    fontSize: 11,
    color: Colors.stone[500],
    flexShrink: 1,
  },
  dot: {
    ...Typography.bodyS,
    color: Colors.stone[400],
    marginHorizontal: 3,
  },
  time: {
    ...Typography.bodyS,
    fontSize: 11,
    color: Colors.stone[400],
  },
});
