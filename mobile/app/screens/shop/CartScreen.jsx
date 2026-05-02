/**
 * CartScreen.jsx — Shopping Cart & Checkout Flow
 *
 * Displays the user's cart items with full checkout functionality.
 *
 * States:
 *   - Empty cart → Friendly empty state with "Browse Products" CTA
 *   - Loading    → Spinner while cart data is being fetched
 *   - Cart view  → List of items with quantity controls
 *   - Checkout   → Delivery details form (name, phone, address, city)
 *   - Success    → Order confirmation screen with "Continue Shopping" button
 *
 * Features:
 *   - Quantity adjustment (+/-) with server-side stock validation
 *   - Inline error messages per item when stock limits are exceeded
 *   - Remove individual items or clear entire cart
 *   - Order summary with subtotal, free delivery badge, and total
 *   - Cash on Delivery (COD) payment notice
 *   - Delivery form with client-side validation (phone format, required fields)
 *   - Color-coded accent bars on each cart item card
 *
 * @module screens/shop/CartScreen
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, TextInput, Alert, ActivityIndicator, SafeAreaView,
  StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
import { useNavigation } from '@react-navigation/native';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

/* ── Colour palette for item cards ─────────────────────── */
const ITEM_COLORS = ['#fff7ed','#f0fdf4','#eff6ff','#fdf4ff','#fefce8'];
const itemBg = (i) => ITEM_COLORS[i % ITEM_COLORS.length];

/* ── Accent colours per card row ───────────────────────── */
const ACCENTS = ['#f97316','#22c55e','#3b82f6','#a855f7','#f59e0b'];
const accent  = (i) => ACCENTS[i % ACCENTS.length];

