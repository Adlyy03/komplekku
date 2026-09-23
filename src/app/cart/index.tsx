import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  CaretLeft,
  Storefront,
  ShoppingBagOpen,
  Info,
} from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCart } from '@/lib/cart-provider';
import { formatRupiah } from '@/services/products';

/**
 * Cart Screen — PRD §27, §28, §90 & desain.md §16
 * Grouped by seller to enforce the Single-Seller Checkout rule.
 */
export default function CartScreen() {
  const { sellerGroups, totalItemCount, loading, updateQuantity, removeItem } = useCart();

  if (loading) {
    return <LoadingState fullScreen />;
  }

  const handleUpdateQty = async (itemId: string, productId: string, currentQty: number, delta: number) => {
    const nextQty = currentQty + delta;
    if (nextQty <= 0) {
      handleRemoveItem(itemId, 'Barang ini');
      return;
    }
    const res = await updateQuantity(itemId, productId, nextQty);
    if (res.error) {
      Alert.alert('Gagal Mengubah Jumlah', res.error.message);
    }
  };

  const handleRemoveItem = (itemId: string, name: string) => {
    Alert.alert('Hapus Barang', `Hapus ${name} dari keranjang?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await removeItem(itemId);
        },
      },
    ]);
  };

  const handleCheckoutSellerGroup = (sellerId: string) => {
    router.push({
      pathname: '/checkout' as any,
      params: { sellerId },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Nav Header */}
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backTouch}>
          <CaretLeft size={20} color={Colors.stone[700]} />
          <Text style={styles.backButton}>Kembali</Text>
        </Pressable>
        <Text style={styles.navTitle}>Keranjang ({totalItemCount})</Text>
        <View style={{ width: 48 }} />
      </View>

      {sellerGroups.length === 0 ? (
        <EmptyState
          title="Keranjang Belanja Kosong"
          description="Yuk, jelajahi produk dan makanan lezat buatan tetangga di komplekmu!"
          actionLabel="Mulai Belanja"
          onAction={() => router.push('/(main)/marketplace')}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Notice for single-seller checkout rule per PRD §28, §90 */}
          <View style={styles.ruleNotice}>
            <Info size={18} color={Colors.primary[700]} weight="bold" />
            <Text style={styles.ruleNoticeText}>
              Pesanan diproses per toko agar pengantaran oleh tetangga lebih mudah dan cepat.
            </Text>
          </View>

          {sellerGroups.map((group) => (
            <View key={group.sellerId} style={styles.sellerGroupCard}>
              {/* Seller Header */}
              <View style={styles.groupHeader}>
                <Storefront size={18} color={Colors.stone[700]} weight="bold" />
                <Text style={styles.groupStoreName} numberOfLines={1}>
                  {group.storeName}
                </Text>
              </View>

              {/* Items in this group */}
              <View style={styles.itemsContainer}>
                {group.items.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={styles.itemThumb}>
                      {item.product?.images?.[0]?.storage_path || item.product?.images?.[0]?.image_url ? (
                        <Image
                          source={{ uri: (item.product.images[0].storage_path || item.product.images[0].image_url)! }}
                          style={styles.thumbImage}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={styles.thumbPlaceholder}>
                          <ShoppingBagOpen size={20} color={Colors.stone[400]} />
                        </View>
                      )}
                    </View>

                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.product?.name || 'Produk'}
                      </Text>
                      <Text style={styles.itemPrice}>
                        {formatRupiah(item.product?.price || 0)}
                      </Text>

                      {/* Quantity Selector */}
                      <View style={styles.qtyControlRow}>
                        <Pressable
                          onPress={() =>
                            handleUpdateQty(item.id, item.product_id, item.quantity, -1)
                          }
                          style={styles.qtyButton}
                        >
                          <Text style={styles.qtyButtonText}>−</Text>
                        </Pressable>

                        <Text style={styles.qtyText}>{item.quantity}</Text>

                        <Pressable
                          onPress={() =>
                            handleUpdateQty(item.id, item.product_id, item.quantity, 1)
                          }
                          style={styles.qtyButton}
                        >
                          <Text style={styles.qtyButtonText}>+</Text>
                        </Pressable>

                        <Pressable
                          onPress={() =>
                            handleRemoveItem(item.id, item.product?.name || 'Barang')
                          }
                          hitSlop={8}
                          style={styles.removeTouch}
                        >
                          <Text style={styles.removeText}>Hapus</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {/* Group Subtotal & Checkout Button */}
              <View style={styles.groupFooter}>
                <View style={styles.subtotalRow}>
                  <Text style={styles.subtotalLabel}>Subtotal Toko:</Text>
                  <Text style={styles.subtotalValue}>{formatRupiah(group.subtotal)}</Text>
                </View>

                <Button
                  label={`Checkout dari ${group.storeName}`}
                  onPress={() => handleCheckoutSellerGroup(group.sellerId)}
                  variant="primary"
                  fullWidth
                  style={styles.checkoutGroupButton}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.stone[25],
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[100],
    backgroundColor: Colors.stone[0],
  },
  backTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing[1],
  },
  backButton: {
    ...Typography.label,
    color: Colors.stone[700],
  },
  navTitle: {
    ...Typography.h3,
    fontSize: 16,
    color: Colors.stone[800],
  },
  scrollContent: {
    padding: Spacing[4],
    gap: Spacing[4],
  },
  ruleNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.primary[50],
    padding: Spacing[3],
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  ruleNoticeText: {
    ...Typography.bodyS,
    color: Colors.primary[800],
    lineHeight: 18,
    flex: 1,
  },
  sellerGroupCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.stone[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[100],
  },
  storeIcon: {
    fontSize: 16,
  },
  groupStoreName: {
    ...Typography.h3,
    fontSize: 14,
    color: Colors.stone[800],
    flex: 1,
  },
  itemsContainer: {
    padding: Spacing[3],
    gap: Spacing[3],
  },
  itemRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    paddingBottom: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[50],
  },
  itemThumb: {
    width: 64,
    height: 64,
    borderRadius: Radius.xs,
    backgroundColor: Colors.stone[50],
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    ...Typography.bodyM,
    fontWeight: '600',
    color: Colors.stone[800],
  },
  itemPrice: {
    ...Typography.numericPrice,
    fontSize: 14,
    color: Colors.stone[900],
  },
  qtyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing[1],
    gap: Spacing[2],
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.stone[200],
    backgroundColor: Colors.stone[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.stone[700],
  },
  qtyText: {
    ...Typography.bodyM,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
    color: Colors.stone[800],
  },
  removeTouch: {
    marginLeft: 'auto',
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
  },
  removeText: {
    ...Typography.bodyS,
    color: Colors.semantic.error[700],
  },
  groupFooter: {
    padding: Spacing[4],
    backgroundColor: Colors.stone[25],
    borderTopWidth: 1,
    borderTopColor: Colors.stone[100],
    gap: Spacing[3],
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtotalLabel: {
    ...Typography.bodyM,
    color: Colors.stone[600],
  },
  subtotalValue: {
    ...Typography.numericPrice,
    fontSize: 16,
    color: Colors.stone[900],
  },
  checkoutGroupButton: {
    marginTop: 2,
  },
});
