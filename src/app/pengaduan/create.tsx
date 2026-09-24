import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { popup } from '@/lib/popup';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSupabase } from '@/lib/supabase-provider';
import { useComplex } from '@/lib/complex-provider';
import { createComplaint, getComplaintCategories } from '@/services/complaints';
import { DesktopShell, useIsDesktop } from '@/components/ui/DesktopShell';
import type { ComplaintCategory, ComplaintPriority } from '@/types';

/**
 * Create Complaint Screen — PRD v2 §16
 * Form for residents to report neighborhood issues.
 */
export default function CreateComplaintScreen() {
  const isDesktop = useIsDesktop();
  const { user } = useSupabase();
  const { household } = useComplex();

  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationNote, setLocationNote] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>('normal');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getComplaintCategories().then(({ data }) => {
      setCategories(data);
      if (data.length > 0) {
        setSelectedCategoryId(data[0].id);
      }
    });
  }, []);

  const handleSubmit = async () => {
    if (!user) {
      popup.error('Error', 'User tidak terautentikasi.');
      return;
    }

    if (!title.trim()) {
      popup.warning('Judul Wajib', 'Mohon masukkan judul pengaduan.');
      return;
    }

    if (!description.trim()) {
      popup.warning('Deskripsi Wajib', 'Mohon jelaskan kendala atau aspirasi Anda.');
      return;
    }

    if (!selectedCategoryId) {
      popup.warning('Kategori Wajib', 'Mohon pilih kategori pengaduan.');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await createComplaint({
        reporterId: user.id,
        categoryId: selectedCategoryId,
        houseId: household?.house?.id || null,
        title: title.trim(),
        description: description.trim(),
        locationNote: locationNote.trim() || null,
        priority,
      });

      if (error) {
        popup.error('Gagal', error.message);
      } else {
        popup.alert(
          'Laporan Diterima',
          'Pengaduan Anda telah dikirim dan akan segera ditinjau oleh pengurus komplek.',
          [
            {
              text: 'Lihat Pengaduan',
              onPress: () => router.replace(`/pengaduan/${data?.id}` as any),
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
      activeKey="/pengaduan"
      pageTitle="Buat Pengaduan Warga"
      breadcrumb={['Pelayanan', 'Pengaduan', 'Buat Laporan']}
    >
      <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top', 'bottom']}>
        {/* Header */}
        {!isDesktop && (
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/pengaduan' as any))}
              hitSlop={8}
              style={styles.backButton}
            >
              <CaretLeft size={20} color={Colors.stone[700]} />
              <Text style={styles.backButtonText}>Kembali</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Buat Pengaduan Warga</Text>
          </View>
        )}

        <ScrollView contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopScrollContent]}>
        {/* Category Selector */}
        <Text style={styles.sectionHeading}>PILIH KATEGORI</Text>
        <View style={styles.categoryWrap}>
          {categories.map((c) => {
            const isSelected = selectedCategoryId === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedCategoryId(c.id)}
              >
                <Text
                  style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}
                >
                  {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Title Input */}
        <Text style={styles.sectionHeading}>JUDUL LAPORAN</Text>
        <Input
          placeholder="Contoh: Lampu jalan depan gang mati"
          value={title}
          onChangeText={setTitle}
        />

        {/* Description Input */}
        <Text style={styles.sectionHeading}>DESKRIPSI LENGKAP</Text>
        <Input
          placeholder="Jelaskan detail kendala, dampak yang dirasakan, dan harapan penyelesaian..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={{ minHeight: 90 }}
        />

        {/* Location Note */}
        <Text style={styles.sectionHeading}>LOKASI KEJADIAN / PATOKAN</Text>
        <Input
          placeholder="Contoh: Depan pos satpam Blok B"
          value={locationNote}
          onChangeText={setLocationNote}
        />

        {/* Priority Picker */}
        <Text style={styles.sectionHeading}>TINGKAT URGENSI</Text>
        <View style={styles.priorityRow}>
          {(['low', 'normal', 'high', 'urgent'] as ComplaintPriority[]).map((p) => {
            const isSelected = priority === p;
            const labels: Record<ComplaintPriority, string> = {
              low: 'Rendah',
              normal: 'Normal',
              high: 'Tinggi',
              urgent: 'Darurat',
            };
            return (
              <TouchableOpacity
                key={p}
                style={[styles.priorityChip, isSelected && styles.priorityChipActive]}
                onPress={() => setPriority(p)}
              >
                <Text
                  style={[
                    styles.priorityChipText,
                    isSelected && styles.priorityChipTextActive,
                  ]}
                >
                  {labels[p]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Submit */}
        <Button
          label="Kirim Laporan Pengaduan"
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
  sectionHeading: {
    ...Typography.overline,
    color: Colors.stone[500],
    marginTop: Spacing[3],
    marginBottom: Spacing[2],
    letterSpacing: 0.8,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  categoryChip: {
    backgroundColor: Colors.stone[0],
    borderWidth: 1,
    borderColor: Colors.stone[200],
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[600],
  },
  categoryChipText: {
    ...Typography.bodyS,
    color: Colors.stone[600],
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: Colors.primary[800],
    fontWeight: '700',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  priorityChip: {
    flex: 1,
    backgroundColor: Colors.stone[0],
    borderWidth: 1,
    borderColor: Colors.stone[200],
    paddingVertical: Spacing[2],
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  priorityChipActive: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[600],
  },
  priorityChipText: {
    ...Typography.bodyS,
    color: Colors.stone[600],
    fontWeight: '600',
    fontSize: 12,
  },
  priorityChipTextActive: {
    color: Colors.primary[800],
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: Spacing[6],
  },
  desktopScrollContent: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
    paddingVertical: Spacing[6],
  },
});
