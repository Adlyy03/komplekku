import React, { useEffect, useState, useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import {
  CaretLeft,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
} from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useSupabase } from '@/lib/supabase-provider';
import { getComplaints, type ComplaintWithDetails } from '@/services/complaints';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { isModuleEnabled } from '@/config/modules';
import { DesktopShell, useIsDesktop } from '@/components/ui/DesktopShell';
import type { ComplaintStatus } from '@/types';

/**
 * Module Pengaduan — PRD v2 §16
 * List of neighborhood complaints, status tracking, and reporting.
 */
export default function PengaduanScreen() {
  const isDesktop = useIsDesktop();
  const { user } = useSupabase();

  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
  const [complaints, setComplaints] = useState<ComplaintWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadComplaints = useCallback(async () => {
    if (!user) return;
    try {
      const filters = activeTab === 'my' ? { reporterId: user.id } : {};
      const { data } = await getComplaints(filters);
      setComplaints(data);
    } finally {
      setLoading(false);
    }
  }, [user, activeTab]);

  useEffect(() => {
    Promise.resolve().then(() => {
      setLoading(true);
      void loadComplaints();
    });
  }, [loadComplaints]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadComplaints();
    setRefreshing(false);
  };

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case 'submitted':
        return { label: 'Diajukan', bg: '#EFF6FF', color: '#1D4ED8', icon: Clock };
      case 'in_review':
        return { label: 'Ditinjau', bg: '#FEF3C7', color: '#B45309', icon: Clock };
      case 'in_progress':
        return { label: 'Dikerjakan', bg: '#F3E8FF', color: '#6B21A8', icon: Clock };
      case 'resolved':
        return { label: 'Selesai', bg: '#DCFCE7', color: '#15803D', icon: CheckCircle };
      case 'rejected':
        return { label: 'Ditolak', bg: '#FEE2E2', color: '#B91C1C', icon: XCircle };
      default:
        return { label: status, bg: Colors.stone[100], color: Colors.stone[600], icon: Clock };
    }
  };

  if (!isModuleEnabled('complaints')) {
    return <Redirect href="/(main)" />;
  }

  return (
    <DesktopShell
      activeKey="/pengaduan"
      pageTitle="Pengaduan Warga"
      breadcrumb={['Pelayanan', 'Pengaduan']}
      headerAction={
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/pengaduan/create' as any)}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#FFFFFF" weight="bold" />
          <Text style={styles.createButtonText}>Buat Laporan</Text>
        </TouchableOpacity>
      }
    >
      <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          {!isDesktop && (
            <View style={styles.headerTop}>
              {router.canGoBack() && (
                <TouchableOpacity
                  onPress={() => (router.canGoBack() ? router.back() : router.replace('/(main)' as any))}
                  hitSlop={8}
                  style={styles.backButton}
                >
                  <CaretLeft size={20} color={Colors.stone[700]} />
                  <Text style={styles.backButtonText}>Kembali</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/pengaduan/create' as any)}
                activeOpacity={0.8}
              >
                <Plus size={16} color="#FFFFFF" weight="bold" />
                <Text style={styles.createButtonText}>Buat Laporan</Text>
              </TouchableOpacity>
            </View>
          )}
          {!isDesktop && <Text style={styles.title}>Pengaduan Warga</Text>}
          <Text style={styles.subtitle}>
            Saluran resmi penyampaian aspirasi dan kendala fasilitas komplek
          </Text>

        {/* Tab Filters */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'my' && styles.tabButtonActive]}
            onPress={() => setActiveTab('my')}
          >
            <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
              Pengaduan Saya
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              Semua Pengaduan
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <LoadingState fullScreen={false} style={{ flex: 1 }} />
      ) : complaints.length === 0 ? (
        <EmptyState
          title={activeTab === 'my' ? 'Belum Ada Pengaduan' : 'Tidak Ada Pengaduan'}
          description={
            activeTab === 'my'
              ? 'Ada kendala lingkungan atau fasilitas? Buat laporan pengaduan sekarang.'
              : 'Belum ada pengaduan warga yang dilaporkan.'
          }
        />
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary[600]]}
            />
          }
          renderItem={({ item }) => {
            const badge = getStatusBadge(item.status);
            const BadgeIcon = badge.icon;

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/pengaduan/${item.id}` as any)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                      {item.category?.name || 'Umum'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <BadgeIcon size={12} color={badge.color} weight="bold" />
                    <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardDate}>
                    {new Date(item.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  {item.location_note && (
                    <Text style={styles.locationText} numberOfLines={1}>
                      📍 {item.location_note}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
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
    paddingBottom: Spacing[2],
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButtonText: {
    ...Typography.label,
    color: Colors.stone[600],
    fontSize: 13,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  createButtonText: {
    ...Typography.label,
    color: '#FFFFFF',
    fontSize: 12,
  },
  title: {
    ...Typography.h2,
    color: Colors.stone[800],
  },
  subtitle: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    marginTop: 2,
    marginBottom: Spacing[3],
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[100],
    marginTop: Spacing[1],
  },
  tabButton: {
    paddingVertical: Spacing[2],
    marginRight: Spacing[4],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: Colors.primary[600],
  },
  tabText: {
    ...Typography.label,
    color: Colors.stone[500],
    fontSize: 13,
  },
  tabTextActive: {
    color: Colors.primary[700],
    fontWeight: '700',
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  statusBadgeText: {
    ...Typography.overline,
    fontSize: 10,
    fontWeight: '700',
  },
  cardTitle: {
    ...Typography.label,
    color: Colors.stone[800],
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  cardDesc: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    lineHeight: 18,
    marginBottom: Spacing[3],
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.stone[100],
    paddingTop: Spacing[2],
  },
  cardDate: {
    ...Typography.bodyS,
    color: Colors.stone[400],
    fontSize: 11,
  },
  locationText: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    fontSize: 11,
    maxWidth: 160,
  },
});
