/**
 * MyAccountScreen.jsx — User Account & Order History
 * Minimalist design
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
  const cfg = map[status] || { label: status };
  return (
    <View style={s.badge}>
      <Text style={s.badgeText}>{cfg.label}</Text>
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

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#000" />}
    >
      <View style={s.header}>
        <View style={s.avatar}><Ionicons name="person" size={32} color="#000" /></View>
        <View>
          <Text style={s.name}>{user?.fullName}</Text>
          <Text style={s.email}>{user?.email}</Text>
          {isAdmin && <View style={s.adminTag}><Text style={s.adminTagText}>ADMIN</Text></View>}
        </View>
      </View>

      {isAdmin && (
        <TouchableOpacity style={s.adminBtn} onPress={() => nav.navigate('AdminStack')}>
          <Ionicons name="shield-checkmark" size={18} color="#fff" />
          <Text style={s.adminBtnText}>  Open Admin Dashboard</Text>
        </TouchableOpacity>
      )}

      <View style={s.tabRow}>
        {tabs.map(t => (
          <TouchableOpacity key={t.key} style={[s.tab, activeTab===t.key && s.tabActive]} onPress={() => setActiveTab(t.key)}>
            <Ionicons name={t.icon} size={16} color={activeTab===t.key?'#fff':'#666'} />
            <Text style={[s.tabText, activeTab===t.key && s.tabTextActive]}> {t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab==='orders' && (
        <Section title="Shop Orders">
          {loading ? <ActivityIndicator color="#000" /> : shopOrders.length===0 ? (
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
                  {o.items?.map((item, i) => (
                    <Text key={i} style={s.orderItem}>{item.productName} × {item.quantity} — LKR {item.price?.toFixed(2)}</Text>
                  ))}
                  {o.trackingNumber && <Text style={s.tracking}>Tracking: {o.trackingNumber}</Text>}
                  <Text style={s.shipAddr}>{o.shippingAddress}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </Section>
      )}

      {activeTab==='3d' && (
        <Section title="3D Print Orders">
          {loading ? <ActivityIndicator color="#000" /> : stlOrders.length===0 ? (
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

      <TouchableOpacity style={s.logoutBtn} onPress={() => Alert.alert('Logout','Are you sure you want to logout?',[{text:'Cancel',style:'cancel'},{text:'Logout',style:'destructive',onPress:logout}])}>
        <Ionicons name="log-out-outline" size={18} color="#000" />
        <Text style={s.logoutText}>  Log Out</Text>
      </TouchableOpacity>
      <View style={{ height:32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex:1, backgroundColor:'#fafafa' },
  header:       { flexDirection:'row', alignItems:'center', backgroundColor:'#fff', padding:24, gap:16, borderBottomWidth: 1, borderColor: '#eee' },
  avatar:       { width:64, height:64, borderRadius:32, backgroundColor:'#f0f0f0', justifyContent:'center', alignItems:'center', borderWidth: 1, borderColor: '#ccc' },
  name:         { fontSize:20, fontWeight:'800', color:'#000' },
  email:        { fontSize:14, color:'#666' },
  adminTag:     { backgroundColor:'#000', borderRadius:4, paddingHorizontal:6, paddingVertical:2, marginTop:4, alignSelf:'flex-start' },
  adminTagText: { fontSize:10, fontWeight:'800', color:'#fff', letterSpacing: 1 },
  adminBtn:     { flexDirection:'row', alignItems:'center', backgroundColor:'#000', margin:16, borderRadius:8, padding:14, justifyContent:'center' },
  adminBtnText: { color:'#fff', fontWeight:'700', fontSize:15 },
  tabRow:       { flexDirection:'row', marginHorizontal:16, marginBottom:8, borderRadius:8, padding:4, backgroundColor: '#eee' },
  tab:          { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', padding:10, borderRadius:6 },
  tabActive:    { backgroundColor:'#000' },
  tabText:      { fontSize:13, color:'#666', fontWeight:'600' },
  tabTextActive:{ color:'#fff' },
  section:      { padding:16, paddingTop:8 },
  sectionTitle: { fontSize:16, fontWeight:'800', color:'#000', marginBottom:12, textTransform: 'uppercase' },
  empty:        { color:'#999', textAlign:'center', padding:24 },
  orderCard:    { backgroundColor:'#fff', borderRadius:8, padding:16, marginBottom:10, borderWidth: 1, borderColor: '#eaeaea' },
  orderHeader:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:4 },
  orderId:      { fontSize:14, fontWeight:'700', color:'#000' },
  badge:        { borderRadius:4, paddingHorizontal:8, paddingVertical:4, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#eee' },
  badgeText:    { fontSize:10, fontWeight:'700', color: '#000', textTransform: 'uppercase' },
  orderTotal:   { fontSize:16, fontWeight:'800', color:'#000' },
  orderInfo:    { fontSize:13, color:'#666', marginBottom:2 },
  orderDate:    { fontSize:12, color:'#999', marginTop:2 },
  orderDetails: { borderTopWidth:1, borderTopColor:'#eee', marginTop:10, paddingTop:10 },
  orderItem:    { fontSize:13, color:'#333', marginBottom:4 },
  tracking:     { fontSize:13, color:'#000', fontWeight:'600', marginTop:6 },
  shipAddr:     { fontSize:13, color:'#666', marginTop:6 },
  confirmBtn:   { backgroundColor:'#000', borderRadius:8, padding:12, alignItems:'center', marginTop:10 },
  confirmBtnText:{ color:'#fff', fontWeight:'700', fontSize:14 },
  profileCard:  { backgroundColor:'#fff', borderRadius:8, padding:16, borderWidth: 1, borderColor: '#eaeaea' },
  profileLabel: { fontSize:11, color:'#666', fontWeight:'700', marginTop:10, marginBottom:2, textTransform: 'uppercase' },
  profileVal:   { fontSize:16, color:'#000', fontWeight:'600' },
  logoutBtn:    { flexDirection:'row', alignItems:'center', justifyContent:'center', margin:16, backgroundColor:'#fff', borderWidth:1, borderColor:'#000', borderRadius:8, padding:14 },
  logoutText:   { color:'#000', fontSize:15, fontWeight:'700' },
});
