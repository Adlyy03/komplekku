import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSupabase } from '@/lib/supabase-provider';

/**
 * Login Screen — PRD §10.1 & desain.md §21
 * Clean, calm welcome screen with email and password fields.
 */
export default function LoginScreen() {
  const { signIn } = useSupabase();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Masukkan alamat email kamu');
      return;
    }
    if (!password) {
      setError('Masukkan kata sandi kamu');
      return;
    }

    setLoading(true);
    try {
      const res = await signIn(trimmedEmail, password);
      if (res.error) {
        setError(res.error.message);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Periksa kembali koneksi.');
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
        <View style={styles.hero}>
          <Text style={styles.brand}>Komplekku</Text>
          <Text style={styles.tagline}>Komplekmu, kini digital.</Text>
        </View>

        <View style={styles.formCard}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{error}</Text>
            </View>
          )}

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

          <Button
            label="Masuk"
            onPress={handleLogin}
            variant="primary"
            loading={loading}
            fullWidth
            style={styles.submitButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Belum terdaftar sebagai warga?</Text>
          <Link href="/(auth)/register" style={styles.registerLink}>
            <Text style={styles.registerLinkText}>Daftar di sini</Text>
          </Link>
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
    paddingVertical: Spacing[10],
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing[8],
  },
  brand: {
    ...Typography.displayL,
    color: Colors.stone[800],
    marginBottom: Spacing[1],
  },
  tagline: {
    ...Typography.bodyL,
    color: Colors.stone[500],
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing[1],
    marginTop: Spacing[8],
  },
  footerText: {
    ...Typography.bodyM,
    color: Colors.stone[500],
  },
  registerLink: {
    paddingVertical: Spacing[1],
  },
  registerLinkText: {
    ...Typography.label,
    color: Colors.primary[600],
  },
});
