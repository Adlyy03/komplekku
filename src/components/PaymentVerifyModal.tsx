import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { popup } from '@/lib/popup';
import { Image } from 'expo-image';
import { X, CheckCircle, XCircle, Receipt, House, Calendar, CurrencyCircleDollar } from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { useSupabase } from '@/lib/supabase-provider';
import {
  formatRupiah,
  getPaymentProofUrl,
  verifyDuePayment,
  type DueAssignmentWithDetails,
} from '@/services/dues';

interface PaymentVerifyModalProps {
  visible: boolean;
  assignment: DueAssignmentWithDetails | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentVerifyModal({
  visible,
  assignment,
  onClose,
  onSuccess,
}: PaymentVerifyModalProps) {
  const { user } = useSupabase();
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [loadingProof, setLoadingProof] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const latestPayment = assignment?.payments && assignment.payments.length > 0
    ? assignment.payments[assignment.payments.length - 1]
    : null;

  useEffect(() => {
    if (!visible || !latestPayment?.proof_path) {
      Promise.resolve().then(() => {
        setProofUrl(null);
        setShowRejectInput(false);
        setRejectionReason('');
      });
      return;
    }

    let isMounted = true;
    Promise.resolve().then(() => {
      setLoadingProof(true);
    });
    getPaymentProofUrl(latestPayment.proof_path)
      .then((res) => {
        if (isMounted) {
          setProofUrl(res.url);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingProof(false);
      });

    return () => {
      isMounted = false;
    };
  }, [visible, latestPayment?.proof_path]);

  if (!assignment || !latestPayment) return null;

  const handleApprove = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await verifyDuePayment({
        paymentId: latestPayment.id,
        assignmentId: assignment.id,
        status: 'approved',
        verifiedBy: user.id,
      });

      if (error) {
        popup.error('Gagal Memverifikasi', error.message);
      } else {
        popup.success('Sukses', 'Pembayaran telah diverifikasi Lunas.');
        onSuccess();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!user) return;
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }

    if (!rejectionReason.trim()) {
      popup.warning('Alasan Penolakan', 'Mohon isi alasan mengapa pembayaran ditolak.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await verifyDuePayment({
        paymentId: latestPayment.id,
        assignmentId: assignment.id,
        status: 'rejected',
        verifiedBy: user.id,
        rejectionReason: rejectionReason.trim(),
      });

      if (error) {
        popup.error('Gagal Menolak', error.message);
      } else {
        popup.success('Sukses', 'Pembayaran telah ditolak.');
        onSuccess();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Verifikasi Bukti Pembayaran</Text>
              <Text style={styles.subtitle}>Tinjau transfer dan konfirmasi status tagihan</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <X size={20} color={Colors.stone[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            {/* Info Box */}
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Receipt size={16} color={Colors.stone[500]} />
                <Text style={styles.infoLabel}>Nama Tagihan:</Text>
                <Text style={styles.infoValue}>{assignment.due?.name || 'Iuran Komplek'}</Text>
              </View>

              <View style={styles.infoRow}>
                <House size={16} color={Colors.stone[500]} />
                <Text style={styles.infoLabel}>Rumah:</Text>
                <Text style={styles.infoValue}>
                  {assignment.house?.block ? `Blok ${assignment.house.block} ` : ''}
                  No. {assignment.house?.house_number || '-'} (RT {assignment.house?.rt?.code || '01'})
                </Text>
              </View>

              <View style={styles.infoRow}>
                <CurrencyCircleDollar size={16} color={Colors.stone[500]} />
                <Text style={styles.infoLabel}>Jumlah Transfer:</Text>
                <Text style={[styles.infoValue, { fontWeight: '700', color: Colors.primary[700] }]}>
                  {formatRupiah(latestPayment.amount || assignment.amount_snapshot)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Calendar size={16} color={Colors.stone[500]} />
                <Text style={styles.infoLabel}>Metode Bayar:</Text>
                <Text style={styles.infoValue}>
                  {latestPayment.method === 'bank_transfer'
                    ? 'Transfer Bank'
                    : latestPayment.method === 'cash'
                    ? 'Tunai'
                    : 'Lainnya'}
                </Text>
              </View>
            </View>

            {/* Proof Image Box */}
            <Text style={styles.proofHeading}>Foto / Gambar Bukti Transfer:</Text>
            {loadingProof ? (
              <View style={styles.imagePlaceholder}>
                <ActivityIndicator color={Colors.primary[600]} />
                <Text style={styles.loadingText}>Memuat bukti pembayaran...</Text>
              </View>
            ) : proofUrl ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: proofUrl }}
                  style={styles.proofImage}
                  contentFit="contain"
                  transition={200}
                />
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.noProofText}>Tidak ada lampiran foto bukti transfer.</Text>
              </View>
            )}

            {/* Rejection input when reject clicked */}
            {showRejectInput && (
              <View style={styles.rejectionBox}>
                <Text style={styles.rejectionLabel}>Alasan Penolakan:</Text>
                <TextInput
                  style={styles.rejectionInput}
                  placeholder="Contoh: Nominal transfer tidak sesuai atau foto buram."
                  placeholderTextColor={Colors.stone[400]}
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  multiline
                  numberOfLines={2}
                />
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <Button
              label={showRejectInput ? 'Konfirmasi Tolak' : 'Tolak'}
              variant="destructive"
              icon={<XCircle size={16} color={Colors.semantic.error[500]} weight="bold" />}
              loading={submitting}
              onPress={handleReject}
              style={{ flex: 1 }}
            />
            <Button
              label="Verifikasi Lunas"
              variant="primary"
              icon={<CheckCircle size={16} color="#FFFFFF" weight="bold" />}
              loading={submitting}
              onPress={handleApprove}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  card: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '90%',
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.lg,
    padding: Spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[3],
    paddingBottom: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[100],
  },
  title: {
    ...Typography.h3,
    color: Colors.stone[800],
  },
  subtitle: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    flexGrow: 0,
    maxHeight: 450,
  },
  scrollContent: {
    paddingBottom: Spacing[2],
  },
  infoBox: {
    backgroundColor: Colors.stone[50],
    borderRadius: Radius.md,
    padding: Spacing[3],
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  infoLabel: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    width: 110,
  },
  infoValue: {
    ...Typography.bodyS,
    color: Colors.stone[800],
    flex: 1,
  },
  proofHeading: {
    ...Typography.label,
    color: Colors.stone[700],
    marginBottom: Spacing[2],
  },
  imageContainer: {
    width: '100%',
    height: 220,
    backgroundColor: Colors.stone[100],
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: Spacing[3],
  },
  proofImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.stone[50],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.stone[300],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[3],
    gap: Spacing[2],
  },
  loadingText: {
    ...Typography.bodyS,
    color: Colors.stone[500],
  },
  noProofText: {
    ...Typography.bodyS,
    color: Colors.stone[400],
  },
  rejectionBox: {
    marginTop: Spacing[2],
    marginBottom: Spacing[3],
  },
  rejectionLabel: {
    ...Typography.bodyS,
    fontWeight: '600',
    color: Colors.semantic.error[700],
    marginBottom: Spacing[1],
  },
  rejectionInput: {
    backgroundColor: Colors.stone[50],
    borderWidth: 1,
    borderColor: Colors.semantic.error[500],
    borderRadius: Radius.md,
    padding: Spacing[3],
    fontSize: 13,
    color: Colors.stone[800],
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginTop: Spacing[3],
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: Colors.stone[100],
  },
});
