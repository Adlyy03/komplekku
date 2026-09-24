import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Bell,
  Storefront,
  Receipt,
  Users,
  Megaphone,
  CaretRight,
  ShieldCheck,
  Clock,
  WarningCircle,
  House,
  Buildings,
  Gear,
  ChatCircle,
  QrCode,
  Warning,
  Wallet,
} from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { CommunityHeader } from '@/components/ui/CommunityHeader';
import { useSupabase } from '@/lib/supabase-provider';
import { useComplex } from '@/lib/complex-provider';
import { isModuleEnabled } from '@/config/modules';
import { getUnreadNotificationCount } from '@/services/notifications';
import { getUnreadMessagesCount } from '@/services/chat';
import { getAnnouncements, type AnnouncementWithAuthor } from '@/services/announcements';
import { getMyHouseDues, formatRupiah, type DueAssignmentWithDetails, getDueAssignments } from '@/services/dues';
import { getProducts, type ProductWithDetails } from '@/services/products';
import { getAdminOverview, type AdminOverviewStats, type RoleScopeFilter } from '@/services/admin';
import { getComplaints, type ComplaintWithDetails } from '@/services/complaints';
import { getActiveEmergencies, type EmergencyWithDetails } from '@/services/security';
import { PaymentVerifyModal } from '@/components/PaymentVerifyModal';
import { Image } from 'expo-image';
import { DesktopShell, useIsDesktop } from '@/components/ui/DesktopShell';

/**
 * Komplekku Dashboard — PRD v2 §6, §21 & §30
 * The Central Hub connecting residents and managers (Warga, RT, RW, Developer).
 */
