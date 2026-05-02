/**
 * MyAccountScreen.jsx — Personal Command Center
 * 
 * Premium, attractive design with a clean 
 * profile header and refined order history.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import api from '../../lib/api';
import { ORDER_STATUSES, STL_STATUSES } from '../../data/categories';

const StatusPill = ({ status, map }) => {
  const cfg = map[status] || { label: status, color: '#64748b' };
  return (
    <View style={[s.statusPill, { backgroundColor: cfg.color + '10', borderColor: cfg.color + '20' }]}>
      <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label.toUpperCase()}</Text>
    </View>
  );
};

export default function MyAccountScreen() {
  const { user, logout, isAdmin } = useAuth();
  const nav = useNavigation();
  const [shopOrders, setShopOrders]  = useState([]);
  const [stlOrders, setStlOrders]    = useState([]);
  const [activeTab, setActiveTab]    = useState('shop');
  const [loading, setLoading]        = useState(false);
  const [refreshing, setRefreshing]  = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [shop, stl] = await Promise.all([
        api.get('/orders'),
        api.get('/stl-orders/my'),
      ]);
      setShopOrders(shop.data);
      setStlOrders(stl.data);
    } catch { } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      <View style={s.profileHeader}>
        <View style={s.profileTop}>
          <View style={s.avatarBox}>
            <Ionicons name="person" size={28} color="#0f172a" />
          </View>
          <View style={s.profileInfo}>
            <Text style={s.userName}>{user?.fullName}</Text>
            <Text style={s.userEmail}>{user?.email}</Text>
          </View>
          <TouchableOpacity style={s.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {isAdmin && (
          <TouchableOpacity style={s.adminBtn} onPress={() => nav.navigate('AdminStack')}>
            <Ionicons name="shield-checkmark" size={16} color="#fff" />
            <Text style={s.adminBtnText}>Admin Console</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={s.tabBar}>
        {[
          { id: 'shop', label: 'Shop', icon: 'cart-outline' },
          { id: '3d',   label: '3D Print', icon: 'cube-outline' },
          { id: 'info', label: 'Identity', icon: 'finger-print-outline' },
        ].map(t => (
          <TouchableOpacity
            key={t.id}
            style={[s.tab, activeTab === t.id && s.tabActive]}
            onPress={() => setActiveTab(t.id)}
          >
            <Ionicons name={t.icon} size={18} color={activeTab === t.id ? '#0f172a' : '#94a3b8'} />
            <Text style={[s.tabText, activeTab === t.id && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24 }}
      >
        {activeTab === 'shop' && (
          <>
            {loading && !refreshing ? <ActivityIndicator color="#6366f1" /> : shopOrders.length === 0 ? (
              <Text style={s.empty}>No activity found</Text>
            ) : shopOrders.map(o => (
              <View key={o._id} style={s.orderCard}>
                <View style={s.cardTop}>
                  <Text style={s.orderRef}>REF: #{o._id.slice(-6).toUpperCase()}</Text>
                  <StatusPill status={o.status} map={ORDER_STATUSES} />
                </View>
                <Text style={s.cardTitle}>LKR {o.totalAmount?.toFixed(2)}</Text>
                <Text style={s.cardDate}>{new Date(o.createdAt).toDateString()}</Text>
              </View>
            ))}
          </>
        )}

        {activeTab === '3d' && (
          <>
            {loading && !refreshing ? <ActivityIndicator color="#6366f1" /> : stlOrders.length === 0 ? (
              <Text style={s.empty}>No 3D orders yet</Text>
            ) : stlOrders.map(o => (
              <View key={o._id} style={s.orderCard}>
                <View style={s.cardTop}>
                  <Text style={s.orderRef}>3D: #{o._id.slice(-6).toUpperCase()}</Text>
                  <StatusPill status={o.status} map={STL_STATUSES} />
                </View>
                <Text style={s.cardTitle}>{o.material} × {o.quantity}</Text>
                {o.estimatedPrice && <Text style={s.priceSub}>Est. LKR {o.estimatedPrice?.toFixed(0)}</Text>}
              </View>
            ))}
          </>
        )}

        {activeTab === 'info' && (
          <View style={s.infoSheet}>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>REGISTERED NAME</Text>
              <Text style={s.infoValue}>{user?.fullName}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>ACCOUNT EMAIL</Text>
              <Text style={s.infoValue}>{user?.email}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>AUTHORIZATION</Text>
              <Text style={s.infoValue}>{user?.roles?.join(' · ').toUpperCase()}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  profileHeader: { backgroundColor: '#0f172a', paddingHorizontal: 28, paddingTop: 20, paddingBottom: 48, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  profileTop: { flexDirection: 'row', alignItems: 'center' },
  avatarBox: { width: 60, height: 60, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  profileInfo: { flex: 1, marginLeft: 16 },
  userName: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  userEmail: { fontSize: 14, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
  logoutBtn: { padding: 8 },
  adminBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginTop: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  adminBtnText: { color: '#fff', fontSize: 12, fontWeight: '800', marginLeft: 8, letterSpacing: 1 },

  tabBar: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 24, marginTop: -26, borderRadius: 24, padding: 6, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, elevation: 12 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 50, borderRadius: 20, gap: 4 },
  tabActive: { backgroundColor: '#f1f5f9' },
  tabText: { fontSize: 11, fontWeight: '800', color: '#94a3b8' },
  tabTextActive: { color: '#0f172a' },

  scroll: { flex: 1 },
  empty: { textAlign: 'center', color: '#cbd5e1', marginTop: 80, fontWeight: '700', letterSpacing: 1 },
  orderCard: { backgroundColor: '#fff', borderRadius: 28, padding: 22, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  orderRef: { fontSize: 10, fontWeight: '900', color: '#cbd5e1', letterSpacing: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '900' },
  cardTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  priceSub: { fontSize: 14, color: '#6366f1', fontWeight: '800', marginTop: 4 },
  cardDate: { fontSize: 12, color: '#94a3b8', marginTop: 6, fontWeight: '600' },

  infoSheet: { backgroundColor: '#f8fafc', borderRadius: 32, padding: 32 },
  infoRow: { marginBottom: 28 },
  infoLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1.5, marginBottom: 8 },
  infoValue: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
});
