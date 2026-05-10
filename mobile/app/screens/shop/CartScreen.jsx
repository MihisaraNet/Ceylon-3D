import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, SafeAreaView,
  StatusBar, Platform, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
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
        <LinearGradient colors={['#10b981', '#34d399']} style={s.successCircle}>
          <Ionicons name="checkmark-sharp" size={48} color="#ffffff" />
        </LinearGradient>
        <Text style={s.successTitle}>Order placed</Text>
        <Text style={s.successSub}>
          Thank you! We've received your order and will begin processing it shortly.
        </Text>
        <TouchableOpacity style={s.continuBtnShadow} onPress={() => { setDone(false); nav.navigate('Browse'); }}>
          <LinearGradient colors={['#8b5cf6', '#d946ef']} start={{x:0,y:0}} end={{x:1,y:1}} style={s.continuBtn}>
            <Text style={s.continueText}>Continue Shopping</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  if (loading) return (
    <SafeAreaView style={s.safe}>
      <View style={s.centred}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    </SafeAreaView>
  );

  if (items.length === 0) return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <Text style={s.pageTitle}>Cart</Text>
      </View>
      <View style={s.centred}>
        <LinearGradient colors={['#f3e8ff', '#e0e7ff']} style={s.emptyIconBox}>
          <Ionicons name="cart-outline" size={48} color="#8b5cf6" />
        </LinearGradient>
        <Text style={s.emptyTitle}>Your cart is empty.</Text>
        <TouchableOpacity style={s.browseBtnShadow} onPress={() => nav.navigate('Browse')}>
          <LinearGradient colors={['#8b5cf6', '#ec4899']} start={{x:0,y:0}} end={{x:1,y:1}} style={s.browseBtn}>
            <Text style={s.browseBtnText}>Explore Shop</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <View style={s.topBar}>
        <Text style={s.pageTitle}>Cart <Text style={s.itemCountText}>({items.length})</Text></Text>
        <TouchableOpacity onPress={confirmClear}>
          <Text style={s.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#8b5cf6']} />}
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
          <TouchableOpacity style={s.checkoutBtnShadow} onPress={() => setCheckout(true)}>
            <LinearGradient colors={['#8b5cf6', '#3b82f6']} start={{x:0,y:0}} end={{x:1,y:1}} style={s.checkoutBtn}>
              <Text style={s.checkoutBtnText}>Checkout</Text>
            </LinearGradient>
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
              <Ionicons name={receipt ? "checkmark-circle" : "document-attach-outline"} size={20} color={receipt ? "#10b981" : "#8b5cf6"} />
              <Text style={[s.receiptBtnText, receipt && { color: '#10b981' }]}>
                {receipt ? 'Receipt Attached' : 'Attach Payment Proof (Optional)'}
              </Text>
              {receipt && (
                <TouchableOpacity onPress={() => setReceipt(null)} style={{ marginLeft: 'auto' }}>
                  <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '600' }}>Remove</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={s.placeBtnShadow} onPress={handlePlaceOrder} disabled={placing}>
              <LinearGradient colors={['#10b981', '#059669']} style={s.placeBtn}>
                {placing ? <ActivityIndicator color="#ffffff" /> : <Text style={s.placeBtnText}>Place Order</Text>}
              </LinearGradient>
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
  safe: { flex: 1, backgroundColor: '#f8fafc' },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 16 : 8, paddingBottom: 16 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  itemCountText: { fontSize: 20, color: '#94a3b8', fontWeight: '600' },
  clearText: { fontSize: 15, color: '#ef4444', fontWeight: '600' },

  centred: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyIconBox: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 24 },
  browseBtnShadow: { shadowColor: '#ec4899', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  browseBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 99 },
  browseBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },

  itemsContainer: { paddingHorizontal: 24, paddingTop: 8 },

  summaryCard: { backgroundColor: '#ffffff', marginHorizontal: 24, marginTop: 12, borderRadius: 24, padding: 24, shadowColor: '#1a1a1a', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sumLabel: { fontSize: 15, color: '#64748b' },
  sumVal: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  sumValFree: { fontSize: 15, fontWeight: '700', color: '#10b981' },
  sumDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 16 },
  totalLabel: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  totalVal: { fontSize: 18, fontWeight: '800', color: '#8b5cf6' },

  checkoutBtnShadow: { marginHorizontal: 24, marginTop: 24, shadowColor: '#3b82f6', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  checkoutBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  checkoutBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },

  formCard: { backgroundColor: '#ffffff', marginHorizontal: 24, marginTop: 24, borderRadius: 24, padding: 24, shadowColor: '#1a1a1a', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  fieldRow: { backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 12 },
  fieldInput: { paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#0f172a' },
  
  receiptBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: '#c4b5fd', borderRadius: 12, padding: 16, marginBottom: 24, backgroundColor: '#f8fafc' },
  receiptBtnDone: { borderColor: '#10b981', backgroundColor: '#ecfdf5', borderStyle: 'solid' },
  receiptBtnText: { fontSize: 14, fontWeight: '600', color: '#8b5cf6' },
  
  placeBtnShadow: { shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  placeBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', opacity: 1 },
  placeBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', marginTop: 16, paddingVertical: 8 },
  cancelText: { color: '#64748b', fontSize: 15, fontWeight: '600' },

  successScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f8fafc' },
  successCircle: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 12 },
  successSub: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  continuBtnShadow: { shadowColor: '#8b5cf6', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  continuBtn: { borderRadius: 99, paddingHorizontal: 32, paddingVertical: 16 },
  continueText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
});
