/**
 * ShopOrdersAdminScreen.jsx — High-End Order Logistics
 * 
 * Attractive, focused design for managing shop orders 
 * with premium card interactions and clean status tracking.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, SafeAreaView, StatusBar } from 'react-native';
import api from '../../lib/api';
import { ORDER_STATUSES } from '../../data/categories';
import { Ionicons } from '@expo/vector-icons';

const STATUS_OPTS = ['PENDING','PROCESSING','SHIPPED','DELIVERED','CANCELLED'];

export default function ShopOrdersAdminScreen() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [tracking, setTracking] = useState({});

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
    } catch { Alert.alert('Error', 'Update failed'); }
  };

  const handleTrack = async (id) => {
    if (!tracking[id]) return;
    try { 
      await api.put(`/orders/admin/${id}/tracking`, { trackingNumber: tracking[id] }); 
      load(); 
    } catch { Alert.alert('Error', 'Update failed'); }
  };

  const renderItem = ({ item }) => {
    const cfg = ORDER_STATUSES[item.status] || { label:item.status, color:'#64748b' };
    const isOpen = expanded === item._id;
    return (
      <TouchableOpacity style={s.card} onPress={() => setExpanded(isOpen ? null : item._id)} activeOpacity={0.95}>
        <View style={s.cardTop}>
          <View>
            <Text style={s.orderRef}>#{item._id.slice(-6).toUpperCase()}</Text>
            <Text style={s.customer}>{item.userId?.fullName || 'Guest'}</Text>
          </View>
          <View style={s.topRight}>
            <Text style={s.price}>LKR {item.totalAmount?.toFixed(0)}</Text>
            <View style={[s.pill, { backgroundColor: cfg.color + '10', borderColor: cfg.color + '20' }]}>
              <Text style={[s.pillText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>
        </View>

        {isOpen && (
          <View style={s.expanded}>
            <Text style={s.label}>MANIFEST</Text>
            {item.items?.map((i, idx) => (
              <Text key={idx} style={s.manifestItem}>{i.productName} × {i.quantity}</Text>
            ))}
            
            <Text style={s.label}>LOGISTICS</Text>
            <View style={s.trackInputRow}>
              <TextInput
                style={s.trackInput}
                value={tracking[item._id] || item.trackingNumber || ''}
                onChangeText={v => setTracking(p => ({...p,[item._id]:v}))}
                placeholder="Tracking ID"
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity style={s.trackBtn} onPress={() => handleTrack(item._id)}>
                <Ionicons name="send" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={s.label}>LIFECYCLE STATUS</Text>
            <View style={s.chips}>
              {STATUS_OPTS.map(st => (
                <TouchableOpacity key={st} style={[s.chip, item.status===st && s.chipOn]} onPress={() => updateStatus(item._id, st)}>
                  <Text style={[s.chipText, item.status===st && { color:'#fff' }]}>{st}</Text>
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
        <Text style={s.title}>Logistics</Text>
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
          ListEmptyComponent={<Text style={s.empty}>Clear sky, no orders.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

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
  label: { fontSize:10, fontWeight:'900', color:'#cbd5e1', letterSpacing: 1.5, marginTop:16, marginBottom:10 },
  manifestItem: { fontSize:15, color:'#475569', marginBottom:6, fontWeight: '700' },
  trackInputRow: { flexDirection:'row', gap:10, marginBottom:16 },
  trackInput: { flex:1, backgroundColor:'#f8fafc', borderRadius:18, padding:16, fontSize:14, color:'#0f172a', fontWeight: '700', borderWidth: 1, borderColor: '#f1f5f9' },
  trackBtn: { backgroundColor:'#0f172a', borderRadius:18, width: 56, justifyContent:'center', alignItems: 'center' },
  
  chips: { flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip: { backgroundColor:'#f1f5f9', borderRadius:14, paddingHorizontal:14, paddingVertical:10 },
  chipOn: { backgroundColor:'#6366f1' },
  chipText: { fontSize:11, fontWeight:'800', color:'#94a3b8' },
  empty: { textAlign:'center', color:'#cbd5e1', marginTop:100, fontWeight: '800', letterSpacing: 1 },
});
