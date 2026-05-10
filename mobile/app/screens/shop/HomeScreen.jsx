import React, { useState, useEffect } from 'react'; 
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Platform, SafeAreaView, ActivityIndicator, Image, Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CATEGORIES } from '../../data/categories';
import { getImageUri } from '../../lib/config';

const { width } = Dimensions.get('window');
const FEATURED_CARD_WIDTH = width * 0.4;

export default function HomeScreen() {
  const nav = useNavigation();
  const { user, isAdmin } = useAuth();
  
  const [featured, setFeatured] = useState([]);
  const [loadingFeat, setLoadingFeat] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/products');
        setFeatured((Array.isArray(data) ? data : []).slice(0, 5));
      } catch (err) {
        console.log('[Home] Featured fetch error:', err.message);
      } finally {
        setLoadingFeat(false);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <ScrollView style={s.container} showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Hi, {user?.fullName?.split(' ')[0] || 'Guest'} 👋</Text>
            <Text style={s.dateText}>Ready to shop?</Text>
          </View>
          {isAdmin && (
            <TouchableOpacity style={s.adminBtn} onPress={() => nav.navigate('AdminStack')}>
              <Ionicons name="settings" size={20} color="#8b5cf6" />
            </TouchableOpacity>
          )}
        </View>

        {/* Promo Hero Section */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => nav.navigate('Browse')}>
          <LinearGradient
            colors={['#8b5cf6', '#ec4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.heroCard}
          >
            <View style={s.heroGlass}>
              <View style={s.badgeWrap}>
                <Text style={s.badgeText}>NEW ARRIVALS</Text>
              </View>
              <Text style={s.heroTitle}>Discover Premium{'\n'}3D Prints</Text>
              <Text style={s.heroSub}>Shop exclusive designs and high-quality models today.</Text>
              
              <View style={s.heroActionRow}>
                <View style={s.primaryBtn}>
                  <Text style={s.primaryBtnText}>Shop Now</Text>
                  <Ionicons name="arrow-forward" size={16} color="#0f172a" style={{ marginLeft: 6 }} />
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Categories */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Categories</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catScroll}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat.id} style={s.catItem} onPress={() => nav.navigate('Browse')}>
                <View style={s.catIconWrap}>
                  <Text style={s.catEmoji}>{cat.icon}</Text>
                </View>
                <Text style={s.catName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Upload STL CTA */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => nav.navigate('Upload')} style={s.uploadBannerWrap}>
          <LinearGradient colors={['#e0f2fe', '#bae6fd']} start={{x:0, y:0}} end={{x:1, y:1}} style={s.uploadBanner}>
            <View style={s.uploadIconBox}>
              <Ionicons name="cloud-upload" size={24} color="#0284c7" />
            </View>
            <View style={{ flex: 1, paddingLeft: 16 }}>
              <Text style={s.uploadTitle}>Have your own design?</Text>
              <Text style={s.uploadSub}>Upload your STL file for printing.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#0284c7" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Featured Products */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Featured Products</Text>
            <TouchableOpacity onPress={() => nav.navigate('Browse')}>
              <Text style={s.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {loadingFeat ? (
            <ActivityIndicator color="#8b5cf6" style={{ marginTop: 20 }} />
          ) : featured.length === 0 ? (
            <Text style={s.emptyText}>No products available.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.featScroll}>
              {featured.map(item => {
                const imgUri = getImageUri(item.imagePath);
                return (
                  <TouchableOpacity 
                    key={item._id} 
                    style={s.featCard} 
                    onPress={() => nav.navigate('ProductDetail', { productId: item._id })}
                    activeOpacity={0.9}
                  >
                    <View style={s.featImgWrap}>
                      {imgUri ? (
                        <Image source={{ uri: imgUri }} style={s.featImg} resizeMode="cover" />
                      ) : (
                        <View style={s.featImgPH}>
                          <Ionicons name="cube-outline" size={32} color="#cbd5e1" />
                        </View>
                      )}
                    </View>
                    <View style={s.featBody}>
                      <Text style={s.featName} numberOfLines={1}>{item.name}</Text>
                      <Text style={s.featPrice}>LKR {item.price?.toLocaleString()}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 20 : 10, paddingBottom: 100 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  greeting: { fontSize: 24, color: '#0f172a', fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  dateText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  adminBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f3e8ff', justifyContent: 'center', alignItems: 'center' },

  heroCard: { borderRadius: 28, marginBottom: 32, shadowColor: '#ec4899', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  heroGlass: { backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 28, borderRadius: 28 },
  badgeWrap: { backgroundColor: '#ffffff', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, marginBottom: 16 },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#ec4899', letterSpacing: 1 },
  heroTitle: { fontSize: 32, fontWeight: '800', color: '#ffffff', lineHeight: 38, marginBottom: 12, letterSpacing: -1 },
  heroSub: { fontSize: 15, color: 'rgba(255,255,255,0.9)', lineHeight: 24, marginBottom: 24 },
  heroActionRow: { flexDirection: 'row', alignItems: 'center' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 99 },
  primaryBtnText: { color: '#0f172a', fontWeight: '700', fontSize: 15 },

  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  seeAllText: { color: '#8b5cf6', fontWeight: '600', fontSize: 15 },
  
  catScroll: { gap: 16, paddingRight: 20 },
  catItem: { alignItems: 'center', width: 72 },
  catIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', marginBottom: 8, shadowColor: '#1a1a1a', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  catEmoji: { fontSize: 28 },
  catName: { fontSize: 12, fontWeight: '600', color: '#475569', textAlign: 'center' },

  uploadBannerWrap: { marginBottom: 32, shadowColor: '#0ea5e9', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  uploadBanner: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24 },
  uploadIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.6)', justifyContent: 'center', alignItems: 'center' },
  uploadTitle: { fontSize: 15, fontWeight: '700', color: '#0c4a6e', marginBottom: 4 },
  uploadSub: { fontSize: 13, color: '#0284c7', fontWeight: '500' },

  featScroll: { gap: 16, paddingRight: 20 },
  featCard: { width: FEATURED_CARD_WIDTH, backgroundColor: '#ffffff', borderRadius: 20, shadowColor: '#1a1a1a', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, overflow: 'hidden' },
  featImgWrap: { width: '100%', height: FEATURED_CARD_WIDTH, backgroundColor: '#f8fafc' },
  featImg: { width: '100%', height: '100%' },
  featImgPH: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  featBody: { padding: 12 },
  featName: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  featPrice: { fontSize: 13, color: '#8b5cf6', fontWeight: '700' },

  emptyText: { color: '#94a3b8', fontSize: 15, fontStyle: 'italic' },
});
