import React, { useState } from 'react';
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
import { CaretLeft, CheckCircle } from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/lib/supabase-provider';
import { useComplex } from '@/lib/complex-provider';
import { createExpense } from '@/services/finance';
import { DesktopShell, useIsDesktop } from '@/components/ui/DesktopShell';
import type { ExpenseCategory } from '@/types/database';

export default function CreateExpenseScreen() {
  const isDesktop = useIsDesktop();
  const { user } = useAuth();
  const { activeRole } = useComplex();
  const isManager = activeRole === 'developer' || activeRole === 'rw' || activeRole === 'rt';

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('waste');
  const [amountStr, setAmountStr] = useState('');
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const categories: { id: ExpenseCategory; label: string }[] = [
    { id: 'security', label: 'Keamanan / Satpam' },
    { id: 'waste', label: 'Kebersihan / Sampah' },
    { id: 'maintenance', label: 'Perbaikan Lingkungan' },
    { id: 'utilities', label: 'Listrik & Air Fasum' },
    { id: 'administration', label: 'Administrasi RT/RW' },
    { id: 'social', label: 'Kegiatan Sosial Warga' },
    { id: 'other', label: 'Lain-lain' },
  ];

  const handleSubmit = async () => {
    if (!user?.id || !isManager) {
      popup.error('Akses Ditolak', 'Hanya pengurus yang berwenang mencatat pengeluaran kas.');
      return;
    }

    if (!title.trim()) {
      popup.warning('Validasi Gagal', 'Mohon isi judul pengeluaran.');
      return;
    }

    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
      popup.warning('Validasi Gagal', 'Nominal pengeluaran harus lebih besar dari 0.');
      return;
    }

    if (!expenseDate.trim()) {
      popup.warning('Validasi Gagal', 'Mohon isi tanggal pengeluaran (YYYY-MM-DD).');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await createExpense({
        title: title.trim(),
        category,
        amount,
        expenseDate: expenseDate.trim(),
        description: description.trim() || undefined,
        createdBy: user.id,
      });

      if (error || !data) {
        popup.error('Gagal Menyimpan', error?.message || 'Terjadi kesalahan sistem.');
      } else {
        popup.alert(
          'Sukses',
          'Catatan pengeluaran berhasil disimpan ke buku kas komplek.',
          [{ text: 'Selesai', onPress: () => router.back() }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isManager) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Akses Terbatas</Text>
          <Text style={styles.errorDesc}>Hanya pengurus yang berhak mencatat pengeluaran.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <DesktopShell
      activeKey="/finance"
      pageTitle="Catat Pengeluaran Kas"
      breadcrumb={['Keuangan', 'Buku Kas', 'Catat Pengeluaran']}
    >
      <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top', 'bottom']}>
        {/* Header */}
        {!isDesktop && (
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/finance' as any))}
              hitSlop={8}
              style={styles.backButton}
            >
              <CaretLeft size={20} color={Colors.stone[700]} />
              <Text style={styles.backButtonText}>Kembali</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Catat Pengeluaran Kas</Text>
            <Text style={styles.subtitle}>
              Setiap pengeluaran kas komplek akan tercatat transparan untuk seluruh warga.
            </Text>
          </View>
        )}

        <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Judul Pengeluaran</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Honor Satpam & Kebersihan Bulan Ini"
              placeholderTextColor={Colors.stone[400]}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kategori Pengeluaran</Text>
            <View style={styles.categoryGrid}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.catPill,
                    category === c.id && styles.catPillActive,
                  ]}
                  onPress={() => setCategory(c.id)}
                >
                  <Text
                    style={[
                      styles.catPillText,
                      category === c.id && styles.catPillTextActive,
                    ]}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nominal (Rp)</Text>
            <TextInput
              style={styles.input}
              placeholder="1000000"
              placeholderTextColor={Colors.stone[400]}
              keyboardType="numeric"
              value={amountStr}
              onChangeText={setAmountStr}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tanggal Pengeluaran (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.stone[400]}
              value={expenseDate}
              onChangeText={setExpenseDate}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Deskripsi / Catatan Tambahan</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Rincian pembelian alat kebersihan atau catatan operasional..."
              placeholderTextColor={Colors.stone[400]}
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <CheckCircle size={18} color="#FFFFFF" weight="bold" />
              <Text style={styles.submitBtnText}>Simpan Pengeluaran</Text>
            </>
          )}
        </TouchableOpacity>
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
    gap: Spacing[3],
  },
  inputGroup: {
    gap: Spacing[1],
  },
  label: {
    ...Typography.bodyS,
    fontWeight: '600',
    color: Colors.stone[700],
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
    height: 80,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    marginTop: 4,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.md,
    backgroundColor: Colors.stone[100],
    borderWidth: 1,
    borderColor: Colors.stone[200],
  },
  catPillActive: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[600],
  },
  catPillText: {
    ...Typography.bodyS,
    color: Colors.stone[700],
  },
  catPillTextActive: {
    color: Colors.primary[800],
    fontWeight: '700',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary[600],
    paddingVertical: Spacing[3],
    borderRadius: Radius.md,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
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
  desktopContent: {
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
    paddingVertical: Spacing[6],
  },
});
