import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSupabase } from '@/lib/supabase-provider';

/**
 * Register Screen — PRD §10.1 & desain.md §21
 * Creates Auth account and initializes public.profiles
 */
export default function RegisterScreen() {
  const { signUp } = useSupabase();

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

    setLoading(true);
    try {
      const res = await signUp(trimmedEmail, password, trimmedName);
      if (res.error) {
        setError(res.error.message);
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
});
