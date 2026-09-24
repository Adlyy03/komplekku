import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { popup } from '@/lib/popup';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  CaretLeft,
  CaretRight,
  House,
  CheckCircle,
  Clock,
  User,
  Users,
  MagnifyingGlass,
  Check,
  Crown,
  IdentificationCard,
  PhoneCall,
  X,
  ArrowClockwise,
  Eye,
} from 'phosphor-react-native';
import { Colors, Radius, Spacing, FontFamily } from '@/constants/theme';
import { useComplex } from '@/lib/complex-provider';
import { useSupabase } from '@/lib/supabase-provider';
import {
  getCommunityMembers,
  updateMemberStatus,
  type CommunityMemberWithProfile,
  type RoleScopeFilter,
} from '@/services/admin';
import { getHouseFamilyMembers, RELATIONSHIP_LABELS } from '@/services/family';
import type { FamilyMember } from '@/types/database';
import { LoadingState } from '@/components/ui/LoadingState';
import { DesktopShell, useIsDesktop } from '@/components/ui/DesktopShell';

type StatusFilterType = 'all' | 'pending' | 'verified' | 'primary';
type SortByType = 'name_asc' | 'house_asc' | 'newest';

export default function WargaScreen() {
  const isDesktop = useIsDesktop();
  const { household, complexSettings, activeRole, isRw, isRt, isDeveloper } = useComplex();
  const { profile } = useSupabase();

  const isManagement = isDeveloper || isRw || isRt;
  const [activeTab, setActiveTab] = useState<'directory' | 'my_house'>(
    isManagement ? 'directory' : 'my_house'
  );

  // Detail panel / modal states
  const [selectedMember, setSelectedMember] = useState<CommunityMemberWithProfile | null>(null);
  const [selectedMemberFamily, setSelectedMemberFamily] = useState<FamilyMember[]>([]);
  const [loadingSelectedFamily, setLoadingSelectedFamily] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Directory data states
  const [members, setMembers] = useState<CommunityMemberWithProfile[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [rtFilter, setRtFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortByType>('name_asc');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 12;

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
      // Fallback cleanly
    } finally {
      setLoadingMembers(false);
      setRefreshing(false);
    }
  }, [isManagement, roleScope]);

  useEffect(() => {
    if (isManagement) {
      const timer = setTimeout(() => {
        void loadMembers();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isManagement, loadMembers]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'directory') {
      await loadMembers();
    } else {
      setRefreshing(false);
    }
  };

  const openMemberDetail = async (member: CommunityMemberWithProfile) => {
    setSelectedMember(member);
    if (!isDesktop) {
      setDetailModalVisible(true);
    }
    setSelectedMemberFamily([]);
    if (member.house?.id) {
      setLoadingSelectedFamily(true);
      try {
        const { data } = await getHouseFamilyMembers(member.house.id);
        setSelectedMemberFamily(data);
      } catch {
        // Fallback cleanly
      } finally {
        setLoadingSelectedFamily(false);
      }
    }
  };

  const handleVerifyMember = (member: CommunityMemberWithProfile) => {
    popup.confirm({
      title: 'Verifikasi Warga',
      message: `Verifikasi warga ${member.full_name} sebagai warga resmi komplek?`,
      confirmText: 'Ya, Verifikasi',
      cancelText: 'Batal',
      onConfirm: async () => {
        const { error } = await updateMemberStatus(member.id, {
          resident_status: 'active',
          verification_status: 'verified',
        });
        if (error) {
          popup.error('Gagal', error.message);
        } else {
          popup.success('Sukses', `Warga ${member.full_name} berhasil diverifikasi.`);
          setMembers((prev) =>
            prev.map((m) =>
              m.id === member.id
                ? { ...m, verification_status: 'verified', resident_status: 'active' }
                : m
            )
          );
          if (selectedMember?.id === member.id) {
            setSelectedMember((prev) =>
              prev ? { ...prev, verification_status: 'verified', resident_status: 'active' } : null
            );
          }
        }
      },
    });
  };

  // Unique RTs from data
  const availableRts = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => {
      if (m.rt?.code) set.add(m.rt.code);
    });
    return Array.from(set).sort();
  }, [members]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = members.length;
    const verified = members.filter((m) => m.verification_status === 'verified').length;
    const pending = members.filter((m) => m.verification_status !== 'verified').length;
    const primaryHeads = members.filter((m) => m.is_primary).length;
    const uniqueHouses = new Set(members.map((m) => m.house?.id).filter(Boolean)).size;

    return {
      total,
      verified,
      pending,
      primaryHeads,
      uniqueHouses,
    };
  }, [members]);

  // Filtered & sorted members
  const filteredMembers = useMemo(() => {
    let result = [...members];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.full_name?.toLowerCase().includes(q) ||
          m.house?.house_number?.toLowerCase().includes(q) ||
          m.house?.block?.toLowerCase().includes(q) ||
          m.phone?.includes(q) ||
          m.nik?.includes(q)
      );
    }

    // Status filter
    if (statusFilter === 'pending') {
      result = result.filter((m) => m.verification_status !== 'verified');
    } else if (statusFilter === 'verified') {
      result = result.filter((m) => m.verification_status === 'verified');
    } else if (statusFilter === 'primary') {
      result = result.filter((m) => m.is_primary);
    }

    // RT filter
    if (rtFilter !== 'all') {
      result = result.filter((m) => m.rt?.code === rtFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name_asc') {
        return (a.full_name || '').localeCompare(b.full_name || '');
      }
      if (sortBy === 'house_asc') {
        const houseA = `${a.house?.block || ''} ${a.house?.house_number || ''}`;
        const houseB = `${b.house?.block || ''} ${b.house?.house_number || ''}`;
        return houseA.localeCompare(houseB);
      }
      if (sortBy === 'newest') {
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      }
      return 0;
    });

    return result;
  }, [members, searchQuery, statusFilter, rtFilter, sortBy]);

  // Paginated members for table
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const paginatedMembers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, page, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 0);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, rtFilter, sortBy]);

  // ==========================================
  // DETAIL PANEL CONTENT (Shared Desktop / Modal)
  // ==========================================
  const renderMemberDetailContent = (member: CommunityMemberWithProfile) => (
    <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
      {/* Resident Header Profile Card */}
      <View style={styles.detailHeaderCard}>
        <View style={styles.detailAvatarWrap}>
          <Text style={styles.detailAvatarText}>
            {member.full_name ? member.full_name[0]?.toUpperCase() : 'W'}
          </Text>
        </View>

        <Text style={styles.detailName}>{member.full_name || 'Warga Tanpa Nama'}</Text>
        <Text style={styles.detailSubtext}>
          {member.house
            ? `${member.house.block ? `Blok ${member.house.block} ` : ''}No. ${member.house.house_number}`
            : 'Belum Terhubung ke Rumah'}
          {member.rt?.code ? ` • RT ${member.rt.code}` : ''}
          {member.rw?.code ? ` / RW ${member.rw.code}` : ''}
        </Text>

        <View style={styles.detailBadgesRow}>
          <View
            style={[
              styles.pillBadge,
              member.verification_status === 'verified'
                ? styles.pillBadgeSuccess
                : styles.pillBadgeWarning,
            ]}
          >
            {member.verification_status === 'verified' ? (
              <CheckCircle size={12} color="#15803D" weight="bold" />
            ) : (
              <Clock size={12} color="#B45309" weight="bold" />
            )}
            <Text
              style={[
                styles.pillBadgeText,
                member.verification_status === 'verified'
                  ? styles.pillBadgeTextSuccess
                  : styles.pillBadgeTextWarning,
              ]}
            >
              {member.verification_status === 'verified' ? 'Terverifikasi' : 'Menunggu Verifikasi'}
            </Text>
          </View>

          {member.is_primary && (
            <View style={styles.pillBadgeCrown}>
              <Crown size={12} color="#B45309" weight="fill" />
              <Text style={styles.pillBadgeTextCrown}>Kepala Keluarga</Text>
            </View>
          )}

          {member.role && (
            <View style={styles.pillBadgeRole}>
              <Text style={styles.pillBadgeTextRole}>{member.role.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Verification Action Button */}
        {member.verification_status !== 'verified' && (
          <TouchableOpacity
            style={styles.verifyActionBtn}
            onPress={() => handleVerifyMember(member)}
            activeOpacity={0.8}
          >
            <CheckCircle size={16} color="#FFFFFF" weight="bold" />
            <Text style={styles.verifyActionBtnText}>Setujui & Verifikasi Warga</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Section 1: Biodata Kependudukan */}
      <View style={styles.detailSection}>
        <View style={styles.detailSectionTitleRow}>
          <IdentificationCard size={16} color={Colors.primary[700]} weight="bold" />
          <Text style={styles.detailSectionTitle}>BIODATA KEPENDUDUKAN</Text>
        </View>

        <View style={styles.detailGridBox}>
          <View style={styles.detailGridRow}>
            <View style={styles.detailGridCol}>
              <Text style={styles.detailFieldLabel}>NIK (No. KTP)</Text>
              <Text style={styles.detailFieldValue}>{member.nik || '—'}</Text>
            </View>
            <View style={styles.detailGridCol}>
              <Text style={styles.detailFieldLabel}>Nomor Kartu Keluarga</Text>
              <Text style={styles.detailFieldValue}>{member.kk_number || '—'}</Text>
            </View>
          </View>

          <View style={styles.detailGridDivider} />

          <View style={styles.detailGridRow}>
            <View style={styles.detailGridCol}>
              <Text style={styles.detailFieldLabel}>Jenis Kelamin</Text>
              <Text style={styles.detailFieldValue}>
                {member.gender === 'male'
                  ? 'Laki-laki'
                  : member.gender === 'female'
                  ? 'Perempuan'
                  : '—'}
              </Text>
            </View>
            <View style={styles.detailGridCol}>
              <Text style={styles.detailFieldLabel}>Golongan Darah</Text>
              <Text style={styles.detailFieldValue}>{member.blood_type || '—'}</Text>
            </View>
          </View>

          <View style={styles.detailGridDivider} />

          <View style={styles.detailGridRow}>
            <View style={styles.detailGridCol}>
              <Text style={styles.detailFieldLabel}>Tempat, Tanggal Lahir</Text>
              <Text style={styles.detailFieldValue}>
                {member.birth_place ? `${member.birth_place}, ` : ''}
                {member.birth_date || '—'}
              </Text>
            </View>
            <View style={styles.detailGridCol}>
              <Text style={styles.detailFieldLabel}>Agama</Text>
              <Text style={styles.detailFieldValue}>{member.religion || '—'}</Text>
            </View>
          </View>

          <View style={styles.detailGridDivider} />

          <View style={styles.detailGridRow}>
            <View style={styles.detailGridCol}>
              <Text style={styles.detailFieldLabel}>Pekerjaan</Text>
              <Text style={styles.detailFieldValue}>{member.occupation || '—'}</Text>
            </View>
            <View style={styles.detailGridCol}>
              <Text style={styles.detailFieldLabel}>Status Pernikahan</Text>
              <Text style={styles.detailFieldValue}>
                {member.marital_status === 'single'
                  ? 'Belum Menikah'
                  : member.marital_status === 'married'
                  ? 'Menikah'
                  : member.marital_status === 'divorced'
                  ? 'Cerai Hidup'
                  : member.marital_status === 'widowed'
                  ? 'Cerai Mati'
                  : '—'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Section 2: Data Hunian & RT/RW */}
      <View style={styles.detailSection}>
        <View style={styles.detailSectionTitleRow}>
          <House size={16} color={Colors.primary[700]} weight="bold" />
          <Text style={styles.detailSectionTitle}>DATA HUNIAN & WILAYAH</Text>
        </View>

        <View style={styles.detailGridBox}>
          <View style={styles.detailGridRow}>
            <View style={styles.detailGridCol}>
              <Text style={styles.detailFieldLabel}>Nomor Rumah</Text>
              <Text style={styles.detailFieldValue}>
                {member.house
                  ? `${member.house.block ? `Blok ${member.house.block} ` : ''}No. ${member.house.house_number}`
                  : 'Belum terdaftar'}
              </Text>
            </View>
            <View style={styles.detailGridCol}>
              <Text style={styles.detailFieldLabel}>Wilayah Kepengurusan</Text>
              <Text style={styles.detailFieldValue}>
                RT {member.rt?.code || '01'} / RW {member.rw?.code || '01'}
              </Text>
            </View>
          </View>

          <View style={styles.detailGridDivider} />

          <View style={styles.detailGridRow}>
            <View style={styles.detailGridCol}>
              <Text style={styles.detailFieldLabel}>ID Kode Keluarga</Text>
              <Text style={styles.detailFieldValue}>
                {member.house?.family_code || member.family_code
                  ? `#${member.house?.family_code || member.family_code}`
                  : '—'}
              </Text>
            </View>
            <View style={styles.detailGridCol}>
              <Text style={styles.detailFieldLabel}>Status Dalam Rumah</Text>
              <Text style={styles.detailFieldValue}>
                {member.is_primary ? 'Kepala Keluarga' : 'Anggota Keluarga'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Section 3: Kontak & Darurat */}
      <View style={styles.detailSection}>
        <View style={styles.detailSectionTitleRow}>
          <PhoneCall size={16} color={Colors.primary[700]} weight="bold" />
          <Text style={styles.detailSectionTitle}>KONTAK & DARURAT</Text>
        </View>

        <View style={styles.detailGridBox}>
          <View style={styles.detailGridRow}>
            <View style={styles.detailGridCol}>
              <Text style={styles.detailFieldLabel}>Nomor WhatsApp / HP</Text>
              <Text style={styles.detailFieldValue}>{member.phone || '—'}</Text>
            </View>
            <View style={styles.detailGridCol}>
              <Text style={styles.detailFieldLabel}>Status Akun</Text>
              <Text style={styles.detailFieldValue} numberOfLines={1}>
                {member.resident_status === 'active'
                  ? 'Aktif'
                  : member.resident_status === 'blocked'
                  ? 'Diblokir'
                  : 'Menunggu'}
              </Text>
            </View>
          </View>

          <View style={styles.detailGridDivider} />

          <View style={styles.detailGridRow}>
            <View style={styles.detailGridCol}>
              <Text style={styles.detailFieldLabel}>Kontak Darurat</Text>
              <Text style={styles.detailFieldValue}>
                {member.emergency_contact_name || '—'}
                {member.emergency_contact_relation
                  ? ` (${member.emergency_contact_relation})`
                  : ''}
              </Text>
            </View>
            <View style={styles.detailGridCol}>
              <Text style={styles.detailFieldLabel}>No. HP Darurat</Text>
              <Text style={styles.detailFieldValue}>
                {member.emergency_contact_phone || '—'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Section 4: Susunan Anggota Keluarga */}
      <View style={[styles.detailSection, { marginBottom: Spacing[8] }]}>
        <View style={styles.detailSectionTitleRow}>
          <Users size={16} color={Colors.primary[700]} weight="bold" />
          <Text style={styles.detailSectionTitle}>
            SUSUNAN ANGGOTA KELUARGA ({selectedMemberFamily.length})
          </Text>
        </View>

        <View style={styles.detailGridBox}>
          {loadingSelectedFamily ? (
            <LoadingState fullScreen={false} style={{ paddingVertical: 16 }} />
          ) : selectedMemberFamily.length === 0 ? (
            <Text style={styles.emptyFamilyText}>
              Belum ada data anggota keluarga tambahan yang terdaftar di rumah ini.
            </Text>
          ) : (
            selectedMemberFamily.map((fam, idx) => (
              <View key={fam.id}>
                {idx > 0 && <View style={styles.detailGridDivider} />}
                <View style={styles.familyRowItem}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.familyRowHeader}>
                      <Text style={styles.familyRowName}>{fam.full_name}</Text>
                      <View
                        style={[
                          styles.relationTag,
                          fam.relationship === 'head' && styles.relationTagHead,
                        ]}
                      >
                        <Text
                          style={[
                            styles.relationTagText,
                            fam.relationship === 'head' && styles.relationTagTextHead,
                          ]}
                        >
                          {RELATIONSHIP_LABELS[fam.relationship] || fam.relationship}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.familyRowSub}>
                      {fam.gender === 'male' ? 'Laki-laki' : fam.gender === 'female' ? 'Perempuan' : ''}
                      {fam.nik ? ` • NIK: ${fam.nik}` : ''}
                      {fam.occupation ? ` • ${fam.occupation}` : ''}
                    </Text>
                    {fam.phone && <Text style={styles.familyRowPhone}>📞 {fam.phone}</Text>}
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );

  // ==========================================
  // RUMAH SAYA VIEW (Common for resident tab)
  // ==========================================
  const renderMyHouseContent = () => (
    <ScrollView contentContainerStyle={styles.myHouseScroll} showsVerticalScrollIndicator={false}>
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
              {household?.house?.family_code && (
                <View style={styles.familyCodeBadgeSmall}>
                  <Text style={styles.familyCodeBadgeSmallText}>
                    ID: {household.house.family_code}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.pendingCard}>
          <Clock size={24} color="#D97706" />
          <View style={styles.pendingTextWrap}>
            <Text style={styles.pendingTitle}>Belum Dihubungkan ke Rumah</Text>
            <Text style={styles.pendingDesc}>
              Ajukan klaim nomor rumah Anda agar terdaftar resmi dan dapat membayar iuran.
            </Text>
            <TouchableOpacity
              style={styles.claimNowBtn}
              onPress={() => router.push('/warga/claim' as any)}
            >
              <Text style={styles.claimNowBtnText}>Klaim Rumah Sekarang</Text>
            </TouchableOpacity>
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
                  <Text style={styles.memberName}>{m.profile?.full_name || 'Anggota Keluarga'}</Text>
                  {m.is_primary && (
                    <View style={styles.primaryTag}>
                      <Text style={styles.primaryTagText}>Kepala Keluarga</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.memberRel}>
                  Hubungan: {m.relationship === 'primary' ? 'Kepala Keluarga' : m.relationship}
                </Text>
                {m.profile?.phone && <Text style={styles.memberPhone}>📞 {m.profile.phone}</Text>}
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

        <TouchableOpacity
          style={styles.manageFamilyBtn}
          onPress={() => router.push('/(main)/profile' as any)}
        >
          <Text style={styles.manageFamilyBtnText}>
            Kelola Susunan Anggota Keluarga di Menu Profil →
          </Text>
        </TouchableOpacity>
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
  );

  // =========================================================================
  // DESKTOP LAYOUT (>= 900px)
  // =========================================================================
  if (isDesktop && isManagement) {
    return (
      <DesktopShell
        activeKey="/warga"
        pageTitle="Data Warga & Hunian"
        breadcrumb={['Dashboard', 'Kependudukan', 'Data Warga']}
        headerAction={
          <TouchableOpacity
            style={styles.desktopRefreshBtn}
            onPress={loadMembers}
            disabled={loadingMembers}
          >
            <ArrowClockwise size={16} color={Colors.stone[700]} />
            <Text style={styles.desktopRefreshBtnText}>
              {loadingMembers ? 'Memuat...' : 'Segarkan Data'}
            </Text>
          </TouchableOpacity>
        }
      >
        <View style={styles.desktopContainer}>
          {/* Top Header Bar */}
          <View style={styles.desktopHeaderStrip}>
            <View>
              <Text style={styles.desktopPageTitle}>Data Warga & Kependudukan</Text>
              <Text style={styles.desktopPageSubtitle}>
                Direktori kependudukan resmi {complexSettings?.name || 'Komplekku'} • RT {household?.rt?.code || '01'} / RW {household?.rw?.code || '01'}
              </Text>
            </View>

            {/* Tab switcher: Direktori Warga vs Rumah Saya */}
            <View style={styles.desktopTabSwitcher}>
              <TouchableOpacity
                style={[
                  styles.desktopSwitchBtn,
                  activeTab === 'directory' && styles.desktopSwitchBtnActive,
                ]}
                onPress={() => setActiveTab('directory')}
              >
                <Users
                  size={15}
                  color={activeTab === 'directory' ? Colors.primary[700] : Colors.stone[500]}
                />
                <Text
                  style={[
                    styles.desktopSwitchBtnText,
                    activeTab === 'directory' && styles.desktopSwitchBtnTextActive,
                  ]}
                >
                  Direktori Warga ({members.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.desktopSwitchBtn,
                  activeTab === 'my_house' && styles.desktopSwitchBtnActive,
                ]}
                onPress={() => setActiveTab('my_house')}
              >
                <House
                  size={15}
                  color={activeTab === 'my_house' ? Colors.primary[700] : Colors.stone[500]}
                />
                <Text
                  style={[
                    styles.desktopSwitchBtnText,
                    activeTab === 'my_house' && styles.desktopSwitchBtnTextActive,
                  ]}
                >
                  Rumah Saya
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {activeTab === 'my_house' ? (
            renderMyHouseContent()
          ) : (
            <>
              {/* Metric KPI Strip (desain.md §23) */}
              <View style={styles.desktopMetricsRow}>
                <View style={styles.desktopMetricCard}>
                  <View style={[styles.desktopMetricIcon, { backgroundColor: Colors.primary[50] }]}>
                    <Users size={18} color={Colors.primary[700]} weight="fill" />
                  </View>
                  <View>
                    <Text style={styles.desktopMetricNumber}>{stats.total}</Text>
                    <Text style={styles.desktopMetricLabel}>TOTAL WARGA</Text>
                  </View>
                </View>

                <View style={styles.desktopMetricCard}>
                  <View style={[styles.desktopMetricIcon, { backgroundColor: '#DCFCE7' }]}>
                    <CheckCircle size={18} color="#15803D" weight="fill" />
                  </View>
                  <View>
                    <Text style={[styles.desktopMetricNumber, { color: '#15803D' }]}>
                      {stats.verified}
                    </Text>
                    <Text style={styles.desktopMetricLabel}>TERVERIFIKASI</Text>
                  </View>
                </View>

                <View style={styles.desktopMetricCard}>
                  <View style={[styles.desktopMetricIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Clock size={18} color="#B45309" weight="fill" />
                  </View>
                  <View>
                    <Text style={[styles.desktopMetricNumber, { color: '#B45309' }]}>
                      {stats.pending}
                    </Text>
                    <Text style={styles.desktopMetricLabel}>MENUNGGU VERIFIKASI</Text>
                  </View>
                </View>

                <View style={styles.desktopMetricCard}>
                  <View style={[styles.desktopMetricIcon, { backgroundColor: '#EDE9FE' }]}>
                    <Crown size={18} color="#6D28D9" weight="fill" />
                  </View>
                  <View>
                    <Text style={[styles.desktopMetricNumber, { color: '#6D28D9' }]}>
                      {stats.primaryHeads}
                    </Text>
                    <Text style={styles.desktopMetricLabel}>KEPALA KELUARGA</Text>
                  </View>
                </View>

                <View style={styles.desktopMetricCard}>
                  <View style={[styles.desktopMetricIcon, { backgroundColor: Colors.stone[100] }]}>
                    <House size={18} color={Colors.stone[700]} weight="fill" />
                  </View>
                  <View>
                    <Text style={styles.desktopMetricNumber}>{stats.uniqueHouses}</Text>
                    <Text style={styles.desktopMetricLabel}>RUMAH TERHUBUNG</Text>
                  </View>
                </View>
              </View>

              {/* Toolbar Section */}
              <View style={styles.desktopToolbar}>
                {/* Search Bar */}
                <View style={styles.desktopSearchBox}>
                  <MagnifyingGlass size={16} color={Colors.stone[400]} />
                  <TextInput
                    placeholder="Cari nama, NIK, blok, no rumah, nomor HP..."
                    placeholderTextColor={Colors.stone[400]}
                    style={styles.desktopSearchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                      <X size={14} color={Colors.stone[400]} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Filter Pills */}
                <View style={styles.desktopFilterGroup}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      statusFilter === 'all' && styles.filterChipActive,
                    ]}
                    onPress={() => setStatusFilter('all')}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        statusFilter === 'all' && styles.filterChipTextActive,
                      ]}
                    >
                      Semua
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      statusFilter === 'pending' && styles.filterChipActive,
                    ]}
                    onPress={() => setStatusFilter('pending')}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        statusFilter === 'pending' && styles.filterChipTextActive,
                      ]}
                    >
                      Perlu Verifikasi ({stats.pending})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      statusFilter === 'verified' && styles.filterChipActive,
                    ]}
                    onPress={() => setStatusFilter('verified')}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        statusFilter === 'verified' && styles.filterChipTextActive,
                      ]}
                    >
                      Terverifikasi
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      statusFilter === 'primary' && styles.filterChipActive,
                    ]}
                    onPress={() => setStatusFilter('primary')}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        statusFilter === 'primary' && styles.filterChipTextActive,
                      ]}
                    >
                      Kepala Keluarga
                    </Text>
                  </TouchableOpacity>

                  {/* RT Filter if multiple */}
                  {availableRts.length > 1 && (
                    <View style={styles.rtFilterGroup}>
                      <Text style={styles.rtFilterLabel}>RT:</Text>
                      <TouchableOpacity
                        style={[
                          styles.filterChipSm,
                          rtFilter === 'all' && styles.filterChipActive,
                        ]}
                        onPress={() => setRtFilter('all')}
                      >
                        <Text
                          style={[
                            styles.filterChipTextSm,
                            rtFilter === 'all' && styles.filterChipTextActive,
                          ]}
                        >
                          Semua
                        </Text>
                      </TouchableOpacity>
                      {availableRts.map((code) => (
                        <TouchableOpacity
                          key={code}
                          style={[
                            styles.filterChipSm,
                            rtFilter === code && styles.filterChipActive,
                          ]}
                          onPress={() => setRtFilter(code)}
                        >
                          <Text
                            style={[
                              styles.filterChipTextSm,
                              rtFilter === code && styles.filterChipTextActive,
                            ]}
                          >
                            RT {code}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Sort selector */}
                  <View style={styles.rtFilterGroup}>
                    <Text style={styles.rtFilterLabel}>Urut:</Text>
                    <TouchableOpacity
                      style={[
                        styles.filterChipSm,
                        sortBy === 'name_asc' && styles.filterChipActive,
                      ]}
                      onPress={() => setSortBy('name_asc')}
                    >
                      <Text
                        style={[
                          styles.filterChipTextSm,
                          sortBy === 'name_asc' && styles.filterChipTextActive,
                        ]}
                      >
                        A-Z
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.filterChipSm,
                        sortBy === 'house_asc' && styles.filterChipActive,
                      ]}
                      onPress={() => setSortBy('house_asc')}
                    >
                      <Text
                        style={[
                          styles.filterChipTextSm,
                          sortBy === 'house_asc' && styles.filterChipTextActive,
                        ]}
                      >
                        Rumah
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.filterChipSm,
                        sortBy === 'newest' && styles.filterChipActive,
                      ]}
                      onPress={() => setSortBy('newest')}
                    >
                      <Text
                        style={[
                          styles.filterChipTextSm,
                          sortBy === 'newest' && styles.filterChipTextActive,
                        ]}
                      >
                        Terbaru
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Split Content: Table (Left) + Detail Panel (Right) */}
              <View style={styles.desktopContentSplit}>
                {/* Data Table Container */}
                <View style={styles.desktopTableCard}>
                  {/* Table Header Row */}
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.tableColHeader, { flex: 2.2 }]}>WARGA</Text>
                    <Text style={[styles.tableColHeader, { flex: 1.8 }]}>HUNIAN & BLOK</Text>
                    <Text style={[styles.tableColHeader, { flex: 1.4 }]}>HUBUNGAN</Text>
                    <Text style={[styles.tableColHeader, { flex: 1.5 }]}>STATUS VERIFIKASI</Text>
                    <Text style={[styles.tableColHeader, { flex: 1.2, textAlign: 'right' }]}>
                      AKSI
                    </Text>
                  </View>

                  {/* Table Body */}
                  {loadingMembers ? (
                    <View style={styles.tableLoadingWrap}>
                      <LoadingState fullScreen={false} />
                    </View>
                  ) : paginatedMembers.length === 0 ? (
                    <View style={styles.tableEmptyWrap}>
                      <Users size={36} color={Colors.stone[300]} />
                      <Text style={styles.tableEmptyTitle}>Tidak ada warga ditemukan</Text>
                      <Text style={styles.tableEmptySub}>
                        Sesuaikan kata kunci pencarian atau bersihkan filter yang aktif.
                      </Text>
                      {(searchQuery !== '' || statusFilter !== 'all' || rtFilter !== 'all') && (
                        <TouchableOpacity
                          style={styles.tableResetFilterBtn}
                          onPress={() => {
                            setSearchQuery('');
                            setStatusFilter('all');
                            setRtFilter('all');
                          }}
                        >
                          <Text style={styles.tableResetFilterBtnText}>Reset Semua Filter</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <ScrollView style={styles.tableScroll} showsVerticalScrollIndicator={false}>
                      {paginatedMembers.map((m) => {
                        const isSelected = selectedMember?.id === m.id;
                        return (
                          <TouchableOpacity
                            key={m.id}
                            style={[
                              styles.tableRow,
                              isSelected && styles.tableRowSelected,
                            ]}
                            onPress={() => void openMemberDetail(m)}
                            activeOpacity={0.7}
                          >
                            {/* Column 1: Resident Avatar + Name */}
                            <View style={[styles.tableCell, { flex: 2.2, gap: 10 }]}>
                              <View style={styles.tableAvatar}>
                                <Text style={styles.tableAvatarText}>
                                  {m.full_name ? m.full_name[0]?.toUpperCase() : 'W'}
                                </Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.tablePrimaryText} numberOfLines={1}>
                                  {m.full_name || 'Warga'}
                                </Text>
                                <Text style={styles.tableSecondaryText} numberOfLines={1}>
                                  {m.phone ? `📞 ${m.phone}` : m.nik ? `NIK: ${m.nik}` : 'Belum ada kontak'}
                                </Text>
                              </View>
                            </View>

                            {/* Column 2: House & Block */}
                            <View style={[styles.tableCell, { flex: 1.8 }]}>
                              <Text style={styles.tablePrimaryText} numberOfLines={1}>
                                {m.house
                                  ? `${m.house.block ? `Blok ${m.house.block} ` : ''}No. ${m.house.house_number}`
                                  : 'Belum terhubung'}
                              </Text>
                              <Text style={styles.tableSecondaryText}>
                                {m.rt?.code ? `RT ${m.rt.code}` : ''}
                                {m.rw?.code ? ` / RW ${m.rw.code}` : ''}
                              </Text>
                            </View>

                            {/* Column 3: Relationship */}
                            <View style={[styles.tableCell, { flex: 1.4 }]}>
                              {m.is_primary ? (
                                <View style={styles.pillBadgeCrown}>
                                  <Crown size={11} color="#B45309" weight="fill" />
                                  <Text style={styles.pillBadgeTextCrown}>Kepala Keluarga</Text>
                                </View>
                              ) : (
                                <Text style={styles.tableSecondaryText}>
                                  {m.relationship === 'spouse'
                                    ? 'Pasangan'
                                    : m.relationship === 'child'
                                    ? 'Anak'
                                    : 'Anggota'}
                                </Text>
                              )}
                            </View>

                            {/* Column 4: Verification Status */}
                            <View style={[styles.tableCell, { flex: 1.5 }]}>
                              {m.verification_status === 'verified' ? (
                                <View style={styles.pillBadgeSuccess}>
                                  <CheckCircle size={11} color="#15803D" weight="bold" />
                                  <Text style={styles.pillBadgeTextSuccess}>Terverifikasi</Text>
                                </View>
                              ) : (
                                <View style={styles.pillBadgeWarning}>
                                  <Clock size={11} color="#B45309" weight="bold" />
                                  <Text style={styles.pillBadgeTextWarning}>Menunggu</Text>
                                </View>
                              )}
                            </View>

                            {/* Column 5: Action */}
                            <View
                              style={[
                                styles.tableCell,
                                { flex: 1.2, justifyContent: 'flex-end', gap: 6 },
                              ]}
                            >
                              {m.verification_status !== 'verified' && (
                                <TouchableOpacity
                                  style={styles.tableQuickVerifyBtn}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    handleVerifyMember(m);
                                  }}
                                  accessibilityLabel="Verifikasi"
                                >
                                  <Check size={12} color="#FFFFFF" weight="bold" />
                                  <Text style={styles.tableQuickVerifyText}>Verifikasi</Text>
                                </TouchableOpacity>
                              )}
                              <TouchableOpacity
                                style={styles.tableActionIconBtn}
                                onPress={() => void openMemberDetail(m)}
                                accessibilityLabel="Detail"
                              >
                                <Eye size={15} color={Colors.stone[600]} />
                              </TouchableOpacity>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}

                  {/* Table Footer / Pagination */}
                  <View style={styles.tableFooter}>
                    <Text style={styles.tableFooterCount}>
                      Menampilkan{' '}
                      <Text style={{ fontWeight: '700', color: Colors.stone[800] }}>
                        {filteredMembers.length === 0 ? 0 : (page - 1) * pageSize + 1}-
                        {Math.min(page * pageSize, filteredMembers.length)}
                      </Text>{' '}
                      dari {filteredMembers.length} warga
                    </Text>

                    <View style={styles.tablePagination}>
                      <TouchableOpacity
                        style={[
                          styles.tablePageBtn,
                          page <= 1 && styles.tablePageBtnDisabled,
                        ]}
                        onPress={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                      >
                        <CaretLeft
                          size={14}
                          color={page <= 1 ? Colors.stone[300] : Colors.stone[700]}
                        />
                        <Text
                          style={[
                            styles.tablePageBtnText,
                            page <= 1 && styles.tablePageBtnTextDisabled,
                          ]}
                        >
                          Sebelumnya
                        </Text>
                      </TouchableOpacity>

                      <Text style={styles.tablePageIndicator}>
                        Halaman {page} dari {totalPages}
                      </Text>

                      <TouchableOpacity
                        style={[
                          styles.tablePageBtn,
                          page >= totalPages && styles.tablePageBtnDisabled,
                        ]}
                        onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                      >
                        <Text
                          style={[
                            styles.tablePageBtnText,
                            page >= totalPages && styles.tablePageBtnTextDisabled,
                          ]}
                        >
                          Selanjutnya
                        </Text>
                        <CaretRight
                          size={14}
                          color={page >= totalPages ? Colors.stone[300] : Colors.stone[700]}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Right Side Detail Drawer / Panel */}
                <View style={styles.desktopDetailPanel}>
                  {selectedMember ? (
                    <View style={{ flex: 1 }}>
                      <View style={styles.desktopDetailPanelHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <IdentificationCard size={18} color={Colors.primary[700]} weight="bold" />
                          <Text style={styles.desktopDetailPanelTitle}>Detail Data Warga</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.desktopDetailCloseBtn}
                          onPress={() => setSelectedMember(null)}
                          hitSlop={8}
                        >
                          <X size={16} color={Colors.stone[500]} />
                        </TouchableOpacity>
                      </View>
                      {renderMemberDetailContent(selectedMember)}
                    </View>
                  ) : (
                    <View style={styles.desktopDetailEmptyPanel}>
                      <View style={styles.desktopDetailEmptyIcon}>
                        <Users size={32} color={Colors.stone[400]} />
                      </View>
                      <Text style={styles.desktopDetailEmptyTitle}>Pilih Warga</Text>
                      <Text style={styles.desktopDetailEmptySub}>
                        Klik salah satu baris warga di tabel untuk memeriksa biodata kependudukan lengkap, data keluarga, dan status hunian.
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </>
          )}
        </View>
      </DesktopShell>
    );
  }

  // =========================================================================
  // MOBILE / TABLET LAYOUT (< 900px)
  // =========================================================================
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Mobile Top Header */}
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
              style={[styles.switchButton, activeTab === 'directory' && styles.switchButtonActive]}
              onPress={() => setActiveTab('directory')}
            >
              <Text
                style={[
                  styles.switchButtonText,
                  activeTab === 'directory' && styles.switchButtonTextActive,
                ]}
              >
                Direktori Warga ({members.length})
              </Text>
            </TouchableOpacity>

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
          {/* Mobile Search Bar */}
          <View style={styles.searchBox}>
            <MagnifyingGlass size={18} color={Colors.stone[400]} />
            <TextInput
              placeholder="Cari warga, nomor rumah, atau blok..."
              placeholderTextColor={Colors.stone[400]}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                <X size={16} color={Colors.stone[400]} />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Filter Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mobileFilterRow}
          >
            <TouchableOpacity
              style={[styles.mobileFilterChip, statusFilter === 'all' && styles.filterChipActive]}
              onPress={() => setStatusFilter('all')}
            >
              <Text
                style={[
                  styles.filterChipTextSm,
                  statusFilter === 'all' && styles.filterChipTextActive,
                ]}
              >
                Semua ({stats.total})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.mobileFilterChip,
                statusFilter === 'pending' && styles.filterChipActive,
              ]}
              onPress={() => setStatusFilter('pending')}
            >
              <Text
                style={[
                  styles.filterChipTextSm,
                  statusFilter === 'pending' && styles.filterChipTextActive,
                ]}
              >
                Verifikasi ({stats.pending})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.mobileFilterChip,
                statusFilter === 'verified' && styles.filterChipActive,
              ]}
              onPress={() => setStatusFilter('verified')}
            >
              <Text
                style={[
                  styles.filterChipTextSm,
                  statusFilter === 'verified' && styles.filterChipTextActive,
                ]}
              >
                Terverifikasi
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.mobileFilterChip,
                statusFilter === 'primary' && styles.filterChipActive,
              ]}
              onPress={() => setStatusFilter('primary')}
            >
              <Text
                style={[
                  styles.filterChipTextSm,
                  statusFilter === 'primary' && styles.filterChipTextActive,
                ]}
              >
                Kepala Keluarga
              </Text>
            </TouchableOpacity>
          </ScrollView>

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
              <TouchableOpacity
                key={m.id}
                style={styles.memberCardDirectory}
                onPress={() => void openMemberDetail(m)}
                activeOpacity={0.7}
              >
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
                        onPress={(e) => {
                          e.stopPropagation();
                          handleVerifyMember(m);
                        }}
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
                    {m.rt?.code ? ` • RT ${m.rt.code}` : ''}
                  </Text>

                  {m.phone && <Text style={styles.memberPhoneText}>📞 {m.phone}</Text>}
                  <Text style={styles.cardTapHint}>Sentuh untuk melihat biodata & keluarga →</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      ) : (
        renderMyHouseContent()
      )}

      {/* Resident Detail Modal for Mobile */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setDetailModalVisible(false)} hitSlop={8}>
              <X size={22} color={Colors.stone[600]} />
            </Pressable>
            <Text style={styles.modalTitle}>Detail Warga & Keluarga</Text>
            <View style={{ width: 22 }} />
          </View>

          {selectedMember && renderMemberDetailContent(selectedMember)}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.stone[25],
  },

  // — Desktop specific layouts —
  desktopContainer: {
    flex: 1,
    padding: Spacing[6],
    backgroundColor: Colors.stone[25],
  },
  desktopRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing[3],
    paddingVertical: 7,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.stone[200],
    backgroundColor: Colors.stone[0],
  },
  desktopRefreshBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    color: Colors.stone[700],
    fontWeight: '600',
  },
  desktopHeaderStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[5],
  },
  desktopPageTitle: {
    fontFamily: FontFamily.display,
    fontSize: 22,
    color: Colors.stone[800],
    fontWeight: '700',
  },
  desktopPageSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    color: Colors.stone[500],
    marginTop: 2,
  },
  desktopTabSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.stone[100],
    borderRadius: Radius.sm,
    padding: 3,
    gap: 2,
  },
  desktopSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing[3],
    paddingVertical: 7,
    borderRadius: Radius.xs,
  },
  desktopSwitchBtnActive: {
    backgroundColor: Colors.stone[0],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  desktopSwitchBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    color: Colors.stone[500],
  },
  desktopSwitchBtnTextActive: {
    color: Colors.primary[700],
    fontWeight: '700',
  },

  // KPI Metrics Row
  desktopMetricsRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginBottom: Spacing[5],
  },
  desktopMetricCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[3],
  },
  desktopMetricIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopMetricNumber: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.stone[900],
  },
  desktopMetricLabel: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.stone[400],
    letterSpacing: 0.5,
  },

  // Toolbar
  desktopToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.stone[0],
    borderWidth: 1,
    borderColor: Colors.stone[100],
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    marginBottom: Spacing[4],
    gap: Spacing[4],
  },
  desktopSearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.stone[50],
    borderWidth: 1,
    borderColor: Colors.stone[200],
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing[3],
    paddingVertical: 7,
  },
  desktopSearchInput: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: 13,
    color: Colors.stone[800],
  },
  desktopFilterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: Radius.xs,
    backgroundColor: Colors.stone[50],
    borderWidth: 1,
    borderColor: Colors.stone[200],
  },
  filterChipActive: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[200],
  },
  filterChipText: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.stone[600],
  },
  filterChipTextActive: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.primary[700],
    fontWeight: '700',
  },
  rtFilterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 6,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: Colors.stone[200],
  },
  rtFilterLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: Colors.stone[500],
  },
  filterChipSm: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    backgroundColor: Colors.stone[50],
    borderWidth: 1,
    borderColor: Colors.stone[200],
  },
  filterChipTextSm: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.stone[600],
  },

  // Split Container: Table & Detail Panel
  desktopContentSplit: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing[4],
    overflow: 'hidden',
  },
  desktopTableCard: {
    flex: 1,
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    flexDirection: 'column',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stone[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[100],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  tableColHeader: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: Colors.stone[500],
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  tableScroll: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[50],
    minHeight: 56,
  },
  tableRowSelected: {
    backgroundColor: Colors.primary[50],
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary[600],
  },
  tableCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableAvatar: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableAvatarText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 13,
    color: Colors.primary[700],
    fontWeight: '700',
  },
  tablePrimaryText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.stone[800],
    fontWeight: '600',
  },
  tableSecondaryText: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.stone[400],
    marginTop: 1,
  },
  tableQuickVerifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.xs,
  },
  tableQuickVerifyText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tableActionIconBtn: {
    width: 28,
    height: 28,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.stone[200],
    backgroundColor: Colors.stone[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableLoadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[10],
  },
  tableEmptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[8],
  },
  tableEmptyTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.stone[700],
    marginTop: Spacing[2],
  },
  tableEmptySub: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.stone[400],
    marginTop: 2,
    textAlign: 'center',
  },
  tableResetFilterBtn: {
    marginTop: Spacing[3],
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: Radius.xs,
    backgroundColor: Colors.primary[50],
  },
  tableResetFilterBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    color: Colors.primary[700],
  },
  tableFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.stone[0],
    borderTopWidth: 1,
    borderTopColor: Colors.stone[100],
  },
  tableFooterCount: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.stone[500],
  },
  tablePagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  tablePageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing[2],
    paddingVertical: 5,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.stone[200],
    backgroundColor: Colors.stone[0],
  },
  tablePageBtnDisabled: {
    borderColor: Colors.stone[100],
    backgroundColor: Colors.stone[50],
  },
  tablePageBtnText: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.stone[700],
  },
  tablePageBtnTextDisabled: {
    color: Colors.stone[300],
  },
  tablePageIndicator: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.stone[500],
    paddingHorizontal: Spacing[1],
  },

  // Desktop Detail Panel
  desktopDetailPanel: {
    width: 390,
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    overflow: 'hidden',
  },
  desktopDetailPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[100],
    backgroundColor: Colors.stone[50],
  },
  desktopDetailPanelTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.stone[800],
    fontWeight: '700',
  },
  desktopDetailCloseBtn: {
    width: 24,
    height: 24,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopDetailEmptyPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[6],
  },
  desktopDetailEmptyIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.stone[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
  },
  desktopDetailEmptyTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.stone[700],
    fontWeight: '600',
  },
  desktopDetailEmptySub: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.stone[400],
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing[1],
  },

  // Detail Structured Components
  detailScroll: {
    padding: Spacing[4],
  },
  detailHeaderCard: {
    alignItems: 'center',
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[3],
    backgroundColor: Colors.stone[50],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    marginBottom: Spacing[4],
  },
  detailAvatarWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  detailAvatarText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 20,
    color: Colors.primary[700],
    fontWeight: '700',
  },
  detailName: {
    fontFamily: FontFamily.display,
    fontSize: 16,
    color: Colors.stone[800],
    fontWeight: '700',
    textAlign: 'center',
  },
  detailSubtext: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.stone[500],
    marginTop: 2,
    textAlign: 'center',
  },
  detailBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing[3],
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  pillBadgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  pillBadgeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  pillBadgeText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    fontWeight: '700',
  },
  pillBadgeTextSuccess: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    color: '#15803D',
    fontWeight: '700',
  },
  pillBadgeTextWarning: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    color: '#B45309',
    fontWeight: '700',
  },
  pillBadgeCrown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  pillBadgeTextCrown: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    color: '#B45309',
    fontWeight: '700',
  },
  pillBadgeRole: {
    backgroundColor: Colors.stone[200],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  pillBadgeTextRole: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 9,
    color: Colors.stone[700],
    fontWeight: '700',
  },
  verifyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing[4],
    paddingVertical: 9,
    borderRadius: Radius.sm,
    marginTop: Spacing[3],
    width: '100%',
  },
  verifyActionBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  detailSection: {
    marginBottom: Spacing[4],
  },
  detailSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing[2],
  },
  detailSectionTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: Colors.stone[500],
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  detailGridBox: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[3],
  },
  detailGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing[2],
  },
  detailGridCol: {
    flex: 1,
  },
  detailFieldLabel: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.stone[400],
    marginBottom: 2,
  },
  detailFieldValue: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    color: Colors.stone[800],
    fontWeight: '600',
  },
  detailGridDivider: {
    height: 1,
    backgroundColor: Colors.stone[100],
    marginVertical: Spacing[2],
  },
  emptyFamilyText: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.stone[400],
    textAlign: 'center',
    paddingVertical: Spacing[2],
  },
  familyRowItem: {
    paddingVertical: 2,
  },
  familyRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  familyRowName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    color: Colors.stone[800],
    fontWeight: '700',
  },
  familyRowSub: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.stone[500],
    marginTop: 2,
  },
  familyRowPhone: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.primary[700],
    marginTop: 2,
  },
  relationTag: {
    backgroundColor: Colors.stone[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  relationTagHead: {
    backgroundColor: '#FEF3C7',
  },
  relationTagText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 9,
    color: Colors.stone[600],
    fontWeight: '700',
  },
  relationTagTextHead: {
    color: '#B45309',
  },

  // — Mobile specific styles —
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
    fontFamily: FontFamily.body,
    color: Colors.stone[600],
    fontSize: 13,
  },
  title: {
    fontFamily: FontFamily.display,
    fontSize: 20,
    color: Colors.stone[800],
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: 12,
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
    fontFamily: FontFamily.body,
    fontSize: 12,
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
    marginBottom: Spacing[3],
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.stone[800],
  },
  mobileFilterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing[4],
  },
  mobileFilterChip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 5,
    borderRadius: Radius.xs,
    backgroundColor: Colors.stone[0],
    borderWidth: 1,
    borderColor: Colors.stone[200],
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
    fontFamily: FontFamily.bodyBold,
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
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
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
    fontFamily: FontFamily.bodySemiBold,
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
    fontFamily: FontFamily.bodyBold,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  memberHouseText: {
    fontFamily: FontFamily.body,
    color: Colors.stone[500],
    fontSize: 11,
    marginTop: 2,
  },
  memberPhoneText: {
    fontFamily: FontFamily.body,
    color: Colors.stone[400],
    fontSize: 11,
    marginTop: 2,
  },
  cardTapHint: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.primary[600],
    marginTop: 4,
    fontWeight: '600',
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
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.stone[800],
    marginTop: Spacing[2],
  },
  emptyCardSub: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.stone[500],
    textAlign: 'center',
    marginTop: Spacing[1],
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.stone[25],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[100],
    backgroundColor: Colors.stone[0],
  },
  modalTitle: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.stone[800],
    fontSize: 15,
  },

  // Rumah Saya & Common
  myHouseScroll: {
    padding: Spacing[4],
    paddingBottom: Spacing[10],
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
    fontFamily: FontFamily.display,
    fontSize: 18,
    color: Colors.stone[800],
    fontWeight: '700',
  },
  houseAddress: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.stone[500],
    marginTop: 2,
  },
  statusRow: {
    marginTop: Spacing[2],
    flexDirection: 'row',
    gap: 8,
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
    fontFamily: FontFamily.bodySemiBold,
    color: '#15803D',
    fontSize: 10,
    fontWeight: '700',
  },
  familyCodeBadgeSmall: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  familyCodeBadgeSmallText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
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
    fontFamily: FontFamily.bodySemiBold,
    color: '#92400E',
    fontWeight: '700',
    fontSize: 13,
  },
  pendingDesc: {
    fontFamily: FontFamily.body,
    color: '#B45309',
    marginTop: 2,
    fontSize: 12,
  },
  claimNowBtn: {
    marginTop: Spacing[2],
    alignSelf: 'flex-start',
    backgroundColor: '#D97706',
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: Radius.xs,
  },
  claimNowBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeading: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.stone[400],
    marginBottom: Spacing[2],
    letterSpacing: 0.8,
    fontSize: 11,
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
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.stone[800],
    fontWeight: '700',
    fontSize: 13,
  },
  primaryTag: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  primaryTagText: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.primary[700],
    fontSize: 9,
    fontWeight: '700',
  },
  memberRel: {
    fontFamily: FontFamily.body,
    color: Colors.stone[500],
    fontSize: 11,
    marginTop: 2,
  },
  memberPhone: {
    fontFamily: FontFamily.body,
    color: Colors.stone[400],
    fontSize: 11,
    marginTop: 2,
  },
  manageFamilyBtn: {
    marginTop: Spacing[2],
    paddingVertical: Spacing[2],
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary[100],
  },
  manageFamilyBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.primary[700],
    fontWeight: '700',
    fontSize: 12,
  },
  complexCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[4],
  },
  complexTitle: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.stone[800],
    fontWeight: '700',
    fontSize: 13,
  },
  complexAddress: {
    fontFamily: FontFamily.body,
    color: Colors.stone[500],
    marginTop: 2,
    fontSize: 12,
  },
  complexContact: {
    fontFamily: FontFamily.body,
    color: Colors.stone[400],
    fontSize: 11,
    marginTop: Spacing[2],
  },
});
