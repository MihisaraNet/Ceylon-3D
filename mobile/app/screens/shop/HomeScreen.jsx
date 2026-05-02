/**
 * HomeScreen.jsx — Premium Landing Experience
 * 
 * Features a high-end, attractive design with gradients, 
 * glass-like elements, and modern typography.
 */
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Platform, SafeAreaView, Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const SERVICE_CARDS = [
  { icon: 'rocket-outline',    title: 'Rapid Print',  desc: 'Express delivery for prototypes', color: '#6366f1' },
  { icon: 'diamond-outline',   title: 'Ultra Quality', desc: 'SLA resin printing for detail', color: '#10b981' },
  { icon: 'brush-outline',     title: 'Fine Finish',  desc: 'Post-processing & painting', color: '#f59e0b' },
  { icon: 'code-working',      title: 'API Access',   desc: 'Automated bulk manufacturing', color: '#ec4899' },
];

export default function HomeScreen() {
  const nav = useNavigation();
  const { isAdmin } = useAuth();
  const { totalItems } = useCart();

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView 
        style={s.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ─── Hero Header (Gradient Background) ─── */}
        <View style={s.hero}>
          <View style={s.headerNav}>
            <View style={s.logoBadge}>
              <Ionicons name="cube" size={18} color="#fff" />
              <Text style={s.logoText}>LF3D</Text>
            </View>
            <TouchableOpacity 
              style={s.cartBtn} 
              onPress={() => nav.navigate('Cart')}
            >
              <Ionicons name="cart-outline" size={24} color="#fff" />
              {totalItems > 0 && <View style={s.badge}><Text style={s.badgeText}>{totalItems}</Text></View>}
            </TouchableOpacity>
          </View>

          <Text style={s.heroTitle}>Shape the{'\n'}<Text style={s.heroHighlight}>Future.</Text></Text>
          <Text style={s.heroSub}>
            Premium 3D manufacturing for visionaries. We turn complex designs into physical reality.
          </Text>

          <View style={s.ctaRow}>
            <TouchableOpacity 
              style={s.mainBtn} 
              onPress={() => nav.navigate('Upload')}
              activeOpacity={0.9}
            >
              <Text style={s.mainBtnText}>Upload Design</Text>
              <Ionicons name="arrow-forward" size={18} color="#4f46e5" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={s.secondaryBtn}
              onPress={() => nav.navigate('Browse')}
            >
              <Text style={s.secondaryBtnText}>Shop Catalog</Text>
            </TouchableOpacity>
          </View>

          {isAdmin && (
            <TouchableOpacity 
              style={s.adminPill} 
              onPress={() => nav.navigate('AdminStack')}
            >
              <Ionicons name="shield-checkmark" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={s.adminPillText}>ADMIN CONSOLE</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ─── Trust Bar ─── */}
        <View style={s.trustBar}>
          {['24h Shipping', 'Material Choice', '99% Success'].map((t, i) => (
            <View key={t} style={s.trustItem}>
              <Ionicons name="checkmark-circle" size={14} color="#6366f1" />
              <Text style={s.trustText}>{t}</Text>
              {i < 2 && <View style={s.trustDot} />}
            </View>
          ))}
        </View>

        {/* ─── Service Grid ─── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Our Capabilities</Text>
            <Text style={s.sectionSub}>State of the art equipment for your vision</Text>
          </View>

          <View style={s.grid}>
            {SERVICE_CARDS.map((c, i) => (
              <TouchableOpacity key={c.title} style={s.card} activeOpacity={0.95}>
                <View style={[s.iconBox, { backgroundColor: c.color + '15' }]}>
                  <Ionicons name={c.icon} size={24} color={c.color} />
                </View>
                <Text style={s.cardTitle}>{c.title}</Text>
                <Text style={s.cardDesc}>{c.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ─── Interactive Banner ─── */}
        <TouchableOpacity 
          style={s.banner} 
          onPress={() => nav.navigate('Browse')}
          activeOpacity={0.9}
        >
          <View style={s.bannerContent}>
            <Text style={s.bannerTitle}>Explore the Store</Text>
            <Text style={s.bannerSub}>Curated collection of functional parts</Text>
          </View>
          <View style={s.bannerIconWrap}>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* ─── About Section ─── */}
        <View style={s.aboutWrap}>
          <Text style={s.aboutHeadline}>LayerForge 3D</Text>
          <Text style={s.aboutBody}>
            Born from a passion for engineering and art, we provide the highest fidelity 3D printing services in the region.
          </Text>
          <View style={s.footerLinks}>
            <View style={s.linkItem}>
              <Ionicons name="location" size={16} color="#6366f1" />
              <Text style={s.linkText}>Colombo, Sri Lanka</Text>
            </View>
            <View style={s.linkItem}>
              <Ionicons name="mail" size={16} color="#6366f1" />
              <Text style={s.linkText}>support@layerforge3d.com</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },

  /* Hero Section */
  hero: {
    backgroundColor: '#0f172a',
    paddingTop: Platform.OS === 'ios' ? 40 : 60,
    paddingHorizontal: 24,
    paddingBottom: 60,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    shadowColor: '#6366f1',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  headerNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  logoBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  logoText: { color: '#fff', fontSize: 14, fontWeight: '900', marginLeft: 8, letterSpacing: 1 },
  cartBtn: { position: 'relative', padding: 8 },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#f43f5e', minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0f172a' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },

  heroTitle: { fontSize: 52, fontWeight: '900', color: '#fff', lineHeight: 58, letterSpacing: -2 },
  heroHighlight: { color: '#6366f1' },
  heroSub: { fontSize: 16, color: '#94a3b8', marginTop: 20, lineHeight: 26, fontWeight: '500' },
  
  ctaRow: { flexDirection: 'row', marginTop: 32, gap: 16 },
  mainBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingVertical: 18, borderRadius: 20, shadowColor: '#fff', shadowOpacity: 0.1, shadowRadius: 10 },
  mainBtnText: { color: '#0f172a', fontSize: 16, fontWeight: '800', marginRight: 8 },
  secondaryBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  secondaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  
  adminPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 32, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  adminPillText: { color: '#94a3b8', fontSize: 11, fontWeight: '800', marginLeft: 8, letterSpacing: 1 },

  /* Trust Bar */
  trustBar: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: -20, marginHorizontal: 24, backgroundColor: '#fff', paddingVertical: 14, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trustText: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  trustDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', marginHorizontal: 10 },

  /* Section Styles */
  section: { padding: 24, paddingTop: 40 },
  sectionHeader: { marginBottom: 24 },
  sectionTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  sectionSub: { fontSize: 14, color: '#64748b', marginTop: 4, fontWeight: '500' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { width: (width - 64) / 2, backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10 },
  iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  cardDesc: { fontSize: 12, color: '#64748b', marginTop: 6, lineHeight: 18, fontWeight: '500' },

  /* Banner */
  banner: { marginHorizontal: 24, marginVertical: 12, backgroundColor: '#6366f1', borderRadius: 28, padding: 28, flexDirection: 'row', alignItems: 'center', shadowColor: '#6366f1', shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  bannerContent: { flex: 1 },
  bannerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  bannerSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: '600' },
  bannerIconWrap: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 16 },

  /* About Wrap */
  aboutWrap: { margin: 24, marginTop: 40, backgroundColor: '#f8fafc', borderRadius: 32, padding: 32 },
  aboutHeadline: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 12 },
  aboutBody: { fontSize: 15, color: '#475569', lineHeight: 24, fontWeight: '500' },
  footerLinks: { marginTop: 24, gap: 12 },
  linkItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  linkText: { fontSize: 14, color: '#1e293b', fontWeight: '700' },
});
