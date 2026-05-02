import React, { useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Platform, Animated, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const SERVICE_CARDS = [
  { icon: 'cube-outline',             title: 'Rapid Prototyping',    desc: 'Fast turnaround, multiple materials', color: '#6366f1', bg: '#eef2ff' },
  { icon: 'settings-outline',         title: 'Custom Manufacturing', desc: 'Quality control, production scaling', color: '#ec4899', bg: '#fdf2f8' },
  { icon: 'flash-outline',            title: 'Design Services',      desc: '3D modeling & file preparation',     color: '#f59e0b', bg: '#fffbeb' },
  { icon: 'checkmark-circle-outline', title: 'Consultation',         desc: 'Material selection & cost estimate', color: '#10b981', bg: '#ecfdf5' },
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f0f1a' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />
      <ScrollView
        style={s.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ─── Hero ─── */}
        <LinearGradient
          colors={['#1e1b4b', '#312e81', '#4f46e5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.hero}
        >
          {/* Top row */}
          <View style={s.heroTopRow}>
            <View>
              <Text style={s.heroTag}>🖨️  Ceylon 3D Printing</Text>
              <Text style={s.heroBadge}>Sri Lanka's Premier Service</Text>
            </View>
            {totalItems > 0 && (
              <TouchableOpacity style={s.cartPill} onPress={() => nav.navigate('Cart')} activeOpacity={0.8}>
                <Ionicons name="cart" size={18} color="#fff" />
                <Text style={s.cartPillText}>{totalItems}</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={s.heroTitle}>Where ideas{'\n'}become{'\n'}tangible.</Text>
          <Text style={s.heroSub}>
            Custom parts, prototypes & unique creations — delivered to your door.
          </Text>

          <View style={s.heroButtons}>
            <TouchableOpacity style={s.btnPrimary} onPress={() => nav.navigate('Upload')} activeOpacity={0.85}>
              <Ionicons name="cloud-upload-outline" size={18} color="#4f46e5" style={{ marginRight: 6 }} />
              <Text style={s.btnPrimaryText}>Upload STL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnSecondary} onPress={() => nav.navigate('Browse')} activeOpacity={0.85}>
              <Ionicons name="grid-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={s.btnSecondaryText}>Browse Shop</Text>
            </TouchableOpacity>
          </View>

          {isAdmin && (
            <TouchableOpacity style={s.adminBtn} onPress={() => nav.navigate('AdminStack')} activeOpacity={0.85}>
              <Ionicons name="shield-checkmark" size={16} color="#fbbf24" style={{ marginRight: 6 }} />
              <Text style={s.adminBtnText}>Admin Dashboard</Text>
              <Ionicons name="chevron-forward" size={14} color="#fbbf24" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* ─── Stats ─── */}
        <View style={s.statsRow}>
          {STATS.map(({ val, label, icon }) => (
            <View key={label} style={s.statCard}>
              <View style={s.statIconWrap}>
                <Ionicons name={icon} size={20} color="#6366f1" />
              </View>
              <Text style={s.statVal}>{val}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* ─── Services ─── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Our Services</Text>
          <Text style={s.sectionSub}>Everything you need for 3D printing</Text>
        </View>

        <View style={s.servicesGrid}>
          {SERVICE_CARDS.map(({ icon, title, desc, color, bg }) => (
            <View key={title} style={s.serviceCard}>
              <View style={[s.serviceIconWrap, { backgroundColor: bg }]}>
                <Ionicons name={icon} size={26} color={color} />
              </View>
              <Text style={s.serviceTitle}>{title}</Text>
              <Text style={s.serviceDesc}>{desc}</Text>
            </View>
          ))}
        </View>

        {/* ─── Quick Action Banner ─── */}
        <TouchableOpacity style={s.actionBanner} onPress={() => nav.navigate('Browse')} activeOpacity={0.88}>
          <LinearGradient colors={['#7c3aed', '#6366f1']} style={s.actionBannerInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.bannerTitle}>Ready to order?</Text>
              <Text style={s.bannerSub}>Browse our full catalogue →</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={40} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>

        {/* ─── About ─── */}
        <View style={s.aboutCard}>
          <View style={s.aboutHeader}>
            <View style={s.aboutIconWrap}>
              <Ionicons name="business-outline" size={22} color="#6366f1" />
            </View>
            <Text style={s.aboutTitle}>About Ceylon 3D</Text>
          </View>
          <Text style={s.aboutText}>
            Based in Colombo, Sri Lanka, Ceylon 3D uses cutting-edge technology and premium materials to deliver outstanding results for individuals, startups, and enterprises.
          </Text>
          {[
            { icon: 'mail-outline',     text: 'contact@ceylon3d.com' },
            { icon: 'call-outline',     text: '+94 (0) 123 4567' },
            { icon: 'location-outline', text: 'Colombo, Sri Lanka' },
          ].map(({ icon, text }) => (
            <View key={text} style={s.contactRow}>
              <View style={s.contactIconWrap}><Ionicons name={icon} size={15} color="#6366f1" /></View>
              <Text style={s.contactText}>{text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f5f5ff' },

  /* Hero */
  hero:             { paddingTop: Platform.OS === 'android' ? 20 : 8, paddingBottom: 32, paddingHorizontal: 22 },
  heroTopRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  heroTag:          { color: '#a5b4fc', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  heroBadge:        { color: 'rgba(165,180,252,0.7)', fontSize: 11, marginTop: 2 },
  heroTitle:        { color: '#fff', fontSize: 38, fontWeight: '900', lineHeight: 46, marginBottom: 14, letterSpacing: -1 },
  heroSub:          { color: '#c7d2fe', fontSize: 14, lineHeight: 22, marginBottom: 26 },
  heroButtons:      { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  btnPrimary:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 13 },
  btnPrimaryText:   { color: '#4f46e5', fontWeight: '800', fontSize: 14 },
  btnSecondary:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 13 },
  btnSecondaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  adminBtn:         { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginTop: 16, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)' },
  adminBtnText:     { color: '#fbbf24', fontWeight: '700', fontSize: 13 },
  cartPill:         { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  cartPillText:     { color: '#fff', fontWeight: '800', fontSize: 14 },

  /* Stats */
  statsRow:         { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 16, marginTop: -20, backgroundColor: '#fff', borderRadius: 20, paddingVertical: 20, shadowColor: '#6366f1', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  statCard:         { alignItems: 'center', gap: 4 },
  statIconWrap:     { backgroundColor: '#eef2ff', borderRadius: 10, padding: 8, marginBottom: 2 },
  statVal:          { fontSize: 22, fontWeight: '900', color: '#1e1b4b' },
  statLabel:        { fontSize: 11, color: '#9ca3af', fontWeight: '600' },

  /* Section */
  section:          { paddingHorizontal: 18, paddingTop: 28, paddingBottom: 6 },
  sectionTitle:     { fontSize: 22, fontWeight: '900', color: '#1e1b4b', letterSpacing: -0.5 },
  sectionSub:       { fontSize: 13, color: '#9ca3af', marginTop: 2 },

  /* Services */
  servicesGrid:     { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 12, marginBottom: 8 },
  serviceCard:      { width: '47%', backgroundColor: '#fff', borderRadius: 18, padding: 16, shadowColor: '#6366f1', shadowOpacity: 0.07, shadowRadius: 10, elevation: 3, gap: 6 },
  serviceIconWrap:  { borderRadius: 12, padding: 10, alignSelf: 'flex-start' },
  serviceTitle:     { fontSize: 13, fontWeight: '800', color: '#1e1b4b' },
  serviceDesc:      { fontSize: 11, color: '#9ca3af', lineHeight: 16 },

  /* Banner */
  actionBanner:     { marginHorizontal: 16, marginVertical: 8, borderRadius: 20, overflow: 'hidden', shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  actionBannerInner:{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 20 },
  bannerTitle:      { color: '#fff', fontSize: 18, fontWeight: '900' },
  bannerSub:        { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },

  /* About */
  aboutCard:        { margin: 16, backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#6366f1', shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  aboutHeader:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  aboutIconWrap:    { backgroundColor: '#eef2ff', borderRadius: 10, padding: 8 },
  aboutTitle:       { fontSize: 18, fontWeight: '900', color: '#1e1b4b' },
  aboutText:        { fontSize: 14, color: '#6b7280', lineHeight: 22, marginBottom: 16 },
  contactRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  contactIconWrap:  { backgroundColor: '#eef2ff', borderRadius: 8, padding: 6 },
  contactText:      { fontSize: 14, color: '#374151', fontWeight: '500' },
});
