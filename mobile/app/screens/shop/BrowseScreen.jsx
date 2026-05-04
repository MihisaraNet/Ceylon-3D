/**
 * BrowseScreen.jsx — Product Catalogue / Shop Browser
 *
 * Displays all products in a responsive 2-column grid with rich card designs.
 *
 * Features:
 *   - Real-time search filtering by product name
 *   - Category tab filtering (All, Miniatures, Prototypes, Art, Functional, Custom)
 *   - Quick "Add to Cart" button on each card with loading state
 *   - Stock indicators: "Sold Out" overlay, "Only X left" low-stock badge
 *   - Pull-to-refresh to reload products from the backend
 *   - Floating "View Cart" button with item count (animated spring entrance)
 *   - Category-specific accent colors for visual distinction
 *   - Tap any card to navigate to ProductDetailScreen
 *
 * @module screens/shop/BrowseScreen
 */
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
import { useAuth } from '../../context/AuthContext';

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
  const { user } = useAuth();

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
  // This function allows users to instantly add 1 unit of a product from the grid view
  const handleQuickAdd = useCallback(async (item) => {
    // If this specific item is already being added, ignore extra taps
    if (addingId) return; 
    
    // Set the addingId to show a loading spinner on this specific card
    setAddingId(item._id);
    
    try {
      // Send the request to add 1 unit to the cart
      await addToCart(item._id, 1);
    } catch (err) {
      // If it fails (e.g., out of stock), alert the user
      const msg = err.response?.data?.error || err.message || 'Could not add to cart';
      Alert.alert('Cannot Add', msg);
    } finally {
      // Always remove the loading spinner when done
      setAddingId(null);
    }
  }, [addToCart, addingId]);

  /* ── Filter ────────────────────────────────────────── */
  // This part calculates which products should be visible based on the search bar and category tabs
  const filtered = products.filter(p => {
    const q = search.trim().toLowerCase();
    
    // Only include products that match BOTH the search query (if typed) AND the selected category (if chosen)
    return (!q || p.name.toLowerCase().includes(q)) &&
           (!category || p.category === category);
  });

  /* ── Render single card ────────────────────────────── */
  const renderCard = ({ item, index }) => {
    const imgUri   = getImageUri(item.imagePath);
    const catInfo  = CATEGORIES.find(c => c.id === item.category);
    const isAdding = addingId === item._id;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={s.listingCard}
        onPress={() => nav.navigate('ProductDetail', { productId: item._id })}
      >
        <View style={s.cardImageContainer}>
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={s.listingImg} />
          ) : (
            <View style={s.listingImgPlaceholder}>
              <Ionicons name="cube-outline" size={40} color="#cbd5e1" />
            </View>
          )}
        </View>

        <View style={s.listingBody}>
          <View style={s.listingTop}>
            <Text style={s.listingTitle} numberOfLines={1}>{item.name}</Text>
            <TouchableOpacity hitSlop={{ top:10, bottom:10, left:10, right:10 }}>
              <Ionicons name="heart-outline" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={s.locationRow}>
            <Ionicons name="location-sharp" size={14} color="#64748b" />
            <Text style={s.locationText} numberOfLines={1}>
              {catInfo?.name || 'General'} Listing • Colombo
            </Text>
          </View>

          <View style={s.listingBottom}>
            <View style={s.priceRow}>
              <Text style={s.currencyText}>LKR </Text>
              <Text style={s.priceText}>{item.price?.toLocaleString()}</Text>
              <Text style={s.unitText}>/unit</Text>
            </View>

            <View style={s.specIcons}>
              <View style={s.specItem}>
                <Ionicons name="cube-outline" size={14} color="#1e293b" />
                <Text style={s.specText}>1</Text>
              </View>
              <View style={s.specItem}>
                <Ionicons name="shield-checkmark-outline" size={14} color="#1e293b" />
                <Text style={s.specText}>High</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Add overlay or floating button could go here, but matching screenshot exactly */}
      </TouchableOpacity>
    );
  };

  /* ── All categories tab data ───────────────────────── */
  const allCats = [{ id: '', name: 'All', icon: '🛒' }, ...CATEGORIES];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f7ff" />

      {/* ── Top Bar ── */}
      <View style={s.header}>
        <View style={s.userInfo}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user?.fullName?.[0] || 'U'}</Text>
            <View style={s.onlineDot} />
          </View>
          <View>
            <View style={s.nameRow}>
              <Text style={s.greetingText}>Hi, </Text>
              <Text style={s.userNameText}>{user?.fullName?.split(' ')[0] || 'Guest'}</Text>
              <Ionicons name="chevron-down" size={14} color="#64748b" style={{ marginLeft: 4 }} />
            </View>
            <View style={s.roleBadge}>
              <View style={s.roleDot} />
              <Text style={s.roleText}>{user?.role === 'ROLE_ADMIN' ? 'ADMIN' : 'MEMBER'}</Text>
            </View>
          </View>
        </View>
        
        <View style={s.headerRight}>
          <Text style={s.brandText}>LayerForge</Text>
          <TouchableOpacity style={s.searchIconBtn}>
            <Ionicons name="search" size={20} color="#1e293b" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Recent Listings</Text>
        <View style={s.titleUnderline} />
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
          numColumns={1}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              colors={['#0891b2']}
              tintColor="#0891b2"
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

      {/* ── Floating Filter Button ── */}
      <TouchableOpacity style={s.fab} onPress={() => { /* Filter logic */ }}>
        <View style={s.fabBtn}>
          {totalItems > 0 && (
            <View style={s.fabBadge}>
              <Text style={s.fabBadgeText}>{totalItems}</Text>
            </View>
          )}
          <Ionicons name="options-outline" size={24} color="#fff" />
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: '#f8fafc' },
  
  /* Header Styles */
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 15 : 5, paddingBottom: 15 },
  userInfo:           { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:             { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0ea5e9', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  avatarText:         { color: '#fff', fontSize: 18, fontWeight: '800' },
  onlineDot:          { position: 'absolute', top: 2, right: 2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff' },
  nameRow:            { flexDirection: 'row', alignItems: 'center' },
  greetingText:       { fontSize: 16, color: '#64748b' },
  userNameText:       { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  roleBadge:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginTop: 4, alignSelf: 'flex-start' },
  roleDot:            { width: 6, height: 6, borderRadius: 3, backgroundColor: '#0ea5e9', marginRight: 5 },
  roleText:           { fontSize: 10, fontWeight: '800', color: '#0ea5e9', letterSpacing: 0.5 },
  headerRight:        { flexDirection: 'row', alignItems: 'center', gap: 15 },
  brandText:          { fontSize: 20, fontWeight: '900', color: '#1e293b', letterSpacing: -0.5 },
  searchIconBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },

  /* Section Header */
  sectionHeader:      { paddingHorizontal: 20, marginTop: 10, marginBottom: 15 },
  sectionTitle:       { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  titleUnderline:     { width: 35, height: 4, backgroundColor: '#0369a1', marginTop: 6, borderRadius: 2 },

  /* Search */
  searchWrap:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 15, borderRadius: 16, paddingHorizontal: 15, height: 50, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  searchInput:        { flex: 1, fontSize: 15, color: '#1e293b' },

  /* Category tabs */
  catRow:             { paddingHorizontal: 16, paddingVertical: 4, gap: 10 },
  catTab:             { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f1f5f9' },
  catTabText:         { fontSize: 14, fontWeight: '700', color: '#64748b' },

  /* List */
  listContent:        { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100, gap: 18 },

  /* Listing Card */
  listingCard:        { backgroundColor: '#fff', borderRadius: 24, padding: 12, flexDirection: 'row', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 },
  cardImageContainer: { width: 110, height: 110, borderRadius: 20, overflow: 'hidden' },
  listingImg:         { width: '100%', height: '100%', resizeMode: 'cover' },
  listingImgPlaceholder: { width: '100%', height: '100%', backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  listingBody:        { flex: 1, marginLeft: 15, justifyContent: 'space-between', paddingVertical: 2 },
  listingTop:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listingTitle:       { fontSize: 17, fontWeight: '800', color: '#1e293b', flex: 1, marginRight: 8 },
  locationRow:        { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  locationText:       { fontSize: 13, color: '#64748b', fontWeight: '500' },
  listingBottom:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  priceRow:           { flexDirection: 'row', alignItems: 'baseline' },
  currencyText:       { fontSize: 16, fontWeight: '800', color: '#0891b2' },
  priceText:          { fontSize: 18, fontWeight: '900', color: '#0891b2' },
  unitText:           { fontSize: 12, color: '#64748b', fontWeight: '600' },
  specIcons:          { flexDirection: 'row', gap: 12 },
  specItem:           { flexDirection: 'row', alignItems: 'center', gap: 4 },
  specText:           { fontSize: 12, fontWeight: '700', color: '#1e293b' },

  /* States */
  centred:            { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, gap: 12 },
  loadText:           { color: '#94a3b8', fontSize: 15, fontWeight: '600' },
  errText:            { color: '#ef4444', textAlign: 'center', fontSize: 14, paddingHorizontal: 40 },
  retryBtn:           { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0ea5e9', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12, marginTop: 5 },
  retryText:          { color: '#fff', fontWeight: '700' },
  emptyText:          { fontSize: 18, fontWeight: '800', color: '#64748b' },
  emptySub:           { fontSize: 14, color: '#94a3b8' },

  /* FAB */
  fab:                { position: 'absolute', bottom: 30, right: 20 },
  fabBtn:             { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  fabBadge:           { position: 'absolute', top: -5, right: -5, backgroundColor: '#ef4444', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: '#fff' },
  fabBadgeText:       { color: '#fff', fontSize: 10, fontWeight: '900' },
});
