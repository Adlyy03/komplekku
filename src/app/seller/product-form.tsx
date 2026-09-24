import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { popup } from '@/lib/popup';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { CaretLeft, Plus, X } from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getCategories } from '@/services/products';
import { createProduct } from '@/services/sellers';
import { DesktopShell, useIsDesktop } from '@/components/ui/DesktopShell';
import type { Category } from '@/types/database';

/**
 * Product Creation / Edit Screen — PRD §18, §19, §25 & desain.md §15
 */
export default function ProductFormScreen() {
  const isDesktop = useIsDesktop();
  const { sellerId } = useLocalSearchParams<{
    sellerId: string;
    communityId?: string;
  }>();

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [type, setType] = useState<'physical' | 'service'>('physical');
  const [categoryId, setCategoryId] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getCategories().then(({ data }) => {
      if (isMounted) {
        setCategories(data);
        if (data.length > 0) {
          setCategoryId(data[0].id);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePickImages = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        popup.warning('Izin Dibutuhkan', 'Izin akses galeri dibutuhkan untuk memilih foto produk.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const uris = result.assets.map((a) => a.uri);
        setImages((prev) => [...prev, ...uris].slice(0, 5)); // max 5 images
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memilih foto');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setError(null);

    if (!name.trim()) {
      setError('Nama produk wajib diisi');
      return;
    }

    const numericPrice = parseFloat(price.replace(/[^0-9]/g, ''));
    if (isNaN(numericPrice) || numericPrice < 0) {
      setError('Harga produk tidak valid');
      return;
    }

    const numericStock = parseInt(stock, 10);
    if (isNaN(numericStock) || numericStock < 0) {
      setError('Jumlah stok minimal 0');
      return;
    }

    if (!categoryId) {
      setError('Pilih kategori produk');
      return;
    }

    if (!sellerId) {
      setError('Informasi toko tidak lengkap');
      return;
    }

    setSaving(true);
    try {
      const res = await createProduct(
        {
          sellerId,
          categoryId,
          name,
          description,
          price: numericPrice,
          stock: numericStock,
          type,
        },
        images
      );

      if (res.error) {
        setError(res.error.message);
      } else {
        popup.alert('Sukses', 'Produk berhasil ditambahkan ke tokomu!', [
          {
            text: 'Lihat Produk',
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan produk');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DesktopShell
      activeKey="/seller"
      pageTitle="Tambah Produk Baru"
      breadcrumb={['Pasar', 'Toko Saya', 'Tambah Produk']}
    >
      <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top', 'bottom']}>
        {/* Nav Header (mobile only) */}
        {!isDesktop && (
          <View style={styles.navBar}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/seller' as any))}
              hitSlop={8}
              style={styles.backTouch}
            >
              <CaretLeft size={20} color={Colors.stone[700]} />
              <Text style={styles.backButton}>Kembali</Text>
            </Pressable>
            <Text style={styles.navTitle}>Tambah Produk</Text>
            <View style={{ width: 48 }} />
          </View>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopScrollContent]}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{error}</Text>
            </View>
          )}

          {/* Photo Uploader */}
          <View style={styles.photoSection}>
            <Text style={styles.sectionLabel}>Foto Produk (Maksimal 5)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
              {images.map((uri, idx) => (
                <View key={idx} style={styles.imageTile}>
                  <Image source={{ uri }} style={styles.imageThumb} contentFit="cover" />
                  <Pressable
                    onPress={() => handleRemoveImage(idx)}
                    style={styles.removeBadge}
                  >
                    <X size={12} color="#FFFFFF" weight="bold" />
                  </Pressable>
                </View>
              ))}

              {images.length < 5 && (
                <Pressable onPress={handlePickImages} style={styles.addTile}>
                  <Plus size={22} color={Colors.primary[600]} weight="bold" />
                  <Text style={styles.addTileText}>Pilih Foto</Text>
                </Pressable>
              )}
            </ScrollView>
          </View>

          {/* Basic Info */}
          <Input
            label="Nama Produk"
            placeholder="Contoh: Nasi Uduk Betawi Komplit"
            value={name}
            onChangeText={setName}
          />

          {/* Type Segmented Control */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Tipe Penawaran</Text>
            <View style={styles.segmentedControl}>
              <Pressable
                onPress={() => setType('physical')}
                style={[
                  styles.segmentItem,
                  type === 'physical' && styles.segmentItemActive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    type === 'physical' && styles.segmentTextActive,
                  ]}
                >
                  Barang Fisik
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setType('service')}
                style={[
                  styles.segmentItem,
                  type === 'service' && styles.segmentItemActive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    type === 'service' && styles.segmentTextActive,
                  ]}
                >
                  Layanan / Jasa
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Category Selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Kategori</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
              {categories.map((c) => {
                const isSelected = categoryId === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setCategoryId(c.id)}
                    style={[
                      styles.catPill,
                      isSelected && styles.catPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.catPillText,
                        isSelected && styles.catPillTextActive,
                      ]}
                    >
                      {c.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Price and Stock row */}
          <View style={styles.row}>
            <Input
              label="Harga (Rp)"
              placeholder="Contoh: 25000"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
              containerStyle={{ flex: 1 }}
            />

            <Input
              label="Stok Tersedia"
              placeholder="Jumlah unit"
              keyboardType="numeric"
              value={stock}
              onChangeText={setStock}
              containerStyle={{ width: 120 }}
            />
          </View>

          {/* Description */}
          <Input
            label="Deskripsi Produk"
            placeholder="Jelaskan detail produk, varian rasa, ukuran, atau jadwal pemesanan..."
            multiline
            numberOfLines={4}
            style={{ minHeight: 96 }}
            value={description}
            onChangeText={setDescription}
          />

          {/* Submit Button */}
          <Button
            label="Terbitkan Produk"
            onPress={handleSave}
            variant="primary"
            loading={saving}
            fullWidth
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </DesktopShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.stone[25],
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[100],
    backgroundColor: Colors.stone[0],
  },
  backTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  backButton: {
    ...Typography.label,
    color: Colors.stone[700],
  },
  navTitle: {
    ...Typography.h3,
    color: Colors.stone[800],
  },
  scrollContent: {
    padding: Spacing[5],
    gap: Spacing[4],
  },
  desktopScrollContent: {
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
    paddingVertical: Spacing[6],
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
  photoSection: {
    gap: Spacing[2],
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.stone[700],
  },
  photoRow: {
    flexDirection: 'row',
  },
  imageTile: {
    width: 80,
    height: 80,
    borderRadius: Radius.sm,
    backgroundColor: Colors.stone[50],
    marginRight: Spacing[2],
    position: 'relative',
    overflow: 'hidden',
  },
  imageThumb: {
    width: '100%',
    height: '100%',
  },
  removeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(28,25,21,0.75)',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  addTile: {
    width: 80,
    height: 80,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.stone[300],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.stone[0],
  },
  addTileIcon: {
    fontSize: 24,
    color: Colors.primary[600],
  },
  addTileText: {
    ...Typography.bodyS,
    fontSize: 10,
    color: Colors.stone[500],
  },
  fieldGroup: {
    gap: Spacing[1],
  },
  label: {
    ...Typography.label,
    color: Colors.stone[700],
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.stone[50],
    borderRadius: Radius.sm,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.stone[100],
  },
  segmentItem: {
    flex: 1,
    paddingVertical: Spacing[2],
    alignItems: 'center',
    borderRadius: Radius.xs,
  },
  segmentItemActive: {
    backgroundColor: Colors.stone[0],
  },
  segmentText: {
    ...Typography.bodyS,
    color: Colors.stone[500],
  },
  segmentTextActive: {
    fontWeight: '600',
    color: Colors.stone[800],
  },
  catRow: {
    flexDirection: 'row',
  },
  catPill: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    backgroundColor: Colors.stone[50],
    borderWidth: 1,
    borderColor: Colors.stone[100],
    marginRight: Spacing[2],
  },
  catPillActive: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[600],
  },
  catPillText: {
    ...Typography.bodyS,
    color: Colors.stone[700],
  },
  catPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  saveButton: {
    marginTop: Spacing[4],
  },
});
