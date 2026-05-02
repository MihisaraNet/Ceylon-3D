import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput } from 'react-native';
import api from '../../lib/api';
import { ORDER_STATUSES } from '../../data/categories';

const STATUS_OPTIONS = ['PENDING','PROCESSING','SHIPPED','DELIVERED','CANCELLED'];

export default function ShopOrdersAdminScreen() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [trackingInputs, setTrackingInputs] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/orders/admin'); setOrders(data); }
    catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    try { await api.put(`/orders/admin/${id}/status`, { status }); load(); }
    catch (err) { Alert.alert('Error', err.response?.data?.error || 'Failed'); }
  };

  const setTracking = async (id) => {
    const tn = trackingInputs[id];
    if (!tn) return Alert.alert('Error', 'Enter a tracking number');
    try { await api.put(`/orders/admin/${id}/tracking`, { trackingNumber: tn }); load(); }
    catch (err) { Alert.alert('Error', err.response?.data?.error || 'Failed'); }
  };

  const renderItem = ({ item }) => {
    const cfg = ORDER_STATUSES[item.status] || { label:item.status, color:'#6b7280' };
    const isOpen = expanded === item._id;
    const customerName = item.userId?.fullName || item.shippingAddress?.split('\n')[0] || 'Customer';
    return (
      <TouchableOpacity style={s.card} onPress={() => setExpanded(isOpen ? null : item._id)}>
        <View style={s.cardHeader}>
          <View>
            <Text style={s.orderId}>#{item._id.slice(-6).toUpperCase()}{item.category==='STL' ? ' 🖨️' : ''}</Text>
            <Text style={s.customerName}>{customerName}</Text>
          </View>
          <View style={s.right}>
            <Text style={s.total}>LKR {item.totalAmount?.toFixed(2)}</Text>
            <View style={[s.badge, { backgroundColor: cfg.color + '20' }]}>
              <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>
        </View>

        {isOpen && (
          <View style={s.details}>
            <Text style={s.detailsTitle}>Items</Text>
            {item.items?.map((i, idx) => (
              <Text key={idx} style={s.itemLine}>{i.productName} × {i.quantity} — LKR {i.price?.toFixed(2)}</Text>
            ))}
            <Text style={s.detailsTitle}>Shipping Address</Text>
            <Text style={s.addrText}>{item.shippingAddress}</Text>

            {/* Tracking */}
            <Text style={s.detailsTitle}>Tracking Number</Text>
            {item.trackingNumber && <Text style={s.trackVal}>Current: {item.trackingNumber}</Text>}
            <View style={s.trackRow}>
              <TextInput
                style={s.trackInput}
                value={trackingInputs[item._id] || ''}
                onChangeText={v => setTrackingInputs(p => ({...p,[item._id]:v}))}
                placeholder="Enter tracking number"
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity style={s.trackBtn} onPress={() => setTracking(item._id)}>
                <Text style={s.trackBtnText}>Set</Text>
              </TouchableOpacity>
            </View>

            {/* Status */}
            <Text style={s.detailsTitle}>Status</Text>
            <View style={s.statusChips}>
              {STATUS_OPTIONS.map(st => (
                <TouchableOpacity key={st} style={[s.statusChip, item.status===st && s.statusChipActive]} onPress={() => updateStatus(item._id, st)}>
                  <Text style={[s.statusChipText, item.status===st && { color:'#fff' }]}>{st}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) return <ActivityIndicator size="large" color="#6366f1" style={{ marginTop:60 }} />;

  return (
    <FlatList
      data={orders}
      keyExtractor={i => i._id}
      renderItem={renderItem}
      contentContainerStyle={{ padding:12, gap:10 }}
      ListEmptyComponent={<Text style={s.empty}>No orders</Text>}
    />
  );
}

const s = StyleSheet.create({
  card:          { backgroundColor:'#fff', borderRadius:14, padding:16, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:6, elevation:2 },
  cardHeader:    { flexDirection:'row', justifyContent:'space-between' },
  orderId:       { fontSize:13, fontWeight:'700', color:'#111827' },
  customerName:  { fontSize:15, fontWeight:'700', color:'#111827', marginTop:2 },
  right:         { alignItems:'flex-end', gap:6 },
  total:         { fontSize:16, fontWeight:'800', color:'#6366f1' },
  badge:         { borderRadius:999, paddingHorizontal:10, paddingVertical:4 },
  badgeText:     { fontSize:12, fontWeight:'700' },
  details:       { borderTopWidth:1, borderTopColor:'#f3f4f6', marginTop:12, paddingTop:12 },
  detailsTitle:  { fontSize:13, fontWeight:'700', color:'#374151', marginTop:10, marginBottom:4 },
  itemLine:      { fontSize:13, color:'#6b7280', marginBottom:2 },
  addrText:      { fontSize:13, color:'#374151' },
  trackVal:      { fontSize:13, color:'#6366f1', fontWeight:'600', marginBottom:6 },
  trackRow:      { flexDirection:'row', gap:8, marginBottom:4 },
  trackInput:    { flex:1, backgroundColor:'#f9fafb', borderWidth:1, borderColor:'#e5e7eb', borderRadius:10, padding:10, fontSize:14, color:'#111827' },
  trackBtn:      { backgroundColor:'#6366f1', borderRadius:10, paddingHorizontal:16, justifyContent:'center' },
  trackBtnText:  { color:'#fff', fontWeight:'700' },
  statusChips:   { flexDirection:'row', flexWrap:'wrap', gap:6 },
  statusChip:    { backgroundColor:'#f3f4f6', borderRadius:999, paddingHorizontal:10, paddingVertical:6 },
  statusChipActive:{ backgroundColor:'#6366f1' },
  statusChipText:  { fontSize:12, fontWeight:'600', color:'#374151' },
  empty:         { textAlign:'center', color:'#9ca3af', marginTop:60, fontSize:16 },
});
