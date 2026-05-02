/**
 * StlOrdersAdminScreen.jsx — Admin STL / 3D Print Order Management
 *
 * Modern, colorful and simple design.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, SafeAreaView, StatusBar } from 'react-native';
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
      Alert.alert('Error', 'Update failed'); 
    }
  };

  const deleteOrder = (id) => {
    Alert.alert('Delete', 'Delete this STL order permanently?', [
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive', onPress: async () => {
        try { 
          await api.delete(`/stl-orders/admin/${id}`); 
          load(); 
        } catch (err) { 
          Alert.alert('Error', 'Delete failed'); 
        }
      }},
    ]);
  };

  const renderItem = ({ item }) => {
    const cfg = STL_STATUSES[item.status] || { label:item.status, color:'#64748b' };
    const isOpen = expanded === item._id;
    return (
      <TouchableOpacity style={s.card} onPress={() => setExpanded(isOpen ? null : item._id)} activeOpacity={0.9}>
        <View style={s.cardHeader}>
          <View>
            <Text style={s.orderId}>STL ORDER #{item._id.slice(-6).toUpperCase()}</Text>
            <Text style={s.customerName}>{item.customerName}</Text>
            <Text style={s.customerEmail}>{item.customerEmail}</Text>
          </View>
          <View style={s.right}>
            {item.estimatedPrice && <Text style={s.price}>LKR {item.estimatedPrice?.toFixed(0)}</Text>}
            <View style={[s.badge, { backgroundColor: cfg.color + '15', borderColor: cfg.color + '30' }]}>
              <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>
        </View>

        {isOpen && (
          <View style={s.details}>
            <Info label="File"     value={item.fileName?.replace(/^[0-9a-f-]+-/i,'')} />
            <Info label="Material" value={item.material} />
            <Info label="Qty"      value={String(item.quantity)} />
            <Info label="Phone"    value={item.phone || '-'} />
            <Info label="Address"  value={item.address || '-'} />
            
            {item.note && (
              <View style={s.noteBox}>
                <Ionicons name="chatbubble-outline" size={16} color="#f59e0b" />
                <Text style={s.noteText}>{item.note}</Text>
              </View>
            )}

            <Text style={s.detailsTitle}>Update Status</Text>
            <View style={s.statusChips}>
              {STATUS_OPTIONS.map(st => (
                <TouchableOpacity key={st} style={[s.statusChip, item.status===st && s.statusChipActive]} onPress={() => updateStatus(item._id, st)}>
                  <Text style={[s.statusChipText, item.status===st && { color:'#fff' }]}>{st.replace('_',' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity style={s.deleteBtn} onPress={() => deleteOrder(item._id)}>
              <Ionicons name="trash" size={16} color="#ef4444" />
              <Text style={s.deleteBtnText}>Delete Permanently</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={s.header}>
        <Text style={s.headerTitle}>STL Orders</Text>
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
          ListEmptyComponent={<Text style={s.empty}>No STL orders found</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const Info = ({ label, value }) => (
  <View style={s.infoRow}>
    <Text style={s.infoLabel}>{label}:</Text>
    <Text style={s.infoVal}>{value}</Text>
  </View>
);

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#f8fafc' },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  headerTitle:    { fontSize: 28, fontWeight: '900', color: '#1e293b' },
  refreshBtn:     { backgroundColor: '#f5f3ff', padding: 10, borderRadius: 12 },

  card:           { backgroundColor:'#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10 },
  cardHeader:     { flexDirection:'row', justifyContent:'space-between' },
  orderId:        { fontSize:11, fontWeight:'900', color:'#94a3b8', letterSpacing: 1 },
  customerName:   { fontSize:16, fontWeight:'800', color:'#1e293b', marginTop:2 },
  customerEmail:  { fontSize:13, color:'#64748b', fontWeight: '600' },
  right:          { alignItems:'flex-end', gap:8 },
  price:          { fontSize:18, fontWeight:'900', color:'#6366f1' },
  badge:          { borderRadius:10, paddingHorizontal:10, paddingVertical:6, borderWidth: 1 },
  badgeText:      { fontSize:10, fontWeight:'800', textTransform: 'uppercase' },
  
  details:        { borderTopWidth:1, borderTopColor:'#f1f5f9', marginTop:16, paddingTop:16 },
  infoRow:        { flexDirection: 'row', marginBottom: 6 },
  infoLabel:      { width: 80, fontSize: 13, color: '#94a3b8', fontWeight: '700' },
  infoVal:        { flex: 1, fontSize: 13, color: '#475569', fontWeight: '800' },
  noteBox:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffbeb', padding: 12, borderRadius: 12, marginTop: 12, gap: 10, borderWidth: 1, borderColor: '#fef3c7' },
  noteText:       { flex: 1, fontSize: 13, color: '#92400e', fontWeight: '700' },

  detailsTitle:   { fontSize:11, fontWeight:'900', color:'#94a3b8', letterSpacing: 1, marginTop:20, marginBottom:12, textTransform: 'uppercase' },
  statusChips:    { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom: 20 },
  statusChip:     { backgroundColor:'#f1f5f9', borderRadius:12, paddingHorizontal:12, paddingVertical:10 },
  statusChipActive:{ backgroundColor:'#6366f1' },
  statusChipText: { fontSize:12, fontWeight:'700', color:'#64748b' },
  
  deleteBtn:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 16, borderRadius: 16, gap: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#fee2e2' },
  deleteBtnText:  { color: '#ef4444', fontWeight: '800', fontSize: 14 },
  empty:          { textAlign:'center', color:'#94a3b8', marginTop:60, fontWeight: '700' },
});
