/**
 * ShopOrdersAdminScreen.jsx — Admin Shop Order Management
 *
 * Modern, colorful and simple design.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, SafeAreaView, StatusBar } from 'react-native';
import api from '../../lib/api';
import { ORDER_STATUSES } from '../../data/categories';
import { Ionicons } from '@expo/vector-icons';

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
      Alert.alert('Error', 'Update failed'); 
    }
  };

  const setTracking = async (id) => {
    const tn = trackingInputs[id];
    if (!tn) return Alert.alert('Error', 'Enter a tracking number');
    try { 
      await api.put(`/orders/admin/${id}/tracking`, { trackingNumber: tn }); 
      load(); 
    } catch (err) { 
      Alert.alert('Error', 'Update failed'); 
    }
  };

  const renderItem = ({ item }) => {
    const cfg = ORDER_STATUSES[item.status] || { label:item.status, color:'#64748b' };
    const isOpen = expanded === item._id;
    const customerName = item.userId?.fullName || 'Guest Customer';
    return (
      <TouchableOpacity style={s.card} onPress={() => setExpanded(isOpen ? null : item._id)} activeOpacity={0.9}>
        <View style={s.cardHeader}>
          <View>
            <Text style={s.orderId}>ORDER #{item._id.slice(-6).toUpperCase()}</Text>
            <Text style={s.customerName}>{customerName}</Text>
          </View>
          <View style={s.right}>
            <Text style={s.total}>LKR {item.totalAmount?.toFixed(0)}</Text>
            <View style={[s.badge, { backgroundColor: cfg.color + '15', borderColor: cfg.color + '30' }]}>
              <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>
        </View>

        {isOpen && (
          <View style={s.details}>
            <Text style={s.detailsTitle}>Items</Text>
            {item.items?.map((i, idx) => (
              <Text key={idx} style={s.itemLine}>{i.productName} × {i.quantity} — LKR {i.price?.toFixed(0)}</Text>
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
                placeholder="Enter tracking #"
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity style={s.trackBtn} onPress={() => setTracking(item._id)}>
                <Text style={s.trackBtnText}>Set</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.detailsTitle}>Update Status</Text>
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

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={s.header}>
        <Text style={s.headerTitle}>Shop Orders</Text>
        <TouchableOpacity style={s.refreshBtn} onPress={load}>
          <Ionicons name="refresh" size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#6366f1" size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={i => i._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          ListEmptyComponent={<Text style={s.empty}>No shop orders found</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#f8fafc' },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  headerTitle:    { fontSize: 28, fontWeight: '900', color: '#1e293b' },
  refreshBtn:     { backgroundColor: '#f5f3ff', padding: 10, borderRadius: 12 },

  card:           { backgroundColor:'#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10 },
  cardHeader:     { flexDirection:'row', justifyContent:'space-between' },
  orderId:        { fontSize:11, fontWeight:'900', color:'#94a3b8', letterSpacing: 1 },
  customerName:   { fontSize:16, fontWeight:'800', color:'#1e293b', marginTop:2 },
  right:          { alignItems:'flex-end', gap:8 },
  total:          { fontSize:18, fontWeight:'900', color:'#6366f1' },
  badge:          { borderRadius:10, paddingHorizontal:10, paddingVertical:6, borderWidth: 1 },
  badgeText:      { fontSize:10, fontWeight:'800', textTransform: 'uppercase' },
  
  details:        { borderTopWidth:1, borderTopColor:'#f1f5f9', marginTop:16, paddingTop:16 },
  detailsTitle:   { fontSize:11, fontWeight:'900', color:'#94a3b8', letterSpacing: 1, marginTop:12, marginBottom:8, textTransform: 'uppercase' },
  itemLine:       { fontSize:14, color:'#475569', marginBottom:4, fontWeight: '600' },
  addrText:       { fontSize:14, color:'#475569', lineHeight: 20 },
  trackVal:       { fontSize:14, color:'#6366f1', fontWeight:'800', marginBottom:8 },
  trackRow:       { flexDirection:'row', gap:8, marginBottom:16 },
  trackInput:     { flex:1, backgroundColor:'#f8fafc', borderWidth:1, borderColor:'#f1f5f9', borderRadius:14, padding:12, fontSize:14, color:'#1e293b' },
  trackBtn:       { backgroundColor:'#6366f1', borderRadius:14, paddingHorizontal:20, justifyContent:'center' },
  trackBtnText:   { color:'#fff', fontWeight:'800' },
  
  statusChips:    { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom: 8 },
  statusChip:     { backgroundColor:'#f1f5f9', borderRadius:12, paddingHorizontal:12, paddingVertical:10 },
  statusChipActive:{ backgroundColor:'#6366f1' },
  statusChipText: { fontSize:12, fontWeight:'700', color:'#64748b' },
  empty:          { textAlign:'center', color:'#94a3b8', marginTop:60, fontWeight: '700' },
});
