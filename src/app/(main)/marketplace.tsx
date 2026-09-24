import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import { ShoppingCart, MapPin } from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { Input } from '@/components/ui/Input';
import { CategoryPills } from '@/components/ui/CategoryPills';
import { ProductCard } from '@/components/ui/ProductCard';
import { ProductSkeleton } from '@/components/ui/ProductSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useComplex } from '@/lib/complex-provider';
import { useCart } from '@/lib/cart-provider';
import { isModuleEnabled } from '@/config/modules';
import { DesktopShell, useIsDesktop } from '@/components/ui/DesktopShell';
import {
  getCategories,
  getProducts,
  type ProductWithDetails,
} from '@/services/products';
import type { Category } from '@/types/database';

const PAGE_SIZE = 20;

/**
 * Marketplace Discovery Screen — PRD §17, §18, §22, §101 & desain.md §13
 * 2-column responsive product grid scoped strictly to the active community.
 */
export default function MarketplaceScreen() {
  const isDesktop = useIsDesktop();
  const numColumns = isDesktop ? 3 : 2;
  const { complexSettings } = useComplex();
  const { totalItemCount } = useCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Load categories
  useEffect(() => {
    let isMounted = true;
    getCategories().then(({ data }) => {
      if (isMounted) setCategories(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch products effect
  useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(async () => {
      const { data, error: fetchErr } = await getProducts({
        categoryId: selectedCategoryId,
        searchQuery,
        limit: PAGE_SIZE,
        offset: 0,
      });

      if (!isMounted) return;
      if (fetchErr) {
        setError(fetchErr.message);
      } else {
        setProducts(data);
        setHasMore(data.length === PAGE_SIZE);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedCategoryId, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const { data, error: fetchErr } = await getProducts({
      categoryId: selectedCategoryId,
      searchQuery,
      limit: PAGE_SIZE,
      offset: 0,
    });
    if (fetchErr) {
      setError(fetchErr.message);
    } else {
      setProducts(data);
      setHasMore(data.length === PAGE_SIZE);
    }
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (loading || refreshing || !hasMore) return;
    const nextOffset = products.length;
    const { data } = await getProducts({
      categoryId: selectedCategoryId,
      searchQuery,
      limit: PAGE_SIZE,
      offset: nextOffset,
    });
    if (data.length > 0) {
      setProducts((prev) => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    } else {
      setHasMore(false);
    }
  };

  const handleOpenProduct = (id: string) => {
    router.push({
      pathname: '/product/[id]',
      params: { id },
    });
  };

  if (!isModuleEnabled('marketplace')) {
    return <Redirect href="/(main)" />;
  }

  const mainView = (
    <View style={styles.container}>
      {/* Header Bar (Mobile only) */}
      {!isDesktop && (
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View>
              <Text style={styles.title}>Marketplace</Text>
              {complexSettings?.name && (
                <View style={styles.communityTag}>
                  <MapPin size={11} color={Colors.stone[600]} />
                  <Text style={styles.communityTagText} numberOfLines={1}>
                    {complexSettings.name}
                  </Text>
                </View>
              )}
            </View>

            <Pressable
              onPress={() => router.push('/cart' as any)}
              hitSlop={8}
              style={styles.cartIconTouch}
              accessibilityLabel="Keranjang Belanja"
            >
              <ShoppingCart size={24} color={Colors.stone[700]} />
              {totalItemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{totalItemCount}</Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Search Input */}
          <Input
            placeholder="Cari makanan, jasa, barang..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            containerStyle={styles.searchContainer}
          />
        </View>
      )}

      {/* Desktop Search Filter Bar */}
      {isDesktop && (
        <View style={styles.desktopSearchRow}>
          <View style={{ flex: 1 }}>
            <Input
              placeholder="Cari makanan, jasa, atau produk UMKM warga komplek..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      )}

      {/* Category Horizontal Pills */}
      <View style={styles.pillsWrapper}>
        <CategoryPills
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
      </View>

      {/* Main Content Area */}
      {error ? (
        <ErrorState
          title="Gagal Memuat Produk"
          description={error}
          onRetry={handleRefresh}
        />
      ) : loading && !refreshing ? (
        <ProductSkeleton />
      ) : products.length === 0 ? (
        <EmptyState
          title={
            searchQuery || selectedCategoryId
              ? 'Produk Tidak Ditemukan'
              : 'Belum Ada Produk di Komplek Ini'
          }
          description={
            searchQuery || selectedCategoryId
              ? 'Coba ubah kata kunci pencarian atau pilih kategori lain.'
              : `Jadilah yang pertama menawarkan barang atau jasa untuk warga di ${complexSettings?.name || 'komplek ini'}.`
          }
        />
      ) : (
        <FlatList
          key={isDesktop ? 'grid-3' : 'grid-2'}
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary[600]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => handleOpenProduct(item.id)}
            />
          )}
        />
      )}
    </View>
  );

  return (
    <DesktopShell
      activeKey="/marketplace"
      pageTitle="Pasar Komplek"
      breadcrumb={['Komplek', 'Marketplace']}
      headerAction={
        <Pressable
          onPress={() => router.push('/cart' as any)}
          style={styles.desktopCartBtn}
        >
          <ShoppingCart size={18} color={Colors.stone[700]} />
          <Text style={styles.desktopCartText}>Keranjang ({totalItemCount})</Text>
        </Pressable>
      }
    >
      <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top']}>
        {mainView}
      </SafeAreaView>
    </DesktopShell>
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
    paddingBottom: Spacing[2],
    gap: Spacing[2],
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...Typography.h1,
    color: Colors.stone[800],
  },
  communityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.stone[50],
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 160,
  },
  communityTagText: {
    ...Typography.bodyS,
    fontSize: 11,
    color: Colors.stone[600],
  },
  cartIconTouch: {
    padding: Spacing[1],
    position: 'relative',
  },
  cartIconText: {
    fontSize: 22,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: Colors.primary[600],
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  searchContainer: {
    marginTop: 2,
  },
  pillsWrapper: {
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[100],
    marginBottom: Spacing[3],
  },
  listContent: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[10],
  },
  columnWrapper: {
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  desktopSearchRow: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
  },
  desktopCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.stone[100],
  },
  desktopCartText: {
    ...Typography.bodyS,
    fontWeight: '600',
    color: Colors.stone[800],
  },
});
