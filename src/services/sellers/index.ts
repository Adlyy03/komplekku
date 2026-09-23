import { supabase } from '@/lib/supabase';
import type { Product, ProductImage, SellerProfile } from '@/types/database';
import type { ProductWithDetails } from '@/services/products';

export interface CreateProductInput {
  sellerId: string;
  communityId?: string; // Optional for backward compatibility
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  type?: 'product' | 'service' | 'physical';
  condition?: 'new' | 'like_new' | 'used';
}

/**
 * Get seller profile for user in this complex (PRD v2 §14)
 */
export async function getSellerProfile(
  userId: string,
  _communityId?: string
): Promise<{ data: SellerProfile | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('seller_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  return { data: data as SellerProfile | null, error: null };
}

/**
 * Register / create a seller store (PRD v2 §14)
 */
export async function createSellerProfile(
  userId: string,
  _communityId?: string,
  storeName?: string,
  description?: string
): Promise<{ data: SellerProfile | null; error: Error | null }> {
  // Support both (userId, storeName, description) and (userId, communityId, storeName, description)
  const actualStoreName = (storeName || _communityId || '').trim();
  const actualDesc = (description || '').trim();

  const { data, error } = await supabase
    .from('seller_profiles')
    .insert({
      user_id: userId,
      store_name: actualStoreName,
      description: actualDesc || null,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  return { data: data as SellerProfile, error: null };
}

/**
 * Fetch all products belonging to a seller (active and inactive) (PRD v2 §14)
 */
export async function getSellerProducts(
  sellerId: string
): Promise<{ data: ProductWithDetails[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      seller:seller_profiles (id, store_name, avatar_path, user_id),
      category:categories (id, name, slug),
      images:product_images (id, storage_path, is_cover, sort_order)
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  const formatted = (data || []).map((item: any) => ({
    ...item,
    price: Number(item.price),
    seller: item.seller,
    category: item.category,
    images: ((item.images as ProductImage[]) || []).sort(
      (a, b) => (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0) || a.sort_order - b.sort_order
    ),
  }));

  return { data: formatted, error: null };
}

/**
 * Upload a product image to 'product-images' bucket (PRD v2 §29)
 */
export async function uploadProductImage(
  sellerId: string,
  imageUri: string
): Promise<{ path: string | null; url: string | null; error: Error | null }> {
  try {
    const ext = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    const filePath = `${sellerId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    const response = await fetch(imageUri);
    const arrayBuffer = await response.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, arrayBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      return { path: null, url: null, error: new Error(uploadError.message) };
    }

    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return { path: filePath, url: publicUrlData.publicUrl, error: null };
  } catch (err: any) {
    return { path: null, url: null, error: new Error(err.message || 'Gagal mengunggah foto produk') };
  }
}

/**
 * Create a new product with images (PRD v2 §14)
 */
export async function createProduct(
  input: CreateProductInput,
  imageUris: string[]
): Promise<{ data: Product | null; error: Error | null }> {
  // 1. Insert product row
  const { data: product, error: productErr } = await supabase
    .from('products')
    .insert({
      seller_id: input.sellerId,
      category_id: input.categoryId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      price: input.price,
      stock: input.stock,
      type: input.type === 'physical' ? 'product' : (input.type || 'product'),
      condition: input.condition || 'new',
      status: 'active',
    })
    .select()
    .single();

  if (productErr || !product) {
    return { data: null, error: new Error(productErr?.message || 'Gagal membuat produk') };
  }

  // 2. Upload images if provided
  if (imageUris.length > 0) {
    for (let i = 0; i < imageUris.length; i++) {
      const { path } = await uploadProductImage(input.sellerId, imageUris[i]);
      if (path) {
        await supabase.from('product_images').insert({
          product_id: product.id,
          storage_path: path,
          is_cover: i === 0,
          sort_order: i,
        });
      }
    }
  }

  return { data: product as Product, error: null };
}

/**
 * Update product fields (PRD v2 §14)
 */
export async function updateProduct(
  productId: string,
  updates: Partial<Pick<Product, 'name' | 'description' | 'price' | 'stock' | 'status' | 'category_id'>>
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('products')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId);

  if (error) {
    return { error: new Error(error.message) };
  }
  return { error: null };
}

/**
 * Toggle product active / inactive status (PRD v2 §14)
 */
export async function toggleProductStatus(
  productId: string,
  newStatus: 'active' | 'inactive'
): Promise<{ error: Error | null }> {
  return updateProduct(productId, { status: newStatus });
}
