/**
 * AdminDashboardScreen.jsx — Admin Management Console with Analytics
 *
 * Sections:
 *   1. KPI stat cards (STL Orders, Shop Orders, Products, Pending Quotes)
 *   2. Analytics Section:
 *      - Monthly Revenue chart (line/bar hybrid, last 6 months)
 *      - Best-Selling Products horizontal bar chart (top 5)
 *      - Active 3D Print Jobs KPI with status indicator
 *   3. Quick action links
 *
 * Charts are built with pure React Native Views (no external chart library).
 * Analytics data is fetched from GET /orders/admin/analytics.
 *
 * @module screens/admin/AdminDashboardScreen
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Dimensions, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../lib/api';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - 64; // card padding on both sides

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, color, onPress }) => (
  <TouchableOpacity style={[s.statCard, { borderTopColor: color }]} onPress={onPress} activeOpacity={0.8}>
    <View style={[s.statIconWrap, { backgroundColor: color + '1A' }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={s.statVal}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </TouchableOpacity>
);

/* ─── Section Header ─────────────────────────────────────────────────────── */
const SectionHeader = ({ icon, title, color }) => (
  <View style={s.sectionHeaderRow}>
    <View style={[s.sectionIconWrap, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={16} color={color} />
    </View>
    <Text style={s.sectionTitle}>{title}</Text>
  </View>
);

/* ─── Monthly Revenue Bar Chart ──────────────────────────────────────────── */
const RevenueChart = ({ data }) => {
  const maxRev = Math.max(...data.map(d => d.revenue), 1);
  const anim = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = data.map((_, i) =>
      Animated.timing(anim[i], {
        toValue: 1,
        duration: 600,
        delay: i * 80,
        useNativeDriver: false,
      })
    );
    Animated.stagger(80, animations).start();
  }, [data]);

  const BAR_MAX_H = 110;
  const BAR_W    = Math.floor((CHART_W - (data.length - 1) * 6) / data.length);

  return (
    <View style={s.chartCard}>
      <SectionHeader icon="bar-chart-outline" title="Monthly Revenue (LKR)" color="#6366f1" />
      <View style={s.barChartArea}>
        {data.map((item, i) => {
          const ratio = item.revenue / maxRev;
          const barH  = anim[i].interpolate({ inputRange: [0, 1], outputRange: [2, Math.max(ratio * BAR_MAX_H, 4)] });
          return (
            <View key={item.month} style={[s.barCol, { width: BAR_W }]}>
              <Text style={s.barRevLabel}>
                {item.revenue >= 1000 ? `${(item.revenue / 1000).toFixed(1)}k` : item.revenue}
              </Text>
              <View style={{ height: BAR_MAX_H, justifyContent: 'flex-end' }}>
                <Animated.View style={{ height: barH, width: BAR_W, borderRadius: 6, overflow: 'hidden' }}>
                  <LinearGradient
                    colors={item.revenue === 0 ? ['#e5e7eb', '#d1d5db'] : ['#818cf8', '#4f46e5']}
                    style={{ flex: 1, borderRadius: 6 }}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  />
                </Animated.View>
              </View>
              <Text style={s.barLabel}>{item.month}</Text>
            </View>
          );
        })}
      </View>
      {/* Baseline */}
      <View style={s.barBaseline} />
    </View>
  );
};