export default function CartScreen() {
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice, loading, reloadCart } = useCart();
  const { user } = useAuth();
  const nav = useNavigation();
  const [checkout, setCheckout] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: '',
    address: '',
    city: '',
  });
  const [placing, setPlacing]   = useState(false);
  const [done,    setDone]       = useState(false);
  const [qtyErr,  setQtyErr]     = useState({}); // { [cartItemId]: 'error string' }

  /* ── Quantity update with error display ──────────────── */
  const handleQtyChange = async (cartItemId, newQty) => {
    if (newQty < 1) return;
    setQtyErr(e => ({ ...e, [cartItemId]: null }));
    try {
      await updateQuantity(cartItemId, newQty);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Could not update quantity';
      setQtyErr(e => ({ ...e, [cartItemId]: msg }));
    }
  };

  /* ── Place order ─────────────────────────────────────── */
  const handlePlaceOrder = async () => {
    const { fullName, phone, address, city } = form;
    if (!fullName.trim()) return Alert.alert('Missing Info', 'Please enter your full name');
    if (!phone.trim())    return Alert.alert('Missing Info', 'Please enter your phone number');
    if (!address.trim())  return Alert.alert('Missing Info', 'Please enter your delivery address');
    if (!city.trim())     return Alert.alert('Missing Info', 'Please enter your city');
    if (!/^\d{7,15}$/.test(phone.replace(/\s/g, '')))
      return Alert.alert('Invalid Phone', 'Enter a valid phone number (7-15 digits)');

    setPlacing(true);
    try {
      const shipping   = `${fullName}\n${phone}\n${address}\n${city}`;
      const orderItems = items.map(i => ({ productName: i.title, quantity: i.quantity, unitPrice: i.price }));
      await api.post('/orders', { shippingAddress: shipping, items: orderItems });
      await clearCart();
      setDone(true);
      setCheckout(false);
    } catch (err) {
      Alert.alert('Order Failed', err.response?.data?.error || err.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  /* ─── Success screen ─── */
  if (done) return (
    <SafeAreaView style={s.safe}>
      <View style={s.successScreen}>
        <View style={s.successCircle}>
          <Ionicons name="checkmark-sharp" size={56} color="#fff" />
        </View>
        <Text style={s.successTitle}>Order Placed! 🎉</Text>
        <Text style={s.successSub}>
          Thank you! Your order has been received.{'\n'}We'll be in touch soon.
        </Text>
        <TouchableOpacity
          style={s.continuBtn}
          onPress={() => { setDone(false); nav.navigate('Browse'); }}
          activeOpacity={0.88}
        >
          <Ionicons name="storefront-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={s.continueText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  /* ─── Loading ─── */
  if (loading) return (
    <SafeAreaView style={s.safe}>
      <View style={s.centred}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={s.loadText}>Loading cart…</Text>
      </View>
    </SafeAreaView>
  );

  /* ─── Empty cart ─── */
  if (items.length === 0) return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <Text style={s.pageTitle}>My Cart</Text>
      </View>
      <View style={s.centred}>
        <View style={s.emptyIconBox}>
          <Ionicons name="cart-outline" size={56} color="#6366f1" />
        </View>
        <Text style={s.emptyTitle}>Your cart is empty</Text>
        <Text style={s.emptySub}>Browse products and add something you like!</Text>
        <TouchableOpacity style={s.browseBtn} onPress={() => nav.navigate('Browse')} activeOpacity={0.88}>
          <Ionicons name="grid-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={s.browseBtnText}>Browse Products</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  /* ─── Main cart view ─── */
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f7ff" />

      {/* Header */}
      <View style={s.topBar}>
        <Text style={s.pageTitle}>My Cart</Text>
        <View style={s.itemCountBubble}>
          <Text style={s.itemCountText}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Cart Items ── */}
        <View style={{ paddingHorizontal: 16, gap: 12, paddingTop: 8 }}>
          {items.map((item, idx) => (
            <View key={item.cartItemId?.toString()} style={[s.itemCard, { backgroundColor: itemBg(idx) }]}>
              {/* Left accent bar */}
              <View style={[s.accentBar, { backgroundColor: accent(idx) }]} />

              {/* Image */}
              {item.image ? (
                <Image source={{ uri: item.image }} style={s.itemImg} resizeMode="cover" />
              ) : (
                <View style={[s.itemImg, s.imgPH, { backgroundColor: accent(idx) + '22' }]}>
                  <Ionicons name="cube-outline" size={28} color={accent(idx)} />
                </View>
              )}

              {/* Info */}
              <View style={s.itemBody}>
                <Text style={s.itemName} numberOfLines={2}>{item.title}</Text>
                <Text style={s.itemPrice}>LKR {item.price?.toFixed(2)}</Text>

                {/* Qty row */}
                <View style={s.qtyRow}>
                  <TouchableOpacity
                    style={[s.qtyBtn, { borderColor: accent(idx) }]}
                    onPress={() => handleQtyChange(item.cartItemId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Ionicons name="remove" size={16} color={item.quantity <= 1 ? '#d1d5db' : accent(idx)} />
                  </TouchableOpacity>
                  <Text style={s.qtyVal}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={[s.qtyBtn, { borderColor: accent(idx) }]}
                    onPress={() => handleQtyChange(item.cartItemId, item.quantity + 1)}
                  >
                    <Ionicons name="add" size={16} color={accent(idx)} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.removeBtn}
                    onPress={() => removeFromCart(item.cartItemId)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                {/* Qty error from server */}
                {qtyErr[item.cartItemId] && (
                  <Text style={s.qtyErrText}>⚠ {qtyErr[item.cartItemId]}</Text>
                )}
              </View>

              {/* Line total */}
              <Text style={[s.lineTotal, { color: accent(idx) }]}>
                LKR{'\n'}{(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Order Summary ── */}
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>Order Summary</Text>
          <View style={s.sumRow}>
            <Text style={s.sumLabel}>Subtotal</Text>
            <Text style={s.sumVal}>LKR {totalPrice.toFixed(2)}</Text>
          </View>
          <View style={s.sumRow}>
            <Text style={s.sumLabel}>Delivery</Text>
            <Text style={[s.sumVal, { color: '#22c55e', fontWeight: '800' }]}>FREE 🚀</Text>
          </View>
          <View style={s.sumDivider} />
          <View style={s.sumRow}>
            <Text style={s.totalLabel}>Total to Pay</Text>
            <Text style={s.totalVal}>LKR {totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        {/* ── COD Notice ── */}
        <View style={s.codBanner}>
          <Text style={s.codIcon}>💵</Text>
          <View>
            <Text style={s.codTitle}>Cash on Delivery</Text>
            <Text style={s.codSub}>Pay when your order arrives</Text>
          </View>
        </View>

        {/* ── Checkout toggle ── */}
        {!checkout ? (
          <TouchableOpacity style={s.checkoutBtn} onPress={() => setCheckout(true)} activeOpacity={0.88}>
            <Ionicons name="bag-check-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={s.checkoutBtnText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.formCard}>
            <Text style={s.formTitle}>📦 Delivery Details</Text>

            {[
              { key: 'fullName', label: 'Full Name',        icon: 'person-outline',   keyboard: 'default' },
              { key: 'phone',    label: 'Phone Number',     icon: 'call-outline',     keyboard: 'phone-pad' },
              { key: 'address',  label: 'Delivery Address', icon: 'map-outline',      keyboard: 'default', multi: true },
              { key: 'city',     label: 'City',             icon: 'location-outline', keyboard: 'default' },
            ].map(({ key, label, icon, keyboard, multi }) => (
              <View key={key} style={s.fieldRow}>
                <View style={s.fieldIcon}>
                  <Ionicons name={icon} size={16} color="#6366f1" />
                </View>
                <TextInput
                  style={[s.fieldInput, multi && { minHeight: 68, textAlignVertical: 'top', paddingTop: 12 }]}
                  placeholder={label}
                  placeholderTextColor="#9ca3af"
                  value={form[key]}
                  onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
                  keyboardType={keyboard}
                  multiline={!!multi}
                />
              </View>
            ))}

            <TouchableOpacity
              style={[s.placeBtn, placing && { opacity: 0.7 }]}
              onPress={handlePlaceOrder}
              disabled={placing}
              activeOpacity={0.88}
            >
              {placing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={s.placeBtnText}>Place Order</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={s.cancelBtn} onPress={() => setCheckout(false)}>
              <Text style={s.cancelText}>← Back to Cart</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#f8f7ff' },

  /* Header */
  topBar:          { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 14 : 4, paddingBottom: 8 },
  pageTitle:       { fontSize: 28, fontWeight: '900', color: '#1e1b4b', letterSpacing: -0.5 },
  itemCountBubble: { backgroundColor: '#eef2ff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1.5, borderColor: '#c7d2fe' },
  itemCountText:   { color: '#4f46e5', fontSize: 13, fontWeight: '800' },

  /* States */
  centred:         { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  loadText:        { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
  emptyIconBox:    { backgroundColor: '#eef2ff', borderRadius: 28, padding: 24, marginBottom: 8 },
  emptyTitle:      { fontSize: 22, fontWeight: '900', color: '#1e1b4b' },
  emptySub:        { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
  browseBtn:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6366f1', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13, marginTop: 6 },
  browseBtnText:   { color: '#fff', fontWeight: '800', fontSize: 15 },

  /* Item card */
  itemCard:        { flexDirection: 'row', borderRadius: 18, overflow: 'hidden', padding: 12, alignItems: 'flex-start', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  accentBar:       { width: 4, borderRadius: 99, marginRight: 10, alignSelf: 'stretch' },
  itemImg:         { width: 72, height: 72, borderRadius: 12, marginRight: 10 },
  imgPH:           { justifyContent: 'center', alignItems: 'center' },
  itemBody:        { flex: 1, gap: 3 },
  itemName:        { fontSize: 14, fontWeight: '800', color: '#1e1b4b', lineHeight: 19 },
  itemPrice:       { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  qtyRow:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  qtyBtn:          { width: 30, height: 30, borderRadius: 8, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  qtyVal:          { fontSize: 16, fontWeight: '900', color: '#1e1b4b', minWidth: 22, textAlign: 'center' },
  removeBtn:       { marginLeft: 4, padding: 4 },
  qtyErrText:      { fontSize: 11, color: '#ef4444', fontWeight: '600', marginTop: 2 },
  lineTotal:       { fontSize: 12, fontWeight: '900', textAlign: 'right', lineHeight: 18, minWidth: 64 },

  /* Summary */
  summaryCard:     { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 20, padding: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  summaryTitle:    { fontSize: 16, fontWeight: '900', color: '#1e1b4b', marginBottom: 14 },
  sumRow:          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sumLabel:        { fontSize: 14, color: '#6b7280' },
  sumVal:          { fontSize: 14, fontWeight: '700', color: '#1e1b4b' },
  sumDivider:      { height: 1, backgroundColor: '#f3f4f6', marginVertical: 10 },
  totalLabel:      { fontSize: 17, fontWeight: '900', color: '#1e1b4b' },
  totalVal:        { fontSize: 20, fontWeight: '900', color: '#6366f1' },

  /* COD */
  codBanner:       { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fffbeb', marginHorizontal: 16, marginTop: 14, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#fde68a' },
  codIcon:         { fontSize: 28 },
  codTitle:        { fontSize: 14, fontWeight: '800', color: '#92400e' },
  codSub:          { fontSize: 12, color: '#b45309', marginTop: 2 },

  /* Checkout button */
  checkoutBtn:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#6366f1', marginHorizontal: 16, marginTop: 14, borderRadius: 16, paddingVertical: 16, shadowColor: '#6366f1', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },

  /* Form */
  formCard:        { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 14, borderRadius: 20, padding: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  formTitle:       { fontSize: 18, fontWeight: '900', color: '#1e1b4b', marginBottom: 16 },
  fieldRow:        { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#f8f7ff', borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', marginBottom: 10, overflow: 'hidden' },
  fieldIcon:       { paddingHorizontal: 14, paddingTop: 14 },
  fieldInput:      { flex: 1, paddingVertical: 12, paddingRight: 14, fontSize: 15, color: '#1e1b4b' },
  placeBtn:        { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#22c55e', borderRadius: 14, paddingVertical: 15, marginTop: 6, shadowColor: '#22c55e', shadowOpacity: 0.35, shadowRadius: 10, elevation: 5 },
  placeBtnText:    { color: '#fff', fontSize: 16, fontWeight: '900' },
  cancelBtn:       { alignItems: 'center', padding: 14 },
  cancelText:      { color: '#6b7280', fontSize: 14, fontWeight: '700' },

  /* Success */
  successScreen:   { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 14, backgroundColor: '#f8f7ff' },
  successCircle:   { width: 110, height: 110, borderRadius: 55, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center', shadowColor: '#22c55e', shadowOpacity: 0.4, shadowRadius: 24, elevation: 10, marginBottom: 8 },
  successTitle:    { fontSize: 30, fontWeight: '900', color: '#1e1b4b', textAlign: 'center' },
  successSub:      { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
  continuBtn:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6366f1', borderRadius: 16, paddingHorizontal: 30, paddingVertical: 14, marginTop: 8 },
  continueText:    { color: '#fff', fontWeight: '900', fontSize: 15 },
});
