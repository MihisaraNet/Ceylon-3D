/**
 * AdminDashboardScreen.jsx — Admin Management Console
 * Minimalist design
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../lib/api';

const StatCard = ({ icon, label, value, onPress }) => (
  <TouchableOpacity style={s.statCard} onPress={onPress}>
    <Ionicons name={icon} size={28} color="#000" />
    <Text style={s.statVal}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </TouchableOpacity>
);

export default function AdminDashboardScreen() {
  const nav = useNavigation();
  const [stats, setStats] = useState({ stlOrders:0, shopOrders:0, products:0, pendingQuotes:0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#000" />}
    >
      <View style={s.header}>
        <Text style={s.headerTitle}>Admin Dashboard</Text>
        <Text style={s.headerSub}>LayerForge 3D — Management Console</Text>
      </View>

      {loading ? <ActivityIndicator color="#000" style={{ marginTop:40 }} /> : (
        <View style={s.statsGrid}>
          <StatCard icon="print-outline"         label="STL Orders"    value={stats.stlOrders}     onPress={() => nav.navigate('StlOrdersAdmin')} />
          <StatCard icon="cart-outline"          label="Shop Orders"   value={stats.shopOrders}    onPress={() => nav.navigate('ShopOrdersAdmin')} />
          <StatCard icon="cube-outline"          label="Products"      value={stats.products}      onPress={() => nav.navigate('ManageProducts')} />
          <StatCard icon="hourglass-outline"     label="Pending Quotes"value={stats.pendingQuotes} onPress={() => nav.navigate('StlOrdersAdmin')} />
        </View>
      )}

      <Text style={s.sectionTitle}>Quick Actions</Text>
      <View style={s.actions}>
        {[
          { icon:'add-circle-outline', label:'Add Product',       nav:'AddEditProduct' },
          { icon:'list-outline',       label:'Manage Products',   nav:'ManageProducts' },
          { icon:'print-outline',      label:'STL Orders',        nav:'StlOrdersAdmin' },
          { icon:'receipt-outline',    label:'Shop Orders',       nav:'ShopOrdersAdmin' },
          { icon:'calculator-outline', label:'Cost Calculator',   nav:'CostCalculator' },
        ].map(a => (
          <TouchableOpacity key={a.nav} style={s.actionBtn} onPress={() => nav.navigate(a.nav)}>
            <View style={s.actionIcon}>
              <Ionicons name={a.icon} size={24} color="#000" />
            </View>
            <Text style={s.actionLabel}>{a.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ height:24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex:1, backgroundColor:'#ffffff' },
  header:       { backgroundColor:'#000', padding:24, paddingTop:32 },
  headerTitle:  { fontSize:26, fontWeight:'900', color:'#fff' },
  headerSub:    { fontSize:14, color:'#ccc', marginTop:4 },
  statsGrid:    { flexDirection:'row', flexWrap:'wrap', gap:12, padding:16 },
  statCard:     { flex:1, minWidth:'45%', backgroundColor:'#fff', borderRadius:8, padding:16, borderWidth: 1, borderColor: '#eee' },
  statVal:      { fontSize:28, fontWeight:'900', color:'#000', marginTop:8, marginBottom:2 },
  statLabel:    { fontSize:13, color:'#666', fontWeight:'600', textTransform: 'uppercase' },
  sectionTitle: { fontSize:16, fontWeight:'800', color:'#000', paddingHorizontal:16, marginBottom:12, textTransform: 'uppercase' },
  actions:      { paddingHorizontal:16, gap:8 },
  actionBtn:    { flexDirection:'row', alignItems:'center', backgroundColor:'#fff', borderRadius:8, padding:16, gap:12, borderWidth: 1, borderColor: '#eee' },
  actionIcon:   { width:44, height:44, borderRadius:8, justifyContent:'center', alignItems:'center', backgroundColor: '#f5f5f5' },
  actionLabel:  { flex:1, fontSize:15, fontWeight:'600', color:'#000' },
});