/* ─── Best Selling Products Horizontal Bar Chart ─────────────────────────── */
const BestSellersChart = ({ data }) => {
  const maxSold = Math.max(...data.map(d => d.sold), 1);
  const anim = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    data.forEach((_, i) => {
      Animated.timing(anim[i], {
        toValue: 1,
        duration: 500,
        delay: 200 + i * 100,
        useNativeDriver: false,
      }).start();
    });
  }, [data]);

  const PALETTE = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];
  const LABEL_W = 90;
  const BAR_AREA_W = CHART_W - LABEL_W - 48;

  return (
    <View style={s.chartCard}>
      <SectionHeader icon="trophy-outline" title="Best-Selling Products (Units)" color="#8b5cf6" />
      {data.length === 0 ? (
        <Text style={s.emptyMsg}>No sales data yet</Text>
      ) : (
        <View style={{ gap: 12, marginTop: 8 }}>
          {data.map((item, i) => {
            const ratio = item.sold / maxSold;
            const barW  = anim[i].interpolate({ inputRange: [0, 1], outputRange: [4, Math.max(ratio * BAR_AREA_W, 8)] });
            // Truncate long product names
            const displayName = item.name.length > 14 ? item.name.slice(0, 13) + '…' : item.name;
            return (
              <View key={item.name} style={s.hBarRow}>
                <Text style={[s.hBarLabel, { width: LABEL_W }]} numberOfLines={1}>{displayName}</Text>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Animated.View
                    style={{
                      height: 18,
                      width: barW,
                      borderRadius: 5,
                      backgroundColor: PALETTE[i % PALETTE.length],
                    }}
                  />
                </View>
                <Text style={s.hBarVal}>{item.sold}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

/* ─── Active Print Jobs KPI Card ─────────────────────────────────────────── */
const ActivePrintJobsCard = ({ count, onPress }) => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.18, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const isActive = count > 0;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <LinearGradient
        colors={isActive ? ['#6d28d9', '#4f46e5'] : ['#374151', '#1f2937']}
        style={s.printJobsCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={s.printJobsLeft}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {isActive && (
              <Animated.View style={[s.pulseDot, { transform: [{ scale: pulse }] }]} />
            )}
            <Text style={s.printJobsLabel}>Active 3D Print Jobs</Text>
          </View>
          <Text style={s.printJobsCount}>{count}</Text>
          <Text style={s.printJobsSub}>
            {count === 0
              ? 'No jobs currently printing'
              : `${count} job${count > 1 ? 's' : ''} confirmed, printing, or ready`}
          </Text>
        </View>
        <View style={s.printJobsIconWrap}>
          <Ionicons name="print-outline" size={42} color="rgba(255,255,255,0.25)" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

/* ─── Main Screen ────────────────────────────────────────────────────────── */
export default function AdminDashboardScreen() {
  const nav = useNavigation();

  const [stats, setStats]           = useState({ stlOrders: 0, shopOrders: 0, products: 0, pendingQuotes: 0 });
  const [analytics, setAnalytics]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [analyticsLoading, setAL]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* Fetch core KPI counts */
  const loadStats = useCallback(async () => {
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
  }, []);

  /* Fetch analytics data */
  const loadAnalytics = useCallback(async () => {
    setAL(true);
    try {
      const { data } = await api.get('/orders/admin/analytics');
      setAnalytics(data);
    } catch {
      setAnalytics(null);
    } finally {
      setAL(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadStats(), loadAnalytics()]);
    setLoading(false);
  }, [loadStats, loadAnalytics]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: 32 }}
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
      <LinearGradient colors={['#4f46e5', '#7c3aed']} style={s.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.headerTitle}>Admin Dashboard</Text>
            <Text style={s.headerSub}>Ceylon 3D — Management Console</Text>
          </View>
          <View style={s.headerBadge}>
            <Ionicons name="shield-checkmark" size={18} color="#e0e7ff" />
          </View>
        </View>
      </LinearGradient>

      {/* KPI Cards */}
      {loading ? (
        <ActivityIndicator color="#6366f1" style={{ marginTop: 40 }} />
      ) : (
        <View style={s.statsGrid}>
          <StatCard icon="print-outline"     label="STL Orders"     value={stats.stlOrders}     color="#8b5cf6" onPress={() => nav.navigate('StlOrdersAdmin')} />
          <StatCard icon="cart-outline"      label="Shop Orders"    value={stats.shopOrders}    color="#3b82f6" onPress={() => nav.navigate('ShopOrdersAdmin')} />
          <StatCard icon="cube-outline"      label="Products"       value={stats.products}      color="#10b981" onPress={() => nav.navigate('ManageProducts')} />
          <StatCard icon="hourglass-outline" label="Pending Quotes" value={stats.pendingQuotes} color="#f59e0b" onPress={() => nav.navigate('StlOrdersAdmin')} />
        </View>
      )}

      {/* ── Analytics Section ─────────────────────────────────── */}
      <View style={s.analyticsSectionHeader}>
        <Ionicons name="analytics-outline" size={20} color="#6366f1" />
        <Text style={s.analyticsSectionTitle}>Analytics</Text>
      </View>

      {analyticsLoading ? (
        <View style={s.analyticsLoader}>
          <ActivityIndicator color="#6366f1" />
          <Text style={s.analyticsLoaderText}>Loading analytics…</Text>
        </View>
      ) : analytics ? (
        <View style={s.analyticsContent}>
          {/* Monthly Revenue Chart */}
          <RevenueChart data={analytics.monthlyRevenue} />

          {/* Best Selling Products */}
          <BestSellersChart data={analytics.bestSellingProducts} />

          {/* Active Print Jobs */}
          <ActivePrintJobsCard
            count={analytics.activePrintJobs}
            onPress={() => nav.navigate('StlOrdersAdmin')}
          />
        </View>
      ) : (
        <View style={s.analyticsError}>
          <Ionicons name="cloud-offline-outline" size={32} color="#9ca3af" />
          <Text style={s.analyticsErrorText}>Analytics unavailable</Text>
        </View>
      )}

      {/* Quick Actions */}
      <Text style={s.quickActionsTitle}>Quick Actions</Text>
      <View style={s.actions}>
        {[
          { icon: 'add-circle-outline', label: 'Add Product',     nav: 'AddEditProduct',  color: '#10b981' },
          { icon: 'list-outline',       label: 'Manage Products', nav: 'ManageProducts',  color: '#3b82f6' },
          { icon: 'print-outline',      label: 'STL Orders',      nav: 'StlOrdersAdmin',  color: '#8b5cf6' },
          { icon: 'receipt-outline',    label: 'Shop Orders',     nav: 'ShopOrdersAdmin', color: '#f59e0b' },
          { icon: 'calculator-outline', label: 'Cost Calculator', nav: 'CostCalculator',  color: '#ef4444' },
        ].map(a => (
          <TouchableOpacity key={a.nav} style={s.actionBtn} onPress={() => nav.navigate(a.nav)} activeOpacity={0.8}>
            <View style={[s.actionIcon, { backgroundColor: a.color + '20' }]}>
              <Ionicons name={a.icon} size={22} color={a.color} />
            </View>
            <Text style={s.actionLabel}>{a.label}</Text>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f3f4f6' },

  /* Header */
  header:       { padding: 24, paddingTop: 36, paddingBottom: 28 },
  headerTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle:  { fontSize: 26, fontWeight: '900', color: '#f8fafc', letterSpacing: -0.5 },
  headerSub:    { fontSize: 13, color: '#c7d2fe', marginTop: 3 },
  headerBadge:  { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },

  /* KPI Grid */
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16 },
  statCard:     { flex: 1, minWidth: '45%', backgroundColor: '#ffffff', borderRadius: 14, padding: 14, borderTopWidth: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  statIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statVal:      { fontSize: 26, fontWeight: '900', color: '#111827', marginBottom: 2 },
  statLabel:    { fontSize: 12, color: '#6b7280', fontWeight: '600' },

  /* Analytics section header */
  analyticsSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginTop: 4, marginBottom: 10 },
  analyticsSectionTitle:  { fontSize: 17, fontWeight: '800', color: '#111827' },

  analyticsContent: { paddingHorizontal: 16, gap: 14 },
  analyticsLoader:  { alignItems: 'center', paddingVertical: 32, gap: 10 },
  analyticsLoaderText: { color: '#9ca3af', fontSize: 13 },
  analyticsError:   { alignItems: 'center', paddingVertical: 28, gap: 8 },
  analyticsErrorText: { color: '#9ca3af', fontSize: 13 },

  /* Chart card shell */
  chartCard:    { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },

  /* Section header row inside charts */
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionIconWrap:  { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  sectionTitle:     { fontSize: 14, fontWeight: '700', color: '#374151' },

  /* Revenue bar chart */
  barChartArea: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 6, paddingTop: 8 },
  barCol:       { alignItems: 'center', gap: 4 },
  barRevLabel:  { fontSize: 9, color: '#9ca3af', fontWeight: '600', marginBottom: 2 },
  barLabel:     { fontSize: 10, color: '#6b7280', fontWeight: '600', marginTop: 4 },
  barBaseline:  { height: 1, backgroundColor: '#e5e7eb', marginTop: 6 },

  /* Horizontal bar chart */
  hBarRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hBarLabel:    { fontSize: 11, color: '#374151', fontWeight: '600' },
  hBarVal:      { width: 28, textAlign: 'right', fontSize: 12, color: '#6b7280', fontWeight: '700' },
  emptyMsg:     { textAlign: 'center', color: '#9ca3af', paddingVertical: 16, fontSize: 13 },

  /* Active print jobs */
  printJobsCard:    { borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', shadowColor: '#4f46e5', shadowOpacity: 0.25, shadowRadius: 12, elevation: 5 },
  printJobsLeft:    { flex: 1, gap: 4 },
  printJobsLabel:   { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  printJobsCount:   { fontSize: 44, fontWeight: '900', color: '#ffffff', lineHeight: 52 },
  printJobsSub:     { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  printJobsIconWrap:{ marginLeft: 8 },
  pulseDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: '#a5f3fc' },

  /* Quick Actions */
  quickActionsTitle: { fontSize: 17, fontWeight: '800', color: '#111827', paddingHorizontal: 16, marginTop: 20, marginBottom: 10 },
  actions:      { paddingHorizontal: 16, gap: 8 },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 14, padding: 14, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  actionIcon:   { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionLabel:  { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
});
