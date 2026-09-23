import { supabase } from '@/lib/supabase';
import type { Category, Product, ProductImage, SellerProfile } from '@/types/database';

export interface ProductWithDetails extends Product {
  seller: Pick<SellerProfile, 'id' | 'store_name' | 'avatar_path' | 'user_id'>;
  category: Category;
  images: ProductImage[];
}

export interface GetProductsFilter {
  communityId?: string; // Optional for backward compatibility
  categoryId?: string | null;
  searchQuery?: string | null;
  limit?: number;
  offset?: number;
}

/**
 * Helper to get public URL for product image from Supabase Storage
 */
export function getProductImageUrl(imagePath?: string | null): string | null {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const { data } = supabase.storage.from('product-images').getPublicUrl(imagePath);
  return data.publicUrl;
}

/**
 * Format number to Indonesian Rupiah convention: Rp 150.000 (desain.md §14)
 */
export function formatRupiah(amount: number): string {
  const formatted = Math.floor(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${formatted}`;
}

/**
 * Format date string to relative time (Indonesian): "2 jam lalu", "3 hari lalu"
 */
export function formatTimeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  const months = Math.floor(days / 30);
  return `${months} bulan lalu`;
}

/**
 * Fetch all categories for marketplace filtering (PRD v2 §14)
 */
export async function getCategories(): Promise<{ data: Category[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('status', 'active')
    .order('sort_order', { ascending: true });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }
  return { data: (data as Category[]) || [], error: null };
}

/**
 * Fetch products for this complex marketplace with optional category, search, and pagination
 * PRD v2 §14: 1 app = 1 complex
 */
export async function getProducts({
  categoryId,
  searchQuery,
  limit = 20,
  offset = 0,
}: GetProductsFilter = {}): Promise<{ data: ProductWithDetails[]; error: Error | null }> {
  let query = supabase
    .from('products')
    .select(`
      *,
      seller:seller_profiles (id, store_name, avatar_path, user_id),
      category:categories (id, name, slug),
      images:product_images (id, storage_path, is_cover, sort_order)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (searchQuery && searchQuery.trim().length > 0) {
    const q = searchQuery.trim();
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  const formatted = (data || []).map((item: any) => ({
    ...item,
    price: Number(item.price),
    seller: item.seller as Pick<SellerProfile, 'id' | 'store_name' | 'avatar_path' | 'user_id'>,
    category: item.category as Category,
    images: ((item.images as ProductImage[]) || []).sort(
      (a, b) => (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0) || a.sort_order - b.sort_order
    ),
  }));

  return { data: formatted, error: null };
}

/**
 * Fetch single product detail by ID with seller & images (PRD v2 §14)
 */
export async function getProductById(
  productId: string
): Promise<{ data: ProductWithDetails | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      seller:seller_profiles (id, store_name, avatar_path, user_id, description),
      category:categories (id, name, slug),
      images:product_images (id, storage_path, is_cover, sort_order)
    `)
    .eq('id', productId)
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  const formatted: ProductWithDetails = {
    ...data,
    price: Number(data.price),
    seller: data.seller as Pick<SellerProfile, 'id' | 'store_name' | 'avatar_path' | 'user_id'>,
    category: data.category as Category,
    images: ((data.images as ProductImage[]) || []).sort(
      (a, b) => (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0) || a.sort_order - b.sort_order
    ),
  };

  return { data: formatted, error: null };
}
