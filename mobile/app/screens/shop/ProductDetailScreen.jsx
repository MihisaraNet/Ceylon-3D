/**
 * ProductDetailScreen.jsx — Single Product Detail View
 *
 * Displays full details for a single product with add-to-cart functionality.
 * Accessed by tapping a product card in BrowseScreen.
 *
 * Features:
 *   - Large hero image (or placeholder with category-colored icon)
 *   - Category pill badge, product name, and price
 *   - Stock status indicator (In Stock / Low Stock / Out of Stock)
 *   - Product description section
 *   - Quantity selector with +/- buttons and live line total calculation
 *   - Sticky bottom bar with:
 *       - View Cart shortcut (with badge count)
 *       - Add to Cart button (disabled when out of stock)
 *       - Inline error banner for stock/server errors
 *   - Success alert with "Keep Browsing" / "View Cart" options
 *
 * @module screens/shop/ProductDetailScreen
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, SafeAreaView, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { getImageUri } from '../../lib/config';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
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
  const { theme, isDarkMode } = useTheme();
  const s = getStyles(theme);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty,     setQty]     = useState(1);
  const [adding,  setAdding]  = useState(false);
  const [addErr,  setAddErr]  = useState(''); // inline error under button
  const [reviews, setReviews]  = useState([]);
  const [revSummary, setRevSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [revLoading, setRevLoading] = useState(false);

  useEffect(() => {
    setAddErr('');
    (async () => {
      try {
        const { data } = await api.get(`/api/products/${productId}`);
        setProduct(data);
      } catch { } finally { setLoading(false); }
    })();
    // Fetch reviews in parallel
    setRevLoading(true);
    Promise.all([
      api.get(`/reviews/${productId}`).then(r => r.data).catch(() => []),
      api.get(`/reviews/summary/${productId}`).then(r => r.data).catch(() => ({ averageRating: 0, totalReviews: 0 })),
    ]).then(([revs, summ]) => {
      setReviews(revs);
      setRevSummary(summ);
    }).finally(() => setRevLoading(false));
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
  // This function adds the selected quantity of this product to the user's cart
  const handleAdd = async () => {
    // Prevent multiple submissions if it is already adding
    if (adding) return;
    
    // Clear any previous error messages
    setAddErr('');
    setAdding(true);
    
    try {
      // Send the request to the CartContext to handle the API call
      await addToCart(product._id, qty);
      
      // If successful, show an alert with navigation options
      Alert.alert(
        'Added to Cart ✓',
        `${qty} × ${product.name} added successfully.`,
        [
          { text: 'Keep Browsing', style: 'cancel' },
          { text: 'View Cart', onPress: () => nav.navigate('Cart') },
        ]
      );
    } catch (err) {
      // If there's an error (like trying to add more than the available stock), show it below the button
      const msg = err.response?.data?.error || err.message || 'Could not add to cart';
      setAddErr(msg);
    } finally {
      setAdding(false);
    }
  };

  /* ── Loading & not-found states ──────────────────────── */
  if (loading) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={theme.primary} />
    </SafeAreaView>
  );

  if (!product) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <Ionicons name="alert-circle-outline" size={60} color={theme.icon} />
      <Text style={{ color: theme.textSecondary, fontSize: 16, fontWeight: '700' }}>Product not found</Text>
      <TouchableOpacity onPress={() => nav.goBack()} style={{ padding: 10 }}>
        <Text style={{ color: theme.primary, fontWeight: '700' }}>← Go back</Text>
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
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

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
              color={!inStock ? theme.error : lowStock ? theme.warning : theme.success}
            />
            <Text style={[
              s.stockText,
              !inStock ? { color: theme.error } : lowStock ? { color: theme.warning } : { color: theme.success }
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

          {/* ── Customer Reviews ── */}
          <View style={s.revSection}>
            <View style={s.revHeader}>
              <Text style={s.revTitle}>Customer Reviews</Text>
              {revSummary.totalReviews > 0 && (
                <View style={s.revSummaryPill}>
                  <Ionicons name="star" size={13} color="#f59e0b" />
                  <Text style={s.revSummaryText}>
                    {revSummary.averageRating} ({revSummary.totalReviews})
                  </Text>
                </View>
              )}
            </View>

            {revLoading ? (
              <ActivityIndicator color={theme.primary} style={{ marginVertical: 12 }} />
            ) : reviews.length === 0 ? (
              <View style={s.noRevWrap}>
                <Ionicons name="chatbubble-outline" size={32} color="#d1d5db" />
                <Text style={s.noRevText}>No reviews yet. Be the first!</Text>
              </View>
            ) : (
              reviews.map((rv) => (
                <View key={rv._id} style={s.revCard}>
                  <View style={s.revCardTop}>
                    <View style={s.revAvatar}>
                      <Text style={s.revAvatarText}>{(rv.userName || '?')[0].toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.revName}>{rv.userName}</Text>
                      <View style={s.starsRow}>
                        {[1,2,3,4,5].map(n => (
                          <Ionicons
                            key={n}
                            name={n <= rv.rating ? 'star' : 'star-outline'}
                            size={12}
                            color={n <= rv.rating ? '#f59e0b' : theme.icon}
                          />
                        ))}
                      </View>
                    </View>
                    <Text style={s.revDate}>
                      {rv.createdAt ? new Date(rv.createdAt).toLocaleDateString('en-GB', { day:'numeric', month:'short' }) : ''}
                    </Text>
                  </View>
                  {!!rv.comment && <Text style={s.revComment}>{rv.comment}</Text>}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>


      {/* ── Sticky Bottom Bar ── */}
      <View style={s.bottomBar}>
        {/* Cart shortcut badge */}
        {totalItems > 0 && (
          <TouchableOpacity style={s.viewCartBtn} onPress={() => nav.navigate('Cart')} activeOpacity={0.8}>
            <Ionicons name="cart" size={22} color={theme.primary} />
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
            style={[s.addBtn, { backgroundColor: inStock ? color : theme.border }, !inStock && { shadowOpacity: 0 }]}
            onPress={handleAdd}
            disabled={adding || !inStock}
            activeOpacity={0.88}
          >
            {adding ? (
              <ActivityIndicator color={theme.primaryText} />
            ) : (
              <>
                <Ionicons name={inStock ? 'cart-outline' : 'ban-outline'} size={20} color={theme.primaryText} />
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

const getStyles = (t) => StyleSheet.create({
  safe:           { flex: 1, backgroundColor: t.background },

  /* Hero */
  heroWrap:       { position: 'relative' },
  heroImg:        { width: '100%', aspectRatio: 1.1 },
  heroPlaceholder:{ width: '100%', aspectRatio: 1.1, justifyContent: 'center', alignItems: 'center' },
  soldOverlay:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', alignItems: 'center' },
  soldText:       { color: t.primaryText, fontSize: 22, fontWeight: '900', letterSpacing: 1 },

  /* Body */
  body:           { padding: 20, gap: 12 },
  catPill:        { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  catPillText:    { fontSize: 13, fontWeight: '700' },
  productName:    { fontSize: 26, fontWeight: '900', color: t.text, lineHeight: 32 },
  price:          { fontSize: 32, fontWeight: '900' },

  /* Stock */
  stockBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  stockIn:        { backgroundColor: t.success + '10', borderColor: t.success + '40' },
  stockLow:       { backgroundColor: t.accent + '10', borderColor: t.accent + '40' },
  stockOut:       { backgroundColor: t.error + '10', borderColor: t.error + '40' },
  stockText:      { fontSize: 13, fontWeight: '700' },

  /* Desc */
  descBox:        { backgroundColor: t.card, borderRadius: 16, padding: 14 },
  descTitle:      { fontSize: 13, fontWeight: '800', color: t.textSecondary, marginBottom: 6 },
  descText:       { fontSize: 15, color: t.text, lineHeight: 24 },

  /* Qty */
  qtySection:     { gap: 10 },
  qtyLabel:       { fontSize: 15, fontWeight: '800', color: t.text },
  qtyControls:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn:         { width: 38, height: 38, borderRadius: 10, borderWidth: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: t.card },
  qtyBtnDisabled: { borderColor: t.border, backgroundColor: t.background },
  qtyNum:         { fontSize: 22, fontWeight: '900', color: t.text, minWidth: 32, textAlign: 'center' },
  totalPill:      { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginLeft: 4 },
  totalPillText:  { fontSize: 14, fontWeight: '800' },

  /* Bottom bar */
  bottomBar:      { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: t.card, flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 28 : 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.border, shadowColor: '#1a1a1a', shadowOpacity: 0.08, shadowRadius: 10, elevation: 8 },
  viewCartBtn:    { backgroundColor: t.glassBg, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: t.glassBorder, position: 'relative' },
  cartBadge:      { position: 'absolute', top: -5, right: -5, backgroundColor: t.error, borderRadius: 999, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: t.card },
  cartBadgeText:  { color: t.primaryText, fontSize: 10, fontWeight: '900' },
  errBanner:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: t.error + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  errText:        { color: t.error, fontSize: 12, fontWeight: '700', flex: 1 },
  addBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 15, shadowColor: t.primary, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  addBtnText:     { color: t.primaryText, fontSize: 16, fontWeight: '900' },

  /* Reviews */
  revSection:     { marginTop: 10, gap: 16 },
  revHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  revTitle:       { fontSize: 18, fontWeight: '900', color: t.text },
  revSummaryPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: t.glassBg, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: t.glassBorder },
  revSummaryText: { fontSize: 13, fontWeight: '800', color: t.text },
  noRevWrap:      { alignItems: 'center', paddingVertical: 30, gap: 8 },
  noRevText:      { color: t.icon, fontSize: 14, fontWeight: '600' },
  revCard:        { backgroundColor: t.card, borderRadius: 16, padding: 14, gap: 8, shadowColor: '#1a1a1a', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  revCardTop:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  revAvatar:      { width: 32, height: 32, borderRadius: 16, backgroundColor: t.glassBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: t.glassBorder },
  revAvatarText:  { color: t.primary, fontSize: 14, fontWeight: '800' },
  revName:        { fontSize: 14, fontWeight: '800', color: t.text },
  starsRow:       { flexDirection: 'row', gap: 1, marginTop: 1 },
  revDate:        { fontSize: 11, color: t.textSecondary, fontWeight: '600' },
  revComment:     { fontSize: 14, color: t.text, lineHeight: 20 },
});
