import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  CaretLeft,
  CheckCircle,
  PaperPlaneTilt,
  ShieldCheck,
  X,
} from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useSupabase } from '@/lib/supabase-provider';
import { useComplex } from '@/lib/complex-provider';
import {
  addComplaintUpdate,
  getComplaintDetail,
  updateComplaintStatus,
  type ComplaintWithDetails,
} from '@/services/complaints';
import { LoadingState } from '@/components/ui/LoadingState';
import { Button } from '@/components/ui/Button';
import type { ComplaintStatus } from '@/types';

/**
 * Complaint Detail & Tracking — PRD v2 §16
 * Shows status progression, resolution note, and resolution timeline.
 */
export default function ComplaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSupabase();
  const { isDeveloper, isRw, isRt } = useComplex();

  const [complaint, setComplaint] = useState<ComplaintWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Cross-platform status update modal state
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await getComplaintDetail(id);
      setComplaint(data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendComment = async () => {
    if (!user || !id || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const { error } = await addComplaintUpdate({
        complaintId: id,
        authorId: user.id,
        body: commentText.trim(),
      });

      if (error) {
        Alert.alert('Gagal', error.message);
      } else {
        setCommentText('');
        await loadData();
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleOpenStatusModal = (newStatus: ComplaintStatus) => {
    setSelectedStatus(newStatus);
    setStatusNote('');
    setStatusModalVisible(true);
  };

  const handleConfirmStatus = async () => {
    if (!user || !id || !selectedStatus) return;

    setSavingStatus(true);
    try {
      const { error } = await updateComplaintStatus({
        id,
        status: selectedStatus,
        authorId: user.id,
        resolutionNote: selectedStatus === 'resolved' ? statusNote.trim() : undefined,
        updateBody: statusNote.trim() || `Status diubah menjadi ${selectedStatus}`,
      });

      if (error) {
        Alert.alert('Gagal', error.message);
      } else {
        setStatusModalVisible(false);
        Alert.alert('Sukses', 'Status pengaduan berhasil diperbarui.');
        await loadData();
      }
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!complaint) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
            <CaretLeft size={20} color={Colors.stone[700]} />
            <Text style={styles.backButtonText}>Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Pengaduan Tidak Ditemukan</Text>
        </View>
      </SafeAreaView>
    );
  }

  const PIPELINE: { key: ComplaintStatus; label: string }[] = [
    { key: 'submitted', label: 'Diajukan' },
    { key: 'in_review', label: 'Ditinjau' },
    { key: 'in_progress', label: 'Diproses' },
    { key: 'resolved', label: 'Selesai' },
  ];

  const getStepIndex = (status: string) => {
    return PIPELINE.findIndex((p) => p.key === status);
  };

  const currentIndex = getStepIndex(complaint.status);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
          <CaretLeft size={20} color={Colors.stone[700]} />
          <Text style={styles.backButtonText}>Daftar Pengaduan</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Detail Pengaduan</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Pipeline Progress (PRD v2 §16) */}
        <View style={styles.pipelineCard}>
          <Text style={styles.pipelineHeading}>STATUS PENANGANAN</Text>
          <View style={styles.pipelineRow}>
            {PIPELINE.map((step, idx) => {
              const isPastOrCurrent = currentIndex >= idx;
              const isCurrent = complaint.status === step.key;
              return (
                <React.Fragment key={step.key}>
                  <View style={styles.pipelineStep}>
                    <View
                      style={[
                        styles.pipelineCircle,
                        isPastOrCurrent && styles.pipelineCircleActive,
                        isCurrent && styles.pipelineCircleCurrent,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pipelineNum,
                          isPastOrCurrent && styles.pipelineNumActive,
                        ]}
                      >
                        {idx + 1}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.pipelineLabel,
                        isPastOrCurrent && styles.pipelineLabelActive,
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>
                  {idx < PIPELINE.length - 1 && (
                    <View
                      style={[
                        styles.pipelineLine,
                        currentIndex > idx && styles.pipelineLineActive,
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* Complaint Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.categoryRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {complaint.category?.name || 'Umum'}
              </Text>
            </View>
            <Text style={styles.dateText}>
              {new Date(complaint.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <Text style={styles.complaintTitle}>{complaint.title}</Text>
          <Text style={styles.complaintDesc}>{complaint.description}</Text>

          {complaint.location_note && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Lokasi:</Text>
              <Text style={styles.metaValue}>{complaint.location_note}</Text>
            </View>
          )}

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Pelapor:</Text>
            <Text style={styles.metaValue}>
              {complaint.reporter?.full_name || 'Warga Komplek'}
            </Text>
          </View>
        </View>

        {/* Resolution Note if resolved */}
        {complaint.resolution_note && (
          <View style={styles.resolutionCard}>
            <CheckCircle size={20} color="#15803D" weight="fill" />
            <View style={styles.resolutionTextWrap}>
              <Text style={styles.resolutionTitle}>Catatan Penyelesaian Pengurus:</Text>
              <Text style={styles.resolutionBody}>{complaint.resolution_note}</Text>
            </View>
          </View>
        )}

        {/* Pengurus Controls (Developer / RW / RT) */}
        {(isDeveloper || isRw || isRt) && (
          <View style={styles.adminActionCard}>
            <View style={styles.adminActionHeader}>
              <ShieldCheck size={18} color={Colors.primary[700]} weight="bold" />
              <Text style={styles.adminActionTitle}>Aksi Pengurus / Pengelola</Text>
            </View>
            <View style={styles.statusButtonsRow}>
              <TouchableOpacity
                style={styles.actionStatusBtn}
                onPress={() => handleOpenStatusModal('in_review')}
              >
                <Text style={styles.actionStatusBtnText}>Tinjau</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionStatusBtn}
                onPress={() => handleOpenStatusModal('in_progress')}
              >
                <Text style={styles.actionStatusBtnText}>Kerjakan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionStatusBtn, { backgroundColor: '#16A34A' }]}
                onPress={() => handleOpenStatusModal('resolved')}
              >
                <Text style={[styles.actionStatusBtnText, { color: '#FFFFFF' }]}>Selesaikan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionStatusBtn, { backgroundColor: '#DC2626' }]}
                onPress={() => handleOpenStatusModal('rejected')}
              >
                <Text style={[styles.actionStatusBtnText, { color: '#FFFFFF' }]}>Tolak</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Timeline / Updates */}
        <Text style={styles.sectionHeading}>CATATAN & PEMBARUAN ({complaint.updates?.length || 0})</Text>

        {complaint.updates && complaint.updates.length > 0 ? (
          complaint.updates.map((update) => (
            <View key={update.id} style={styles.updateCard}>
              <View style={styles.updateHeader}>
                <Text style={styles.updateAuthor}>
                  {update.author?.full_name || 'Pengurus / Warga'}
                </Text>
                <Text style={styles.updateTime}>
                  {new Date(update.created_at).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Text style={styles.updateBody}>{update.body}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyUpdatesBox}>
            <Text style={styles.emptyUpdatesText}>Belum ada komentar atau tindak lanjut.</Text>
          </View>
        )}
      </ScrollView>

      {/* Comment Input Bar */}
      <View style={styles.commentBar}>
        <TextInput
          placeholder="Tulis pesan atau update kendala..."
          value={commentText}
          onChangeText={setCommentText}
          style={styles.commentInput}
        />
        <TouchableOpacity
          style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
          onPress={handleSendComment}
          disabled={!commentText.trim() || submittingComment}
        >
          <PaperPlaneTilt size={18} color="#FFFFFF" weight="fill" />
        </TouchableOpacity>
      </View>

      {/* Status Update Modal */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Perbarui Status Pengaduan</Text>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)} hitSlop={8}>
                <X size={20} color={Colors.stone[600]} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalStatusInfo}>
              <Text style={styles.modalStatusLabel}>Status Baru:</Text>
              <View
                style={[
                  styles.modalStatusBadge,
                  selectedStatus === 'resolved'
                    ? { backgroundColor: '#DCFCE7' }
                    : selectedStatus === 'rejected'
                    ? { backgroundColor: '#FEE2E2' }
                    : { backgroundColor: '#FEF3C7' },
                ]}
              >
                <Text
                  style={[
                    styles.modalStatusBadgeText,
                    selectedStatus === 'resolved'
                      ? { color: '#15803D' }
                      : selectedStatus === 'rejected'
                      ? { color: '#B91C1C' }
                      : { color: '#B45309' },
                  ]}
                >
                  {(selectedStatus || '').toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.modalInputLabel}>
              {selectedStatus === 'resolved'
                ? 'Catatan Penyelesaian (opsional):'
                : 'Catatan Tindak Lanjut:'}
            </Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="Contoh: Petugas keamanan sudah mengecek dan selesai diperbaiki."
              placeholderTextColor={Colors.stone[400]}
              multiline
              numberOfLines={3}
              value={statusNote}
              onChangeText={setStatusNote}
            />

            <View style={styles.modalActions}>
              <Button
                label="Batal"
                variant="secondary"
                onPress={() => setStatusModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                label={savingStatus ? 'Menyimpan...' : 'Simpan Pembaruan'}
                variant="primary"
                loading={savingStatus}
                onPress={handleConfirmStatus}
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
  pipelineCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[4],
    marginBottom: Spacing[4],
  },
  pipelineHeading: {
    ...Typography.overline,
    color: Colors.stone[400],
    marginBottom: Spacing[3],
    letterSpacing: 0.8,
  },
  pipelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pipelineStep: {
    alignItems: 'center',
  },
  pipelineCircle: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.stone[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  pipelineCircleActive: {
    backgroundColor: Colors.primary[600],
  },
  pipelineCircleCurrent: {
    borderWidth: 2,
    borderColor: Colors.primary[300],
  },
  pipelineNum: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.stone[500],
  },
  pipelineNumActive: {
    color: '#FFFFFF',
  },
  pipelineLabel: {
    ...Typography.overline,
    color: Colors.stone[400],
    fontSize: 10,
  },
  pipelineLabelActive: {
    color: Colors.stone[800],
    fontWeight: '700',
  },
  pipelineLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.stone[200],
    marginHorizontal: 4,
    marginBottom: 16,
  },
  pipelineLineActive: {
    backgroundColor: Colors.primary[600],
  },
  infoCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[4],
    marginBottom: Spacing[4],
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  categoryBadge: {
    backgroundColor: Colors.stone[100],
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  categoryBadgeText: {
    ...Typography.overline,
    color: Colors.stone[600],
    fontSize: 10,
  },
  dateText: {
    ...Typography.bodyS,
    color: Colors.stone[400],
    fontSize: 11,
  },
  complaintTitle: {
    ...Typography.h2,
    color: Colors.stone[800],
    marginBottom: Spacing[2],
  },
  complaintDesc: {
    ...Typography.bodyM,
    color: Colors.stone[700],
    lineHeight: 22,
    marginBottom: Spacing[3],
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: 4,
  },
  metaLabel: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    fontWeight: '600',
    width: 60,
  },
  metaValue: {
    ...Typography.bodyS,
    color: Colors.stone[800],
    flex: 1,
  },
  resolutionCard: {
    flexDirection: 'row',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: Radius.md,
    padding: Spacing[4],
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  resolutionTextWrap: {
    flex: 1,
  },
  resolutionTitle: {
    ...Typography.label,
    color: '#15803D',
    fontWeight: '700',
  },
  resolutionBody: {
    ...Typography.bodyS,
    color: '#166534',
    marginTop: 2,
    lineHeight: 18,
  },
  adminActionCard: {
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
    borderRadius: Radius.md,
    padding: Spacing[3],
    marginBottom: Spacing[4],
  },
  adminActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  adminActionTitle: {
    ...Typography.label,
    color: Colors.primary[800],
    fontWeight: '700',
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  actionStatusBtn: {
    flex: 1,
    backgroundColor: Colors.stone[0],
    borderWidth: 1,
    borderColor: Colors.stone[300],
    borderRadius: Radius.sm,
    paddingVertical: 6,
    alignItems: 'center',
  },
  actionStatusBtnText: {
    ...Typography.label,
    color: Colors.stone[800],
    fontSize: 11,
  },
  sectionHeading: {
    ...Typography.overline,
    color: Colors.stone[400],
    marginBottom: Spacing[2],
    letterSpacing: 0.8,
  },
  updateCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[3],
    marginBottom: Spacing[2],
  },
  updateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  updateAuthor: {
    ...Typography.label,
    color: Colors.stone[800],
    fontWeight: '700',
    fontSize: 12,
  },
  updateTime: {
    ...Typography.bodyS,
    color: Colors.stone[400],
    fontSize: 10,
  },
  updateBody: {
    ...Typography.bodyS,
    color: Colors.stone[600],
    lineHeight: 18,
  },
  emptyUpdatesBox: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[4],
    alignItems: 'center',
  },
  emptyUpdatesText: {
    ...Typography.bodyS,
    color: Colors.stone[400],
  },
  commentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[3],
    backgroundColor: Colors.stone[0],
    borderTopWidth: 1,
    borderTopColor: Colors.stone[100],
    gap: Spacing[2],
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.stone[50],
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    fontSize: 13,
    color: Colors.stone[800],
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.stone[300],
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
    maxWidth: 420,
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
  modalStatusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  modalStatusLabel: {
    ...Typography.bodyM,
    color: Colors.stone[600],
  },
  modalStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  modalStatusBadgeText: {
    ...Typography.label,
    fontSize: 12,
    fontWeight: '700',
  },
  modalInputLabel: {
    ...Typography.bodyS,
    fontWeight: '600',
    color: Colors.stone[700],
    marginBottom: Spacing[2],
  },
  modalTextInput: {
    backgroundColor: Colors.stone[50],
    borderWidth: 1,
    borderColor: Colors.stone[200],
    borderRadius: Radius.md,
    padding: Spacing[3],
    fontSize: 14,
    color: Colors.stone[800],
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: Spacing[5],
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
});
