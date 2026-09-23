import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Storefront, User } from 'phosphor-react-native';
import { Colors, FontFamily, Radius, Spacing, Typography } from '@/constants/theme';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useSupabase } from '@/lib/supabase-provider';
import { getSellerProfile } from '@/services/sellers';
import { getBuyerOrders, getSellerOrders, type OrderWithDetails } from '@/services/orders';
import { formatRupiah, formatTimeAgo } from '@/services/products';
import type { SellerProfile } from '@/types/database';
import type { OrderStatus } from '@/types';

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return { label: 'Menunggu', bg: Colors.semantic.warning[50], text: Colors.semantic.warning[700] };
    case 'confirmed':
      return { label: 'Dikonfirmasi', bg: Colors.primary[50], text: Colors.primary[700] };
    case 'processing':
      return { label: 'Diproses', bg: Colors.secondary[50], text: Colors.secondary[700] };
    case 'ready':
      return { label: 'Siap', bg: Colors.accent[100], text: Colors.accent[700] };
    case 'completed':
      return { label: 'Selesai', bg: Colors.semantic.success[50], text: Colors.semantic.success[700] };
    case 'cancelled':
      return { label: 'Dibatalkan', bg: Colors.stone[100], text: Colors.stone[600] };
    default:
      return { label: status, bg: Colors.stone[100], text: Colors.stone[600] };
  }
}

/**
 * Orders Screen — PRD §35, §37 & desain.md §18
 * Dual mode: "Pesanan Saya (Buyer)" and "Pesanan Masuk (Seller)"
 */
