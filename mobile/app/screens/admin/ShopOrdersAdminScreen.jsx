/**
 * ShopOrdersAdminScreen.jsx — Admin Shop Order Management
 * Minimalist design
 */
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
    try { 
      await api.put(`/orders/admin/${id}/status`, { status }); 
      load(); 
    } catch (err) { 
      Alert.alert('Error', err.response?.data?.error || 'Failed'); 
    }
  };

  const setTracking = async (id) => {
    const tn = trackingInputs[id];
    if (!tn) return Alert.alert('Error', 'Enter a tracking number');
    
    try { 
      await api.put(`/orders/admin/${id}/tracking`, { trackingNumber: tn }); 
      load(); 
    } catch (err) { 
      Alert.alert('Error', err.response?.data?.error || 'Failed'); 
    }
  };

  const renderItem = ({ item }) => {
    const cfg = ORDER_STATUSES[item.status] || { label:item.status };
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
            <View style={s.badge}>
              <Text style={s.badgeText}>{cfg.label}</Text>
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

            <Text style={s.detailsTitle}>Tracking Number</Text>
            {item.trackingNumber && <Text style={s.trackVal}>Current: {item.trackingNumber}</Text>}
            <View style={s.trackRow}>
              <TextInput
                style={s.trackInput}
                value={trackingInputs[item._id] || ''}
                onChangeText={v => setTrackingInputs(p => ({...p,[item._id]:v}))}
                placeholder="Enter tracking number"
                placeholderTextColor="#999"
              />
              <TouchableOpacity style={s.trackBtn} onPress={() => setTracking(item._id)}>
                <Text style={s.trackBtnText}>Set</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.detailsTitle}>Status</Text>
            <View style={s.statusChips}>
              {STATUS_OPTIONS.map(st => (
                <TouchableOpacity key={st} style={[s.statusChip, item.status===st && s.statusChipActive]} onPress={() => updateStatus(item._id, st)}>
                  <Text style={[s.statusChipText, item.status===st && s.statusChipTextActive]}>{st}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) return <ActivityIndicator size="large" color="#000" style={{ marginTop:60 }} />;

  return (
    <FlatList
      data={orders}
      keyExtractor={i => i._id}
      renderItem={renderItem}
      contentContainerStyle={{ padding:16, gap:12, backgroundColor: '#ffffff', flexGrow: 1 }}
      ListEmptyComponent={<Text style={s.empty}>No orders</Text>}
    />
  );
}

const s = StyleSheet.create({
  card:          { backgroundColor:'#fff', borderRadius:8, padding:16, borderWidth: 1, borderColor: '#eee' },
  cardHeader:    { flexDirection:'row', justifyContent:'space-between' },
  orderId:       { fontSize:13, fontWeight:'700', color:'#000' },
  customerName:  { fontSize:15, fontWeight:'700', color:'#000', marginTop:2 },
  right:         { alignItems:'flex-end', gap:6 },
  total:         { fontSize:16, fontWeight:'800', color:'#000' },
  badge:         { borderRadius:4, paddingHorizontal:8, paddingVertical:4, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#eee' },
  badgeText:     { fontSize:10, fontWeight:'700', color: '#000', textTransform: 'uppercase' },
  details:       { borderTopWidth:1, borderTopColor:'#eee', marginTop:12, paddingTop:12 },
  detailsTitle:  { fontSize:12, fontWeight:'700', color:'#666', marginTop:10, marginBottom:4, textTransform: 'uppercase' },
  itemLine:      { fontSize:13, color:'#333', marginBottom:4 },
  addrText:      { fontSize:13, color:'#333' },
  trackVal:      { fontSize:13, color:'#000', fontWeight:'700', marginBottom:6 },
  trackRow:      { flexDirection:'row', gap:8, marginBottom:4 },
  trackInput:    { flex:1, backgroundColor:'#fff', borderWidth:1, borderColor:'#ccc', borderRadius:8, padding:10, fontSize:14, color:'#000' },
  trackBtn:      { backgroundColor:'#000', borderRadius:8, paddingHorizontal:16, justifyContent:'center' },
  trackBtnText:  { color:'#fff', fontWeight:'700' },
  statusChips:   { flexDirection:'row', flexWrap:'wrap', gap:8 },
  statusChip:    { backgroundColor:'#fff', borderWidth: 1, borderColor: '#ccc', borderRadius:8, paddingHorizontal:12, paddingVertical:8 },
  statusChipActive:{ backgroundColor:'#000', borderColor: '#000' },
  statusChipText:  { fontSize:12, fontWeight:'700', color:'#666' },
  statusChipTextActive: { color: '#fff' },
  empty:         { textAlign:'center', color:'#999', marginTop:60, fontSize:16 },
});
