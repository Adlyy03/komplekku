import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { popup } from '@/lib/popup';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  CaretLeft,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  House as HouseIcon,
} from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/lib/supabase-provider';
import { useComplex } from '@/lib/complex-provider';
import {
  getDueAssignments,
  verifyDuePayment,
  getPaymentProofUrl,
  formatRupiah,
  type DueAssignmentWithDetails,
} from '@/services/dues';
import { DesktopShell, useIsDesktop } from '@/components/ui/DesktopShell';

export default function VerifyDuePaymentsScreen() {
  const isDesktop = useIsDesktop();
  const { user } = useAuth();
  const { activeRole } = useComplex();
  const isManager = activeRole === 'developer' || activeRole === 'rw' || activeRole === 'rt';

  const [assignments, setAssignments] = useState<DueAssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<{ [id: string]: string }>({});
  const [activeProofUrls, setActiveProofUrls] = useState<{ [path: string]: string }>({});

  const loadPendingPayments = useCallback(async () => {
    try {
      const { data, error } = await getDueAssignments({
        status: 'pending_verification',
      });
      if (error) {
        popup.error('Gagal Memuat', error.message);
      } else {
        setAssignments(data);
        // Load signed URLs for proofs
        for (const item of data) {
          const payment = item.payments?.[item.payments.length - 1];
          if (payment?.proof_path && !activeProofUrls[payment.proof_path]) {
            const { url } = await getPaymentProofUrl(payment.proof_path);
            if (url) {
              setActiveProofUrls((prev) => ({ ...prev, [payment.proof_path!]: url }));
            }
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [activeProofUrls]);

  useEffect(() => {
    void loadPendingPayments();
  }, [loadPendingPayments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPendingPayments();
    setRefreshing(false);
  };

  const handleVerify = async (
    item: DueAssignmentWithDetails,
    status: 'approved' | 'rejected'
  ) => {
    if (!user?.id) return;
    const payment = item.payments?.[item.payments.length - 1];
    if (!payment) {
      popup.error('Error', 'Data transaksi pembayaran tidak ditemukan.');
      return;
    }

    const reason = rejectReason[item.id] || '';
    if (status === 'rejected' && !reason.trim()) {
      popup.warning('Catatan Wajib', 'Mohon isi alasan penolakan agar warga mengetahui kendalanya.');
      return;
    }

    setActionLoading(item.id);
    try {
      const { error } = await verifyDuePayment({
        paymentId: payment.id,
        assignmentId: item.id,
        status,
        verifiedBy: user.id,
        rejectionReason: status === 'rejected' ? reason : undefined,
      });

      if (error) {
        popup.error('Gagal', error.message);
      } else {
        popup.success(
          'Sukses',
          status === 'approved' ? 'Pembayaran berhasil disetujui (Lunas).' : 'Pembayaran telah ditolak.'
        );
        await loadPendingPayments();
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (!isManager) {
    return (
      <DesktopShell
        activeKey="/iuran"
        pageTitle="Verifikasi Pembayaran"
        breadcrumb={['Iuran', 'Verifikasi']}
      >
        <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top', 'bottom']}>
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Akses Ditolak</Text>
            <Text style={styles.errorDesc}>Hanya pengurus yang dapat memverifikasi pembayaran iuran.</Text>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/iuran' as any))}
            >
              <Text style={styles.backBtnText}>Kembali</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </DesktopShell>
    );
  }

  return (
    <DesktopShell
      activeKey="/iuran"
      pageTitle="Verifikasi Pembayaran Iuran"
      breadcrumb={['Iuran', 'Verifikasi']}
    >
      <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top', 'bottom']}>
        {/* Header */}
        {!isDesktop && (
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/iuran' as any))}
              hitSlop={8}
              style={styles.backButton}
            >
              <CaretLeft size={20} color={Colors.stone[700]} />
              <Text style={styles.backButtonText}>Kembali</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Verifikasi Pembayaran Iuran</Text>
            <Text style={styles.subtitle}>
              Daftar pembayaran warga yang menunggu konfirmasi bukti transfer/pembayaran.
            </Text>
          </View>
        )}

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary[600]} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]}
            refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary[600]]}
            />
          }
        >
          {assignments.length === 0 ? (
            <View style={styles.emptyCard}>
              <CheckCircle size={40} color="#16A34A" weight="duotone" />
              <Text style={styles.emptyTitle}>Semua Beres</Text>
              <Text style={styles.emptyDesc}>Tidak ada pembayaran yang menunggu verifikasi saat ini.</Text>
            </View>
          ) : (
            assignments.map((item) => {
              const payment = item.payments?.[item.payments.length - 1];
              const proofUrl = payment?.proof_path ? activeProofUrls[payment.proof_path] : null;
              const isItemBusy = actionLoading === item.id;

              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dueName}>{item.due?.name || 'Iuran Komplek'}</Text>
                      <Text style={styles.duePeriod}>
                        Periode: {item.period_start} s/d {item.period_end}
                      </Text>
                    </View>
                    <View style={styles.pendingBadge}>
                      <Clock size={12} color="#D97706" weight="bold" />
                      <Text style={styles.pendingBadgeText}>Menunggu</Text>
                    </View>
                  </View>

                  <View style={styles.houseRow}>
                    <HouseIcon size={16} color={Colors.stone[500]} />
                    <Text style={styles.houseText}>
                      Blok {item.house?.block || '-'} No. {item.house?.house_number || '-'}
                    </Text>
                  </View>

                  <View style={styles.amountBox}>
                    <Text style={styles.amountLabel}>Nominal Pembayaran</Text>
                    <Text style={styles.amountValue}>
                      {formatRupiah(Number(payment?.amount || item.amount_snapshot))}
                    </Text>
                  </View>

                  {/* Proof Attachment */}
                  {proofUrl ? (
                    <View style={styles.proofContainer}>
                      <Text style={styles.proofLabel}>Bukti Transfer:</Text>
                      <Image source={{ uri: proofUrl }} style={styles.proofImage} resizeMode="contain" />
                    </View>
                  ) : payment?.proof_path ? (
                    <View style={styles.proofLoadingBox}>
                      <ActivityIndicator size="small" color={Colors.primary[600]} />
                      <Text style={styles.proofLoadingText}>Memuat bukti transfer...</Text>
                    </View>
                  ) : (
                    <View style={styles.noProofBox}>
                      <FileText size={16} color={Colors.stone[400]} />
                      <Text style={styles.noProofText}>Warga belum mengunggah foto bukti.</Text>
                    </View>
                  )}

                  {/* Reject Note Input */}
                  <View style={styles.rejectInputGroup}>
                    <TextInput
                      style={styles.rejectInput}
                      placeholder="Alasan penolakan (jika ditolak)..."
                      placeholderTextColor={Colors.stone[400]}
                      value={rejectReason[item.id] || ''}
                      onChangeText={(val) =>
                        setRejectReason((prev) => ({ ...prev, [item.id]: val }))
                      }
                    />
                  </View>

                  {/* Actions */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.rejectBtn, isItemBusy && styles.btnDisabled]}
                      onPress={() => handleVerify(item, 'rejected')}
                      disabled={isItemBusy}
                    >
                      <XCircle size={16} color="#DC2626" weight="bold" />
                      <Text style={styles.rejectBtnText}>Tolak</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.approveBtn, isItemBusy && styles.btnDisabled]}
                      onPress={() => handleVerify(item, 'approved')}
                      disabled={isItemBusy}
                    >
                      {isItemBusy ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <CheckCircle size={16} color="#FFFFFF" weight="bold" />
                          <Text style={styles.approveBtnText}>Setujui (Lunas)</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  </DesktopShell>
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
    color: Colors.stone[900],
    fontSize: 20,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.bodyS,
    color: Colors.stone[500],
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Spacing[4],
    gap: Spacing[4],
  },
  desktopContent: {
    maxWidth: 760,
    alignSelf: 'center',
    width: '100%',
    paddingVertical: Spacing[6],
  },
  card: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.stone[200],
    gap: Spacing[3],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  dueName: {
    ...Typography.bodyM,
    fontWeight: '700',
    color: Colors.stone[900],
  },
  duePeriod: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    marginTop: 2,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#FEF3C7',
    borderRadius: Radius.full,
  },
  pendingBadgeText: {
    ...Typography.bodyS,
    fontWeight: '700',
    color: '#B45309',
    fontSize: 11,
  },
  houseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  houseText: {
    ...Typography.bodyS,
    color: Colors.stone[700],
    fontWeight: '600',
  },
  amountBox: {
    backgroundColor: Colors.stone[50],
    padding: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[200],
  },
  amountLabel: {
    ...Typography.bodyS,
    color: Colors.stone[500],
  },
  amountValue: {
    ...Typography.h3,
    color: Colors.primary[700],
    fontWeight: '700',
    marginTop: 2,
  },
  proofContainer: {
    gap: Spacing[2],
  },
  proofLabel: {
    ...Typography.bodyS,
    fontWeight: '600',
    color: Colors.stone[600],
  },
  proofImage: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.stone[100],
    borderRadius: Radius.md,
  },
  proofLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing[3],
    backgroundColor: Colors.stone[50],
    borderRadius: Radius.md,
  },
  proofLoadingText: {
    ...Typography.bodyS,
    color: Colors.stone[500],
  },
  noProofBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: Spacing[2],
  },
  noProofText: {
    ...Typography.bodyS,
    color: Colors.stone[400],
    fontStyle: 'italic',
  },
  rejectInputGroup: {
    marginTop: 2,
  },
  rejectInput: {
    backgroundColor: Colors.stone[50],
    borderWidth: 1,
    borderColor: Colors.stone[200],
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    fontSize: 13,
    color: Colors.stone[900],
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginTop: Spacing[1],
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  rejectBtnText: {
    ...Typography.label,
    color: '#DC2626',
    fontWeight: '600',
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: '#16A34A',
  },
  approveBtnText: {
    ...Typography.label,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  emptyCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.lg,
    padding: Spacing[6],
    alignItems: 'center',
    gap: Spacing[2],
    borderWidth: 1,
    borderColor: Colors.stone[200],
    marginTop: Spacing[8],
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.stone[900],
  },
  emptyDesc: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    textAlign: 'center',
  },
  errorBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[6],
  },
  errorTitle: {
    ...Typography.h2,
    color: Colors.stone[900],
    marginBottom: Spacing[2],
  },
  errorDesc: {
    ...Typography.bodyM,
    color: Colors.stone[500],
    textAlign: 'center',
    marginBottom: Spacing[4],
  },
  backBtn: {
    backgroundColor: Colors.stone[200],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: Radius.md,
  },
  backBtnText: {
    ...Typography.label,
    color: Colors.stone[800],
  },
});
