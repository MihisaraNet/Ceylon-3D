/**
 * RegisterScreen.jsx — User Registration
 *
 * Modern, colorful and simple design.
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleRegister = async () => {
    if (!fullName || !email || !password) return setError('Please fill all fields');
    if (password.length < 6) return setError('Password must be at least 6 chars');
    
    setError('');
    setLoading(true);
    try {
      await register(fullName, email, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} bounces={false}>
          
          <View style={s.header}>
            <View style={s.logoWrap}>
              <Ionicons name="person-add" size={40} color="#fff" />
            </View>
            <Text style={s.title}>Join Us</Text>
            <Text style={s.sub}>Create your LayerForge 3D account</Text>
          </View>

          <View style={s.form}>
            {!!error && (
              <View style={s.errBanner}>
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text style={s.errText}>{error}</Text>
              </View>
            )}

            <View style={s.inputGroup}>
              <Text style={s.label}>FULL NAME</Text>
              <View style={s.inputWrap}>
                <Ionicons name="person-outline" size={20} color="#94a3b8" style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="John Doe"
                  placeholderTextColor="#94a3b8"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>EMAIL ADDRESS</Text>
              <View style={s.inputWrap}>
                <Ionicons name="mail-outline" size={20} color="#94a3b8" style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>PASSWORD</Text>
              <View style={s.inputWrap}>
                <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity style={s.registerBtn} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Text style={s.registerBtnText}>Create Account</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            <View style={s.footer}>
              <Text style={s.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={s.linkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#4f46e5' },
  scroll:         { flexGrow: 1 },
  header:         { paddingHorizontal: 32, paddingTop: 40, paddingBottom: 30, alignItems: 'center' },
  logoWrap:       { width: 80, height: 80, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  title:          { fontSize: 32, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: -1 },
  sub:            { fontSize: 16, color: '#e0e7ff', textAlign: 'center', marginTop: 8, fontWeight: '600' },

  form:           { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 32, paddingTop: 48 },
  errBanner:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 12, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: '#fee2e2' },
  errText:        { color: '#ef4444', marginLeft: 8, fontWeight: '700', fontSize: 14 },

  inputGroup:     { marginBottom: 20 },
  label:           { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 8 },
  inputWrap:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  inputIcon:      { marginLeft: 16 },
  input:          { flex: 1, paddingVertical: 16, paddingHorizontal: 12, fontSize: 15, color: '#1e293b', fontWeight: '600' },

  registerBtn:    { flexDirection: 'row', backgroundColor: '#4f46e5', borderRadius: 16, paddingVertical: 18, justifyContent: 'center', alignItems: 'center', marginTop: 12, shadowColor: '#4f46e5', shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  registerBtnText:{ color: '#fff', fontSize: 16, fontWeight: '800' },

  footer:         { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText:     { color: '#64748b', fontSize: 15, fontWeight: '600' },
  linkText:       { color: '#4f46e5', fontSize: 15, fontWeight: '800' },
});
