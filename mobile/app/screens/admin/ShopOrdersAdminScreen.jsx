import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, SafeAreaView, StatusBar, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { ORDER_STATUSES } from '../../data/categories';

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function ShopOrdersAdminScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [trackingInputs, setTrackingInputs] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders/admin');
      setOrders(data);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/orders/admin/${id}/status`, { status });
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update status');
    }
  };

  const setTracking = async (id) => {
    const tn = trackingInputs[id];
    if (!tn) return Alert.alert('Error', 'Enter a tracking number');
    try {
      await api.put(`/orders/admin/${id}/tracking`, { trackingNumber: tn });
      load();
      Alert.alert('Success', 'Tracking number updated');
    } catch (err) {
      Alert.alert('Error', 'Failed to update tracking');
    }
  };

  const renderItem = ({ item }) => {
    const cfg = ORDER_STATUSES[item.status] || { label: item.status, color: '#6b7280' };
    const isOpen = expanded === item._id;
    const customerName = item.userId?.fullName || item.shippingAddress?.split('\n')[0] || 'Customer';

    return (
      <View style={[s.card, isOpen && s.cardExpanded]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => setExpanded(isOpen ? null : item._id)} style={s.cardHeader}>
          <View style={s.headerLeft}>
            <View style={s.idRow}>
              <Text style={s.orderId}>#{item._id.slice(-6).toUpperCase()}{item.category === 'STL' ? ' 🖨️' : ''}</Text>
              <View style={[s.statusBadge, { backgroundColor: cfg.color + '15' }]}>
                <View style={[s.statusDot, { backgroundColor: cfg.color }]} />
                <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            </View>
            <Text style={s.customerName}>{customerName}</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.price}>LKR {item.totalAmount?.toFixed(2)}</Text>
            <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#94a3b8" />
          </View>
        </TouchableOpacity>

        {isOpen && (
          <View style={s.details}>
            <Text style={s.sectionTitle}>Ordered Items</Text>
            <View style={s.itemsList}>
              {item.items?.map((it, idx) => (
                <View key={idx} style={s.orderItem}>
                  <View style={s.itemIconBg}>
                    <Ionicons name="cube-outline" size={14} color="#6366f1" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.itemName}>{it.productName}</Text>
                    <Text style={s.itemMeta}>Qty: {it.quantity} × LKR {it.price?.toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={s.addressBox}>
              <Text style={s.addressLabel}>Shipping Address</Text>
              <Text style={s.addressText}>{item.shippingAddress}</Text>
            </View>

            <Text style={s.sectionTitle}>Tracking Management</Text>
            {item.trackingNumber && (
              <View style={s.trackingBanner}>
                <Ionicons name="airplane-outline" size={16} color="#6366f1" />
                <Text style={s.trackingValText}>Current: {item.trackingNumber}</Text>
              </View>
            )}
            <View style={s.trackInputRow}>
              <TextInput
                style={s.trackInput}
                value={trackingInputs[item._id] || ''}
                onChangeText={v => setTrackingInputs(p => ({ ...p, [item._id]: v }))}
                placeholder="New tracking ID"
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity style={s.trackBtn} onPress={() => setTracking(item._id)}>
                <Text style={s.trackBtnText}>Update</Text>
              </TouchableOpacity>
            </View>

            <View style={s.divider} />

            <Text style={s.sectionTitle}>Update Progress</Text>
            <View style={s.chipsRow}>
              {STATUS_OPTIONS.map(st => (
                <TouchableOpacity
                  key={st}
                  style={[s.chip, item.status === st && { backgroundColor: '#6366f1', borderColor: '#6366f1' }]}
                  onPress={() => updateStatus(item._id, st)}
                >
                  <Text style={[s.chipText, item.status === st && { color: '#fff' }]}>{st}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f7ff" />
      <View style={s.headerContainer}>
        <Text style={s.title}>Shop Orders</Text>
        <View style={s.countBadge}><Text style={s.countText}>{orders.length}</Text></View>
      </View>

      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={i => i._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={s.empty}>No shop orders found.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f7ff' },
  headerContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: '900', color: '#1e1b4b', letterSpacing: -0.5 },
  countBadge: { backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  countText: { fontSize: 13, fontWeight: '900', color: '#6366f1' },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 15, elevation: 3, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  cardExpanded: { shadowOpacity: 0.08, shadowRadius: 20, elevation: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  headerLeft: { flex: 1, gap: 4 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  orderId: { fontSize: 14, fontWeight: '800', color: '#64748b' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  customerName: { fontSize: 17, fontWeight: '800', color: '#1e1b4b' },
  headerRight: { alignItems: 'flex-end', justifyContent: 'space-between', paddingVertical: 2 },
  price: { fontSize: 16, fontWeight: '900', color: '#6366f1' },

  details: { padding: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#f8fafc' },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#1e1b4b', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
  itemsList: { gap: 8, marginBottom: 20 },
  orderItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 10, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  itemIconBg: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center' },
  itemName: { fontSize: 14, fontWeight: '700', color: '#1e1b4b' },
  itemMeta: { fontSize: 12, color: '#64748b', fontWeight: '500' },

  addressBox: { backgroundColor: '#fff', padding: 14, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  addressLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  addressText: { fontSize: 13, color: '#1e1b4b', fontWeight: '600', lineHeight: 18 },

  trackingBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eef2ff', padding: 10, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#c7d2fe' },
  trackingValText: { fontSize: 13, fontWeight: '700', color: '#4338ca' },
  trackInputRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  trackInput: { flex: 1, height: 45, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 15, borderWidth: 1.5, borderColor: '#e2e8f0', fontSize: 14, color: '#1e1b4b', fontWeight: '600' },
  trackBtn: { backgroundColor: '#6366f1', paddingHorizontal: 15, borderRadius: 12, justifyContent: 'center' },
  trackBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 16 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#e2e8f0' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 100, fontSize: 16, fontWeight: '600' },
});
