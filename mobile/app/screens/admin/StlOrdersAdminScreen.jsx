/**
 * StlOrdersAdminScreen.jsx — Admin STL / 3D Print Order Management
 * Minimalist design
 */
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
    try { 
      await api.put(`/stl-orders/admin/${id}/status`, { status }); 
      load(); 
    } catch (err) { 
      Alert.alert('Error', err.response?.data?.error || 'Failed'); 
    }
  };

  const deleteOrder = (id) => {
    Alert.alert('Delete', 'Delete this STL order and its file?', [
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive', onPress: async () => {
        try { 
          await api.delete(`/stl-orders/admin/${id}`); 
          load(); 
        } catch (err) { 
          Alert.alert('Error', err.response?.data?.error || 'Delete failed'); 
        }
      }},
    ]);
  };

  const renderItem = ({ item }) => {
    const cfg = STL_STATUSES[item.status] || { label:item.status };
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
            <View style={s.badge}>
              <Text style={s.badgeText}>{cfg.label}</Text>
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
            
            <Text style={s.statusLabel}>CHANGE STATUS</Text>
            <View style={s.statusChips}>
              {STATUS_OPTIONS.map(st => (
                <TouchableOpacity key={st} style={[s.statusChip, item.status===st && s.statusChipActive]} onPress={() => updateStatus(item._id, st)}>
                  <Text style={[s.statusChipText, item.status===st && s.statusChipTextActive]}>{st.replace('_',' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.deleteBtn} onPress={() => deleteOrder(item._id)}>
              <Ionicons name="trash-outline" size={16} color="#000" />
              <Text style={s.deleteBtnText}> Delete Order</Text>
            </TouchableOpacity>
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
      ListEmptyComponent={<Text style={s.empty}>No STL orders</Text>}
    />
  );
}

const Info = ({ label, value }) => (
  <View style={{ flexDirection:'row', marginBottom:6 }}>
    <Text style={{ fontSize:13, color:'#666', width:80, fontWeight: '600' }}>{label}:</Text>
    <Text style={{ fontSize:13, color:'#000', flex:1 }}>{value}</Text>
  </View>
);

const s = StyleSheet.create({
  card:          { backgroundColor:'#fff', borderRadius:8, padding:16, borderWidth: 1, borderColor: '#eee' },
  cardHeader:    { flexDirection:'row', justifyContent:'space-between' },
  orderId:       { fontSize:13, fontWeight:'700', color:'#000' },
  customerName:  { fontSize:15, fontWeight:'700', color:'#000', marginTop:2 },
  customerEmail: { fontSize:13, color:'#666' },
  right:         { alignItems:'flex-end', gap:6 },
  price:         { fontSize:16, fontWeight:'800', color:'#000' },
  badge:         { borderRadius:4, paddingHorizontal:8, paddingVertical:4, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#eee' },
  badgeText:     { fontSize:10, fontWeight:'700', color: '#000', textTransform: 'uppercase' },
  details:       { borderTopWidth:1, borderTopColor:'#eee', marginTop:12, paddingTop:12 },
  noteBox:       { backgroundColor:'#fafafa', borderRadius:6, padding:10, marginBottom:8, borderWidth: 1, borderColor: '#eee' },
  noteText:      { fontSize:13, color:'#333' },
  statusLabel:   { fontSize:12, fontWeight:'700', color:'#666', marginTop:12, marginBottom:8 },
  statusChips:   { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:16 },
  statusChip:    { backgroundColor:'#fff', borderRadius:8, paddingHorizontal:12, paddingVertical:8, borderWidth: 1, borderColor: '#ccc' },
  statusChipActive: { backgroundColor:'#000', borderColor: '#000' },
  statusChipText:   { fontSize:12, fontWeight:'700', color:'#666' },
  statusChipTextActive: { color: '#fff' },
  deleteBtn:     { flexDirection:'row', alignItems:'center', padding:12, borderWidth:1, borderColor:'#000', borderRadius:8, alignSelf:'flex-start' },
  deleteBtnText: { color:'#000', fontWeight:'700', fontSize:13 },
  empty:         { textAlign:'center', color:'#999', marginTop:60, fontSize:16 },
});
