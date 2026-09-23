import { supabase } from '@/lib/supabase';
import type { Cart, CartItem } from '@/types/database';
import type { ProductWithDetails } from '@/services/products';

export interface CartItemWithProduct extends CartItem {
  product: ProductWithDetails;
}

export interface SellerCartGroup {
  sellerId: string;
  storeName: string;
  items: CartItemWithProduct[];
  subtotal: number;
}

/**
 * Get or create an active cart for the user (PRD v2 §14)
 */
export async function getOrCreateCart(
  userId: string,
  _communityId?: string
): Promise<{ data: Cart | null; error: Error | null }> {
  // 1. Try to find existing cart for user
  const { data: existing } = await supabase
    .from('carts')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    return { data: existing as Cart, error: null };
  }

  // 2. Create new cart
  const { data: created, error: createErr } = await supabase
    .from('carts')
    .insert({
      user_id: userId,
    })
    .select()
    .single();

  if (createErr) {
    return { data: null, error: new Error(createErr.message) };
  }
  return { data: created as Cart, error: null };
}

/**
 * Get all cart items with product details (PRD v2 §14)
 */
export async function getCartItems(
  cartId: string
): Promise<{ data: CartItemWithProduct[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      *,
      product:products (
        *,
        seller:seller_profiles (id, store_name, avatar_path, user_id),
        category:categories (id, name, slug),
        images:product_images (id, storage_path, is_cover, sort_order)
      )
    `)
    .eq('cart_id', cartId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  const formatted = (data || []).map((item: any) => ({
    ...item,
    product: {
      ...item.product,
      price: Number(item.product.price),
    } as ProductWithDetails,
  }));

  return { data: formatted, error: null };
}

/**
 * Add a product to the cart with quantity and stock validation (PRD v2 §14)
 */
export async function addToCart(
  cartId: string,
  productId: string,
  quantity = 1
): Promise<{ error: Error | null }> {
  // 1. Check product status and available stock
  const { data: product, error: prodErr } = await supabase
    .from('products')
    .select('status, stock')
    .eq('id', productId)
    .single();

  if (prodErr || !product) {
    return { error: new Error('Produk tidak ditemukan') };
  }

  if (product.status !== 'active') {
    return { error: new Error('Produk sedang tidak aktif atau tidak dapat dipesan') };
  }

  if (product.stock < quantity) {
    return { error: new Error(`Stok tidak mencukupi (tersedia: ${product.stock} unit)`) };
  }

  // 2. Check if item already exists in cart
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cartId)
    .eq('product_id', productId)
    .maybeSingle();

  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    if (newQty > product.stock) {
      return { error: new Error(`Jumlah melebihi stok tersedia (${product.stock} unit)`) };
    }
    const { error: updateErr } = await supabase
      .from('cart_items')
      .update({ quantity: newQty })
      .eq('id', existingItem.id);
    return { error: updateErr ? new Error(updateErr.message) : null };
  }

  // 3. Insert new item
  const { error: insertErr } = await supabase.from('cart_items').insert({
    cart_id: cartId,
    product_id: productId,
    quantity,
  });

  return { error: insertErr ? new Error(insertErr.message) : null };
}

/**
 * Update quantity of a cart item with stock check (PRD v2 §14)
 */
export async function updateCartItemQuantity(
  itemId: string,
  productId: string,
  newQuantity: number
): Promise<{ error: Error | null }> {
  if (newQuantity <= 0) {
    return removeCartItem(itemId);
  }

  const { data: product } = await supabase
    .from('products')
    .select('stock')
    .eq('id', productId)
    .single();

  if (product && product.stock < newQuantity) {
    return { error: new Error(`Maksimal ${product.stock} unit sesuai stok tersedia`) };
  }

  const { error } = await supabase
    .from('cart_items')
    .update({ quantity: newQuantity })
    .eq('id', itemId);

  return { error: error ? new Error(error.message) : null };
}

/**
 * Remove an item from the cart (PRD v2 §14)
 */
export async function removeCartItem(itemId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
  return { error: error ? new Error(error.message) : null };
}

/**
 * Group cart items by seller for single-seller checkout rule compliance (PRD v2 §14)
 */
export function groupCartBySeller(items: CartItemWithProduct[]): SellerCartGroup[] {
  const map = new Map<string, SellerCartGroup>();

  for (const item of items) {
    const sellerId = item.product?.seller?.id || 'unknown';
    const storeName = item.product?.seller?.store_name || 'Toko Warga';
    const itemTotal = (item.product?.price || 0) * item.quantity;

    if (!map.has(sellerId)) {
      map.set(sellerId, {
        sellerId,
        storeName,
        items: [],
        subtotal: 0,
      });
    }

    const group = map.get(sellerId)!;
    group.items.push(item);
    group.subtotal += itemTotal;
  }

  return Array.from(map.values());
}
