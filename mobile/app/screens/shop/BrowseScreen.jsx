import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, RefreshControl,
  StatusBar, Platform, Alert, SafeAreaView, Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../lib/api';
import { getImageUri } from '../../lib/config';
import { CATEGORIES } from '../../data/categories';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 16) / 2; // padding 24 on sides, 16 gap

function ProductCard({ item, onPress, onAddToCart, isAdding }) {
  const [imgErr, setImgErr] = useState(false);
  const imgUri  = getImageUri(item.imagePath);
  const inStock = item.stock === null || item.stock === undefined || item.stock > 0;

  return (
    <TouchableOpacity activeOpacity={0.9} style={s.card} onPress={onPress}>
      <View style={s.imgWrap}>
        {imgUri && !imgErr ? (
          <Image source={{ uri: imgUri }} style={s.img} onError={() => setImgErr(true)} />
        ) : (
          <View style={s.imgPlaceholder}>
            <Ionicons name="cube-outline" size={32} color="#cbd5e1" />
          </View>
        )}
        {!inStock && (
          <View style={s.outOverlay}>
            <Text style={s.outText}>SOLD OUT</Text>
          </View>
        )}
      </View>

      <View style={s.cardBody}>
        <Text style={s.productName} numberOfLines={1}>{item.name || 'Unnamed'}</Text>
        <Text style={s.priceLabel}>LKR {item.price?.toLocaleString() || '0'}</Text>

        <TouchableOpacity
          onPress={onAddToCart}
          disabled={!inStock || isAdding}
          activeOpacity={0.8}
        >
          {inStock ? (
            <LinearGradient
              colors={['#0ea5e9', '#3b82f6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.addBtn}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={s.addBtnText}>Add to Bag</Text>
              )}
            </LinearGradient>
          ) : (
            <View style={[s.addBtn, s.addBtnDisabled]}>
              <Text style={s.addBtnText}>Add to Bag</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function BrowseScreen() {
  const nav = useNavigation();
  const { totalItems, addToCart } = useCart();
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [addingId, setAddingId] = useState(null);

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

  const handleQuickAdd = useCallback(async (item) => {
    if (addingId) return;
    setAddingId(item._id);
    try {
      await addToCart(item._id, 1);
    } catch (err) {
      Alert.alert('Cannot Add', err.response?.data?.error || err.message || 'Could not add to cart');
    } finally {
      setAddingId(null);
    }
  }, [addToCart, addingId]);

  const filtered = (products || []).filter(p => {
    const q = (search || '').trim().toLowerCase();
    const nameMatch = !q || (p.name && p.name.toLowerCase().includes(q));
    const catMatch  = !category || p.category === category;
    return nameMatch && catMatch;
  });

  const allCats = [{ id: '', name: 'All' }, ...CATEGORIES];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Explore</Text>
        <TouchableOpacity style={s.cartBtn} onPress={() => nav.navigate('Cart')}>
          <Ionicons name="bag-outline" size={24} color="#0f172a" />
          {totalItems > 0 && (
            <LinearGradient
              colors={['#ec4899', '#f43f5e']}
              style={s.cartBadge}
            >
              <Text style={s.cartBadgeText}>{totalItems}</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search" size={20} color="#8b5cf6" />
        <TextInput
          style={s.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#cbd5e1" />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <View style={s.catContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={allCats}
          keyExtractor={c => c.id}
          contentContainerStyle={s.catRow}
          renderItem={({ item: cat }) => {
            const active = category === cat.id;
            return (
              <TouchableOpacity
                style={active ? s.catPillActiveShadow : null}
                onPress={() => setCategory(cat.id)}
              >
                {active ? (
                  <LinearGradient
                    colors={['#8b5cf6', '#d946ef']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[s.catPill, s.catPillActiveBg]}
                  >
                    <Text style={[s.catPillText, s.catPillTextActive]}>{cat.name}</Text>
                  </LinearGradient>
                ) : (
                  <View style={s.catPill}>
                    <Text style={s.catPillText}>{cat.name}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Grid */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : error ? (
        <View style={s.center}>
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
          contentContainerStyle={s.listContent}
          columnWrapperStyle={s.listRow}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={['#8b5cf6']} />}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              onPress={() => nav.navigate('ProductDetail', { productId: item._id })}
              onAddToCart={() => handleQuickAdd(item)}
              isAdding={addingId === item._id}
            />
          )}
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={s.emptyText}>No products found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 16 : 8, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  cartBtn: { position: 'relative', width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  cartBadge: { position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ffffff' },
  cartBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },

  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', marginHorizontal: 24, borderRadius: 16, paddingHorizontal: 16, height: 50, shadowColor: '#1a1a1a', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, marginBottom: 16 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: '#0f172a' },

  catContainer: { height: 44, marginBottom: 16 },
  catRow: { paddingHorizontal: 24, gap: 8 },
  catPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 99, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1f5f9' },
  catPillActiveShadow: { shadowColor: '#d946ef', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  catPillActiveBg: { borderWidth: 0, paddingHorizontal: 19, paddingVertical: 11 },
  catPillText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  catPillTextActive: { color: '#ffffff', fontWeight: '700' },

  listContent: { paddingHorizontal: 24, paddingBottom: 40 },
  listRow: { justifyContent: 'space-between', marginBottom: 16 },

  /* Card */
  card: { width: CARD_WIDTH, backgroundColor: '#ffffff', borderRadius: 24, shadowColor: '#1a1a1a', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, overflow: 'hidden' },
  imgWrap: { width: '100%', height: CARD_WIDTH, backgroundColor: '#f8fafc' },
  img: { width: '100%', height: '100%', resizeMode: 'cover' },
  imgPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  outOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' },
  outText: { color: '#0f172a', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  
  cardBody: { padding: 16 },
  productName: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  priceLabel: { fontSize: 13, color: '#8b5cf6', fontWeight: '700', marginBottom: 16 },
  
  addBtn: { width: '100%', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  addBtnDisabled: { backgroundColor: '#e2e8f0' },
  addBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  errText: { color: '#ef4444', marginBottom: 16 },
  retryBtn: { backgroundColor: '#8b5cf6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#ffffff', fontWeight: '600' },
  emptyText: { color: '#94a3b8', fontSize: 15 },
});
