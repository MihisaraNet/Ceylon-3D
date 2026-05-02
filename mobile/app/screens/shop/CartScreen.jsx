/**
 * CartScreen.jsx — Shopping Cart & Checkout Management
 *
 * Modern, colorful and simple design.
 */
import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, StyleSheet,
  TextInput, Alert, ActivityIndicator, SafeAreaView, StatusBar,
} from 'react-native';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { getImageUri } from '../../lib/config';
import api from '../../lib/api';

export default function CartScreen() {
  const { cartItems, totalAmount, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  
  const [shippingAddress, setAddress] = useState(user?.address || '');
  const [checkingOut, setCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    if (!shippingAddress.trim()) {
      Alert.alert('Missing Address', 'Please provide a delivery address.');
      return;
    }

    setCheckingOut(true);
    try {
      const orderData = {
        items: cartItems.map(i => ({
          productId: i.productId._id,
          productName: i.productId.name,
          quantity: i.quantity,
          price: i.productId.price,
        })),
        totalAmount,
        shippingAddress,
      };

      await api.post('/orders', orderData);
      Alert.alert('Success', 'Order placed successfully!', [
        { text: 'OK', onPress: () => clearCart() }
      ]);
    } catch (err) {
      Alert.alert('Checkout Failed', err.response?.data?.error || 'Could not place order.');
    } finally {
      setCheckingOut(false);
    }
  };

  const renderItem = ({ item }) => {
    const p = item.productId;
    const imgUri = getImageUri(p.imagePath);

    return (
      <View style={s.cartItem}>
        <View style={s.itemImgWrap}>
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={s.itemImg} />
          ) : (
            <View style={s.itemPlaceholder}>
              <Ionicons name="cube-outline" size={24} color="#94a3b8" />
            </View>
          )}
        </View>

        <View style={s.itemInfo}>
          <Text style={s.itemName} numberOfLines={1}>{p.name}</Text>
          <Text style={s.itemPrice}>LKR {p.price?.toFixed(2)}</Text>
          
          <View style={s.itemFooter}>
            <View style={s.qtyControls}>
              <TouchableOpacity
                style={s.qtyBtn}
                onPress={() => updateQuantity(p._id, Math.max(1, item.quantity - 1))}
              >
                <Ionicons name="remove" size={16} color="#6366f1" />
              </TouchableOpacity>
              <Text style={s.qtyText}>{item.quantity}</Text>
              <TouchableOpacity
                style={s.qtyBtn}
                onPress={() => updateQuantity(p._id, item.quantity + 1)}
              >
                <Ionicons name="add" size={16} color="#6366f1" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity onPress={() => removeFromCart(p._id)} style={s.delBtn}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={s.header}>
        <Text style={s.headerTitle}>Your Cart</Text>
        <Text style={s.headerSub}>{cartItems.length} Items</Text>
      </View>

      {cartItems.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIconWrap}>
            <Ionicons name="cart-outline" size={80} color="#e2e8f0" />
          </View>
          <Text style={s.emptyTitle}>Empty Cart</Text>
          <Text style={s.emptySub}>Looks like you haven't added anything yet.</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={item => item.productId._id}
            renderItem={renderItem}
            contentContainerStyle={s.listContent}
          />

          <View style={s.footer}>
            <View style={s.addressWrap}>
              <Text style={s.footerLabel}>DELIVERY ADDRESS</Text>
              <TextInput
                style={s.addressInput}
                value={shippingAddress}
                onChangeText={setAddress}
                placeholder="Enter your address..."
                multiline
              />
            </View>

            <View style={s.summary}>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Subtotal</Text>
                <Text style={s.summaryVal}>LKR {totalAmount?.toFixed(2)}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Shipping</Text>
                <Text style={s.summaryVal}>FREE</Text>
              </View>
              <View style={[s.summaryRow, { marginTop: 12 }]}>
                <Text style={s.totalLabel}>Total</Text>
                <Text style={s.totalVal}>LKR {totalAmount?.toFixed(2)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={s.checkoutBtn}
              onPress={handleCheckout}
              disabled={checkingOut}
            >
              {checkingOut ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={s.checkoutBtnText}>Checkout Now</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#f8fafc' },
  header:         { paddingHorizontal: 24, paddingVertical: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  headerTitle:    { fontSize: 28, fontWeight: '900', color: '#1e293b' },
  headerSub:      { fontSize: 14, color: '#64748b', fontWeight: '600', marginTop: 2 },

  listContent:    { padding: 20 },
  cartItem:       { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10 },
  itemImgWrap:    { width: 90, height: 90, borderRadius: 16, backgroundColor: '#f1f5f9', overflow: 'hidden' },
  itemImg:        { width: '100%', height: '100%' },
  itemPlaceholder:{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  
  itemInfo:       { flex: 1, marginLeft: 16, justifyContent: 'space-between' },
  itemName:       { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  itemPrice:      { fontSize: 14, fontWeight: '700', color: '#6366f1', marginTop: 4 },
  itemFooter:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  
  qtyControls:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, padding: 4 },
  qtyBtn:         { width: 32, height: 32, borderRadius: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  qtyText:        { marginHorizontal: 12, fontSize: 14, fontWeight: '800', color: '#1e293b' },
  delBtn:         { padding: 8 },

  footer:         { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, elevation: 10 },
  addressWrap:    { marginBottom: 20 },
  footerLabel:    { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 8 },
  addressInput:   { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, fontSize: 14, color: '#1e293b', borderWidth: 1, borderColor: '#f1f5f9', minHeight: 80 },
  
  summary:        { marginBottom: 24, borderTopWidth: 1, borderColor: '#f1f5f9', paddingTop: 20 },
  summaryRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel:   { fontSize: 14, color: '#64748b', fontWeight: '600' },
  summaryVal:     { fontSize: 14, color: '#1e293b', fontWeight: '700' },
  totalLabel:     { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  totalVal:       { fontSize: 18, fontWeight: '900', color: '#6366f1' },

  checkoutBtn:    { flexDirection: 'row', backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: 18, justifyContent: 'center', alignItems: 'center', shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  checkoutBtnText:{ color: '#fff', fontSize: 16, fontWeight: '800' },

  empty:          { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyIconWrap:  { backgroundColor: '#fff', padding: 30, borderRadius: 40, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  emptyTitle:     { fontSize: 22, fontWeight: '900', color: '#1e293b' },
  emptySub:       { fontSize: 15, color: '#94a3b8', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
});
