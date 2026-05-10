import React, { useState, useEffect } from 'react'; 
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Platform, SafeAreaView, ActivityIndicator, Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const SERVICES = [
  { id: '1', title: 'Rapid Prototyping', icon: 'cube', colors: ['#8b5cf6', '#a855f7'], bg: '#f3e8ff' },
  { id: '2', title: 'Custom Parts', icon: 'cog', colors: ['#0ea5e9', '#3b82f6'], bg: '#e0f2fe' },
  { id: '3', title: 'Design Consult', icon: 'chatbubbles', colors: ['#f43f5e', '#fb7185'], bg: '#ffe4e6' },
];

export default function HomeScreen() {
  const nav = useNavigation();
  const { user, isAdmin } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/reviews/recent?limit=5');
        setReviews(data);
      } catch (err) {
        console.log('[Home] Review fetch error:', err.message);
      } finally {
        setLoadingReviews(false);
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
            <Text style={s.dateText}>Ready to build something amazing?</Text>
          </View>
          {isAdmin && (
            <TouchableOpacity style={s.adminBtn} onPress={() => nav.navigate('AdminStack')}>
              <Ionicons name="settings" size={20} color="#8b5cf6" />
            </TouchableOpacity>
          )}
        </View>

        {/* Hero Section */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => nav.navigate('Upload')}>
          <LinearGradient
            colors={['#8b5cf6', '#ec4899', '#f43f5e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.heroCard}
          >
            <View style={s.heroGlass}>
              <Text style={s.heroTitle}>Bring your ideas{'\n'}to reality.</Text>
              <Text style={s.heroSub}>Premium 3D printing and prototyping services right at your fingertips.</Text>
              
              <View style={s.heroActionRow}>
                <View style={s.primaryBtn}>
                  <Text style={s.primaryBtnText}>Upload STL</Text>
                  <Ionicons name="arrow-forward" size={16} color="#0f172a" style={{ marginLeft: 6 }} />
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Stats */}
        <View style={s.statsContainer}>
          <View style={s.statBox}>
            <Text style={[s.statNumber, { color: '#8b5cf6' }]}>24h</Text>
            <Text style={s.statLabel}>Avg. Turnaround</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={[s.statNumber, { color: '#0ea5e9' }]}>99%</Text>
            <Text style={s.statLabel}>Precision Rate</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={[s.statNumber, { color: '#f43f5e' }]}>10+</Text>
            <Text style={s.statLabel}>Materials</Text>
          </View>
        </View>

        {/* Services */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Our Services</Text>
            <TouchableOpacity onPress={() => nav.navigate('Browse')}>
              <Text style={s.seeAllText}>Explore</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.servicesScroll}>
            {SERVICES.map((srv) => (
              <View key={srv.id} style={[s.serviceCard, { backgroundColor: srv.bg }]}>
                <LinearGradient colors={srv.colors} style={s.serviceIconWrap}>
                  <Ionicons name={srv.icon} size={22} color="#ffffff" />
                </LinearGradient>
                <Text style={s.serviceTitle}>{srv.title}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Recent Feedback */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Community Feedback</Text>
          {loadingReviews ? (
            <ActivityIndicator color="#8b5cf6" style={{ marginTop: 20 }} />
          ) : reviews.length === 0 ? (
            <Text style={s.emptyText}>No reviews yet.</Text>
          ) : (
            <View style={s.reviewsList}>
              {reviews.slice(0, 3).map((rv, i) => (
                <View key={rv._id} style={s.reviewItem}>
                  <View style={s.reviewHeader}>
                    <View style={s.avatarPlaceholder}>
                      <Text style={s.avatarText}>{rv.userName.charAt(0)}</Text>
                    </View>
                    <View>
                      <Text style={s.reviewAuthor}>{rv.userName}</Text>
                      <View style={s.reviewStars}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Ionicons key={n} name="star" size={12} color={n <= rv.rating ? '#f59e0b' : '#e2e8f0'} />
                        ))}
                      </View>
                    </View>
                  </View>
                  <Text style={s.reviewComment}>"{rv.comment}"</Text>
                </View>
              ))}
            </View>
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

  heroCard: { borderRadius: 28, marginBottom: 24, shadowColor: '#ec4899', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  heroGlass: { backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 28, borderRadius: 28 },
  heroTitle: { fontSize: 32, fontWeight: '800', color: '#ffffff', lineHeight: 38, marginBottom: 12, letterSpacing: -1 },
  heroSub: { fontSize: 15, color: 'rgba(255,255,255,0.9)', lineHeight: 24, marginBottom: 24 },
  heroActionRow: { flexDirection: 'row', alignItems: 'center' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 99 },
  primaryBtnText: { color: '#0f172a', fontWeight: '700', fontSize: 15 },

  statsContainer: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 24, paddingVertical: 20, marginBottom: 32, shadowColor: '#1a1a1a', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '900', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: '#f1f5f9', marginVertical: 8 },

  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  seeAllText: { color: '#8b5cf6', fontWeight: '600', fontSize: 15 },
  
  servicesScroll: { gap: 16, overflow: 'visible' },
  serviceCard: { padding: 20, borderRadius: 24, width: 150 },
  serviceIconWrap: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
  serviceTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', lineHeight: 22 },

  reviewsList: { gap: 16 },
  reviewItem: { backgroundColor: '#ffffff', padding: 20, borderRadius: 24, shadowColor: '#1a1a1a', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3e8ff', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#8b5cf6', fontWeight: '700', fontSize: 16 },
  reviewAuthor: { fontSize: 15, color: '#0f172a', fontWeight: '700', marginBottom: 4 },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontSize: 15, color: '#475569', lineHeight: 24 },
  emptyText: { color: '#94a3b8', fontSize: 15, fontStyle: 'italic' },
});
