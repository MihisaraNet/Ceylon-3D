import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';
import { getImageUri } from '../lib/config';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);

  /* ── Load cart from backend ──────────────────────────── */
  const loadCart = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    try {
      const { data } = await api.get('/cart');
      setItems(
        data.map(i => ({
          ...i,
          image: getImageUri(i.image),
        }))
      );
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadCart(); }, [loadCart]);

  /* ── Add item — throws on error so UI can catch ─────── */
  const addToCart = async (productId, quantity = 1) => {
    // Throws the error so callers can show the real server message
    await api.post('/cart', { productId, quantity });
    await loadCart();
  };

  /* ── Remove item ─────────────────────────────────────── */
  const removeFromCart = async (cartItemId) => {
    try {
      await api.delete(`/cart/${cartItemId}`);
    } catch { /* ignore if already gone */ }
    await loadCart();
  };

  /* ── Update quantity — throws so CartScreen can alert ── */
  const updateQuantity = async (cartItemId, quantity) => {
    await api.put(`/cart/${cartItemId}`, { quantity });
    await loadCart();
  };

  /* ── Clear whole cart ────────────────────────────────── */
  const clearCart = async () => {
    try {
      await api.delete('/cart');
    } catch { /* ignore */ }
    setItems([]);
  };

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        loading,
        reloadCart: loadCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
