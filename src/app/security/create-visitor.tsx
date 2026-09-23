import React, { useState } from 'react';
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
import { CaretLeft, QrCode } from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/lib/supabase-provider';
import { useComplex } from '@/lib/complex-provider';
import { createVisitorPass } from '@/services/security';

export default function CreateVisitorScreen() {
  const { user } = useAuth();
  const { household } = useComplex();
  const houseId = household?.house?.id;

  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [visitDate, setVisitDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [purpose, setPurpose] = useState('Bertamu / Silaturahmi');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const commonPurposes = [
    'Bertamu / Silaturahmi',
    'Kurir / Kirim Paket',
    'Ojek Online',
    'Tukang / Renovasi',
    'Layanan Servis',
    'Lainnya',
  ];

  const handleSubmit = async () => {
    if (!user?.id) return;

    if (!houseId) {
      Alert.alert(
        'Rumah Belum Terhubung',
        'Anda harus menghubungkan akun dengan nomor rumah terlebih dahulu untuk membuat izin tamu.'
      );
      return;
    }

    if (!guestName.trim()) {
      Alert.alert('Validasi Gagal', 'Mohon isi nama tamu yang akan berkunjung.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await createVisitorPass({
        hostUserId: user.id,
        houseId,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim() || undefined,
        vehiclePlate: vehiclePlate.trim() || undefined,
        visitDate,
        purpose,
        notes: notes.trim() || undefined,
      });

      if (error || !data) {
        Alert.alert('Gagal Membuat Izin', error?.message || 'Terjadi kesalahan sistem.');
      } else {
        Alert.alert(
          'Izin Tamu Berhasil Dibuat!',
          `Kode Akses Gerbang: ${data.access_code}\n\nBagikan kode ini kepada tamu untuk ditunjukkan ke satpam di gerbang utama komplek.`,
          [{ text: 'Lihat Daftar Tamu', onPress: () => router.back() }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
          <CaretLeft size={20} color={Colors.stone[700]} />
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Buat Izin Masuk Tamu</Text>
        <Text style={styles.subtitle}>
          Tamu Anda akan mendapatkan kode akses digital untuk pemeriksaan di pos satpam.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Tamu / Pengunjung</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Bpk. Bambang Sutrisno"
              placeholderTextColor={Colors.stone[400]}
              value={guestName}
              onChangeText={setGuestName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nomor WhatsApp / HP Tamu (Opsional)</Text>
            <TextInput
              style={styles.input}
              placeholder="0812xxxxxxxx"
              placeholderTextColor={Colors.stone[400]}
              keyboardType="phone-pad"
              value={guestPhone}
              onChangeText={setGuestPhone}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Plat Nomor Kendaraan (Opsional)</Text>
            <TextInput
              style={styles.input}
              placeholder="B 1234 XYZ"
              placeholderTextColor={Colors.stone[400]}
              autoCapitalize="characters"
              value={vehiclePlate}
              onChangeText={setVehiclePlate}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tanggal Kunjungan</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.stone[400]}
              value={visitDate}
              onChangeText={setVisitDate}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tujuan Kunjungan</Text>
            <View style={styles.purposeGrid}>
              {commonPurposes.map((p, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.purposePill,
                    purpose === p && styles.purposePillActive,
                  ]}
                  onPress={() => setPurpose(p)}
                >
                  <Text
                    style={[
                      styles.purposePillText,
                      purpose === p && styles.purposePillTextActive,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Catatan Tambahan untuk Satpam</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Contoh: Mengantar barang pesanan..."
              placeholderTextColor={Colors.stone[400]}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <QrCode size={18} color="#FFFFFF" weight="bold" />
              <Text style={styles.submitBtnText}>Terbitkan Kode Izin Tamu</Text>
            </>
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
    height: 70,
    textAlignVertical: 'top',
  },
  purposeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    marginTop: 4,
  },
  purposePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.md,
    backgroundColor: Colors.stone[100],
    borderWidth: 1,
    borderColor: Colors.stone[200],
  },
  purposePillActive: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[600],
  },
  purposePillText: {
    ...Typography.bodyS,
    color: Colors.stone[700],
  },
  purposePillTextActive: {
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
});
