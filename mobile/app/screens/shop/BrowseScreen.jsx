/**
 * BrowseScreen.jsx — Product Discovery & Catalog
 *
 * Modern, colorful and simple design.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, StyleSheet,
  ActivityIndicator, TextInput, SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { getImageUri } from '../../lib/config';
import { CATEGORIES } from '../../data/categories';
import { useNavigation } from '@react-navigation/native';

export default function BrowseScreen() {
  const nav = useNavigation();
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/products');
      setProducts(data);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter(p => {
    const matchesCat = activeCat === 'all' || p.category === activeCat;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const renderProduct = ({ item }) => {
    const imgUri = getImageUri(item.imagePath);
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => nav.navigate('ProductDetail', { productId: item._id })}
        activeOpacity={0.9}
      >
        <View style={s.imgWrap}>
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={s.cardImg} />
          ) : (
            <View style={s.placeholderImg}>
              <Ionicons name="cube-outline" size={40} color="#cbd5e1" />
            </View>
          )}
          <View style={s.priceBadge}>
            <Text style={s.priceBadgeText}>LKR {item.price?.toFixed(0)}</Text>
          </View>
        </View>
        <View style={s.cardBody}>
          <Text style={s.cardCat}>{item.category?.toUpperCase()}</Text>
          <Text style={s.cardTitle} numberOfLines={1}>{item.name}</Text>
          <View style={s.cardFooter}>
            <View style={s.stockWrap}>
              <View style={[s.stockDot, { backgroundColor: item.stock > 0 ? '#10b981' : '#ef4444' }]} />
              <Text style={s.stockText}>{item.stock > 0 ? 'In Stock' : 'Out of Stock'}</Text>
            </View>
            <TouchableOpacity style={s.addIconBtn}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* ─── Header ─── */}
      <View style={s.header}>
        <View style={s.headerTextWrap}>
          <Text style={s.headerTitle}>Discovery</Text>
          <Text style={s.headerSub}>{filtered.length} Products Found</Text>
        </View>
        <TouchableOpacity style={s.refreshBtn} onPress={load}>
          <Ionicons name="reload-outline" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* ─── Search ─── */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={20} color="#94a3b8" style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder="Find something unique..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* ─── Categories ─── */}
      <View style={{ height: 50, marginBottom: 16 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'all', name: 'All Items', icon: 'apps' }, ...CATEGORIES]}
          keyExtractor={c => c.id}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
          renderItem={({ item }) => {
            const isActive = activeCat === item.id;
            return (
              <TouchableOpacity
                style={[s.catBtn, isActive && s.catBtnActive]}
                onPress={() => setActiveCat(item.id)}
              >
                <Text style={[s.catBtnText, isActive && s.catBtnTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color="#6366f1" size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={p => p._id}
          renderItem={renderProduct}
          numColumns={2}
          contentContainerStyle={s.listContent}
          columnWrapperStyle={s.columnWrapper}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="search-outline" size={60} color="#e2e8f0" />
              <Text style={s.emptyTitle}>No products found</Text>
              <Text style={s.emptySub}>Try searching for something else</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#f8fafc' },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20 },
  headerTitle:    { fontSize: 32, fontWeight: '900', color: '#1e293b', letterSpacing: -1 },
  headerSub:      { fontSize: 14, color: '#64748b', fontWeight: '600', marginTop: 2 },
  refreshBtn:     { backgroundColor: '#fff', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  
  searchWrap:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 24, marginBottom: 20, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10 },
  searchIcon:     { marginRight: 12 },
  searchInput:    { flex: 1, height: 50, fontSize: 15, color: '#1e293b', fontWeight: '600' },

  catBtn:         { paddingHorizontal: 20, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  catBtnActive:   { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  catBtnText:     { fontSize: 14, fontWeight: '700', color: '#64748b' },
  catBtnTextActive:{ color: '#fff' },

  listContent:    { paddingHorizontal: 18, paddingBottom: 40 },
  columnWrapper:  { justifyContent: 'space-between', gap: 12 },
  card:           { width: '48%', backgroundColor: '#fff', borderRadius: 24, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  imgWrap:        { height: 160, position: 'relative', backgroundColor: '#f1f5f9' },
  cardImg:        { width: '100%', height: '100%' },
  placeholderImg: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  priceBadge:     { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  priceBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  
  cardBody:       { padding: 16 },
  cardCat:        { fontSize: 10, fontWeight: '800', color: '#6366f1', letterSpacing: 1, marginBottom: 4 },
  cardTitle:      { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  cardFooter:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  stockWrap:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stockDot:       { width: 6, height: 6, borderRadius: 3 },
  stockText:      { fontSize: 11, color: '#64748b', fontWeight: '600' },
  addIconBtn:     { backgroundColor: '#6366f1', padding: 6, borderRadius: 10 },

  center:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty:          { alignItems: 'center', marginTop: 60 },
  emptyTitle:     { fontSize: 18, fontWeight: '800', color: '#1e293b', marginTop: 20 },
  emptySub:       { fontSize: 14, color: '#94a3b8', marginTop: 8 },
});
