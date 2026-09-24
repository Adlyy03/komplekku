import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { popup } from '@/lib/popup';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { CaretLeft, ShoppingCart, ShoppingBagOpen } from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { formatRupiah, formatTimeAgo, getProductById, type ProductWithDetails } from '@/services/products';
import { useCart } from '@/lib/cart-provider';
import { useSupabase } from '@/lib/supabase-provider';
import { getOrCreateConversation } from '@/services/chat';
import { DesktopShell, useIsDesktop } from '@/components/ui/DesktopShell';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Product Detail Screen — PRD §21 & desain.md §14
 * Full product view with photo gallery, seller trust card, and neighbor-to-neighbor CTA bar.
 */
export default function ProductDetailScreen() {
  const isDesktop = useIsDesktop();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addItem, totalItemCount } = useCart();
  const { user } = useSupabase();

  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingCart, setAddingCart] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    getProductById(id)
      .then(({ data, error: fetchErr }) => {
        if (!isMounted) return;
        if (fetchErr) {
          setError(fetchErr.message);
        } else if (!data) {
          setError('Produk tidak ditemukan');
        } else {
          setProduct(data);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Gagal memuat produk');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return <LoadingState fullScreen />;
  }

  if (error || !product) {
    return (
      <DesktopShell
        activeKey="/marketplace"
        pageTitle="Detail Produk"
        breadcrumb={['Pasar', 'Produk']}
      >
        <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top', 'bottom']}>
          {!isDesktop && (
            <View style={styles.navBar}>
              <Pressable
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/(main)/marketplace' as any))}
                hitSlop={8}
                style={styles.backTouch}
              >
                <CaretLeft size={20} color={Colors.stone[700]} />
                <Text style={styles.backButton}>Kembali</Text>
              </Pressable>
            </View>
          )}
          <ErrorState
            title="Produk Tidak Ditemukan"
            description={error || 'Produk mungkin sudah dihapus atau tidak tersedia.'}
            onRetry={() => (router.canGoBack() ? router.back() : router.replace('/(main)/marketplace' as any))}
          />
        </SafeAreaView>
      </DesktopShell>
    );
  }

  const images = product.images || [];
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = async () => {
    setAddingCart(true);
    try {
      const res = await addItem(product.id, 1);
      if (res.error) {
        popup.error('Gagal Menambah ke Keranjang', res.error.message);
      } else {
        popup.success('Berhasil', `"${product.name}" berhasil dimasukkan ke keranjang belanja.`);
      }
    } finally {
      setAddingCart(false);
    }
  };

  const handleChatSeller = async () => {
    if (!product) return;
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    if (user.id === product.seller?.user_id) {
      popup.info('Info', 'Ini adalah produk toko Anda sendiri.');
      return;
    }
    if (!product.seller?.user_id) {
      popup.info('Info', 'Penjual tidak ditemukan.');
      return;
    }
    const { data: conv, error: convErr } = await getOrCreateConversation(
      user.id,
      product.seller.user_id,
      product.community_id
    );
    if (conv) {
      router.push({
        pathname: `/chat/${conv.id}` as any,
        params: { productId: product.id },
      });
    } else {
      popup.error('Gagal', convErr?.message || 'Tidak dapat memulai chat');
    }
  };

  return (
    <DesktopShell
      activeKey="/marketplace"
      pageTitle={product.name}
      breadcrumb={['Pasar', 'Produk', product.name]}
      headerAction={
        <Pressable
          onPress={() => router.push('/cart' as any)}
          hitSlop={8}
          style={styles.cartIconTouch}
          accessibilityLabel="Keranjang"
        >
          <ShoppingCart size={22} color={Colors.stone[700]} />
          {totalItemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItemCount}</Text>
            </View>
          )}
        </Pressable>
      }
    >
      <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top', 'bottom']}>
        {/* Sticky Top Nav Bar */}
        {!isDesktop && (
          <View style={styles.navBar}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(main)/marketplace' as any))}
              hitSlop={8}
              style={styles.backTouch}
            >
              <CaretLeft size={20} color={Colors.stone[700]} />
              <Text style={styles.backButton}>Kembali</Text>
            </Pressable>
            <Text style={styles.navTitle} numberOfLines={1}>
              {product.name}
            </Text>
            <Pressable
              onPress={() => router.push('/cart' as any)}
              hitSlop={8}
              style={styles.cartIconTouch}
              accessibilityLabel="Keranjang"
            >
              <ShoppingCart size={22} color={Colors.stone[700]} />
              {totalItemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{totalItemCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        )}

        <ScrollView contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopScrollContent]}>
          {/* Photo Gallery */}
          <View style={[styles.galleryContainer, isDesktop && styles.desktopGalleryContainer]}>
            {images.length > 0 ? (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const pageWidth = isDesktop ? 680 : SCREEN_WIDTH;
                  const index = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
                  setActiveImageIndex(index);
                }}
              >
                {images.map((img) => (
                  <Image
                    key={img.id}
                    source={{ uri: img.storage_path }}
                    style={[styles.galleryImage, isDesktop && styles.desktopGalleryImage]}
                    contentFit="cover"
                  />
                ))}
              </ScrollView>
            ) : (
            <View style={styles.galleryPlaceholder}>
              <ShoppingBagOpen size={48} color={Colors.stone[400]} />
            </View>
          )}

          {/* Dots Indicator */}
          {images.length > 1 && (
            <View style={styles.dotsRow}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    activeImageIndex === i && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Details Section */}
        <View style={styles.detailsSection}>
          {/* Category & Tags Row */}
          <View style={styles.tagsRow}>
            {product.category?.name && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {product.category.name}
                </Text>
              </View>
            )}
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {product.type === 'product' ? 'Barang Fisik' : 'Layanan / Jasa'}
              </Text>
            </View>
            <Text style={styles.postedTime}>
              {formatTimeAgo(product.created_at)}
            </Text>
          </View>

          {/* Title & Price */}
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.price}>{formatRupiah(product.price)}</Text>

          {/* Stock Indicator */}
          <View style={styles.stockRow}>
            <Text style={styles.stockLabel}>Status Stok:</Text>
            <Text
              style={[
                styles.stockValue,
                isOutOfStock && styles.stockValueOut,
              ]}
            >
              {isOutOfStock ? 'Habis' : `Tersedia (${product.stock} unit)`}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Seller Trust Card per desain.md §14 */}
          <View style={styles.sellerCard}>
            <View style={styles.sellerAvatar}>
              {product.seller?.avatar_path ? (
                <Image
                  source={{ uri: product.seller.avatar_path }}
                  style={styles.sellerAvatarImg}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.sellerAvatarInitial}>
                  {(product.seller?.store_name || 'T')[0]?.toUpperCase()}
                </Text>
              )}
            </View>

            <View style={styles.sellerInfo}>
              <View style={styles.sellerNameRow}>
                <Text style={styles.sellerName}>
                  {product.seller?.store_name || 'Toko Warga'}
                </Text>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>Tetangga</Text>
                </View>
              </View>
              <Text style={styles.sellerSubtitle}>
                Penjual terverifikasi di komplek ini
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <View style={styles.descSection}>
            <Text style={styles.descTitle}>Deskripsi Produk</Text>
            <Text style={styles.descText}>
              {product.description || 'Tidak ada deskripsi tambahan dari penjual.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom CTA Bar per desain.md §14 */}
      <View style={[styles.bottomBar, isDesktop && styles.desktopBottomBar]}>
        <Button
          label={isOutOfStock ? 'Habis' : '+ Keranjang'}
          onPress={handleAddToCart}
          variant="secondary"
          disabled={isOutOfStock}
          loading={addingCart}
          style={{ flex: 1 }}
        />
        <Button
          label={isOutOfStock ? 'Habis' : 'Chat Penjual'}
          onPress={handleChatSeller}
          variant="primary"
          disabled={isOutOfStock}
          style={{ flex: 1 }}
        />
      </View>
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
    paddingVertical: Spacing[1],
  },
  backButton: {
    ...Typography.label,
    color: Colors.primary[600],
  },
  navTitle: {
    ...Typography.h3,
    fontSize: 15,
    color: Colors.stone[800],
    maxWidth: 200,
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
  scrollContent: {
    paddingBottom: Spacing[12],
  },
  desktopScrollContent: {
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
    paddingVertical: Spacing[6],
  },
  galleryContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.85,
    backgroundColor: Colors.stone[50],
    position: 'relative',
  },
  desktopGalleryContainer: {
    width: '100%',
    height: 380,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.85,
  },
  desktopGalleryImage: {
    width: 680,
    height: 380,
  },
  desktopBottomBar: {
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
    borderRadius: Radius.md,
    marginBottom: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.stone[200],
  },
  galleryPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 48,
    opacity: 0.4,
  },
  dotsRow: {
    position: 'absolute',
    bottom: Spacing[3],
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing[1],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  dotActive: {
    backgroundColor: Colors.primary[600],
    width: 16,
  },
  detailsSection: {
    backgroundColor: Colors.stone[0],
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[5],
    paddingBottom: Spacing[6],
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    marginTop: -Spacing[3],
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  categoryBadge: {
    backgroundColor: Colors.stone[50],
    borderWidth: 1,
    borderColor: Colors.stone[200],
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  categoryBadgeText: {
    ...Typography.bodyS,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.stone[700],
  },
  typeBadge: {
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  typeBadgeText: {
    ...Typography.bodyS,
    fontSize: 11,
    color: Colors.primary[700],
  },
  postedTime: {
    ...Typography.bodyS,
    fontSize: 11,
    color: Colors.stone[400],
    marginLeft: 'auto',
  },
  title: {
    ...Typography.h1,
    color: Colors.stone[800],
    marginBottom: Spacing[1],
  },
  price: {
    ...Typography.numericPrice,
    fontSize: 24,
    color: Colors.stone[900],
    marginBottom: Spacing[3],
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  stockLabel: {
    ...Typography.bodyS,
    color: Colors.stone[500],
  },
  stockValue: {
    ...Typography.bodyS,
    fontWeight: '600',
    color: Colors.semantic.success[700],
  },
  stockValueOut: {
    color: Colors.semantic.error[700],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.stone[100],
    marginVertical: Spacing[4],
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.stone[25],
    padding: Spacing[3],
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.stone[100],
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sellerAvatarImg: {
    width: 48,
    height: 48,
  },
  sellerAvatarInitial: {
    ...Typography.h2,
    color: Colors.primary[700],
  },
  sellerInfo: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  sellerName: {
    ...Typography.h3,
    fontSize: 15,
    color: Colors.stone[800],
  },
  verifiedBadge: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing[1],
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  verifiedBadgeText: {
    ...Typography.overline,
    fontSize: 9,
    color: Colors.primary[700],
  },
  sellerSubtitle: {
    ...Typography.bodyS,
    fontSize: 11,
    color: Colors.stone[500],
    marginTop: 2,
  },
  descSection: {
    gap: Spacing[2],
  },
  descTitle: {
    ...Typography.h3,
    color: Colors.stone[800],
  },
  descText: {
    ...Typography.bodyL,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.stone[600],
  },
  bottomBar: {
    backgroundColor: Colors.stone[0],
    borderTopWidth: 1,
    borderTopColor: Colors.stone[100],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    flexDirection: 'row',
    gap: Spacing[3],
  },
});
