import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await cartService.getCart();
      setCart(res.data.data || { items: [], total: 0 });
    } catch (err) {
      console.error('Failed to fetch cart', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchCart();
    else setCart({ items: [], total: 0 });
  }, [user, fetchCart]);

  const addItem = async (productId, quantity = 1) => {
    const res = await cartService.addItem(productId, quantity);
    await fetchCart();
    return res;
  };

  const updateItem = async (cartItemId, quantity) => {
    await cartService.updateItem(cartItemId, quantity);
    await fetchCart();
  };

  const removeItem = async (cartItemId) => {
    await cartService.removeItem(cartItemId);
    await fetchCart();
  };

  const clearCart = async () => {
    await cartService.clearCart();
    setCart({ items: [], total: 0 });
  };

  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, loading, fetchCart, addItem, updateItem, removeItem, clearCart, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
