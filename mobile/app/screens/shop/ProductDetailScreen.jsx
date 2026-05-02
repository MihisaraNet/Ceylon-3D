/**
 * ProductDetailScreen.jsx — Single Product Detail View
 *
 * Modern, colorful and simple design.
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
import { useNavigation } from '@react-navigation/native';
import { CATEGORIES } from '../../data/categories';

export default function ProductDetailScreen({ route }) {
  const { productId } = route.params;
  const { addToCart, totalItems } = useCart();
  const nav = useNavigation();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty,     setQty]     = useState(1);
  const [adding,  setAdding]  = useState(false);
  const [addErr,  setAddErr]  = useState('');

  useEffect(() => {
    setAddErr('');
    (async () => {
      try {
        const { data } = await api.get(`/api/products/${productId}`);
        setProduct(data);
      } catch { } finally { setLoading(false); }
    })();
  }, [productId]);

  const decQty = () => setQty(q => Math.max(1, q - 1));
  const incQty = () => {
    if (product?.stock > 0 && qty >= product.stock) {
      setAddErr(`Only ${product.stock} units in stock`);
      return;
    }
    setQty(q => q + 1);
    setAddErr('');
  };

  const handleAdd = async () => {
    if (adding) return;
    setAddErr('');
    setAdding(true);
    
    try {
      await addToCart(product._id, qty);
      Alert.alert(
        'Added to Cart',
        `${qty} × ${product.name} added.`,
        [
          { text: 'Continue', style: 'cancel' },
          { text: 'View Cart', onPress: () => nav.navigate('Cart') },
        ]
      );
    } catch (err) {
      setAddErr(err.response?.data?.error || 'Could not add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color="#6366f1" /></View>
  );

  if (!product) return (
    <View style={s.center}><Text style={s.emptyText}>Product not found</Text></View>
  );

  const imgUri    = getImageUri(product.imagePath);
  const cat       = CATEGORIES.find(c => c.id === product.category);
  const inStock   = product.stock > 0;
  const lineTotal = (product.price * qty).toFixed(2);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={s.heroWrap}>
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={s.heroImg} resizeMode="cover" />
          ) : (
            <View style={s.heroPlaceholder}>
              <Ionicons name="cube-outline" size={80} color="#cbd5e1" />
            </View>
          )}
          <TouchableOpacity style={s.backBtn} onPress={() => nav.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
        </View>

        <View style={s.body}>
          <View style={s.topInfo}>
            <View style={s.catPill}>
              <Text style={s.catText}>{cat?.name || product.category}</Text>
            </View>
            <View style={[s.stockBadge, { backgroundColor: inStock ? '#f0fdf4' : '#fef2f2' }]}>
              <Text style={[s.stockBadgeText, { color: inStock ? '#10b981' : '#ef4444' }]}>
                {inStock ? 'In Stock' : 'Out of Stock'}
              </Text>
            </View>
          </View>

          <Text style={s.name}>{product.name}</Text>
          <Text style={s.price}>LKR {product.price?.toFixed(2)}</Text>

          <View style={s.divider} />
          
          <Text style={s.sectionLabel}>Description</Text>
          <Text style={s.desc}>{product.description || 'No description available for this item.'}</Text>

          <View style={s.qtySection}>
            <Text style={s.sectionLabel}>Quantity</Text>
            <View style={s.qtyRow}>
              <View style={s.qtyPicker}>
                <TouchableOpacity style={s.qtyBtn} onPress={decQty} disabled={qty <= 1}>
                  <Ionicons name="remove" size={20} color={qty <= 1 ? '#cbd5e1' : '#6366f1'} />
                </TouchableOpacity>
                <Text style={s.qtyText}>{qty}</Text>
                <TouchableOpacity style={s.qtyBtn} onPress={incQty}>
                  <Ionicons name="add" size={20} color="#6366f1" />
                </TouchableOpacity>
              </View>
              <Text style={s.totalText}>= LKR {lineTotal}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={s.footer}>
        <View style={{ flex: 1 }}>
          {!!addErr && <Text style={s.errText}>{addErr}</Text>}
          <TouchableOpacity
            style={[s.addBtn, !inStock && s.addBtnDisabled]}
            onPress={handleAdd}
            disabled={adding || !inStock}
          >
            {adding ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cart" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={s.addBtnText}>Add to Cart</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={s.cartBtn} onPress={() => nav.navigate('Cart')}>
          <Ionicons name="cart-outline" size={24} color="#64748b" />
          {totalItems > 0 && <View style={s.badge}><Text style={s.badgeText}>{totalItems}</Text></View>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#fff' },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText:      { fontSize: 16, color: '#94a3b8', fontWeight: '600' },

  heroWrap:       { height: 350, position: 'relative', backgroundColor: '#f8fafc' },
  heroImg:        { width: '100%', height: '100%' },
  heroPlaceholder:{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  backBtn:        { position: 'absolute', top: 50, left: 24, backgroundColor: '#fff', padding: 12, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },

  body:           { padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -32, backgroundColor: '#fff' },
  topInfo:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  catPill:        { backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  catText:        { fontSize: 12, fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1 },
  stockBadge:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  stockBadgeText: { fontSize: 12, fontWeight: '800' },

  name:           { fontSize: 28, fontWeight: '900', color: '#1e293b', letterSpacing: -0.5 },
  price:          { fontSize: 24, fontWeight: '800', color: '#6366f1', marginTop: 8 },
  divider:        { height: 1, backgroundColor: '#f1f5f9', marginVertical: 24 },
  
  sectionLabel:   { fontSize: 13, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  desc:           { fontSize: 15, color: '#475569', lineHeight: 24 },

  qtySection:     { marginTop: 32 },
  qtyRow:         { flexDirection: 'row', alignItems: 'center', gap: 16 },
  qtyPicker:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, padding: 6, borderWidth: 1, borderColor: '#f1f5f9' },
  qtyBtn:         { width: 40, height: 40, backgroundColor: '#fff', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  qtyText:        { marginHorizontal: 16, fontSize: 18, fontWeight: '800', color: '#1e293b' },
  totalText:      { fontSize: 16, fontWeight: '700', color: '#64748b' },

  footer:         { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  addBtn:         { flexDirection: 'row', backgroundColor: '#6366f1', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  addBtnDisabled: { backgroundColor: '#cbd5e1', shadowOpacity: 0 },
  addBtnText:     { color: '#fff', fontSize: 16, fontWeight: '800' },
  errText:        { color: '#ef4444', fontSize: 12, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  
  cartBtn:        { width: 60, height: 60, backgroundColor: '#f8fafc', borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9', position: 'relative' },
  badge:          { position: 'absolute', top: -5, right: -5, backgroundColor: '#ef4444', minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  badgeText:      { color: '#fff', fontSize: 10, fontWeight: '800' },
});
