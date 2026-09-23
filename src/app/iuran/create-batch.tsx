import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CaretLeft, CheckCircle, Lightning, Receipt, CalendarBlank } from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useComplex } from '@/lib/complex-provider';
import { getDues, createDue, generateDueBatch, formatRupiah } from '@/services/dues';
import type { Due } from '@/types/database';

export default function CreateBatchBillingScreen() {
  const { activeRole } = useComplex();
  const isManager = activeRole === 'developer' || activeRole === 'rw' || activeRole === 'rt';

  const [duesList, setDuesList] = useState<Due[]>([]);
  const [selectedDueId, setSelectedDueId] = useState<string>('');
  const [newDueName, setNewDueName] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('150000');
  
  // Date calculations
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();

  const [periodStart, setPeriodStart] = useState<string>(`${year}-${month}-01`);
  const [periodEnd, setPeriodEnd] = useState<string>(`${year}-${month}-${String(lastDay).padStart(2, '0')}`);
  const [dueDate, setDueDate] = useState<string>(`${year}-${month}-10`);
  
  const [loading, setLoading] = useState(false);
  const [fetchingDues, setFetchingDues] = useState(true);
  const [result, setResult] = useState<{ generated: number; skipped: number } | null>(null);

  useEffect(() => {
    async function fetchMasterDues() {
      try {
        const { data } = await getDues();
        setDuesList(data);
        if (data.length > 0) {
          setSelectedDueId(data[0].id);
          setAmountStr(String(data[0].amount));
        }
      } finally {
        setFetchingDues(false);
      }
    }
    void fetchMasterDues();
  }, []);

  const handleSelectDue = (due: Due) => {
    setSelectedDueId(due.id);
    setAmountStr(String(due.amount));
  };

  const handleGenerate = async () => {
    if (!isManager) {
      Alert.alert('Akses Ditolak', 'Hanya pengurus (RT/RW/Developer) yang dapat membuat tagihan massal.');
      return;
    }

    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Validasi Gagal', 'Nominal iuran harus lebih besar dari 0.');
      return;
    }

    if (!periodStart || !periodEnd || !dueDate) {
      Alert.alert('Validasi Gagal', 'Lengkapi tanggal periode dan jatuh tempo.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let finalDueId = selectedDueId;

      // If user wants to create a new due master
      if (selectedDueId === 'new') {
        if (!newDueName.trim()) {
          Alert.alert('Validasi Gagal', 'Masukkan nama iuran baru.');
          setLoading(false);
          return;
        }
        const { data: created, error: createErr } = await createDue({
          name: newDueName.trim(),
          amount,
          dueType: 'monthly',
        });
        if (createErr || !created) {
          Alert.alert('Gagal', createErr?.message || 'Gagal membuat jenis iuran.');
          setLoading(false);
          return;
        }
        finalDueId = created.id;
      }

      const { data, error } = await generateDueBatch({
        dueId: finalDueId,
        periodStart,
        periodEnd,
        dueDate,
        amount,
      });

      if (error) {
        Alert.alert('Gagal Generate', error.message);
      } else if (data) {
        setResult({
          generated: data.generated_count,
          skipped: data.skipped_count,
        });
        Alert.alert(
          'Sukses Generate Tagihan',
          `Berhasil membuat ${data.generated_count} tagihan untuk rumah berpenghuni. (${data.skipped_count} tagihan dilewati karena sudah ada).`,
          [{ text: 'Selesai', onPress: () => router.back() }]
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  if (!isManager) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Akses Terbatas</Text>
          <Text style={styles.errorDesc}>Hanya pengurus yang berwenang membuat tagihan iuran massal.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backButton}
        >
          <CaretLeft size={20} color={Colors.stone[700]} />
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Generate Tagihan Iuran</Text>
        <Text style={styles.subtitle}>
          Pembuatan tagihan iuran massal bulanan untuk seluruh rumah terisi.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Step 1: Jenis Iuran */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>PILIH JENIS IURAN</Text>
          {fetchingDues ? (
            <ActivityIndicator color={Colors.primary[600]} style={{ marginVertical: 12 }} />
          ) : (
            <View style={styles.duePickerList}>
              {duesList.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={[
                    styles.dueChoice,
                    selectedDueId === d.id && styles.dueChoiceActive,
                  ]}
                  onPress={() => handleSelectDue(d)}
                >
                  <Receipt
                    size={20}
                    color={selectedDueId === d.id ? Colors.primary[700] : Colors.stone[500]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.dueChoiceName,
                        selectedDueId === d.id && styles.dueChoiceNameActive,
                      ]}
                    >
                      {d.name}
                    </Text>
                    <Text style={styles.dueChoiceSub}>{formatRupiah(d.amount)} / bulan</Text>
                  </View>
                  {selectedDueId === d.id && (
                    <CheckCircle size={18} color={Colors.primary[600]} weight="fill" />
                  )}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[
                  styles.dueChoice,
                  selectedDueId === 'new' && styles.dueChoiceActive,
                ]}
                onPress={() => setSelectedDueId('new')}
              >
                <Lightning
                  size={20}
                  color={selectedDueId === 'new' ? Colors.primary[700] : Colors.stone[500]}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.dueChoiceName,
                      selectedDueId === 'new' && styles.dueChoiceNameActive,
                    ]}
                  >
                    + Buat Jenis Iuran Baru
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {selectedDueId === 'new' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Iuran Baru</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: Iuran Pengelolaan Lingkungan (IPL)"
                placeholderTextColor={Colors.stone[400]}
                value={newDueName}
                onChangeText={setNewDueName}
              />
            </View>
          )}
        </View>

        {/* Step 2: Nominal & Periode */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>DETAIL TAGIHAN</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nominal per Rumah (Rp)</Text>
            <TextInput
              style={styles.input}
              placeholder="150000"
              placeholderTextColor={Colors.stone[400]}
              keyboardType="numeric"
              value={amountStr}
              onChangeText={setAmountStr}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Periode Mulai</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.stone[400]}
                value={periodStart}
                onChangeText={setPeriodStart}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Periode Akhir</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.stone[400]}
                value={periodEnd}
                onChangeText={setPeriodEnd}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Batas Tanggal Jatuh Tempo</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.stone[400]}
              value={dueDate}
              onChangeText={setDueDate}
            />
          </View>
        </View>

        {/* Step 3: Target & Jaminan Idempotensi */}
        <View style={styles.infoBanner}>
          <CalendarBlank size={20} color={Colors.primary[700]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoBannerTitle}>Target Otomatis & Aman</Text>
            <Text style={styles.infoBannerDesc}>
              Sistem database akan otomatis mengalokasikan tagihan ke seluruh rumah yang berstatus
              terisi (&apos;occupied&apos;). Tagihan yang sudah pernah dibuat untuk periode yang sama
              tidak akan digandakan (idempotent).
            </Text>
          </View>
        </View>

        {/* Result banner if generated */}
        {result && (
          <View style={styles.successBanner}>
            <CheckCircle size={24} color="#16A34A" weight="bold" />
            <View style={{ flex: 1 }}>
              <Text style={styles.successTitle}>Berhasil Digenerate!</Text>
              <Text style={styles.successDesc}>
                {result.generated} tagihan dibuat, {result.skipped} dilewati (sudah ada).
              </Text>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.generateBtn, loading && styles.btnDisabled]}
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.generateBtnText}>Generate Tagihan Sekarang</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    color: Colors.stone[900],
    fontSize: 20,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.bodyS,
    color: Colors.stone[500],
  },
  content: {
    padding: Spacing[4],
    gap: Spacing[4],
  },
  card: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.stone[200],
  },
  cardHeading: {
    ...Typography.overline,
    color: Colors.stone[500],
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: Spacing[3],
  },
  duePickerList: {
    gap: Spacing[2],
  },
  dueChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[200],
    backgroundColor: Colors.stone[50],
  },
  dueChoiceActive: {
    borderColor: Colors.primary[600],
    backgroundColor: Colors.primary[50],
  },
  dueChoiceName: {
    ...Typography.bodyM,
    fontWeight: '600',
    color: Colors.stone[800],
  },
  dueChoiceNameActive: {
    color: Colors.primary[800],
  },
  dueChoiceSub: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    marginTop: 2,
  },
  inputGroup: {
    marginTop: Spacing[3],
  },
  row: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  label: {
    ...Typography.bodyS,
    fontWeight: '600',
    color: Colors.stone[700],
    marginBottom: Spacing[1],
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
  infoBanner: {
    flexDirection: 'row',
    gap: Spacing[3],
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
    borderRadius: Radius.md,
    padding: Spacing[3],
  },
  infoBannerTitle: {
    ...Typography.bodyS,
    fontWeight: '700',
    color: Colors.primary[800],
    marginBottom: 2,
  },
  infoBannerDesc: {
    ...Typography.bodyS,
    color: Colors.primary[700],
    lineHeight: 18,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: Radius.md,
    padding: Spacing[3],
  },
  successTitle: {
    ...Typography.bodyS,
    fontWeight: '700',
    color: '#15803D',
  },
  successDesc: {
    ...Typography.bodyS,
    color: '#166534',
  },
  generateBtn: {
    backgroundColor: Colors.primary[600],
    paddingVertical: Spacing[3],
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[2],
  },
  btnDisabled: {
    opacity: 0.6,
  },
  generateBtnText: {
    ...Typography.label,
    color: '#FFFFFF',
    fontWeight: '700',
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
