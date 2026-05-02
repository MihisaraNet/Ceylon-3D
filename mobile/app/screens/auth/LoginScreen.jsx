/**
 * LoginScreen.jsx — High-End Authentication
 * 
 * Attractive, minimalist design with a focus on 
 * premium typography and clean form elements.
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleLogin = async () => {
    if (!email || !password) return setError('Email and password required');
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          
          <View style={s.header}>
            <View style={s.logoWrap}>
              <Ionicons name="cube" size={32} color="#0f172a" />
            </View>
            <Text style={s.title}>Sign In</Text>
            <Text style={s.sub}>Access your design workstation</Text>
          </View>

          <View style={s.form}>
            {!!error && (
              <View style={s.errBox}>
                <Ionicons name="alert-circle" size={18} color="#f43f5e" />
                <Text style={s.errText}>{error}</Text>
              </View>
            )}

            <View style={s.field}>
              <Text style={s.label}>EMAIL ADDRESS</Text>
              <TextInput
                style={s.input}
                placeholder="name@company.com"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>PASSWORD</Text>
              <TextInput
                style={s.input}
                placeholder="Your secure password"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={s.loginBtn} 
              onPress={handleLogin} 
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.loginBtnText}>Continue</Text>
              )}
            </TouchableOpacity>

            <View style={s.footer}>
              <Text style={s.footerText}>Need an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={s.linkText}>Register now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  content: { flexGrow: 1, padding: 32, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 48 },
  logoWrap: { width: 72, height: 72, backgroundColor: '#f8fafc', borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  title: { fontSize: 32, fontWeight: '900', color: '#0f172a', letterSpacing: -1.5 },
  sub: { fontSize: 15, color: '#64748b', marginTop: 8, fontWeight: '600' },

  form: { width: '100%' },
  errBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 14, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: '#fee2e2' },
  errText: { color: '#f43f5e', marginLeft: 10, fontWeight: '700', fontSize: 13 },

  field: { marginBottom: 24 },
  label: { fontSize: 11, fontWeight: '900', color: '#94a3b8', letterSpacing: 1.5, marginBottom: 10 },
  input: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 20, fontSize: 15, color: '#1e293b', fontWeight: '600', borderWidth: 1, borderColor: '#f1f5f9' },

  loginBtn: { backgroundColor: '#0f172a', borderRadius: 24, height: 68, justifyContent: 'center', alignItems: 'center', marginTop: 12, shadowColor: '#0f172a', shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  linkText: { color: '#0f172a', fontSize: 14, fontWeight: '800' },
});
