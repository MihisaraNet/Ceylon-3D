/**
 * MyAccountScreen.jsx — User Account & Order History
 *
 * Modern, colorful and simple design.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import api from '../../lib/api';
import { ORDER_STATUSES, STL_STATUSES } from '../../data/categories';

const StatusBadge = ({ status, map }) => {
  const cfg = map[status] || { label: status, color: '#64748b' };
  return (
    <View style={[s.badge, { backgroundColor: cfg.color + '15', borderColor: cfg.color + '30' }]}>
      <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

export default function MyAccountScreen() {
  const { user, logout, isAdmin } = useAuth();
  const nav = useNavigation();
  const [shopOrders, setShopOrders]  = useState([]);
  const [stlOrders, setStlOrders]    = useState([]);
  const [activeTab, setActiveTab]    = useState('orders');
  const [loading, setLoading]        = useState(false);
  const [refreshing, setRefreshing]  = useState(false);
  const [expanded, setExpanded]      = useState(null);

  const loadOrders = useCallback(async () => {
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

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await loadOrders(); } finally { setRefreshing(false); }
  }, [loadOrders]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />
      
      <View style={s.header}>
        <View style={s.profileTop}>
          <View style={s.avatarWrap}>
            <Ionicons name="person" size={32} color="#fff" />
          </View>
          <View style={s.profileInfo}>
            <Text style={s.name}>{user?.fullName}</Text>
            <Text style={s.email}>{user?.email}</Text>
          </View>
          <TouchableOpacity style={s.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {isAdmin && (
          <TouchableOpacity style={s.adminPill} onPress={() => nav.navigate('AdminStack')}>
            <Ionicons name="shield-checkmark" size={16} color="#fff" />
            <Text style={s.adminPillText}>Admin Dashboard</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={s.tabContainer}>
        {[
          { id: 'orders', label: 'Shop Orders', icon: 'receipt-outline' },
          { id: '3d',     label: '3D Orders',   icon: 'print-outline' },
          { id: 'profile',label: 'Profile',     icon: 'person-outline' },
        ].map(t => (
          <TouchableOpacity
            key={t.id}
            style={[s.tab, activeTab === t.id && s.tabActive]}
            onPress={() => setActiveTab(t.id)}
          >
            <Ionicons name={t.icon} size={20} color={activeTab === t.id ? '#6366f1' : '#94a3b8'} />
            <Text style={[s.tabText, activeTab === t.id && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />}
        contentContainerStyle={{ padding: 20 }}
      >
        {activeTab === 'orders' && (
          <>
            {loading && !refreshing ? <ActivityIndicator color="#6366f1" /> : shopOrders.length === 0 ? (
              <Text style={s.empty}>No orders yet</Text>
            ) : shopOrders.map(o => (
              <TouchableOpacity key={o._id} style={s.card} onPress={() => setExpanded(expanded === o._id ? null : o._id)}>
                <View style={s.cardHeader}>
                  <Text style={s.orderId}>ORDER #{o._id.slice(-6).toUpperCase()}</Text>
                  <StatusBadge status={o.status} map={ORDER_STATUSES} />
                </View>
                <Text style={s.cardTotal}>LKR {o.totalAmount?.toFixed(2)}</Text>
                <Text style={s.cardDate}>{new Date(o.createdAt).toLocaleDateString()}</Text>
                {expanded === o._id && (
                  <View style={s.details}>
                    {o.items?.map((item, i) => (
                      <Text key={i} style={s.detailItem}>{item.productName} × {item.quantity}</Text>
                    ))}
                    <Text style={s.addressText}>{o.shippingAddress}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </>
        )}

        {activeTab === '3d' && (
          <>
            {loading && !refreshing ? <ActivityIndicator color="#6366f1" /> : stlOrders.length === 0 ? (
              <Text style={s.empty}>No 3D orders yet</Text>
            ) : stlOrders.map(o => (
              <TouchableOpacity key={o._id} style={s.card} onPress={() => setExpanded(expanded === o._id ? null : o._id)}>
                <View style={s.cardHeader}>
                  <Text style={s.orderId}>3D #{o._id.slice(-6).toUpperCase()}</Text>
                  <StatusBadge status={o.status} map={STL_STATUSES} />
                </View>
                <Text style={s.cardInfo}>{o.material} — Qty: {o.quantity}</Text>
                {o.estimatedPrice && <Text style={s.cardTotal}>LKR {o.estimatedPrice?.toFixed(2)}</Text>}
                {expanded === o._id && (
                  <View style={s.details}>
                    <Text style={s.detailItem}>File: {o.fileName?.replace(/^[0-9a-f-]+-/i,'')}</Text>
                    {o.weightGrams && <Text style={s.detailItem}>Weight: {o.weightGrams}g</Text>}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </>
        )}

        {activeTab === 'profile' && (
          <View style={s.profileCard}>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>FULL NAME</Text>
              <Text style={s.infoVal}>{user?.fullName}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>EMAIL ADDRESS</Text>
              <Text style={s.infoVal}>{user?.email}</Text>
            </Text>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>ACCOUNT ROLE</Text>
              <Text style={s.infoVal}>{user?.roles?.join(', ')}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#f8fafc' },
  header:         { backgroundColor: '#4f46e5', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  profileTop:     { flexDirection: 'row', alignItems: 'center' },
  avatarWrap:     { width: 64, height: 64, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  profileInfo:    { flex: 1, marginLeft: 16 },
  name:           { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  email:          { fontSize: 14, color: '#e0e7ff', fontWeight: '600', marginTop: 2 },
  logoutBtn:      { padding: 8 },
  adminPill:      { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginTop: 24 },
  adminPillText:  { color: '#fff', fontSize: 13, fontWeight: '700', marginLeft: 8 },

  tabContainer:   { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, marginTop: -24, borderRadius: 20, padding: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 10 },
  tab:            { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 16, gap: 4 },
  tabActive:      { backgroundColor: '#f5f3ff' },
  tabText:        { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  tabTextActive:  { color: '#6366f1' },

  scroll:         { flex: 1 },
  empty:          { textAlign: 'center', color: '#94a3b8', marginTop: 60, fontWeight: '700' },
  card:           { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10 },
  cardHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderId:        { fontSize: 11, fontWeight: '900', color: '#94a3b8', letterSpacing: 1 },
  badge:          { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  badgeText:      { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  cardTotal:      { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  cardInfo:       { fontSize: 14, color: '#64748b', fontWeight: '600', marginBottom: 4 },
  cardDate:       { fontSize: 12, color: '#94a3b8', marginTop: 4, fontWeight: '600' },
  details:        { borderTopWidth: 1, borderColor: '#f1f5f9', marginTop: 16, paddingTop: 16 },
  detailItem:     { fontSize: 14, color: '#475569', marginBottom: 6, fontWeight: '600' },
  addressText:    { fontSize: 13, color: '#94a3b8', marginTop: 8 },

  profileCard:    { backgroundColor: '#fff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  infoRow:        { marginBottom: 20 },
  infoLabel:      { fontSize: 11, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, marginBottom: 8 },
  infoVal:        { fontSize: 16, fontWeight: '700', color: '#1e293b' },
});
