import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, SafeAreaView, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { getImageUri } from '../../lib/config';
import { useCart } from '../../context/CartContext';
import { useNavigation } from '@react-navigation/native';
import { CATEGORIES } from '../../data/categories';

/* ── Category accent colours ───────────────────────────── */
const CAT_COLORS = {
  miniatures:  '#ec4899',
  prototypes:  '#f59e0b',
  art:         '#10b981',
  functional:  '#3b82f6',
  custom:      '#8b5cf6',
};
const catColor = (id) => CAT_COLORS[id] || '#6366f1';

export default function ProductDetailScreen({ route }) {
  const { productId } = route.params;
  const { addToCart, totalItems } = useCart();
  const nav = useNavigation();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty,     setQty]     = useState(1);
  const [adding,  setAdding]  = useState(false);
  const [addErr,  setAddErr]  = useState(''); // inline error under button

  useEffect(() => {
    setAddErr('');
    (async () => {
      try {
        const { data } = await api.get(`/api/products/${productId}`);
        setProduct(data);
      } catch { } finally { setLoading(false); }
    })();
  }, [productId]);

  /* ── Qty helpers ─────────────────────────────────────── */
  const maxQty = product?.stock > 0 ? product.stock : 99;
  const decQty = () => setQty(q => Math.max(1, q - 1));
  const incQty = () => {
    if (product?.stock > 0 && qty >= product.stock) {
      setAddErr(`Only ${product.stock} unit(s) in stock`);
      return;
    }
    setQty(q => q + 1);
    setAddErr('');
  };

  /* ── Add to cart ─────────────────────────────────────── */
  const handleAdd = async () => {
    if (adding) return;
    setAddErr('');
    setAdding(true);
    try {
      await addToCart(product._id, qty);
      Alert.alert(
        'Added to Cart ✓',
        `${qty} × ${product.name} added successfully.`,
        [
          { text: 'Keep Browsing', style: 'cancel' },
          { text: 'View Cart', onPress: () => nav.navigate('Cart') },
        ]
      );
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Could not add to cart';
      setAddErr(msg);
    } finally {
      setAdding(false);
    }
  };

  /* ── Loading & not-found states ──────────────────────── */
  if (loading) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f7ff', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#6366f1" />
    </SafeAreaView>
  );

  if (!product) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f7ff', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <Ionicons name="alert-circle-outline" size={60} color="#d1d5db" />
      <Text style={{ color: '#9ca3af', fontSize: 16, fontWeight: '700' }}>Product not found</Text>
      <TouchableOpacity onPress={() => nav.goBack()} style={{ padding: 10 }}>
        <Text style={{ color: '#6366f1', fontWeight: '700' }}>← Go back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  const imgUri    = getImageUri(product.imagePath);
  const cat       = CATEGORIES.find(c => c.id === product.category);
  const color     = catColor(product.category);
  const inStock   = product.stock === null || product.stock === undefined || product.stock > 0;
  const lowStock  = inStock && product.stock > 0 && product.stock <= 5;
  const lineTotal = (product.price * qty).toFixed(2);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f7ff" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Hero Image ── */}
        <View style={s.heroWrap}>
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={s.heroImg} resizeMode="cover" />
          ) : (
            <View style={[s.heroImg, s.heroPlaceholder, { backgroundColor: color + '18' }]}>
              <Ionicons name="cube-outline" size={90} color={color} />
            </View>
          )}
          {/* Out of stock overlay */}
          {!inStock && (
            <View style={s.soldOverlay}>
              <Text style={s.soldText}>Out of Stock</Text>
            </View>
          )}
        </View>

        {/* ── Detail block ── */}
        <View style={s.body}>
          {/* Category pill */}
          {cat && (
            <View style={[s.catPill, { backgroundColor: color + '18' }]}>
              <Text style={[s.catPillText, { color }]}>{cat.icon} {cat.name}</Text>
            </View>
          )}

          <Text style={s.productName}>{product.name}</Text>
          <Text style={[s.price, { color }]}>LKR {product.price?.toFixed(2)}</Text>

          {/* Stock status badge */}
          <View style={[
            s.stockBadge,
            !inStock ? s.stockOut : lowStock ? s.stockLow : s.stockIn
          ]}>
            <Ionicons
              name="cube-outline"
              size={13}
              color={!inStock ? '#ef4444' : lowStock ? '#d97706' : '#16a34a'}
            />
            <Text style={[
              s.stockText,
              !inStock ? { color: '#ef4444' } : lowStock ? { color: '#d97706' } : { color: '#16a34a' }
            ]}>
              {!inStock
                ? 'Out of Stock'
                : lowStock
                  ? `Only ${product.stock} left — order soon!`
                  : `In Stock${product.stock ? ` (${product.stock} available)` : ''}`
              }
            </Text>
          </View>

          {/* Description */}
          {!!product.description && (
            <View style={s.descBox}>
              <Text style={s.descTitle}>About this product</Text>
              <Text style={s.descText}>{product.description}</Text>
            </View>
          )}

          {/* Qty selector */}
          <View style={s.qtySection}>
            <Text style={s.qtyLabel}>Quantity</Text>
            <View style={s.qtyControls}>
              <TouchableOpacity
                style={[s.qtyBtn, { borderColor: color }, qty <= 1 && s.qtyBtnDisabled]}
                onPress={decQty}
                disabled={qty <= 1}
                activeOpacity={0.8}
              >
                <Ionicons name="remove" size={20} color={qty <= 1 ? '#d1d5db' : color} />
              </TouchableOpacity>
              <Text style={s.qtyNum}>{qty}</Text>
              <TouchableOpacity
                style={[s.qtyBtn, { borderColor: color }]}
                onPress={incQty}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color={color} />
              </TouchableOpacity>
              <View style={[s.totalPill, { backgroundColor: color + '18' }]}>
                <Text style={[s.totalPillText, { color }]}>= LKR {lineTotal}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky Bottom Bar ── */}
      <View style={s.bottomBar}>
        {/* Cart shortcut badge */}
        {totalItems > 0 && (
          <TouchableOpacity style={s.viewCartBtn} onPress={() => nav.navigate('Cart')} activeOpacity={0.8}>
            <Ionicons name="cart" size={22} color="#6366f1" />
            <View style={s.cartBadge}>
              <Text style={s.cartBadgeText}>{totalItems}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Add to cart */}
        <View style={{ flex: 1, gap: 4 }}>
          {!!addErr && (
            <View style={s.errBanner}>
              <Ionicons name="warning-outline" size={14} color="#ef4444" />
              <Text style={s.errText}>{addErr}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[s.addBtn, { backgroundColor: inStock ? color : '#d1d5db' }, !inStock && { shadowOpacity: 0 }]}
            onPress={handleAdd}
            disabled={adding || !inStock}
            activeOpacity={0.88}
          >
            {adding ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name={inStock ? 'cart-outline' : 'ban-outline'} size={20} color="#fff" />
                <Text style={s.addBtnText}>
                  {!inStock ? 'Out of Stock' : `Add ${qty > 1 ? qty + ' × ' : ''}to Cart`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#f8f7ff' },

  /* Hero */
  heroWrap:       { position: 'relative' },
  heroImg:        { width: '100%', height: 300 },
  heroPlaceholder:{ justifyContent: 'center', alignItems: 'center' },
  soldOverlay:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  soldText:       { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 1 },

  /* Body */
  body:           { padding: 20, gap: 12 },
  catPill:        { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  catPillText:    { fontSize: 13, fontWeight: '700' },
  productName:    { fontSize: 26, fontWeight: '900', color: '#1e1b4b', lineHeight: 32 },
  price:          { fontSize: 32, fontWeight: '900' },

  /* Stock */
  stockBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  stockIn:        { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  stockLow:       { backgroundColor: '#fffbeb', borderColor: '#fcd34d' },
  stockOut:       { backgroundColor: '#fef2f2', borderColor: '#fca5a5' },
  stockText:      { fontSize: 13, fontWeight: '700' },

  /* Desc */
  descBox:        { backgroundColor: '#fff', borderRadius: 16, padding: 14 },
  descTitle:      { fontSize: 13, fontWeight: '800', color: '#6b7280', marginBottom: 6 },
  descText:       { fontSize: 15, color: '#374151', lineHeight: 24 },

  /* Qty */
  qtySection:     { gap: 10 },
  qtyLabel:       { fontSize: 15, fontWeight: '800', color: '#1e1b4b' },
  qtyControls:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn:         { width: 38, height: 38, borderRadius: 10, borderWidth: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  qtyBtnDisabled: { borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  qtyNum:         { fontSize: 22, fontWeight: '900', color: '#1e1b4b', minWidth: 32, textAlign: 'center' },
  totalPill:      { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginLeft: 4 },
  totalPillText:  { fontSize: 14, fontWeight: '800' },

  /* Bottom bar */
  bottomBar:      { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 28 : 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 8 },
  viewCartBtn:    { backgroundColor: '#eef2ff', borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: '#c7d2fe', position: 'relative' },
  cartBadge:      { position: 'absolute', top: -5, right: -5, backgroundColor: '#ef4444', borderRadius: 999, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#fff' },
  cartBadgeText:  { color: '#fff', fontSize: 10, fontWeight: '900' },
  errBanner:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fef2f2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  errText:        { color: '#ef4444', fontSize: 12, fontWeight: '700', flex: 1 },
  addBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 15, shadowColor: '#6366f1', shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  addBtnText:     { color: '#fff', fontSize: 16, fontWeight: '900' },
});
