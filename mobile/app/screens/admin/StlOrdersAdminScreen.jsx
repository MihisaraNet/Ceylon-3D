import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { STL_STATUSES } from '../../data/categories';
import { useTheme } from '../../context/ThemeContext';

const STATUS_OPTIONS = ['PENDING_QUOTE', 'QUOTED', 'CONFIRMED', 'PRINTING', 'READY', 'DELIVERED', 'CANCELLED'];

export default function StlOrdersAdminScreen() {
  const { theme, isDarkMode } = useTheme();
  const s = getStyles(theme);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/stl-orders/admin');
      setOrders(data);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/stl-orders/admin/${id}/status`, { status });
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed');
    }
  };

  const deleteOrder = (id) => {
    Alert.alert('Delete Order', 'Permanently remove this STL order and its file?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/stl-orders/admin/${id}`);
            load();
          } catch (err) {
            Alert.alert('Error', 'Delete failed');
          }
        }
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const cfg = STL_STATUSES[item.status] || { label: item.status, color: theme.textSecondary };
    const isOpen = expanded === item._id;
    return (
      <View style={[s.card, isOpen && s.cardExpanded]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => setExpanded(isOpen ? null : item._id)} style={s.cardHeader}>
          <View style={s.headerLeft}>
            <View style={s.idRow}>
              <Text style={s.orderId}>#{item._id.slice(-6).toUpperCase()}</Text>
              <View style={[s.statusBadge, { backgroundColor: cfg.color + '15' }]}>
                <View style={[s.statusDot, { backgroundColor: cfg.color }]} />
                <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            </View>
            <Text style={s.customerName}>{item.customerName}</Text>
            <Text style={s.customerEmail}>{item.customerEmail}</Text>
          </View>
          <View style={s.headerRight}>
            {item.estimatedPrice && <Text style={s.price}>LKR {item.estimatedPrice?.toFixed(2)}</Text>}
            <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={theme.icon} />
          </View>
        </TouchableOpacity>

        {isOpen && (
          <View style={s.details}>
            <View style={s.detailsGrid}>
              <Info label="Material" icon="cube-outline" value={item.material} s={s} theme={theme} />
              <Info label="Quantity" icon="layers-outline" value={String(item.quantity)} s={s} theme={theme} />
              <Info label="File" icon="document-outline" value={item.fileName?.replace(/^[0-9a-f-]+-/i, '')} s={s} theme={theme} />
              <Info label="Phone" icon="call-outline" value={item.phone || '-'} s={s} theme={theme} />
            </View>

            <View style={s.addressBox}>
              <Text style={s.addressLabel}>Delivery Address</Text>
              <Text style={s.addressText}>{item.address || 'No address provided'}</Text>
            </View>

            {item.note && (
              <View style={s.noteBox}>
                <Ionicons name="chatbox-outline" size={14} color={theme.warning} style={{ marginTop: 2 }} />
                <Text style={s.noteText}>{item.note}</Text>
              </View>
            )}

            <Text style={s.sectionTitle}>Update Progress</Text>
            <View style={s.chipsRow}>
              {STATUS_OPTIONS.map(st => (
                <TouchableOpacity
                  key={st}
                  style={[s.chip, item.status === st && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                  onPress={() => updateStatus(item._id, st)}
                >
                  <Text style={[s.chipText, item.status === st && { color: theme.primaryText }]}>{st.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={s.deleteBtn} onPress={() => deleteOrder(item._id)}>
              <Ionicons name="trash-outline" size={16} color={theme.error} />
              <Text style={s.deleteBtnText}>Delete Order</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      <View style={s.headerContainer}>
        <Text style={s.title}>STL Orders</Text>
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
          ListEmptyComponent={<Text style={s.empty}>No custom print orders yet.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const Info = ({ label, icon, value, s, theme }) => (
  <View style={s.infoItem}>
    <View style={s.infoIconBg}>
      <Ionicons name={icon} size={14} color={theme.primary} />
    </View>
    <View>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoVal} numberOfLines={1}>{value}</Text>
    </View>
  </View>
);

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
  customerEmail: { fontSize: 13, color: t.icon, fontWeight: '500' },
  headerRight: { alignItems: 'flex-end', justifyContent: 'space-between', paddingVertical: 2 },
  price: { fontSize: 16, fontWeight: '900', color: t.primary },
  
  details: { padding: 16, borderTopWidth: 1, borderTopColor: t.background, backgroundColor: t.card },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginBottom: 20 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '45%' },
  infoIconBg: { width: 28, height: 28, borderRadius: 8, backgroundColor: t.background, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 11, color: t.icon, fontWeight: '700', textTransform: 'uppercase' },
  infoVal: { fontSize: 13, color: t.text, fontWeight: '700' },
  
  addressBox: { backgroundColor: t.card, padding: 14, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: t.border },
  addressLabel: { fontSize: 11, fontWeight: '800', color: t.icon, textTransform: 'uppercase', marginBottom: 4 },
  addressText: { fontSize: 14, color: t.text, fontWeight: '600', lineHeight: 20 },
  
  noteBox: { flexDirection: 'row', gap: 8, backgroundColor: t.warning + '1A', padding: 12, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: t.warning + '40' },
  noteText: { fontSize: 13, color: t.warning, flex: 1, fontWeight: '500' },
  
  sectionTitle: { fontSize: 13, fontWeight: '800', color: t.text, textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { backgroundColor: t.card, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: t.border },
  chipText: { fontSize: 12, fontWeight: '700', color: t.textSecondary },
  
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderTopWidth: 1, borderTopColor: t.border, marginTop: 10 },
  deleteBtnText: { color: t.error, fontWeight: '800', fontSize: 14 },
  empty: { textAlign: 'center', color: t.icon, marginTop: 100, fontSize: 16, fontWeight: '600' },
});
