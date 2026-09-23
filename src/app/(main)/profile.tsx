import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  PencilSimple,
  ShieldCheck,
  SignOut,
  Storefront,
  Users,
  Plus,
  Trash,
  IdentificationCard,
  PhoneCall,
  House,
  Crown,
} from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSupabase } from '@/lib/supabase-provider';
import { useComplex } from '@/lib/complex-provider';
import { uploadAvatar } from '@/services/auth';
import { checkIsAdmin } from '@/services/admin';
import {
  getHouseFamilyMembers,
  createFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  RELATIONSHIP_LABELS,
} from '@/services/family';
import type { FamilyMember, FamilyRelationship } from '@/types/database';

export default function ProfileScreen() {
  const { user, profile, refreshProfile, updateProfile, signOut } = useSupabase();
  const { household, activeRole, setActiveRole, isDeveloper, isRw, isRt, isHeadOfFamily, refreshComplex } =
    useComplex();
  const [isAdmin, setIsAdmin] = useState(false);

  const canAccessAdmin = isAdmin || isDeveloper || isRw || isRt;

  useEffect(() => {
    if (!user) return;
    Promise.resolve().then(async () => {
      const authorized = await checkIsAdmin(user.id);
      setIsAdmin(authorized);
    });
  }, [user]);

  // Family members state
  const [familyList, setFamilyList] = useState<FamilyMember[]>([]);
  const [loadingFamily, setLoadingFamily] = useState(false);
  const houseId = household?.house?.id;

  const loadFamilyData = useCallback(async () => {
    if (!houseId) return;
    setLoadingFamily(true);
    try {
      const { data } = await getHouseFamilyMembers(houseId);
      setFamilyList(data);
    } catch {
      // Fallback
    } finally {
      setLoadingFamily(false);
    }
  }, [houseId]);

  useEffect(() => {
    let isMounted = true;
    if (houseId) {
      Promise.resolve().then(async () => {
        setLoadingFamily(true);
        try {
          const { data } = await getHouseFamilyMembers(houseId);
          if (isMounted) setFamilyList(data);
        } catch {
          // Fallback
        } finally {
          if (isMounted) setLoadingFamily(false);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [houseId]);

  // Edit My Profile Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone || '');
  const [nik, setNik] = useState(profile?.nik || '');
  const [kkNumber, setKkNumber] = useState(profile?.kk_number || '');
  const [gender, setGender] = useState<'male' | 'female' | ''>(profile?.gender || '');
  const [birthPlace, setBirthPlace] = useState(profile?.birth_place || '');
  const [birthDate, setBirthDate] = useState(profile?.birth_date || '');
  const [religion, setReligion] = useState(profile?.religion || '');
  const [maritalStatus, setMaritalStatus] = useState<
    'single' | 'married' | 'divorced' | 'widowed' | ''
  >(profile?.marital_status || '');
  const [occupation, setOccupation] = useState(profile?.occupation || '');
  const [bloodType, setBloodType] = useState<'A' | 'B' | 'AB' | 'O' | ''>(profile?.blood_type || '');
  const [emergencyName, setEmergencyName] = useState(profile?.emergency_contact_name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(profile?.emergency_contact_phone || '');
  const [emergencyRelation, setEmergencyRelation] = useState(
    profile?.emergency_contact_relation || ''
  );
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Family Member Add/Edit Modal State
  const [familyModalVisible, setFamilyModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [famFullName, setFamFullName] = useState('');
  const [famRelationship, setFamRelationship] = useState<FamilyRelationship>('child');
  const [famNik, setFamNik] = useState('');
  const [famGender, setFamGender] = useState<'male' | 'female' | ''>('male');
  const [famBirthPlace, setFamBirthPlace] = useState('');
  const [famBirthDate, setFamBirthDate] = useState('');
  const [famReligion, setFamReligion] = useState('');
  const [famOccupation, setFamOccupation] = useState('');
  const [famPhone, setFamPhone] = useState('');
  const [savingFamily, setSavingFamily] = useState(false);
  const [familyError, setFamilyError] = useState<string | null>(null);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Warga Komplekku';
  const displayEmail = user?.email || '-';
  const displayAvatar = profile?.avatar_path;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).getFullYear()
    : new Date().getFullYear();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  };

  const openEditModal = () => {
    setFullName(profile?.full_name || user?.user_metadata?.full_name || '');
    setPhoneNumber(profile?.phone || '');
    setNik(profile?.nik || '');
    setKkNumber(profile?.kk_number || '');
    setGender(profile?.gender || '');
    setBirthPlace(profile?.birth_place || '');
    setBirthDate(profile?.birth_date || '');
    setReligion(profile?.religion || '');
    setMaritalStatus(profile?.marital_status || '');
    setOccupation(profile?.occupation || '');
    setBloodType(profile?.blood_type || '');
    setEmergencyName(profile?.emergency_contact_name || '');
    setEmergencyPhone(profile?.emergency_contact_phone || '');
    setEmergencyRelation(profile?.emergency_contact_relation || '');
    setAvatarUri(null);
    setError(null);
    setEditModalVisible(true);
  };

  const handlePickAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Izin Dibutuhkan', 'Izin akses galeri diperlukan untuk memilih foto profil.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memilih gambar');
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      setError('Nama lengkap tidak boleh kosong');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let uploadedPath = profile?.avatar_path || null;

      if (avatarUri && user?.id) {
        const uploadRes = await uploadAvatar(user.id, avatarUri);
        if (uploadRes.error) {
          setError(`Gagal unggah foto: ${uploadRes.error.message}`);
          setSaving(false);
          return;
        }
        uploadedPath = uploadRes.url;
      }

      const { error: updateError } = await updateProfile({
        full_name: fullName.trim(),
        phone: phoneNumber.trim() || null,
        nik: nik.trim() || null,
        kk_number: kkNumber.trim() || null,
        gender: (gender as any) || null,
        birth_place: birthPlace.trim() || null,
        birth_date: birthDate.trim() || null,
        religion: religion.trim() || null,
        marital_status: (maritalStatus as any) || null,
        occupation: occupation.trim() || null,
        blood_type: (bloodType as any) || null,
        emergency_contact_name: emergencyName.trim() || null,
        emergency_contact_phone: emergencyPhone.trim() || null,
        emergency_contact_relation: emergencyRelation.trim() || null,
        avatar_path: uploadedPath,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        await refreshProfile();
        setEditModalVisible(false);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  // Family CRUD Handlers
  const openAddFamilyModal = () => {
    setEditingMember(null);
    setFamFullName('');
    setFamRelationship('child');
    setFamNik('');
    setFamGender('male');
    setFamBirthPlace('');
    setFamBirthDate('');
    setFamReligion(profile?.religion || 'Islam');
    setFamOccupation('');
    setFamPhone('');
    setFamilyError(null);
    setFamilyModalVisible(true);
  };

  const openEditFamilyModal = (member: FamilyMember) => {
    setEditingMember(member);
    setFamFullName(member.full_name);
    setFamRelationship(member.relationship);
    setFamNik(member.nik || '');
    setFamGender(member.gender || 'male');
    setFamBirthPlace(member.birth_place || '');
    setFamBirthDate(member.birth_date || '');
    setFamReligion(member.religion || '');
    setFamOccupation(member.occupation || '');
    setFamPhone(member.phone || '');
    setFamilyError(null);
    setFamilyModalVisible(true);
  };

  const handleSaveFamilyMember = async () => {
    if (!famFullName.trim()) {
      setFamilyError('Nama anggota keluarga wajib diisi.');
      return;
    }
    if (!household?.house?.id || !user?.id) {
      setFamilyError('Rumah tidak ditemukan. Hubungkan rumah terlebih dahulu.');
      return;
    }

    setSavingFamily(true);
    setFamilyError(null);

    try {
      if (editingMember) {
        // Update
        const { error } = await updateFamilyMember(editingMember.id, {
          full_name: famFullName,
          relationship: famRelationship,
          nik: famNik,
          gender: (famGender as any) || null,
          birth_place: famBirthPlace,
          birth_date: famBirthDate,
          religion: famReligion,
          occupation: famOccupation,
          phone: famPhone,
        });
        if (error) {
          setFamilyError(error.message);
        } else {
          await loadFamilyData();
          await refreshComplex();
          setFamilyModalVisible(false);
        }
      } else {
        // Create
        const { error } = await createFamilyMember({
          house_id: household.house.id,
          head_user_id: user.id,
          full_name: famFullName,
          relationship: famRelationship,
          nik: famNik,
          gender: (famGender as any) || null,
          birth_place: famBirthPlace,
          birth_date: famBirthDate,
          religion: famReligion,
          occupation: famOccupation,
          phone: famPhone,
        });
        if (error) {
          setFamilyError(error.message);
        } else {
          await loadFamilyData();
          await refreshComplex();
          setFamilyModalVisible(false);
        }
      }
    } catch (err: any) {
      setFamilyError(err.message || 'Gagal menyimpan anggota keluarga');
    } finally {
      setSavingFamily(false);
    }
  };

  const handleDeleteMember = (member: FamilyMember) => {
    Alert.alert(
      'Hapus Anggota Keluarga',
      `Hapus ${member.full_name} (${RELATIONSHIP_LABELS[member.relationship]}) dari daftar keluarga?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteFamilyMember(member.id);
            if (error) {
              Alert.alert('Gagal', error.message);
            } else {
              await loadFamilyData();
              await refreshComplex();
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Keluar Akun',
      'Apakah kamu yakin ingin keluar dari akun Komplekku?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {displayAvatar ? (
              <Image source={{ uri: displayAvatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{getInitials(displayName)}</Text>
              </View>
            )}
          </View>

          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{displayEmail}</Text>

          {/* Role & Family Status Badges */}
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.roleBadge,
                activeRole === 'developer'
                  ? { backgroundColor: '#EDE9FE', borderColor: '#C4B5FD' }
                  : activeRole === 'rw'
                  ? { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }
                  : activeRole === 'rt'
                  ? { backgroundColor: '#CCFBF1', borderColor: '#5EEAD4' }
                  : { backgroundColor: Colors.stone[100], borderColor: Colors.stone[200] },
              ]}
            >
              <Text
                style={[
                  styles.roleBadgeText,
                  activeRole === 'developer'
                    ? { color: '#6D28D9' }
                    : activeRole === 'rw'
                    ? { color: '#047857' }
                    : activeRole === 'rt'
                    ? { color: '#0F766E' }
                    : { color: Colors.stone[600] },
                ]}
              >
                {activeRole === 'developer'
                  ? 'PENGELOLA MASTER'
                  : activeRole === 'rw'
                  ? `PENGURUS RW ${household?.rw?.code || '02'}`
                  : activeRole === 'rt'
                  ? `PENGURUS RT ${household?.rt?.code || '01'}`
                  : 'WARGA RESIDEN'}
              </Text>
            </View>

            {isHeadOfFamily ? (
              <View style={styles.headBadge}>
                <Crown size={12} color="#B45309" weight="fill" />
                <Text style={styles.headBadgeText}>Kepala Keluarga</Text>
              </View>
            ) : (
              <View style={styles.memberBadge}>
                <Text style={styles.memberBadgeText}>Anggota Keluarga</Text>
              </View>
            )}
          </View>

          <Text style={styles.meta}>Warga sejak {memberSince}</Text>
        </View>

        {/* 1. Biodata Kependudukan Lengkap */}
        <View style={styles.sectionHeaderRow}>
          <IdentificationCard size={18} color={Colors.primary[700]} weight="bold" />
          <Text style={styles.sectionTitle}>BIODATA KEPENDUDUKAN</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.infoLabel}>NIK (No. KTP)</Text>
              <Text style={styles.infoValue}>{profile?.nik || '-'}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.infoLabel}>Nomor KK</Text>
              <Text style={styles.infoValue}>{profile?.kk_number || '-'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.infoLabel}>Jenis Kelamin</Text>
              <Text style={styles.infoValue}>
                {profile?.gender === 'male'
                  ? 'Laki-laki'
                  : profile?.gender === 'female'
                  ? 'Perempuan'
                  : '-'}
              </Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.infoLabel}>Golongan Darah</Text>
              <Text style={styles.infoValue}>{profile?.blood_type || '-'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.infoLabel}>Tempat, Tanggal Lahir</Text>
              <Text style={styles.infoValue}>
                {profile?.birth_place ? `${profile.birth_place}, ` : ''}
                {profile?.birth_date || '-'}
              </Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.infoLabel}>Agama</Text>
              <Text style={styles.infoValue}>{profile?.religion || '-'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.infoLabel}>Pekerjaan</Text>
              <Text style={styles.infoValue}>{profile?.occupation || '-'}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.infoLabel}>Status Perkawinan</Text>
              <Text style={styles.infoValue}>
                {profile?.marital_status === 'single'
                  ? 'Belum Menikah'
                  : profile?.marital_status === 'married'
                  ? 'Menikah'
                  : profile?.marital_status === 'divorced'
                  ? 'Cerai Hidup'
                  : profile?.marital_status === 'widowed'
                  ? 'Cerai Mati'
                  : '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Kontak & Darurat */}
        <View style={styles.sectionHeaderRow}>
          <PhoneCall size={18} color={Colors.primary[700]} weight="bold" />
          <Text style={styles.sectionTitle}>KONTAK & DARURAT</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nomor HP / WhatsApp</Text>
            <Text style={styles.infoValue}>{profile?.phone || 'Belum ditambahkan'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.infoLabel}>Kontak Darurat</Text>
              <Text style={styles.infoValue}>
                {profile?.emergency_contact_name || '-'}
                {profile?.emergency_contact_relation
                  ? ` (${profile.emergency_contact_relation})`
                  : ''}
              </Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.infoLabel}>No. Darurat</Text>
              <Text style={styles.infoValue}>{profile?.emergency_contact_phone || '-'}</Text>
            </View>
          </View>
        </View>

        {/* 3. Data Hunian */}
        <View style={styles.sectionHeaderRow}>
          <House size={18} color={Colors.primary[700]} weight="bold" />
          <Text style={styles.sectionTitle}>DATA HUNIAN</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.infoLabel}>Alamat Rumah</Text>
              <Text style={styles.infoValue}>
                {household?.house
                  ? `${household.house.block ? `Blok ${household.house.block} ` : ''}No. ${household.house.house_number}`
                  : 'Belum terdaftar'}
              </Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.infoLabel}>Wilayah</Text>
              <Text style={styles.infoValue}>
                RT {household?.rt?.code || '01'} / RW {household?.rw?.code || '02'}
              </Text>
            </View>
          </View>
        </View>

        {/* 4. Susunan Anggota Keluarga (Kartu Keluarga Digital) */}
        <View style={styles.familyHeaderRow}>
          <View style={styles.familyTitleWrap}>
            <Users size={18} color={Colors.primary[700]} weight="bold" />
            <Text style={styles.sectionTitle}>ANGGOTA KELUARGA ({familyList.length})</Text>
          </View>

          {(isHeadOfFamily || canAccessAdmin) && household?.house && (
            <TouchableOpacity style={styles.addFamilyBtn} onPress={openAddFamilyModal}>
              <Plus size={14} color="#FFFFFF" weight="bold" />
              <Text style={styles.addFamilyBtnText}>Tambah Anggota</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          {household?.house ? (
            loadingFamily ? (
              <View style={{ paddingVertical: Spacing[6], alignItems: 'center' }}>
                <ActivityIndicator size="small" color={Colors.primary[600]} />
              </View>
            ) : familyList.length === 0 ? (
              <View style={styles.emptyFamilyWrap}>
                <Users size={28} color={Colors.stone[300]} />
                <Text style={styles.emptyFamilyTitle}>Belum Ada Anggota Keluarga Terdaftar</Text>
                <Text style={styles.emptyFamilySub}>
                  {isHeadOfFamily
                    ? 'Sebagai Kepala Keluarga, Anda dapat mendaftarkan istri, anak, atau anggota keluarga lainnya.'
                    : 'Data anggota keluarga diisi oleh Kepala Keluarga.'}
                </Text>
                {isHeadOfFamily && (
                  <Button
                    label="Tambah Anggota Keluarga"
                    onPress={openAddFamilyModal}
                    variant="secondary"
                    style={{ marginTop: Spacing[2] }}
                  />
                )}
              </View>
            ) : (
              familyList.map((item, idx) => (
                <View key={item.id}>
                  {idx > 0 && <View style={styles.divider} />}
                  <View style={styles.familyItemRow}>
                    <View style={styles.familyItemLeft}>
                      <View style={styles.familyAvatar}>
                        <Text style={styles.familyAvatarText}>
                          {item.full_name ? item.full_name[0]?.toUpperCase() : 'A'}
                        </Text>
                      </View>
                      <View style={styles.familyItemInfo}>
                        <View style={styles.familyNameRow}>
                          <Text style={styles.familyItemName}>{item.full_name}</Text>
                          <View
                            style={[
                              styles.relationPill,
                              item.relationship === 'head' && styles.relationPillHead,
                            ]}
                          >
                            <Text
                              style={[
                                styles.relationPillText,
                                item.relationship === 'head' && styles.relationPillTextHead,
                              ]}
                            >
                              {RELATIONSHIP_LABELS[item.relationship]}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.familySubDetails}>
                          {item.gender === 'male' ? 'L' : item.gender === 'female' ? 'P' : ''}
                          {item.nik ? ` • NIK: ${item.nik}` : ''}
                          {item.occupation ? ` • ${item.occupation}` : ''}
                        </Text>

                        {item.phone && <Text style={styles.familyPhone}>📞 {item.phone}</Text>}
                      </View>
                    </View>

                    {/* Actions for Kepala Keluarga or Manager */}
                    {(isHeadOfFamily || canAccessAdmin) && (
                      <View style={styles.familyActions}>
                        <TouchableOpacity
                          style={styles.actionIconBtn}
                          onPress={() => openEditFamilyModal(item)}
                        >
                          <PencilSimple size={16} color={Colors.stone[600]} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionIconBtn}
                          onPress={() => handleDeleteMember(item)}
                        >
                          <Trash size={16} color={Colors.semantic.error[500]} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )
          ) : (
            <View style={styles.emptyFamilyWrap}>
              <House size={28} color={Colors.stone[300]} />
              <Text style={styles.emptyFamilyTitle}>Belum Terhubung ke Rumah</Text>
              <Text style={styles.emptyFamilySub}>
                Klaim unit rumah terlebih dahulu untuk mengelola susunan anggota keluarga.
              </Text>
            </View>
          )}
        </View>

        {/* Role Switcher for Managers / Testers */}
        {(isDeveloper || isRw || isRt) && (
          <View style={styles.roleSwitcherCard}>
            <Text style={styles.roleSwitcherTitle}>Ganti Sudut Pandang Peran (Role)</Text>
            <Text style={styles.roleSwitcherSubtitle}>
              Pilih peran aktif untuk melihat dashboard dan akses fitur terkait:
            </Text>
            <View style={styles.rolePillsRow}>
              {(isDeveloper
                ? (['developer', 'rw', 'rt', 'warga'] as const)
                : isRw
                ? (['rw', 'warga'] as const)
                : (['rt', 'warga'] as const)
              ).map((roleKey) => {
                const isActive = activeRole === roleKey;
                return (
                  <TouchableOpacity
                    key={roleKey}
                    style={[
                      styles.rolePill,
                      isActive && styles.rolePillActive,
                      isActive && roleKey === 'developer' && { backgroundColor: '#6D28D9' },
                      isActive && roleKey === 'rw' && { backgroundColor: '#047857' },
                      isActive && roleKey === 'rt' && { backgroundColor: '#0F766E' },
                    ]}
                    onPress={() => setActiveRole(roleKey)}
                  >
                    <Text
                      style={[
                        styles.rolePillText,
                        isActive && styles.rolePillTextActive,
                      ]}
                    >
                      {roleKey.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            label="Edit Profil Saya"
            icon={<PencilSimple size={18} color={Colors.stone[700]} weight="regular" />}
            onPress={openEditModal}
            variant="secondary"
            fullWidth
          />

          <Button
            label="Toko Saya / Mulai Jualan"
            icon={<Storefront size={18} color="#FFFFFF" weight="regular" />}
            onPress={() => router.push('/seller' as any)}
            variant="primary"
            fullWidth
          />

          {canAccessAdmin && (
            <Button
              label={
                activeRole === 'developer'
                  ? 'Panel Pengelola Developer'
                  : activeRole === 'rw'
                  ? 'Panel Pengurus RW'
                  : activeRole === 'rt'
                  ? 'Panel Pengurus RT'
                  : 'Panel Pengurus Komplek'
              }
              icon={<ShieldCheck size={18} color={Colors.stone[700]} weight="regular" />}
              onPress={() => router.push('/admin' as any)}
              variant="secondary"
              fullWidth
            />
          )}

          <Button
            label="Keluar"
            icon={<SignOut size={18} color={Colors.semantic.error[500]} weight="regular" />}
            onPress={handleLogout}
            variant="destructive"
            fullWidth
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>

      {/* Edit My Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setEditModalVisible(false)} hitSlop={8}>
              <Text style={styles.modalCancelText}>Batal</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Edit Profil Warga</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{error}</Text>
              </View>
            )}

            {/* Avatar picker tile */}
            <View style={styles.avatarPickerRow}>
              <Pressable onPress={handlePickAvatar} style={styles.avatarPickerButton}>
                {avatarUri || displayAvatar ? (
                  <Image
                    source={{ uri: avatarUri || displayAvatar! }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>{getInitials(displayName)}</Text>
                  </View>
                )}
                <Text style={styles.changePhotoText}>Ubah Foto</Text>
              </Pressable>
            </View>

            <Text style={styles.formSectionTitle}>Data Pokok</Text>
            <Input
              label="Nama Lengkap *"
              placeholder="Sesuai KTP"
              value={fullName}
              onChangeText={setFullName}
            />

            <Input
              label="Nomor Telepon / WhatsApp"
              placeholder="0812xxxxxxxx"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />

            <Input
              label="NIK (Nomor Induk Kependudukan)"
              placeholder="16 digit angka KTP"
              keyboardType="number-pad"
              value={nik}
              onChangeText={setNik}
            />

            <Input
              label="Nomor Kartu Keluarga (KK)"
              placeholder="16 digit nomor KK"
              keyboardType="number-pad"
              value={kkNumber}
              onChangeText={setKkNumber}
            />

            {/* Jenis Kelamin */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Jenis Kelamin</Text>
              <View style={styles.pillSelectorRow}>
                <TouchableOpacity
                  style={[styles.formPill, gender === 'male' && styles.formPillActive]}
                  onPress={() => setGender('male')}
                >
                  <Text
                    style={[styles.formPillText, gender === 'male' && styles.formPillTextActive]}
                  >
                    Laki-laki
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formPill, gender === 'female' && styles.formPillActive]}
                  onPress={() => setGender('female')}
                >
                  <Text
                    style={[styles.formPillText, gender === 'female' && styles.formPillTextActive]}
                  >
                    Perempuan
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Tempat Lahir"
                  placeholder="Kota kelahiran"
                  value={birthPlace}
                  onChangeText={setBirthPlace}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Tanggal Lahir"
                  placeholder="YYYY-MM-DD"
                  value={birthDate}
                  onChangeText={setBirthDate}
                />
              </View>
            </View>

            <Input
              label="Agama"
              placeholder="Islam / Kristen / Katolik / dll"
              value={religion}
              onChangeText={setReligion}
            />

            <Input
              label="Pekerjaan"
              placeholder="Profesi / Karyawan / Wirausaha"
              value={occupation}
              onChangeText={setOccupation}
            />

            {/* Status Perkawinan */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Status Perkawinan</Text>
              <View style={styles.pillSelectorRow}>
                {(
                  [
                    { key: 'single', label: 'Belum Menikah' },
                    { key: 'married', label: 'Menikah' },
                    { key: 'divorced', label: 'Cerai' },
                  ] as const
                ).map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.formPill, maritalStatus === item.key && styles.formPillActive]}
                    onPress={() => setMaritalStatus(item.key)}
                  >
                    <Text
                      style={[
                        styles.formPillText,
                        maritalStatus === item.key && styles.formPillTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Golongan Darah */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Golongan Darah</Text>
              <View style={styles.pillSelectorRow}>
                {(['A', 'B', 'AB', 'O'] as const).map((bt) => (
                  <TouchableOpacity
                    key={bt}
                    style={[styles.bloodPill, bloodType === bt && styles.formPillActive]}
                    onPress={() => setBloodType(bt)}
                  >
                    <Text
                      style={[styles.formPillText, bloodType === bt && styles.formPillTextActive]}
                    >
                      {bt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text style={styles.formSectionTitle}>Kontak Darurat</Text>
            <Input
              label="Nama Kontak Darurat"
              placeholder="Nama keluarga terdekat"
              value={emergencyName}
              onChangeText={setEmergencyName}
            />
            <Input
              label="Nomor Telepon Darurat"
              placeholder="0812xxxxxxxx"
              keyboardType="phone-pad"
              value={emergencyPhone}
              onChangeText={setEmergencyPhone}
            />
            <Input
              label="Hubungan dengan Warga"
              placeholder="Saudara / Orang Tua / Pasangan"
              value={emergencyRelation}
              onChangeText={setEmergencyRelation}
            />

            <Button
              label="Simpan Profil"
              onPress={handleSaveProfile}
              variant="primary"
              loading={saving}
              fullWidth
              style={styles.saveButton}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Add / Edit Family Member Modal */}
      <Modal
        visible={familyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFamilyModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setFamilyModalVisible(false)} hitSlop={8}>
              <Text style={styles.modalCancelText}>Batal</Text>
            </Pressable>
            <Text style={styles.modalTitle}>
              {editingMember ? 'Edit Anggota Keluarga' : 'Tambah Anggota Keluarga'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            {familyError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{familyError}</Text>
              </View>
            )}

            <Input
              label="Nama Lengkap *"
              placeholder="Nama anggota keluarga"
              value={famFullName}
              onChangeText={setFamFullName}
            />

            {/* Hubungan Keluarga */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Hubungan dalam Keluarga *</Text>
              <View style={styles.pillSelectorRow}>
                {(
                  [
                    { key: 'spouse', label: 'Istri / Suami' },
                    { key: 'child', label: 'Anak' },
                    { key: 'parent', label: 'Orang Tua' },
                    { key: 'sibling', label: 'Saudara' },
                    { key: 'head', label: 'Kepala Keluarga' },
                    { key: 'other', label: 'Famili Lain' },
                  ] as const
                ).map((rel) => (
                  <TouchableOpacity
                    key={rel.key}
                    style={[
                      styles.formPill,
                      famRelationship === rel.key && styles.formPillActive,
                    ]}
                    onPress={() => setFamRelationship(rel.key)}
                  >
                    <Text
                      style={[
                        styles.formPillText,
                        famRelationship === rel.key && styles.formPillTextActive,
                      ]}
                    >
                      {rel.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Input
              label="NIK"
              placeholder="16 digit angka KTP / KIA"
              keyboardType="number-pad"
              value={famNik}
              onChangeText={setFamNik}
            />

            {/* Jenis Kelamin */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Jenis Kelamin</Text>
              <View style={styles.pillSelectorRow}>
                <TouchableOpacity
                  style={[styles.formPill, famGender === 'male' && styles.formPillActive]}
                  onPress={() => setFamGender('male')}
                >
                  <Text
                    style={[styles.formPillText, famGender === 'male' && styles.formPillTextActive]}
                  >
                    Laki-laki
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formPill, famGender === 'female' && styles.formPillActive]}
                  onPress={() => setFamGender('female')}
                >
                  <Text
                    style={[styles.formPillText, famGender === 'female' && styles.formPillTextActive]}
                  >
                    Perempuan
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Tempat Lahir"
                  placeholder="Kota kelahiran"
                  value={famBirthPlace}
                  onChangeText={setFamBirthPlace}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Tanggal Lahir"
                  placeholder="YYYY-MM-DD"
                  value={famBirthDate}
                  onChangeText={setFamBirthDate}
                />
              </View>
            </View>

            <Input
              label="Pekerjaan"
              placeholder="Pelajar / Mahasiswa / Karyawan / dll"
              value={famOccupation}
              onChangeText={setFamOccupation}
            />

            <Input
              label="Nomor Telepon / WhatsApp (Opsional)"
              placeholder="Jika anggota memiliki HP"
              keyboardType="phone-pad"
              value={famPhone}
              onChangeText={setFamPhone}
            />

            <Button
              label={editingMember ? 'Perbarui Anggota' : 'Tambahkan ke Keluarga'}
              onPress={handleSaveFamilyMember}
              variant="primary"
              loading={savingFamily}
              fullWidth
              style={styles.saveButton}
            />
          </ScrollView>
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
  scrollContent: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[10],
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing[5],
  },
  avatarContainer: {
    marginBottom: Spacing[3],
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    ...Typography.h2,
    color: Colors.primary[700],
  },
  name: {
    ...Typography.h1,
    color: Colors.stone[800],
    textAlign: 'center',
    marginBottom: Spacing[1],
  },
  email: {
    ...Typography.bodyM,
    color: Colors.stone[500],
    marginBottom: 4,
  },
  meta: {
    ...Typography.bodyS,
    color: Colors.stone[400],
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginVertical: 4,
  },
  roleBadge: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  roleBadgeText: {
    ...Typography.overline,
    fontSize: 10,
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  headBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  headBadgeText: {
    ...Typography.overline,
    fontSize: 10,
    color: '#B45309',
    fontWeight: '700',
  },
  memberBadge: {
    backgroundColor: Colors.stone[100],
    borderColor: Colors.stone[200],
    borderWidth: 1,
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  memberBadgeText: {
    ...Typography.overline,
    fontSize: 10,
    color: Colors.stone[600],
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing[2],
    marginTop: Spacing[3],
  },
  sectionTitle: {
    ...Typography.overline,
    color: Colors.stone[600],
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[4],
    marginBottom: Spacing[2],
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing[3],
  },
  gridCol: {
    flex: 1,
  },
  infoRow: {
    paddingVertical: 2,
  },
  infoLabel: {
    ...Typography.bodyS,
    fontSize: 11,
    color: Colors.stone[400],
    marginBottom: 2,
  },
  infoValue: {
    ...Typography.bodyM,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.stone[800],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.stone[100],
    marginVertical: Spacing[3],
  },
  familyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[2],
    marginTop: Spacing[3],
  },
  familyTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addFamilyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  addFamilyBtnText: {
    ...Typography.label,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyFamilyWrap: {
    alignItems: 'center',
    paddingVertical: Spacing[4],
    gap: Spacing[2],
  },
  emptyFamilyTitle: {
    ...Typography.bodyM,
    fontWeight: '700',
    color: Colors.stone[700],
    textAlign: 'center',
  },
  emptyFamilySub: {
    ...Typography.bodyS,
    color: Colors.stone[400],
    textAlign: 'center',
    maxWidth: 280,
  },
  familyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  familyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    flex: 1,
  },
  familyAvatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyAvatarText: {
    ...Typography.h3,
    color: Colors.primary[700],
  },
  familyItemInfo: {
    flex: 1,
  },
  familyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  familyItemName: {
    ...Typography.bodyM,
    fontWeight: '700',
    color: Colors.stone[800],
  },
  relationPill: {
    backgroundColor: Colors.stone[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  relationPillHead: {
    backgroundColor: '#FEF3C7',
  },
  relationPillText: {
    ...Typography.overline,
    fontSize: 9,
    color: Colors.stone[600],
    fontWeight: '700',
  },
  relationPillTextHead: {
    color: '#B45309',
  },
  familySubDetails: {
    ...Typography.bodyS,
    fontSize: 11,
    color: Colors.stone[500],
    marginTop: 2,
  },
  familyPhone: {
    ...Typography.bodyS,
    fontSize: 11,
    color: Colors.primary[700],
    marginTop: 2,
  },
  familyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  actionIconBtn: {
    padding: Spacing[2],
    backgroundColor: Colors.stone[50],
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.stone[100],
  },
  actions: {
    gap: Spacing[3],
    marginTop: Spacing[4],
  },
  roleSwitcherCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.stone[100],
    marginVertical: Spacing[3],
  },
  roleSwitcherTitle: {
    ...Typography.bodyM,
    fontWeight: '700',
    color: Colors.stone[800],
    marginBottom: Spacing[1],
  },
  roleSwitcherSubtitle: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    marginBottom: Spacing[3],
  },
  rolePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  rolePill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.stone[200],
    backgroundColor: Colors.stone[50],
  },
  rolePillActive: {
    borderColor: 'transparent',
    backgroundColor: Colors.primary[600],
  },
  rolePillText: {
    ...Typography.bodyS,
    fontWeight: '700',
    color: Colors.stone[600],
  },
  rolePillTextActive: {
    color: '#FFFFFF',
  },
  logoutButton: {
    marginTop: Spacing[2],
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
  },
  modalCancelText: {
    ...Typography.bodyM,
    color: Colors.stone[600],
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.stone[800],
  },
  modalScroll: {
    padding: Spacing[4],
    gap: Spacing[3],
  },
  formSectionTitle: {
    ...Typography.label,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary[700],
    marginTop: Spacing[2],
  },
  formGroup: {
    gap: 4,
  },
  formLabel: {
    ...Typography.bodyS,
    fontWeight: '600',
    color: Colors.stone[700],
  },
  pillSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    marginTop: 4,
  },
  formPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.stone[200],
    backgroundColor: Colors.stone[50],
  },
  bloodPill: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.stone[200],
    backgroundColor: Colors.stone[50],
  },
  formPillActive: {
    borderColor: 'transparent',
    backgroundColor: Colors.primary[600],
  },
  formPillText: {
    ...Typography.bodyS,
    fontSize: 12,
    color: Colors.stone[600],
    fontWeight: '600',
  },
  formPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  avatarPickerRow: {
    alignItems: 'center',
    marginVertical: Spacing[1],
  },
  avatarPickerButton: {
    alignItems: 'center',
    gap: Spacing[2],
  },
  changePhotoText: {
    ...Typography.label,
    color: Colors.primary[600],
  },
  errorBox: {
    backgroundColor: Colors.semantic.error[50],
    padding: Spacing[3],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.semantic.error[500],
  },
  errorBoxText: {
    ...Typography.bodyS,
    color: Colors.semantic.error[700],
  },
  saveButton: {
    marginTop: Spacing[4],
  },
});

