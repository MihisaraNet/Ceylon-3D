/**
 * AdminDashboardScreen.jsx — Admin Management Console
 *
 * Modern, colorful and simple design.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../lib/api';

const StatCard = ({ icon, label, value, color, onPress }) => (
  <TouchableOpacity style={s.statCard} onPress={onPress} activeOpacity={0.85}>
    <View style={[s.statIconWrap, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={28} color={color} />
    </View>
    <View style={s.statInfo}>
      <Text style={s.statVal}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
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
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.headerTitle}>Console</Text>
            <Text style={s.headerSub}>LayerForge Management</Text>
          </View>
          <TouchableOpacity style={s.refreshBtn} onPress={handleRefresh}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />}
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
      >
        <View style={s.statsGrid}>
          <StatCard icon="print"         label="STL Orders"    value={stats.stlOrders}     color="#6366f1" onPress={() => nav.navigate('StlOrdersAdmin')} />
          <StatCard icon="cart"          label="Shop Orders"   value={stats.shopOrders}    color="#10b981" onPress={() => nav.navigate('ShopOrdersAdmin')} />
          <StatCard icon="cube"          label="Products"      value={stats.products}      color="#f59e0b" onPress={() => nav.navigate('ManageProducts')} />
          <StatCard icon="hourglass"     label="Pending"       value={stats.pendingQuotes} color="#ef4444" onPress={() => nav.navigate('StlOrdersAdmin')} />
        </View>

        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.actions}>
          {[
            { icon:'add-circle',  label:'Add Product',       nav:'AddEditProduct',   color:'#10b981' },
            { icon:'list',        label:'Manage Catalog',    nav:'ManageProducts',   color:'#6366f1' },
            { icon:'calculator',  label:'Cost Calculator',   nav:'CostCalculator',   color:'#8b5cf6' },
            { icon:'settings',    label:'Store Settings',    nav:'AdminDashboard',   color:'#64748b' },
          ].map(a => (
            <TouchableOpacity key={a.label} style={s.actionBtn} onPress={() => nav.navigate(a.nav)} activeOpacity={0.8}>
              <View style={[s.actionIcon, { backgroundColor: a.color + '10' }]}>
                <Ionicons name={a.icon} size={24} color={a.color} />
              </View>
              <Text style={s.actionLabel}>{a.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.infoBanner}>
          <Ionicons name="information-circle" size={24} color="#6366f1" />
          <Text style={s.infoText}>You have {stats.pendingQuotes} STL orders waiting for quotes.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#f8fafc' },
  header:         { backgroundColor: '#1e293b', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle:    { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  headerSub:      { fontSize: 14, color: '#94a3b8', fontWeight: '600', marginTop: 4 },
  refreshBtn:     { backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 16 },

  scroll:         { flex: 1 },
  statsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: -20, marginBottom: 32 },
  statCard:       { width: '47.5%', backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 8, flexDirection: 'row', alignItems: 'center' },
  statIconWrap:   { padding: 12, borderRadius: 16, marginRight: 12 },
  statInfo:       { flex: 1 },
  statVal:        { fontSize: 22, fontWeight: '900', color: '#1e293b' },
  statLabel:      { fontSize: 11, color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },

  sectionTitle:   { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 16, letterSpacing: -0.5 },
  actions:        { gap: 12, marginBottom: 32 },
  actionBtn:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  actionIcon:     { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  actionLabel:    { flex: 1, fontSize: 16, fontWeight: '700', color: '#1e293b' },

  infoBanner:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', padding: 20, borderRadius: 20, gap: 16, borderWidth: 1, borderColor: '#e0e7ff' },
  infoText:       { flex: 1, fontSize: 14, color: '#4338ca', fontWeight: '700' },
});
