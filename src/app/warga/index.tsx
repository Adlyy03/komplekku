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
  Modal,
  Pressable,
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
  Crown,
  IdentificationCard,
  PhoneCall,
  X,
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
import { getHouseFamilyMembers, RELATIONSHIP_LABELS } from '@/services/family';
import type { FamilyMember } from '@/types/database';
import { LoadingState } from '@/components/ui/LoadingState';
import { Button } from '@/components/ui/Button';

/**
 * Module Warga — PRD v2 §10, §11 & UPGRADE_ROADMAP_V3 Phase 3
 * Dual mode for RT/RW/Developer: "Rumah Saya" & "Direktori Warga RT/RW"
 */
export default function WargaScreen() {
  const { household, complexSettings, activeRole, isRw, isRt, isDeveloper } = useComplex();
  const { profile } = useSupabase();

  const isManagement = isDeveloper || isRw || isRt;
  const [activeTab, setActiveTab] = useState<'my_house' | 'directory'>('my_house');

  // Detail Modal for Managers
  const [selectedMember, setSelectedMember] = useState<CommunityMemberWithProfile | null>(null);
  const [selectedMemberFamily, setSelectedMemberFamily] = useState<FamilyMember[]>([]);
  const [loadingSelectedFamily, setLoadingSelectedFamily] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const openMemberDetailModal = async (member: CommunityMemberWithProfile) => {
    setSelectedMember(member);
    setDetailModalVisible(true);
    setSelectedMemberFamily([]);
    if (member.house?.id) {
      setLoadingSelectedFamily(true);
      try {
        const { data } = await getHouseFamilyMembers(member.house.id);
        setSelectedMemberFamily(data);
      } catch {
        // Fallback
      } finally {
        setLoadingSelectedFamily(false);
      }
    }
  };

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
    if (activeTab === 'directory' && isManagement) {
      let isMounted = true;
      getCommunityMembers(roleScope)
        .then(({ data }) => {
          if (isMounted) setMembers(data);
        })
        .catch(() => {});
      return () => {
        isMounted = false;
      };
    }
  }, [activeTab, isManagement, roleScope]);

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
              onPress={() => {
                setActiveTab('directory');
                void loadMembers();
              }}
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
              <TouchableOpacity
                key={m.id}
                style={styles.memberCardDirectory}
                onPress={() => void openMemberDetailModal(m)}
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
                    {m.rt ? ` • RT ${m.rt.code}` : ''}
                  </Text>

                  {(m.house?.family_code || m.family_code) && (
                    <Text style={styles.memberFamilyCodeText}>
                      ID Keluarga: #{m.house?.family_code || m.family_code}
                    </Text>
                  )}

                  {m.phone && <Text style={styles.memberPhoneText}>📞 {m.phone}</Text>}
                  <Text style={styles.cardTapHint}>Sentuh untuk melihat biodata & keluarga →</Text>
                </View>
              </TouchableOpacity>
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

            {/* Registered Family Members via Kartu Keluarga */}
            {household?.registeredFamilyMembers && household.registeredFamilyMembers.length > 0 && (
              <View style={{ marginTop: Spacing[3] }}>
                <Text style={styles.subHeading}>
                  DATA KARTU KELUARGA ({household.registeredFamilyMembers.length})
                </Text>
                {household.registeredFamilyMembers.map((fm) => (
                  <View key={fm.id} style={styles.memberCard}>
                    <View style={styles.avatarCircle}>
                      <User size={20} color={Colors.stone[600]} />
                    </View>
                    <View style={styles.memberInfo}>
                      <View style={styles.memberHeader}>
                        <Text style={styles.memberName}>{fm.full_name}</Text>
                        <View style={styles.relationTag}>
                          <Text style={styles.relationTagText}>
                            {RELATIONSHIP_LABELS[fm.relationship] || fm.relationship}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.memberRel}>
                        {fm.gender === 'male' ? 'Laki-laki' : fm.gender === 'female' ? 'Perempuan' : ''}
                        {fm.nik ? ` • NIK: ${fm.nik}` : ''}
                        {fm.occupation ? ` • ${fm.occupation}` : ''}
                      </Text>
                    </View>
                  </View>
                ))}
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

      {/* Resident Detail & Family Modal for Management */}
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

          {selectedMember && (
            <ScrollView contentContainerStyle={styles.modalScroll}>
              {/* Header profile info */}
              <View style={styles.modalResidentHeader}>
                <View style={styles.modalAvatarCircle}>
                  <Text style={styles.modalAvatarText}>
                    {selectedMember.full_name ? selectedMember.full_name[0]?.toUpperCase() : 'W'}
                  </Text>
                </View>
                <Text style={styles.modalResidentName}>{selectedMember.full_name}</Text>
                <View style={styles.modalBadgeRow}>
                  <View
                    style={[
                      styles.modalStatusBadge,
                      selectedMember.verification_status === 'verified'
                        ? { backgroundColor: '#DCFCE7' }
                        : { backgroundColor: '#FEF3C7' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalStatusBadgeText,
                        selectedMember.verification_status === 'verified'
                          ? { color: '#15803D' }
                          : { color: '#B45309' },
                      ]}
                    >
                      {selectedMember.verification_status === 'verified'
                        ? 'Terverifikasi'
                        : 'Menunggu Verifikasi'}
                    </Text>
                  </View>

                  {selectedMember.is_primary && (
                    <View style={styles.modalHeadBadge}>
                      <Crown size={12} color="#B45309" weight="fill" />
                      <Text style={styles.modalHeadBadgeText}>Kepala Keluarga</Text>
                    </View>
                  )}

                  {(selectedMember.house?.family_code || selectedMember.family_code) && (
                    <View style={styles.modalFamilyCodeBadge}>
                      <Text style={styles.modalFamilyCodeBadgeText}>
                        ID KELUARGA: #{selectedMember.house?.family_code || selectedMember.family_code}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Biodata Kependudukan */}
              <View style={styles.modalSectionHeader}>
                <IdentificationCard size={18} color={Colors.primary[700]} weight="bold" />
                <Text style={styles.modalSectionTitle}>BIODATA KEPENDUDUKAN</Text>
              </View>
              <View style={styles.modalCard}>
                <View style={styles.modalGridRow}>
                  <View style={styles.modalGridCol}>
                    <Text style={styles.modalInfoLabel}>NIK (No. KTP)</Text>
                    <Text style={styles.modalInfoValue}>{selectedMember.nik || '-'}</Text>
                  </View>
                  <View style={styles.modalGridCol}>
                    <Text style={styles.modalInfoLabel}>Nomor KK</Text>
                    <Text style={styles.modalInfoValue}>{selectedMember.kk_number || '-'}</Text>
                  </View>
                </View>

                <View style={styles.modalDivider} />

                <View style={styles.modalGridRow}>
                  <View style={styles.modalGridCol}>
                    <Text style={styles.modalInfoLabel}>Jenis Kelamin</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedMember.gender === 'male'
                        ? 'Laki-laki'
                        : selectedMember.gender === 'female'
                        ? 'Perempuan'
                        : '-'}
                    </Text>
                  </View>
                  <View style={styles.modalGridCol}>
                    <Text style={styles.modalInfoLabel}>Golongan Darah</Text>
                    <Text style={styles.modalInfoValue}>{selectedMember.blood_type || '-'}</Text>
                  </View>
                </View>

                <View style={styles.modalDivider} />

                <View style={styles.modalGridRow}>
                  <View style={styles.modalGridCol}>
                    <Text style={styles.modalInfoLabel}>Tempat, Tanggal Lahir</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedMember.birth_place ? `${selectedMember.birth_place}, ` : ''}
                      {selectedMember.birth_date || '-'}
                    </Text>
                  </View>
                  <View style={styles.modalGridCol}>
                    <Text style={styles.modalInfoLabel}>Agama</Text>
                    <Text style={styles.modalInfoValue}>{selectedMember.religion || '-'}</Text>
                  </View>
                </View>

                <View style={styles.modalDivider} />

                <View style={styles.modalGridRow}>
                  <View style={styles.modalGridCol}>
                    <Text style={styles.modalInfoLabel}>Pekerjaan</Text>
                    <Text style={styles.modalInfoValue}>{selectedMember.occupation || '-'}</Text>
                  </View>
                  <View style={styles.modalGridCol}>
                    <Text style={styles.modalInfoLabel}>Status Perkawinan</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedMember.marital_status === 'single'
                        ? 'Belum Menikah'
                        : selectedMember.marital_status === 'married'
                        ? 'Menikah'
                        : selectedMember.marital_status === 'divorced'
                        ? 'Cerai Hidup'
                        : selectedMember.marital_status === 'widowed'
                        ? 'Cerai Mati'
                        : '-'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Kontak & Darurat */}
              <View style={styles.modalSectionHeader}>
                <PhoneCall size={18} color={Colors.primary[700]} weight="bold" />
                <Text style={styles.modalSectionTitle}>KONTAK & DARURAT</Text>
              </View>
              <View style={styles.modalCard}>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Nomor HP / WhatsApp</Text>
                  <Text style={styles.modalInfoValue}>
                    {selectedMember.phone || 'Belum ditambahkan'}
                  </Text>
                </View>

                <View style={styles.modalDivider} />

                <View style={styles.modalGridRow}>
                  <View style={styles.modalGridCol}>
                    <Text style={styles.modalInfoLabel}>Kontak Darurat</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedMember.emergency_contact_name || '-'}
                      {selectedMember.emergency_contact_relation
                        ? ` (${selectedMember.emergency_contact_relation})`
                        : ''}
                    </Text>
                  </View>
                  <View style={styles.modalGridCol}>
                    <Text style={styles.modalInfoLabel}>No. Darurat</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedMember.emergency_contact_phone || '-'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Data Rumah */}
              <View style={styles.modalSectionHeader}>
                <House size={18} color={Colors.primary[700]} weight="bold" />
                <Text style={styles.modalSectionTitle}>DATA HUNIAN</Text>
              </View>
              <View style={styles.modalCard}>
                <View style={styles.modalGridRow}>
                  <View style={styles.modalGridCol}>
                    <Text style={styles.modalInfoLabel}>Nomor Rumah</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedMember.house
                        ? `${selectedMember.house.block ? `Blok ${selectedMember.house.block} ` : ''}No. ${selectedMember.house.house_number}`
                        : 'Belum terdaftar'}
                    </Text>
                  </View>
                  <View style={styles.modalGridCol}>
                    <Text style={styles.modalInfoLabel}>Wilayah</Text>
                    <Text style={styles.modalInfoValue}>
                      RT {selectedMember.rt?.code || '-'} / RW {selectedMember.rw?.code || '-'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Susunan Anggota Keluarga Rumah Ini */}
              <View style={styles.modalSectionHeader}>
                <Users size={18} color={Colors.primary[700]} weight="bold" />
                <Text style={styles.modalSectionTitle}>
                  SUSUNAN ANGGOTA KELUARGA ({selectedMemberFamily.length})
                </Text>
              </View>
              <View style={styles.modalCard}>
                {loadingSelectedFamily ? (
                  <LoadingState fullScreen={false} style={{ paddingVertical: 16 }} />
                ) : selectedMemberFamily.length === 0 ? (
                  <Text style={styles.emptyModalFamilyText}>
                    Belum ada data anggota keluarga tambahan yang didaftarkan di rumah ini.
                  </Text>
                ) : (
                  selectedMemberFamily.map((fam, idx) => (
                    <View key={fam.id}>
                      {idx > 0 && <View style={styles.modalDivider} />}
                      <View style={styles.modalFamRow}>
                        <View style={styles.modalFamLeft}>
                          <View style={styles.modalFamNameRow}>
                            <Text style={styles.modalFamName}>{fam.full_name}</Text>
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
                          <Text style={styles.modalFamSub}>
                            {fam.gender === 'male' ? 'L' : fam.gender === 'female' ? 'P' : ''}
                            {fam.nik ? ` • NIK: ${fam.nik}` : ''}
                            {fam.occupation ? ` • ${fam.occupation}` : ''}
                          </Text>
                          {fam.phone && (
                            <Text style={styles.modalFamPhone}>📞 {fam.phone}</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* Action Verification Button for RT/RW/Developer */}
              {selectedMember.verification_status !== 'verified' && (
                <Button
                  label="Verifikasi Warga Ini"
                  icon={<CheckCircle size={18} color="#FFFFFF" weight="bold" />}
                  variant="primary"
                  onPress={() => {
                    handleVerifyMember(selectedMember);
                    setDetailModalVisible(false);
                  }}
                  fullWidth
                  style={{ marginTop: Spacing[4], marginBottom: Spacing[6] }}
                />
              )}
            </ScrollView>
          )}
        </SafeAreaView>
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
  claimNowBtn: {
    marginTop: Spacing[2],
    alignSelf: 'flex-start',
    backgroundColor: '#D97706',
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: Radius.xs,
  },
  claimNowBtnText: {
    ...Typography.label,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  cardTapHint: {
    ...Typography.bodyS,
    fontSize: 10,
    color: Colors.primary[600],
    marginTop: 4,
    fontWeight: '600',
  },
  subHeading: {
    ...Typography.overline,
    color: Colors.stone[500],
    fontSize: 10,
    fontWeight: '700',
    marginBottom: Spacing[2],
  },
  relationTag: {
    backgroundColor: Colors.stone[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  relationTagHead: {
    backgroundColor: '#FEF3C7',
  },
  relationTagText: {
    ...Typography.overline,
    fontSize: 9,
    color: Colors.stone[600],
    fontWeight: '700',
  },
  relationTagTextHead: {
    color: '#B45309',
  },
  manageFamilyBtn: {
    marginTop: Spacing[3],
    paddingVertical: Spacing[2],
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary[100],
  },
  manageFamilyBtnText: {
    ...Typography.bodyS,
    color: Colors.primary[700],
    fontWeight: '700',
    fontSize: 12,
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
    ...Typography.h3,
    color: Colors.stone[800],
    fontSize: 16,
  },
  modalScroll: {
    padding: Spacing[4],
    gap: Spacing[2],
  },
  modalResidentHeader: {
    alignItems: 'center',
    paddingVertical: Spacing[3],
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    marginBottom: Spacing[2],
  },
  modalAvatarCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  modalAvatarText: {
    ...Typography.h2,
    color: Colors.primary[700],
  },
  modalResidentName: {
    ...Typography.h2,
    fontSize: 18,
    color: Colors.stone[800],
    marginBottom: 4,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    alignItems: 'center',
  },
  modalStatusBadge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  modalStatusBadgeText: {
    ...Typography.overline,
    fontSize: 10,
    fontWeight: '700',
  },
  modalHeadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  modalHeadBadgeText: {
    ...Typography.overline,
    fontSize: 10,
    color: '#B45309',
    fontWeight: '700',
  },
  modalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing[2],
    marginBottom: Spacing[1],
  },
  modalSectionTitle: {
    ...Typography.overline,
    fontSize: 11,
    color: Colors.stone[600],
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[4],
  },
  modalGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing[3],
  },
  modalGridCol: {
    flex: 1,
  },
  modalInfoRow: {
    paddingVertical: 2,
  },
  modalInfoLabel: {
    ...Typography.bodyS,
    fontSize: 11,
    color: Colors.stone[400],
    marginBottom: 2,
  },
  modalInfoValue: {
    ...Typography.bodyM,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.stone[800],
  },
  modalDivider: {
    height: 1,
    backgroundColor: Colors.stone[100],
    marginVertical: Spacing[2],
  },
  emptyModalFamilyText: {
    ...Typography.bodyS,
    color: Colors.stone[400],
    textAlign: 'center',
    paddingVertical: Spacing[2],
  },
  modalFamRow: {
    paddingVertical: 4,
  },
  modalFamLeft: {
    flex: 1,
  },
  modalFamNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalFamName: {
    ...Typography.bodyM,
    fontWeight: '700',
    color: Colors.stone[800],
  },
  modalFamSub: {
    ...Typography.bodyS,
    fontSize: 11,
    color: Colors.stone[500],
    marginTop: 2,
  },
  modalFamPhone: {
    ...Typography.bodyS,
    fontSize: 11,
    color: Colors.primary[700],
    marginTop: 2,
  },
  memberFamilyCodeText: {
    ...Typography.bodyS,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary[700],
    marginTop: 2,
    letterSpacing: 0.5,
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
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  modalFamilyCodeBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  modalFamilyCodeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
});
