import React, { useState, useEffect } from 'react';
import {
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
import { PencilSimple, ShieldCheck, SignOut, Storefront } from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSupabase } from '@/lib/supabase-provider';
import { useComplex } from '@/lib/complex-provider';
import { uploadAvatar } from '@/services/auth';
import { checkIsAdmin } from '@/services/admin';

/**
 * Profile Screen — PRD §11 & desain.md §19
 * Displays resident profile, handles profile edits and avatar upload.
 */
export default function ProfileScreen() {
  const { user, profile, refreshProfile, updateProfile, signOut } = useSupabase();
  const { household, activeRole, setActiveRole, isDeveloper, isRw, isRt } = useComplex();
  const [isAdmin, setIsAdmin] = useState(false);

  const canAccessAdmin = isAdmin || isDeveloper || isRw || isRt;

  useEffect(() => {
    if (!user) return;
    Promise.resolve().then(async () => {
      const authorized = await checkIsAdmin(user.id);
      setIsAdmin(authorized);
    });
  }, [user]);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // Upload avatar if a new image was picked
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

          {/* Role Badge */}
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
                ? 'PENGELOLA MASTER (DEVELOPER)'
                : activeRole === 'rw'
                ? `PENGURUS RW ${household?.rw?.code || '02'}`
                : activeRole === 'rt'
                ? `PENGURUS RT ${household?.rt?.code || '01'}`
                : 'WARGA RESIDEN'}
            </Text>
          </View>

          <Text style={styles.meta}>Warga sejak {memberSince}</Text>
        </View>

        {/* Bio, Household & Phone Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nomor Telepon</Text>
            <Text style={styles.infoValue}>
              {profile?.phone || 'Belum ditambahkan'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Alamat Hunian</Text>
            <Text style={styles.infoValue}>
              {household?.house
                ? `Blok ${household.house.block || '-'} No. ${household.house.house_number || '-'}`
                : 'Belum terdaftar'}
            </Text>
          </View>
          {household?.rt && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Wilayah</Text>
                <Text style={styles.infoValue}>
                  RT {household.rt.code} / RW {household.rw?.code || '02'}
                </Text>
              </View>
            </>
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
            label="Edit Profil"
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

      {/* Edit Profile Modal */}
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
            <Text style={styles.modalTitle}>Edit Profil</Text>
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

            <Input
              label="Nama Lengkap"
              placeholder="Nama kamu"
              value={fullName}
              onChangeText={setFullName}
            />

            <Input
              label="Nomor Telepon"
              placeholder="0812xxxxxxxx"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />

            <Button
              label="Simpan Perubahan"
              onPress={handleSaveProfile}
              variant="primary"
              loading={saving}
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
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[10],
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  avatarContainer: {
    marginBottom: Spacing[4],
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
    marginBottom: 2,
  },
  meta: {
    ...Typography.bodyS,
    color: Colors.stone[400],
  },
  roleBadge: {
    marginTop: Spacing[2],
    marginBottom: Spacing[1],
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
  infoCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[4],
    marginBottom: Spacing[6],
  },
  infoRow: {
    paddingVertical: Spacing[2],
  },
  infoLabel: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    marginBottom: 2,
  },
  infoValue: {
    ...Typography.bodyM,
    color: Colors.stone[800],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.stone[100],
    marginVertical: Spacing[2],
  },
  actions: {
    gap: Spacing[3],
  },
  roleSwitcherCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.stone[100],
    marginBottom: Spacing[4],
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
    padding: Spacing[5],
    gap: Spacing[4],
  },
  avatarPickerRow: {
    alignItems: 'center',
    marginVertical: Spacing[2],
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
