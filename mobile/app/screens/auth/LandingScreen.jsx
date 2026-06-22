/**
 * LandingScreen.jsx — Premium Landing Page
 *
 * A visually stunning initial screen with a dark aesthetic,
 * an impressive background, and clear calls to action.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, StatusBar, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function LandingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground 
        source={require('../../../assets/landing_bg.png')} 
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(15,23,42,0.1)', 'rgba(15,23,42,0.6)', 'rgba(15,23,42,1)']}
          style={styles.overlay}
        >
          <View style={styles.content}>
            {/* Logo & Branding */}
            <View style={styles.brandBox}>
              <View style={styles.iconContainer}>
                <Ionicons name="cube" size={48} color="#8b5cf6" />
              </View>
              <Text style={styles.title}>LayerForge 3D</Text>
              <Text style={styles.subtitle}>Precision. Quality. Innovation.</Text>
              <Text style={styles.description}>
                Transform your digital ideas into physical reality with our state-of-the-art 3D printing platform.
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actionContainer}>
              <TouchableOpacity 
                style={styles.primaryBtn} 
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.primaryBtnText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryBtn} 
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.secondaryBtnText}>I already have an account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0f172a', // Dark slate
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
  },
  content: {
    width: '100%',
  },
  brandBox: {
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8b5cf6', // Violet accent
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#cbd5e1',
    lineHeight: 24,
    maxWidth: '90%',
  },
  actionContainer: {
    gap: 16,
  },
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: '#8b5cf6', // Violet
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
