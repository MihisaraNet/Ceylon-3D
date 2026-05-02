/**
 * BrowseScreen.jsx — Premium Catalog Discovery
 * 
 * Attractive, modern design with a focused, 
 * clean layout and premium interaction feel.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, StyleSheet,
  ActivityIndicator, TextInput, SafeAreaView, StatusBar, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { getImageUri } from '../../lib/config';
import { CATEGORIES } from '../../data/categories';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

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
        <View style={s.imgContainer}>
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={s.img} />
          ) : (
            <View style={s.imgPH}><Ionicons name="cube-outline" size={32} color="#cbd5e1" /></View>
          )}
          <View style={s.floatingBadge}>
            <Text style={s.priceText}>LKR {item.price?.toFixed(0)}</Text>
          </View>
        </View>
        <View style={s.cardContent}>
          <Text style={s.catLabel}>{item.category?.toUpperCase()}</Text>
          <Text style={s.prodName} numberOfLines={1}>{item.name}</Text>
          <View style={s.cardBottom}>
            <View style={s.stockInfo}>
              <View style={[s.stockDot, { backgroundColor: item.stock > 0 ? '#10b981' : '#f43f5e' }]} />
              <Text style={s.stockLabel}>{item.stock > 0 ? 'READY' : 'OUT'}</Text>
            </View>
            <View style={s.plusBtn}>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* ─── Header ─── */}
      <View style={s.topRow}>
        <View>
          <Text style={s.title}>Browse</Text>
          <Text style={s.subtitle}>Discover the collection</Text>
        </View>
        <TouchableOpacity style={s.refreshBtn} onPress={load}>
          <Ionicons name="sync" size={20} color="#1e293b" />
        </TouchableOpacity>
      </View>

      {/* ─── Search Bar ─── */}
      <View style={s.searchBar}>
        <Ionicons name="search" size={18} color="#94a3b8" />
        <TextInput
          style={s.input}
          placeholder="Search items..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* ─── Categories ─── */}
      <View style={{ marginBottom: 20 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'all', name: 'All', icon: 'apps' }, ...CATEGORIES]}
          keyExtractor={c => c.id}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
          renderItem={({ item }) => {
            const isActive = activeCat === item.id;
            return (
              <TouchableOpacity
                style={[s.catChip, isActive && s.catChipActive]}
                onPress={() => setActiveCat(item.id)}
              >
                <Text style={[s.catChipText, isActive && s.catChipTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {loading ? (
        <View style={s.loaderWrap}><ActivityIndicator color="#6366f1" size="large" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={p => p._id}
          renderItem={renderProduct}
          numColumns={2}
          contentContainerStyle={s.list}
          columnWrapperStyle={s.column}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons name="search-outline" size={48} color="#e2e8f0" />
              <Text style={s.emptyText}>No matches found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 24, paddingVertical: 20 },
  title: { fontSize: 36, fontWeight: '900', color: '#0f172a', letterSpacing: -1.5 },
  subtitle: { fontSize: 14, color: '#64748b', fontWeight: '600', marginTop: 2 },
  refreshBtn: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', marginHorizontal: 24, marginBottom: 24, borderRadius: 18, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: '#f1f5f9' },
  input: { flex: 1, marginLeft: 12, fontSize: 15, color: '#1e293b', fontWeight: '600' },

  catChip: { paddingHorizontal: 22, height: 44, borderRadius: 22, backgroundColor: '#f8fafc', justifyContent: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  catChipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  catChipText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  catChipTextActive: { color: '#fff' },

  list: { paddingHorizontal: 20, paddingBottom: 40 },
  column: { justifyContent: 'space-between' },
  
  card: { width: (width - 52) / 2, backgroundColor: '#fff', borderRadius: 28, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  imgContainer: { height: 180, backgroundColor: '#f8fafc', position: 'relative' },
  img: { width: '100%', height: '100%', resizeMode: 'cover' },
  imgPH: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  floatingBadge: { position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(15, 23, 42, 0.8)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  priceText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  
  cardContent: { padding: 16 },
  catLabel: { fontSize: 9, fontWeight: '900', color: '#6366f1', letterSpacing: 1, marginBottom: 4 },
  prodName: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  stockInfo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  stockDot: { width: 5, height: 5, borderRadius: 2.5 },
  stockLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '800' },
  plusBtn: { backgroundColor: '#0f172a', width: 28, height: 28, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#94a3b8', marginTop: 16 },
});
