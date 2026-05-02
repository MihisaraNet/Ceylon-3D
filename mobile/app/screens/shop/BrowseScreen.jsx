/**
 * BrowseScreen.jsx — Product Catalogue / Shop Browser
 *
 * Displays all products in a responsive 2-column grid.
 * Minimalist, modern layout with simple colors.
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

export default function BrowseScreen() {
  const nav = useNavigation();
  const { totalItems, addToCart } = useCart();

  const [products,    setProducts]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');
  const [category,    setCategory]    = useState('');
  const [addingId,    setAddingId]    = useState(null);

  const fabScale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(fabScale, {
      toValue: totalItems > 0 ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();
  }, [totalItems]);

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

  const filtered = products.filter(p => {
    const q = search.trim().toLowerCase();
    return (!q || p.name.toLowerCase().includes(q)) &&
           (!category || p.category === category);
  });

  const renderCard = ({ item }) => {
    const imgUri   = getImageUri(item.imagePath);
    const catInfo  = CATEGORIES.find(c => c.id === item.category);
    const inStock  = item.stock === null || item.stock === undefined || item.stock > 0;
    const isAdding = addingId === item._id;

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        style={s.card}
        onPress={() => nav.navigate('ProductDetail', { productId: item._id })}
      >
        <View style={s.imgWrap}>
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={s.cardImg} resizeMode="cover" />
          ) : (
            <View style={[s.cardImg, s.imgPlaceholder]}>
              <Ionicons name="cube-outline" size={40} color="#666" />
            </View>
          )}
          {!inStock && (
            <View style={s.soldOutBadge}>
              <Text style={s.soldOutText}>Sold Out</Text>
            </View>
          )}
          {inStock && item.stock > 0 && item.stock <= 5 && (
            <View style={s.lowStockBadge}>
              <Text style={s.lowStockText}>Only {item.stock} left</Text>
            </View>
          )}
        </View>

        <View style={s.cardBody}>
          {catInfo && (
            <View style={s.catPill}>
              <Text style={s.catPillText}>{catInfo.name}</Text>
            </View>
          )}
          <Text style={s.cardName} numberOfLines={2}>{item.name}</Text>
          <Text style={s.cardPrice}>LKR {item.price?.toFixed(2)}</Text>

          <TouchableOpacity
            style={[s.addBtn, { backgroundColor: inStock ? '#000' : '#e5e7eb' }]}
            disabled={!inStock || !!addingId}
            onPress={() => handleQuickAdd(item)}
            activeOpacity={0.8}
          >
            {isAdding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[s.addBtnText, !inStock && { color: '#999' }]}>
                {inStock ? 'Add to Cart' : 'Sold Out'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const allCats = [{ id: '', name: 'All' }, ...CATEGORIES];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={s.topBar}>
        <View style={s.topBarLeft}>
          <Text style={s.pageTitle}>Explore</Text>
          <Text style={s.pageSubTitle}>{filtered.length} products</Text>
        </View>
        <TouchableOpacity style={s.cartChip} onPress={() => nav.navigate('Cart')} activeOpacity={0.8}>
          <Ionicons name="cart-outline" size={24} color="#000" />
          {totalItems > 0 && (
            <View style={s.cartChipBadge}>
              <Text style={s.cartChipBadgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#999" style={{ marginRight: 8 }} />
        <TextInput
          style={s.searchInput}
          placeholder="Search products…"
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
            <Ionicons name="close-circle" size={18} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        horizontal
        data={allCats}
        keyExtractor={i => i.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.catRow}
        style={{ maxHeight: 52, flexGrow: 0 }}
        renderItem={({ item }) => {
          const active = category === item.id;
          return (
            <TouchableOpacity
              style={[s.catTab, active && s.catTabActive]}
              onPress={() => setCategory(item.id)}
              activeOpacity={0.8}
            >
              <Text style={[s.catTabText, active && s.catTabTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {loading ? (
        <View style={s.centred}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={s.loadText}>Loading products…</Text>
        </View>
      ) : error ? (
        <View style={s.centred}>
          <Ionicons name="cloud-offline-outline" size={48} color="#ccc" />
          <Text style={s.errText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => load()}>
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
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#000" />
          }
          renderItem={renderCard}
          ListEmptyComponent={
            <View style={s.centred}>
              <Ionicons name="search-outline" size={48} color="#ccc" />
              <Text style={s.emptyText}>No products found</Text>
              <Text style={s.emptySub}>Try a different search or category</Text>
            </View>
          }
        />
      )}

      <Animated.View style={[s.fab, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity style={s.fabBtn} onPress={() => nav.navigate('Cart')} activeOpacity={0.88}>
          <View style={s.fabBadge}>
            <Text style={s.fabBadgeText}>{totalItems}</Text>
          </View>
          <Ionicons name="cart-outline" size={20} color="#fff" />
          <Text style={s.fabText}>View Cart</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#ffffff' },

  topBar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 12 : 4, paddingBottom: 8 },
  topBarLeft:    { gap: 2 },
  pageTitle:     { fontSize: 24, fontWeight: '800', color: '#000', letterSpacing: -0.5 },
  pageSubTitle:  { fontSize: 13, color: '#666', fontWeight: '500' },
  cartChip:      { position: 'relative', padding: 4 },
  cartChipBadge: { position: 'absolute', top: -2, right: -4, backgroundColor: '#000', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#fff' },
  cartChipBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  searchWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', marginHorizontal: 16, marginVertical: 8, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 2, borderWidth: 1, borderColor: '#eee' },
  searchInput:   { flex: 1, height: 44, fontSize: 14, color: '#000' },

  catRow:        { paddingHorizontal: 16, paddingVertical: 6, gap: 8 },
  catTab:        { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#eee' },
  catTabActive:  { backgroundColor: '#000', borderColor: '#000' },
  catTabText:    { fontSize: 13, fontWeight: '600', color: '#555' },
  catTabTextActive:{ color: '#fff' },

  gridRow:       { gap: 12, paddingHorizontal: 16 },
  gridContent:   { paddingTop: 12, paddingBottom: 110, gap: 12 },

  card:          { flex: 1, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#eaeaea' },
  imgWrap:       { position: 'relative', backgroundColor: '#f9f9f9', borderBottomWidth: 1, borderColor: '#eee' },
  cardImg:       { width: '100%', aspectRatio: 1 },
  imgPlaceholder:{ justifyContent: 'center', alignItems: 'center' },
  soldOutBadge:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' },
  soldOutText:   { color: '#000', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  lowStockBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#fff', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#ddd' },
  lowStockText:  { color: '#000', fontSize: 10, fontWeight: '700' },
  cardBody:      { padding: 12, gap: 6 },
  catPill:       { alignSelf: 'flex-start', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#eee' },
  catPillText:   { fontSize: 10, fontWeight: '600', color: '#666' },
  cardName:      { fontSize: 13, fontWeight: '700', color: '#000', lineHeight: 18 },
  cardPrice:     { fontSize: 14, fontWeight: '700', color: '#555' },
  addBtn:        { alignItems: 'center', justifyContent: 'center', borderRadius: 6, paddingVertical: 10, marginTop: 4 },
  addBtnText:    { color: '#fff', fontSize: 13, fontWeight: '700' },

  centred:       { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 12 },
  loadText:      { color: '#666', fontSize: 14, fontWeight: '500' },
  errText:       { color: '#000', textAlign: 'center', fontSize: 14, paddingHorizontal: 30 },
  retryBtn:      { backgroundColor: '#000', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, marginTop: 8 },
  retryText:     { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyText:     { fontSize: 16, fontWeight: '700', color: '#000' },
  emptySub:      { fontSize: 14, color: '#666' },

  fab:           { position: 'absolute', bottom: 24, alignSelf: 'center', left: 0, right: 0, alignItems: 'center' },
  fabBtn:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderRadius: 24, paddingHorizontal: 24, paddingVertical: 14, gap: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  fabBadge:      { backgroundColor: '#fff', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  fabBadgeText:  { fontSize: 11, fontWeight: '800', color: '#000' },
  fabText:       { color: '#fff', fontSize: 14, fontWeight: '700' },
});
