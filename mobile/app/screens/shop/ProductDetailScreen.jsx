/**
 * ProductDetailScreen.jsx — High-End Product Presentation
 * 
 * Attractive, focused design with premium 
 * imagery and refined interaction controls.
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, SafeAreaView, StatusBar, Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { getImageUri } from '../../lib/config';
import { useCart } from '../../context/CartContext';
import { useNavigation } from '@react-navigation/native';
import { CATEGORIES } from '../../data/categories';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ route }) {
  const { productId } = route.params;
  const { addToCart, totalItems } = useCart();
  const nav = useNavigation();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty,     setQty]     = useState(1);
  const [adding,  setAdding]  = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/api/products/${productId}`);
        setProduct(data);
      } catch { } finally { setLoading(false); }
    })();
  }, [productId]);

  const handleAdd = async () => {
    if (adding) return;
    setAdding(true);
    try {
      await addToCart(product._id, qty);
      Alert.alert('Success', 'Item added to your bag.');
    } catch {
      Alert.alert('Error', 'Could not add item.');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#6366f1" /></View>;
  if (!product) return <View style={s.center}><Text style={s.errText}>Product not found</Text></View>;

  const imgUri = getImageUri(product.imagePath);
  const cat = CATEGORIES.find(c => c.id === product.category);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={s.imgBox}>
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={s.mainImg} />
          ) : (
            <View style={s.imgPH}><Ionicons name="cube-outline" size={64} color="#e2e8f0" /></View>
          )}
          <TouchableOpacity style={s.backBtn} onPress={() => nav.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#0f172a" />
          </TouchableOpacity>
        </View>

        <View style={s.content}>
          <View style={s.topMeta}>
            <View style={s.catBadge}>
              <Text style={s.catBadgeText}>{cat?.name || 'Item'}</Text>
            </View>
            <View style={s.stockPill}>
              <View style={[s.stockDot, { backgroundColor: product.stock > 0 ? '#10b981' : '#f43f5e' }]} />
              <Text style={s.stockLabel}>{product.stock > 0 ? 'IN STOCK' : 'OUT'}</Text>
            </View>
          </View>

          <Text style={s.title}>{product.name}</Text>
          <Text style={s.price}>LKR {product.price?.toFixed(2)}</Text>

          <View style={s.divider} />
          
          <Text style={s.label}>DESCRIPTION</Text>
          <Text style={s.desc}>{product.description || 'No detailed specifications provided for this prototype.'}</Text>

          <View style={s.qtyWrap}>
            <Text style={s.label}>QUANTITY</Text>
            <View style={s.qtyRow}>
              <View style={s.stepper}>
                <TouchableOpacity style={s.stepBtn} onPress={() => setQty(Math.max(1, qty-1))}>
                  <Ionicons name="remove" size={20} color="#0f172a" />
                </TouchableOpacity>
                <Text style={s.qtyVal}>{qty}</Text>
                <TouchableOpacity style={s.stepBtn} onPress={() => setQty(qty+1)}>
                  <Ionicons name="add" size={20} color="#0f172a" />
                </TouchableOpacity>
              </View>
              <Text style={s.totalSub}>LKR {(product.price * qty).toFixed(0)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity 
          style={[s.addBtn, product.stock === 0 && s.addBtnOff]} 
          onPress={handleAdd}
          disabled={adding || product.stock === 0}
          activeOpacity={0.9}
        >
          {adding ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={s.addBtnText}>{product.stock === 0 ? 'Out of Stock' : 'Add to Bag'}</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 10 }} />
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={s.bagBtn} onPress={() => nav.navigate('Cart')}>
          <Ionicons name="bag-handle-outline" size={24} color="#0f172a" />
          {totalItems > 0 && <View style={s.bagBadge}><Text style={s.bagBadgeText}>{totalItems}</Text></View>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errText: { color: '#94a3b8', fontWeight: '700' },

  imgBox: { height: 420, position: 'relative', backgroundColor: '#f8fafc' },
  mainImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  imgPH: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { position: 'absolute', top: 50, left: 24, backgroundColor: '#fff', padding: 12, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },

  content: { padding: 28, marginTop: -32, backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40 },
  topMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  catBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  catBadgeText: { fontSize: 10, fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
  stockPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8' },

  title: { fontSize: 32, fontWeight: '900', color: '#0f172a', letterSpacing: -1 },
  price: { fontSize: 24, fontWeight: '800', color: '#6366f1', marginTop: 6 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 32 },
  
  label: { fontSize: 11, fontWeight: '900', color: '#94a3b8', letterSpacing: 1.5, marginBottom: 12 },
  desc: { fontSize: 15, color: '#475569', lineHeight: 26, fontWeight: '500' },

  qtyWrap: { marginTop: 32 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 18, padding: 6, borderWidth: 1, borderColor: '#f1f5f9' },
  stepBtn: { width: 44, height: 44, backgroundColor: '#fff', borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5 },
  qtyVal: { marginHorizontal: 20, fontSize: 18, fontWeight: '900', color: '#0f172a' },
  totalSub: { fontSize: 16, fontWeight: '700', color: '#94a3b8' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  addBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#0f172a', height: 68, borderRadius: 24, justifyContent: 'center', alignItems: 'center', shadowColor: '#0f172a', shadowOpacity: 0.2, shadowRadius: 15, elevation: 10 },
  addBtnOff: { backgroundColor: '#e2e8f0' },
  addBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  
  bagBtn: { width: 68, height: 68, backgroundColor: '#f8fafc', borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9', position: 'relative' },
  bagBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#f43f5e', minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  bagBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
});
