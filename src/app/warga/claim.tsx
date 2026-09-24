import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { popup } from '@/lib/popup';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  CaretLeft,
  House as HouseIcon,
  CheckCircle,
  Clock,
  XCircle,
  UserCheck,
  Users,
} from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/lib/supabase-provider';
import { useComplex } from '@/lib/complex-provider';
import { getHouses } from '@/services/residents';
import { submitHouseClaim, getMyClaims, type HouseClaimWithDetails } from '@/services/claims';
import { joinFamilyByCode } from '@/services/family';
import type { House, HouseClaimOccupancy } from '@/types/database';
import { DesktopShell, useIsDesktop } from '@/components/ui/DesktopShell';

export default function ClaimHouseScreen() {
  const isDesktop = useIsDesktop();
  const { user } = useAuth();
  const { household } = useComplex();

  const [familyCodeInput, setFamilyCodeInput] = useState('');
  const [joiningByCode, setJoiningByCode] = useState(false);
  const [houses, setHouses] = useState<House[]>([]);
  const [selectedHouseId, setSelectedHouseId] = useState<string>('');
  const [occupancyStatus, setOccupancyStatus] = useState<HouseClaimOccupancy>('owner');
  const [notes, setNotes] = useState<string>('');
  const [claims, setClaims] = useState<HouseClaimWithDetails[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [housesRes, claimsRes] = await Promise.all([
        getHouses(),
        getMyClaims(user.id),
      ]);
      setHouses(housesRes.data);
      setClaims(claimsRes.data);
      if (housesRes.data.length > 0 && !selectedHouseId) {
        setSelectedHouseId(housesRes.data[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedHouseId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSubmit = async () => {
    if (!user?.id) return;

    if (!selectedHouseId) {
      popup.warning('Validasi Gagal', 'Silakan pilih rumah yang akan Anda klaim.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await submitHouseClaim({
        userId: user.id,
        houseId: selectedHouseId,
        occupancyStatus,
        notes: notes.trim() || undefined,
      });

      if (error) {
        popup.error('Gagal Mengajukan Klaim', error.message);
      } else {
        popup.alert(
          'Klaim Terkirim!',
          'Pengajuan klaim rumah Anda berhasil dikirim ke pengurus RT/RW untuk diverifikasi.',
          [{ text: 'OK', onPress: () => loadData() }]
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!user?.id) return;
    const clean = familyCodeInput.trim().toUpperCase();
    if (clean.length !== 7) {
      popup.warning('Validasi Gagal', 'ID Keluarga harus terdiri dari 7 karakter/digit.');
      return;
    }

    setJoiningByCode(true);
    try {
      const { data, error } = await joinFamilyByCode(user.id, clean);
      if (error || !data) {
        popup.error('Gagal Terhubung', error?.message || 'ID Keluarga tidak ditemukan.');
      } else {
        popup.alert(
          'Berhasil Terhubung!',
          `Anda berhasil bergabung ke rumah ${data.block ? `Blok ${data.block} ` : ''}No. ${data.house_number}.`,
          [{ text: 'OK', onPress: () => router.replace('/(main)/profile' as any) }]
        );
      }
    } finally {
      setJoiningByCode(false);
    }
  };

  const pendingClaim = claims.find((c) => c.status === 'pending');

  return (
    <DesktopShell
      activeKey="/profile"
      pageTitle="Klaim Rumah Saya"
      breadcrumb={['Profil', 'Klaim Rumah']}
    >
      <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top', 'bottom']}>
        {/* Header */}
        {!isDesktop && (
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(main)' as any))}
              hitSlop={8}
              style={styles.backButton}
            >
              <CaretLeft size={20} color={Colors.stone[700]} />
              <Text style={styles.backButtonText}>Kembali</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Klaim Rumah Saya</Text>
            <Text style={styles.subtitle}>
              Hubungkan akun Anda dengan nomor rumah di komplek untuk mengakses iuran dan layanan.
            </Text>
          </View>
        )}

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary[600]} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]} keyboardShouldPersistTaps="handled">
          {/* Current Linked House Banner if any */}
          {household?.house && (
            <View style={styles.activeHouseCard}>
              <CheckCircle size={22} color="#16A34A" weight="bold" />
              <View style={{ flex: 1 }}>
                <Text style={styles.activeHouseTitle}>Rumah Anda Saat Ini</Text>
                <Text style={styles.activeHouseSub}>
                  Blok {household.house.block || '-'} No. {household.house.house_number || '-'} (
                  {household.member?.relationship === 'owner' ? 'Pemilik' : 'Penyewa'})
                </Text>
              </View>
            </View>
          )}

          {/* Pending Claim Banner */}
          {pendingClaim && (
            <View style={styles.pendingCard}>
              <Clock size={24} color="#D97706" weight="bold" />
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingTitle}>Klaim Sedang Ditinjau Pengurus</Text>
                <Text style={styles.pendingSub}>
                  Pengajuan klaim rumah Blok {pendingClaim.house?.block || '-'} No.{' '}
                  {pendingClaim.house?.house_number || '-'} sedang dalam antrean verifikasi RT/RW.
                </Text>
              </View>
            </View>
          )}

          {/* Quick Join via Family Code */}
          <View style={styles.codeCard}>
            <View style={styles.codeHeader}>
              <Users size={20} color={Colors.primary[700]} weight="bold" />
              <Text style={styles.codeTitle}>Punya ID Keluarga? Gabung Langsung</Text>
            </View>
            <Text style={styles.codeDesc}>
              Khusus anggota keluarga (anak/istri). Masukkan 7 digit ID Keluarga dari Kepala Keluarga Anda untuk langsung terhubung tanpa menunggu verifikasi.
            </Text>
            <View style={styles.codeInputRow}>
              <TextInput
                style={styles.codeInput}
                placeholder="Contoh: K7A93F2"
                placeholderTextColor={Colors.stone[400]}
                autoCapitalize="characters"
                maxLength={7}
                value={familyCodeInput}
                onChangeText={(t) => setFamilyCodeInput(t.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              />
              <TouchableOpacity
                style={[styles.codeBtn, joiningByCode && { opacity: 0.7 }]}
                onPress={handleJoinByCode}
                disabled={joiningByCode}
              >
                <Text style={styles.codeBtnText}>
                  {joiningByCode ? '...' : 'Gabung'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ATAU KLAIM RUMAH SEBAGAI KEPALA KELUARGA</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Claim Submission Form */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>PILIH UNIT RUMAH</Text>

            <View style={styles.houseList}>
              {houses.slice(0, 20).map((h) => (
                <TouchableOpacity
                  key={h.id}
                  style={[
                    styles.houseItem,
                    selectedHouseId === h.id && styles.houseItemActive,
                  ]}
                  onPress={() => setSelectedHouseId(h.id)}
                >
                  <HouseIcon
                    size={20}
                    color={selectedHouseId === h.id ? Colors.primary[700] : Colors.stone[500]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.houseItemText,
                        selectedHouseId === h.id && styles.houseItemTextActive,
                      ]}
                    >
                      Blok {h.block || '-'} No. {h.house_number || '-'}
                    </Text>
                    <Text style={styles.houseItemSub}>
                      Status: {h.status === 'occupied' ? 'Terisi' : 'Kosong'}
                    </Text>
                  </View>
                  {selectedHouseId === h.id && (
                    <CheckCircle size={18} color={Colors.primary[600]} weight="fill" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            {/* Occupancy Status Selector */}
            <Text style={styles.label}>Status Kepemilikan / Huni</Text>
            <View style={styles.occupancyRow}>
              {[
                { id: 'owner', label: 'Pemilik Rumah' },
                { id: 'renter', label: 'Penyewa / Kontrak' },
                { id: 'family', label: 'Keluarga' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.occupancyBtn,
                    occupancyStatus === opt.id && styles.occupancyBtnActive,
                  ]}
                  onPress={() => setOccupancyStatus(opt.id as HouseClaimOccupancy)}
                >
                  <Text
                    style={[
                      styles.occupancyBtnText,
                      occupancyStatus === opt.id && styles.occupancyBtnTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Catatan Tambahan (Opsional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Contoh: Baru serah terima kunci bulan ini..."
                placeholderTextColor={Colors.stone[400]}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (submitting || Boolean(pendingClaim)) && styles.btnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting || Boolean(pendingClaim)}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <UserCheck size={18} color="#FFFFFF" weight="bold" />
                  <Text style={styles.submitBtnText}>
                    {pendingClaim ? 'Menunggu Peninjauan' : 'Kirim Pengajuan Klaim'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Past Claims History */}
          {claims.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.historyHeading}>RIWAYAT PENGAJUAN KLAIM</Text>
              {claims.map((c) => (
                <View key={c.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyHouse}>
                      Blok {c.house?.block || '-'} No. {c.house?.house_number || '-'}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        c.status === 'approved'
                          ? { backgroundColor: '#DCFCE7' }
                          : c.status === 'pending'
                          ? { backgroundColor: '#FEF3C7' }
                          : { backgroundColor: '#FEE2E2' },
                      ]}
                    >
                      {c.status === 'approved' ? (
                        <CheckCircle size={12} color="#16A34A" weight="bold" />
                      ) : c.status === 'pending' ? (
                        <Clock size={12} color="#D97706" weight="bold" />
                      ) : (
                        <XCircle size={12} color="#DC2626" weight="bold" />
                      )}
                      <Text
                        style={[
                          styles.statusText,
                          c.status === 'approved'
                            ? { color: '#15803D' }
                            : c.status === 'pending'
                            ? { color: '#B45309' }
                            : { color: '#B91C1C' },
                        ]}
                      >
                        {c.status === 'approved'
                          ? 'Disetujui'
                          : c.status === 'pending'
                          ? 'Menunggu'
                          : 'Ditolak'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.historyMeta}>
                    Status: {c.occupancy_status === 'owner' ? 'Pemilik' : 'Penyewa'} • Diajukan:{' '}
                    {c.created_at.split('T')[0]}
                  </Text>
                  {c.rejection_reason && (
                    <Text style={styles.rejectionText}>Alasan penolakan: {c.rejection_reason}</Text>
                  )}
                </View>
              ))}
            </View>
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
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
    paddingVertical: Spacing[6],
  },
  activeHouseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: Radius.lg,
    padding: Spacing[3],
  },
  activeHouseTitle: {
    ...Typography.bodyS,
    fontWeight: '700',
    color: '#166534',
  },
  activeHouseSub: {
    ...Typography.bodyS,
    color: '#15803D',
    marginTop: 2,
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: Radius.lg,
    padding: Spacing[3],
  },
  pendingTitle: {
    ...Typography.bodyS,
    fontWeight: '700',
    color: '#B45309',
  },
  pendingSub: {
    ...Typography.bodyS,
    color: '#92400E',
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.stone[200],
    gap: Spacing[3],
  },
  cardHeading: {
    ...Typography.overline,
    color: Colors.stone[500],
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  houseList: {
    gap: Spacing[2],
    maxHeight: 220,
  },
  houseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[200],
    backgroundColor: Colors.stone[50],
  },
  houseItemActive: {
    borderColor: Colors.primary[600],
    backgroundColor: Colors.primary[50],
  },
  houseItemText: {
    ...Typography.bodyM,
    fontWeight: '600',
    color: Colors.stone[800],
  },
  houseItemTextActive: {
    color: Colors.primary[800],
  },
  houseItemSub: {
    ...Typography.bodyS,
    color: Colors.stone[400],
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.stone[100],
    marginVertical: Spacing[1],
  },
  label: {
    ...Typography.bodyS,
    fontWeight: '600',
    color: Colors.stone[700],
  },
  occupancyRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  occupancyBtn: {
    flex: 1,
    paddingVertical: Spacing[2],
    paddingHorizontal: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[200],
    backgroundColor: Colors.stone[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  occupancyBtnActive: {
    borderColor: Colors.primary[600],
    backgroundColor: Colors.primary[50],
  },
  occupancyBtnText: {
    ...Typography.bodyS,
    color: Colors.stone[600],
    fontSize: 12,
  },
  occupancyBtnTextActive: {
    color: Colors.primary[800],
    fontWeight: '700',
  },
  inputGroup: {
    gap: Spacing[1],
  },
  input: {
    backgroundColor: Colors.stone[50],
    borderWidth: 1,
    borderColor: Colors.stone[200],
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    fontSize: 14,
    color: Colors.stone[900],
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary[600],
    paddingVertical: Spacing[3],
    borderRadius: Radius.md,
    marginTop: Spacing[2],
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    ...Typography.label,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  historySection: {
    gap: Spacing[2],
  },
  historyHeading: {
    ...Typography.overline,
    color: Colors.stone[500],
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  historyCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    padding: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.stone[200],
    gap: Spacing[1],
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyHouse: {
    ...Typography.bodyM,
    fontWeight: '700',
    color: Colors.stone[900],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  statusText: {
    ...Typography.bodyS,
    fontWeight: '700',
    fontSize: 11,
  },
  historyMeta: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    fontSize: 12,
  },
  rejectionText: {
    ...Typography.bodyS,
    color: '#DC2626',
    fontStyle: 'italic',
    marginTop: 2,
  },
  codeCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: Radius.lg,
    padding: Spacing[4],
    gap: Spacing[2],
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  codeTitle: {
    ...Typography.h3,
    fontSize: 15,
    fontWeight: '700',
    color: '#166534',
  },
  codeDesc: {
    ...Typography.bodyS,
    fontSize: 12,
    color: '#15803D',
    lineHeight: 16,
  },
  codeInputRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: Spacing[1],
  },
  codeInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    fontSize: 14,
    fontWeight: '700',
    color: '#14532D',
    letterSpacing: 1.5,
  },
  codeBtn: {
    backgroundColor: Colors.primary[700],
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeBtnText: {
    ...Typography.label,
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginVertical: Spacing[2],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.stone[200],
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.stone[400],
    letterSpacing: 0.5,
  },
});
