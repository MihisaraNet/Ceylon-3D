/**
 * BrowseScreen.jsx — Product Catalogue / Shop Browser
 *
 * Displays all products in a premium list view with horizontal cards.
 *
 * Features:
 *   - Real-time search filtering by product name
 *   - Category tab filtering (All, Miniatures, Prototypes, Art, Functional, Custom)
 *   - Quick "Add to Cart" button on each card with loading state
 *   - Heart icon for saving favorites
 *   - Premium header with user avatar and personalized greeting
 *   - Pull-to-refresh to reload products from the backend
 *   - Floating Filter/Option button
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
  const [addingId,    setAddingId]    = useState(null);
  const searchRef = useRef(null);

  /* ── Fetch products ────────────────────────────────── */
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

  /* ── Quick add to cart ─────────────────────────────── */
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

  /* ── Filter logic ──────────────────────────────────── */
  const filtered = (products || []).filter(p => {
    const q = (search || '').trim().toLowerCase();
    const nameMatch = !q || (p.name && p.name.toLowerCase().includes(q));
    const catMatch  = !category || p.category === category;
    return nameMatch && catMatch;
  });

  /* ── Render single card ────────────────────────────── */
  const renderCard = ({ item }) => {
    const imgUri   = getImageUri(item.imagePath);
    const catInfo  = CATEGORIES.find(c => c.id === item.category);
    const isAdding = addingId === item._id;
    const inStock  = item.stock === null || item.stock === undefined || item.stock > 0;

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
          {!inStock && (
            <View style={s.soldOutOverlay}>
              <Text style={s.soldOutText}>OUT OF STOCK</Text>
            </View>
          )}
        </View>

        <View style={s.listingBody}>
          <View style={s.listingTop}>
            <Text style={s.listingTitle} numberOfLines={1}>{item.name || 'Unnamed Product'}</Text>
          </View>

          <View style={s.locationRow}>
            <Ionicons name="location-sharp" size={12} color="#64748b" />
            <Text style={s.locationText} numberOfLines={1}>
              {catInfo?.name || 'General'} - Colombo
            </Text>
          </View>

          <View style={s.listingBottom}>
            <View style={s.priceRow}>
              <Text style={s.currencyText}>LKR </Text>
              <Text style={s.priceText}>{item.price?.toLocaleString() || '0'}</Text>
            </View>

            <TouchableOpacity 
              style={[s.miniAddBtn, !inStock && { opacity: 0.5 }]} 
              onPress={() => inStock && handleQuickAdd(item)}
              disabled={!inStock || isAdding}
              activeOpacity={0.6}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="add" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const allCats = [{ id: '', name: 'All', icon: '🛒' }, ...CATEGORIES];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header ── */}
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
              <Ionicons name="chevron-down" size={12} color="#64748b" style={{ marginLeft: 3 }} />
            </View>
            <View style={s.roleBadge}>
              <View style={s.roleDot} />
              <Text style={s.roleText}>{user?.role === 'ROLE_ADMIN' ? 'ADMIN' : 'MEMBER'}</Text>
            </View>
          </View>
        </View>
        
        <View style={s.headerRight}>
          <Text style={s.brandText}>LayerForge</Text>
          <TouchableOpacity style={s.searchIconBtn} onPress={() => searchRef.current?.focus()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="search" size={18} color="#1e293b" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Recent Listings</Text>
        <View style={s.titleUnderline} />
      </View>

      {/* ── Search Bar ── */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#94a3b8" style={{ marginRight: 10 }} />
        <TextInput
          ref={searchRef}
          style={s.searchInput}
          placeholder="What are you looking for?"
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* ── Category Tabs ── */}
      <View style={{ height: 55 }}>
        <FlatList
          horizontal
          data={allCats}
          keyExtractor={i => i.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.catRow}
          renderItem={({ item }) => {
            const active = category === item.id;
            const col    = getCatColor(item.id);
            return (
              <TouchableOpacity
                style={[s.catTab, active && { backgroundColor: col.bg, borderColor: col.bg }]}
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
      </View>

      {/* ── Main List ── */}
      {loading ? (
        <View style={s.centred}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={s.loadText}>Searching catalog...</Text>
        </View>
      ) : error ? (
        <View style={s.centred}>
          <Ionicons name="alert-circle-outline" size={50} color="#ef4444" />
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
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
          }
          renderItem={renderCard}
          ListEmptyComponent={
            <View style={s.centred}>
              <Ionicons name="search-outline" size={60} color="#e2e8f0" />
              <Text style={s.emptyText}>No matches found</Text>
              <Text style={s.emptySub}>Try adjusting your filters</Text>
            </View>
          }
        />
      )}

      {/* ── Floating Action Button ── */}
      <TouchableOpacity style={s.fab} onPress={() => nav.navigate('Cart')}>
        <View style={s.fabBtn}>
          {totalItems > 0 && (
            <View style={s.fabBadge}>
              <Text style={s.fabBadgeText}>{totalItems}</Text>
            </View>
          )}
          <Ionicons name="cart-outline" size={24} color="#fff" />
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: '#f8fafc' },
  
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 10 : 0, paddingBottom: 10 },
  userInfo:           { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:             { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0ea5e9', justifyContent: 'center', alignItems: 'center' },
  avatarText:         { color: '#fff', fontSize: 16, fontWeight: '800' },
  onlineDot:          { position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff' },
  nameRow:            { flexDirection: 'row', alignItems: 'center' },
  greetingText:       { fontSize: 14, color: '#64748b' },
  userNameText:       { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  roleBadge:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f9ff', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10, marginTop: 2 },
  roleDot:            { width: 5, height: 5, borderRadius: 3, backgroundColor: '#0ea5e9', marginRight: 4 },
  roleText:           { fontSize: 9, fontWeight: '800', color: '#0ea5e9' },
  headerRight:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandText:          { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  searchIconBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },

  sectionHeader:      { paddingHorizontal: 20, marginTop: 5, marginBottom: 10 },
  sectionTitle:       { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  titleUnderline:     { width: 30, height: 3, backgroundColor: '#0ea5e9', marginTop: 4, borderRadius: 2 },

  searchWrap:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 15, borderRadius: 12, paddingHorizontal: 12, height: 46, borderWidth: 1, borderColor: '#f1f5f9' },
  searchInput:        { flex: 1, fontSize: 14, color: '#1e293b' },

  catRow:             { paddingHorizontal: 16, paddingVertical: 2, gap: 8 },
  catTab:             { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f1f5f9' },
  catTabText:         { fontSize: 13, fontWeight: '700', color: '#64748b' },

  listContent:        { paddingHorizontal: 20, paddingTop: 5, paddingBottom: 100, gap: 15 },

  listingCard:        { backgroundColor: '#fff', borderRadius: 20, padding: 10, flexDirection: 'row', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardImageContainer: { width: 100, height: 100, borderRadius: 16, overflow: 'hidden', backgroundColor: '#f8fafc' },
  listingImg:         { width: '100%', height: '100%', resizeMode: 'cover' },
  listingImgPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  soldOutOverlay:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' },
  soldOutText:        { fontSize: 10, fontWeight: '900', color: '#ef4444' },
  
  listingBody:        { flex: 1, marginLeft: 12, justifyContent: 'space-between', paddingVertical: 2 },
  listingTop:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listingTitle:       { fontSize: 16, fontWeight: '800', color: '#1e293b', flex: 1, marginRight: 5 },
  locationRow:        { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText:       { fontSize: 12, color: '#64748b' },
  listingBottom:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  priceRow:           { flexDirection: 'row', alignItems: 'baseline' },
  currencyText:       { fontSize: 14, fontWeight: '700', color: '#0ea5e9' },
  priceText:          { fontSize: 16, fontWeight: '900', color: '#0ea5e9' },
  miniAddBtn:         { width: 32, height: 32, borderRadius: 10, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },

  centred:            { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50, gap: 10 },
  loadText:           { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  errText:            { color: '#ef4444', textAlign: 'center', fontSize: 13, paddingHorizontal: 30 },
  retryBtn:           { backgroundColor: '#0ea5e9', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 5 },
  retryText:          { color: '#fff', fontWeight: '700' },
  emptyText:          { fontSize: 16, fontWeight: '800', color: '#cbd5e1' },
  emptySub:           { fontSize: 13, color: '#cbd5e1' },

  fab:                { position: 'absolute', bottom: 20, right: 20 },
  fabBtn:             { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  fabBadge:           { position: 'absolute', top: -4, right: -4, backgroundColor: '#ef4444', borderRadius: 9, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  fabBadgeText:       { color: '#fff', fontSize: 9, fontWeight: '900' },
});
