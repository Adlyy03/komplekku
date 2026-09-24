import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { popup } from '@/lib/popup';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  CaretLeft,
  Storefront,
  ShoppingBagOpen,
  PersonSimpleWalk,
  Moped,
  HandCoins,
} from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSupabase } from '@/lib/supabase-provider';
import { useCart } from '@/lib/cart-provider';
import { createOrder } from '@/services/orders';
import { formatRupiah } from '@/services/products';
import { DesktopShell, useIsDesktop } from '@/components/ui/DesktopShell';

/**
 * Checkout Screen — PRD §31, §32, §33, §73 & desain.md §17
 * Single-seller checkout with delivery option, price breakdown, and order creation.
 */
export default function CheckoutScreen() {
  const isDesktop = useIsDesktop();
  const { sellerId } = useLocalSearchParams<{ sellerId: string }>();
  const { user } = useSupabase();
  const { sellerGroups, refreshCart } = useCart();

  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'manual_delivery'>('pickup');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentGroup = sellerGroups.find((g) => g.sellerId === sellerId);

  if (!currentGroup || currentGroup.items.length === 0) {
    return (
      <DesktopShell
        activeKey="/marketplace"
        pageTitle="Checkout Pesanan"
        breadcrumb={['Pasar', 'Keranjang', 'Checkout']}
      >
        <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top', 'bottom']}>
          {!isDesktop && (
            <View style={styles.navBar}>
              <Pressable
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/cart' as any))}
                hitSlop={8}
                style={styles.backTouch}
              >
                <CaretLeft size={20} color={Colors.stone[700]} />
                <Text style={styles.backButton}>Kembali</Text>
              </Pressable>
            </View>
          )}
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Tidak ada barang yang dipilih untuk checkout.</Text>
            <Button
              label="Kembali ke Keranjang"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/cart' as any))}
              variant="secondary"
            />
          </View>
        </SafeAreaView>
      </DesktopShell>
    );
  }

  const deliveryFee = deliveryMethod === 'manual_delivery' ? 5000 : 0;
  const grandTotal = currentGroup.subtotal + deliveryFee;

  const handleCreateOrder = async () => {
    if (!user?.id) return;
    setError(null);
    setCreating(true);

    try {
      const res = await createOrder({
        buyerId: user.id,
        sellerId: currentGroup.sellerId,
        deliveryMethod,
        deliveryFee,
        notes,
        cartItems: currentGroup.items,
      });

      if (res.error) {
        setError(res.error.message);
      } else if (res.data) {
        await refreshCart();
        popup.alert('Pesanan Berhasil Dibuat!', `Nomor Pesanan: ${res.data.order_number}`, [
          {
            text: 'Lihat Status Pesanan',
            onPress: () => {
              router.replace({
                pathname: '/order/[id]' as any,
                params: { id: res.data!.id },
              });
            },
          },
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal membuat pesanan');
    } finally {
      setCreating(false);
    }
  };

  return (
    <DesktopShell
      activeKey="/marketplace"
      pageTitle="Checkout Pesanan"
      breadcrumb={['Pasar', 'Keranjang', 'Checkout']}
    >
      <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top', 'bottom']}>
        {/* Nav Bar */}
        {!isDesktop && (
          <View style={styles.navBar}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/cart' as any))}
              hitSlop={8}
              style={styles.backTouch}
            >
              <CaretLeft size={20} color={Colors.stone[700]} />
              <Text style={styles.backButton}>Kembali</Text>
            </Pressable>
            <Text style={styles.navTitle}>Checkout</Text>
            <View style={{ width: 48 }} />
          </View>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopScrollContent]}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{error}</Text>
            </View>
          )}

          {/* Store Name Header */}
          <View style={styles.storeCard}>
            <Storefront size={24} color={Colors.primary[700]} weight="bold" />
            <View style={{ flex: 1 }}>
              <Text style={styles.storeEyebrow}>PESANAN DARI</Text>
              <Text style={styles.storeName}>{currentGroup.storeName}</Text>
            </View>
          </View>

          {/* Items Summary Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Daftar Barang ({currentGroup.items.length})</Text>
            <View style={styles.itemsList}>
              {currentGroup.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemThumb}>
                    {item.product?.images?.[0]?.image_url ? (
                      <Image
                        source={{ uri: item.product.images[0].image_url }}
                        style={styles.thumbImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.thumbPlaceholder}>
                        <ShoppingBagOpen size={18} color={Colors.stone[400]} />
                      </View>
                    )}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.product?.name}
                    </Text>
                    <Text style={styles.itemQtyPrice}>
                      {item.quantity} × {formatRupiah(item.product?.price || 0)}
                    </Text>
                  </View>
                  <Text style={styles.itemSubtotal}>
                    {formatRupiah((item.product?.price || 0) * item.quantity)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Delivery Method Option */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Metode Pengambilan</Text>
            <View style={styles.optionsGroup}>
              <Pressable
                onPress={() => setDeliveryMethod('pickup')}
                style={[
                  styles.optionItem,
                  deliveryMethod === 'pickup' && styles.optionItemActive,
                ]}
              >
                <PersonSimpleWalk
                  size={24}
                  color={deliveryMethod === 'pickup' ? Colors.primary[700] : Colors.stone[600]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>Ambil Sendiri (Pickup)</Text>
                  <Text style={styles.optionSubtitle}>Ambil ke rumah/toko tetangga</Text>
                </View>
                <Text style={styles.optionFee}>Gratis</Text>
              </Pressable>

              <Pressable
                onPress={() => setDeliveryMethod('manual_delivery')}
                style={[
                  styles.optionItem,
                  deliveryMethod === 'manual_delivery' && styles.optionItemActive,
                ]}
              >
                <Moped
                  size={24}
                  color={deliveryMethod === 'manual_delivery' ? Colors.primary[700] : Colors.stone[600]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>Antar ke Rumah (Delivery)</Text>
                  <Text style={styles.optionSubtitle}>Diantar oleh tetangga</Text>
                </View>
                <Text style={styles.optionFee}>Rp 5.000</Text>
              </Pressable>
            </View>
          </View>

          {/* Notes Input */}
          <Input
            label="Catatan untuk Penjual (Opsional)"
            placeholder="Contoh: Sambal dipisah, pagar warna putih..."
            value={notes}
            onChangeText={setNotes}
          />

          {/* Price Breakdown Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rincian Pembayaran</Text>
            <View style={styles.breakdownList}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Subtotal Produk</Text>
                <Text style={styles.breakdownValue}>
                  {formatRupiah(currentGroup.subtotal)}
                </Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Biaya Pengantaran</Text>
                <Text style={styles.breakdownValue}>
                  {deliveryFee > 0 ? formatRupiah(deliveryFee) : 'Gratis'}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.breakdownRow}>
                <Text style={styles.totalLabel}>Total Pembayaran</Text>
                <Text style={styles.totalValue}>{formatRupiah(grandTotal)}</Text>
              </View>
            </View>
          </View>

          {/* Notice */}
          <View style={styles.codNoticeBox}>
            <HandCoins size={20} color={Colors.stone[600]} />
            <Text style={styles.codNotice}>
              Pembayaran dilakukan secara tunai / transfer langsung saat pesanan diterima (COD / direct).
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, isDesktop && styles.desktopBottomBar]}>
        <View style={styles.bottomTotalRow}>
          <Text style={styles.bottomTotalLabel}>Total:</Text>
          <Text style={styles.bottomTotalValue}>{formatRupiah(grandTotal)}</Text>
        </View>
        <Button
          label="Buat Pesanan Sekarang"
          onPress={handleCreateOrder}
          variant="primary"
          loading={creating}
          fullWidth
          style={{ marginTop: Spacing[2] }}
        />
      </View>
    </SafeAreaView>
  </DesktopShell>
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
    color: Colors.stone[600],
  },
  navTitle: {
    ...Typography.h3,
    color: Colors.stone[800],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[6],
    gap: Spacing[4],
  },
  emptyText: {
    ...Typography.bodyM,
    color: Colors.stone[500],
    textAlign: 'center',
  },
  scrollContent: {
    padding: Spacing[4],
    gap: Spacing[4],
    paddingBottom: Spacing[8],
  },
  desktopScrollContent: {
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
    paddingVertical: Spacing[6],
  },
  desktopBottomBar: {
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
    borderRadius: Radius.md,
    marginBottom: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.stone[200],
  },
  errorBox: {
    backgroundColor: Colors.semantic.error[50],
    padding: Spacing[3],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.semantic.error[500],
  },
  errorBoxText: {
    ...Typography.bodyS,
    color: Colors.semantic.error[700],
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.stone[0],
    padding: Spacing[4],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
  },
  storeIcon: {
    fontSize: 24,
  },
  storeEyebrow: {
    ...Typography.overline,
    color: Colors.stone[400],
    fontSize: 10,
  },
  storeName: {
    ...Typography.h3,
    color: Colors.stone[800],
  },
  card: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[4],
    gap: Spacing[3],
  },
  cardTitle: {
    ...Typography.h3,
    fontSize: 15,
    color: Colors.stone[800],
  },
  itemsList: {
    gap: Spacing[3],
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  itemThumb: {
    width: 48,
    height: 48,
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
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...Typography.bodyM,
    fontWeight: '600',
    color: Colors.stone[800],
  },
  itemQtyPrice: {
    ...Typography.bodyS,
    color: Colors.stone[500],
  },
  itemSubtotal: {
    ...Typography.numericPrice,
    fontSize: 14,
    color: Colors.stone[800],
  },
  optionsGroup: {
    gap: Spacing[2],
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[3],
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    backgroundColor: Colors.stone[50],
  },
  optionItemActive: {
    borderColor: Colors.primary[600],
    backgroundColor: Colors.primary[50],
  },
  optionIcon: {
    fontSize: 20,
  },
  optionTitle: {
    ...Typography.bodyM,
    fontWeight: '600',
    color: Colors.stone[800],
  },
  optionSubtitle: {
    ...Typography.bodyS,
    color: Colors.stone[500],
  },
  optionFee: {
    ...Typography.label,
    color: Colors.primary[700],
  },
  breakdownList: {
    gap: Spacing[2],
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    ...Typography.bodyM,
    color: Colors.stone[600],
  },
  breakdownValue: {
    ...Typography.numericPrice,
    fontSize: 14,
    color: Colors.stone[800],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.stone[100],
    marginVertical: Spacing[1],
  },
  totalLabel: {
    ...Typography.h3,
    color: Colors.stone[800],
  },
  totalValue: {
    ...Typography.numericPrice,
    fontSize: 18,
    color: Colors.stone[900],
  },
  codNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
  },
  codNotice: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    flex: 1,
  },
  bottomBar: {
    backgroundColor: Colors.stone[0],
    borderTopWidth: 1,
    borderTopColor: Colors.stone[100],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  bottomTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomTotalLabel: {
    ...Typography.bodyM,
    color: Colors.stone[600],
  },
  bottomTotalValue: {
    ...Typography.numericPrice,
    fontSize: 20,
    color: Colors.stone[900],
  },
});
