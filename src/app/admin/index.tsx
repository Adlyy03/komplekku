import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CaretLeft,
  Person,
  BuildingApartment,
  Bag,
  Receipt,
  Prohibit,
  CheckCircle,
  ShieldCheck,
  Megaphone,
  Storefront,
  X,
  UserCheck,
  Users,
} from 'phosphor-react-native';
import { Colors, Typography, Spacing, Radius, FontFamily } from '@/constants/theme';
import type { UserRole } from '@/types/database';
import { useSupabase } from '@/lib/supabase-provider';
import { useComplex } from '@/lib/complex-provider';
import {
  checkIsAdmin,
  getAdminOverview,
  getCommunityMembers,
  updateMemberStatus,
  getCommunitySellers,
  updateSellerStatus,
  getCommunityProducts,
  moderateProduct,
  getCommunityOrders,
  updateCommunityInfo,
  AdminOverviewStats,
  CommunityMemberWithProfile,
  SellerWithUser,
  ProductWithSellerAdmin,
  RoleScopeFilter,
} from '@/services/admin';
import { formatRupiah } from '@/services/products';
import { LoadingState } from '@/components/ui/LoadingState';
import { Button } from '@/components/ui/Button';

type AdminTab = 'overview' | 'members' | 'sellers' | 'products' | 'orders' | 'settings';

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useSupabase();
  const { complexSettings, activeRole, household, isDeveloper, isRw, isRt } = useComplex();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [members, setMembers] = useState<CommunityMemberWithProfile[]>([]);
  const [sellers, setSellers] = useState<SellerWithUser[]>([]);
  const [products, setProducts] = useState<ProductWithSellerAdmin[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // Role change modal state
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [selectedMemberForRole, setSelectedMemberForRole] = useState<CommunityMemberWithProfile | null>(null);
  const [savingRole, setSavingRole] = useState(false);

  // Settings form states
  const [commName, setCommName] = useState('');
  const [commAddr, setCommAddr] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const roleScope: RoleScopeFilter = React.useMemo(
    () => ({
      role: activeRole,
      rwId: household?.rw?.id || null,
      rtId: household?.rt?.id || null,
    }),
    [activeRole, household]
  );

  const assignableRoles: UserRole[] = React.useMemo(() => {
    if (isDeveloper) return ['developer', 'rw', 'rt', 'warga'];
    if (isRw) return ['rt', 'warga'];
    if (isRt) return ['warga'];
    return [];
  }, [isDeveloper, isRw, isRt]);

  // 1. Check admin permission
  const checkPermission = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const authorized = await checkIsAdmin(user.id);
    setIsAdmin(authorized);
    setLoading(false);
  }, [user]);

  // 2. Load tab data with scope
  const loadData = useCallback(async () => {
    if (isAdmin !== true || activeRole === 'warga') return;

    if (activeTab === 'overview') {
      const { data } = await getAdminOverview(roleScope);
      if (data) setStats(data);
    } else if (activeTab === 'members') {
      const { data } = await getCommunityMembers(roleScope);
      if (data) setMembers(data);
    } else if (activeTab === 'sellers') {
      const { data } = await getCommunitySellers();
      if (data) setSellers(data);
    } else if (activeTab === 'products') {
      const { data } = await getCommunityProducts();
      if (data) setProducts(data);
    } else if (activeTab === 'orders') {
      const { data } = await getCommunityOrders();
      if (data) setOrders(data);
    } else if (activeTab === 'settings') {
      setCommName(complexSettings?.name || '');
      setCommAddr(complexSettings?.address || '');
    }

    setRefreshing(false);
  }, [complexSettings, isAdmin, activeRole, activeTab, roleScope]);

  useEffect(() => {
    Promise.resolve().then(() => {
      checkPermission();
    });
  }, [checkPermission]);

  useEffect(() => {
    if (isAdmin === true) {
      Promise.resolve().then(() => {
        loadData();
      });
    }
  }, [isAdmin, loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Actions
  const handleOpenRoleModal = (member: CommunityMemberWithProfile) => {
    setSelectedMemberForRole(member);
    setRoleModalVisible(true);
  };

  const handleSelectNewRole = async (targetRole: UserRole) => {
    if (!selectedMemberForRole || !user) return;
    if (targetRole === selectedMemberForRole.role) {
      setRoleModalVisible(false);
      return;
    }

    setSavingRole(true);
    const { error } = await updateMemberStatus(selectedMemberForRole.id, {
      actorId: user.id,
      actorRole: activeRole,
      role: targetRole,
    });
    setSavingRole(false);

    if (error) {
      Alert.alert('Gagal Mengubah Peran', error.message);
    } else {
      Alert.alert('Sukses', `Peran ${selectedMemberForRole.full_name} berhasil diubah menjadi ${targetRole.toUpperCase()}`);
      setMembers((prev) =>
        prev.map((m) =>
          m.id === selectedMemberForRole.id ? { ...m, role: targetRole } : m
        )
      );
      setRoleModalVisible(false);
    }
  };

  const handleVerifyMember = async (member: CommunityMemberWithProfile) => {
    if (!user) return;
    Alert.alert(
      'Verifikasi Warga',
      `Verifikasi warga ${member.full_name || 'ini'} dan setujui status huniannya?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Verifikasi',
          onPress: async () => {
            const { error } = await updateMemberStatus(member.id, {
              actorId: user.id,
              actorRole: activeRole,
              verification_status: 'verified',
              resident_status: 'active',
            });
            if (error) {
              Alert.alert('Gagal', error.message);
            } else {
              Alert.alert('Sukses', 'Warga berhasil diverifikasi.');
              setMembers((prev) =>
                prev.map((m) =>
                  m.id === member.id
                    ? { ...m, verification_status: 'verified', resident_status: 'active' }
                    : m
                )
              );
            }
          },
        },
      ]
    );
  };

  const handleToggleMemberStatus = async (member: CommunityMemberWithProfile) => {
    if (!user) return;
    const isCurrentlyBlocked = member.resident_status === 'blocked';
    const nextStatus = isCurrentlyBlocked ? 'active' : 'blocked';
    Alert.alert(
      isCurrentlyBlocked ? 'Buka Blokir Warga' : 'Blokir Warga',
      `Apakah Anda yakin ingin ${isCurrentlyBlocked ? 'membuka blokir' : 'memblokir'} ${member.full_name || 'warga'}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Konfirmasi',
          style: isCurrentlyBlocked ? 'default' : 'destructive',
          onPress: async () => {
            const { error } = await updateMemberStatus(member.id, {
              actorId: user.id,
              actorRole: activeRole,
              resident_status: nextStatus,
            });
            if (error) {
              Alert.alert('Gagal', error.message);
            } else {
              setMembers((prev) =>
                prev.map((m) => (m.id === member.id ? { ...m, resident_status: nextStatus } : m))
              );
            }
          },
        },
      ]
    );
  };

  const handleToggleSellerStatus = async (seller: SellerWithUser) => {
    const isCurrentlyActive = seller.status === 'active';
    const nextStatus = isCurrentlyActive ? 'blocked' : 'active';
    Alert.alert(
      isCurrentlyActive ? 'Blokir Penjual' : 'Aktifkan Penjual',
      `Apakah Anda yakin ingin ${isCurrentlyActive ? 'memblokir toko' : 'mengaktifkan kembali toko'} "${seller.store_name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Konfirmasi',
          style: isCurrentlyActive ? 'destructive' : 'default',
          onPress: async () => {
            const { error } = await updateSellerStatus(seller.id, nextStatus);
            if (error) {
              Alert.alert('Gagal', error.message);
            } else {
              Alert.alert('Sukses', `Toko "${seller.store_name}" berhasil di-${nextStatus === 'blocked' ? 'blokir' : 'aktifkan'}.`);
              setSellers((prev) =>
                prev.map((s) => (s.id === seller.id ? { ...s, status: nextStatus } : s))
              );
            }
          },
        },
      ]
    );
  };

  const handleModerateProduct = async (product: ProductWithSellerAdmin, status: 'active' | 'inactive') => {
    const isDeactivating = status === 'inactive';
    Alert.alert(
      isDeactivating ? 'Nonaktifkan Produk' : 'Aktifkan Produk',
      `Apakah Anda yakin ingin ${isDeactivating ? 'menonaktifkan' : 'mengaktifkan'} produk "${product.name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Konfirmasi',
          style: isDeactivating ? 'destructive' : 'default',
          onPress: async () => {
            const { error } = await moderateProduct(product.id, status);
            if (error) {
              Alert.alert('Gagal', error.message);
            } else {
              setProducts((prev) =>
                prev.map((p) => (p.id === product.id ? { ...p, status } : p))
              );
            }
          },
        },
      ]
    );
  };

  const handleSaveSettings = async () => {
    if (!commName.trim()) return;
    setSavingSettings(true);
    const { error } = await updateCommunityInfo({
      name: commName.trim(),
      address: commAddr.trim(),
    });
    setSavingSettings(false);
    if (error) {
      Alert.alert('Gagal', error.message);
    } else {
      Alert.alert('Sukses', 'Informasi komplek berhasil diperbarui.');
    }
  };

  const availableTabs: { key: AdminTab; label: string }[] = React.useMemo(() => {
    if (isDeveloper) {
      return [
        { key: 'overview', label: 'Ringkasan' },
        { key: 'members', label: 'Warga' },
        { key: 'sellers', label: 'Penjual' },
        { key: 'products', label: 'Produk' },
        { key: 'orders', label: 'Pesanan' },
        { key: 'settings', label: 'Pengaturan' },
      ];
    }
    if (isRw) {
      return [
        { key: 'overview', label: 'Ringkasan RW' },
        { key: 'members', label: `Warga RW ${household?.rw?.code ? `(${household.rw.code})` : ''}` },
        { key: 'orders', label: 'Pesanan' },
      ];
    }
    if (isRt) {
      return [
        { key: 'overview', label: 'Ringkasan RT' },
        { key: 'members', label: `Warga RT ${household?.rt?.code ? `(${household.rt.code})` : ''}` },
      ];
    }
    return [];
  }, [isDeveloper, isRw, isRt, household]);

  // Render Access Denied state (PRD §46 acceptance criteria: Non-admin -> ADMIN ROUTE DENIED)
  if (loading) {
    return <LoadingState fullScreen />;
  }

  if (isAdmin === false || activeRole === 'warga') {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <View style={styles.deniedIcon}>
          <Prohibit size={64} color={Colors.semantic.error[500]} />
        </View>
        <Text style={styles.deniedTitle}>Akses Ditolak</Text>
        <Text style={styles.deniedDesc}>
          Halaman ini khusus untuk Pengurus Komplek (Developer, RW, atau RT). Warga biasa tidak memiliki akses ke panel ini.
        </Text>
        <Button
          label="Kembali ke Beranda"
          variant="secondary"
          onPress={() => router.replace('/(main)' as any)}
          style={{ marginTop: Spacing[4] }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        {router.canGoBack() && (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityLabel="Kembali"
          >
            <CaretLeft size={24} color={Colors.stone[800]} />
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.topBarTitle}>
            {isDeveloper
              ? 'Panel Pengelola Komplek'
              : isRw
              ? `Panel Pengurus RW ${household?.rw?.code || ''}`
              : `Panel Pengurus RT ${household?.rt?.code || ''}`}
          </Text>
          <Text style={styles.topBarSub}>
            {complexSettings?.name || 'Komplekku'} • Scope: {activeRole.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {availableTabs.map((t) => {
            const active = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabItem, active && styles.tabItemActive]}
                onPress={() => setActiveTab(t.key as AdminTab)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content Area */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary[600]}
          />
        }
      >
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <View style={styles.overviewContainer}>
            {/* Scoped Metric Cards */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIconCircle, { backgroundColor: Colors.primary[50] }]}>
                  <Person size={24} color={Colors.primary[700]} />
                </View>
                <Text style={styles.statNumber}>{stats?.totalResidents ?? '...'}</Text>
                <Text style={styles.statLabel}>
                  {isDeveloper ? 'Total Warga' : isRw ? 'Warga RW' : 'Warga RT'}
                </Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconCircle, { backgroundColor: Colors.stone[100] }]}>
                  <BuildingApartment size={24} color={Colors.stone[700]} />
                </View>
                <Text style={styles.statNumber}>{stats?.totalHouses ?? '...'}</Text>
                <Text style={styles.statLabel}>
                  {isDeveloper ? 'Total Rumah' : isRw ? 'Rumah RW' : 'Rumah RT'}
                </Text>
              </View>

              {isDeveloper && (
                <>
                  <View style={styles.statCard}>
                    <View style={[styles.statIconCircle, { backgroundColor: '#EDE9FE' }]}>
                      <ShieldCheck size={24} color="#6D28D9" />
                    </View>
                    <Text style={styles.statNumber}>{stats?.totalRt ?? 0}</Text>
                    <Text style={styles.statLabel}>Unit RT Aktif</Text>
                  </View>

                  <View style={styles.statCard}>
                    <View style={[styles.statIconCircle, { backgroundColor: '#DCFCE7' }]}>
                      <Users size={24} color="#047857" />
                    </View>
                    <Text style={styles.statNumber}>{stats?.totalRw ?? 0}</Text>
                    <Text style={styles.statLabel}>Unit RW Aktif</Text>
                  </View>
                </>
              )}

              {isRw && (
                <View style={styles.statCard}>
                  <View style={[styles.statIconCircle, { backgroundColor: '#DCFCE7' }]}>
                    <Users size={24} color="#047857" />
                  </View>
                  <Text style={styles.statNumber}>{stats?.totalRt ?? 0}</Text>
                  <Text style={styles.statLabel}>Unit RT Binaan</Text>
                </View>
              )}

              <View style={styles.statCard}>
                <View style={[styles.statIconCircle, { backgroundColor: Colors.semantic.warning[50] }]}>
                  <Receipt size={24} color={Colors.semantic.warning[700]} />
                </View>
                <Text style={styles.statNumber}>{stats?.totalDuesPending ?? '...'}</Text>
                <Text style={styles.statLabel}>Iuran Tertunda</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconCircle, { backgroundColor: Colors.semantic.error[50] }]}>
                  <Bag size={24} color={Colors.semantic.error[700]} />
                </View>
                <Text style={styles.statNumber}>{stats?.totalComplaintsActive ?? '...'}</Text>
                <Text style={styles.statLabel}>Pengaduan Aktif</Text>
              </View>

              {isDeveloper && (
                <>
                  <View style={styles.statCard}>
                    <View style={[styles.statIconCircle, { backgroundColor: Colors.accent[100] }]}>
                      <Storefront size={24} color={Colors.accent[700]} />
                    </View>
                    <Text style={styles.statNumber}>{stats?.totalSellers ?? '...'}</Text>
                    <Text style={styles.statLabel}>Total Toko</Text>
                  </View>

                  <View style={styles.statCard}>
                    <View style={[styles.statIconCircle, { backgroundColor: '#F3E8FF' }]}>
                      <Bag size={24} color="#7E22CE" />
                    </View>
                    <Text style={styles.statNumber}>{stats?.totalProducts ?? '...'}</Text>
                    <Text style={styles.statLabel}>Produk Aktif</Text>
                  </View>

                  <View style={styles.statCard}>
                    <View style={[styles.statIconCircle, { backgroundColor: Colors.semantic.success[50] }]}>
                      <Receipt size={24} color={Colors.semantic.success[700]} />
                    </View>
                    <Text style={styles.statNumber}>{stats?.totalOrders ?? '...'}</Text>
                    <Text style={styles.statLabel}>Transaksi Order</Text>
                  </View>
                </>
              )}
            </View>

            {/* Scope Info Banner */}
            <View style={styles.infoBanner}>
              <CheckCircle size={20} color={Colors.primary[700]} />
              <Text style={styles.infoBannerText}>
                {isDeveloper
                  ? 'Akses penuh Developer: Anda dapat mengelola seluruh warga, RW, RT, moderasi toko, dan pengaturan komplek.'
                  : isRw
                  ? `Scope Pengurus RW: Data yang ditampilkan dibatasi untuk wilayah RW ${household?.rw?.code || ''} dan RT binaannya.`
                  : `Scope Pengurus RT: Data yang ditampilkan dibatasi untuk wilayah operasional RT ${household?.rt?.code || ''}.`}
              </Text>
            </View>

            {/* RT Breakdown for RW Role */}
            {isRw && stats?.rtBreakdown && stats.rtBreakdown.length > 0 && (
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownTitle}>Rincian Wilayah per RT</Text>
                <View style={styles.breakdownGrid}>
                  {stats.rtBreakdown.map((rt) => (
                    <View key={rt.id} style={styles.breakdownCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.breakdownCode}>RT {rt.code}</Text>
                        <Text style={styles.breakdownName}>{rt.name}</Text>
                      </View>
                      <View style={styles.breakdownStatWrap}>
                        <Text style={styles.breakdownStat}>{rt.houseCount} Rumah</Text>
                        <Text style={styles.breakdownSubStat}>
                          {rt.residentCount ?? 0} Warga • {rt.duesPendingCount ?? 0} Tagihan Pending
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* OPERATIONAL FEEDS SECTION */}
            {/* 1. Developer Audit Log Feed */}
            {isDeveloper && stats?.recentActivity && stats.recentActivity.length > 0 && (
              <View style={styles.feedCard}>
                <View style={styles.feedCardHeader}>
                  <ShieldCheck size={18} color="#6D28D9" weight="fill" />
                  <Text style={styles.feedCardTitle}>Log Aktivitas & Audit Pengurus</Text>
                </View>
                {stats.recentActivity.map((log) => (
                  <View key={log.id} style={styles.feedItem}>
                    <View style={styles.feedItemDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.feedItemTitle}>
                        {log.action === 'role_assigned'
                          ? `Penetapan Peran: ${log.metadata?.assigned_role?.toUpperCase()}`
                          : log.action === 'role_revoked'
                          ? `Pencabutan Peran: ${log.metadata?.revoked_role?.toUpperCase()}`
                          : log.action === 'resident_status_updated'
                          ? `Update Status Warga (${log.metadata?.resident_status || log.metadata?.verification_status})`
                          : log.action}
                      </Text>
                      <Text style={styles.feedItemSub}>
                        Oleh: {log.actor?.full_name || 'Admin'} •{' '}
                        {new Date(log.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 2. RT: Recent Residents */}
            {isRt && stats?.recentResidents && stats.recentResidents.length > 0 && (
              <View style={styles.feedCard}>
                <View style={styles.feedCardHeader}>
                  <Person size={18} color={Colors.primary[700]} weight="fill" />
                  <Text style={styles.feedCardTitle}>Warga Terbaru Terdaftar di RT</Text>
                </View>
                {stats.recentResidents.map((r) => (
                  <View key={r.id} style={styles.feedItem}>
                    <View style={styles.feedItemDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.feedItemTitle}>{r.full_name}</Text>
                      <Text style={styles.feedItemSub}>
                        Status: {r.resident_status} ({r.verification_status})
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 3. Complaints Feed */}
            {stats?.recentComplaints && stats.recentComplaints.length > 0 && (
              <View style={styles.feedCard}>
                <View style={styles.feedCardHeader}>
                  <Bag size={18} color="#DC2626" weight="fill" />
                  <Text style={styles.feedCardTitle}>
                    {isDeveloper
                      ? 'Pengaduan Terkini Komplek'
                      : isRw
                      ? 'Pengaduan Wilayah RW'
                      : 'Pengaduan Warga RT'}
                  </Text>
                </View>
                {stats.recentComplaints.map((c) => (
                  <View key={c.id} style={styles.feedItem}>
                    <View
                      style={[
                        styles.priorityPill,
                        c.priority === 'urgent'
                          ? styles.priorityUrgent
                          : c.priority === 'high'
                          ? styles.priorityHigh
                          : styles.priorityNormal,
                      ]}
                    >
                      <Text style={styles.priorityPillText}>
                        {(c.priority || 'normal').toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.feedItemTitle}>{c.title}</Text>
                      <Text style={styles.feedItemSub}>
                        {c.reporter?.full_name || 'Warga'} • Blok {c.house?.block || '-'} No.{' '}
                        {c.house?.house_number || '-'} • Status: {c.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 4. Payments Feed */}
            {stats?.recentPayments && stats.recentPayments.length > 0 && (
              <View style={styles.feedCard}>
                <View style={styles.feedCardHeader}>
                  <Receipt size={18} color="#D97706" weight="fill" />
                  <Text style={styles.feedCardTitle}>
                    {isDeveloper
                      ? 'Pembayaran Iuran Terbaru'
                      : isRw
                      ? 'Pembayaran Iuran Wilayah RW'
                      : 'Pembayaran Iuran Warga RT'}
                  </Text>
                </View>
                {stats.recentPayments.map((p) => (
                  <View key={p.id} style={styles.feedItem}>
                    <View
                      style={[
                        styles.statusBadgeSmall,
                        p.status === 'approved'
                          ? styles.badgeSuccess
                          : p.status === 'pending_verification'
                          ? styles.badgeWarning
                          : styles.badgeError,
                      ]}
                    >
                      <Text style={styles.statusBadgeSmallText}>
                        {p.status === 'approved'
                          ? 'LUNAS'
                          : p.status === 'pending_verification'
                          ? 'MENUNGGU'
                          : 'DITOLAK'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.feedItemTitle}>
                        {formatRupiah(p.amount)} • {p.assignment?.due?.name || 'Iuran'}
                      </Text>
                      <Text style={styles.feedItemSub}>
                        Oleh: {p.paid_by?.full_name || 'Warga'} • Blok{' '}
                        {p.assignment?.house?.block || '-'} No.{' '}
                        {p.assignment?.house?.house_number || '-'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 5. Developer Orders Feed */}
            {isDeveloper && stats?.recentOrders && stats.recentOrders.length > 0 && (
              <View style={styles.feedCard}>
                <View style={styles.feedCardHeader}>
                  <Storefront size={18} color="#16A34A" weight="fill" />
                  <Text style={styles.feedCardTitle}>Pesanan Pasar Warga Terkini</Text>
                </View>
                {stats.recentOrders.map((o) => (
                  <View key={o.id} style={styles.feedItem}>
                    <View style={styles.feedItemDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.feedItemTitle}>
                        Order #{o.order_number} • {formatRupiah(o.total)}
                      </Text>
                      <Text style={styles.feedItemSub}>
                        Toko: {o.seller?.store_name} • Pembeli: {o.buyer?.full_name} • Status:{' '}
                        {o.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 6. Developer Announcements Feed */}
            {isDeveloper && stats?.recentAnnouncements && stats.recentAnnouncements.length > 0 && (
              <View style={styles.feedCard}>
                <View style={styles.feedCardHeader}>
                  <Megaphone size={18} color="#2563EB" weight="fill" />
                  <Text style={styles.feedCardTitle}>Pengumuman Terpublikasi</Text>
                </View>
                {stats.recentAnnouncements.map((a) => (
                  <View key={a.id} style={styles.feedItem}>
                    <View style={styles.feedItemDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.feedItemTitle}>{a.title}</Text>
                      <Text style={styles.feedItemSub}>
                        Target: {a.target_type.toUpperCase()} • Status: {a.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Daftar Warga Terdaftar ({members.length})</Text>
            {members.map((m) => (
              <View key={m.id} style={styles.memberCard}>
                {/* Header: Name, Role Badge, Status */}
                <View style={styles.memberHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{m.full_name || 'Warga Komplekku'}</Text>
                    <Text style={styles.memberContact}>{m.phone || 'Nomor HP belum ada'}</Text>
                  </View>
                  <View
                    style={[
                      styles.roleTag,
                      m.role === 'developer'
                        ? { backgroundColor: '#EDE9FE', borderColor: '#C4B5FD' }
                        : m.role === 'rw'
                        ? { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }
                        : m.role === 'rt'
                        ? { backgroundColor: '#CCFBF1', borderColor: '#5EEAD4' }
                        : { backgroundColor: Colors.stone[100], borderColor: Colors.stone[200] },
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleTagText,
                        m.role === 'developer'
                          ? { color: '#6D28D9' }
                          : m.role === 'rw'
                          ? { color: '#047857' }
                          : m.role === 'rt'
                          ? { color: '#0F766E' }
                          : { color: Colors.stone[600] },
                      ]}
                    >
                      {(m.role || 'warga').toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Badges Row: House, Territory & Family */}
                <View style={styles.memberBadgesRow}>
                  <View style={styles.unitBadge}>
                    <Text style={styles.unitBadgeText}>
                      {m.house
                        ? `Blok ${m.house.block || '-'} No. ${m.house.house_number || '-'}`
                        : 'Rumah Belum Terdaftar'}
                    </Text>
                  </View>

                  {m.rt && (
                    <View style={styles.unitBadge}>
                      <Text style={styles.unitBadgeText}>
                        RT {m.rt.code} / RW {m.rw?.code || '02'}
                      </Text>
                    </View>
                  )}

                  <View
                    style={[
                      styles.familyBadge,
                      m.is_primary ? styles.familyBadgePrimary : styles.familyBadgeMember,
                    ]}
                  >
                    <Text
                      style={[
                        styles.familyBadgeText,
                        m.is_primary
                          ? styles.familyBadgeTextPrimary
                          : styles.familyBadgeTextMember,
                      ]}
                    >
                      {m.is_primary ? 'Kepala Keluarga' : `Anggota (${m.relationship || 'Keluarga'})`}
                    </Text>
                  </View>
                </View>

                {/* Status Badges */}
                <View style={styles.memberStatusRow}>
                  {m.verification_status === 'pending' && (
                    <View style={styles.badgeWarning}>
                      <Text style={styles.statusBadgeSmallText}>Menunggu Verifikasi</Text>
                    </View>
                  )}
                  {m.resident_status === 'blocked' ? (
                    <View style={styles.badgeError}>
                      <Text style={styles.statusBadgeSmallText}>Akun Diblokir</Text>
                    </View>
                  ) : (
                    <View style={styles.badgeSuccess}>
                      <Text style={styles.statusBadgeSmallText}>Warga Aktif</Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons Row */}
                <View style={styles.memberActionsRow}>
                  {m.verification_status === 'pending' && (
                    <TouchableOpacity
                      style={[styles.pillBtn, styles.pillBtnSuccess, { flex: 1 }]}
                      onPress={() => handleVerifyMember(m)}
                    >
                      <UserCheck size={14} color={Colors.semantic.success[700]} weight="bold" />
                      <Text style={styles.pillBtnTextSuccess}>Verifikasi Warga</Text>
                    </TouchableOpacity>
                  )}

                  {assignableRoles.length > 0 && (
                    <TouchableOpacity
                      style={[styles.pillBtn, { flex: 1 }]}
                      onPress={() => handleOpenRoleModal(m)}
                    >
                      <ShieldCheck size={14} color={Colors.stone[700]} weight="bold" />
                      <Text style={styles.pillBtnText}>Kelola Peran</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.pillBtn,
                      m.resident_status === 'blocked'
                        ? styles.pillBtnSuccess
                        : styles.pillBtnDanger,
                      { minWidth: 80 },
                    ]}
                    onPress={() => handleToggleMemberStatus(m)}
                  >
                    <Text
                      style={[
                        styles.pillBtnText,
                        m.resident_status === 'blocked'
                          ? styles.pillBtnTextSuccess
                          : styles.pillBtnTextDanger,
                      ]}
                    >
                      {m.resident_status === 'blocked' ? 'Buka Blokir' : 'Blokir'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* SELLERS TAB */}
        {activeTab === 'sellers' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Daftar Penjual / Toko ({sellers.length})</Text>
            {sellers.map((s) => (
              <View key={s.id} style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowTitleWrap}>
                    <Text style={styles.rowTitle}>{s.store_name}</Text>
                    {s.status === 'active' ? (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Aktif</Text>
                      </View>
                    ) : (
                      <View style={styles.blockedBadge}>
                        <Text style={styles.blockedBadgeText}>Nonaktif</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.rowSub}>
                    Pemilik: {s.user?.full_name || 'Warga'} • {s.description || 'Tidak ada deskripsi'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.pillBtn, s.status === 'active' ? styles.pillBtnDanger : styles.pillBtnSuccess]}
                  onPress={() => handleToggleSellerStatus(s)}
                >
                  <Text style={[styles.pillBtnText, s.status === 'active' ? styles.pillBtnTextDanger : styles.pillBtnTextSuccess]}>
                    {s.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Daftar Produk ({products.length})</Text>
            {products.map((p) => (
              <View key={p.id} style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowTitleWrap}>
                    <Text style={styles.rowTitle}>{p.name}</Text>
                    <View style={p.status === 'active' ? styles.activeBadge : styles.blockedBadge}>
                      <Text style={p.status === 'active' ? styles.activeBadgeText : styles.blockedBadgeText}>
                        {p.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.rowSub}>
                    {formatRupiah(p.price)} • Stok: {p.stock} • Toko: {p.seller?.store_name || '-'}
                  </Text>
                </View>

                <View style={styles.actionCol}>
                  {p.status === 'active' ? (
                    <TouchableOpacity
                      style={[styles.pillBtn, styles.pillBtnDanger]}
                      onPress={() => handleModerateProduct(p, 'inactive')}
                    >
                      <Text style={[styles.pillBtnText, styles.pillBtnTextDanger]}>Nonaktifkan</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.pillBtn, styles.pillBtnSuccess]}
                      onPress={() => handleModerateProduct(p, 'active')}
                    >
                      <Text style={[styles.pillBtnText, styles.pillBtnTextSuccess]}>Aktifkan</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Semua Pesanan di Komplek ({orders.length})</Text>
            {orders.map((o) => (
              <View key={o.id} style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>
                    Pesanan <Text style={{ fontFamily: FontFamily.mono }}>#{o.order_number}</Text>
                  </Text>
                  <Text style={styles.rowSub}>
                    Pembeli: {o.buyer?.full_name || 'Warga'} • Penjual: {o.seller?.store_name || 'Toko'}
                  </Text>
                  <Text style={[styles.rowSub, { color: Colors.primary[700], fontWeight: '600', marginTop: 2 }]}>
                    {formatRupiah(Number(o.total))} • Status: {o.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Pengaturan Komplek</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nama Komplek</Text>
              <TextInput
                style={styles.formInput}
                value={commName}
                onChangeText={setCommName}
                placeholder="Nama Perumahan / Apartemen"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Alamat Lengkap</Text>
              <TextInput
                style={[styles.formInput, { height: 70 }]}
                value={commAddr}
                onChangeText={setCommAddr}
                multiline
                placeholder="Alamat jalan, kelurahan, kecamatan"
              />
            </View>

            <Button
              label={savingSettings ? 'Menyimpan...' : 'Simpan Perubahan'}
              onPress={handleSaveSettings}
              disabled={savingSettings}
              style={{ marginTop: Spacing[4] }}
            />
          </View>
        )}
      </ScrollView>

      {/* Role Management Modal (Phase 2) */}
      <Modal
        visible={roleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Kelola Peran Warga</Text>
                <Text style={styles.modalSub}>
                  {selectedMemberForRole?.full_name || 'Warga'} (Saat ini:{' '}
                  {selectedMemberForRole?.role?.toUpperCase()})
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setRoleModalVisible(false)}
                hitSlop={8}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={Colors.stone[600]} />
              </TouchableOpacity>
            </View>

            <View style={styles.roleOptionsList}>
              {assignableRoles.map((role) => {
                const isCurrent = selectedMemberForRole?.role === role;
                const roleLabel =
                  role === 'developer'
                    ? 'Pengelola Master (Developer)'
                    : role === 'rw'
                    ? 'Pengurus RW'
                    : role === 'rt'
                    ? 'Pengurus RT'
                    : 'Warga Residen';
                const roleColor =
                  role === 'developer'
                    ? '#6D28D9'
                    : role === 'rw'
                    ? '#047857'
                    : role === 'rt'
                    ? '#0F766E'
                    : Colors.stone[700];

                return (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleOptionCard, isCurrent && styles.roleOptionCardActive]}
                    onPress={() => handleSelectNewRole(role)}
                    disabled={savingRole}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.roleOptionTitle, { color: roleColor }]}>
                        {roleLabel}
                      </Text>
                      <Text style={styles.roleOptionDesc}>
                        {role === 'developer'
                          ? 'Akses penuh ke seluruh pengaturan instance komplek, moderasi toko, dan struktur wilayah.'
                          : role === 'rw'
                          ? 'Mengelola dan memonitor data operasional seluruh RT dalam wilayah RW.'
                          : role === 'rt'
                          ? 'Operasional warga, verifikasi bukti bayar iuran, dan keluhan warga RT.'
                          : 'Akses warga residen biasa untuk iuran, keluhan lingkungan, dan pasar komplek.'}
                      </Text>
                    </View>
                    {isCurrent && (
                      <View style={styles.currentRoleBadge}>
                        <Text style={styles.currentRoleBadgeText}>Aktif</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.stone[0],
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[6],
  },
  deniedIcon: {
    marginBottom: Spacing[4],
  },
  deniedTitle: {
    ...Typography.h1,
    color: Colors.semantic.error[700],
    marginBottom: Spacing[2],
  },
  deniedDesc: {
    ...Typography.bodyM,
    color: Colors.stone[600],
    textAlign: 'center',
    lineHeight: 22,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[200],
  },
  backBtn: {
    padding: Spacing[1],
    marginRight: Spacing[2],
  },
  topBarTitle: {
    ...Typography.h2,
    color: Colors.stone[900],
  },
  topBarSub: {
    ...Typography.bodyS,
    color: Colors.stone[500],
  },
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[200],
    backgroundColor: Colors.stone[50],
  },
  tabScroll: {
    paddingHorizontal: Spacing[4],
    gap: Spacing[2],
  },
  tabItem: {
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.primary[600],
  },
  tabText: {
    ...Typography.bodyM,
    color: Colors.stone[500],
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.primary[700],
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing[4],
    paddingBottom: Spacing[10],
  },
  overviewContainer: {
    gap: Spacing[4],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
  },
  statCard: {
    width: '47.5%',
    backgroundColor: Colors.stone[50],
    borderWidth: 1,
    borderColor: Colors.stone[200],
    borderRadius: Radius.md,
    padding: Spacing[4],
    alignItems: 'center',
  },
  statIconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  statNumber: {
    ...Typography.h1,
    color: Colors.stone[900],
  },
  statLabel: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    marginTop: 2,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    padding: Spacing[4],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    gap: Spacing[3],
  },
  infoBannerText: {
    ...Typography.bodyS,
    color: Colors.primary[900],
    flex: 1,
    lineHeight: 18,
  },
  sectionContainer: {
    gap: Spacing[3],
  },
  sectionHeader: {
    ...Typography.h3,
    color: Colors.stone[900],
    marginBottom: Spacing[1],
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.stone[50],
    borderWidth: 1,
    borderColor: Colors.stone[200],
    borderRadius: Radius.md,
    padding: Spacing[3],
    gap: Spacing[2],
  },
  rowTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    flexWrap: 'wrap',
  },
  rowTitle: {
    ...Typography.bodyM,
    fontWeight: '700',
    color: Colors.stone[900],
  },
  rowSub: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    marginTop: 2,
  },
  actionCol: {
    gap: 4,
  },
  pillBtn: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: Colors.stone[200],
    alignItems: 'center',
  },
  pillBtnText: {
    ...Typography.bodyS,
    fontSize: 11,
    color: Colors.stone[800],
    fontWeight: '600',
  },
  pillBtnDanger: {
    backgroundColor: Colors.semantic.error[50],
  },
  pillBtnTextDanger: {
    color: Colors.semantic.error[700],
  },
  pillBtnSuccess: {
    backgroundColor: Colors.semantic.success[50],
  },
  pillBtnTextSuccess: {
    color: Colors.semantic.success[700],
  },
  adminBadge: {
    backgroundColor: Colors.primary[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary[800],
  },
  activeBadge: {
    backgroundColor: Colors.semantic.success[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.semantic.success[700],
  },
  blockedBadge: {
    backgroundColor: Colors.semantic.error[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  blockedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.semantic.error[700],
  },
  formGroup: {
    marginBottom: Spacing[3],
  },
  formLabel: {
    ...Typography.bodyS,
    fontWeight: '600',
    color: Colors.stone[700],
    marginBottom: 4,
  },
  formInput: {
    borderWidth: 1,
    borderColor: Colors.stone[200],
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    ...Typography.bodyM,
    color: Colors.stone[900],
    backgroundColor: Colors.stone[0],
  },
  breakdownSection: {
    marginTop: Spacing[4],
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.stone[200],
  },
  breakdownTitle: {
    ...Typography.h3,
    color: Colors.stone[900],
    marginBottom: Spacing[3],
  },
  breakdownGrid: {
    gap: Spacing[2],
  },
  breakdownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing[3],
    backgroundColor: Colors.stone[50],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[200],
  },
  breakdownCode: {
    ...Typography.bodyM,
    fontWeight: '700',
    color: Colors.primary[800],
    width: 60,
  },
  breakdownName: {
    ...Typography.bodyM,
    color: Colors.stone[800],
    flex: 1,
  },
  breakdownStat: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    fontWeight: '600',
  },
  breakdownStatWrap: {
    alignItems: 'flex-end',
  },
  breakdownSubStat: {
    ...Typography.bodyS,
    fontSize: 11,
    color: Colors.stone[400],
    marginTop: 2,
  },
  feedCard: {
    marginTop: Spacing[4],
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.stone[200],
  },
  feedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[100],
    paddingBottom: Spacing[2],
  },
  feedCardTitle: {
    ...Typography.h3,
    fontSize: 15,
    color: Colors.stone[900],
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[2],
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[100],
  },
  feedItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary[500],
    marginTop: 6,
  },
  feedItemTitle: {
    ...Typography.label,
    fontSize: 13,
    color: Colors.stone[800],
  },
  feedItemSub: {
    ...Typography.bodyS,
    fontSize: 11,
    color: Colors.stone[500],
    marginTop: 2,
  },
  priorityPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  priorityUrgent: {
    backgroundColor: '#FEE2E2',
  },
  priorityHigh: {
    backgroundColor: '#FFEDD5',
  },
  priorityNormal: {
    backgroundColor: '#EFF6FF',
  },
  priorityPillText: {
    ...Typography.overline,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.stone[700],
  },
  statusBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  statusBadgeSmallText: {
    ...Typography.overline,
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badgeSuccess: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  badgeWarning: {
    backgroundColor: '#D97706',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  badgeError: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[200],
    padding: Spacing[4],
    marginBottom: Spacing[3],
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[2],
  },
  memberName: {
    ...Typography.h3,
    fontSize: 15,
    color: Colors.stone[900],
  },
  memberContact: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    marginTop: 1,
  },
  roleTag: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  roleTagText: {
    ...Typography.overline,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  memberBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: Spacing[2],
  },
  unitBadge: {
    backgroundColor: Colors.stone[100],
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  unitBadgeText: {
    ...Typography.bodyS,
    fontSize: 11,
    color: Colors.stone[700],
  },
  familyBadge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  familyBadgePrimary: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  familyBadgeMember: {
    backgroundColor: Colors.stone[50],
    borderWidth: 1,
    borderColor: Colors.stone[200],
  },
  familyBadgeText: {
    ...Typography.bodyS,
    fontSize: 11,
    fontWeight: '600',
  },
  familyBadgeTextPrimary: {
    color: '#1D4ED8',
  },
  familyBadgeTextMember: {
    color: Colors.stone[600],
  },
  memberStatusRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing[3],
    marginTop: 2,
  },
  memberActionsRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    borderTopWidth: 1,
    borderTopColor: Colors.stone[100],
    paddingTop: Spacing[2],
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing[4],
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing[4],
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[100],
    paddingBottom: Spacing[2],
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.stone[900],
  },
  modalSub: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  roleOptionsList: {
    gap: Spacing[2],
  },
  roleOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[200],
    backgroundColor: Colors.stone[50],
  },
  roleOptionCardActive: {
    borderColor: Colors.primary[600],
    backgroundColor: Colors.primary[50],
  },
  roleOptionTitle: {
    ...Typography.label,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  roleOptionDesc: {
    ...Typography.bodyS,
    fontSize: 11,
    color: Colors.stone[500],
    lineHeight: 15,
  },
  currentRoleBadge: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    marginLeft: Spacing[2],
  },
  currentRoleBadgeText: {
    ...Typography.overline,
    color: '#FFFFFF',
    fontSize: 9,
  },
});
