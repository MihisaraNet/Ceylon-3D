import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, RefreshControl,
  StatusBar, Platform, Animated, Alert, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { getImageUri } from '../../lib/config';
import { CATEGORIES } from '../../data/categories';
import { useCart } from '../../context/CartContext';

/* ── Category accent colours ───────────────────────────── */
const CAT_COLORS = {
  '':           { bg: '#6366f1', light: '#eef2ff', text: '#4338ca' },
  miniatures:   { bg: '#ec4899', light: '#fdf2f8', text: '#be185d' },
  prototypes:   { bg: '#f59e0b', light: '#fffbeb', text: '#b45309' },
  art:          { bg: '#10b981', light: '#ecfdf5', text: '#065f46' },
  functional:   { bg: '#3b82f6', light: '#eff6ff', text: '#1d4ed8' },
  custom:       { bg: '#8b5cf6', light: '#f5f3ff', text: '#5b21b6' },
};

const getCatColor = (id) => CAT_COLORS[id] || CAT_COLORS['custom'];

/* ── Small helpers ─────────────────────────────────────── */
const CARD_BG_CYCLE = ['#fff7ed','#f0fdf4','#eff6ff','#fdf4ff','#fefce8','#f0f9ff'];
const cardBg = (index) => CARD_BG_CYCLE[index % CARD_BG_CYCLE.length];

