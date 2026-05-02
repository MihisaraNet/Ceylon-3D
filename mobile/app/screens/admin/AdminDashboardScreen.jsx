/**
 * AdminDashboardScreen.jsx — High-End Management Console
 * 
 * Attractive, modern design with focused stats 
 * and premium slate/colorful action cards.
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
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <View style={s.header}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerTitle}>Console</Text>
            <Text style={s.headerSub}>Infrastructure Control</Text>
          </View>
          <TouchableOpacity style={s.refreshBtn} onPress={handleRefresh}>
            <Ionicons name="refresh-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 28, paddingBottom: 60 }}
      >
        <View style={s.statsGrid}>
          <StatCard icon="print-outline" label="3D ORDERS" value={stats.stlOrders} color="#6366f1" onPress={() => nav.navigate('StlOrdersAdmin')} />
          <StatCard icon="bag-handle-outline" label="SHOP" value={stats.shopOrders} color="#10b981" onPress={() => nav.navigate('ShopOrdersAdmin')} />
          <StatCard icon="cube-outline" label="CATALOG" value={stats.products} color="#f59e0b" onPress={() => nav.navigate('ManageProducts')} />
          <StatCard icon="timer-outline" label="PENDING" value={stats.pendingQuotes} color="#f43f5e" onPress={() => nav.navigate('StlOrdersAdmin')} />
        </View>

        <Text style={s.sectionLabel}>INFRASTRUCTURE ACTIONS</Text>
        <View style={s.actions}>
          {[
            { icon:'add-circle',  label:'Deploy New Product', nav:'AddEditProduct', color:'#10b981' },
            { icon:'list-outline',label:'Maintain Inventory', nav:'ManageProducts', color:'#6366f1' },
            { icon:'calculator',  label:'Algorithm Estimator', nav:'CostCalculator', color:'#8b5cf6' },
          ].map(a => (
            <TouchableOpacity key={a.label} style={s.actionCard} onPress={() => nav.navigate(a.nav)} activeOpacity={0.8}>
              <View style={[s.actionIcon, { backgroundColor: a.color + '10' }]}>
                <Ionicons name={a.icon} size={22} color={a.color} />
              </View>
              <Text style={s.actionText}>{a.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.alertBox}>
          <View style={s.alertCircle}><Ionicons name="notifications" size={20} color="#6366f1" /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.alertTitle}>Security Status</Text>
            <Text style={s.alertSub}>All systems operational. {stats.pendingQuotes} requests await triage.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#0f172a', paddingHorizontal: 28, paddingTop: 20, paddingBottom: 60, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1.5 },
  headerSub: { fontSize: 15, color: '#94a3b8', fontWeight: '600', marginTop: 4 },
  refreshBtn: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 16 },

  scroll: { flex: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: -32, marginBottom: 40 },
  statCard: { width: '47.5%', backgroundColor: '#fff', borderRadius: 32, padding: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, flexDirection: 'row', alignItems: 'center' },
  statIconWrap: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statInfo: { flex: 1 },
  statVal: { fontSize: 24, fontWeight: '900', color: '#1e293b' },
  statLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '900', letterSpacing: 0.5, marginTop: 4 },

  sectionLabel: { fontSize: 11, fontWeight: '900', color: '#cbd5e1', letterSpacing: 2, marginBottom: 16, marginLeft: 4 },
  actions: { gap: 14, marginBottom: 40 },
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 28, padding: 18, gap: 18, borderWidth: 1, borderColor: '#f1f5f9' },
  actionIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  actionText: { flex: 1, fontSize: 16, fontWeight: '800', color: '#1e293b' },

  alertBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', padding: 24, borderRadius: 32, gap: 18, borderWidth: 1, borderColor: '#e0e7ff' },
  alertCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  alertTitle: { fontSize: 16, fontWeight: '900', color: '#1e293b' },
  alertSub: { fontSize: 13, color: '#6366f1', fontWeight: '700', marginTop: 2 },
});
