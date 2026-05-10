import React, { useState, useEffect } from 'react'; 
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Platform, SafeAreaView, ActivityIndicator, Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';

const SERVICES = [
  { id: '1', title: 'Rapid Prototyping', icon: 'cube-outline' },
  { id: '2', title: 'Custom Parts', icon: 'hardware-chip-outline' },
  { id: '3', title: 'Design Consult', icon: 'brush-outline' },
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
      <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />
      <ScrollView style={s.container} showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
            <Text style={s.greeting}>Hello, {user?.fullName?.split(' ')[0] || 'Guest'}.</Text>
          </View>
          {isAdmin && (
            <TouchableOpacity style={s.adminBtn} onPress={() => nav.navigate('AdminStack')}>
              <Ionicons name="settings-outline" size={20} color="#0f172a" />
            </TouchableOpacity>
          )}
        </View>

        {/* Hero Section */}
        <View style={s.heroCard}>
          <Text style={s.heroTitle}>Bring your ideas to reality.</Text>
          <Text style={s.heroSub}>Premium 3D printing and prototyping services right at your fingertips.</Text>
          
          <View style={s.heroActionRow}>
            <TouchableOpacity style={s.primaryBtn} onPress={() => nav.navigate('Upload')}>
              <Text style={s.primaryBtnText}>Upload STL</Text>
              <Ionicons name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
            <TouchableOpacity style={s.secondaryBtn} onPress={() => nav.navigate('Browse')}>
              <Text style={s.secondaryBtnText}>Explore Shop</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Services */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Services</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.servicesScroll}>
            {SERVICES.map((srv) => (
              <View key={srv.id} style={s.serviceCard}>
                <View style={s.serviceIconWrap}>
                  <Ionicons name={srv.icon} size={22} color="#0f172a" />
                </View>
                <Text style={s.serviceTitle}>{srv.title}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Quick Stats */}
        <View style={s.statsContainer}>
          <View style={s.statBox}>
            <Text style={s.statNumber}>24h</Text>
            <Text style={s.statLabel}>Avg. Turnaround</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={s.statNumber}>99%</Text>
            <Text style={s.statLabel}>Precision Rate</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={s.statNumber}>10+</Text>
            <Text style={s.statLabel}>Materials</Text>
          </View>
        </View>

        {/* Recent Feedback */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Recent Feedback</Text>
          {loadingReviews ? (
            <ActivityIndicator color="#0f172a" style={{ marginTop: 20 }} />
          ) : reviews.length === 0 ? (
            <Text style={s.emptyText}>No reviews yet.</Text>
          ) : (
            <View style={s.reviewsList}>
              {reviews.slice(0, 3).map((rv) => (
                <View key={rv._id} style={s.reviewItem}>
                  <View style={s.reviewStars}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Ionicons key={n} name="star" size={12} color={n <= rv.rating ? '#10b981' : '#e2e8f0'} />
                    ))}
                  </View>
                  <Text style={s.reviewComment}>"{rv.comment}"</Text>
                  <Text style={s.reviewAuthor}>— {rv.userName}</Text>
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
  safe: { flex: 1, backgroundColor: '#fafafa' },
  container: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 20 : 10, paddingBottom: 100 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  dateText: { fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontWeight: '600' },
  greeting: { fontSize: 28, color: '#0f172a', fontWeight: '800', letterSpacing: -0.5 },
  adminBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },

  heroCard: { backgroundColor: '#ffffff', borderRadius: 28, padding: 28, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 32 },
  heroTitle: { fontSize: 32, fontWeight: '800', color: '#0f172a', lineHeight: 38, marginBottom: 12, letterSpacing: -1 },
  heroSub: { fontSize: 15, color: '#64748b', lineHeight: 24, marginBottom: 24 },
  heroActionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  primaryBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 15 },
  secondaryBtn: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 16, backgroundColor: '#f8fafc' },
  secondaryBtnText: { color: '#0f172a', fontWeight: '600', fontSize: 15 },

  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16, letterSpacing: -0.3 },
  
  servicesScroll: { gap: 12 },
  serviceCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 20, width: 140, borderWidth: 1, borderColor: '#f1f5f9' },
  serviceIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  serviceTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a', lineHeight: 20 },

  statsContainer: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 24, paddingVertical: 24, marginBottom: 32, borderWidth: 1, borderColor: '#f1f5f9' },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: '#f1f5f9', marginVertical: 8 },

  reviewsList: { gap: 16 },
  reviewItem: { backgroundColor: '#ffffff', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  reviewStars: { flexDirection: 'row', gap: 2, marginBottom: 12 },
  reviewComment: { fontSize: 15, color: '#334155', lineHeight: 22, fontStyle: 'italic', marginBottom: 12 },
  reviewAuthor: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
  emptyText: { color: '#94a3b8', fontSize: 14 },
});