export default function BrowseScreen() {
  const nav = useNavigation();
  const { totalItems, addToCart } = useCart();

  const [products,    setProducts]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');
  const [category,    setCategory]    = useState('');
  const [addingId,    setAddingId]    = useState(null); // tracks which card is adding

  /* ── FAB bounce animation ──────────────────────────── */
  const fabScale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(fabScale, {
      toValue: totalItems > 0 ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();
  }, [totalItems]);

  /* ── Fetch products ────────────────────────────────── */
  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/products');
      setProducts(data);
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Quick add to cart ─────────────────────────────── */
  const handleQuickAdd = useCallback(async (item) => {
    if (addingId) return; // prevent double-tap
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

  /* ── Filter ────────────────────────────────────────── */
  const filtered = products.filter(p => {
    const q = search.trim().toLowerCase();
    return (!q || p.name.toLowerCase().includes(q)) &&
           (!category || p.category === category);
  });

  /* ── Render single card ────────────────────────────── */
  const renderCard = ({ item, index }) => {
    const imgUri   = getImageUri(item.imagePath);
    const catInfo  = CATEGORIES.find(c => c.id === item.category);
    const cat      = getCatColor(item.category || '');
    const inStock  = item.stock === null || item.stock === undefined || item.stock > 0;
    const isAdding = addingId === item._id;

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        style={[s.card, { backgroundColor: cardBg(index) }]}
        onPress={() => nav.navigate('ProductDetail', { productId: item._id })}
      >
        {/* ── Image ── */}
        <View style={s.imgWrap}>
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={s.cardImg} resizeMode="cover" />
          ) : (
            <View style={[s.cardImg, s.imgPlaceholder, { backgroundColor: cat.light }]}>
              <Ionicons name="cube-outline" size={48} color={cat.bg} />
            </View>
          )}
          {/* Out of stock */}
          {!inStock && (
            <View style={s.soldOutBadge}>
              <Text style={s.soldOutText}>Sold Out</Text>
            </View>
          )}
          {/* Low stock */}
          {inStock && item.stock > 0 && item.stock <= 5 && (
            <View style={s.lowStockBadge}>
              <Text style={s.lowStockText}>Only {item.stock} left</Text>
            </View>
          )}
        </View>

        {/* ── Body ── */}
        <View style={s.cardBody}>
          {/* Category pill */}
          {catInfo && (
            <View style={[s.catPill, { backgroundColor: cat.light }]}>
              <Text style={[s.catPillText, { color: cat.text }]}>{catInfo.icon} {catInfo.name}</Text>
            </View>
          )}
          <Text style={s.cardName} numberOfLines={2}>{item.name}</Text>
          <Text style={s.cardPrice}>LKR {item.price?.toFixed(2)}</Text>

          {/* Add button */}
          <TouchableOpacity
            style={[s.addBtn, { backgroundColor: inStock ? cat.bg : '#d1d5db' }]}
            disabled={!inStock || !!addingId}
            onPress={() => handleQuickAdd(item)}
            activeOpacity={0.8}
          >
            {isAdding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="cart-outline" size={14} color="#fff" />
                <Text style={s.addBtnText}>{inStock ? 'Add to Cart' : 'Sold Out'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  /* ── All categories tab data ───────────────────────── */
  const allCats = [{ id: '', name: 'All', icon: '🛒' }, ...CATEGORIES];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f7ff" />

      {/* ── Top Bar ── */}
      <View style={s.topBar}>
        <View style={s.topBarLeft}>
          <Text style={s.pageTitle}>Explore</Text>
          <Text style={s.pageSubTitle}>{filtered.length} products</Text>
        </View>
        {/* Cart shortcut */}
        <TouchableOpacity
          style={s.cartChip}
          onPress={() => nav.navigate('Cart')}
          activeOpacity={0.8}
        >
          <Ionicons name="cart" size={20} color="#6366f1" />
          {totalItems > 0 && (
            <View style={s.cartChipBadge}>
              <Text style={s.cartChipBadgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
        <TextInput
          style={s.searchInput}
          placeholder="Search products…"
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
            <Ionicons name="close-circle" size={18} color="#d1d5db" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Category Tabs ── */}
      <FlatList
        horizontal
        data={allCats}
        keyExtractor={i => i.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.catRow}
        style={{ maxHeight: 52, flexGrow: 0 }}
        renderItem={({ item }) => {
          const active = category === item.id;
          const col    = getCatColor(item.id);
          return (
            <TouchableOpacity
              style={[s.catTab, active && { backgroundColor: col.bg }]}
              onPress={() => setCategory(item.id)}
              activeOpacity={0.8}
            >
              <Text style={[s.catTabText, active && { color: '#fff' }]}>
                {item.icon} {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* ── Content ── */}
      {loading ? (
        <View style={s.centred}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={s.loadText}>Loading products…</Text>
        </View>
      ) : error ? (
        <View style={s.centred}>
          <Ionicons name="cloud-offline-outline" size={60} color="#d1d5db" />
          <Text style={s.errText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => load()}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i._id}
          numColumns={2}
          columnWrapperStyle={s.gridRow}
          contentContainerStyle={s.gridContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              colors={['#6366f1']}
              tintColor="#6366f1"
            />
          }
          renderItem={renderCard}
          ListEmptyComponent={
            <View style={s.centred}>
              <Ionicons name="search-outline" size={60} color="#d1d5db" />
              <Text style={s.emptyText}>No products found</Text>
              <Text style={s.emptySub}>Try a different search or category</Text>
            </View>
          }
        />
      )}

      {/* ── Floating View Cart button ── */}
      <Animated.View style={[s.fab, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={s.fabBtn}
          onPress={() => nav.navigate('Cart')}
          activeOpacity={0.88}
        >
          <View style={s.fabBadge}>
            <Text style={s.fabBadgeText}>{totalItems}</Text>
          </View>
          <Ionicons name="cart" size={20} color="#fff" />
          <Text style={s.fabText}>View Cart</Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#f8f7ff' },

  /* Top bar */
  topBar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 12 : 4, paddingBottom: 4 },
  topBarLeft:    { gap: 1 },
  pageTitle:     { fontSize: 28, fontWeight: '900', color: '#1e1b4b', letterSpacing: -0.5 },
  pageSubTitle:  { fontSize: 13, color: '#9ca3af', fontWeight: '600' },
  cartChip:      { backgroundColor: '#eef2ff', borderRadius: 14, padding: 10, borderWidth: 1.5, borderColor: '#c7d2fe', position: 'relative' },
  cartChipBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#ef4444', borderRadius: 999, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#fff' },
  cartChipBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },

  /* Search */
  searchWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 10, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 2, borderWidth: 1.5, borderColor: '#e5e7eb', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  searchInput:   { flex: 1, height: 44, fontSize: 15, color: '#1e1b4b' },

  /* Category tabs */
  catRow:        { paddingHorizontal: 14, paddingVertical: 6, gap: 8 },
  catTab:        { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb' },
  catTabText:    { fontSize: 13, fontWeight: '700', color: '#6b7280' },

  /* Grid */
  gridRow:       { gap: 12, paddingHorizontal: 16 },
  gridContent:   { paddingTop: 12, paddingBottom: 110, gap: 12 },

  /* Card */
  card:          { flex: 1, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  imgWrap:       { position: 'relative' },
  cardImg:       { width: '100%', aspectRatio: 1 },
  imgPlaceholder:{ justifyContent: 'center', alignItems: 'center' },
  soldOutBadge:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  soldOutText:   { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  lowStockBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#fef3c7', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  lowStockText:  { color: '#92400e', fontSize: 10, fontWeight: '800' },
  cardBody:      { padding: 10, gap: 5 },
  catPill:       { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  catPillText:   { fontSize: 10, fontWeight: '700' },
  cardName:      { fontSize: 13, fontWeight: '800', color: '#1e1b4b', lineHeight: 18 },
  cardPrice:     { fontSize: 15, fontWeight: '900', color: '#6366f1' },
  addBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 10, paddingVertical: 8, gap: 5, marginTop: 2 },
  addBtnText:    { color: '#fff', fontSize: 12, fontWeight: '800' },

  /* States */
  centred:       { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 10 },
  loadText:      { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
  errText:       { color: '#ef4444', textAlign: 'center', fontSize: 14, paddingHorizontal: 30 },
  retryBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#6366f1', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  retryText:     { color: '#fff', fontWeight: '700' },
  emptyText:     { fontSize: 17, fontWeight: '800', color: '#6b7280' },
  emptySub:      { fontSize: 13, color: '#9ca3af' },

  /* FAB */
  fab:           { position: 'absolute', bottom: 24, alignSelf: 'center', left: 0, right: 0, alignItems: 'center' },
  fabBtn:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f46e5', borderRadius: 999, paddingHorizontal: 22, paddingVertical: 13, gap: 8, shadowColor: '#6366f1', shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 10 },
  fabBadge:      { backgroundColor: '#fff', borderRadius: 999, minWidth: 22, height: 22, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  fabBadgeText:  { fontSize: 12, fontWeight: '900', color: '#4f46e5' },
  fabText:       { color: '#fff', fontSize: 15, fontWeight: '800' },
});
