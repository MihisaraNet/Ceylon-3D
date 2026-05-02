/**
 * HomeScreen.jsx — Landing / Home Page
 *
 * The main entry screen of the LayerForge 3D app, displayed as the first tab.
 * Features a minimalist, modern layout with simple colors.
 *
 * @module screens/shop/HomeScreen
 */
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Platform, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Ionicons } from '@expo/vector-icons';

const SERVICE_CARDS = [
  { icon: 'cube-outline',             title: 'Rapid Prototyping',    desc: 'Fast turnaround, multiple materials' },
  { icon: 'settings-outline',         title: 'Custom Manufacturing', desc: 'Quality control, production scaling' },
  { icon: 'flash-outline',            title: 'Design Services',      desc: '3D modeling & file preparation' },
  { icon: 'checkmark-circle-outline', title: 'Consultation',         desc: 'Material selection & cost estimate' },
];

const STATS = [
  { val: '500+', label: 'Orders', icon: 'bag-check-outline' },
  { val: '99%',  label: 'Rating',  icon: 'star-outline' },
  { val: '24h',  label: 'Delivery', icon: 'time-outline' },
];

export default function HomeScreen() {
  const nav = useNavigation();
  const { isAdmin } = useAuth();
  const { totalItems } = useCart();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView
        style={s.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ─── Hero ─── */}
        <View style={s.hero}>
          <View style={s.heroTopRow}>
            <View>
              <Text style={s.heroTag}>LAYERFORGE 3D</Text>
              <Text style={s.heroBadge}>Premium 3D Printing</Text>
            </View>
            {totalItems > 0 && (
              <TouchableOpacity style={s.cartPill} onPress={() => nav.navigate('Cart')} activeOpacity={0.8}>
                <Ionicons name="cart-outline" size={18} color="#000" />
                <Text style={s.cartPillText}>{totalItems}</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={s.heroTitle}>Where ideas{'\n'}become{'\n'}tangible.</Text>
          <Text style={s.heroSub}>
            Custom parts, prototypes & unique creations. Delivered with precision.
          </Text>

          <View style={s.heroButtons}>
            <TouchableOpacity style={s.btnPrimary} onPress={() => nav.navigate('Upload')} activeOpacity={0.85}>
              <Ionicons name="cloud-upload-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={s.btnPrimaryText}>Upload STL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnSecondary} onPress={() => nav.navigate('Browse')} activeOpacity={0.85}>
              <Ionicons name="grid-outline" size={18} color="#000" style={{ marginRight: 6 }} />
              <Text style={s.btnSecondaryText}>Browse Shop</Text>
            </TouchableOpacity>
          </View>

          {isAdmin && (
            <TouchableOpacity style={s.adminBtn} onPress={() => nav.navigate('AdminStack')} activeOpacity={0.85}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#000" style={{ marginRight: 6 }} />
              <Text style={s.adminBtnText}>Admin Dashboard</Text>
              <Ionicons name="chevron-forward" size={14} color="#000" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}
        </View>

        {/* ─── Stats ─── */}
        <View style={s.statsRow}>
          {STATS.map(({ val, label, icon }) => (
            <View key={label} style={s.statCard}>
              <View style={s.statIconWrap}>
                <Ionicons name={icon} size={20} color="#000" />
              </View>
              <Text style={s.statVal}>{val}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* ─── Services ─── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Our Services</Text>
          <Text style={s.sectionSub}>Comprehensive solutions for 3D printing</Text>
        </View>

        <View style={s.servicesGrid}>
          {SERVICE_CARDS.map(({ icon, title, desc }) => (
            <View key={title} style={s.serviceCard}>
              <View style={s.serviceIconWrap}>
                <Ionicons name={icon} size={24} color="#000" />
              </View>
              <Text style={s.serviceTitle}>{title}</Text>
              <Text style={s.serviceDesc}>{desc}</Text>
            </View>
          ))}
        </View>

        {/* ─── Quick Action Banner ─── */}
        <TouchableOpacity style={s.actionBanner} onPress={() => nav.navigate('Browse')} activeOpacity={0.88}>
          <View style={s.actionBannerInner}>
            <View style={{ flex: 1 }}>
              <Text style={s.bannerTitle}>Ready to order?</Text>
              <Text style={s.bannerSub}>Explore our catalog</Text>
            </View>
            <Ionicons name="arrow-forward" size={28} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* ─── About ─── */}
        <View style={s.aboutCard}>
          <View style={s.aboutHeader}>
            <View style={s.aboutIconWrap}>
              <Ionicons name="business-outline" size={20} color="#000" />
            </View>
            <Text style={s.aboutTitle}>About LayerForge</Text>
          </View>
          <Text style={s.aboutText}>
            Delivering high-quality, precise 3D printed parts for individuals and businesses with an emphasis on minimalist design and flawless execution.
          </Text>
          {[
            { icon: 'mail-outline',     text: 'contact@layerforge3d.com' },
            { icon: 'call-outline',     text: '+94 (077) 123 4567' },
            { icon: 'location-outline', text: 'Colombo, Sri Lanka' },
          ].map(({ icon, text }) => (
            <View key={text} style={s.contactRow}>
              <View style={s.contactIconWrap}><Ionicons name={icon} size={16} color="#555" /></View>
              <Text style={s.contactText}>{text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#ffffff' },

  /* Hero */
  hero:             { paddingTop: Platform.OS === 'android' ? 20 : 8, paddingBottom: 32, paddingHorizontal: 22, backgroundColor: '#f9f9f9', borderBottomWidth: 1, borderColor: '#eee' },
  heroTopRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  heroTag:          { color: '#000', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  heroBadge:        { color: '#666', fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroTitle:        { color: '#000', fontSize: 40, fontWeight: '900', lineHeight: 46, marginBottom: 14, letterSpacing: -1 },
  heroSub:          { color: '#555', fontSize: 14, lineHeight: 22, marginBottom: 26 },
  heroButtons:      { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  btnPrimary:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 14 },
  btnPrimaryText:   { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnSecondary:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 14 },
  btnSecondaryText: { color: '#000', fontWeight: '700', fontSize: 14 },
  adminBtn:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f1f1', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, marginTop: 16, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#ddd' },
  adminBtnText:     { color: '#000', fontWeight: '600', fontSize: 13 },
  cartPill:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, gap: 6, borderWidth: 1, borderColor: '#ddd' },
  cartPillText:     { color: '#000', fontWeight: '700', fontSize: 14 },

  /* Stats */
  statsRow:         { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 16, marginTop: -20, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 20, borderWidth: 1, borderColor: '#eaeaea' },
  statCard:         { alignItems: 'center', gap: 6 },
  statIconWrap:     { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 8, marginBottom: 2 },
  statVal:          { fontSize: 20, fontWeight: '800', color: '#000' },
  statLabel:        { fontSize: 11, color: '#777', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  /* Section */
  section:          { paddingHorizontal: 18, paddingTop: 32, paddingBottom: 12 },
  sectionTitle:     { fontSize: 24, fontWeight: '800', color: '#000', letterSpacing: -0.5 },
  sectionSub:       { fontSize: 13, color: '#666', marginTop: 4 },

  /* Services */
  servicesGrid:     { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 12, marginBottom: 12 },
  serviceCard:      { width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#eee', gap: 8 },
  serviceIconWrap:  { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#f1f1f1' },
  serviceTitle:     { fontSize: 14, fontWeight: '700', color: '#000' },
  serviceDesc:      { fontSize: 12, color: '#666', lineHeight: 18 },

  /* Banner */
  actionBanner:     { marginHorizontal: 16, marginVertical: 12, borderRadius: 12, overflow: 'hidden' },
  actionBannerInner:{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', paddingHorizontal: 22, paddingVertical: 24 },
  bannerTitle:      { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  bannerSub:        { color: '#aaa', fontSize: 14, marginTop: 4 },

  /* About */
  aboutCard:        { margin: 16, backgroundColor: '#f9f9f9', borderRadius: 12, padding: 24, borderWidth: 1, borderColor: '#eee' },
  aboutHeader:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  aboutIconWrap:    { backgroundColor: '#fff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#ddd' },
  aboutTitle:       { fontSize: 18, fontWeight: '800', color: '#000' },
  aboutText:        { fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 20 },
  contactRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  contactIconWrap:  { width: 24, alignItems: 'center' },
  contactText:      { fontSize: 14, color: '#333', fontWeight: '500' },
});
