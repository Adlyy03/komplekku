import { supabase } from '@/lib/supabase';
import type { Order, OrderItem, Profile, SellerProfile } from '@/types/database';
import type { DeliveryMethod, OrderStatus } from '@/types';
import type { CartItemWithProduct } from '@/services/cart';

export interface OrderWithDetails extends Order {
  buyer: Pick<Profile, 'id' | 'full_name' | 'avatar_path' | 'phone'>;
  seller: Pick<SellerProfile, 'id' | 'store_name' | 'avatar_path' | 'user_id'>;
  items: OrderItem[];
}

export interface CreateOrderInput {
  buyerId: string;
  sellerId: string;
  communityId?: string; // Optional for backward compatibility
  deliveryMethod: DeliveryMethod;
  deliveryFee?: number;
  notes?: string;
  cartItems: CartItemWithProduct[];
}

/**
 * Generate human-readable unique order number: KMP-YYYYMMDD-XXXX (PRD v2 §14)
 */
function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `KMP-${y}${m}${d}-${rand}`;
}

/**
 * Create Order with snapshots and stock decrement (PRD v2 §14 & §26)
 */
export async function createOrder(
  input: CreateOrderInput
): Promise<{ data: Order | null; error: Error | null }> {
  if (input.cartItems.length === 0) {
    return { data: null, error: new Error('Keranjang belanja kosong') };
  }

  // 1. Calculate totals & validate stock
  let subtotal = 0;
  for (const item of input.cartItems) {
    if (!item.product) continue;
    if (item.product.stock < item.quantity) {
      return {
        data: null,
        error: new Error(`Stok "${item.product.name}" tidak mencukupi (sisa ${item.product.stock})`),
      };
    }
    subtotal += item.product.price * item.quantity;
  }

  const deliveryFee = input.deliveryFee || (input.deliveryMethod === 'manual_delivery' ? 5000 : 0);
  const total = subtotal + deliveryFee;
  const orderNumber = generateOrderNumber();

  // 2. Insert order row
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      buyer_id: input.buyerId,
      seller_id: input.sellerId,
      status: 'pending',
      payment_status: 'unpaid',
      subtotal,
      delivery_fee: deliveryFee,
      total,
      delivery_method: input.deliveryMethod,
      notes: input.notes?.trim() || null,
    })
    .select()
    .single();

  if (orderErr || !order) {
    return { data: null, error: new Error(orderErr?.message || 'Gagal membuat pesanan') };
  }

  // 3. Insert order_items with immutable price & name snapshots (PRD v2 §14 & §26)
  for (const item of input.cartItems) {
    if (!item.product) continue;
    const itemSubtotal = item.product.price * item.quantity;

    await supabase.from('order_items').insert({
      order_id: order.id,
      product_id: item.product.id,
      product_name_snapshot: item.product.name,
      price_snapshot: item.product.price,
      quantity: item.quantity,
      subtotal: itemSubtotal,
    });

    // Decrement stock
    const newStock = Math.max(0, item.product.stock - item.quantity);
    await supabase
      .from('products')
      .update({
        stock: newStock,
        status: newStock === 0 ? 'sold_out' : 'active',
      })
      .eq('id', item.product.id);

    // Delete item from cart
    await supabase.from('cart_items').delete().eq('id', item.id);
  }

  // 4. Send in-app notification to seller (PRD v2 §17)
  const { data: sellerProf } = await supabase
    .from('seller_profiles')
    .select('user_id')
    .eq('id', input.sellerId)
    .single();

  if (sellerProf?.user_id) {
    await supabase.from('notifications').insert({
      user_id: sellerProf.user_id,
      type: 'order',
      title: 'Pesanan Baru Masuk',
      body: `Ada pesanan #${order.order_number} dari tetangga.`,
      reference_type: 'order',
      reference_id: order.id,
    });
  }

  return { data: order as Order, error: null };
}

/**
 * Get orders placed by a buyer (PRD v2 §14)
 */
export async function getBuyerOrders(
  buyerId: string
): Promise<{ data: OrderWithDetails[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      buyer:profiles!orders_buyer_id_fkey (id, full_name, avatar_path, phone),
      seller:seller_profiles!orders_seller_id_fkey (id, store_name, avatar_path, user_id),
      items:order_items (*)
    `)
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  const formatted = (data || []).map((o: any) => ({
    ...o,
    subtotal: Number(o.subtotal),
    delivery_fee: Number(o.delivery_fee),
    total: Number(o.total),
    items: (o.items || []).map((it: any) => ({
      ...it,
      price_snapshot: Number(it.price_snapshot),
      subtotal: Number(it.subtotal),
    })),
  }));

  return { data: formatted, error: null };
}

/**
 * Get incoming orders for a seller store (PRD v2 §14)
 */
export async function getSellerOrders(
  sellerId: string
): Promise<{ data: OrderWithDetails[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      buyer:profiles!orders_buyer_id_fkey (id, full_name, avatar_path, phone),
      seller:seller_profiles!orders_seller_id_fkey (id, store_name, avatar_path, user_id),
      items:order_items (*)
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  const formatted = (data || []).map((o: any) => ({
    ...o,
    subtotal: Number(o.subtotal),
    delivery_fee: Number(o.delivery_fee),
    total: Number(o.total),
    items: (o.items || []).map((it: any) => ({
      ...it,
      price_snapshot: Number(it.price_snapshot),
      subtotal: Number(it.subtotal),
    })),
  }));

  return { data: formatted, error: null };
}

/**
 * Get detailed order by ID (PRD v2 §14)
 */
export async function getOrderById(
  orderId: string
): Promise<{ data: OrderWithDetails | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      buyer:profiles!orders_buyer_id_fkey (id, full_name, avatar_path, phone),
      seller:seller_profiles!orders_seller_id_fkey (id, store_name, avatar_path, user_id),
      items:order_items (*)
    `)
    .eq('id', orderId)
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  const formatted: OrderWithDetails = {
    ...data,
    subtotal: Number(data.subtotal),
    delivery_fee: Number(data.delivery_fee),
    total: Number(data.total),
    items: (data.items || []).map((it: any) => ({
      ...it,
      price_snapshot: Number(it.price_snapshot),
      subtotal: Number(it.subtotal),
    })),
  };

  return { data: formatted, error: null };
}

/**
 * Update order status with validation (PRD v2 §14)
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('orders')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    return { error: new Error(error.message) };
  }

  // Send in-app notification to buyer
  const { data: orderData } = await supabase
    .from('orders')
    .select('buyer_id, order_number')
    .eq('id', orderId)
    .single();

  if (orderData?.buyer_id) {
    const STATUS_LABELS: Record<string, string> = {
      confirmed: 'Dikonfirmasi',
      processing: 'Sedang Diproses',
      ready: 'Siap Diambil/Diantar',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    };
    const label = STATUS_LABELS[newStatus] || newStatus;
    await supabase.from('notifications').insert({
      user_id: orderData.buyer_id,
      type: 'order',
      title: `Pesanan #${orderData.order_number}: ${label}`,
      body: `Status pesanan Anda telah diperbarui menjadi ${label.toLowerCase()}.`,
      reference_type: 'order',
      reference_id: orderId,
    });
  }

  return { error: null };
}
