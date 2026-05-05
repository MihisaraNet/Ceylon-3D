/**
 * BrowseScreen.jsx — Product Catalogue / Shop Browser
 *
 * Displays all 3D-printed products in a clean list view.
 * Card layout inspired by property listing UIs:
 *   – Large left image  |  name, category, price, stock on right
 * No wishlist / heart icon.
 *
 * Features:
 *   - Real-time search filtering by product name
 *   - Category tab filtering
 *   - Quick "Add to Cart" button with loading state
 *   - Premium header with user avatar and greeting
 *   - Pull-to-refresh
 *   - Floating Cart FAB
 *
 * @module screens/shop/BrowseScreen
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, RefreshControl,
  StatusBar, Platform, Alert, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { getImageUri } from '../../lib/config';
import { CATEGORIES } from '../../data/categories';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

/* ── Category colours ─────────────────────────────────────── */
const CAT_COLORS = {
  '':           { bg: '#6366f1', pill: '#eef2ff', pillText: '#4338ca' },
  miniatures:   { bg: '#ec4899', pill: '#fdf2f8', pillText: '#be185d' },
  prototypes:   { bg: '#f59e0b', pill: '#fffbeb', pillText: '#b45309' },
  art:          { bg: '#10b981', pill: '#ecfdf5', pillText: '#065f46' },
  functional:   { bg: '#3b82f6', pill: '#eff6ff', pillText: '#1d4ed8' },
  custom:       { bg: '#8b5cf6', pill: '#f5f3ff', pillText: '#5b21b6' },
};
const getCatColor = (id) => CAT_COLORS[id] || CAT_COLORS['custom'];

