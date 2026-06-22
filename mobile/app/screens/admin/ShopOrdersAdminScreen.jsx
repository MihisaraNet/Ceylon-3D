import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, SafeAreaView, StatusBar, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { ORDER_STATUSES } from '../../data/categories';
import { useTheme } from '../../context/ThemeContext';

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function ShopOrdersAdminScreen() {
  const { theme, isDarkMode } = useTheme();
  const s = getStyles(theme);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [trackingInputs, setTrackingInputs] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders/admin');
      setOrders(data);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/orders/admin/${id}/status`, { status });
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update status');
    }
  };

  const setTracking = async (id) => {
    const tn = trackingInputs[id];
    if (!tn) return Alert.alert('Error', 'Enter a tracking number');
    try {
      await api.put(`/orders/admin/${id}/tracking`, { trackingNumber: tn });
      load();
      Alert.alert('Success', 'Tracking number updated');
    } catch (err) {
      Alert.alert('Error', 'Failed to update tracking');
    }
  };

  const renderItem = ({ item }) => {
    const cfg = ORDER_STATUSES[item.status] || { label: item.status, color: theme.textSecondary };
    const isOpen = expanded === item._id;
    const customerName = item.userId?.fullName || item.shippingAddress?.split('\n')[0] || 'Customer';

    return (
      <View style={[s.card, isOpen && s.cardExpanded]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => setExpanded(isOpen ? null : item._id)} style={s.cardHeader}>
          <View style={s.headerLeft}>
            <View style={s.idRow}>
              <Text style={s.orderId}>#{item._id.slice(-6).toUpperCase()}{item.category === 'STL' ? ' 🖨️' : ''}</Text>
              <View style={[s.statusBadge, { backgroundColor: cfg.color + '15' }]}>
                <View style={[s.statusDot, { backgroundColor: cfg.color }]} />
                <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            </View>
            <Text style={s.customerName}>{customerName}</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.price}>LKR {item.totalAmount?.toFixed(2)}</Text>
            <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={theme.icon} />
          </View>
        </TouchableOpacity>

        {isOpen && (
          <View style={s.details}>
            <Text style={s.sectionTitle}>Ordered Items</Text>
            <View style={s.itemsList}>
              {item.items?.map((it, idx) => (
                <View key={idx} style={s.orderItem}>
                  <View style={s.itemIconBg}>
                    <Ionicons name="cube-outline" size={14} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.itemName}>{it.productName}</Text>
                    <Text style={s.itemMeta}>Qty: {it.quantity} × LKR {it.price?.toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={s.addressBox}>
              <Text style={s.addressLabel}>Shipping Address</Text>
              <Text style={s.addressText}>{item.shippingAddress}</Text>
            </View>

            <Text style={s.sectionTitle}>Tracking Management</Text>
            {item.trackingNumber && (
              <View style={s.trackingBanner}>
                <Ionicons name="airplane-outline" size={16} color={theme.primary} />
                <Text style={s.trackingValText}>Current: {item.trackingNumber}</Text>
              </View>
            )}
            <View style={s.trackInputRow}>
              <TextInput
                style={s.trackInput}
                value={trackingInputs[item._id] || ''}
                onChangeText={v => setTrackingInputs(p => ({ ...p, [item._id]: v }))}
                placeholder="New tracking ID"
                placeholderTextColor={theme.icon}
              />
              <TouchableOpacity style={s.trackBtn} onPress={() => setTracking(item._id)}>
                <Text style={s.trackBtnText}>Update</Text>
              </TouchableOpacity>
            </View>

            <View style={s.divider} />

            <Text style={s.sectionTitle}>Update Progress</Text>
            <View style={s.chipsRow}>
              {STATUS_OPTIONS.map(st => (
                <TouchableOpacity
                  key={st}
                  style={[s.chip, item.status === st && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                  onPress={() => updateStatus(item._id, st)}
                >
                  <Text style={[s.chipText, item.status === st && { color: theme.primaryText }]}>{st}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      <View style={s.headerContainer}>
        <Text style={s.title}>Shop Orders</Text>
        <View style={s.countBadge}><Text style={s.countText}>{orders.length}</Text></View>
      </View>

      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={i => i._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={s.empty}>No shop orders found.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (t) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  headerContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: '900', color: t.text, letterSpacing: -0.5 },
  countBadge: { backgroundColor: t.primary + '1A', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  countText: { fontSize: 13, fontWeight: '900', color: t.primary },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: t.card, borderRadius: 24, overflow: 'hidden', shadowColor: t.text, shadowOpacity: 0.04, shadowRadius: 15, elevation: 3, borderWidth: 1, borderColor: t.border },
  cardExpanded: { shadowOpacity: 0.08, shadowRadius: 20, elevation: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  headerLeft: { flex: 1, gap: 4 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  orderId: { fontSize: 14, fontWeight: '800', color: t.textSecondary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  customerName: { fontSize: 17, fontWeight: '800', color: t.text },
  headerRight: { alignItems: 'flex-end', justifyContent: 'space-between', paddingVertical: 2 },
  price: { fontSize: 16, fontWeight: '900', color: t.primary },

  details: { padding: 16, borderTopWidth: 1, borderTopColor: t.background, backgroundColor: t.card },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: t.text, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
  itemsList: { gap: 8, marginBottom: 20 },
  orderItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.card, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: t.border },
  itemIconBg: { width: 30, height: 30, borderRadius: 8, backgroundColor: t.background, justifyContent: 'center', alignItems: 'center' },
  itemName: { fontSize: 14, fontWeight: '700', color: t.text },
  itemMeta: { fontSize: 12, color: t.textSecondary, fontWeight: '500' },

  addressBox: { backgroundColor: t.card, padding: 14, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: t.border },
  addressLabel: { fontSize: 10, fontWeight: '800', color: t.icon, textTransform: 'uppercase', marginBottom: 4 },
  addressText: { fontSize: 13, color: t.text, fontWeight: '600', lineHeight: 18 },

  trackingBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.primary + '1A', padding: 10, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: t.primary + '40' },
  trackingValText: { fontSize: 13, fontWeight: '700', color: t.primary },
  trackInputRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  trackInput: { flex: 1, height: 45, backgroundColor: t.background, borderRadius: 12, paddingHorizontal: 15, borderWidth: 1.5, borderColor: t.border, fontSize: 14, color: t.text, fontWeight: '600' },
  trackBtn: { backgroundColor: t.primary, paddingHorizontal: 15, borderRadius: 12, justifyContent: 'center' },
  trackBtnText: { color: t.primaryText, fontWeight: '800', fontSize: 13 },

  divider: { height: 1, backgroundColor: t.border, marginVertical: 16 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: t.background, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: t.border },
  chipText: { fontSize: 12, fontWeight: '700', color: t.textSecondary },
  empty: { textAlign: 'center', color: t.icon, marginTop: 100, fontSize: 16, fontWeight: '600' },
});
