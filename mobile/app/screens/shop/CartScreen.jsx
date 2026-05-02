/**
 * CartScreen.jsx — Shopping Cart & Checkout Flow
 *
 * Displays the user's cart items with full checkout functionality.
 * Minimalist, modern layout with simple colors.
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
  const [qtyErr,  setQtyErr]     = useState({});
  const [receipt, setReceipt]   = useState(null);
  const [itemFiles, setItemFiles] = useState({});
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
    setItemFiles(prev => ({ ...prev, [cartItemId]: fileObj }));
    setUploadingFile(prev => ({ ...prev, [cartItemId]: true }));
    try {
      const fd = new FormData();
      fd.append('customFile', fileObj);
      await api.put(`/cart/${cartItemId}/file`, fd,
        { headers: { 'Content-Type': 'multipart/form-data' } });
    } catch (err) {
      Alert.alert('Upload Failed', err.response?.data?.error || 'Could not attach file');
      setItemFiles(prev => ({ ...prev, [cartItemId]: null }));
    } finally {
      setUploadingFile(prev => ({ ...prev, [cartItemId]: false }));
    }
  };

  const removeItemFile = async (cartItemId) => {
    setItemFiles(prev => ({ ...prev, [cartItemId]: null }));
    try {
      await api.put(`/cart/${cartItemId}/file`, { removeFile: true });
    } catch (_) { }
  };

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

      if (receipt) {
        const fd = new FormData();
        fd.append('shippingAddress', shipping);
        fd.append('items',           JSON.stringify(orderItems));
        fd.append('receipt', receipt);
        await api.post('/orders', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/orders', { shippingAddress: shipping, items: orderItems });
      }
      await clearCart();
      setDone(true);
      setCheckout(false);
    } catch (err) {
      Alert.alert('Order Failed', err.response?.data?.error || err.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (done) return (
    <SafeAreaView style={s.safe}>
      <View style={s.successScreen}>
        <View style={s.successCircle}>
          <Ionicons name="checkmark-sharp" size={48} color="#fff" />
        </View>
        <Text style={s.successTitle}>Order Placed</Text>
        <Text style={s.successSub}>
          Thank you. Your order has been received.{'\n'}We'll be in touch soon.
        </Text>
        <TouchableOpacity
          style={s.continuBtn}
          onPress={() => { setDone(false); nav.navigate('Browse'); }}
          activeOpacity={0.88}
        >
          <Text style={s.continueText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  if (loading) return (
    <SafeAreaView style={s.safe}>
      <View style={s.centred}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={s.loadText}>Loading cart…</Text>
      </View>
    </SafeAreaView>
  );

  if (items.length === 0) return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <Text style={s.pageTitle}>Cart</Text>
      </View>
      <View style={s.centred}>
        <View style={s.emptyIconBox}>
          <Ionicons name="cart-outline" size={48} color="#000" />
        </View>
        <Text style={s.emptyTitle}>Your cart is empty</Text>
        <Text style={s.emptySub}>Browse products and add something you like.</Text>
        <TouchableOpacity style={s.browseBtn} onPress={() => nav.navigate('Browse')} activeOpacity={0.88}>
          <Text style={s.browseBtnText}>Browse Products</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={s.topBar}>
        <Text style={s.pageTitle}>Cart</Text>
        <View style={s.itemCountBubble}>
          <Text style={s.itemCountText}>{items.length}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#000" />
        }
      >
        <View style={{ paddingHorizontal: 16, gap: 12, paddingTop: 8 }}>
          {items.map((item, idx) => (
            <View key={item.cartItemId?.toString()} style={s.itemCard}>
              <View style={s.accentBar} />
              {item.image ? (
                <Image source={{ uri: item.image }} style={s.itemImg} resizeMode="cover" />
              ) : (
                <View style={[s.itemImg, s.imgPH]}>
                  <Ionicons name="cube-outline" size={24} color="#666" />
                </View>
              )}

              <View style={s.itemBody}>
                <Text style={s.itemName} numberOfLines={2}>{item.title}</Text>
                <Text style={s.itemPrice}>LKR {item.price?.toFixed(2)}</Text>

                <View style={s.qtyRow}>
                  <TouchableOpacity
                    style={s.qtyBtn}
                    onPress={() => handleQtyChange(item.cartItemId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Ionicons name="remove" size={14} color={item.quantity <= 1 ? '#ccc' : '#000'} />
                  </TouchableOpacity>
                  <Text style={s.qtyVal}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={s.qtyBtn}
                    onPress={() => handleQtyChange(item.cartItemId, item.quantity + 1)}
                  >
                    <Ionicons name="add" size={14} color="#000" />
                  </TouchableOpacity>
                  <TouchableOpacity style={s.removeBtn} onPress={() => removeFromCart(item.cartItemId)}>
                    <Text style={s.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>

                {qtyErr[item.cartItemId] && (
                  <Text style={s.qtyErrText}>{qtyErr[item.cartItemId]}</Text>
                )}

                <TouchableOpacity
                  style={[s.itemFileBtn, itemFiles[item.cartItemId] && s.itemFileBtnDone]}
                  onPress={() => pickItemFile(item.cartItemId)}
                  activeOpacity={0.8}
                >
                  {uploadingFile[item.cartItemId] ? (
                    <ActivityIndicator size={12} color="#000" />
                  ) : (
                    <Ionicons
                      name={itemFiles[item.cartItemId] ? 'checkmark' : 'attach'}
                      size={14}
                      color={itemFiles[item.cartItemId] ? '#000' : '#666'}
                    />
                  )}
                  <Text style={[s.itemFileBtnText, { color: itemFiles[item.cartItemId] ? '#000' : '#666' }]} numberOfLines={1}>
                    {uploadingFile[item.cartItemId] ? 'Uploading…' : itemFiles[item.cartItemId] ? itemFiles[item.cartItemId].name : 'Attach design file'}
                  </Text>
                  {itemFiles[item.cartItemId] && !uploadingFile[item.cartItemId] && (
                    <TouchableOpacity onPress={() => removeItemFile(item.cartItemId)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Ionicons name="close" size={14} color="#666" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={s.lineTotal}>
                LKR{'\n'}{(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>Summary</Text>
          <View style={s.sumRow}>
            <Text style={s.sumLabel}>Subtotal</Text>
            <Text style={s.sumVal}>LKR {totalPrice.toFixed(2)}</Text>
          </View>
          <View style={s.sumRow}>
            <Text style={s.sumLabel}>Delivery</Text>
            <Text style={[s.sumVal, { fontWeight: '700' }]}>FREE</Text>
          </View>
          <View style={s.sumDivider} />
          <View style={s.sumRow}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalVal}>LKR {totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        <View style={s.codBanner}>
          <View>
            <Text style={s.codTitle}>Cash on Delivery</Text>
            <Text style={s.codSub}>Pay when your order arrives</Text>
          </View>
        </View>

        {!checkout ? (
          <TouchableOpacity style={s.checkoutBtn} onPress={() => setCheckout(true)} activeOpacity={0.88}>
            <Text style={s.checkoutBtnText}>Checkout</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.formCard}>
            <Text style={s.formTitle}>Delivery Details</Text>
            {[
              { key: 'fullName', label: 'Full Name', keyboard: 'default' },
              { key: 'phone',    label: 'Phone Number', keyboard: 'phone-pad' },
              { key: 'address',  label: 'Delivery Address', keyboard: 'default', multi: true },
              { key: 'city',     label: 'City', keyboard: 'default' },
            ].map(({ key, label, keyboard, multi }) => (
              <View key={key} style={s.fieldRow}>
                <TextInput
                  style={[s.fieldInput, multi && { minHeight: 60, textAlignVertical: 'top' }]}
                  placeholder={label}
                  placeholderTextColor="#999"
                  value={form[key]}
                  onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
                  keyboardType={keyboard}
                  multiline={!!multi}
                />
              </View>
            ))}

            <TouchableOpacity style={[s.receiptBtn, receipt && s.receiptBtnDone]} onPress={pickReceipt} activeOpacity={0.85}>
              <Text style={s.receiptBtnText}>
                {receipt ? `Receipt: ${receipt.name}` : 'Attach Payment Proof (optional)'}
              </Text>
              {receipt && (
                <TouchableOpacity onPress={() => setReceipt(null)} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={[s.placeBtn, placing && { opacity: 0.7 }]} onPress={handlePlaceOrder} disabled={placing} activeOpacity={0.88}>
              {placing ? <ActivityIndicator color="#fff" /> : <Text style={s.placeBtnText}>Place Order</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={s.cancelBtn} onPress={() => setCheckout(false)}>
              <Text style={s.cancelText}>Back to Cart</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#ffffff' },

  topBar:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 14 : 4, paddingBottom: 16 },
  pageTitle:       { fontSize: 24, fontWeight: '800', color: '#000', letterSpacing: -0.5 },
  itemCountBubble: { backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#eee' },
  itemCountText:   { color: '#000', fontSize: 13, fontWeight: '700' },

  centred:         { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  loadText:        { color: '#666', fontSize: 14, fontWeight: '500' },
  emptyIconBox:    { backgroundColor: '#f9f9f9', borderRadius: 24, padding: 24, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  emptyTitle:      { fontSize: 20, fontWeight: '800', color: '#000' },
  emptySub:        { fontSize: 14, color: '#666', textAlign: 'center' },
  browseBtn:       { backgroundColor: '#000', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 14, marginTop: 12 },
  browseBtnText:   { color: '#fff', fontWeight: '700', fontSize: 14 },

  itemCard:        { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'flex-start', borderWidth: 1, borderColor: '#eaeaea' },
  accentBar:       { width: 4, borderRadius: 4, marginRight: 12, alignSelf: 'stretch', backgroundColor: '#000' },
  itemImg:         { width: 64, height: 64, borderRadius: 8, marginRight: 12, backgroundColor: '#f9f9f9' },
  imgPH:           { justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  itemBody:        { flex: 1, gap: 4 },
  itemName:        { fontSize: 14, fontWeight: '700', color: '#000' },
  itemPrice:       { fontSize: 13, color: '#555', fontWeight: '600' },
  qtyRow:          { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  qtyBtn:          { width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa' },
  qtyVal:          { fontSize: 14, fontWeight: '700', color: '#000', minWidth: 20, textAlign: 'center' },
  removeBtn:       { marginLeft: 8 },
  removeBtnText:   { fontSize: 12, color: '#999', fontWeight: '600', textDecorationLine: 'underline' },
  qtyErrText:      { fontSize: 11, color: '#000', fontWeight: '500', marginTop: 2 },
  itemFileBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, borderWidth: 1, borderColor: '#eee', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: '#f9f9f9' },
  itemFileBtnDone: { borderColor: '#000', backgroundColor: '#f5f5f5' },
  itemFileBtnText: { fontSize: 11, fontWeight: '600', flex: 1 },
  lineTotal:       { fontSize: 12, fontWeight: '800', textAlign: 'right', minWidth: 60, color: '#000' },

  summaryCard:     { backgroundColor: '#fafafa', marginHorizontal: 16, marginTop: 16, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#eee' },
  summaryTitle:    { fontSize: 16, fontWeight: '800', color: '#000', marginBottom: 16 },
  sumRow:          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sumLabel:        { fontSize: 14, color: '#555' },
  sumVal:          { fontSize: 14, fontWeight: '600', color: '#000' },
  sumDivider:      { height: 1, backgroundColor: '#ddd', marginVertical: 12 },
  totalLabel:      { fontSize: 16, fontWeight: '800', color: '#000' },
  totalVal:        { fontSize: 18, fontWeight: '800', color: '#000' },

  codBanner:       { marginHorizontal: 16, marginTop: 16, borderRadius: 8, padding: 16, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee' },
  codTitle:        { fontSize: 14, fontWeight: '700', color: '#000' },
  codSub:          { fontSize: 13, color: '#666', marginTop: 4 },

  checkoutBtn:     { backgroundColor: '#000', marginHorizontal: 16, marginTop: 24, borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  checkoutBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  formCard:        { backgroundColor: '#fafafa', marginHorizontal: 16, marginTop: 24, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#eee' },
  formTitle:       { fontSize: 16, fontWeight: '800', color: '#000', marginBottom: 16 },
  fieldRow:        { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 12, paddingHorizontal: 12 },
  fieldInput:      { paddingVertical: 12, fontSize: 14, color: '#000' },
  receiptBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, backgroundColor: '#fff', marginBottom: 16 },
  receiptBtnDone:  { borderColor: '#000' },
  receiptBtnText:  { fontSize: 13, fontWeight: '600', color: '#333' },
  placeBtn:        { backgroundColor: '#000', borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  placeBtnText:    { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn:       { alignItems: 'center', padding: 16, marginTop: 8 },
  cancelText:      { color: '#666', fontSize: 14, fontWeight: '600' },

  successScreen:   { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#ffffff' },
  successCircle:   { width: 80, height: 80, borderRadius: 40, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successTitle:    { fontSize: 24, fontWeight: '800', color: '#000', marginBottom: 12 },
  successSub:      { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  continuBtn:      { backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 14 },
  continueText:    { color: '#000', fontWeight: '700', fontSize: 14 },
});
