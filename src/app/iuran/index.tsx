import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import {
  CaretLeft,
  Receipt,
  CheckCircle,
  Clock,
  WarningCircle,
  XCircle,
  PlusCircle,
  CheckSquareOffset,
  Wallet,
  CaretRight,
} from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useComplex } from '@/lib/complex-provider';
import { getMyHouseDues, formatRupiah, type DueAssignmentWithDetails } from '@/services/dues';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { isModuleEnabled } from '@/config/modules';

/**
 * Module Iuran — PRD v2 §13 & §6.2
 * Overview of resident house billings, payment proofs, and historical status.
 */
export default function IuranScreen() {
  const { household, activeRole } = useComplex();
  const houseId = household?.house?.id;
  const isManager = activeRole === 'developer' || activeRole === 'rw' || activeRole === 'rt';

  const [dues, setDues] = useState<DueAssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDues = useCallback(async () => {
    if (!houseId) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await getMyHouseDues(houseId);
      setDues(data);
    } finally {
      setLoading(false);
    }
  }, [houseId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      void loadDues();
    });
  }, [loadDues]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDues();
    setRefreshing(false);
  };

  const unpaidItems = dues.filter((d) => d.status === 'unpaid');
  const pendingItems = dues.filter((d) => d.status === 'pending_verification');

  const totalUnpaid = unpaidItems.reduce((sum, d) => sum + Number(d.amount_snapshot), 0);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#DCFCE7' }]}>
            <CheckCircle size={12} color="#16A34A" weight="bold" />
            <Text style={[styles.statusBadgeText, { color: '#15803D' }]}>Lunas</Text>
          </View>
        );
      case 'pending_verification':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7' }]}>
            <Clock size={12} color="#D97706" weight="bold" />
            <Text style={[styles.statusBadgeText, { color: '#B45309' }]}>Verifikasi</Text>
          </View>
        );
      case 'rejected':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#FEE2E2' }]}>
            <XCircle size={12} color="#DC2626" weight="bold" />
            <Text style={[styles.statusBadgeText, { color: '#B91C1C' }]}>Ditolak</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#FEE2E2' }]}>
            <WarningCircle size={12} color="#DC2626" weight="bold" />
            <Text style={[styles.statusBadgeText, { color: '#B91C1C' }]}>Belum Bayar</Text>
          </View>
        );
    }
  };

  if (!isModuleEnabled('dues')) {
    return <Redirect href="/(main)" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={styles.header}>
        {router.canGoBack() && (
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={8}
            style={styles.backButton}
          >
            <CaretLeft size={20} color={Colors.stone[700]} />
            <Text style={styles.backButtonText}>Kembali</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Iuran Komplek</Text>
        <Text style={styles.subtitle}>
          {household?.house
            ? `Tagihan & riwayat iuran rumah Blok ${household.house.block || '-'} No. ${household.house.house_number || '-'}`
            : isManager
            ? 'Pusat pengelolaan iuran dan keuangan RT/RW'
            : 'Layanan iuran warga komplek'}
        </Text>
      </View>

      {loading ? (
        <LoadingState fullScreen={false} style={{ flex: 1 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary[600]]}
            />
          }
        >
          {/* Manager Operations Panel */}
          {isManager && (
            <View style={styles.managerCard}>
              <Text style={styles.managerCardTitle}>PENGELOLAAN IURAN PENGURUS</Text>
              <View style={styles.managerActionRow}>
                <TouchableOpacity
                  style={styles.managerActionBtn}
                  onPress={() => router.push('/iuran/create-batch' as any)}
                >
                  <PlusCircle size={20} color={Colors.primary[700]} weight="bold" />
                  <Text style={styles.managerActionBtnText}>Generate Tagihan</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.managerActionBtn}
                  onPress={() => router.push('/iuran/verify' as any)}
                >
                  <CheckSquareOffset size={20} color="#16A34A" weight="bold" />
                  <Text style={styles.managerActionBtnText}>Verifikasi Bayar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Transparency Shortcut Card */}
          <TouchableOpacity
            style={styles.financeCard}
            onPress={() => router.push('/finance' as any)}
          >
            <View style={styles.financeIconWrap}>
              <Wallet size={20} color={Colors.primary[700]} weight="bold" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.financeCardTitle}>Buku Kas & Transparansi Keuangan</Text>
              <Text style={styles.financeCardSub}>
                Lihat saldo kas komplek, total pemasukan, dan catatan pengeluaran
              </Text>
            </View>
            <CaretRight size={18} color={Colors.stone[400]} />
          </TouchableOpacity>

          {/* Resident House Dues Section */}
          {household?.house ? (
            <>
              {/* Summary Card */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>TOTAL TAGIHAN BELUM DIBAYAR</Text>
                <Text style={styles.summaryAmount}>{formatRupiah(totalUnpaid)}</Text>
                <Text style={styles.summaryDetail}>
                  {unpaidItems.length} tagihan belum dibayar
                  {pendingItems.length > 0 ? ` • ${pendingItems.length} menunggu verifikasi` : ''}
                </Text>
              </View>

              {/* Dues List */}
              <Text style={styles.sectionHeading}>DAFTAR TAGIHAN RUMAH SAYA</Text>

              {dues.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Receipt size={32} color={Colors.stone[300]} />
                  <Text style={styles.emptyCardTitle}>Belum Ada Tagihan</Text>
                  <Text style={styles.emptyCardSub}>
                    Pengurus belum membuat tagihan iuran untuk rumah Anda.
                  </Text>
                </View>
              ) : (
            dues.map((item) => (
              <View key={item.id} style={styles.dueCard}>
                <View style={styles.dueCardHeader}>
                  <View style={styles.dueTitleWrap}>
                    <Text style={styles.dueName}>{item.due?.name || 'Iuran Komplek'}</Text>
                    <Text style={styles.duePeriod}>
                      Periode: {item.period_start} s/d {item.period_end}
                    </Text>
                  </View>
                  {renderStatusBadge(item.status)}
                </View>

                <View style={styles.dueDivider} />

                <View style={styles.dueFooter}>
                  <View>
                    <Text style={styles.dueAmountLabel}>Nominal Tagihan</Text>
                    <Text style={styles.dueAmount}>
                      {formatRupiah(Number(item.amount_snapshot))}
                    </Text>
                  </View>

                  {item.status === 'unpaid' && (
                    <TouchableOpacity
                      style={styles.payButton}
                      onPress={() =>
                        router.push({
                          pathname: '/iuran/pay' as any,
                          params: {
                            assignmentId: item.id,
                            name: item.due?.name,
                            amount: item.amount_snapshot,
                            period: `${item.period_start} - ${item.period_end}`,
                          },
                        })
                      }
                    >
                      <Text style={styles.payButtonText}>Bayar Sekarang</Text>
                    </TouchableOpacity>
                  )}

                  {item.status === 'pending_verification' && (
                    <Text style={styles.pendingNote}>Bukti sedang dicek pengurus</Text>
                  )}

                  {item.status === 'paid' && (
                    <Text style={styles.paidNote}>Pembayaran telah diverifikasi</Text>
                  )}
                </View>
              </View>
            ))
          )}
          </>
          ) : (
            <View style={styles.noHouseCard}>
              <EmptyState
                title="Data Rumah Belum Terhubung"
                description={
                  isManager
                    ? "Akun pengurus Anda tidak terhubung ke rumah spesifik, namun Anda tetap dapat mengelola iuran komplek melalui menu di atas."
                    : "Akun Anda belum terhubung dengan nomor rumah di komplek ini."
                }
                actionLabel={!isManager ? "Ajukan Klaim Rumah" : undefined}
                onAction={!isManager ? () => router.push('/warga/claim' as any) : undefined}
              />
            </View>
          )}
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
  header: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[3],
    backgroundColor: Colors.stone[0],
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[100],
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing[2],
    alignSelf: 'flex-start',
  },
  backButtonText: {
    ...Typography.label,
    color: Colors.stone[600],
    fontSize: 13,
  },
  title: {
    ...Typography.h2,
    color: Colors.stone[800],
  },
  subtitle: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    marginTop: 2,
  },
  scrollContent: {
    padding: Spacing[4],
    paddingBottom: Spacing[10],
  },
  summaryCard: {
    backgroundColor: Colors.primary[700],
    borderRadius: Radius.md,
    padding: Spacing[4],
    marginBottom: Spacing[4],
  },
  summaryLabel: {
    ...Typography.overline,
    color: Colors.primary[200],
    fontSize: 10,
    letterSpacing: 0.8,
  },
  summaryAmount: {
    ...Typography.h1,
    color: '#FFFFFF',
    marginVertical: Spacing[1],
  },
  summaryDetail: {
    ...Typography.bodyS,
    color: Colors.primary[100],
    fontSize: 12,
  },
  sectionHeading: {
    ...Typography.overline,
    color: Colors.stone[400],
    marginBottom: Spacing[2],
    letterSpacing: 0.8,
  },
  dueCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[4],
    marginBottom: Spacing[3],
  },
  dueCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dueTitleWrap: {
    flex: 1,
    marginRight: Spacing[2],
  },
  dueName: {
    ...Typography.label,
    color: Colors.stone[800],
    fontWeight: '700',
    fontSize: 14,
  },
  duePeriod: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  statusBadgeText: {
    ...Typography.overline,
    fontSize: 10,
    fontWeight: '700',
  },
  dueDivider: {
    height: 1,
    backgroundColor: Colors.stone[100],
    marginVertical: Spacing[3],
  },
  dueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueAmountLabel: {
    ...Typography.bodyS,
    color: Colors.stone[400],
    fontSize: 11,
  },
  dueAmount: {
    ...Typography.label,
    color: Colors.stone[800],
    fontWeight: '700',
    fontSize: 15,
  },
  payButton: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.sm,
  },
  payButtonText: {
    ...Typography.label,
    color: '#FFFFFF',
    fontSize: 12,
  },
  pendingNote: {
    ...Typography.bodyS,
    color: '#D97706',
    fontStyle: 'italic',
    fontSize: 12,
  },
  paidNote: {
    ...Typography.bodyS,
    color: '#16A34A',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[6],
    alignItems: 'center',
  },
  emptyCardTitle: {
    ...Typography.label,
    color: Colors.stone[700],
    marginTop: Spacing[2],
  },
  emptyCardSub: {
    ...Typography.bodyS,
    color: Colors.stone[400],
    textAlign: 'center',
    marginTop: 4,
  },
  managerCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.lg,
    padding: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.primary[200],
    gap: Spacing[2],
  },
  managerCardTitle: {
    ...Typography.overline,
    color: Colors.primary[800],
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  managerActionRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  managerActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: Colors.stone[50],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[200],
  },
  managerActionBtnText: {
    ...Typography.label,
    fontWeight: '700',
    color: Colors.stone[800],
    fontSize: 12,
  },
  financeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.lg,
    padding: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.stone[200],
  },
  financeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  financeCardTitle: {
    ...Typography.bodyS,
    fontWeight: '700',
    color: Colors.stone[900],
  },
  financeCardSub: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    marginTop: 2,
    fontSize: 11,
  },
  noHouseCard: {
    paddingVertical: Spacing[4],
  },
});

