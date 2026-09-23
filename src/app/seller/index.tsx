import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import { Image } from 'expo-image';
import { CaretLeft, MapPin, Plus, ShoppingBagOpen } from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useSupabase } from '@/lib/supabase-provider';
import { useComplex } from '@/lib/complex-provider';
import { isModuleEnabled } from '@/config/modules';
import {
  createSellerProfile,
  getSellerProducts,
  getSellerProfile,
  toggleProductStatus,
} from '@/services/sellers';
import { formatRupiah, type ProductWithDetails } from '@/services/products';
import type { SellerProfile } from '@/types/database';

/**
 * Seller Dashboard / Become Seller Screen — PRD §24, §25, §96 & desain.md §15
 */
export default function SellerDashboardScreen() {
  const { user } = useSupabase();
  const { complexSettings } = useComplex();

  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Become seller form states
  const [storeName, setStoreName] = useState('');
  const [storeDesc, setStoreDesc] = useState('');
  const [creatingStore, setCreatingStore] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data: sellerData } = await getSellerProfile(user.id);
      setSeller(sellerData);

      if (sellerData?.id) {
        const { data: prods } = await getSellerProducts(sellerData.id);
        setProducts(prods);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(async () => {
      if (user?.id) {
        const { data: sellerData } = await getSellerProfile(user.id);
        if (!isMounted) return;
        setSeller(sellerData);
        if (sellerData?.id) {
          const { data: prods } = await getSellerProducts(sellerData.id);
          if (!isMounted) return;
          setProducts(prods);
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleCreateStore = async () => {
    setCreateError(null);
    if (!storeName.trim()) {
      setCreateError('Masukkan nama toko kamu');
      return;
    }

    if (!user?.id) return;

    setCreatingStore(true);
    try {
      const { data, error } = await createSellerProfile(
        user.id,
        storeName.trim(),
        storeDesc.trim()
      );

      if (error) {
        setCreateError(error.message);
      } else if (data) {
        setSeller(data);
        Alert.alert('Sukses', 'Toko kamu berhasil dibuka! Sekarang kamu bisa mulai menambah produk.');
      }
    } finally {
      setCreatingStore(false);
    }
  };

  const handleToggleStatus = async (product: ProductWithDetails) => {
    const nextStatus = product.status === 'active' ? 'inactive' : 'active';
    const actionText = nextStatus === 'active' ? 'aktifkan' : 'nonaktifkan';

    Alert.alert(
      'Ubah Status Produk',
      `Apakah kamu yakin ingin me-${actionText} produk "${product.name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Ubah',
          onPress: async () => {
            const { error } = await toggleProductStatus(product.id, nextStatus);
            if (error) {
              Alert.alert('Gagal', error.message);
            } else {
              setProducts((prev) =>
                prev.map((p) => (p.id === product.id ? { ...p, status: nextStatus } : p))
              );
            }
          },
        },
      ]
    );
  };

  if (!isModuleEnabled('marketplace')) {
    return <Redirect href="/(main)" />;
  }

  if (loading) {
    return <LoadingState fullScreen />;
  }

  // Not a seller yet -> Show Become Seller Form
  if (!seller) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backTouch}>
            <CaretLeft size={20} color={Colors.stone[700]} />
            <Text style={styles.backButton}>Kembali</Text>
          </Pressable>
          <Text style={styles.navTitle}>Buka Toko</Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.formContainer}>
          <View style={styles.formHero}>
            <Text style={styles.heroTitle}>Mulai Jualan ke Tetangga</Text>
            <Text style={styles.heroSubtitle}>
              Buka toko di {complexSettings?.name || 'Komplekku'} untuk menjual masakan rumahan, kebutuhan pokok, atau jasa ke warga sekitar.
            </Text>
          </View>

          <View style={styles.formCard}>
            {createError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{createError}</Text>
              </View>
            )}

            <Input
              label="Nama Toko"
              placeholder="Contoh: Dapur Mama Budi / Warung Bu Siti"
              value={storeName}
              onChangeText={setStoreName}
            />

            <Input
              label="Deskripsi Toko (Opsional)"
              placeholder="Ceritakan barang atau jasa yang kamu tawarkan..."
              multiline
              numberOfLines={3}
              style={{ minHeight: 72 }}
              value={storeDesc}
              onChangeText={setStoreDesc}
            />

            <Button
              label="Buka Toko Sekarang"
              onPress={handleCreateStore}
              variant="primary"
              loading={creatingStore}
              fullWidth
              style={{ marginTop: Spacing[2] }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Seller Dashboard
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Nav Header */}
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backTouch}>
          <CaretLeft size={20} color={Colors.stone[700]} />
          <Text style={styles.backButton}>Kembali</Text>
        </Pressable>
        <Text style={styles.navTitle}>Dashboard Penjual</Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Store Info Banner */}
      <View style={styles.storeBanner}>
        <View style={styles.storeAvatar}>
          <Text style={styles.storeAvatarText}>
            {seller.store_name[0]?.toUpperCase()}
          </Text>
        </View>
        <View style={styles.storeTextContainer}>
          <Text style={styles.storeName}>{seller.store_name}</Text>
          <View style={styles.communityRow}>
            <MapPin size={12} color={Colors.stone[500]} weight="regular" />
            <Text style={styles.storeCommunity}>{complexSettings?.name || 'Komplekku'}</Text>
          </View>
        </View>
        <View style={styles.activePill}>
          <Text style={styles.activePillText}>Toko Aktif</Text>
        </View>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <Text style={styles.sectionTitle}>Produk Saya ({products.length})</Text>
        <Button
          label="Tambah Produk"
          icon={<Plus size={16} color="#FFFFFF" weight="bold" />}
          onPress={() =>
            router.push({
              pathname: '/seller/product-form' as any,
              params: { sellerId: seller.id },
            })
          }
          variant="primary"
        />
      </View>

      {/* Products List */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.productList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor={Colors.primary[600]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="Belum Ada Produk"
            description="Toko kamu belum memiliki produk. Tambahkan produk pertamamu sekarang!"
            actionLabel="Tambah Produk"
            onAction={() =>
              router.push({
                pathname: '/seller/product-form' as any,
                params: { sellerId: seller.id },
              })
            }
          />
        }
        renderItem={({ item }) => {
          const isActive = item.status === 'active';
          return (
            <View style={styles.productItem}>
              <View style={styles.itemImageContainer}>
                {item.images?.[0]?.storage_path ? (
                  <Image
                    source={{ uri: item.images[0].storage_path }}
                    style={styles.itemImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.itemImagePlaceholder}>
                    <ShoppingBagOpen size={22} color={Colors.stone[400]} weight="regular" />
                  </View>
                )}
              </View>

              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemPrice}>{formatRupiah(item.price)}</Text>
                <Text style={styles.itemStock}>Stok: {item.stock} unit</Text>
              </View>

              <View style={styles.itemActions}>
                <Pressable
                  onPress={() => handleToggleStatus(item)}
                  style={[
                    styles.statusPill,
                    isActive ? styles.statusPillActive : styles.statusPillInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      isActive
                        ? styles.statusPillTextActive
                        : styles.statusPillTextInactive,
                    ]}
                  >
                    {isActive ? 'Aktif' : 'Nonaktif'}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
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
    fontSize: 16,
    color: Colors.stone[800],
  },
  formContainer: {
    padding: Spacing[5],
  },
  formHero: {
    marginBottom: Spacing[6],
  },
  heroTitle: {
    ...Typography.h1,
    color: Colors.stone[800],
    marginBottom: Spacing[1],
  },
  heroSubtitle: {
    ...Typography.bodyM,
    color: Colors.stone[500],
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[5],
    gap: Spacing[4],
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
  storeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    backgroundColor: Colors.stone[0],
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[100],
    gap: Spacing[3],
  },
  storeAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeAvatarText: {
    ...Typography.h3,
    color: Colors.primary[700],
  },
  storeTextContainer: {
    flex: 1,
  },
  storeName: {
    ...Typography.h3,
    color: Colors.stone[800],
  },
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  storeCommunity: {
    ...Typography.bodyS,
    color: Colors.stone[500],
  },
  activePill: {
    backgroundColor: Colors.semantic.success[50],
    borderWidth: 1,
    borderColor: Colors.semantic.success[500],
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  activePillText: {
    ...Typography.overline,
    color: Colors.semantic.success[700],
    fontSize: 9,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.stone[800],
  },
  productList: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[10],
    gap: Spacing[2],
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.stone[100],
    padding: Spacing[3],
    gap: Spacing[3],
  },
  itemImageContainer: {
    width: 56,
    height: 56,
    borderRadius: Radius.xs,
    backgroundColor: Colors.stone[50],
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    ...Typography.bodyL,
    fontWeight: '600',
    color: Colors.stone[800],
  },
  itemPrice: {
    ...Typography.numericPrice,
    fontSize: 14,
    color: Colors.stone[900],
  },
  itemStock: {
    ...Typography.bodyS,
    fontSize: 11,
    color: Colors.stone[500],
  },
  itemActions: {
    alignItems: 'flex-end',
  },
  statusPill: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusPillActive: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[300],
  },
  statusPillInactive: {
    backgroundColor: Colors.stone[100],
    borderColor: Colors.stone[200],
  },
  statusPillText: {
    ...Typography.bodyS,
    fontSize: 11,
    fontWeight: '600',
  },
  statusPillTextActive: {
    color: Colors.primary[700],
  },
  statusPillTextInactive: {
    color: Colors.stone[500],
  },
});
