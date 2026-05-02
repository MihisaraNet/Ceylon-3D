/**
 * ProductDetailScreen.jsx — Single Product Detail View
 *
 * Displays full details for a single product with add-to-cart functionality.
 * Minimalist, modern black/white UI.
 *
 * @module screens/shop/ProductDetailScreen
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

  const maxQty = product?.stock > 0 ? product.stock : 99;
  const decQty = () => setQty(q => Math.max(1, q - 1));
  const incQty = () => {
    if (product?.stock > 0 && qty >= product.stock) {
      setAddErr(`Only ${product.stock} unit(s) in stock`);
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
        'Added to Cart ✓',
        `${qty} × ${product.name} added successfully.`,
        [
          { text: 'Keep Browsing', style: 'cancel' },
          { text: 'View Cart', onPress: () => nav.navigate('Cart') },
        ]
      );
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Could not add to cart';
      setAddErr(msg);
    } finally {
      setAdding(false);
    }
  };

  if (loading) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#000" />
    </SafeAreaView>
  );

  if (!product) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <Ionicons name="alert-circle-outline" size={60} color="#ccc" />
      <Text style={{ color: '#666', fontSize: 16, fontWeight: '700' }}>Product not found</Text>
      <TouchableOpacity onPress={() => nav.goBack()} style={{ padding: 10 }}>
        <Text style={{ color: '#000', fontWeight: '700' }}>← Go back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  const imgUri    = getImageUri(product.imagePath);
  const cat       = CATEGORIES.find(c => c.id === product.category);
  const inStock   = product.stock === null || product.stock === undefined || product.stock > 0;
  const lowStock  = inStock && product.stock > 0 && product.stock <= 5;
  const lineTotal = (product.price * qty).toFixed(2);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={s.heroWrap}>
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={s.heroImg} resizeMode="cover" />
          ) : (
            <View style={[s.heroImg, s.heroPlaceholder]}>
              <Ionicons name="cube-outline" size={90} color="#ddd" />
            </View>
          )}
          {!inStock && (
            <View style={s.soldOverlay}>
              <Text style={s.soldText}>Out of Stock</Text>
            </View>
          )}
        </View>

        <View style={s.body}>
          {cat && (
            <View style={s.catPill}>
              <Text style={s.catPillText}>{cat.name}</Text>
            </View>
          )}

          <Text style={s.productName}>{product.name}</Text>
          <Text style={s.price}>LKR {product.price?.toFixed(2)}</Text>

          <View style={[
            s.stockBadge,
            !inStock ? s.stockOut : lowStock ? s.stockLow : s.stockIn
          ]}>
            <Ionicons
              name="cube-outline"
              size={13}
              color={!inStock ? '#666' : lowStock ? '#666' : '#000'}
            />
            <Text style={[
              s.stockText,
              !inStock ? { color: '#666' } : lowStock ? { color: '#666' } : { color: '#000' }
            ]}>
              {!inStock
                ? 'Out of Stock'
                : lowStock
                  ? `Only ${product.stock} left — order soon!`
                  : `In Stock${product.stock ? ` (${product.stock} available)` : ''}`
              }
            </Text>
          </View>

          {!!product.description && (
            <View style={s.descBox}>
              <Text style={s.descTitle}>About this product</Text>
              <Text style={s.descText}>{product.description}</Text>
            </View>
          )}

          <View style={s.qtySection}>
            <Text style={s.qtyLabel}>Quantity</Text>
            <View style={s.qtyControls}>
              <TouchableOpacity
                style={[s.qtyBtn, qty <= 1 && s.qtyBtnDisabled]}
                onPress={decQty}
                disabled={qty <= 1}
                activeOpacity={0.8}
              >
                <Ionicons name="remove" size={20} color={qty <= 1 ? '#ccc' : '#000'} />
              </TouchableOpacity>
              <Text style={s.qtyNum}>{qty}</Text>
              <TouchableOpacity
                style={s.qtyBtn}
                onPress={incQty}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color="#000" />
              </TouchableOpacity>
              <View style={s.totalPill}>
                <Text style={s.totalPillText}>= LKR {lineTotal}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={s.bottomBar}>
        {totalItems > 0 && (
          <TouchableOpacity style={s.viewCartBtn} onPress={() => nav.navigate('Cart')} activeOpacity={0.8}>
            <Ionicons name="cart-outline" size={24} color="#000" />
            <View style={s.cartBadge}>
              <Text style={s.cartBadgeText}>{totalItems}</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={{ flex: 1, gap: 4 }}>
          {!!addErr && (
            <View style={s.errBanner}>
              <Ionicons name="warning-outline" size={14} color="#ef4444" />
              <Text style={s.errText}>{addErr}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[s.addBtn, { backgroundColor: inStock ? '#000' : '#e5e7eb' }, !inStock && { shadowOpacity: 0 }]}
            onPress={handleAdd}
            disabled={adding || !inStock}
            activeOpacity={0.88}
          >
            {adding ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name={inStock ? 'cart-outline' : 'ban-outline'} size={20} color={inStock ? '#fff' : '#999'} />
                <Text style={[s.addBtnText, !inStock && { color: '#999' }]}>
                  {!inStock ? 'Out of Stock' : `Add ${qty > 1 ? qty + ' × ' : ''}to Cart`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#ffffff' },

  heroWrap:       { position: 'relative', borderBottomWidth: 1, borderColor: '#eee' },
  heroImg:        { width: '100%', height: 320, backgroundColor: '#fafafa' },
  heroPlaceholder:{ justifyContent: 'center', alignItems: 'center' },
  soldOverlay:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' },
  soldText:       { color: '#000', fontSize: 22, fontWeight: '900', letterSpacing: 1 },

  body:           { padding: 24, gap: 16 },
  catPill:        { alignSelf: 'flex-start', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#eee' },
  catPillText:    { fontSize: 11, fontWeight: '700', color: '#666', textTransform: 'uppercase' },
  productName:    { fontSize: 26, fontWeight: '800', color: '#000', lineHeight: 32 },
  price:          { fontSize: 28, fontWeight: '800', color: '#000' },

  stockBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  stockIn:        { backgroundColor: '#fff', borderColor: '#ccc' },
  stockLow:       { backgroundColor: '#fafafa', borderColor: '#eee' },
  stockOut:       { backgroundColor: '#fafafa', borderColor: '#eee' },
  stockText:      { fontSize: 13, fontWeight: '700' },

  descBox:        { backgroundColor: '#fff', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#eee', marginTop: 8 },
  descTitle:      { fontSize: 13, fontWeight: '700', color: '#666', marginBottom: 8, textTransform: 'uppercase' },
  descText:       { fontSize: 15, color: '#333', lineHeight: 24 },

  qtySection:     { gap: 12, marginTop: 8 },
  qtyLabel:       { fontSize: 13, fontWeight: '700', color: '#666', textTransform: 'uppercase' },
  qtyControls:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn:         { width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  qtyBtnDisabled: { borderColor: '#eee', backgroundColor: '#fafafa' },
  qtyNum:         { fontSize: 20, fontWeight: '800', color: '#000', minWidth: 32, textAlign: 'center' },
  totalPill:      { borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, marginLeft: 8, backgroundColor: '#f5f5f5' },
  totalPillText:  { fontSize: 14, fontWeight: '700', color: '#000' },

  bottomBar:      { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 28 : 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee' },
  viewCartBtn:    { backgroundColor: '#fff', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#ccc', position: 'relative' },
  cartBadge:      { position: 'absolute', top: -6, right: -6, backgroundColor: '#000', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  cartBadgeText:  { color: '#fff', fontSize: 10, fontWeight: '800' },
  errBanner:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef2f2', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8 },
  errText:        { color: '#ef4444', fontSize: 12, fontWeight: '700', flex: 1 },
  addBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 8, paddingVertical: 16 },
  addBtnText:     { color: '#fff', fontSize: 15, fontWeight: '800' },
});
