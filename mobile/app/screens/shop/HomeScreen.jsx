/**
 * HomeScreen.jsx — Landing / Home Page
 *
 * Modern, colorful and simple design.
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
  { icon: 'cube-outline',             title: 'Rapid Prototyping',    desc: 'Fast turnaround, multiple materials', color: '#6366f1' },
  { icon: 'settings-outline',         title: 'Custom Manufacturing', desc: 'Quality control, production scaling', color: '#10b981' },
  { icon: 'flash-outline',            title: 'Design Services',      desc: '3D modeling & file preparation', color: '#f59e0b' },
  { icon: 'checkmark-circle-outline', title: 'Consultation',         desc: 'Material selection & cost estimate', color: '#ec4899' },
];

const STATS = [
  { val: '500+', label: 'Orders', icon: 'bag-check-outline', color: '#6366f1' },
  { val: '99%',  label: 'Rating',  icon: 'star-outline', color: '#10b981' },
  { val: '24h',  label: 'Delivery', icon: 'time-outline', color: '#f59e0b' },
];

export default function HomeScreen() {
  const nav = useNavigation();
  const { isAdmin } = useAuth();
  const { totalItems } = useCart();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />
      <ScrollView
        style={s.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ─── Hero Section ─── */}
        <View style={s.hero}>
          <View style={s.heroTopRow}>
            <View>
              <Text style={s.heroTag}>LAYERFORGE 3D</Text>
              <Text style={s.heroBadge}>Modern Printing Hub</Text>
            </View>
            {totalItems > 0 && (
              <TouchableOpacity style={s.cartPill} onPress={() => nav.navigate('Cart')} activeOpacity={0.8}>
                <Ionicons name="cart" size={18} color="#4f46e5" />
                <Text style={s.cartPillText}>{totalItems}</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={s.heroTitle}>Innovate{'\n'}Build{'\n'}Deliver.</Text>
          <Text style={s.heroSub}>
            The most advanced 3D printing service in your pocket. Precision guaranteed.
          </Text>

          <View style={s.heroButtons}>
            <TouchableOpacity style={s.btnPrimary} onPress={() => nav.navigate('Upload')} activeOpacity={0.85}>
              <Ionicons name="cloud-upload" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={s.btnPrimaryText}>Start Print</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnSecondary} onPress={() => nav.navigate('Browse')} activeOpacity={0.85}>
              <Ionicons name="grid-outline" size={18} color="#4f46e5" style={{ marginRight: 6 }} />
              <Text style={s.btnSecondaryText}>Store</Text>
            </TouchableOpacity>
          </View>

          {isAdmin && (
            <TouchableOpacity style={s.adminBtn} onPress={() => nav.navigate('AdminStack')} activeOpacity={0.85}>
              <Ionicons name="shield-checkmark" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={s.adminBtnText}>Admin Console</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ─── Stats Row ─── */}
        <View style={s.statsRow}>
          {STATS.map(({ val, label, icon, color }) => (
            <View key={label} style={s.statCard}>
              <View style={[s.statIconWrap, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={20} color={color} />
              </View>
              <Text style={s.statVal}>{val}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* ─── Services ─── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>What we do</Text>
          <Text style={s.sectionSub}>Everything you need for your next project</Text>
        </View>

        <View style={s.servicesGrid}>
          {SERVICE_CARDS.map(({ icon, title, desc, color }) => (
            <View key={title} style={s.serviceCard}>
              <View style={[s.serviceIconWrap, { backgroundColor: color + '10', borderColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
              </View>
              <Text style={s.serviceTitle}>{title}</Text>
              <Text style={s.serviceDesc}>{desc}</Text>
            </View>
          ))}
        </View>

        {/* ─── CTA Banner ─── */}
        <TouchableOpacity style={s.actionBanner} onPress={() => nav.navigate('Browse')} activeOpacity={0.88}>
          <View style={s.actionBannerInner}>
            <View style={{ flex: 1 }}>
              <Text style={s.bannerTitle}>Check our Models</Text>
              <Text style={s.bannerSub}>High quality designs ready to print</Text>
            </View>
            <View style={s.bannerIcon}>
              <Ionicons name="arrow-forward" size={24} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>

        {/* ─── Footer Info ─── */}
        <View style={s.aboutCard}>
          <Text style={s.aboutTitle}>LayerForge 3D</Text>
          <Text style={s.aboutText}>
            We combine high-end technology with expert craftsmanship to bring your digital models to life.
          </Text>
          <View style={s.contactInfo}>
            <View style={s.contactItem}>
              <Ionicons name="mail" size={16} color="#6366f1" />
              <Text style={s.contactText}>hello@layerforge.com</Text>
            </View>
            <View style={s.contactItem}>
              <Ionicons name="location" size={16} color="#6366f1" />
              <Text style={s.contactText}>Colombo, LK</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1 },

  /* Hero Section */
  hero:             { 
    paddingTop: Platform.OS === 'android' ? 40 : 20, 
    paddingBottom: 48, 
    paddingHorizontal: 24, 
    backgroundColor: '#4f46e5',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroTopRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  heroTag:          { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 2, opacity: 0.8 },
  heroBadge:        { color: '#fff', fontSize: 11, marginTop: 2, fontWeight: '600' },
  heroTitle:        { color: '#fff', fontSize: 44, fontWeight: '900', lineHeight: 50, marginBottom: 16, letterSpacing: -1 },
  heroSub:          { color: '#e0e7ff', fontSize: 16, lineHeight: 24, marginBottom: 32, opacity: 0.9 },
  heroButtons:      { flexDirection: 'row', gap: 12 },
  btnPrimary:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  btnPrimaryText:   { color: '#4f46e5', fontWeight: '800', fontSize: 15 },
  btnSecondary:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  btnSecondaryText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  adminBtn:         { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginTop: 20, alignSelf: 'flex-start' },
  adminBtnText:     { color: '#fff', fontWeight: '700', fontSize: 14 },
  cartPill:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  cartPillText:     { color: '#4f46e5', fontWeight: '800', fontSize: 15 },

  /* Stats Section */
  statsRow:         { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 24, marginTop: -30, backgroundColor: '#fff', borderRadius: 20, paddingVertical: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 10 },
  statCard:         { alignItems: 'center', gap: 8 },
  statIconWrap:     { borderRadius: 12, padding: 10, marginBottom: 4 },
  statVal:          { fontSize: 22, fontWeight: '900', color: '#1e293b' },
  statLabel:        { fontSize: 12, color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  /* Content Sections */
  section:          { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 16 },
  sectionTitle:     { fontSize: 28, fontWeight: '900', color: '#1e293b', letterSpacing: -0.5 },
  sectionSub:       { fontSize: 15, color: '#64748b', marginTop: 4 },

  /* Services Grid */
  servicesGrid:     { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 18, gap: 12 },
  serviceCard:      { width: '47%', backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#f1f5f9', gap: 10, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5 },
  serviceIconWrap:  { borderRadius: 12, padding: 12, alignSelf: 'flex-start', borderWidth: 1 },
  serviceTitle:     { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  serviceDesc:      { fontSize: 13, color: '#64748b', lineHeight: 20 },

  /* Action Banner */
  actionBanner:     { marginHorizontal: 24, marginVertical: 24, borderRadius: 20, overflow: 'hidden', shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  actionBannerInner:{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#6366f1', paddingHorizontal: 24, paddingVertical: 28 },
  bannerTitle:      { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  bannerSub:        { color: '#e0e7ff', fontSize: 15, marginTop: 4, fontWeight: '600' },
  bannerIcon:       { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 },

  /* About Card */
  aboutCard:        { margin: 24, backgroundColor: '#fff', borderRadius: 24, padding: 28, borderWidth: 1, borderColor: '#f1f5f9' },
  aboutTitle:       { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 12 },
  aboutText:        { fontSize: 15, color: '#475569', lineHeight: 24, marginBottom: 20 },
  contactInfo:      { gap: 12 },
  contactItem:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactText:      { fontSize: 14, color: '#1e293b', fontWeight: '600' },
});