/* ── ProductCard — extracted as a proper component so useState is legal ── */
function ProductCard({ item, onPress, onAddToCart, isAdding }) {
  const [imgErr, setImgErr] = useState(false);
  const imgUri  = getImageUri(item.imagePath);
  const catInfo = CATEGORIES.find(c => c.id === item.category);
  const catCol  = getCatColor(item.category || '');
  const inStock = item.stock === null || item.stock === undefined || item.stock > 0;
  const stockQty = item.stock != null ? item.stock : null;

  return (
    <TouchableOpacity activeOpacity={0.88} style={s.card} onPress={onPress}>
      {/* ── Left: product image ── */}
      <View style={s.imgWrap}>
        {imgUri && !imgErr ? (
          <Image
            source={{ uri: imgUri }}
            style={s.img}
            onError={() => setImgErr(true)}
          />
        ) : (
          <View style={[s.imgPlaceholder, { backgroundColor: catCol.pill }]}>
            <Text style={s.imgEmoji}>{catInfo?.icon || '📦'}</Text>
          </View>
        )}

        {/* Out-of-stock overlay */}
        {!inStock && (
          <View style={s.outOverlay}>
            <Text style={s.outText}>OUT OF{'\n'}STOCK</Text>
          </View>
        )}

        {/* Category colour strip at the bottom of image */}
        <View style={[s.imgStrip, { backgroundColor: catCol.bg }]} />
      </View>

      {/* ── Right: details ── */}
      <View style={s.cardBody}>

        {/* Category pill */}
        <View style={[s.catPill, { backgroundColor: catCol.pill }]}>
          <Text style={[s.catPillText, { color: catCol.pillText }]}>
            {catInfo?.icon}  {catInfo?.name || 'Custom'}
          </Text>
        </View>

        {/* Product name */}
        <Text style={s.productName} numberOfLines={2}>
          {item.name || 'Unnamed Product'}
        </Text>

        {/* Description preview */}
        {!!item.description && (
          <Text style={s.descText} numberOfLines={1}>
            {item.description}
          </Text>
        )}

        {/* Price */}
        <Text style={s.priceLabel}>
          LKR{' '}
          <Text style={s.priceValue}>
            {item.price?.toLocaleString() || '0'}
          </Text>
        </Text>

        {/* Bottom row: stock chip + add button */}
        <View style={s.bottomRow}>
          {/* Stock indicator */}
          <View style={[s.stockChip, !inStock && { backgroundColor: '#fee2e2' }]}>
            <View style={[s.stockDot, { backgroundColor: inStock ? '#22c55e' : '#ef4444' }]} />
            <Text style={[s.stockText, !inStock && { color: '#ef4444' }]}>
              {inStock
                ? stockQty != null ? `${stockQty} in stock` : 'In Stock'
                : 'Out of Stock'
              }
            </Text>
          </View>

          {/* Add to cart */}
          <TouchableOpacity
            style={[s.addBtn, !inStock && s.addBtnDisabled]}
            onPress={onAddToCart}
            disabled={!inStock || isAdding}
            activeOpacity={0.75}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isAdding
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="cart-outline" size={16} color="#fff" />
            }
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function BrowseScreen() {
  const nav = useNavigation();
  const { totalItems, addToCart } = useCart();
  const { user } = useAuth();

  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [category,   setCategory]   = useState('');
  const [addingId,   setAddingId]   = useState(null);
  const searchRef = useRef(null);

  /* ── Fetch products ─────────────────────────────────────── */
  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/products');
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Quick add to cart ──────────────────────────────────── */
  const handleQuickAdd = useCallback(async (item) => {
    if (addingId) return;
    setAddingId(item._id);
    try {
      await addToCart(item._id, 1);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Could not add to cart';
      Alert.alert('Cannot Add', msg);
    } finally {
      setAddingId(null);
    }
  }, [addToCart, addingId]);

  /* ── Filter ─────────────────────────────────────────────── */
  const filtered = (products || []).filter(p => {
    const q = (search || '').trim().toLowerCase();
    const nameMatch = !q || (p.name && p.name.toLowerCase().includes(q));
    const catMatch  = !category || p.category === category;
    return nameMatch && catMatch;
  });

  /* ── Render item for FlatList ───────────────────────────── */
  const renderCard = ({ item }) => (
    <ProductCard
      item={item}
      onPress={() => nav.navigate('ProductDetail', { productId: item._id })}
      onAddToCart={() => handleQuickAdd(item)}
      isAdding={addingId === item._id}
    />
  );

  const allCats = [{ id: '', name: 'All', icon: '🗂️' }, ...CATEGORIES];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f1f5f9" />

      {/* ══ Header ══ */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user?.fullName?.[0]?.toUpperCase() || 'U'}</Text>
            <View style={s.onlineDot} />
          </View>
          <View>
            <View style={s.nameRow}>
              <Text style={s.greetText}>Hi, </Text>
              <Text style={s.greetName}>{user?.fullName?.split(' ')[0] || 'Guest'} 👋</Text>
            </View>
            <Text style={s.greetSub}>Browse our 3D prints</Text>
          </View>
        </View>

        <View style={s.headerRight}>
          <TouchableOpacity
            style={s.cartIconBtn}
            onPress={() => nav.navigate('Cart')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="cart-outline" size={22} color="#1e293b" />
            {totalItems > 0 && (
              <View style={s.cartBadge}>
                <Text style={s.cartBadgeText}>{totalItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ══ Brand strip ══ */}
      <View style={s.brandStrip}>
        <Text style={s.brandName}>LayerForge</Text>
        <Text style={s.brandTag}>3D Print Shop</Text>
      </View>

      {/* ══ Search bar ══ */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#94a3b8" />
        <TextInput
          ref={searchRef}
          style={s.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color="#cbd5e1" />
          </TouchableOpacity>
        )}
      </View>

      {/* ══ Category tabs ══ */}
      <View style={{ height: 50 }}>
        <FlatList
          horizontal
          data={allCats}
          keyExtractor={i => i.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.catRow}
          renderItem={({ item: cat }) => {
            const active = category === cat.id;
            const col    = getCatColor(cat.id);
            return (
              <TouchableOpacity
                style={[s.catTab, active && { backgroundColor: col.bg, borderColor: col.bg }]}
                onPress={() => setCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Text style={[s.catTabText, active && { color: '#fff' }]}>
                  {cat.icon}  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ══ Result count ══ */}
      {!loading && !error && (
        <View style={s.resultRow}>
          <Text style={s.resultText}>
            {filtered.length} product{filtered.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      {/* ══ Main list ══ */}
      {loading ? (
        <View style={s.centred}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={s.loadText}>Loading catalog…</Text>
        </View>
      ) : error ? (
        <View style={s.centred}>
          <Ionicons name="cloud-offline-outline" size={54} color="#fca5a5" />
          <Text style={s.errText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => load()}>
            <Text style={s.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i._id}
          numColumns={1}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor="#6366f1"
            />
          }
          renderItem={renderCard}
          ListEmptyComponent={
            <View style={s.centred}>
              <Text style={{ fontSize: 48 }}>🔍</Text>
              <Text style={s.emptyTitle}>No products found</Text>
              <Text style={s.emptySub}>Try a different search or category</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },

  /* ── Header ── */
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: Platform.OS === 'android' ? 12 : 4, paddingBottom: 8 },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:       { width: 42, height: 42, borderRadius: 21, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' },
  avatarText:   { color: '#fff', fontSize: 17, fontWeight: '900' },
  onlineDot:    { position: 'absolute', top: 1, right: 1, width: 11, height: 11, borderRadius: 6, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#f1f5f9' },
  nameRow:      { flexDirection: 'row', alignItems: 'center' },
  greetText:    { fontSize: 14, color: '#64748b' },
  greetName:    { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  greetSub:     { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  headerRight:  { position: 'relative' },
  cartIconBtn:  { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cartBadge:    { position: 'absolute', top: -3, right: -3, backgroundColor: '#ef4444', borderRadius: 8, minWidth: 17, height: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#f1f5f9' },
  cartBadgeText:{ color: '#fff', fontSize: 9, fontWeight: '900' },

  /* ── Brand strip ── */
  brandStrip:   { flexDirection: 'row', alignItems: 'baseline', gap: 6, paddingHorizontal: 18, marginBottom: 12 },
  brandName:    { fontSize: 26, fontWeight: '900', color: '#1e293b' },
  brandTag:     { fontSize: 13, color: '#6366f1', fontWeight: '700' },

  /* ── Search ── */
  searchWrap:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', marginHorizontal: 18, marginBottom: 12, borderRadius: 14, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  searchInput:  { flex: 1, fontSize: 14, color: '#1e293b' },

  /* ── Category tabs ── */
  catRow:       { paddingHorizontal: 14, paddingVertical: 6, gap: 8, alignItems: 'center' },
  catTab:       { borderRadius: 20, paddingHorizontal: 13, paddingVertical: 6, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0' },
  catTabText:   { fontSize: 12, fontWeight: '700', color: '#64748b' },

  /* ── Result row ── */
  resultRow:    { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 4 },
  resultText:   { fontSize: 12, color: '#94a3b8', fontWeight: '600' },

  /* ── List ── */
  listContent:  { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 30, gap: 14 },

  /* ─────────────── CARD ─────────────── */
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#1e293b',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  /* Left image block */
  imgWrap:      { width: 120, height: 140 },
  img:          { width: 120, height: 140, resizeMode: 'cover' },
  imgPlaceholder:{ width: 120, height: 140, justifyContent: 'center', alignItems: 'center' },
  imgEmoji:     { fontSize: 40 },
  outOverlay:   { position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'center', alignItems: 'center' },
  outText:      { color: '#fff', fontSize: 11, fontWeight: '900', textAlign: 'center', lineHeight: 16 },
  imgStrip:     { position: 'absolute', bottom: 0, left: 0, right: 0, height: 4 },

  /* Right body */
  cardBody:     { flex: 1, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14, gap: 5 },

  /* Category pill */
  catPill:      { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  catPillText:  { fontSize: 11, fontWeight: '800' },

  /* Name */
  productName:  { fontSize: 15, fontWeight: '800', color: '#0f172a', lineHeight: 21, marginTop: 2 },

  /* Description */
  descText:     { fontSize: 12, color: '#94a3b8', lineHeight: 16 },

  /* Price */
  priceLabel:   { fontSize: 13, fontWeight: '700', color: '#6366f1', marginTop: 2 },
  priceValue:   { fontSize: 19, fontWeight: '900', color: '#6366f1' },

  /* Bottom row */
  bottomRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },

  /* Stock chip */
  stockChip:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0fdf4', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  stockDot:     { width: 6, height: 6, borderRadius: 3 },
  stockText:    { fontSize: 11, fontWeight: '700', color: '#16a34a' },

  /* Add button */
  addBtn:       { width: 34, height: 34, borderRadius: 10, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' },
  addBtnDisabled:{ backgroundColor: '#cbd5e1' },

  /* ── States ── */
  centred:      { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, gap: 10 },
  loadText:     { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  errText:      { color: '#ef4444', textAlign: 'center', fontSize: 13, paddingHorizontal: 30 },
  retryBtn:     { backgroundColor: '#6366f1', paddingHorizontal: 22, paddingVertical: 10, borderRadius: 12, marginTop: 6 },
  retryText:    { color: '#fff', fontWeight: '700', fontSize: 13 },
  emptyTitle:   { fontSize: 16, fontWeight: '800', color: '#cbd5e1' },
  emptySub:     { fontSize: 13, color: '#cbd5e1' },
});
