/**
 * StlOrdersAdminScreen.jsx — High-End 3D Project Triage
 * 
 * Attractive, focused design for managing STL requests 
 * with premium card interactions and deep triage controls.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { STL_STATUSES } from '../../data/categories';

const STATUS_OPTS = ['PENDING_QUOTE','QUOTED','CONFIRMED','PRINTING','READY','DELIVERED','CANCELLED'];

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
    } catch { Alert.alert('Error', 'Update failed'); }
  };

  const deleteOrder = (id) => {
    Alert.alert('Delete Permanent', 'Wipe this project record?', [
      { text:'Cancel', style:'cancel' },
      { text:'Wipe', style:'destructive', onPress: async () => {
        try { await api.delete(`/stl-orders/admin/${id}`); load(); } catch { }
      }},
    ]);
  };

  const renderItem = ({ item }) => {
    const cfg = STL_STATUSES[item.status] || { label:item.status, color:'#64748b' };
    const isOpen = expanded === item._id;
    return (
      <TouchableOpacity style={s.card} onPress={() => setExpanded(isOpen ? null : item._id)} activeOpacity={0.95}>
        <View style={s.cardTop}>
          <View>
            <Text style={s.orderRef}>3D: #{item._id.slice(-6).toUpperCase()}</Text>
            <Text style={s.customer}>{item.customerName}</Text>
          </View>
          <View style={s.topRight}>
            {item.estimatedPrice && <Text style={s.price}>LKR {item.estimatedPrice?.toFixed(0)}</Text>}
            <View style={[s.pill, { backgroundColor: cfg.color + '10', borderColor: cfg.color + '20' }]}>
              <Text style={[s.pillText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>
        </View>

        {isOpen && (
          <View style={s.expanded}>
            <View style={s.specGrid}>
              <Spec label="Asset"   value={item.fileName?.replace(/^[0-9a-f-]+-/i,'')} />
              <Spec label="Material" value={item.material} />
              <Spec label="Batch"    value={String(item.quantity)} />
            </View>
            
            {item.note && (
              <View style={s.noteBox}>
                <Ionicons name="chatbubble-ellipses" size={18} color="#f59e0b" />
                <Text style={s.noteText}>{item.note}</Text>
              </View>
            )}

            <Text style={s.label}>LIFECYCLE TRIAGE</Text>
            <View style={s.chips}>
              {STATUS_OPTS.map(st => (
                <TouchableOpacity key={st} style={[s.chip, item.status===st && s.chipOn]} onPress={() => updateStatus(item._id, st)}>
                  <Text style={[s.chipText, item.status===st && { color:'#fff' }]}>{st.replace('_',' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity style={s.deleteBtn} onPress={() => deleteOrder(item._id)}>
              <Ionicons name="trash-outline" size={16} color="#f43f5e" />
              <Text style={s.deleteBtnText}>Purge Project</Text>
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
        <Text style={s.title}>3D Pipeline</Text>
        <TouchableOpacity style={s.refreshBtn} onPress={load}>
          <Ionicons name="sync" size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#6366f1" size="large" style={{ marginTop: 80 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={i => i._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 24, gap: 16 }}
          ListEmptyComponent={<Text style={s.empty}>No projects in pipeline.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const Spec = ({ label, value }) => (
  <View style={s.specItem}>
    <Text style={s.specL}>{label}</Text>
    <Text style={s.specV} numberOfLines={1}>{value}</Text>
  </View>
);

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 28, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  title: { fontSize: 32, fontWeight: '900', color: '#0f172a', letterSpacing: -1.5 },
  refreshBtn: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 16 },

  card: { backgroundColor:'#fff', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10 },
  cardTop: { flexDirection:'row', justifyContent:'space-between', alignItems: 'center' },
  orderRef: { fontSize:10, fontWeight:'900', color:'#cbd5e1', letterSpacing: 1.5 },
  customer: { fontSize:18, fontWeight:'800', color:'#0f172a', marginTop:2 },
  topRight: { alignItems:'flex-end', gap:8 },
  price: { fontSize:20, fontWeight:'900', color:'#6366f1' },
  pill: { borderRadius:10, paddingHorizontal:10, paddingVertical:6, borderWidth: 1 },
  pillText: { fontSize:10, fontWeight:'900' },
  
  expanded: { borderTopWidth:1, borderTopColor:'#f1f5f9', marginTop:20, paddingTop:20 },
  specGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  specItem: { flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  specL: { fontSize: 9, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, marginBottom: 4 },
  specV: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  
  noteBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffbeb', padding: 16, borderRadius: 20, marginTop: 4, gap: 12, borderWidth: 1, borderColor: '#fef3c7' },
  noteText: { flex: 1, fontSize: 13, color: '#92400e', fontWeight: '700' },

  label: { fontSize:10, fontWeight:'900', color:'#cbd5e1', letterSpacing: 1.5, marginTop:24, marginBottom:12 },
  chips: { flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip: { backgroundColor:'#f1f5f9', borderRadius:14, paddingHorizontal:14, paddingVertical:10 },
  chipOn: { backgroundColor:'#6366f1' },
  chipText: { fontSize:11, fontWeight:'800', color:'#94a3b8' },
  
  deleteBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 16, borderRadius: 18, gap: 10, alignSelf: 'flex-start', marginTop: 24, borderWidth: 1, borderColor: '#fee2e2' },
  deleteBtnText: { color: '#f43f5e', fontWeight: '800', fontSize: 13 },
  empty: { textAlign:'center', color:'#cbd5e1', marginTop:100, fontWeight: '800', letterSpacing: 1 },
});
