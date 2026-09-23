import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Cart } from '@/types/database';
import {
  addToCart as apiAddToCart,
  getCartItems,
  getOrCreateCart,
  groupCartBySeller,
  removeCartItem as apiRemoveCartItem,
  updateCartItemQuantity as apiUpdateCartItemQty,
  type CartItemWithProduct,
  type SellerCartGroup,
} from '@/services/cart';
import { useSupabase } from './supabase-provider';

interface CartContextType {
  cart: Cart | null;
  items: CartItemWithProduct[];
  sellerGroups: SellerCartGroup[];
  totalItemCount: number;
  totalAmount: number;
  loading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<{ error: Error | null }>;
  updateQuantity: (itemId: string, productId: string, newQty: number) => Promise<{ error: Error | null }>;
  removeItem: (itemId: string) => Promise<{ error: Error | null }>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSupabase();

  const [cart, setCart] = useState<Cart | null>(null);
  const [items, setItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshCart = useCallback(async () => {
    if (!user?.id) {
      setCart(null);
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data: cartData } = await getOrCreateCart(user.id);
      setCart(cartData);

      if (cartData?.id) {
        const { data: cartItems } = await getCartItems(cartData.id);
        setItems(cartItems);
      }
    } catch {
      // Fallback cleanly
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(async () => {
      if (!user?.id) {
        if (isMounted) {
          setCart(null);
          setItems([]);
          setLoading(false);
        }
        return;
      }

      try {
        const { data: cartData } = await getOrCreateCart(user.id);
        if (!isMounted) return;
        setCart(cartData);

        if (cartData?.id) {
          const { data: cartItems } = await getCartItems(cartData.id);
          if (!isMounted) return;
          setItems(cartItems);
        }
      } catch {
        // Fallback cleanly
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const addItem = async (productId: string, quantity = 1) => {
    if (!cart?.id) {
      return { error: new Error('Keranjang belum siap') };
    }
    const res = await apiAddToCart(cart.id, productId, quantity);
    if (!res.error) {
      await refreshCart();
    }
    return res;
  };

  const updateQuantity = async (itemId: string, productId: string, newQty: number) => {
    const res = await apiUpdateCartItemQty(itemId, productId, newQty);
    if (!res.error) {
      await refreshCart();
    }
    return res;
  };

  const removeItem = async (itemId: string) => {
    const res = await apiRemoveCartItem(itemId);
    if (!res.error) {
      await refreshCart();
    }
    return res;
  };

  const sellerGroups = groupCartBySeller(items);
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        items,
        sellerGroups,
        totalItemCount,
        totalAmount,
        loading,
        addItem,
        updateQuantity,
        removeItem,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
