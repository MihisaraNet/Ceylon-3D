import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { STL_STATUSES } from '../../data/categories';

const STATUS_OPTIONS = ['PENDING_QUOTE','QUOTED','CONFIRMED','PRINTING','READY','DELIVERED','CANCELLED'];

export default function StlOrdersAdminScreen() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/stl-orders/admin'); setOrders(data); }
    catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    try { await api.put(`/stl-orders/admin/${id}/status`, { status }); load(); }
    catch (err) { Alert.alert('Error', err.response?.data?.error || 'Failed'); }
  };

  const deleteOrder = (id) => {
    Alert.alert('Delete', 'Delete this STL order and its file?', [
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive', onPress: async () => {
        try { await api.delete(`/stl-orders/admin/${id}`); load(); }
        catch (err) { Alert.alert('Error', err.response?.data?.error || 'Delete failed'); }
      }},
    ]);
  };

  const renderItem = ({ item }) => {
    const cfg = STL_STATUSES[item.status] || { label:item.status, color:'#6b7280' };
    const isOpen = expanded === item._id;
    return (
      <TouchableOpacity style={s.card} onPress={() => setExpanded(isOpen ? null : item._id)}>
        <View style={s.cardHeader}>
          <View>
            <Text style={s.orderId}>#{item._id.slice(-6).toUpperCase()}</Text>
            <Text style={s.customerName}>{item.customerName}</Text>
            <Text style={s.customerEmail}>{item.customerEmail}</Text>
          </View>
          <View style={s.right}>
            {item.estimatedPrice && <Text style={s.price}>LKR {item.estimatedPrice?.toFixed(2)}</Text>}
            <View style={[s.badge, { backgroundColor: cfg.color + '20' }]}>
              <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>
        </View>

        {isOpen && (
          <View style={s.details}>
            <Info label="File"     value={item.fileName?.replace(/^[0-9a-f-]+-/i,'')} />
            <Info label="Material" value={item.material} />
            <Info label="Qty"      value={String(item.quantity)} />
            {item.phone   && <Info label="Phone"   value={item.phone} />}
            {item.address && <Info label="Address" value={item.address} />}
            {item.note    && <View style={s.noteBox}><Text style={s.noteText}>Note: {item.note}</Text></View>}
            {item.weightGrams     && <Info label="Weight"     value={`${item.weightGrams}g`} />}
            {item.printTimeHours != null && <Info label="Print Time" value={`${item.printTimeHours}h ${item.printTimeMinutes}m`} />}
            <Text style={s.statusLabel}>Change Status:</Text>
            <View style={s.statusChips}>
              {STATUS_OPTIONS.map(st => (
                <TouchableOpacity key={st} style={[s.statusChip, item.status===st && s.statusChipActive]} onPress={() => updateStatus(item._id, st)}>
                  <Text style={[s.statusChipText, item.status===st && { color:'#fff' }]}>{st.replace('_',' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.deleteBtn} onPress={() => deleteOrder(item._id)}>
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
              <Text style={s.deleteBtnText}> Delete Order</Text>
            </TouchableOpacity>
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
      ListEmptyComponent={<Text style={s.empty}>No STL orders</Text>}
    />
  );
}

const Info = ({ label, value }) => (
  <View style={{ flexDirection:'row', marginBottom:4 }}>
    <Text style={{ fontSize:13, color:'#9ca3af', width:80 }}>{label}:</Text>
    <Text style={{ fontSize:13, color:'#374151', flex:1 }}>{value}</Text>
  </View>
);

const s = StyleSheet.create({
  card:          { backgroundColor:'#fff', borderRadius:14, padding:16, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:6, elevation:2 },
  cardHeader:    { flexDirection:'row', justifyContent:'space-between' },
  orderId:       { fontSize:13, fontWeight:'700', color:'#111827' },
  customerName:  { fontSize:15, fontWeight:'700', color:'#111827', marginTop:2 },
  customerEmail: { fontSize:13, color:'#6b7280' },
  right:         { alignItems:'flex-end', gap:6 },
  price:         { fontSize:16, fontWeight:'800', color:'#6366f1' },
  badge:         { borderRadius:999, paddingHorizontal:10, paddingVertical:4 },
  badgeText:     { fontSize:12, fontWeight:'700' },
  details:       { borderTopWidth:1, borderTopColor:'#f3f4f6', marginTop:12, paddingTop:12 },
  noteBox:       { backgroundColor:'#fef3c7', borderRadius:8, padding:8, marginBottom:6 },
  noteText:      { fontSize:13, color:'#92400e' },
  statusLabel:   { fontSize:13, fontWeight:'700', color:'#374151', marginTop:8, marginBottom:6 },
  statusChips:   { flexDirection:'row', flexWrap:'wrap', gap:6, marginBottom:12 },
  statusChip:    { backgroundColor:'#f3f4f6', borderRadius:999, paddingHorizontal:10, paddingVertical:6 },
  statusChipActive: { backgroundColor:'#6366f1' },
  statusChipText:   { fontSize:12, fontWeight:'600', color:'#374151' },
  deleteBtn:     { flexDirection:'row', alignItems:'center', padding:10, borderWidth:1.5, borderColor:'#ef4444', borderRadius:10, alignSelf:'flex-start' },
  deleteBtnText: { color:'#ef4444', fontWeight:'700', fontSize:13 },
  empty:         { textAlign:'center', color:'#9ca3af', marginTop:60, fontSize:16 },
});