export default function OrdersScreen() {
  const { user } = useSupabase();

  const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>('buyer');
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [buyerOrders, setBuyerOrders] = useState<OrderWithDetails[]>([]);
  const [sellerOrders, setSellerOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const [buyerRes, sellerProfileRes] = await Promise.all([
        getBuyerOrders(user.id),
        getSellerProfile(user.id),
      ]);

      setBuyerOrders(buyerRes.data);
      setSeller(sellerProfileRes.data);

      if (sellerProfileRes.data?.id) {
        const sellerOrdersRes = await getSellerOrders(sellerProfileRes.data.id);
        setSellerOrders(sellerOrdersRes.data);
      }
    } catch {
      // Fallback cleanly
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(async () => {
      if (!user?.id) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const [buyerRes, sellerProfileRes] = await Promise.all([
          getBuyerOrders(user.id),
          getSellerProfile(user.id),
        ]);

        if (!isMounted) return;
        setBuyerOrders(buyerRes.data);
        setSeller(sellerProfileRes.data);

        if (sellerProfileRes.data?.id) {
          const sellerOrdersRes = await getSellerOrders(sellerProfileRes.data.id);
          if (isMounted) setSellerOrders(sellerOrdersRes.data);
        }
      } catch {
        // Fallback cleanly
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleOpenOrderDetail = (orderId: string) => {
    router.push({
      pathname: '/order/[id]' as any,
      params: { id: orderId },
    });
  };

  const displayedOrders = activeTab === 'buyer' ? buyerOrders : sellerOrders;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Daftar Pesanan</Text>

        {/* Tab switch if user is also a seller */}
        {seller && (
          <View style={styles.tabBar}>
            <Pressable
              onPress={() => setActiveTab('buyer')}
              style={[
                styles.tabButton,
                activeTab === 'buyer' && styles.tabButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'buyer' && styles.tabButtonTextActive,
                ]}
              >
                Pesanan Saya ({buyerOrders.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('seller')}
              style={[
                styles.tabButton,
                activeTab === 'seller' && styles.tabButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'seller' && styles.tabButtonTextActive,
                ]}
              >
                Pesanan Masuk ({sellerOrders.length})
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Orders List */}
      {loading ? (
        <LoadingState fullScreen={false} style={{ flex: 1 }} />
      ) : displayedOrders.length === 0 ? (
        <EmptyState
          title={activeTab === 'buyer' ? 'Belum Ada Pesanan' : 'Belum Ada Pesanan Masuk'}
          description={
            activeTab === 'buyer'
              ? 'Kamu belum pernah memesan produk dari tetangga. Yuk mulai belanja!'
              : 'Toko kamu belum menerima pesanan baru.'
          }
          actionLabel={activeTab === 'buyer' ? 'Jelajah Marketplace' : undefined}
          onAction={
            activeTab === 'buyer'
              ? () => router.push('/(main)/marketplace')
              : undefined
          }
        />
      ) : (
        <FlatList
          data={displayedOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadData();
              }}
              tintColor={Colors.primary[600]}
            />
          }
          renderItem={({ item }) => {
            const badge = getStatusBadge(item.status);
            const firstItemName = item.items?.[0]?.product_name_snapshot || 'Barang';
            const extraCount = (item.items?.length || 1) - 1;

            return (
              <Pressable
                onPress={() => handleOpenOrderDetail(item.id)}
                style={({ pressed }) => [
                  styles.orderCard,
                  pressed && styles.cardPressed,
                ]}
              >
                {/* Header row: Store / Buyer + Status */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.partyInfo}>
                    {activeTab === 'buyer' ? (
                      <Storefront size={18} color={Colors.stone[600]} />
                    ) : (
                      <User size={18} color={Colors.stone[600]} />
                    )}
                    <Text style={styles.partyName} numberOfLines={1}>
                      {activeTab === 'buyer'
                        ? item.seller?.store_name || 'Toko Warga'
                        : item.buyer?.full_name || 'Warga'}
                    </Text>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                {/* Meta row: Order number & Date */}
                <View style={styles.metaRow}>
                  <Text style={styles.orderNumber}>{item.order_number}</Text>
                  <Text style={styles.orderDate}>{formatTimeAgo(item.created_at)}</Text>
                </View>

                <View style={styles.divider} />

                {/* Items preview */}
                <Text style={styles.itemSummary} numberOfLines={1}>
                  {firstItemName}
                  {extraCount > 0 ? ` +${extraCount} produk lainnya` : ''}
                </Text>

                {/* Total row */}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Pembayaran:</Text>
                  <Text style={styles.totalPrice}>{formatRupiah(item.total)}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.stone[25],
  },
  header: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[2],
    gap: Spacing[3],
  },
  title: {
    ...Typography.h1,
    color: Colors.stone[800],
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.stone[50],
    borderRadius: Radius.sm,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.stone[100],
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing[2],
    alignItems: 'center',
    borderRadius: Radius.xs,
  },
  tabButtonActive: {
    backgroundColor: Colors.stone[0],
  },
  tabButtonText: {
    ...Typography.bodyS,
    color: Colors.stone[500],
  },
  tabButtonTextActive: {
    fontWeight: '600',
    color: Colors.stone[800],
  },
  listContent: {
    padding: Spacing[4],
    gap: Spacing[3],
    paddingBottom: Spacing[10],
  },
  orderCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[4],
    gap: Spacing[2],
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    flex: 1,
  },
  partyIcon: {
    fontSize: 16,
  },
  partyName: {
    ...Typography.bodyM,
    fontWeight: '600',
    color: Colors.stone[800],
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  statusBadgeText: {
    ...Typography.overline,
    fontSize: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    fontFamily: FontFamily.mono,
  },
  orderDate: {
    ...Typography.bodyS,
    color: Colors.stone[400],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.stone[50],
    marginVertical: 2,
  },
  itemSummary: {
    ...Typography.bodyM,
    color: Colors.stone[700],
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  totalLabel: {
    ...Typography.bodyS,
    color: Colors.stone[500],
  },
  totalPrice: {
    ...Typography.numericPrice,
    fontSize: 15,
    color: Colors.stone[900],
  },
});