export default function DashboardScreen() {
  const isDesktop = useIsDesktop();
  const { user, profile } = useSupabase();
  const { complexSettings, household, activeRole, refreshComplex } =
    useComplex();

  const firstName =
    profile?.full_name?.split(' ')[0] ||
    user?.user_metadata?.full_name?.split(' ')[0] ||
    'Warga';

  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadChat, setUnreadChat] = useState(0);
  const [announcements, setAnnouncements] = useState<AnnouncementWithAuthor[]>([]);
  const [unpaidDues, setUnpaidDues] = useState<DueAssignmentWithDetails[]>([]);
  const [latestProducts, setLatestProducts] = useState<ProductWithDetails[]>([]);
  
  // Management states (for RT, RW, Developer roles)
  const [adminStats, setAdminStats] = useState<AdminOverviewStats | null>(null);
  const [pendingVerifications, setPendingVerifications] = useState<DueAssignmentWithDetails[]>([]);
  const [activeComplaints, setActiveComplaints] = useState<ComplaintWithDetails[]>([]);
  const [activeEmergencies, setActiveEmergencies] = useState<EmergencyWithDetails[]>([]);

  // Payment Verification Modal State
  const [selectedVerifyAssignment, setSelectedVerifyAssignment] = useState<DueAssignmentWithDetails | null>(null);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      getUnreadMessagesCount(user.id).then(setUnreadChat).catch(() => {});
      getActiveEmergencies().then((r) => setActiveEmergencies(r.data)).catch(() => {});

      if (activeRole === 'warga') {
        // 1. Warga resident data
        const [notifsRes, annRes, prodRes] = await Promise.all([
          getUnreadNotificationCount(user.id),
          getAnnouncements({
            rwId: household?.rw?.id || null,
            rtId: household?.rt?.id || null,
            limit: 3,
          }),
          getProducts({ limit: 4 }),
        ]);

        setUnreadNotifs(notifsRes.count);
        setAnnouncements(annRes.data);
        setLatestProducts(prodRes.data);

        if (household?.house?.id) {
          const duesRes = await getMyHouseDues(household.house.id);
          const pending = duesRes.data.filter(
            (d) => d.status === 'unpaid' || d.status === 'pending_verification'
          );
          setUnpaidDues(pending);
        }
      } else {
        // 2. Operational manager data (RT, RW, Developer)
        const roleScope: RoleScopeFilter = {
          role: activeRole,
          rwId: household?.rw?.id || null,
          rtId: household?.rt?.id || null,
        };

        const [notifsRes, statsRes, pendingDuesRes, complaintsRes] = await Promise.all([
          getUnreadNotificationCount(user.id),
          getAdminOverview(roleScope),
          getDueAssignments({
            status: 'pending_verification',
            rwId: activeRole === 'rw' ? (household?.rw?.id || undefined) : undefined,
            rtId: activeRole === 'rt' ? (household?.rt?.id || undefined) : undefined,
            limit: 3,
          }),
          getComplaints({
            rwId: activeRole === 'rw' ? (household?.rw?.id || undefined) : undefined,
            rtId: activeRole === 'rt' ? (household?.rt?.id || undefined) : undefined,
            limit: 3,
          }),
        ]);

        setUnreadNotifs(notifsRes.count);
        if (statsRes.data) setAdminStats(statsRes.data);
        setPendingVerifications(pendingDuesRes.data);
        setActiveComplaints(complaintsRes.data);
      }
    } catch {
      // Fallback cleanly
    }
  }, [user, activeRole, household]);

  useEffect(() => {
    Promise.resolve().then(() => {
      void loadDashboardData();
    });
  }, [loadDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshComplex(), loadDashboardData()]);
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  };

  const totalUnpaidAmount = unpaidDues.reduce(
    (acc, d) => (d.status === 'unpaid' ? acc + Number(d.amount_snapshot) : acc),
    0
  );

  const isManagement = activeRole === 'developer' || activeRole === 'rw' || activeRole === 'rt';

  const mainScrollView = (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        isDesktop && isManagement && styles.desktopScrollContent,
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.primary[600]]}
        />
      }
    >
      {/* Top Header Bar (only shown on mobile) */}
      {!isDesktop && (
        <View style={styles.topBar}>
          <CommunityHeader />
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => router.push('/chat' as any)}
              accessibilityLabel="Pesan Warga"
            >
              <ChatCircle size={22} color={Colors.stone[700]} />
              {unreadChat > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unreadChat > 99 ? '99+' : unreadChat}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => router.push('/notifications' as any)}
              accessibilityLabel="Notifikasi"
            >
              <Bell size={22} color={Colors.stone[700]} />
              {unreadNotifs > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unreadNotifs > 99 ? '99+' : unreadNotifs}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ACTIVE EMERGENCY BANNER (PHASE 7 SOS) */}
      {activeEmergencies.length > 0 && (
        <TouchableOpacity
          style={styles.globalEmergencyBanner}
          onPress={() => router.push('/security/sos' as any)}
          activeOpacity={0.8}
        >
            <Warning size={22} color="#FFFFFF" weight="fill" />
            <View style={{ flex: 1 }}>
              <Text style={styles.globalEmergencyTitle}>
                🚨 SINYAL DARURAT AKTIF ({activeEmergencies.length})
              </Text>
              <Text style={styles.globalEmergencySub}>
                Blok {activeEmergencies[0]?.house?.block || '-'} No. {activeEmergencies[0]?.house?.house_number || '-'} membutuhkan bantuan segera!
              </Text>
            </View>
            <CaretRight size={18} color="#FFFFFF" weight="bold" />
          </TouchableOpacity>
        )}

        {/* ROLE-SPECIFIC DASHBOARD VIEW (PRD v2 §4, §6 & MVP_FINALIZATION_PHASES) */}
        {activeRole === 'rt' ? (
          <View style={styles.roleContainer}>
            {/* RT Operational Banner */}
            <View style={[styles.roleHeaderCard, { borderLeftColor: '#0D9488' }]}>
              <View style={[styles.roleBadgeHeader, { backgroundColor: '#0D9488' }]}>
                <ShieldCheck size={14} color="#FFFFFF" weight="fill" />
                <Text style={styles.roleBadgeHeaderText}>
                  PENGURUS RT {household?.rt?.code || '01'}
                </Text>
              </View>
              <Text style={styles.roleHeaderTitle}>Panel Operasional RT</Text>
              <Text style={styles.roleHeaderSub}>
                Kelola warga, verifikasi bukti pembayaran iuran, dan tindak lanjuti pengaduan warga wilayah RT {household?.rt?.code || '01'}.
              </Text>
            </View>

            {/* RT Metrics Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{adminStats?.totalResidents ?? 0}</Text>
                <Text style={styles.statLabel}>Warga RT</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{adminStats?.totalHouses ?? 0}</Text>
                <Text style={styles.statLabel}>Rumah RT</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#D97706' }]}>
                  {adminStats?.totalDuesPending ?? 0}
                </Text>
                <Text style={styles.statLabel}>Iuran Tertunda</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#DC2626' }]}>
                  {adminStats?.totalComplaintsActive ?? 0}
                </Text>
                <Text style={styles.statLabel}>Pengaduan Aktif</Text>
              </View>
            </View>

            {/* RT Quick Actions */}
            <View style={styles.modulesSection}>
              <Text style={styles.sectionHeading}>MENU OPERASIONAL RT</Text>
              <View style={styles.modulesGrid}>
                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => router.push('/admin' as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.moduleIconBox, { backgroundColor: Colors.primary[50] }]}>
                    <Users size={24} color={Colors.primary[600]} weight="fill" />
                  </View>
                  <Text style={styles.moduleTitle}>Warga RT</Text>
                  <Text style={styles.moduleSubtitle}>Data Warga RT</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => router.push('/admin' as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.moduleIconBox, { backgroundColor: '#FEF3C7' }]}>
                    <Receipt size={24} color="#D97706" weight="fill" />
                  </View>
                  <Text style={styles.moduleTitle}>Iuran RT</Text>
                  <Text style={styles.moduleSubtitle}>
                    {adminStats?.totalDuesPending ? `${adminStats.totalDuesPending} Pending` : 'Lunas'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => router.push('/pengaduan' as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.moduleIconBox, { backgroundColor: '#FEE2E2' }]}>
                    <WarningCircle size={24} color="#DC2626" weight="fill" />
                  </View>
                  <Text style={styles.moduleTitle}>Pengaduan</Text>
                  <Text style={styles.moduleSubtitle}>
                    {adminStats?.totalComplaintsActive ?? 0} Aktif
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => router.push('/announcements' as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.moduleIconBox, { backgroundColor: '#EFF6FF' }]}>
                    <Megaphone size={24} color="#2563EB" weight="fill" />
                  </View>
                  <Text style={styles.moduleTitle}>Pengumuman</Text>
                  <Text style={styles.moduleSubtitle}>Kirim ke Warga RT</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Pending Verifications */}
            {pendingVerifications.length > 0 && (
              <View style={styles.actionSection}>
                <View style={styles.actionHeader}>
                  <Text style={styles.actionTitle}>
                    Verifikasi Pembayaran ({pendingVerifications.length})
                  </Text>
                  <TouchableOpacity onPress={() => router.push('/admin' as any)}>
                    <Text style={styles.seeAllText}>Buka Panel</Text>
                  </TouchableOpacity>
                </View>
                {pendingVerifications.map((item) => (
                  <View key={item.id} style={styles.actionCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.actionCardHouse}>
                        Rumah Blok {item.house?.block || '-'} No. {item.house?.house_number || '-'}
                      </Text>
                      <Text style={styles.actionCardDue}>
                        {item.due?.name} • {formatRupiah(item.amount_snapshot)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.actionCardBtn}
                      onPress={() => {
                        setSelectedVerifyAssignment(item);
                        setVerifyModalVisible(true);
                      }}
                    >
                      <Text style={styles.actionCardBtnText}>Verifikasi</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Active Complaints */}
            {activeComplaints.length > 0 && (
              <View style={styles.actionSection}>
                <View style={styles.actionHeader}>
                  <Text style={styles.actionTitle}>
                    Pengaduan Warga Aktif ({activeComplaints.length})
                  </Text>
                  <TouchableOpacity onPress={() => router.push('/pengaduan' as any)}>
                    <Text style={styles.seeAllText}>Lihat Semua</Text>
                  </TouchableOpacity>
                </View>
                {activeComplaints.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.actionCard}
                    onPress={() => router.push(`/pengaduan/${item.id}` as any)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.actionCardHouse} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.actionCardDue}>
                        {item.category?.name || 'Pengaduan'} • {item.reporter?.full_name || 'Warga'}
                      </Text>
                    </View>
                    <CaretRight size={16} color={Colors.stone[400]} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Full Admin Button */}
            <TouchableOpacity
              style={[styles.fullAdminBtn, { backgroundColor: '#0D9488' }]}
              onPress={() => router.push('/admin' as any)}
              activeOpacity={0.8}
            >
              <ShieldCheck size={20} color="#FFFFFF" weight="fill" />
              <Text style={styles.fullAdminBtnText}>Buka Panel Pengurus RT Lengkap</Text>
              <CaretRight size={16} color="#FFFFFF" weight="bold" />
            </TouchableOpacity>
          </View>
        ) : activeRole === 'rw' ? (
          <View style={styles.roleContainer}>
            {/* RW Operational Banner */}
            <View style={[styles.roleHeaderCard, { borderLeftColor: '#047857' }]}>
              <View style={[styles.roleBadgeHeader, { backgroundColor: '#047857' }]}>
                <Users size={14} color="#FFFFFF" weight="fill" />
                <Text style={styles.roleBadgeHeaderText}>
                  PENGURUS RW {household?.rw?.code || '02'}
                </Text>
              </View>
              <Text style={styles.roleHeaderTitle}>Pusat Koordinasi Wilayah RW</Text>
              <Text style={styles.roleHeaderSub}>
                Monitoring iuran, pengaduan lingkungan, dan koordinasi antar RT di wilayah RW {household?.rw?.code || '02'}.
              </Text>
            </View>

            {/* RW Metrics Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{adminStats?.totalResidents ?? 0}</Text>
                <Text style={styles.statLabel}>Warga RW</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{adminStats?.totalHouses ?? 0}</Text>
                <Text style={styles.statLabel}>Rumah RW</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{adminStats?.totalRt ?? 0}</Text>
                <Text style={styles.statLabel}>Unit RT</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#D97706' }]}>
                  {adminStats?.totalDuesPending ?? 0}
                </Text>
                <Text style={styles.statLabel}>Iuran Tertunda</Text>
              </View>
            </View>

            {/* RT Breakdown Section */}
            {adminStats?.rtBreakdown && adminStats.rtBreakdown.length > 0 && (
              <View style={styles.actionSection}>
                <Text style={styles.actionTitle}>Rincian Wilayah RT</Text>
                <View style={styles.rtGrid}>
                  {adminStats.rtBreakdown.map((rt) => (
                    <View key={rt.id} style={styles.rtItemCard}>
                      <Text style={styles.rtItemCode}>RT {rt.code}</Text>
                      <Text style={styles.rtItemName}>{rt.name}</Text>
                      <Text style={styles.rtItemStat}>{rt.houseCount} Rumah</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* RW Quick Actions */}
            <View style={styles.modulesSection}>
              <Text style={styles.sectionHeading}>MENU KOORDINASI RW</Text>
              <View style={styles.modulesGrid}>
                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => router.push('/admin' as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.moduleIconBox, { backgroundColor: Colors.primary[50] }]}>
                    <Users size={24} color={Colors.primary[600]} weight="fill" />
                  </View>
                  <Text style={styles.moduleTitle}>Warga RW</Text>
                  <Text style={styles.moduleSubtitle}>Semua RT</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => router.push('/admin' as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.moduleIconBox, { backgroundColor: '#FEF3C7' }]}>
                    <Receipt size={24} color="#D97706" weight="fill" />
                  </View>
                  <Text style={styles.moduleTitle}>Iuran RW</Text>
                  <Text style={styles.moduleSubtitle}>
                    {adminStats?.totalDuesPending ?? 0} Tertunda
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => router.push('/pengaduan' as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.moduleIconBox, { backgroundColor: '#FEE2E2' }]}>
                    <WarningCircle size={24} color="#DC2626" weight="fill" />
                  </View>
                  <Text style={styles.moduleTitle}>Pengaduan</Text>
                  <Text style={styles.moduleSubtitle}>
                    {adminStats?.totalComplaintsActive ?? 0} Aktif
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => router.push('/announcements' as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.moduleIconBox, { backgroundColor: '#EFF6FF' }]}>
                    <Megaphone size={24} color="#2563EB" weight="fill" />
                  </View>
                  <Text style={styles.moduleTitle}>Pengumuman RW</Text>
                  <Text style={styles.moduleSubtitle}>Info Wilayah</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Full Admin Button */}
            <TouchableOpacity
              style={[styles.fullAdminBtn, { backgroundColor: '#047857' }]}
              onPress={() => router.push('/admin' as any)}
              activeOpacity={0.8}
            >
              <ShieldCheck size={20} color="#FFFFFF" weight="fill" />
              <Text style={styles.fullAdminBtnText}>Buka Panel Pengurus RW Lengkap</Text>
              <CaretRight size={16} color="#FFFFFF" weight="bold" />
            </TouchableOpacity>
          </View>
        ) : activeRole === 'developer' ? (
          <View style={styles.roleContainer}>
            {/* Developer Master Banner */}
            <View style={[styles.roleHeaderCard, { borderLeftColor: '#6D28D9' }]}>
              <View style={[styles.roleBadgeHeader, { backgroundColor: '#6D28D9' }]}>
                <Buildings size={14} color="#FFFFFF" weight="fill" />
                <Text style={styles.roleBadgeHeaderText}>PENGELOLA MASTER (DEVELOPER)</Text>
              </View>
              <Text style={styles.roleHeaderTitle}>Pusat Kendali Komplek</Text>
              <Text style={styles.roleHeaderSub}>
                Akses penuh pengaturan instance {complexSettings.name}, struktur RT/RW, moderasi marketplace, dan audit sistem.
              </Text>
            </View>

            {/* Complete Metrics Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{adminStats?.totalResidents ?? 0}</Text>
                <Text style={styles.statLabel}>Total Warga</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{adminStats?.totalHouses ?? 0}</Text>
                <Text style={styles.statLabel}>Total Rumah</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {adminStats?.totalRt ?? 0} / {adminStats?.totalRw ?? 0}
                </Text>
                <Text style={styles.statLabel}>RT / RW Unit</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#D97706' }]}>
                  {adminStats?.totalDuesPending ?? 0}
                </Text>
                <Text style={styles.statLabel}>Iuran Pending</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#DC2626' }]}>
                  {adminStats?.totalComplaintsActive ?? 0}
                </Text>
                <Text style={styles.statLabel}>Pengaduan Aktif</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {adminStats?.totalSellers ?? 0} / {adminStats?.totalProducts ?? 0}
                </Text>
                <Text style={styles.statLabel}>Toko / Produk</Text>
              </View>
            </View>

            {/* Developer Control Shortcuts */}
            <View style={styles.modulesSection}>
              <Text style={styles.sectionHeading}>KONTROL MASTER INSTANCE</Text>
              <View style={styles.modulesGrid}>
                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => router.push('/warga' as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.moduleIconBox, { backgroundColor: Colors.primary[50] }]}>
                    <Users size={24} color={Colors.primary[600]} weight="fill" />
                  </View>
                  <Text style={styles.moduleTitle}>Data Warga</Text>
                  <Text style={styles.moduleSubtitle}>
                    {adminStats?.totalResidents ?? 0} Warga
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => router.push('/admin' as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.moduleIconBox, { backgroundColor: '#EDE9FE' }]}>
                    <ShieldCheck size={24} color="#6D28D9" weight="fill" />
                  </View>
                  <Text style={styles.moduleTitle}>Panel Lengkap</Text>
                  <Text style={styles.moduleSubtitle}>Semua Modul</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => router.push('/admin' as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.moduleIconBox, { backgroundColor: '#DCFCE7' }]}>
                    <Storefront size={24} color="#16A34A" weight="fill" />
                  </View>
                  <Text style={styles.moduleTitle}>Moderasi Toko</Text>
                  <Text style={styles.moduleSubtitle}>
                    {adminStats?.totalProducts ?? 0} Produk
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => router.push('/finance' as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.moduleIconBox, { backgroundColor: '#FEF3C7' }]}>
                    <Receipt size={24} color="#D97706" weight="fill" />
                  </View>
                  <Text style={styles.moduleTitle}>Kas & Keuangan</Text>
                  <Text style={styles.moduleSubtitle}>Laporan Arus Kas</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => router.push('/announcements' as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.moduleIconBox, { backgroundColor: '#EFF6FF' }]}>
                    <Megaphone size={24} color="#2563EB" weight="fill" />
                  </View>
                  <Text style={styles.moduleTitle}>Pengumuman</Text>
                  <Text style={styles.moduleSubtitle}>Seluruh Komplek</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => router.push('/admin' as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.moduleIconBox, { backgroundColor: '#F3F4F6' }]}>
                    <Gear size={24} color={Colors.stone[700]} weight="fill" />
                  </View>
                  <Text style={styles.moduleTitle}>Pengaturan</Text>
                  <Text style={styles.moduleSubtitle}>Data Komplek</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Full Admin Button */}
            <TouchableOpacity
              style={[styles.fullAdminBtn, { backgroundColor: '#6D28D9' }]}
              onPress={() => router.push('/admin' as any)}
              activeOpacity={0.8}
            >
              <Buildings size={20} color="#FFFFFF" weight="fill" />
              <Text style={styles.fullAdminBtnText}>Buka Panel Pengelola Developer</Text>
              <CaretRight size={16} color="#FFFFFF" weight="bold" />
            </TouchableOpacity>
          </View>
        ) : (
          /* WARGA RESIDENT DASHBOARD (PRD v2 §4, §6 & §21) */
          <View>
            {/* Resident Greeting Banner */}
            <View style={styles.greetingCard}>
              <View style={styles.greetingHeader}>
                <Text style={styles.greetingTime}>{getGreeting()},</Text>
                <Text style={styles.greetingName}>{firstName}</Text>
              </View>

              {/* Household Context */}
              {household?.house ? (
                <View style={styles.houseTagRow}>
                  <View style={styles.houseTag}>
                    <House size={14} color={Colors.primary[700]} weight="bold" />
                    <Text style={styles.houseTagText}>
                      {household.house.block ? `Blok ${household.house.block} ` : ''}
                      No. {household.house.house_number}
                    </Text>
                  </View>
                  {household.rt && (
                    <View style={styles.rtTag}>
                      <Text style={styles.rtTagText}>
                        RT {household.rt.code} / RW {household.rw?.code || '01'}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.pendingTag}>
                  <Clock size={14} color={Colors.secondary[700]} />
                  <Text style={styles.pendingTagText}>
                    {profile?.verification_status === 'verified'
                      ? 'Rumah belum terdaftar di pengurus'
                      : 'Verifikasi warga sedang diproses pengurus'}
                  </Text>
                </View>
              )}
            </View>

            {/* MODULES GRID HUB (PRD v2 §6) */}
            <View style={styles.modulesSection}>
              <Text style={styles.sectionHeading}>MODUL WARGA</Text>
              <View style={styles.modulesGrid}>
                {/* Warga Module */}
                {isModuleEnabled('residents') && (
                  <TouchableOpacity
                    style={styles.moduleCard}
                    onPress={() => router.push('/warga' as any)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.moduleIconBox, { backgroundColor: Colors.primary[50] }]}>
                      <Users size={24} color={Colors.primary[600]} weight="fill" />
                    </View>
                    <Text style={styles.moduleTitle}>Warga</Text>
                    <Text style={styles.moduleSubtitle}>Rumah & Keluarga</Text>
                  </TouchableOpacity>
                )}

                {/* Iuran Module */}
                {isModuleEnabled('dues') && (
                  <TouchableOpacity
                    style={styles.moduleCard}
                    onPress={() => router.push('/iuran' as any)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.moduleIconBox, { backgroundColor: '#FEF3C7' }]}>
                      <Receipt size={24} color="#D97706" weight="fill" />
                    </View>
                    <Text style={styles.moduleTitle}>Iuran</Text>
                    <Text style={styles.moduleSubtitle}>
                      {unpaidDues.length > 0 ? `${unpaidDues.length} Tagihan` : 'Lunas'}
                    </Text>
                    {unpaidDues.length > 0 && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                )}

                {/* Marketplace Module */}
                {isModuleEnabled('marketplace') && (
                  <TouchableOpacity
                    style={styles.moduleCard}
                    onPress={() => router.push('/(main)/marketplace')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.moduleIconBox, { backgroundColor: '#DCFCE7' }]}>
                      <Storefront size={24} color="#16A34A" weight="fill" />
                    </View>
                    <Text style={styles.moduleTitle}>Pasar Warga</Text>
                    <Text style={styles.moduleSubtitle}>Jual & Beli Lokal</Text>
                  </TouchableOpacity>
                )}

                {/* Pengaduan Module */}
                {isModuleEnabled('complaints') && (
                  <TouchableOpacity
                    style={styles.moduleCard}
                    onPress={() => router.push('/pengaduan' as any)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.moduleIconBox, { backgroundColor: '#FEE2E2' }]}>
                      <Megaphone size={24} color="#DC2626" weight="fill" />
                    </View>
                    <Text style={styles.moduleTitle}>Pengaduan</Text>
                    <Text style={styles.moduleSubtitle}>Layanan Lingkungan</Text>
                  </TouchableOpacity>
                )}

                {/* SOS Panic Button */}
                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => router.push('/security/sos' as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.moduleIconBox, { backgroundColor: '#FEE2E2' }]}>
                    <Warning size={24} color="#DC2626" weight="fill" />
                  </View>
                  <Text style={styles.moduleTitle}>Darurat SOS</Text>
                  <Text style={styles.moduleSubtitle}>Tombol Panik</Text>
                </TouchableOpacity>

                {/* Digital Visitor Pass */}
                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => router.push('/security/visitor' as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.moduleIconBox, { backgroundColor: '#EFF6FF' }]}>
                    <QrCode size={24} color="#2563EB" weight="fill" />
                  </View>
                  <Text style={styles.moduleTitle}>Buku Tamu</Text>
                  <Text style={styles.moduleSubtitle}>Izin Masuk</Text>
                </TouchableOpacity>

                {/* Kas Komplek */}
                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => router.push('/finance' as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.moduleIconBox, { backgroundColor: '#F0FDF4' }]}>
                    <Wallet size={24} color="#16A34A" weight="fill" />
                  </View>
                  <Text style={styles.moduleTitle}>Kas Komplek</Text>
                  <Text style={styles.moduleSubtitle}>Transparansi</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Outstanding Dues Banner */}
            {unpaidDues.length > 0 && (
              <View style={styles.duesAlertCard}>
                <View style={styles.duesAlertHeader}>
                  <WarningCircle size={20} color="#D97706" weight="fill" />
                  <Text style={styles.duesAlertTitle}>Tagihan Iuran Perlu Dibayar</Text>
                </View>
                <Text style={styles.duesAlertBody}>
                  Ada {unpaidDues.length} tagihan iuran rumah Anda ({formatRupiah(totalUnpaidAmount)})
                </Text>
                <TouchableOpacity
                  style={styles.duesPayBtn}
                  onPress={() => router.push('/iuran' as any)}
                >
                  <Text style={styles.duesPayBtnText}>Bayar & Konfirmasi Sekarang</Text>
                  <CaretRight size={14} color="#FFFFFF" weight="bold" />
                </TouchableOpacity>
              </View>
            )}

            {/* Announcements Section (PRD v2 §12) */}
            {isModuleEnabled('announcements') && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionKicker}>PENGUMUMAN TERBARU</Text>
                    <Text style={styles.sectionTitle}>Kabar & Info Komplek</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push('/announcements' as any)}
                    style={styles.seeAllTouch}
                  >
                    <Text style={styles.seeAllText}>Semua</Text>
                    <CaretRight size={14} color={Colors.primary[600]} weight="bold" />
                  </TouchableOpacity>
                </View>

                {announcements.length === 0 ? (
                  <View style={styles.emptyNoticeBox}>
                    <Text style={styles.emptyNoticeText}>Belum ada pengumuman baru dari pengurus.</Text>
                  </View>
                ) : (
                  announcements.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.announcementCard}
                      onPress={() => router.push(`/announcements/${item.id}` as any)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.announcementBadge}>
                        <Text style={styles.announcementBadgeText}>
                          {item.target_type === 'complex'
                            ? 'KOMPLEK'
                            : item.target_type === 'rw'
                            ? 'RW'
                            : 'RT'}
                        </Text>
                      </View>
                      <Text style={styles.announcementCardTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.announcementCardSnippet} numberOfLines={2}>
                        {item.body}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {/* Marketplace Section Highlights (PRD v2 §14) */}
            {isModuleEnabled('marketplace') && latestProducts.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionKicker}>PASAR TETANGGA</Text>
                    <Text style={styles.sectionTitle}>Produk Warga Terbaru</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push('/(main)/marketplace')}
                    style={styles.seeAllTouch}
                  >
                    <Text style={styles.seeAllText}>Lihat Pasar</Text>
                    <CaretRight size={14} color={Colors.primary[600]} weight="bold" />
                  </TouchableOpacity>
                </View>

                <View style={styles.productGrid}>
                  {latestProducts.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.productCard}
                      onPress={() => router.push(`/product/${p.id}` as any)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.productImageBox}>
                        {p.images && p.images.length > 0 ? (
                          <Image
                            source={{ uri: p.images[0].storage_path }}
                            style={styles.productImage}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={styles.productImagePlaceholder}>
                            <Storefront size={24} color={Colors.stone[300]} />
                          </View>
                        )}
                      </View>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={1}>
                          {p.name}
                        </Text>
                        <Text style={styles.productPrice}>{formatRupiah(p.price)}</Text>
                        <Text style={styles.productSeller} numberOfLines={1}>
                          {p.seller?.store_name || 'Toko Warga'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
  );

  if (isDesktop) {
    return (
      <DesktopShell
        activeKey="/(main)"
        pageTitle={
          activeRole === 'developer'
            ? 'Ringkasan Eksekutif Developer'
            : activeRole === 'rw'
            ? 'Pusat Koordinasi RW'
            : activeRole === 'rt'
            ? 'Panel Operasional RT'
            : 'Beranda Warga'
        }
        breadcrumb={['Dashboard', isManagement ? 'Ringkasan' : 'Beranda']}
      >
        <View style={styles.desktopContainer}>{mainScrollView}</View>

        {/* Payment Verification Modal */}
        <PaymentVerifyModal
          visible={verifyModalVisible}
          assignment={selectedVerifyAssignment}
          onClose={() => setVerifyModalVisible(false)}
          onSuccess={() => void loadDashboardData()}
        />
      </DesktopShell>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {mainScrollView}

      {/* Payment Verification Modal */}
      <PaymentVerifyModal
        visible={verifyModalVisible}
        assignment={selectedVerifyAssignment}
        onClose={() => setVerifyModalVisible(false)}
        onSuccess={() => void loadDashboardData()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.stone[25],
  },
  desktopContainer: {
    flex: 1,
    padding: Spacing[6],
    backgroundColor: Colors.stone[25],
  },
  desktopScrollContent: {
    paddingBottom: Spacing[10],
  },
  scrollContent: {
    paddingBottom: Spacing[10],
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[2],
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.stone[0],
    borderWidth: 1,
    borderColor: Colors.stone[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.stone[0],
    borderWidth: 1,
    borderColor: Colors.stone[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.primary[600],
    borderRadius: Radius.full,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  greetingCard: {
    backgroundColor: Colors.stone[0],
    marginHorizontal: Spacing[4],
    marginTop: Spacing[2],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[4],
  },
  greetingHeader: {
    marginBottom: Spacing[2],
  },
  greetingTime: {
    ...Typography.bodyS,
    color: Colors.stone[500],
  },
  greetingName: {
    ...Typography.h2,
    color: Colors.stone[800],
  },
  houseTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    flexWrap: 'wrap',
  },
  houseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  houseTagText: {
    ...Typography.label,
    color: Colors.primary[800],
    fontSize: 12,
  },
  rtTag: {
    backgroundColor: Colors.stone[100],
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  rtTagText: {
    ...Typography.label,
    color: Colors.stone[700],
    fontSize: 11,
  },
  pendingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: Radius.xs,
  },
  pendingTagText: {
    ...Typography.bodyS,
    color: '#92400E',
    fontSize: 12,
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
    marginHorizontal: Spacing[4],
    marginTop: Spacing[3],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    borderRadius: Radius.sm,
    gap: Spacing[3],
  },
  adminBannerTextWrap: {
    flex: 1,
  },
  adminBannerTitle: {
    ...Typography.label,
    color: Colors.primary[800],
    fontWeight: '700',
  },
  adminBannerSubtitle: {
    ...Typography.bodyS,
    color: Colors.primary[700],
    fontSize: 11,
  },
  modulesSection: {
    marginHorizontal: Spacing[4],
    marginTop: Spacing[4],
  },
  sectionHeading: {
    ...Typography.overline,
    color: Colors.stone[400],
    marginBottom: Spacing[2],
    letterSpacing: 0.8,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  moduleCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[3],
    position: 'relative',
  },
  moduleIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  moduleTitle: {
    ...Typography.label,
    color: Colors.stone[800],
    fontWeight: '700',
    fontSize: 14,
  },
  moduleSubtitle: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    fontSize: 11,
    marginTop: 2,
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  duesAlertCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginHorizontal: Spacing[4],
    marginTop: Spacing[4],
    padding: Spacing[4],
    borderRadius: Radius.md,
  },
  duesAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: 4,
  },
  duesAlertTitle: {
    ...Typography.label,
    color: '#92400E',
    fontWeight: '700',
  },
  duesAlertBody: {
    ...Typography.bodyS,
    color: '#B45309',
    marginBottom: Spacing[3],
  },
  duesPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    paddingVertical: Spacing[2],
    borderRadius: Radius.sm,
    gap: 4,
  },
  duesPayBtnText: {
    ...Typography.label,
    color: '#FFFFFF',
    fontSize: 13,
  },
  sectionBlock: {
    marginHorizontal: Spacing[4],
    marginTop: Spacing[5],
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing[3],
  },
  sectionKicker: {
    ...Typography.overline,
    color: Colors.stone[400],
    fontSize: 10,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.stone[800],
  },
  seeAllTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    ...Typography.label,
    color: Colors.primary[600],
    fontSize: 12,
  },
  emptyNoticeBox: {
    backgroundColor: Colors.stone[0],
    padding: Spacing[4],
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    alignItems: 'center',
  },
  emptyNoticeText: {
    ...Typography.bodyS,
    color: Colors.stone[400],
  },
  announcementCard: {
    backgroundColor: Colors.stone[0],
    padding: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    marginBottom: Spacing[2],
  },
  announcementBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    marginBottom: 4,
  },
  announcementBadgeText: {
    ...Typography.overline,
    color: Colors.primary[700],
    fontSize: 9,
  },
  announcementCardTitle: {
    ...Typography.label,
    color: Colors.stone[800],
    fontWeight: '700',
    marginBottom: 2,
  },
  announcementCardSnippet: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    lineHeight: 16,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  productCard: {
    width: '48%',
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    overflow: 'hidden',
  },
  productImageBox: {
    width: '100%',
    height: 110,
    backgroundColor: Colors.stone[100],
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: Spacing[2],
  },
  productName: {
    ...Typography.label,
    color: Colors.stone[800],
    fontSize: 13,
  },
  productPrice: {
    ...Typography.label,
    color: Colors.primary[700],
    fontWeight: '700',
    fontSize: 13,
    marginTop: 2,
  },
  productSeller: {
    ...Typography.bodyS,
    color: Colors.stone[400],
    fontSize: 11,
    marginTop: 2,
  },
  roleContainer: {
    marginHorizontal: Spacing[4],
    marginTop: Spacing[4],
  },
  roleHeaderCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[200],
    borderLeftWidth: 4,
    padding: Spacing[4],
    marginBottom: Spacing[4],
  },
  roleBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.xs,
    gap: 6,
    marginBottom: Spacing[2],
  },
  roleBadgeHeaderText: {
    ...Typography.overline,
    color: '#FFFFFF',
    fontSize: 10,
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  roleHeaderTitle: {
    ...Typography.h2,
    color: Colors.stone[800],
    marginBottom: 4,
  },
  roleHeaderSub: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    marginBottom: Spacing[4],
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.stone[0],
    borderWidth: 1,
    borderColor: Colors.stone[100],
    borderRadius: Radius.sm,
    padding: Spacing[3],
    alignItems: 'center',
  },
  statNumber: {
    ...Typography.h1,
    color: Colors.stone[900],
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    fontSize: 11,
    marginTop: 2,
  },
  actionSection: {
    marginBottom: Spacing[4],
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  actionTitle: {
    ...Typography.label,
    color: Colors.stone[800],
    fontWeight: '700',
    fontSize: 13,
    marginBottom: Spacing[2],
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.stone[0],
    borderWidth: 1,
    borderColor: Colors.stone[100],
    borderRadius: Radius.sm,
    padding: Spacing[3],
    marginBottom: Spacing[2],
  },
  actionCardHouse: {
    ...Typography.label,
    color: Colors.stone[800],
    fontSize: 13,
    fontWeight: '600',
  },
  actionCardDue: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    fontSize: 11,
    marginTop: 2,
  },
  actionCardBtn: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: Radius.xs,
  },
  actionCardBtnText: {
    ...Typography.label,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  fullAdminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.sm,
    gap: Spacing[2],
    marginTop: Spacing[2],
    marginBottom: Spacing[6],
  },
  fullAdminBtnText: {
    ...Typography.label,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  rtGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  rtItemCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.stone[0],
    borderWidth: 1,
    borderColor: Colors.stone[100],
    borderRadius: Radius.sm,
    padding: Spacing[3],
  },
  rtItemCode: {
    ...Typography.overline,
    color: Colors.primary[700],
    fontSize: 11,
    fontWeight: '700',
  },
  rtItemName: {
    ...Typography.label,
    color: Colors.stone[800],
    fontSize: 12,
    marginTop: 2,
  },
  rtItemStat: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    fontSize: 11,
    marginTop: 4,
  },
  globalEmergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: '#DC2626',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[3],
    borderRadius: Radius.md,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  globalEmergencyTitle: {
    ...Typography.bodyS,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  globalEmergencySub: {
    ...Typography.bodyS,
    color: '#FEE2E2',
    fontSize: 11,
    marginTop: 2,
  },
});
