/**
 * MyAccountScreen.jsx — User Account & Order History
 *
 * Displays user profile info, order history, and account management options.
 *
 * Tabs:
 *   1. My Orders  — List of shop orders with expandable details (items, tracking, address)
 *   2. 3D Orders  — List of STL print orders with status, specs, and confirm action
 *   3. Profile    — View user name, email, and roles
 *
 * Features:
 *   - Expandable order cards showing item details, tracking numbers, and shipping addresses
 *   - STL order confirmation button (for QUOTED orders — transitions to CONFIRMED)
 *   - Status badges color-coded by order/STL status
 *   - Admin Dashboard shortcut button (visible only to admin users)
 *   - Logout with confirmation dialog
 *
 * @module screens/account/MyAccountScreen
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import api from '../../lib/api';
import { ORDER_STATUSES, STL_STATUSES } from '../../data/categories';

const Section = ({ title, children }) => (
  <View style={s.section}>
    <Text style={s.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const StatusBadge = ({ status, map }) => {
  const cfg = map[status] || { label: status, color: '#6b7280' };
  return <View style={[s.badge, { backgroundColor: cfg.color + '20' }]}>
    <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
  </View>;
};

const ProgressStep = ({ currentStatus, steps, map }) => {
  const currentIndex = steps.indexOf(currentStatus);
  return (
    <View style={s.stepContainer}>
      {steps.map((st, i) => {
        const isDone = i <= currentIndex;
        const isLast = i === steps.length - 1;
        const cfg = map[st] || { color: '#cbd5e1', label: st };
        return (
          <View key={st} style={[s.stepWrapper, !isLast && { flex: 1 }]}>
            <View style={s.stepLineWrapper}>
              <View style={[s.stepCircle, isDone && { backgroundColor: cfg.color }]}>
                {i < currentIndex ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : (
                  <View style={[s.stepDot, isDone && { backgroundColor: '#fff' }]} />
                )}
              </View>
              {!isLast && <View style={[s.line, i < currentIndex && { backgroundColor: cfg.color }]} />}
            </View>
            <Text style={[s.stepLabel, isDone && { color: cfg.color, fontWeight: '700' }]}>{cfg.label}</Text>
          </View>
        );
      })}
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
  const [confirmingId, setConfirming] = useState(null);

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
    } catch { }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { if (activeTab === 'orders' || activeTab === '3d') loadOrders(); }, [activeTab, loadOrders]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadOrders();
    } finally {
      setRefreshing(false);
    }
  }, [loadOrders]);

  const confirmOrder = async (id) => {
    setConfirming(id);
    try {
      await api.put(`/stl-orders/my/${id}/confirm`);
      Alert.alert('Confirmed!', 'Your 3D print order is confirmed.');
      loadOrders();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to confirm');
    } finally { setConfirming(null); }
  };

  const tabs = [
    { key:'orders', label:'My Orders', icon:'receipt-outline' },
    { key:'3d',     label:'3D Orders',  icon:'print-outline' },
    { key:'profile',label:'Profile',    icon:'person-outline' },
  ];

  const shopSteps = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const stlSteps  = ['PENDING_QUOTE', 'QUOTED', 'CONFIRMED', 'PRINTING', 'READY', 'DELIVERED'];

  return (
    <ScrollView
      style={s.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#6366f1']}
          tintColor="#6366f1"
        />
      }
    >
      {/* Header */}
      <View style={s.header}>
        <View style={s.avatar}><Ionicons name="person" size={36} color="#fff" /></View>
        <View>
          <Text style={s.name}>{user?.fullName}</Text>
          <Text style={s.email}>{user?.email}</Text>
          {isAdmin && <Text style={s.adminTag}>Admin</Text>}
        </View>
      </View>

      {isAdmin && (
        <TouchableOpacity style={s.adminBtn} onPress={() => nav.navigate('AdminStack')}>
          <Ionicons name="shield-checkmark" size={18} color="#fff" />
          <Text style={s.adminBtnText}>  Open Admin Dashboard</Text>
        </TouchableOpacity>
      )}

      {/* Tabs */}
      <View style={s.tabRow}>
        {tabs.map(t => (
          <TouchableOpacity key={t.key} style={[s.tab, activeTab===t.key && s.tabActive]} onPress={() => setActiveTab(t.key)}>
            <Ionicons name={t.icon} size={16} color={activeTab===t.key?'#6366f1':'#6b7280'} />
            <Text style={[s.tabText, activeTab===t.key && s.tabTextActive]}> {t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders */}
      {activeTab==='orders' && (
        <Section title="Shop Orders">
          {loading ? <ActivityIndicator color="#6366f1" /> : shopOrders.length===0 ? (
            <Text style={s.empty}>No orders yet</Text>
          ) : shopOrders.map(o => (
            <TouchableOpacity key={o._id} style={s.orderCard} onPress={() => setExpanded(expanded===o._id?null:o._id)}>
              <View style={s.orderHeader}>
                <Text style={s.orderId}>Order #{o._id.slice(-6).toUpperCase()}</Text>
                <StatusBadge status={o.status} map={ORDER_STATUSES} />
              </View>
              <Text style={s.orderTotal}>LKR {o.totalAmount?.toFixed(2)}</Text>
              <Text style={s.orderDate}>{new Date(o.createdAt).toLocaleDateString()}</Text>
              {expanded===o._id && (
                <View style={s.orderDetails}>
                  <Text style={s.trackingTitle}>Live Status Tracking</Text>
                  <ProgressStep currentStatus={o.status} steps={shopSteps} map={ORDER_STATUSES} />
                  
                  <View style={s.divider} />
                  
                  {o.items?.map((item, i) => (
                    <Text key={i} style={s.orderItem}>{item.productName} × {item.quantity} — LKR {item.price?.toFixed(2)}</Text>
                  ))}
                  {o.trackingNumber && (
                    <View style={s.trackingBox}>
                      <Ionicons name="airplane-outline" size={14} color="#6366f1" />
                      <Text style={s.trackingText}>Tracking ID: {o.trackingNumber}</Text>
                    </View>
                  )}
                  <Text style={s.shipAddr}>{o.shippingAddress}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </Section>
      )}

      {activeTab==='3d' && (
        <Section title="3D Print Orders">
          {loading ? <ActivityIndicator color="#6366f1" /> : stlOrders.length===0 ? (
            <Text style={s.empty}>No 3D print orders yet</Text>
          ) : stlOrders.map(o => (
            <TouchableOpacity key={o._id} style={s.orderCard} onPress={() => setExpanded(expanded===o._id?null:o._id)}>
              <View style={s.orderHeader}>
                <Text style={s.orderId}>#{o._id.slice(-6).toUpperCase()}</Text>
                <StatusBadge status={o.status} map={STL_STATUSES} />
              </View>
              <Text style={s.orderInfo}>{o.material} — Qty: {o.quantity}</Text>
              {o.estimatedPrice && <Text style={s.orderTotal}>LKR {o.estimatedPrice?.toFixed(2)}</Text>}
              {expanded===o._id && (
                <View style={s.orderDetails}>
                  <Text style={s.trackingTitle}>Production Roadmap</Text>
                  <ProgressStep currentStatus={o.status} steps={stlSteps} map={STL_STATUSES} />

                  <View style={s.divider} />

                  <Text style={s.orderItem}>File: {o.fileName?.replace(/^[0-9a-f-]+-/i,'')}</Text>
                  {o.weightGrams    && <Text style={s.orderItem}>Weight: {o.weightGrams}g</Text>}
                  {o.printTimeHours != null && <Text style={s.orderItem}>Print Time: {o.printTimeHours}h {o.printTimeMinutes}m</Text>}
                  {o.note && <Text style={s.orderItem}>Note: {o.note}</Text>}
                  {o.status==='QUOTED' && (
                    <TouchableOpacity
                      style={s.confirmBtn}
                      onPress={() => confirmOrder(o._id)}
                      disabled={confirmingId===o._id}
                    >
                      {confirmingId===o._id ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.confirmBtnText}>Accept & Confirm Order</Text>}
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </Section>
      )}

      {activeTab==='profile' && (
        <Section title="Profile">
          <View style={s.profileCard}>
            <Text style={s.profileLabel}>Name</Text>
            <Text style={s.profileVal}>{user?.fullName}</Text>
            <Text style={s.profileLabel}>Email</Text>
            <Text style={s.profileVal}>{user?.email}</Text>
            <Text style={s.profileLabel}>Role</Text>
            <Text style={s.profileVal}>{user?.roles?.join(', ')}</Text>
          </View>
        </Section>
      )}

      {/* Logout */}
      <TouchableOpacity style={s.logoutBtn} onPress={() => Alert.alert('Logout','Are you sure you want to logout?',[{text:'Cancel',style:'cancel'},{text:'Logout',style:'destructive',onPress:logout}])}>
        <Ionicons name="log-out-outline" size={18} color="#ef4444" />
        <Text style={s.logoutText}>  Log Out</Text>
      </TouchableOpacity>
      <View style={{ height:32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex:1, backgroundColor:'#f9fafb' },
  header:       { flexDirection:'row', alignItems:'center', backgroundColor:'#1e1b4b', padding:24, gap:16 },
  avatar:       { width:64, height:64, borderRadius:32, backgroundColor:'rgba(255,255,255,0.15)', justifyContent:'center', alignItems:'center' },
  name:         { fontSize:20, fontWeight:'800', color:'#fff' },
  email:        { fontSize:14, color:'rgba(255,255,255,0.6)' },
  adminTag:     { backgroundColor:'#fbbf24', borderRadius:999, paddingHorizontal:8, paddingVertical:2, marginTop:4, alignSelf:'flex-start', fontSize:11, fontWeight:'700', color:'#78350f' },
  adminBtn:     { flexDirection:'row', alignItems:'center', backgroundColor:'#4338ca', margin:16, borderRadius:12, padding:14, justifyContent:'center' },
  adminBtnText: { color:'#fff', fontWeight:'700', fontSize:15 },
  tabRow:       { flexDirection:'row', backgroundColor:'#fff', marginHorizontal:16, marginBottom:8, borderRadius:12, padding:4, marginTop: -15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  tab:          { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', padding:12, borderRadius:10 },
  tabActive:    { backgroundColor:'#f8f7ff' },
  tabText:      { fontSize:13, color:'#6b7280', fontWeight:'700' },
  tabTextActive:{ color:'#6366f1' },
  section:      { padding:16, paddingTop:8 },
  sectionTitle: { fontSize:18, fontWeight:'800', color:'#111827', marginBottom:12 },
  empty:        { color:'#9ca3af', textAlign:'center', padding:24, marginTop: 40 },
  orderCard:    { backgroundColor:'#fff', borderRadius:20, padding:16, marginBottom:12, shadowColor:'#000', shadowOpacity:0.04, shadowRadius:10, elevation:2, borderWidth: 1, borderColor: '#f1f5f9' },
  orderHeader:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:4 },
  orderId:      { fontSize:14, fontWeight:'800', color:'#64748b' },
  badge:        { borderRadius:999, paddingHorizontal:10, paddingVertical:4 },
  badgeText:    { fontSize:10, fontWeight:'900', textTransform: 'uppercase' },
  orderTotal:   { fontSize:18, fontWeight:'900', color:'#1e1b4b' },
  orderInfo:    { fontSize:14, color:'#64748b', fontWeight: '600', marginBottom:2 },
  orderDate:    { fontSize:12, color:'#94a3b8', marginTop:2 },
  
  orderDetails: { borderTopWidth:1, borderTopColor:'#f1f5f9', marginTop:15, paddingTop:15 },
  trackingTitle:{ fontSize:11, fontWeight:'900', color:'#94a3b8', textTransform:'uppercase', marginBottom:15, letterSpacing: 0.5 },
  stepContainer:{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  stepWrapper:  { alignItems: 'center' },
  stepLineWrapper: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  stepCircle:   { width: 22, height: 22, borderRadius: 11, backgroundColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  stepDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: '#94a3b8' },
  line:         { height: 3, backgroundColor: '#cbd5e1', flex: 1, marginHorizontal: -5 },
  stepLabel:    { fontSize: 9, color: '#94a3b8', marginTop: 6, textAlign: 'center' },
  
  divider:      { height: 1, backgroundColor: '#f1f5f9', marginVertical: 15 },
  orderItem:    { fontSize: 13, color:'#475569', fontWeight: '500', marginBottom: 6 },
  trackingBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0f9ff', padding: 10, borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: '#bae6fd' },
  trackingText: { fontSize: 13, color: '#0369a1', fontWeight: '700' },
  shipAddr:     { fontSize: 13, color:'#64748b', marginTop: 10, lineHeight: 18 },
  
  confirmBtn:   { backgroundColor:'#22c55e', borderRadius:14, padding:15, alignItems:'center', marginTop:15, shadowColor: '#22c55e', shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  confirmBtnText:{ color:'#fff', fontWeight:'800', fontSize:15 },
  profileCard:  { backgroundColor:'#fff', borderRadius:20, padding:20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  profileLabel: { fontSize:11, color:'#94a3b8', fontWeight:'800', textTransform: 'uppercase', marginTop:15, marginBottom:4 },
  profileVal:   { fontSize:16, color:'#1e1b4b', fontWeight:'700' },
  logoutBtn:    { flexDirection:'row', alignItems:'center', justifyContent:'center', margin:20, backgroundColor:'#fff', borderWidth:1.5, borderColor:'#fee2e2', borderRadius:16, padding:16 },
  logoutText:   { color:'#ef4444', fontSize:15, fontWeight:'800' },
});
