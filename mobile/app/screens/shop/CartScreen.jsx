import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, SafeAreaView,
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
  const placingRef = useRef(false);
  const [receipt, setReceipt]   = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reloadCart();
    } finally {
      setRefreshing(false);
    }
  }, [reloadCart]);

  const confirmClear = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearCart },
      ]
    );
  };

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
    if (placingRef.current) return;
    placingRef.current = true;

    const { fullName, phone, address, city } = form;
    
    if (!fullName.trim()) { placingRef.current = false; return Alert.alert('Missing Info', 'Please enter your full name'); }
    if (!phone.trim())    { placingRef.current = false; return Alert.alert('Missing Info', 'Please enter your phone number'); }
    if (!address.trim())  { placingRef.current = false; return Alert.alert('Missing Info', 'Please enter your delivery address'); }
    if (!city.trim())     { placingRef.current = false; return Alert.alert('Missing Info', 'Please enter your city'); }
    
    if (!/^(?:0|94|\+94)[0-9]{9}$/.test(phone.replace(/[\s\-().]/g, ''))) {
      placingRef.current = false;
      return Alert.alert('Invalid Phone', 'Enter a valid phone number (e.g., 0712345678)');
    }

    setPlacing(true);
    try {
      const shipping   = `${fullName}\n${phone}\n${address}\n${city}`;
      const orderItems = items.map(i => ({ 
        productId: i.id, 
        productName: i.title, 
        quantity: i.quantity, 
        unitPrice: i.price 
      }));

      if (receipt) {
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
        await api.post('/orders', { shippingAddress: shipping, items: orderItems });
      }
      await clearCart();
      setDone(true);
      setCheckout(false);
    } catch (err) {
      Alert.alert('Order Failed', err.response?.data?.error || err.message || 'Failed to place order');
    } finally {
      setPlacing(false);
      placingRef.current = false;
    }
  };

  if (done) return (
    <SafeAreaView style={s.safe}>
      <View style={s.successScreen}>
        <View style={s.successCircle}>
          <Ionicons name="checkmark-sharp" size={48} color="#0f172a" />
        </View>
        <Text style={s.successTitle}>Order placed</Text>
        <Text style={s.successSub}>
          Thank you! We've received your order and will begin processing it shortly.
        </Text>
        <TouchableOpacity
          style={s.continuBtn}
          onPress={() => { setDone(false); nav.navigate('Browse'); }}
        >
          <Text style={s.continueText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  if (loading) return (
    <SafeAreaView style={s.safe}>
      <View style={s.centred}>
        <ActivityIndicator size="large" color="#0f172a" />
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
          <Ionicons name="bag-outline" size={48} color="#94a3b8" />
        </View>
        <Text style={s.emptyTitle}>Your bag is empty.</Text>
        <TouchableOpacity style={s.browseBtn} onPress={() => nav.navigate('Browse')}>
          <Text style={s.browseBtnText}>Explore Shop</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />

      <View style={s.topBar}>
        <Text style={s.pageTitle}>Cart <Text style={s.itemCountText}>({items.length})</Text></Text>
        <TouchableOpacity onPress={confirmClear}>
          <Text style={s.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={s.itemsContainer}>
          {items.map((item) => (
            <CartItemCard
              key={item.cartItemId?.toString()}
              item={item}
              onQtyChange={handleQtyChange}
              onRemove={removeFromCart}
              qtyError={qtyErr[item.cartItemId]}
            />
          ))}
        </View>

        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>Order Summary</Text>
          <View style={s.sumRow}>
            <Text style={s.sumLabel}>Subtotal</Text>
            <Text style={s.sumVal}>LKR {totalPrice.toFixed(2)}</Text>
          </View>
          <View style={s.sumRow}>
            <Text style={s.sumLabel}>Delivery</Text>
            <Text style={s.sumValFree}>Free</Text>
          </View>
          <View style={s.sumDivider} />
          <View style={s.sumRow}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalVal}>LKR {totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        {!checkout ? (
          <TouchableOpacity style={s.checkoutBtn} onPress={() => setCheckout(true)}>
            <Text style={s.checkoutBtnText}>Checkout</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.formCard}>
            <Text style={s.formTitle}>Delivery Details</Text>

            {[
              { key: 'fullName', label: 'Full Name',        keyboard: 'default' },
              { key: 'phone',    label: 'Phone Number',     keyboard: 'phone-pad' },
              { key: 'address',  label: 'Delivery Address', keyboard: 'default', multi: true },
              { key: 'city',     label: 'City',             keyboard: 'default' },
            ].map(({ key, label, keyboard, multi }) => (
              <View key={key} style={s.fieldRow}>
                <TextInput
                  style={[s.fieldInput, multi && { minHeight: 80, textAlignVertical: 'top' }]}
                  placeholder={label}
                  placeholderTextColor="#94a3b8"
                  value={form[key]}
                  onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
                  keyboardType={keyboard}
                  multiline={!!multi}
                />
              </View>
            ))}

            <TouchableOpacity style={[s.receiptBtn, receipt && s.receiptBtnDone]} onPress={pickReceipt}>
              <Ionicons name={receipt ? "checkmark-circle" : "image-outline"} size={20} color={receipt ? "#10b981" : "#64748b"} />
              <Text style={s.receiptBtnText}>
                {receipt ? 'Receipt Attached' : 'Attach Payment Proof (Optional)'}
              </Text>
              {receipt && (
                <TouchableOpacity onPress={() => setReceipt(null)} style={{ marginLeft: 'auto' }}>
                  <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '600' }}>Remove</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.placeBtn, placing && { opacity: 0.7 }]}
              onPress={handlePlaceOrder}
              disabled={placing}
            >
              {placing ? <ActivityIndicator color="#ffffff" /> : <Text style={s.placeBtnText}>Place Order</Text>}
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
  safe: { flex: 1, backgroundColor: '#fafafa' },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 16 : 8, paddingBottom: 16 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  itemCountText: { fontSize: 20, color: '#94a3b8', fontWeight: '600' },
  clearText: { fontSize: 15, color: '#ef4444', fontWeight: '600' },

  centred: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyIconBox: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 24 },
  browseBtn: { backgroundColor: '#0f172a', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  browseBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },

  itemsContainer: { paddingHorizontal: 24, paddingTop: 8 },

  summaryCard: { backgroundColor: '#ffffff', marginHorizontal: 24, marginTop: 12, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sumLabel: { fontSize: 15, color: '#64748b' },
  sumVal: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  sumValFree: { fontSize: 15, fontWeight: '600', color: '#10b981' },
  sumDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 16 },
  totalLabel: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  totalVal: { fontSize: 18, fontWeight: '800', color: '#0f172a' },

  checkoutBtn: { backgroundColor: '#0f172a', marginHorizontal: 24, marginTop: 24, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  checkoutBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },

  formCard: { backgroundColor: '#ffffff', marginHorizontal: 24, marginTop: 24, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  fieldRow: { backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 12 },
  fieldInput: { paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#0f172a' },
  
  receiptBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: '#cbd5e1', borderRadius: 12, padding: 16, marginBottom: 24, backgroundColor: '#f8fafc' },
  receiptBtnDone: { borderColor: '#10b981', backgroundColor: '#ecfdf5', borderStyle: 'solid' },
  receiptBtnText: { fontSize: 14, fontWeight: '500', color: '#475569' },
  
  placeBtn: { backgroundColor: '#0f172a', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  placeBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', marginTop: 16, paddingVertical: 8 },
  cancelText: { color: '#64748b', fontSize: 15, fontWeight: '500' },

  successScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fafafa' },
  successCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 12 },
  successSub: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  continuBtn: { backgroundColor: '#0f172a', borderRadius: 16, paddingHorizontal: 32, paddingVertical: 16 },
  continueText: { color: '#ffffff', fontWeight: '600', fontSize: 16 },
});
