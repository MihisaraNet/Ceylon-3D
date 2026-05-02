/**
 * CartScreen.jsx — Premium Checkout Experience
 * 
 * Attractive, modern design with a simplified, 
 * high-end feel and premium summary section.
 */
import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, StyleSheet,
  TextInput, Alert, ActivityIndicator, SafeAreaView, StatusBar, Dimensions,
} from 'react-native';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { getImageUri } from '../../lib/config';
import api from '../../lib/api';

const { height } = Dimensions.get('window');

export default function CartScreen() {
  const { cartItems, totalAmount, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  
  const [shippingAddress, setAddress] = useState(user?.address || '');
  const [checkingOut, setCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    if (!shippingAddress.trim()) {
      Alert.alert('Address Missing', 'Please provide a valid delivery address.');
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
      Alert.alert('Order Placed', 'Your request has been received!', [
        { text: 'Great', onPress: () => clearCart() }
      ]);
    } catch (err) {
      Alert.alert('Checkout Failed', err.response?.data?.error || 'System error. Try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  const renderItem = ({ item }) => {
    const p = item.productId;
    const imgUri = getImageUri(p.imagePath);

    return (
      <View style={s.itemCard}>
        <View style={s.itemImgWrap}>
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={s.itemImg} />
          ) : (
            <View style={s.itemPH}><Ionicons name="cube-outline" size={20} color="#94a3b8" /></View>
          )}
        </View>

        <View style={s.itemInfo}>
          <View>
            <Text style={s.itemName} numberOfLines={1}>{p.name}</Text>
            <Text style={s.itemPrice}>LKR {p.price?.toFixed(0)}</Text>
          </View>
          
          <View style={s.itemControls}>
            <View style={s.qtyPicker}>
              <TouchableOpacity style={s.qtyBtn} onPress={() => updateQuantity(p._id, Math.max(1, item.quantity - 1))}>
                <Ionicons name="remove" size={14} color="#0f172a" />
              </TouchableOpacity>
              <Text style={s.qtyVal}>{item.quantity}</Text>
              <TouchableOpacity style={s.qtyBtn} onPress={() => updateQuantity(p._id, item.quantity + 1)}>
                <Ionicons name="add" size={14} color="#0f172a" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity onPress={() => removeFromCart(p._id)} style={s.trashBtn}>
              <Ionicons name="trash-outline" size={18} color="#f43f5e" />
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
        <View>
          <Text style={s.headerTitle}>Bag</Text>
          <Text style={s.headerSub}>{cartItems.length} items ready to ship</Text>
        </View>
        {cartItems.length > 0 && (
          <TouchableOpacity onPress={clearCart}>
            <Text style={s.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {cartItems.length === 0 ? (
        <View style={s.emptyState}>
          <View style={s.emptyIcon}>
            <Ionicons name="bag-outline" size={64} color="#e2e8f0" />
          </View>
          <Text style={s.emptyTitle}>Empty Bag</Text>
          <Text style={s.emptyDesc}>Start adding items from the shop.</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={cartItems}
            keyExtractor={item => item.productId._id}
            renderItem={renderItem}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
          />

          <View style={s.checkoutSheet}>
            <Text style={s.label}>DELIVERY ADDRESS</Text>
            <TextInput
              style={s.addressField}
              value={shippingAddress}
              onChangeText={setAddress}
              placeholder="Where should we send this?"
              placeholderTextColor="#94a3b8"
              multiline
            />

            <View style={s.divider} />

            <View style={s.totalsRow}>
              <Text style={s.totalLabel}>Total Amount</Text>
              <Text style={s.totalValue}>LKR {totalAmount?.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              style={s.checkoutBtn}
              onPress={handleCheckout}
              disabled={checkingOut}
              activeOpacity={0.9}
            >
              {checkingOut ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.checkoutBtnText}>Confirm Order</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 24 },
  headerTitle: { fontSize: 36, fontWeight: '900', color: '#0f172a', letterSpacing: -1.5 },
  headerSub: { fontSize: 14, color: '#64748b', fontWeight: '600', marginTop: 2 },
  clearText: { color: '#f43f5e', fontWeight: '800', fontSize: 13 },

  list: { padding: 24, paddingBottom: height * 0.4 },
  itemCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 24, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10 },
  itemImgWrap: { width: 80, height: 80, borderRadius: 16, backgroundColor: '#f8fafc', overflow: 'hidden' },
  itemImg: { width: '100%', height: '100%' },
  itemPH: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  itemInfo: { flex: 1, marginLeft: 16, justifyContent: 'space-between' },
  itemName: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  itemPrice: { fontSize: 14, fontWeight: '700', color: '#6366f1', marginTop: 2 },
  itemControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  
  qtyPicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#f1f5f9' },
  qtyBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  qtyVal: { marginHorizontal: 12, fontSize: 14, fontWeight: '800', color: '#0f172a' },
  trashBtn: { padding: 8 },

  checkoutSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 32, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 15 },
  label: { fontSize: 11, fontWeight: '900', color: '#94a3b8', letterSpacing: 1.5, marginBottom: 12 },
  addressField: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 18, fontSize: 14, color: '#1e293b', fontWeight: '600', borderWidth: 1, borderColor: '#f1f5f9', minHeight: 80 },
  
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 24 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#64748b' },
  totalValue: { fontSize: 24, fontWeight: '900', color: '#0f172a' },

  checkoutBtn: { backgroundColor: '#0f172a', borderRadius: 24, height: 68, justifyContent: 'center', alignItems: 'center', shadowColor: '#0f172a', shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 },
  checkoutBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyIcon: { backgroundColor: '#f8fafc', padding: 32, borderRadius: 36, marginBottom: 24 },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  emptyDesc: { fontSize: 15, color: '#94a3b8', marginTop: 8, fontWeight: '600' },
});
