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
import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, TextInput, Alert, ActivityIndicator, SafeAreaView,
  StatusBar, Platform, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCart } from '../../context/CartContext';
import { useNavigation } from '@react-navigation/native';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import CartItemCard from '../../components/CartItemCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../lib/config';

/* ── Accent colours per card row ───────────────────────────── */
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
  // Optional payment proof image selected by the user at checkout
  const [receipt, setReceipt]   = useState(null);
  // Per-item custom design files: { [cartItemId]: { uri, type, name } | null }
  const [itemFiles, setItemFiles] = useState({});
  // Uploading state per item
  const [uploadingFile, setUploadingFile] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reloadCart();
    } finally {
      setRefreshing(false);
    }
  }, [reloadCart]);

  /* ── Clear cart confirmation ────────────────────────── */
  const confirmClear = () => {
    Alert.alert(
      'Clear Cart?',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearCart },
      ]
    );
  };


  /* ── Receipt image picker ────────────────────────────── */
  // Pick optional payment proof image for checkout.
  const pickReceipt = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.[0]) {
      const asset = res.assets[0];
      setReceipt({
        uri:  asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || 'receipt.jpg',
      });
    }
  };

  /* ── Per-item design file picker ────────────────────────── */
  // This lets the user attach or replace a custom design/personalisation image for a specific cart item
  const pickItemFile = async (cartItemId) => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    const fileObj = {
      uri:  asset.uri,
      type: asset.mimeType || 'image/jpeg',
      name: asset.fileName || 'design.jpg',
    };
    // Optimistically show the file in the UI immediately
    setItemFiles(prev => ({ ...prev, [cartItemId]: fileObj }));
    // Upload the file to the backend to attach it to this cart item
    setUploadingFile(prev => ({ ...prev, [cartItemId]: true }));
    try {
      const fd = new FormData();
      fd.append('customFile', fileObj);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/cart/${cartItemId}/file`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not attach file');
      }
    } catch (err) {
      Alert.alert('Upload Failed', err.response?.data?.error || 'Could not attach file');
      setItemFiles(prev => ({ ...prev, [cartItemId]: null }));
    } finally {
      setUploadingFile(prev => ({ ...prev, [cartItemId]: false }));
    }
  };

  // Remove attached custom file for one cart row.
  const removeItemFile = async (cartItemId) => {
    setItemFiles(prev => ({ ...prev, [cartItemId]: null }));
    try {
      await api.put(`/cart/${cartItemId}/file`, { removeFile: true });
    } catch (_) { /* silent */ }
  };

  /* ── Quantity update with inline stock error display ─── */
  // Handles + / - taps, and keeps server-side stock errors scoped to the changed item
  const handleQtyChange = async (cartItemId, newQty) => {
    // Prevent the quantity from dropping below 1
    if (newQty < 1) return;
    
    // Clear any previous error messages for this specific item before trying
    setQtyErr(e => ({ ...e, [cartItemId]: null }));
    
    try {
      // Send the update to the server
      await updateQuantity(cartItemId, newQty);
    } catch (err) {
      // If the server rejects the update (e.g., "Not enough stock"), display the exact error message
      const msg = err.response?.data?.error || err.message || 'Could not update quantity';
      setQtyErr(e => ({ ...e, [cartItemId]: msg }));
    }
  };

  /* ── Place order ─────────────────────────────────────── */
  // Validate inputs and submit final order payload.
  const handlePlaceOrder = async () => {
    const { fullName, phone, address, city } = form;
    
    // Required delivery fields.
    if (!fullName.trim()) return Alert.alert('Missing Info', 'Please enter your full name');
    if (!phone.trim())    return Alert.alert('Missing Info', 'Please enter your phone number');
    if (!address.trim())  return Alert.alert('Missing Info', 'Please enter your delivery address');
    if (!city.trim())     return Alert.alert('Missing Info', 'Please enter your city');
    
    // Robust phone number validation
    if (!/^(?:0|94|\+94)[0-9]{9}$/.test(phone.replace(/[\s\-().]/g, '')))
      return Alert.alert('Invalid Phone', 'Enter a valid phone number (e.g., 0712345678 or +94712345678)');

    setPlacing(true);
    try {
      // Combine the delivery form fields into a single shipping address string
      const shipping   = `${fullName}\n${phone}\n${address}\n${city}`;
      // Map the current cart items into the format required by the orders API
      const orderItems = items.map(i => ({ 
        productId: i.id, 
        productName: i.title, 
        quantity: i.quantity, 
        unitPrice: i.price 
      }));

      if (receipt) {
        // If a receipt image was attached, send as multipart/form-data
        const fd = new FormData();
        fd.append('shippingAddress', shipping);
        fd.append('items',           JSON.stringify(orderItems));
        fd.append('receipt', receipt);
        const token = await AsyncStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/orders`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to place order');
        }
      } else {
        // No receipt — send as regular JSON
        await api.post('/orders', { shippingAddress: shipping, items: orderItems });
      }
      // On success, clear the local cart and show the confirmation screen
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
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={s.pageTitle}>My Cart</Text>
          <View style={s.itemCountBubble}>
            <Text style={s.itemCountText}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#6366f1']}
            tintColor="#6366f1"
          />
        }
      >

        {/* ── Cart Items ── */}
        <View style={{ paddingHorizontal: 16, gap: 12, paddingTop: 8 }}>
          {items.map((item, idx) => (
            <CartItemCard
              key={item.cartItemId?.toString()}
              item={item}
              accentColor={accent(idx)}
              onQtyChange={handleQtyChange}
              onRemove={removeFromCart}
              onPickFile={pickItemFile}
              onRemoveFile={removeItemFile}
              isUploading={uploadingFile[item.cartItemId]}
              hasFile={itemFiles[item.cartItemId]}
              qtyError={qtyErr[item.cartItemId]}
            />
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
            <Text style={[s.sumVal, { color: '#22c55e', fontWeight: '800' }]}>FREE </Text>
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

            {/* ── Optional Payment Proof Image ── */}
            <View style={[s.receiptBtn, receipt && s.receiptBtnDone]}>
              <TouchableOpacity 
                style={s.receiptBtnTouch} 
                onPress={pickReceipt} 
                activeOpacity={0.85}
              >
                <Ionicons
                  name={receipt ? 'image' : 'camera-outline'}
                  size={18}
                  color={receipt ? '#22c55e' : '#6366f1'}
                />
                <Text style={[s.receiptBtnText, receipt && { color:'#22c55e' }]}>
                  {receipt ? `✔ Receipt attached: ${receipt.name}` : 'Attach Payment Proof (optional)'}
                </Text>
              </TouchableOpacity>
              
              {receipt && (
                <TouchableOpacity 
                  style={s.removeReceiptBtn} 
                  onPress={() => setReceipt(null)} 
                  hitSlop={{ top:10, bottom:10, left:10, right:10 }}
                >
                  <Ionicons name="trash-outline" size={14} color="#ef4444" />
                  <Text style={s.removeReceiptText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

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

  /* Clear Header Btn */
  clearHeaderBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fee2e2' },
  clearHeaderText: { color: '#ef4444', fontSize: 12, fontWeight: '700' },

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
  itemFileBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, borderWidth: 1, borderStyle: 'dashed', borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: 'rgba(255,255,255,0.6)' },
  itemFileBtnDone: { borderColor: '#22c55e', backgroundColor: 'rgba(240,253,244,0.8)' },
  itemFileBtnText: { fontSize: 11, fontWeight: '700', flex: 1 },
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
  receiptBtn:      { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#6366f1', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 16, backgroundColor: '#eef2ff', marginBottom: 12 },
  receiptBtnTouch: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  receiptBtnDone:  { borderColor: '#22c55e', backgroundColor: '#f0fdf4' },
  receiptBtnText:  { flex: 1, fontSize: 14, fontWeight: '700', color: '#6366f1' },
  removeReceiptBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fef2f2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#fee2e2' },
  removeReceiptText: { fontSize: 11, fontWeight: '700', color: '#ef4444' },
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
