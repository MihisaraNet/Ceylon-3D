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
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl, SafeAreaView, StatusBar, Platform, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import api from '../../lib/api';
import { ORDER_STATUSES, STL_STATUSES } from '../../data/categories';

const Section = ({ title, children, theme }) => {
  const s = getStyles(theme);
  return (
  <View style={s.section}>
    <Text style={s.sectionTitle}>{title}</Text>
    {children}
  </View>
)};

const StatusBadge = ({ status, map, theme }) => {
  const s = getStyles(theme);
  const cfg = map[status] || { label: status, color: theme.icon };
  return <View style={[s.badge, { backgroundColor: cfg.color + '20' }]}>
    <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
  </View>;
};

const ProgressStep = ({ currentStatus, steps, map, theme }) => {
  const s = getStyles(theme);
  const currentIndex = steps.indexOf(currentStatus);
  return (
    <View style={s.stepContainer}>
      {steps.map((st, i) => {
        const isDone = i <= currentIndex;
        const isLast = i === steps.length - 1;
        const cfg = map[st] || { color: theme.border, label: st };
        return (
          <View key={st} style={[s.stepWrapper, !isLast && { flex: 1 }]}>
            <View style={s.stepLineWrapper}>
              <View style={[s.stepCircle, isDone && { backgroundColor: cfg.color }]}>
                {i < currentIndex ? (
                  <Ionicons name="checkmark" size={12} color={theme.primaryText} />
                ) : (
                  <View style={[s.stepDot, isDone && { backgroundColor: theme.primaryText }]} />
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
  const { clearCart } = useCart();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const s = getStyles(theme);
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

  // Handle logout
  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        await logout();
      }
      return;
    }

    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const tabs = [
    { key:'orders', label:'Orders',  icon:'receipt-outline' },
    { key:'3d',     label:'3D Jobs', icon:'print-outline' },
    { key:'profile',label:'Profile', icon:'person-outline' },
  ];

  const shopSteps = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const stlSteps  = ['PENDING_QUOTE', 'QUOTED', 'CONFIRMED', 'PRINTING', 'READY', 'DELIVERED'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.headerBg }}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.headerBg} />
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
        <View style={s.avatar}><Ionicons name="person" size={36} color={theme.text} /></View>
        <View>
          <Text style={s.name}>{user?.fullName}</Text>
          <Text style={s.email}>{user?.email}</Text>
          {isAdmin && <Text style={s.adminTag}>Admin</Text>}
        </View>
      </View>

      {isAdmin && (
        <TouchableOpacity style={s.adminBtn} onPress={() => nav.navigate('AdminStack')}>
          <Ionicons name="shield-checkmark" size={18} color={theme.primaryText} />
          <Text style={s.adminBtnText}>  Open Admin Dashboard</Text>
        </TouchableOpacity>
      )}

      {/* Tabs */}
      <View style={s.tabRow}>
        {tabs.map(t => (
          <TouchableOpacity key={t.key} style={[s.tab, activeTab===t.key && s.tabActive]} onPress={() => setActiveTab(t.key)}>
            <Ionicons name={t.icon} size={16} color={activeTab===t.key?theme.primary:theme.icon} />
            <Text style={[s.tabText, activeTab===t.key && s.tabTextActive]} numberOfLines={1}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders */}
      {activeTab==='orders' && (
        <Section title="Shop Orders" theme={theme}>
          {loading ? <ActivityIndicator color={theme.primary} /> : shopOrders.length===0 ? (
            <Text style={s.empty}>No orders yet</Text>
          ) : shopOrders.map(o => (
            <TouchableOpacity key={o._id} style={s.orderCard} onPress={() => setExpanded(expanded===o._id?null:o._id)}>
              <View style={s.orderHeader}>
                <Text style={s.orderId}>Order #{o._id.slice(-6).toUpperCase()}</Text>
                <StatusBadge status={o.status} map={ORDER_STATUSES} theme={theme} />
              </View>
              <Text style={s.orderTotal}>LKR {o.totalAmount?.toFixed(2)}</Text>
              <Text style={s.orderDate}>{new Date(o.createdAt).toLocaleDateString()}</Text>
              {expanded===o._id && (
                <View style={s.orderDetails}>
                  <Text style={s.trackingTitle}>Live Status Tracking</Text>
                  <ProgressStep currentStatus={o.status} steps={shopSteps} map={ORDER_STATUSES} theme={theme} />
                  
                  <View style={s.divider} />
                  
                  {o.items?.map((item, i) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={[s.orderItem, { marginBottom: 0, flex: 1 }]}>
                        {item.productName} × {item.quantity} — LKR {item.price?.toFixed(2)}
                      </Text>
                      {o.status === 'DELIVERED' && item.productId && (
                        <TouchableOpacity 
                          style={{ backgroundColor: theme.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginLeft: 10, borderWidth: 1, borderColor: theme.primary }}
                          onPress={() => nav.navigate('Review', { productId: item.productId, productName: item.productName })}
                        >
                          <Text style={{ fontSize: 12, color: theme.primary, fontWeight: '700' }}>Review</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  {o.trackingNumber && (
                    <View style={s.trackingBox}>
                      <Ionicons name="airplane-outline" size={14} color={theme.primary} />
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
        <Section title="3D Print Orders" theme={theme}>
          {loading ? <ActivityIndicator color={theme.primary} /> : stlOrders.length===0 ? (
            <Text style={s.empty}>No 3D print orders yet</Text>
          ) : stlOrders.map(o => (
            <TouchableOpacity key={o._id} style={s.orderCard} onPress={() => setExpanded(expanded===o._id?null:o._id)}>
              <View style={s.orderHeader}>
                <Text style={s.orderId}>#{o._id.slice(-6).toUpperCase()}</Text>
                <StatusBadge status={o.status} map={STL_STATUSES} theme={theme} />
              </View>
              <Text style={s.orderInfo}>{o.material} — Qty: {o.quantity}</Text>
              {o.estimatedPrice && <Text style={s.orderTotal}>LKR {o.estimatedPrice?.toFixed(2)}</Text>}
              {expanded===o._id && (
                <View style={s.orderDetails}>
                  <Text style={s.trackingTitle}>Production Roadmap</Text>
                  <ProgressStep currentStatus={o.status} steps={stlSteps} map={STL_STATUSES} theme={theme} />

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
                      {confirmingId===o._id ? <ActivityIndicator color="#f8fafc" size="small" /> : <Text style={s.confirmBtnText}>Accept & Confirm Order</Text>}
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </Section>
      )}

      {activeTab==='profile' && (
        <Section title="Profile" theme={theme}>
          <View style={s.profileCard}>
            <Text style={s.profileLabel}>Name</Text>
            <Text style={s.profileVal}>{user?.fullName}</Text>
            <Text style={s.profileLabel}>Email</Text>
            <Text style={s.profileVal}>{user?.email}</Text>
            <Text style={s.profileLabel}>Role</Text>
            <Text style={s.profileVal}>{user?.roles?.join(', ')}</Text>
            
            <Text style={s.profileLabel}>Theme</Text>
            <View style={s.themeToggleBtn}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={18} color={theme.primary} />
                <Text style={s.themeToggleText}>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.border, true: theme.primary + '80' }}
                thumbColor={isDarkMode ? theme.primary : '#f4f3f4'}
              />
            </View>
          </View>
        </Section>
      )}

      {/* Logout */}
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#ef4444" />
        <Text style={s.logoutText}>  Log Out</Text>
      </TouchableOpacity>
      <View style={{ height:40 }} />
    </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (t) => StyleSheet.create({
  container:    { flex:1, backgroundColor: t.background },
  header:       { flexDirection:'row', alignItems:'center', backgroundColor: t.headerBg, paddingHorizontal:20, paddingTop:16, paddingBottom:32, gap:16 },
  avatar:       { width:60, height:60, borderRadius:30, backgroundColor: t.glassBg, justifyContent:'center', alignItems:'center' },
  name:         { fontSize:18, fontWeight:'800', color: t.text, flexShrink:1 },
  email:        { fontSize:13, color: t.textSecondary, flexShrink:1 },
  adminTag:     { backgroundColor: t.warning + '30', borderRadius:999, paddingHorizontal:8, paddingVertical:2, marginTop:4, alignSelf:'flex-start', fontSize:11, fontWeight:'700', color: t.warning },
  adminBtn:     { flexDirection:'row', alignItems:'center', backgroundColor: t.primary, margin:16, marginTop:-16, borderRadius:12, padding:14, justifyContent:'center' },
  adminBtnText: { color: t.primaryText, fontWeight:'700', fontSize:15 },
  tabRow:       { flexDirection:'row', backgroundColor: t.card, marginHorizontal:16, marginBottom:8, borderRadius:12, padding:4, marginTop:-16, shadowColor: '#1a1a1a', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  tab:          { flex:1, minWidth:0, flexDirection:'row', alignItems:'center', justifyContent:'center', paddingVertical:10, paddingHorizontal:4, borderRadius:10, gap:4 },
  tabActive:    { backgroundColor: t.background },
  tabText:      { fontSize:12, color: t.icon, fontWeight:'700', flexShrink:1 },
  tabTextActive:{ color: t.primary },
  section:      { padding:16, paddingTop:8 },
  sectionTitle: { fontSize:18, fontWeight:'800', color: t.text, marginBottom:12 },
  empty:        { color: t.icon, textAlign:'center', padding:24, marginTop: 40 },
  orderCard:    { backgroundColor: t.card, borderRadius:20, padding:16, marginBottom:12, shadowColor:'#1a1a1a', shadowOpacity:0.04, shadowRadius:10, elevation:2, borderWidth: 1, borderColor: t.border },
  orderHeader:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:4 },
  orderId:      { fontSize:14, fontWeight:'800', color: t.textSecondary },
  badge:        { borderRadius:999, paddingHorizontal:10, paddingVertical:4 },
  badgeText:    { fontSize:10, fontWeight:'900', textTransform: 'uppercase' },
  orderTotal:   { fontSize:18, fontWeight:'900', color: t.text },
  orderInfo:    { fontSize:14, color: t.textSecondary, fontWeight: '600', marginBottom:2 },
  orderDate:    { fontSize:12, color: t.icon, marginTop:2 },
  
  orderDetails: { borderTopWidth:1, borderTopColor: t.border, marginTop:15, paddingTop:15 },
  trackingTitle:{ fontSize:11, fontWeight:'900', color: t.textSecondary, textTransform:'uppercase', marginBottom:15, letterSpacing: 0.5 },
  stepContainer:{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  stepWrapper:  { alignItems: 'center' },
  stepLineWrapper: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  stepCircle:   { width: 22, height: 22, borderRadius: 11, backgroundColor: t.border, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  stepDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: t.icon },
  line:         { height: 3, backgroundColor: t.border, flex: 1, marginHorizontal: -5 },
  stepLabel:    { fontSize: 9, color: t.icon, marginTop: 6, textAlign: 'center' },
  
  divider:      { height: 1, backgroundColor: t.border, marginVertical: 15 },
  orderItem:    { fontSize: 13, color: t.text, fontWeight: '500', marginBottom: 6 },
  trackingBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.glassBg, padding: 10, borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: t.glassBorder },
  trackingText: { fontSize: 13, color: t.text, fontWeight: '700' },
  shipAddr:     { fontSize: 13, color: t.textSecondary, marginTop: 10, lineHeight: 18 },
  
  confirmBtn:   { backgroundColor: t.success, borderRadius:14, padding:15, alignItems:'center', marginTop:15, shadowColor: t.success, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  confirmBtnText:{ color: t.primaryText, fontWeight:'800', fontSize:15 },
  profileCard:  { backgroundColor: t.card, borderRadius:20, padding:20, shadowColor: '#1a1a1a', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  profileLabel: { fontSize:11, color: t.icon, fontWeight:'800', textTransform: 'uppercase', marginTop:15, marginBottom:4 },
  profileVal:   { fontSize:16, color: t.text, fontWeight:'700' },
  themeToggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, paddingVertical: 5 },
  themeToggleText: { fontSize: 15, color: t.primary, fontWeight: '700' },
  logoutBtn:    { flexDirection:'row', alignItems:'center', justifyContent:'center', margin:20, backgroundColor: t.card, borderWidth:1.5, borderColor: t.error, borderRadius:16, padding:16 },
  logoutText:   { color: t.error, fontSize:15, fontWeight:'800' },
});
