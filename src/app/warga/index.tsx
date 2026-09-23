import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  CaretLeft,
  House,
  CheckCircle,
  Clock,
  User,
  Users,
  MagnifyingGlass,
  Check,
  ShieldCheck,
} from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useComplex } from '@/lib/complex-provider';
import { useSupabase } from '@/lib/supabase-provider';
import {
  getCommunityMembers,
  updateMemberStatus,
  type CommunityMemberWithProfile,
  type RoleScopeFilter,
} from '@/services/admin';
import { LoadingState } from '@/components/ui/LoadingState';

/**
 * Module Warga — PRD v2 §10, §11 & UPGRADE_ROADMAP_V3 Phase 3
 * Dual mode for RT/RW/Developer: "Rumah Saya" & "Direktori Warga RT/RW"
 */
export default function WargaScreen() {
  const { household, complexSettings, activeRole, isRw, isRt, isDeveloper } = useComplex();
  const { profile } = useSupabase();

  const isManagement = isDeveloper || isRw || isRt;
  const [activeTab, setActiveTab] = useState<'my_house' | 'directory'>('my_house');

  // Directory states
  const [members, setMembers] = useState<CommunityMemberWithProfile[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const roleScope: RoleScopeFilter = useMemo(
    () => ({
      role: activeRole,
      rwId: household?.rw?.id || null,
      rtId: household?.rt?.id || null,
    }),
    [activeRole, household]
  );

  const loadMembers = useCallback(async () => {
    if (!isManagement) return;
    setLoadingMembers(true);
    try {
      const { data } = await getCommunityMembers(roleScope);
      setMembers(data);
    } catch {
      // Fallback
    } finally {
      setLoadingMembers(false);
      setRefreshing(false);
    }
  }, [isManagement, roleScope]);

  useEffect(() => {
    if (activeTab === 'directory') {
      void loadMembers();
    }
  }, [activeTab, loadMembers]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'directory') {
      await loadMembers();
    } else {
      setRefreshing(false);
    }
  };

  const handleVerifyMember = (member: CommunityMemberWithProfile) => {
    Alert.alert(
      'Verifikasi Warga',
      `Verifikasi warga ${member.full_name} sebagai warga resmi?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Verifikasi',
          onPress: async () => {
            const { error } = await updateMemberStatus(member.id, {
              resident_status: 'active',
              verification_status: 'verified',
            });
            if (error) {
              Alert.alert('Gagal', error.message);
            } else {
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

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.full_name?.toLowerCase().includes(q) ||
        m.house?.house_number?.toLowerCase().includes(q) ||
        m.house?.block?.toLowerCase().includes(q) ||
        m.phone?.includes(q)
    );
  }, [members, searchQuery]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        {router.canGoBack() && (
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
            <CaretLeft size={20} color={Colors.stone[700]} />
            <Text style={styles.backButtonText}>Kembali</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Data Warga & Rumah</Text>
        <Text style={styles.subtitle}>
          {complexSettings?.name || 'Komplekku'} • RT {household?.rt?.code || '01'} / RW{' '}
          {household?.rw?.code || '01'}
        </Text>

        {/* Tab switcher for Management */}
        {isManagement && (
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[styles.switchButton, activeTab === 'my_house' && styles.switchButtonActive]}
              onPress={() => setActiveTab('my_house')}
            >
              <Text
                style={[
                  styles.switchButtonText,
                  activeTab === 'my_house' && styles.switchButtonTextActive,
                ]}
              >
                Rumah Saya
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.switchButton, activeTab === 'directory' && styles.switchButtonActive]}
              onPress={() => setActiveTab('directory')}
            >
              <Text
                style={[
                  styles.switchButtonText,
                  activeTab === 'directory' && styles.switchButtonTextActive,
                ]}
              >
                Direktori Warga ({members.length > 0 ? members.length : '...'})
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {activeTab === 'directory' && isManagement ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary[600]]}
            />
          }
        >
          {/* Search Bar */}
          <View style={styles.searchBox}>
            <MagnifyingGlass size={18} color={Colors.stone[400]} />
            <TextInput
              placeholder="Cari warga, nomor rumah, atau blok..."
              placeholderTextColor={Colors.stone[400]}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {loadingMembers ? (
            <LoadingState fullScreen={false} style={{ marginTop: 40 }} />
          ) : filteredMembers.length === 0 ? (
            <View style={styles.emptyCard}>
              <Users size={32} color={Colors.stone[300]} />
              <Text style={styles.emptyCardTitle}>Tidak Ada Warga Ditemukan</Text>
              <Text style={styles.emptyCardSub}>
                Coba sesuaikan kata kunci pencarian warga di wilayah ini.
              </Text>
            </View>
          ) : (
            filteredMembers.map((m) => (
              <View key={m.id} style={styles.memberCardDirectory}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {m.full_name ? m.full_name[0]?.toUpperCase() : 'W'}
                  </Text>
                </View>

                <View style={styles.memberDetails}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberNameText}>{m.full_name || 'Warga'}</Text>
                    {m.verification_status === 'verified' ? (
                      <View style={styles.badgeVerified}>
                        <CheckCircle size={12} color="#15803D" weight="bold" />
                        <Text style={styles.badgeVerifiedText}>Terverifikasi</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.badgePendingTouch}
                        onPress={() => handleVerifyMember(m)}
                      >
                        <Check size={12} color="#FFFFFF" weight="bold" />
                        <Text style={styles.badgePendingText}>Verifikasi</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={styles.memberHouseText}>
                    {m.house
                      ? `${m.house.block ? `Blok ${m.house.block} ` : ''}No. ${m.house.house_number}`
                      : 'Belum Terhubung ke Rumah'}
                    {m.rt ? ` • RT ${m.rt.code}` : ''}
                  </Text>

                  {m.phone && <Text style={styles.memberPhoneText}>📞 {m.phone}</Text>}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* House Overview Card */}
          {household?.house ? (
            <View style={styles.houseCard}>
              <View style={styles.houseIconBox}>
                <House size={32} color={Colors.primary[600]} weight="fill" />
              </View>
              <View style={styles.houseInfo}>
                <Text style={styles.houseNumber}>
                  {household.house.block ? `Blok ${household.house.block} ` : ''}
                  No. {household.house.house_number}
                </Text>
                <Text style={styles.houseAddress}>
                  RT {household.rt?.code || '-'} / RW {household.rw?.code || '-'} •{' '}
                  {complexSettings?.name || 'Komplekku'}
                </Text>
                <View style={styles.statusRow}>
                  <View style={styles.verifiedBadge}>
                    <CheckCircle size={12} color="#15803D" weight="bold" />
                    <Text style={styles.verifiedText}>Warga Terverifikasi</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.pendingCard}>
              <Clock size={24} color="#D97706" />
              <View style={styles.pendingTextWrap}>
                <Text style={styles.pendingTitle}>Belum Dihubungkan ke Rumah</Text>
                <Text style={styles.pendingDesc}>
                  Silakan hubungi ketua RT atau pengurus perumahan untuk mengonfirmasi nomor rumah Anda.
                </Text>
              </View>
            </View>
          )}

          {/* Family Members in this house */}
          <Text style={styles.sectionHeading}>
            ANGGOTA KELUARGA ({household?.familyMembers?.length || 1})
          </Text>

          <View style={styles.cardList}>
            {household?.familyMembers && household.familyMembers.length > 0 ? (
              household.familyMembers.map((m) => (
                <View key={m.id} style={styles.memberCard}>
                  <View style={styles.avatarCircle}>
                    <User size={20} color={Colors.stone[600]} />
                  </View>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberHeader}>
                      <Text style={styles.memberName}>
                        {m.profile?.full_name || 'Anggota Keluarga'}
                      </Text>
                      {m.is_primary && (
                        <View style={styles.primaryTag}>
                          <Text style={styles.primaryTagText}>Kepala Keluarga</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.memberRel}>
                      Hubungan: {m.relationship === 'primary' ? 'Kepala Keluarga' : m.relationship}
                    </Text>
                    {m.profile?.phone && (
                      <Text style={styles.memberPhone}>📞 {m.profile.phone}</Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.memberCard}>
                <View style={styles.avatarCircle}>
                  <User size={20} color={Colors.stone[600]} />
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{profile?.full_name || 'Anda'}</Text>
                  <Text style={styles.memberRel}>Kepala Keluarga</Text>
                </View>
              </View>
            )}
          </View>

          {/* RT & RW Structure Info (PRD v2 §11) */}
          <Text style={styles.sectionHeading}>STRUKTUR KEPENGURUSAN</Text>
          <View style={styles.structureCard}>
            <View style={styles.structureItem}>
              <View style={styles.structureBadge}>
                <Text style={styles.structureBadgeText}>RT</Text>
              </View>
              <View style={styles.structureTextWrap}>
                <Text style={styles.structureTitle}>
                  {household?.rt?.name || `RT ${household?.rt?.code || '01'}`}
                </Text>
                <Text style={styles.structureSub}>
                  Rukun Tetangga Unit {household?.rt?.code || '01'}
                </Text>
              </View>
            </View>

            <View style={styles.structureDivider} />

            <View style={styles.structureItem}>
              <View style={[styles.structureBadge, { backgroundColor: '#EDE9FE' }]}>
                <Text style={[styles.structureBadgeText, { color: '#6D28D9' }]}>RW</Text>
              </View>
              <View style={styles.structureTextWrap}>
                <Text style={styles.structureTitle}>
                  {household?.rw?.name || `RW ${household?.rw?.code || '01'}`}
                </Text>
                <Text style={styles.structureSub}>
                  Rukun Warga Unit {household?.rw?.code || '01'}
                </Text>
              </View>
            </View>
          </View>

          {/* Complex Info */}
          <Text style={styles.sectionHeading}>INFORMASI KOMPLEK</Text>
          <View style={styles.complexCard}>
            <Text style={styles.complexTitle}>{complexSettings?.name || 'Komplekku'}</Text>
            {complexSettings?.address && (
              <Text style={styles.complexAddress}>{complexSettings.address}</Text>
            )}
            {complexSettings?.phone && (
              <Text style={styles.complexContact}>Kontak Pengelola: {complexSettings.phone}</Text>
            )}
          </View>
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
  title: {
    ...Typography.h2,
    color: Colors.stone[800],
  },
  subtitle: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    marginTop: 2,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.stone[100],
    borderRadius: Radius.sm,
    padding: 3,
    marginTop: Spacing[3],
  },
  switchButton: {
    flex: 1,
    paddingVertical: Spacing[2],
    alignItems: 'center',
    borderRadius: Radius.xs,
  },
  switchButtonActive: {
    backgroundColor: Colors.stone[0],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  switchButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.stone[500],
  },
  switchButtonTextActive: {
    color: Colors.primary[700],
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing[4],
    paddingBottom: Spacing[10],
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.stone[0],
    borderWidth: 1,
    borderColor: Colors.stone[200],
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    marginBottom: Spacing[4],
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.stone[800],
  },
  memberCardDirectory: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[3],
    gap: Spacing[3],
    marginBottom: Spacing[2],
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary[700],
  },
  memberDetails: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  memberNameText: {
    ...Typography.label,
    fontSize: 14,
    color: Colors.stone[800],
    fontWeight: '700',
  },
  badgeVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  badgeVerifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  badgePendingTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  badgePendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  memberHouseText: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    fontSize: 12,
    marginTop: 2,
  },
  memberPhoneText: {
    ...Typography.bodyS,
    color: Colors.stone[400],
    fontSize: 11,
    marginTop: 2,
  },
  houseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[4],
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  houseIconBox: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  houseInfo: {
    flex: 1,
  },
  houseNumber: {
    ...Typography.h2,
    color: Colors.stone[800],
    fontSize: 18,
  },
  houseAddress: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    marginTop: 2,
  },
  statusRow: {
    marginTop: Spacing[2],
    flexDirection: 'row',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  verifiedText: {
    ...Typography.overline,
    color: '#15803D',
    fontSize: 10,
    fontWeight: '700',
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: Radius.md,
    padding: Spacing[4],
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  pendingTextWrap: {
    flex: 1,
  },
  pendingTitle: {
    ...Typography.label,
    color: '#92400E',
    fontWeight: '700',
  },
  pendingDesc: {
    ...Typography.bodyS,
    color: '#B45309',
    marginTop: 2,
    fontSize: 12,
  },
  sectionHeading: {
    ...Typography.overline,
    color: Colors.stone[400],
    marginBottom: Spacing[2],
    letterSpacing: 0.8,
  },
  cardList: {
    gap: Spacing[2],
    marginBottom: Spacing[4],
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[3],
    gap: Spacing[3],
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.stone[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberName: {
    ...Typography.label,
    color: Colors.stone[800],
    fontWeight: '700',
    fontSize: 14,
  },
  primaryTag: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  primaryTagText: {
    color: Colors.primary[700],
    fontSize: 9,
    fontWeight: '700',
  },
  memberRel: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    fontSize: 12,
    marginTop: 2,
  },
  memberPhone: {
    ...Typography.bodyS,
    color: Colors.stone[400],
    fontSize: 11,
    marginTop: 2,
  },
  structureCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[3],
    marginBottom: Spacing[4],
  },
  structureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[1],
  },
  structureBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  structureBadgeText: {
    fontWeight: '800',
    color: Colors.primary[700],
    fontSize: 13,
  },
  structureTextWrap: {
    flex: 1,
  },
  structureTitle: {
    ...Typography.label,
    color: Colors.stone[800],
    fontWeight: '700',
  },
  structureSub: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    fontSize: 11,
  },
  structureDivider: {
    height: 1,
    backgroundColor: Colors.stone[100],
    marginVertical: Spacing[2],
  },
  complexCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[4],
  },
  complexTitle: {
    ...Typography.label,
    color: Colors.stone[800],
    fontWeight: '700',
    fontSize: 14,
  },
  complexAddress: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    marginTop: 2,
  },
  complexContact: {
    ...Typography.bodyS,
    color: Colors.stone[400],
    fontSize: 12,
    marginTop: Spacing[2],
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing[8],
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    marginVertical: Spacing[4],
  },
  emptyCardTitle: {
    ...Typography.label,
    fontSize: 15,
    color: Colors.stone[800],
    marginTop: Spacing[2],
  },
  emptyCardSub: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    textAlign: 'center',
    marginTop: Spacing[1],
  },
});
