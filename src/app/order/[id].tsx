import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { popup } from '@/lib/popup';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  CaretLeft,
  PersonSimpleWalk,
  Moped,
  Prohibit,
} from 'phosphor-react-native';
import { Colors, FontFamily, Radius, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useSupabase } from '@/lib/supabase-provider';
import { getOrderById, updateOrderStatus, type OrderWithDetails } from '@/services/orders';
import { formatRupiah, formatTimeAgo } from '@/services/products';
import { getOrCreateConversation } from '@/services/chat';
import { DesktopShell, useIsDesktop } from '@/components/ui/DesktopShell';
import type { OrderStatus } from '@/types';

const STATUS_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'pending', label: 'Menunggu' },
  { key: 'confirmed', label: 'Dikonfirmasi' },
  { key: 'processing', label: 'Diproses' },
  { key: 'ready', label: 'Siap' },
  { key: 'completed', label: 'Selesai' },
];

/**
 * Order Detail Screen — PRD §34, §36 & desain.md §18
 * Order status timeline, immutable price snapshots, party details, and status transition actions.
 */
export default function OrderDetailScreen() {
  const isDesktop = useIsDesktop();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSupabase();

  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = async () => {
    if (!id) return;
    try {
      const { data, error: fetchErr } = await getOrderById(id);
      if (fetchErr) {
        setError(fetchErr.message);
      } else if (!data) {
        setError('Pesanan tidak ditemukan');
      } else {
        setOrder(data);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (id) {
      getOrderById(id).then(({ data, error: fetchErr }) => {
        if (!isMounted) return;
        if (fetchErr) setError(fetchErr.message);
        else if (data) setOrder(data);
        setLoading(false);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleUpdateStatus = (newStatus: OrderStatus, actionPrompt: string) => {
    const isCancel = newStatus === 'cancelled';
    popup.confirm({
      title: 'Konfirmasi Status',
      message: actionPrompt,
      confirmText: isCancel ? 'Ya, Batalkan' : 'Ya, Lanjutkan',
      cancelText: 'Batal',
      destructive: isCancel,
      onConfirm: async () => {
        if (!order?.id) return;
        setUpdating(true);
        try {
          const res = await updateOrderStatus(order.id, newStatus);
          if (res.error) {
            popup.error('Gagal', res.error.message);
          } else {
            setOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
            popup.success('Sukses', `Status pesanan diubah menjadi: ${newStatus}`);
          }
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  const handleChatCounterpart = async () => {
    if (!order || !user) return;
    const counterpartId = user.id === order.seller?.user_id ? order.buyer_id : order.seller?.user_id;
    if (!counterpartId) {
      popup.info('Info', 'Pengguna tidak ditemukan.');
      return;
    }
    const { data: conv, error: convErr } = await getOrCreateConversation(
      user.id,
      counterpartId,
      order.community_id || ''
    );
    if (conv) {
      router.push(`/chat/${conv.id}` as any);
    } else {
      popup.error('Gagal', convErr?.message || 'Tidak dapat memulai chat');
    }
  };

  if (loading) {
    return <LoadingState fullScreen />;
  }

  if (error || !order) {
    return (
      <DesktopShell
        activeKey="/orders"
        pageTitle="Detail Pesanan"
        breadcrumb={['Pasar', 'Pesanan', 'Detail']}
      >
        <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top', 'bottom']}>
          {!isDesktop && (
            <View style={styles.navBar}>
              <Pressable
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/(main)/orders' as any))}
                hitSlop={8}
                style={styles.backTouch}
              >
                <CaretLeft size={20} color={Colors.stone[700]} />
                <Text style={styles.backButton}>Kembali</Text>
              </Pressable>
            </View>
          )}
          <ErrorState
            title="Pesanan Tidak Ditemukan"
            description={error || 'Pesanan tidak tersedia.'}
            onRetry={loadOrder}
          />
        </SafeAreaView>
      </DesktopShell>
    );
  }

  const isSeller = user?.id === order.seller?.user_id;
  const isBuyer = user?.id === order.buyer_id;

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <DesktopShell
      activeKey="/orders"
      pageTitle={`Pesanan #${order.order_number}`}
      breadcrumb={['Pasar', 'Pesanan', `#${order.order_number}`]}
    >
      <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top', 'bottom']}>
        {/* Nav Header */}
        {!isDesktop && (
          <View style={styles.navBar}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(main)/orders' as any))}
              hitSlop={8}
              style={styles.backTouch}
            >
              <CaretLeft size={20} color={Colors.stone[700]} />
              <Text style={styles.backButton}>Kembali</Text>
            </Pressable>
            <Text style={styles.navTitle} numberOfLines={1}>
              Detail Pesanan
            </Text>
            <View style={{ width: 48 }} />
          </View>
        )}

        <ScrollView contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopScrollContent]}>
        {/* Order Identifier Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.orderLabel}>NOMOR PESANAN</Text>
              <Text style={styles.orderNumber}>{order.order_number}</Text>
            </View>
            <Text style={styles.orderTime}>{formatTimeAgo(order.created_at)}</Text>
          </View>

          {/* Stepper progress (if not cancelled) */}
          {isCancelled ? (
            <View style={styles.cancelledBox}>
              <Prohibit size={20} color={Colors.stone[600]} />
              <Text style={styles.cancelledText}>Pesanan Ini Telah Dibatalkan</Text>
            </View>
          ) : (
            <View style={styles.stepperRow}>
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;
                return (
                  <View key={step.key} style={styles.stepItem}>
                    <View
                      style={[
                        styles.stepCircle,
                        isPassed && styles.stepCirclePassed,
                        isCurrent && styles.stepCircleCurrent,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepNum,
                          isPassed && styles.stepNumPassed,
                        ]}
                      >
                        {idx + 1}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.stepLabel,
                        isPassed && styles.stepLabelPassed,
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Counterparty Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isSeller ? 'Informasi Pembeli' : 'Informasi Penjual'}
          </Text>
          <View style={styles.partyRow}>
            <View style={styles.partyAvatar}>
              <Text style={styles.partyAvatarText}>
                {isSeller
                  ? (order.buyer?.full_name || 'W')[0]?.toUpperCase()
                  : (order.seller?.store_name || 'T')[0]?.toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.partyTitle}>
                {isSeller ? order.buyer?.full_name : order.seller?.store_name}
              </Text>
              <Text style={styles.partyPhone}>
                {isSeller
                  ? (order.buyer?.phone || (order.buyer as any)?.phone_number || 'Tidak ada nomor telepon')
                  : 'Penjual Warga Terverifikasi'}
              </Text>
            </View>
            <Button
              label="Chat"
              onPress={handleChatCounterpart}
              variant="secondary"
            />
          </View>
        </View>

        {/* Items List (Immutable Snapshots per PRD §73) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rincian Produk</Text>
          <View style={styles.itemsList}>
            {order.items.map((it) => (
              <View key={it.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemSnapshotName}>{it.product_name_snapshot}</Text>
                  <Text style={styles.itemSnapshotDetail}>
                    {it.quantity} × {formatRupiah(it.price_snapshot)}
                  </Text>
                </View>
                <Text style={styles.itemSnapshotTotal}>{formatRupiah(it.subtotal)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Delivery & Notes Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pengiriman & Catatan</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Metode:</Text>
            <View style={styles.methodValueRow}>
              {order.delivery_method === 'manual_delivery' || (order.delivery_method as any) === 'delivery' ? (
                <>
                  <Moped size={16} color={Colors.stone[700]} />
                  <Text style={styles.infoValue}>Antar ke Rumah</Text>
                </>
              ) : (
                <>
                  <PersonSimpleWalk size={16} color={Colors.stone[700]} />
                  <Text style={styles.infoValue}>Ambil Sendiri (Pickup)</Text>
                </>
              )}
            </View>
          </View>
          {order.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Catatan:</Text>
              <Text style={styles.infoValue}>{order.notes}</Text>
            </View>
          )}
        </View>

        {/* Financial Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rincian Pembayaran</Text>
          <View style={styles.financialList}>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Subtotal</Text>
              <Text style={styles.financialVal}>{formatRupiah(order.subtotal)}</Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Biaya Pengantaran</Text>
              <Text style={styles.financialVal}>
                {order.delivery_fee > 0 ? formatRupiah(order.delivery_fee) : 'Gratis'}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.financialRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalVal}>{formatRupiah(order.total)}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons for Seller / Buyer */}
        {!isCancelled && (
          <View style={styles.actionSection}>
            {/* Seller Transitions */}
            {isSeller && (
              <>
                {order.status === 'pending' && (
                  <View style={styles.dualButtons}>
                    <Button
                      label="Tolak Pesanan"
                      onPress={() =>
                        handleUpdateStatus('cancelled', 'Apakah kamu yakin ingin menolak pesanan ini?')
                      }
                      variant="destructive"
                      loading={updating}
                      style={{ flex: 1 }}
                    />
                    <Button
                      label="Konfirmasi Pesanan"
                      onPress={() =>
                        handleUpdateStatus('confirmed', 'Konfirmasi dan terima pesanan ini?')
                      }
                      variant="primary"
                      loading={updating}
                      style={{ flex: 1 }}
                    />
                  </View>
                )}

                {order.status === 'confirmed' && (
                  <Button
                    label="Mulai Proses Pesanan"
                    onPress={() =>
                      handleUpdateStatus('processing', 'Tandai pesanan sedang disiapkan/dimasak?')
                    }
                    variant="primary"
                    loading={updating}
                    fullWidth
                  />
                )}

                {order.status === 'processing' && (
                  <Button
                    label="Pesanan Siap Diambil / Diantar"
                    onPress={() =>
                      handleUpdateStatus('ready', 'Tandai pesanan sudah siap?')
                    }
                    variant="primary"
                    loading={updating}
                    fullWidth
                  />
                )}

                {order.status === 'ready' && (
                  <Button
                    label="Tandai Pesanan Selesai"
                    onPress={() =>
                      handleUpdateStatus('completed', 'Selesaikan pesanan ini dan konfirmasi pembayaran?')
                    }
                    variant="primary"
                    loading={updating}
                    fullWidth
                  />
                )}
              </>
            )}

            {/* Buyer Cancellation */}
            {isBuyer && order.status === 'pending' && (
              <Button
                label="Batalkan Pesanan"
                onPress={() =>
                  handleUpdateStatus('cancelled', 'Apakah kamu yakin ingin membatalkan pesanan ini?')
                }
                variant="destructive"
                loading={updating}
                fullWidth
              />
            )}
          </View>
        )}
      </ScrollView>
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
  scrollContent: {
    padding: Spacing[4],
    gap: Spacing[4],
    paddingBottom: Spacing[10],
  },
  desktopScrollContent: {
    maxWidth: 760,
    alignSelf: 'center',
    width: '100%',
    paddingVertical: Spacing[6],
  },
  headerCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[4],
    gap: Spacing[4],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderLabel: {
    ...Typography.overline,
    color: Colors.stone[400],
    fontSize: 10,
  },
  orderNumber: {
    ...Typography.bodyS,
    fontSize: 14,
    color: Colors.stone[800],
    fontFamily: FontFamily.mono,
    marginTop: 2,
  },
  orderTime: {
    ...Typography.bodyS,
    color: Colors.stone[400],
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing[2],
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.stone[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCirclePassed: {
    backgroundColor: Colors.primary[600],
  },
  stepCircleCurrent: {
    borderWidth: 2,
    borderColor: Colors.primary[200],
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.stone[400],
  },
  stepNumPassed: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 9,
    color: Colors.stone[400],
    textAlign: 'center',
  },
  stepLabelPassed: {
    color: Colors.stone[700],
    fontWeight: '600',
  },
  cancelledBox: {
    flexDirection: 'row',
    backgroundColor: Colors.stone[100],
    padding: Spacing[3],
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  cancelledText: {
    ...Typography.bodyM,
    color: Colors.stone[700],
    fontWeight: '600',
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
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  partyAvatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  partyAvatarText: {
    ...Typography.h3,
    color: Colors.primary[700],
  },
  partyTitle: {
    ...Typography.bodyL,
    fontWeight: '600',
    color: Colors.stone[800],
  },
  partyPhone: {
    ...Typography.bodyS,
    color: Colors.stone[500],
  },
  itemsList: {
    gap: Spacing[3],
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemSnapshotName: {
    ...Typography.bodyM,
    fontWeight: '600',
    color: Colors.stone[800],
  },
  itemSnapshotDetail: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    marginTop: 2,
  },
  itemSnapshotTotal: {
    ...Typography.numericPrice,
    fontSize: 14,
    color: Colors.stone[800],
  },
  infoRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  infoLabel: {
    ...Typography.bodyM,
    color: Colors.stone[500],
    width: 80,
  },
  infoValue: {
    ...Typography.bodyM,
    color: Colors.stone[800],
    flex: 1,
  },
  methodValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    flex: 1,
  },
  financialList: {
    gap: Spacing[2],
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  financialLabel: {
    ...Typography.bodyM,
    color: Colors.stone[600],
  },
  financialVal: {
    ...Typography.numericPrice,
    fontSize: 14,
    color: Colors.stone[800],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.stone[100],
    marginVertical: 2,
  },
  grandTotalLabel: {
    ...Typography.h3,
    color: Colors.stone[800],
  },
  grandTotalVal: {
    ...Typography.numericPrice,
    fontSize: 18,
    color: Colors.stone[900],
  },
  actionSection: {
    marginTop: Spacing[2],
  },
  dualButtons: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
});
