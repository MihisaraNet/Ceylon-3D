import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../lib/api';

const StatCard = ({ icon, label, value, color, onPress }) => (
  <TouchableOpacity style={[s.statCard, { borderLeftColor: color }]} onPress={onPress}>
    <Ionicons name={icon} size={28} color={color} />
    <Text style={s.statVal}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </TouchableOpacity>
);

export default function AdminDashboardScreen() {
  const nav = useNavigation();
  const [stats, setStats] = useState({ stlOrders:0, shopOrders:0, products:0, pendingQuotes:0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [stl, shop, prods] = await Promise.all([
        api.get('/stl-orders/admin'),
        api.get('/orders/admin'),
        api.get('/api/products'),
      ]);
      setStats({
        stlOrders:     stl.data.length,
        shopOrders:    shop.data.length,
        products:      prods.data.length,
        pendingQuotes: stl.data.filter(o => o.status === 'PENDING_QUOTE').length,
      });
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Admin Dashboard</Text>
        <Text style={s.headerSub}>Ceylon 3D — Management Console</Text>
      </View>

      {loading ? <ActivityIndicator color="#6366f1" style={{ marginTop:40 }} /> : (
        <View style={s.statsGrid}>
          <StatCard icon="print-outline"         label="STL Orders"    value={stats.stlOrders}     color="#8b5cf6" onPress={() => nav.navigate('StlOrdersAdmin')} />
          <StatCard icon="cart-outline"          label="Shop Orders"   value={stats.shopOrders}    color="#3b82f6" onPress={() => nav.navigate('ShopOrdersAdmin')} />
          <StatCard icon="cube-outline"          label="Products"      value={stats.products}      color="#10b981" onPress={() => nav.navigate('ManageProducts')} />
          <StatCard icon="hourglass-outline"     label="Pending Quotes"value={stats.pendingQuotes} color="#f59e0b" onPress={() => nav.navigate('StlOrdersAdmin')} />
        </View>
      )}

      <Text style={s.sectionTitle}>Quick Actions</Text>
      <View style={s.actions}>
        {[
          { icon:'add-circle-outline', label:'Add Product',       nav:'AddEditProduct',   color:'#10b981' },
          { icon:'list-outline',       label:'Manage Products',   nav:'ManageProducts',   color:'#3b82f6' },
          { icon:'print-outline',      label:'STL Orders',        nav:'StlOrdersAdmin',   color:'#8b5cf6' },
          { icon:'receipt-outline',    label:'Shop Orders',       nav:'ShopOrdersAdmin',  color:'#f59e0b' },
          { icon:'calculator-outline', label:'Cost Calculator',   nav:'CostCalculator',   color:'#ef4444' },
        ].map(a => (
          <TouchableOpacity key={a.nav} style={s.actionBtn} onPress={() => nav.navigate(a.nav)}>
            <View style={[s.actionIcon, { backgroundColor: a.color + '20' }]}>
              <Ionicons name={a.icon} size={24} color={a.color} />
            </View>
            <Text style={s.actionLabel}>{a.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ height:24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex:1, backgroundColor:'#f9fafb' },
  header:       { backgroundColor:'#4f46e5', padding:24, paddingTop:32 },
  headerTitle:  { fontSize:26, fontWeight:'900', color:'#fff' },
  headerSub:    { fontSize:14, color:'#c7d2fe', marginTop:4 },
  statsGrid:    { flexDirection:'row', flexWrap:'wrap', gap:12, padding:16 },
  statCard:     { flex:1, minWidth:'45%', backgroundColor:'#fff', borderRadius:14, padding:16, borderLeftWidth:4, shadowColor:'#000', shadowOpacity:0.06, shadowRadius:8, elevation:3 },
  statVal:      { fontSize:28, fontWeight:'900', color:'#111827', marginTop:8, marginBottom:2 },
  statLabel:    { fontSize:13, color:'#6b7280', fontWeight:'600' },
  sectionTitle: { fontSize:18, fontWeight:'800', color:'#111827', paddingHorizontal:16, marginBottom:8 },
  actions:      { paddingHorizontal:16, gap:8 },
  actionBtn:    { flexDirection:'row', alignItems:'center', backgroundColor:'#fff', borderRadius:14, padding:16, gap:12, shadowColor:'#000', shadowOpacity:0.04, shadowRadius:6, elevation:2 },
  actionIcon:   { width:44, height:44, borderRadius:12, justifyContent:'center', alignItems:'center' },
  actionLabel:  { flex:1, fontSize:15, fontWeight:'600', color:'#111827' },
});
