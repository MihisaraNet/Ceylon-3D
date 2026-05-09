/**
 * ReviewScreen.jsx — Write a Product Review
 *
 * Accessible after a successful order placement. Allows users to leave a
 * star rating (1–5) and an optional written comment for each purchased product.
 *
 * Navigation params:
 *   - productId   {string} — The product being reviewed
 *   - productName {string} — Used in the UI heading
 *
 * Features:
 *   - Interactive star selector with animation
 *   - Optional comment TextInput
 *   - Submits to POST /reviews/:productId
 *   - Shows success confirmation and navigates back
 *
 * @module screens/shop/ReviewScreen
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, SafeAreaView,
  StatusBar, Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../lib/api';

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
const STAR_COLORS = ['', '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#6366f1'];

export default function ReviewScreen({ route }) {
  const { productId, productName } = route.params ?? {};
  const nav = useNavigation();

  const [rating,    setRating]    = useState(0);
  const [comment,   setComment]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);

  // Animate each star on tap
  const starScales = useRef([1, 2, 3, 4, 5].map(() => new Animated.Value(1))).current;

  const handleStarPress = (star) => {
    setRating(star);
    // Bounce animation
    Animated.sequence([
      Animated.timing(starScales[star - 1], { toValue: 1.4, duration: 100, useNativeDriver: true }),
      Animated.spring(starScales[star - 1],  { toValue: 1,   useNativeDriver: true }),
    ]).start();
  };

  const handleSubmit = async () => {
    if (!rating) return Alert.alert('Select Rating', 'Please choose a star rating.');
    setSubmitting(true);
    try {
      await api.post(`/reviews/${productId}`, { rating, comment: comment.trim() });
      setDone(true);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to submit review';
      Alert.alert('Oops!', msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success state ── */
  if (done) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.successWrap}>
          <View style={s.successCircle}>
            <Ionicons name="star" size={46} color="#f8fafc" />
          </View>
          <Text style={s.successTitle}>Review Submitted! ⭐</Text>
          <Text style={s.successSub}>
            Thank you for your feedback.{'\n'}It helps others make better choices!
          </Text>
          <TouchableOpacity
            style={s.doneBtn}
            onPress={() => nav.navigate('Home')}
            activeOpacity={0.88}
          >
            <Ionicons name="home-outline" size={18} color="#f8fafc" style={{ marginRight: 6 }} />
            <Text style={s.doneBtnText}>Back to Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.browseLink}
            onPress={() => nav.navigate('Browse')}
            activeOpacity={0.7}
          >
            <Text style={s.browseLinkText}>Continue Shopping →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f7ff" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={26} color="#1e1b4b" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Write a Review</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Product name */}
        <View style={s.productBanner}>
          <View style={s.productIconWrap}>
            <Ionicons name="cube-outline" size={28} color="#6366f1" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.bannerLabel}>Reviewing</Text>
            <Text style={s.bannerName} numberOfLines={2}>{productName || 'Product'}</Text>
          </View>
        </View>

        {/* Star rating */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Your Rating</Text>
          <Text style={s.cardSub}>Tap a star to rate this product</Text>

          <View style={s.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleStarPress(star)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              >
                <Animated.View style={{ transform: [{ scale: starScales[star - 1] }] }}>
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={44}
                    color={star <= rating ? (STAR_COLORS[rating] || '#f59e0b') : '#d1d5db'}
                  />
                </Animated.View>
              </TouchableOpacity>
            ))}
          </View>

          {rating > 0 && (
            <View style={[s.ratingLabelPill, { backgroundColor: (STAR_COLORS[rating] || '#6366f1') + '18' }]}>
              <Text style={[s.ratingLabelText, { color: STAR_COLORS[rating] || '#6366f1' }]}>
                {rating} / 5 — {STAR_LABELS[rating]}
              </Text>
            </View>
          )}
        </View>

        {/* Comment */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Your Review</Text>
          <Text style={s.cardSub}>Tell others about your experience (optional)</Text>
          <TextInput
            style={s.commentInput}
            placeholder="Share your thoughts about this product…"
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={1000}
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
          />
          <Text style={s.charCount}>{comment.length}/1000</Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[s.submitBtn, (!rating || submitting) && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={!rating || submitting}
          activeOpacity={0.88}
        >
          {submitting ? (
            <ActivityIndicator color="#f8fafc" />
          ) : (
            <>
              <Ionicons name="send-outline" size={18} color="#f8fafc" style={{ marginRight: 8 }} />
              <Text style={s.submitText}>Submit Review</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={s.skipBtn} onPress={() => nav.navigate('Home')}>
          <Text style={s.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#f8f7ff' },

  /* Header */
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 14 : 4, paddingBottom: 10 },
  headerTitle:      { fontSize: 20, fontWeight: '900', color: '#1e1b4b' },

  /* Product banner */
  productBanner:    { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#eef2ff', marginHorizontal: 16, marginBottom: 14, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#c7d2fe' },
  productIconWrap:  { backgroundColor: '#f8fafc', borderRadius: 12, padding: 10 },
  bannerLabel:      { fontSize: 11, fontWeight: '700', color: '#6366f1', letterSpacing: 0.5 },
  bannerName:       { fontSize: 16, fontWeight: '900', color: '#1e1b4b', marginTop: 2 },

  /* Card */
  card:             { backgroundColor: '#f8fafc', marginHorizontal: 16, marginBottom: 14, borderRadius: 20, padding: 20, shadowColor: '#6366f1', shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  cardTitle:        { fontSize: 17, fontWeight: '900', color: '#1e1b4b', marginBottom: 4 },
  cardSub:          { fontSize: 13, color: '#9ca3af', marginBottom: 18 },

  /* Stars */
  starsRow:         { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 16 },
  ratingLabelPill:  { alignSelf: 'center', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 7 },
  ratingLabelText:  { fontSize: 15, fontWeight: '800' },

  /* Comment */
  commentInput:     { backgroundColor: '#f8f7ff', borderRadius: 14, borderWidth: 1.5, borderColor: '#e5e7eb', padding: 14, fontSize: 15, color: '#1e1b4b', minHeight: 110 },
  charCount:        { fontSize: 11, color: '#9ca3af', textAlign: 'right', marginTop: 6, fontWeight: '600' },

  /* Submit */
  submitBtn:        { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#6366f1', marginHorizontal: 16, borderRadius: 16, paddingVertical: 16, shadowColor: '#6366f1', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  submitText:       { color: '#f8fafc', fontSize: 16, fontWeight: '900' },
  skipBtn:          { alignItems: 'center', paddingVertical: 14 },
  skipText:         { color: '#9ca3af', fontSize: 14, fontWeight: '600' },

  /* Success */
  successWrap:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 14 },
  successCircle:    { width: 100, height: 100, borderRadius: 50, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', shadowColor: '#6366f1', shadowOpacity: 0.4, shadowRadius: 24, elevation: 10, marginBottom: 8 },
  successTitle:     { fontSize: 28, fontWeight: '900', color: '#1e1b4b', textAlign: 'center' },
  successSub:       { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
  doneBtn:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6366f1', borderRadius: 16, paddingHorizontal: 30, paddingVertical: 14, marginTop: 8 },
  doneBtnText:      { color: '#f8fafc', fontWeight: '900', fontSize: 15 },
  browseLink:       { paddingVertical: 10 },
  browseLinkText:   { color: '#6366f1', fontWeight: '700', fontSize: 14 },
});
