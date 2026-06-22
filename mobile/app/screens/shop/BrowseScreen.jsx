import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, RefreshControl,
  StatusBar, Platform, Alert, SafeAreaView, Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../lib/api';
import { getImageUri } from '../../lib/config';
import { CATEGORIES } from '../../data/categories';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 16) / 2; // padding 24 on sides, 16 gap

function ProductCard({ item, onPress, onAddToCart, isAdding, theme }) {
  const [imgErr, setImgErr] = useState(false);
  const imgUri  = getImageUri(item.imagePath);
  const inStock = item.stock === null || item.stock === undefined || item.stock > 0;
  const s = getStyles(theme);

  return (
    <TouchableOpacity activeOpacity={0.9} style={s.card} onPress={onPress}>
      <View style={s.imgWrap}>
        {imgUri && !imgErr ? (
          <Image source={{ uri: imgUri }} style={s.img} onError={() => setImgErr(true)} />
        ) : (
          <View style={s.imgPlaceholder}>
            <Ionicons name="cube-outline" size={32} color={theme.icon} />
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
                <Text style={s.addBtnText}>Add to Cart</Text>
              )}
            </LinearGradient>
          ) : (
            <View style={[s.addBtn, s.addBtnDisabled]}>
              <Text style={s.addBtnText}>Add to Cart</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function BrowseScreen() {
  const nav = useNavigation();
  const route = useRoute();
  const { totalItems, addToCart } = useCart();
  const { user } = useAuth();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const s = getStyles(theme);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(route.params?.initialCategory || '');
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
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Explore</Text>
        <View style={s.headerActions}>
          <TouchableOpacity style={s.cartBtn} onPress={toggleTheme}>
            <Ionicons name={isDarkMode ? 'sunny-outline' : 'moon-outline'} size={20} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={s.cartBtn} onPress={() => nav.navigate('Cart')}>
            <Ionicons name="cart-outline" size={24} color={theme.text} />
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
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search" size={20} color={theme.primary} />
        <TextInput
          style={s.searchInput}
          placeholder="Search products..."
          placeholderTextColor={theme.icon}
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={theme.icon} />
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
              theme={theme}
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

const getStyles = (t) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 16 : 8, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: t.text, letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cartBtn: { position: 'relative', width: 44, height: 44, borderRadius: 22, backgroundColor: t.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: t.border },
  cartBadge: { position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: t.card },
  cartBadgeText: { color: t.primaryText, fontSize: 10, fontWeight: '800' },

  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.card, marginHorizontal: 24, borderRadius: 16, paddingHorizontal: 16, height: 50, shadowColor: '#1a1a1a', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, marginBottom: 16, borderWidth: 1, borderColor: t.border },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: t.text },

  catContainer: { height: 44, marginBottom: 16 },
  catRow: { paddingHorizontal: 24, gap: 8 },
  catPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 99, backgroundColor: t.card, borderWidth: 1, borderColor: t.border },
  catPillActiveShadow: { shadowColor: t.primary, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  catPillActiveBg: { borderWidth: 0, paddingHorizontal: 19, paddingVertical: 11 },
  catPillText: { fontSize: 13, fontWeight: '600', color: t.textSecondary },
  catPillTextActive: { color: t.primaryText, fontWeight: '700' },

  listContent: { paddingHorizontal: 24, paddingBottom: 40 },
  listRow: { justifyContent: 'space-between', marginBottom: 16 },

  /* Card */
  card: { width: CARD_WIDTH, backgroundColor: t.card, borderRadius: 24, shadowColor: '#1a1a1a', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, overflow: 'hidden', borderWidth: 1, borderColor: t.border },
  imgWrap: { width: '100%', height: CARD_WIDTH, backgroundColor: t.background },
  img: { width: '100%', height: '100%', resizeMode: 'cover' },
  imgPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  outOverlay: { position: 'absolute', inset: 0, backgroundColor: t.glassBg, justifyContent: 'center', alignItems: 'center' },
  outText: { color: t.text, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  
  cardBody: { padding: 16 },
  productName: { fontSize: 14, fontWeight: '700', color: t.text, marginBottom: 4 },
  priceLabel: { fontSize: 13, color: t.primary, fontWeight: '700', marginBottom: 16 },
  
  addBtn: { width: '100%', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  addBtnDisabled: { backgroundColor: t.border },
  addBtnText: { color: t.primaryText, fontSize: 13, fontWeight: '700' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  errText: { color: t.error, marginBottom: 16 },
  retryBtn: { backgroundColor: t.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: t.primaryText, fontWeight: '600' },
  emptyText: { color: t.icon, fontSize: 15 },
});
