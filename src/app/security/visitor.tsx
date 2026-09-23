import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  CaretLeft,
  QrCode,
  PlusCircle,
  CheckCircle,
  Clock,
  MagnifyingGlass,
  SignIn,
  SignOut,
  House as HouseIcon,
} from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/lib/supabase-provider';
import { useComplex } from '@/lib/complex-provider';
import {
  getMyVisitorPasses,
  getVisitorPasses,
  checkInVisitor,
  checkOutVisitor,
  type VisitorPassWithDetails,
} from '@/services/security';

export default function VisitorScreen() {
  const { user } = useAuth();
  const { isRw, isRt, isDeveloper } = useComplex();
  const isSecurityOrManager = isDeveloper || isRw || isRt;

  const [activeTab, setActiveTab] = useState<'my_passes' | 'checkpoint'>(
    isSecurityOrManager ? 'checkpoint' : 'my_passes'
  );
  const [myPasses, setMyPasses] = useState<VisitorPassWithDetails[]>([]);
  const [allPasses, setAllPasses] = useState<VisitorPassWithDetails[]>([]);
  const [searchCode, setSearchCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      if (activeTab === 'my_passes') {
        const { data } = await getMyVisitorPasses(user.id);
        setMyPasses(data);
      } else {
        const { data } = await getVisitorPasses({
          searchCode: searchCode.trim() || undefined,
        });
        setAllPasses(data);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeTab, searchCode]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCheckIn = async (passId: string) => {
    if (!user?.id) return;
    setActionBusy(passId);
    try {
      const { error } = await checkInVisitor(passId, user.id);
      if (error) {
        Alert.alert('Gagal Check In', error.message);
      } else {
        Alert.alert('Sukses', 'Tamu berhasil diverifikasi & check-in masuk komplek.');
        await loadData();
      }
    } finally {
      setActionBusy(null);
    }
  };

  const handleCheckOut = async (passId: string) => {
    if (!user?.id) return;
    setActionBusy(passId);
    try {
      const { error } = await checkOutVisitor(passId, user.id);
      if (error) {
        Alert.alert('Gagal Check Out', error.message);
      } else {
        Alert.alert('Sukses', 'Tamu telah keluar komplek (check-out).');
        await loadData();
      }
    } finally {
      setActionBusy(null);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'checked_in':
        return (
          <View style={[styles.badge, { backgroundColor: '#DCFCE7' }]}>
            <CheckCircle size={12} color="#16A34A" weight="bold" />
            <Text style={[styles.badgeText, { color: '#15803D' }]}>Di Komplek</Text>
          </View>
        );
      case 'checked_out':
        return (
          <View style={[styles.badge, { backgroundColor: Colors.stone[100] }]}>
            <SignOut size={12} color={Colors.stone[600]} weight="bold" />
            <Text style={[styles.badgeText, { color: Colors.stone[600] }]}>Keluar</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
            <Clock size={12} color="#D97706" weight="bold" />
            <Text style={[styles.badgeText, { color: '#B45309' }]}>Menunggu</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(main)' as any))}
          hitSlop={8}
          style={styles.backButton}
        >
          <CaretLeft size={20} color={Colors.stone[700]} />
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Buku Tamu Digital</Text>
            <Text style={styles.subtitle}>
              Izin tamu komplek dengan kode akses pos satpam.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push('/security/create-visitor' as any)}
          >
            <PlusCircle size={18} color="#FFFFFF" weight="bold" />
            <Text style={styles.createBtnText}>Buat Izin</Text>
          </TouchableOpacity>
        </View>

        {/* Tab switch for Security / Managers */}
        {isSecurityOrManager && (
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'checkpoint' && styles.tabBtnActive]}
              onPress={() => setActiveTab('checkpoint')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'checkpoint' && styles.tabBtnTextActive,
                ]}
              >
                Pemeriksaan Satpam
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'my_passes' && styles.tabBtnActive]}
              onPress={() => setActiveTab('my_passes')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'my_passes' && styles.tabBtnTextActive,
                ]}
              >
                Izin Tamu Saya
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary[600]]}
            />
          }
        >
          {/* Checkpoint Search Box */}
          {activeTab === 'checkpoint' && (
            <View style={styles.searchBar}>
              <MagnifyingGlass size={18} color={Colors.stone[400]} />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari kode akses (KMP-XXXX) atau plat nomor..."
                placeholderTextColor={Colors.stone[400]}
                value={searchCode}
                onChangeText={setSearchCode}
                onSubmitEditing={loadData}
              />
            </View>
          )}

          {/* List Passes */}
          {(activeTab === 'my_passes' ? myPasses : allPasses).length === 0 ? (
            <View style={styles.emptyCard}>
              <QrCode size={40} color={Colors.stone[300]} />
              <Text style={styles.emptyTitle}>Belum Ada Data Tamu</Text>
              <Text style={styles.emptyDesc}>
                {activeTab === 'my_passes'
                  ? 'Anda belum membuat izin kedatangan tamu. Buat sekarang untuk memudahkan tamu saat tiba di gerbang.'
                  : 'Tidak ada data izin tamu yang sesuai pencarian.'}
              </Text>
            </View>
          ) : (
            (activeTab === 'my_passes' ? myPasses : allPasses).map((p) => {
              const isBusy = actionBusy === p.id;
              return (
                <View key={p.id} style={styles.passCard}>
                  <View style={styles.passHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.guestName}>{p.guest_name}</Text>
                      <Text style={styles.guestPurpose}>{p.purpose}</Text>
                    </View>
                    {renderStatusBadge(p.status)}
                  </View>

                  {/* Code Card */}
                  <View style={styles.codeBox}>
                    <Text style={styles.codeLabel}>KODE AKSES GERBANG:</Text>
                    <Text style={styles.codeText}>{p.access_code}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <HouseIcon size={16} color={Colors.stone[500]} />
                    <Text style={styles.detailText}>
                      Tujuan: Blok {p.house?.block || '-'} No. {p.house?.house_number || '-'}
                    </Text>
                  </View>

                  {p.vehicle_plate && (
                    <Text style={styles.subDetail}>Kendaraan: {p.vehicle_plate}</Text>
                  )}
                  <Text style={styles.subDetail}>Tanggal: {p.visit_date}</Text>

                  {/* Security Actions */}
                  {isSecurityOrManager && activeTab === 'checkpoint' && (
                    <View style={styles.actionRow}>
                      {p.status === 'expected' && (
                        <TouchableOpacity
                          style={[styles.checkInBtn, isBusy && styles.btnDisabled]}
                          onPress={() => handleCheckIn(p.id)}
                          disabled={isBusy}
                        >
                          <SignIn size={16} color="#FFFFFF" weight="bold" />
                          <Text style={styles.actionBtnText}>Check In Masuk</Text>
                        </TouchableOpacity>
                      )}

                      {p.status === 'checked_in' && (
                        <TouchableOpacity
                          style={[styles.checkOutBtn, isBusy && styles.btnDisabled]}
                          onPress={() => handleCheckOut(p.id)}
                          disabled={isBusy}
                        >
                          <SignOut size={16} color="#FFFFFF" weight="bold" />
                          <Text style={styles.actionBtnText}>Check Out Keluar</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.md,
  },
  createBtnText: {
    ...Typography.label,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: Spacing[3],
    backgroundColor: Colors.stone[100],
    padding: 3,
    borderRadius: Radius.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  tabBtnActive: {
    backgroundColor: Colors.stone[0],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtnText: {
    ...Typography.bodyS,
    color: Colors.stone[600],
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: Colors.primary[800],
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Spacing[4],
    gap: Spacing[3],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[200],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.stone[900],
  },
  passCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.stone[200],
    gap: Spacing[2],
  },
  passHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  guestName: {
    ...Typography.bodyM,
    fontWeight: '700',
    color: Colors.stone[900],
  },
  guestPurpose: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: {
    ...Typography.bodyS,
    fontSize: 11,
    fontWeight: '700',
  },
  codeBox: {
    backgroundColor: Colors.primary[50],
    padding: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    alignItems: 'center',
    marginVertical: 4,
  },
  codeLabel: {
    ...Typography.overline,
    color: Colors.primary[700],
    letterSpacing: 1,
    fontSize: 10,
  },
  codeText: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 24,
    color: Colors.primary[800],
    letterSpacing: 2,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    ...Typography.bodyS,
    color: Colors.stone[800],
    fontWeight: '600',
  },
  subDetail: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: Spacing[2],
  },
  checkInBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingVertical: Spacing[2],
    borderRadius: Radius.md,
  },
  checkOutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.stone[700],
    paddingVertical: Spacing[2],
    borderRadius: Radius.md,
  },
  actionBtnText: {
    ...Typography.label,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  emptyCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    padding: Spacing[6],
    alignItems: 'center',
    gap: Spacing[2],
    borderWidth: 1,
    borderColor: Colors.stone[200],
    marginTop: Spacing[6],
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.stone[900],
  },
  emptyDesc: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    textAlign: 'center',
  },
});
