import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import { CaretLeft, Plus, X, Megaphone } from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useComplex } from '@/lib/complex-provider';
import { useSupabase } from '@/lib/supabase-provider';
import { isModuleEnabled } from '@/config/modules';
import {
  createAnnouncement,
  getAnnouncements,
  type AnnouncementWithAuthor,
} from '@/services/announcements';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import type { AnnouncementTarget } from '@/types/database';

/**
 * Announcements List — PRD v2 §12
 * Scoped notices for Complex, RW, or RT level.
 */
export default function AnnouncementsScreen() {
  const { user } = useSupabase();
  const { household, isDeveloper, isRw, isRt } = useComplex();

  const [announcements, setAnnouncements] = useState<AnnouncementWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Announcement Creation Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [targetType, setTargetType] = useState<AnnouncementTarget>(
    isDeveloper ? 'complex' : isRw ? 'rw' : 'rt'
  );
  const [submitting, setSubmitting] = useState(false);

  const canCreate = isDeveloper || isRw || isRt;

  const loadData = useCallback(async () => {
    try {
      const { data } = await getAnnouncements({
        rwId: household?.rw?.id || null,
        rtId: household?.rt?.id || null,
      });
      setAnnouncements(data);
    } finally {
      setLoading(false);
    }
  }, [household?.rw?.id, household?.rt?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateAnnouncement = async () => {
    if (!user) return;
    if (!annTitle.trim() || !annBody.trim()) {
      Alert.alert('Data Belum Lengkap', 'Judul dan isi pengumuman wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await createAnnouncement({
        authorId: user.id,
        title: annTitle.trim(),
        body: annBody.trim(),
        targetType,
        targetRwId: targetType === 'rw' || targetType === 'rt' ? household?.rw?.id || null : null,
        targetRtId: targetType === 'rt' ? household?.rt?.id || null : null,
      });

      if (error) {
        Alert.alert('Gagal Menerbitkan', error.message);
      } else {
        Alert.alert('Sukses', 'Pengumuman berhasil diterbitkan dan notifikasi telah dikirimkan.');
        setAnnTitle('');
        setAnnBody('');
        setModalVisible(false);
        await loadData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isModuleEnabled('announcements')) {
    return <Redirect href="/(main)" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
            <CaretLeft size={20} color={Colors.stone[700]} />
            <Text style={styles.backButtonText}>Dashboard</Text>
          </TouchableOpacity>

          {canCreate && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#FFFFFF" weight="bold" />
              <Text style={styles.createButtonText}>Buat Pengumuman</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.title}>Pengumuman Warga</Text>
        <Text style={styles.subtitle}>Informasi resmi dari pengurus komplek, RW, dan RT</Text>
      </View>

      {loading ? (
        <LoadingState fullScreen={false} style={{ flex: 1 }} />
      ) : announcements.length === 0 ? (
        <EmptyState
          title="Belum Ada Pengumuman"
          description="Saat ini belum ada pengumuman baru yang diterbitkan oleh pengurus."
        />
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary[600]]}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/announcements/${item.id}` as any)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {item.target_type === 'complex'
                      ? 'SELURUH KOMPLEK'
                      : item.target_type === 'rw'
                      ? 'TINGKAT RW'
                      : 'TINGKAT RT'}
                  </Text>
                </View>
                <Text style={styles.cardDate}>
                  {new Date(item.publish_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardBody} numberOfLines={3}>
                {item.body}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={styles.cardAuthor}>
                  Oleh: {item.author?.full_name || 'Pengurus Komplek'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Announcement Creation Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[2] }}>
                <Megaphone size={20} color={Colors.primary[700]} weight="fill" />
                <Text style={styles.modalTitle}>Buat Pengumuman</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={8}>
                <X size={20} color={Colors.stone[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: Spacing[3] }}>
              {/* Target Scope Selector */}
              <View>
                <Text style={styles.inputLabel}>Jangkauan Pengumuman:</Text>
                <View style={styles.scopeRow}>
                  {isDeveloper && (
                    <TouchableOpacity
                      style={[
                        styles.scopePill,
                        targetType === 'complex' && styles.scopePillActive,
                      ]}
                      onPress={() => setTargetType('complex')}
                    >
                      <Text
                        style={[
                          styles.scopePillText,
                          targetType === 'complex' && styles.scopePillTextActive,
                        ]}
                      >
                        Seluruh Komplek
                      </Text>
                    </TouchableOpacity>
                  )}

                  {(isDeveloper || isRw) && (
                    <TouchableOpacity
                      style={[
                        styles.scopePill,
                        targetType === 'rw' && styles.scopePillActive,
                      ]}
                      onPress={() => setTargetType('rw')}
                    >
                      <Text
                        style={[
                          styles.scopePillText,
                          targetType === 'rw' && styles.scopePillTextActive,
                        ]}
                      >
                        Wilayah RW
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.scopePill,
                      targetType === 'rt' && styles.scopePillActive,
                    ]}
                    onPress={() => setTargetType('rt')}
                  >
                    <Text
                      style={[
                        styles.scopePillText,
                        targetType === 'rt' && styles.scopePillTextActive,
                      ]}
                    >
                      Wilayah RT
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Title Input */}
              <View>
                <Text style={styles.inputLabel}>Judul Pengumuman:</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Contoh: Jadwal Kerja Bakti Hari Minggu"
                  placeholderTextColor={Colors.stone[400]}
                  value={annTitle}
                  onChangeText={setAnnTitle}
                />
              </View>

              {/* Body Input */}
              <View>
                <Text style={styles.inputLabel}>Isi Pengumuman:</Text>
                <TextInput
                  style={[styles.textInput, { minHeight: 100, textAlignVertical: 'top' }]}
                  placeholder="Tuliskan detail pengumuman yang jelas untuk warga..."
                  placeholderTextColor={Colors.stone[400]}
                  multiline
                  numberOfLines={4}
                  value={annBody}
                  onChangeText={setAnnBody}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                label="Batal"
                variant="secondary"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                label={submitting ? 'Menerbitkan...' : 'Publikasikan'}
                variant="primary"
                loading={submitting}
                onPress={handleCreateAnnouncement}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  createButtonText: {
    ...Typography.label,
    fontSize: 12,
    color: '#FFFFFF',
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
  listContent: {
    padding: Spacing[4],
    paddingBottom: Spacing[10],
  },
  card: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[4],
    marginBottom: Spacing[3],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  badge: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  badgeText: {
    ...Typography.overline,
    color: Colors.primary[700],
    fontSize: 9,
    fontWeight: '700',
  },
  cardDate: {
    ...Typography.bodyS,
    color: Colors.stone[400],
    fontSize: 11,
  },
  cardTitle: {
    ...Typography.label,
    color: Colors.stone[800],
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  cardBody: {
    ...Typography.bodyM,
    color: Colors.stone[600],
    lineHeight: 20,
    marginBottom: Spacing[3],
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.stone[100],
    paddingTop: Spacing[2],
  },
  cardAuthor: {
    ...Typography.bodyS,
    color: Colors.stone[400],
    fontSize: 11,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.lg,
    padding: Spacing[5],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.stone[800],
  },
  inputLabel: {
    ...Typography.bodyS,
    fontWeight: '600',
    color: Colors.stone[700],
    marginBottom: Spacing[2],
  },
  scopeRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  scopePill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.stone[200],
    backgroundColor: Colors.stone[50],
  },
  scopePillActive: {
    borderColor: 'transparent',
    backgroundColor: Colors.primary[600],
  },
  scopePillText: {
    ...Typography.bodyS,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.stone[600],
  },
  scopePillTextActive: {
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: Colors.stone[50],
    borderWidth: 1,
    borderColor: Colors.stone[200],
    borderRadius: Radius.md,
    padding: Spacing[3],
    fontSize: 14,
    color: Colors.stone[800],
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginTop: Spacing[4],
  },
});
