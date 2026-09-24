import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { popup } from '@/lib/popup';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { CaretLeft, Camera, UploadSimple } from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { useSupabase } from '@/lib/supabase-provider';
import { formatRupiah, submitDuePayment, uploadPaymentProof } from '@/services/dues';
import { DesktopShell, useIsDesktop } from '@/components/ui/DesktopShell';
import type { DuePaymentMethod } from '@/types';

/**
 * Pay Dues Screen — PRD v2 §13.3 & §27
 * Manual payment proof submission with verification pipeline.
 */
export default function PayDueScreen() {
  const isDesktop = useIsDesktop();
  const params = useLocalSearchParams<{
    assignmentId: string;
    name?: string;
    amount?: string;
    period?: string;
  }>();

  const { user } = useSupabase();

  const [method, setMethod] = useState<DuePaymentMethod>('bank_transfer');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const amount = Number(params.amount) || 0;

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      popup.warning('Izin Dibutuhkan', 'Mohon izinkan akses galeri untuk mengunggah bukti bayar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!params.assignmentId || !user?.id) {
      popup.error('Error', 'Data tagihan atau user tidak valid.');
      return;
    }

    if (method === 'bank_transfer' && !imageUri) {
      popup.warning('Bukti Dibutuhkan', 'Silakan pilih foto struk / tangkapan layar bukti transfer.');
      return;
    }

    setSubmitting(true);
    try {
      let proofPath: string | null = null;

      // 1. Upload proof to private storage if image selected
      if (imageUri) {
        const uploadRes = await uploadPaymentProof(params.assignmentId, imageUri);
        if (uploadRes.error) {
          popup.error('Gagal Unggah', uploadRes.error.message);
          setSubmitting(false);
          return;
        }
        proofPath = uploadRes.path;
      }

      // 2. Submit payment record
      const { error } = await submitDuePayment({
        assignmentId: params.assignmentId,
        paidByUserId: user.id,
        amount,
        method,
        proofPath,
      });

      if (error) {
        popup.error('Gagal', error.message);
      } else {
        popup.alert(
          'Bukti Pembayaran Terkirim',
          'Pembayaran Anda telah diajukan dan sedang menunggu verifikasi oleh pengurus RT/RW.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/iuran' as any),
            },
          ]
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DesktopShell
      activeKey="/iuran"
      pageTitle="Konfirmasi Pembayaran"
      breadcrumb={['Iuran', 'Bayar']}
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
            <Text style={styles.title}>Konfirmasi Pembayaran</Text>
          </View>
        )}

        <ScrollView contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopScrollContent]}>
        {/* Bill Snapshot Card */}
        <View style={styles.billCard}>
          <Text style={styles.billTitle}>{params.name || 'Iuran Komplek'}</Text>
          {params.period && <Text style={styles.billPeriod}>Periode: {params.period}</Text>}
          <View style={styles.billDivider} />
          <View style={styles.billAmountRow}>
            <Text style={styles.billAmountLabel}>Total Nominal</Text>
            <Text style={styles.billAmountValue}>{formatRupiah(amount)}</Text>
          </View>
        </View>

        {/* Method Picker */}
        <Text style={styles.sectionHeading}>METODE PEMBAYARAN</Text>
        <View style={styles.methodGroup}>
          <TouchableOpacity
            style={[styles.methodOption, method === 'bank_transfer' && styles.methodOptionActive]}
            onPress={() => setMethod('bank_transfer')}
          >
            <Text
              style={[
                styles.methodOptionText,
                method === 'bank_transfer' && styles.methodOptionTextActive,
              ]}
            >
              Transfer Bank
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodOption, method === 'cash' && styles.methodOptionActive]}
            onPress={() => setMethod('cash')}
          >
            <Text
              style={[
                styles.methodOptionText,
                method === 'cash' && styles.methodOptionTextActive,
              ]}
            >
              Tunai ke Pengurus
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodOption, method === 'manual' && styles.methodOptionActive]}
            onPress={() => setMethod('manual')}
          >
            <Text
              style={[
                styles.methodOptionText,
                method === 'manual' && styles.methodOptionTextActive,
              ]}
            >
              Lainnya
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bank info box if transfer */}
        {method === 'bank_transfer' && (
          <View style={styles.bankInfoBox}>
            <Text style={styles.bankInfoTitle}>Rekening Kas Komplek:</Text>
            <Text style={styles.bankInfoText}>Bank BCA: 123-456-7890</Text>
            <Text style={styles.bankInfoText}>A.N. Pengurus Komplekku</Text>
            <Text style={styles.bankInfoHint}>
              *Harap cantumkan nomor rumah pada berita transfer
            </Text>
          </View>
        )}

        {/* Proof of Payment Upload */}
        <Text style={styles.sectionHeading}>BUKTI PEMBAYARAN</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={handlePickImage} activeOpacity={0.8}>
          {imageUri ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <View style={styles.repickOverlay}>
                <Camera size={16} color="#FFFFFF" />
                <Text style={styles.repickText}>Ganti Foto</Text>
              </View>
            </View>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <UploadSimple size={32} color={Colors.stone[400]} />
              <Text style={styles.uploadPrompt}>Pilih foto struk / bukti transfer</Text>
              <Text style={styles.uploadHint}>Format JPG, PNG, atau WEBP (Maks 10MB)</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Submit Button */}
        <Button
          label="Kirim Bukti Pembayaran"
          onPress={handleSubmit}
          loading={submitting}
          variant="primary"
          style={styles.submitBtn}
        />
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
  scrollContent: {
    padding: Spacing[4],
    paddingBottom: Spacing[10],
  },
  desktopScrollContent: {
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
    paddingVertical: Spacing[6],
  },
  billCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[4],
    marginBottom: Spacing[4],
  },
  billTitle: {
    ...Typography.label,
    color: Colors.stone[800],
    fontWeight: '700',
    fontSize: 16,
  },
  billPeriod: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    marginTop: 2,
  },
  billDivider: {
    height: 1,
    backgroundColor: Colors.stone[100],
    marginVertical: Spacing[3],
  },
  billAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billAmountLabel: {
    ...Typography.bodyS,
    color: Colors.stone[500],
  },
  billAmountValue: {
    ...Typography.h2,
    color: Colors.primary[700],
  },
  sectionHeading: {
    ...Typography.overline,
    color: Colors.stone[400],
    marginBottom: Spacing[2],
    letterSpacing: 0.8,
  },
  methodGroup: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  methodOption: {
    flex: 1,
    backgroundColor: Colors.stone[0],
    borderWidth: 1,
    borderColor: Colors.stone[200],
    borderRadius: Radius.sm,
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  methodOptionActive: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[600],
  },
  methodOptionText: {
    ...Typography.bodyS,
    color: Colors.stone[600],
    fontWeight: '600',
    fontSize: 12,
  },
  methodOptionTextActive: {
    color: Colors.primary[800],
    fontWeight: '700',
  },
  bankInfoBox: {
    backgroundColor: Colors.stone[100],
    padding: Spacing[3],
    borderRadius: Radius.sm,
    marginBottom: Spacing[4],
  },
  bankInfoTitle: {
    ...Typography.label,
    color: Colors.stone[800],
    fontSize: 12,
    marginBottom: 2,
  },
  bankInfoText: {
    ...Typography.bodyM,
    color: Colors.stone[700],
    fontWeight: '600',
  },
  bankInfoHint: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  uploadBox: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[200],
    borderStyle: 'dashed',
    padding: Spacing[4],
    alignItems: 'center',
    marginBottom: Spacing[6],
    minHeight: 140,
    justifyContent: 'center',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    gap: Spacing[1],
  },
  uploadPrompt: {
    ...Typography.label,
    color: Colors.stone[700],
    fontSize: 13,
    marginTop: Spacing[1],
  },
  uploadHint: {
    ...Typography.bodyS,
    color: Colors.stone[400],
    fontSize: 11,
  },
  previewContainer: {
    width: '100%',
    height: 180,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  repickOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  repickText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: Spacing[2],
  },
});
