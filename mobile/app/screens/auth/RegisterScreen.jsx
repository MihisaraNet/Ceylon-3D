import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

/* ── Helpers ─────────────────────────────────────────────── */
const isEmail   = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const pwRules   = (p) => ({
  length:    p.length >= 8,
  uppercase: /[A-Z]/.test(p),
  special:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
});

/* ── Inline field wrapper ────────────────────────────────── */
const Field = ({ label, icon, error, children }) => (
  <View style={f.group}>
    <Text style={f.label}>{label}</Text>
    <View style={[f.row, error && f.rowErr]}>
      <Ionicons name={icon} size={17} color={error ? '#ef4444' : '#9ca3af'} style={f.icon} />
      {children}
    </View>
    {!!error && (
      <View style={f.errRow}>
        <Ionicons name="alert-circle-outline" size={13} color="#ef4444" />
        <Text style={f.errText}>{error}</Text>
      </View>
    )}
  </View>
);

/* ── Password strength rule row ─────────────────────────── */
const RuleRow = ({ ok, text }) => (
  <View style={pw.row}>
    <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={ok ? '#22c55e' : '#d1d5db'} />
    <Text style={[pw.txt, ok && pw.ok]}>{text}</Text>
  </View>
);

export default function RegisterScreen({ navigation }) {
  const { login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});
  const [serverErr,setServerErr]= useState('');

  const emailRef = useRef(null);
  const pwRef    = useRef(null);
  const rules    = pwRules(password);
  const allRules = rules.length && rules.uppercase && rules.special;

  /* ── Validate ────────────────────────────────────────── */
  const validate = () => {
    const e = {};
    if (!fullName.trim() || fullName.trim().length < 2)
      e.fullName = 'Full name must be at least 2 characters';
    if (!email.trim())
      e.email    = 'Email is required';
    else if (!isEmail(email))
      e.email    = 'Enter a valid email address';
    if (!password)
      e.password = 'Password is required';
    else if (!rules.length)
      e.password = 'Password must be at least 8 characters';
    else if (!rules.uppercase)
      e.password = 'Add at least one uppercase letter';
    else if (!rules.special)
      e.password = 'Add at least one special character (!@#$%…)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    setServerErr('');
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        fullName: fullName.trim(),
        email:    email.trim().toLowerCase(),
        password,
      });
      await login(data.token, data.user);
    } catch (err) {
      const res = err.response?.data;
      if (res?.errors) setErrors(prev => ({ ...prev, ...res.errors }));
      setServerErr(res?.error || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const clearErr = (k) => setErrors(e => ({ ...e, [k]: '' }));

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f7ff" />
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

        {/* Brand */}
        <View style={s.brand}>
          <View style={s.logoBox}>
            <Ionicons name="cube" size={36} color="#fff" />
          </View>
          <Text style={s.logo}>Ceylon 3D</Text>
          <Text style={s.tagline}>Create your free account</Text>
        </View>

        {/* Server error banner */}
        {!!serverErr && (
          <View style={s.serverErrBanner}>
            <Ionicons name="warning-outline" size={16} color="#ef4444" />
            <Text style={s.serverErrText}>{serverErr}</Text>
          </View>
        )}

        {/* Full name */}
        <Field label="Full Name" icon="person-outline" error={errors.fullName}>
          <TextInput
            style={f.input}
            placeholder="Your full name"
            placeholderTextColor="#9ca3af"
            value={fullName}
            onChangeText={v => { setFullName(v); clearErr('fullName'); }}
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />
        </Field>

        {/* Email */}
        <Field label="Email address" icon="mail-outline" error={errors.email}>
          <TextInput
            ref={emailRef}
            style={f.input}
            placeholder="you@example.com"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={v => { setEmail(v); clearErr('email'); }}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => pwRef.current?.focus()}
          />
        </Field>

        {/* Password */}
        <Field label="Password" icon="lock-closed-outline" error={errors.password}>
          <TextInput
            ref={pwRef}
            style={[f.input, { flex: 1 }]}
            placeholder="Create a strong password"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={v => { setPassword(v); clearErr('password'); }}
            secureTextEntry={!showPw}
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />
          <TouchableOpacity onPress={() => setShowPw(p => !p)} style={{ padding: 12 }}>
            <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
          </TouchableOpacity>
        </Field>

        {/* Password strength indicator */}
        {password.length > 0 && (
          <View style={pw.box}>
            <View style={pw.barRow}>
              {[rules.length, rules.uppercase, rules.special].map((ok, i) => (
                <View key={i} style={[pw.bar, ok ? pw.barOk : pw.barBad]} />
              ))}
            </View>
            <Text style={pw.strengthLabel}>
              {allRules ? '✅ Strong password' : '⚠ Weak password'}
            </Text>
            <RuleRow ok={rules.length}    text="At least 8 characters" />
            <RuleRow ok={rules.uppercase} text="At least one uppercase letter (A–Z)" />
            <RuleRow ok={rules.special}   text="At least one special character (!@#$…)" />
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading} activeOpacity={0.88}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="person-add-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
              <Text style={s.btnText}>Create Account</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Login link */}
        <TouchableOpacity style={s.link} onPress={() => navigation.navigate('Login')}>
          <Text style={s.linkText}>Already have an account? <Text style={s.linkBold}>Sign In →</Text></Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

/* Shared field styles */
const f = StyleSheet.create({
  group:  { marginBottom: 14 },
  label:  { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  row:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14, overflow: 'hidden' },
  rowErr: { borderColor: '#ef4444', backgroundColor: '#fff5f5' },
  icon:   { paddingLeft: 13, paddingRight: 4 },
  input:  { flex: 1, height: 50, fontSize: 15, color: '#1e1b4b', paddingHorizontal: 8 },
  errRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  errText:{ fontSize: 12, color: '#ef4444', fontWeight: '600' },
});

/* Password strength styles */
const pw = StyleSheet.create({
  box:         { backgroundColor: '#f8f7ff', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  barRow:      { flexDirection: 'row', gap: 6, marginBottom: 8 },
  bar:         { flex: 1, height: 4, borderRadius: 99 },
  barOk:       { backgroundColor: '#22c55e' },
  barBad:      { backgroundColor: '#e5e7eb' },
  strengthLabel:{ fontSize: 12, fontWeight: '700', color: '#6b7280', marginBottom: 8 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  txt:         { fontSize: 13, color: '#9ca3af' },
  ok:          { color: '#22c55e', fontWeight: '600' },
});

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#f8f7ff' },
  container:      { flexGrow: 1, padding: 24, justifyContent: 'center' },
  brand:          { alignItems: 'center', marginBottom: 28 },
  logoBox:        { width: 72, height: 72, borderRadius: 20, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: '#6366f1', shadowOpacity: 0.4, shadowRadius: 16, elevation: 6 },
  logo:           { fontSize: 30, fontWeight: '900', color: '#1e1b4b', letterSpacing: -0.5 },
  tagline:        { fontSize: 15, color: '#9ca3af', marginTop: 4 },
  serverErrBanner:{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5', borderRadius: 12, padding: 12, marginBottom: 14 },
  serverErrText:  { color: '#ef4444', fontSize: 13, fontWeight: '600', flex: 1 },
  btn:            { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 15, marginTop: 8, shadowColor: '#6366f1', shadowOpacity: 0.4, shadowRadius: 12, elevation: 5 },
  btnText:        { color: '#fff', fontSize: 16, fontWeight: '900' },
  link:           { alignItems: 'center', marginTop: 22 },
  linkText:       { color: '#9ca3af', fontSize: 14 },
  linkBold:       { color: '#6366f1', fontWeight: '800' },
});
