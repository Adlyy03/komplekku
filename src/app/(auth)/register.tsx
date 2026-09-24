import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSupabase } from '@/lib/supabase-provider';
import { findHouseByFamilyCode, joinFamilyByCode } from '@/services/family';

/**
 * Register Screen — PRD §10.1 & desain.md §21
 * Creates Auth account and initializes public.profiles
 */
export default function RegisterScreen() {
  const { signUp } = useSupabase();

  const [roleType, setRoleType] = useState<'head' | 'member'>('head');
  const [familyCode, setFamilyCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setError(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setError('Masukkan nama lengkap kamu (minimal 2 karakter)');
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Masukkan alamat email yang valid');
      return;
    }

    if (!password || password.length < 6) {
      setError('Kata sandi minimal 6 karakter');
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok');
      return;
    }

    let cleanedCode = '';
    if (roleType === 'member') {
      cleanedCode = familyCode.trim().toUpperCase();
      if (cleanedCode.length !== 7) {
        setError('ID Keluarga harus terdiri dari 7 digit/karakter');
        return;
      }
      setLoading(true);
      const { data: house, error: houseErr } = await findHouseByFamilyCode(cleanedCode);
      if (houseErr || !house) {
        setLoading(false);
        setError('ID Keluarga tidak valid atau tidak ditemukan. Periksa kembali kodenya.');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await signUp(trimmedEmail, password, trimmedName);
      if (res.error) {
        setError(res.error.message);
      } else if (res.user && roleType === 'member' && cleanedCode) {
        await joinFamilyByCode(res.user.id, cleanedCode);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Daftar Warga Baru</Text>
          <Text style={styles.subtitle}>
            Bergabung dengan komunitas komplek perumahanmu
          </Text>
        </View>

        <View style={styles.formCard}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{error}</Text>
            </View>
          )}

          <View style={styles.roleSelectorWrap}>
            <Text style={styles.roleLabel}>Daftar Sebagai:</Text>
            <View style={styles.roleButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.roleChoiceBtn,
                  roleType === 'head' && styles.roleChoiceBtnActive,
                ]}
                onPress={() => setRoleType('head')}
              >
                <Text
                  style={[
                    styles.roleChoiceText,
                    roleType === 'head' && styles.roleChoiceTextActive,
                  ]}
                >
                  Kepala Keluarga
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleChoiceBtn,
                  roleType === 'member' && styles.roleChoiceBtnActive,
                ]}
                onPress={() => setRoleType('member')}
              >
                <Text
                  style={[
                    styles.roleChoiceText,
                    roleType === 'member' && styles.roleChoiceTextActive,
                  ]}
                >
                  Anggota (Anak/Istri)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {roleType === 'member' && (
            <View style={styles.familyCodeBox}>
              <Input
                label="ID Unik Keluarga (7 Karakter)"
                placeholder="Contoh: K7A93F2"
                autoCapitalize="characters"
                maxLength={7}
                value={familyCode}
                onChangeText={(text) => {
                  setFamilyCode(text.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                  if (error) setError(null);
                }}
              />
              <Text style={styles.familyCodeHint}>
                Masukkan 7 digit ID Keluarga dari Kepala Keluarga Anda (lihat di halaman Profil Kepala Keluarga).
              </Text>
            </View>
          )}

          <Input
            label="Nama Lengkap"
            placeholder="Contoh: Budi Santoso"
            autoCapitalize="words"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (error) setError(null);
            }}
          />

          <Input
            label="Alamat Email"
            placeholder="nama@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError(null);
            }}
          />

          <Input
            label="Kata Sandi"
            placeholder="Minimal 6 karakter"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError(null);
            }}
          />

          <Input
            label="Ulangi Kata Sandi"
            placeholder="Ketik ulang kata sandi"
            secureTextEntry
            autoCapitalize="none"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (error) setError(null);
            }}
          />

          <Button
            label="Daftar Sekarang"
            onPress={handleRegister}
            variant="primary"
            loading={loading}
            fullWidth
            style={styles.submitButton}
          />

          <Button
            label="Sudah punya akun? Masuk"
            onPress={() => router.back()}
            variant="ghost"
            fullWidth
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: Colors.stone[25],
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[8],
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  title: {
    ...Typography.h1,
    color: Colors.stone[800],
    marginBottom: Spacing[1],
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.bodyM,
    color: Colors.stone[500],
    textAlign: 'center',
    maxWidth: 280,
  },
  formCard: {
    gap: Spacing[4],
    backgroundColor: Colors.stone[0],
    padding: Spacing[6],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
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
  submitButton: {
    marginTop: Spacing[2],
  },
  roleSelectorWrap: {
    marginBottom: Spacing[1],
  },
  roleLabel: {
    ...Typography.bodyS,
    fontWeight: '600',
    color: Colors.stone[700],
    marginBottom: Spacing[2],
  },
  roleButtonsRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  roleChoiceBtn: {
    flex: 1,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[2],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[200],
    backgroundColor: Colors.stone[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleChoiceBtnActive: {
    borderColor: Colors.primary[600],
    backgroundColor: Colors.primary[50],
  },
  roleChoiceText: {
    ...Typography.bodyS,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.stone[600],
  },
  roleChoiceTextActive: {
    fontWeight: '700',
    color: Colors.primary[800],
  },
  familyCodeBox: {
    backgroundColor: Colors.primary[50],
    padding: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    gap: Spacing[1],
  },
  familyCodeHint: {
    ...Typography.bodyS,
    fontSize: 12,
    color: Colors.primary[800],
    marginTop: -Spacing[2],
  },
});
