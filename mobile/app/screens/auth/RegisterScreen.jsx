/**
 * RegisterScreen.jsx — User Registration Screen
 *
 * Allows new users to create an account with full name, email, and password.
 *
 * Features:
 *   - Client-side validation (name length, email format, password strength)
 *   - Real-time password strength indicator with visual progress bars
 *   - Server-side error display (inline under fields + top banner)
 *   - Password visibility toggle
 *   - Auto-focus between form fields via keyboard return key
 *   - Navigation link to LoginScreen
 *   - On success: auto-login via AuthContext and navigate to MainTabs
 *
 * Password requirements enforced:
 *   - Minimum 8 characters
 *   - At least one uppercase letter (A-Z)
 *   - At least one special character (!@#$%^&*...)
 *
 * @module screens/auth/RegisterScreen
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, SafeAreaView, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

/* ── Helpers ─────────────────────────────────────────────── */
const isEmail   = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const pwRules   = (p) => ({
  length:    p.length >= 8,
  uppercase: /[A-Z]/.test(p),
  special:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
});

/* ── Inline field wrapper ────────────────────────────────── */
const Field = ({ label, icon, error, children, f, theme }) => (
  <View style={f.group}>
    <Text style={f.label}>{label}</Text>
    <View style={[f.row, error && f.rowErr]}>
      <Ionicons name={icon} size={17} color={error ? theme.error : theme.icon} style={f.icon} />
      {children}
    </View>
    {!!error && (
      <View style={f.errRow}>
        <Ionicons name="alert-circle-outline" size={13} color={theme.error} />
        <Text style={f.errText}>{error}</Text>
      </View>
    )}
  </View>
);

/* ── Password strength rule row ─────────────────────────── */
const RuleRow = ({ ok, text, pw, theme }) => (
  <View style={pw.row}>
    <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={ok ? theme.success : theme.border} />
    <Text style={[pw.txt, ok && pw.ok]}>{text}</Text>
  </View>
);

export default function RegisterScreen({ navigation }) {
  const { login } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const s = getStyles(theme);
  const f = getFieldStyles(theme);
  const pw = getPwStyles(theme);
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

  /* ── Client validation ──────────────────────────────── */
  // Validate signup form before API call.
  const validate = () => {
    const e = {};
    
    // Basic full-name validation.
    if (!fullName.trim() || fullName.trim().length < 2)
      e.fullName = 'Full name must be at least 2 characters';
      
    // Email required + format check.
    if (!email.trim())
      e.email    = 'Email is required';
    else if (!isEmail(email))
      e.email    = 'Enter a valid email address';
      
    // Enforce password policy.
    if (!password)
      e.password = 'Password is required';
    else if (!rules.length)
      e.password = 'Password must be at least 8 characters';
    else if (!rules.uppercase)
      e.password = 'Add at least one uppercase letter';
    else if (!rules.special)
      e.password = 'Add at least one special character (!@#$%…)';
      
    setErrors(e);
    // True means form is valid.
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    // Reset prior server banner.
    setServerErr('');
    
    // Stop early on invalid input.
    if (!validate()) return;
    
    setLoading(true);
    try {
      // Normalize payload before registration.
      const { data } = await api.post('/auth/register', {
        fullName: fullName.trim(),
        email:    email.trim().toLowerCase(),
        password,
      });
      
      // Auto-login after successful registration.
      await login(data.token, data.user);
    } catch (err) {
      const res = err.response?.data;
      
      // Merge backend field errors.
      if (res?.errors) setErrors(prev => ({ ...prev, ...res.errors }));
      
      // Show fallback server message.
      setServerErr(res?.error || 'Registration failed. Please try again.');
    } finally { 
      setLoading(false); 
    }
  };

  const clearErr = (k) => setErrors(e => ({ ...e, [k]: '' }));

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

        {/* Brand */}
        <View style={s.brand}>
          <View style={s.logoBox}>
            <Ionicons name="cube" size={36} color="#f8fafc" />
          </View>
          <Text style={s.logo}>LayerForge 3D</Text>
          <Text style={s.tagline}>Create your free account</Text>
        </View>

        {/* Server error banner */}
        {!!serverErr && (
          <View style={s.serverErrBanner}>
            <Ionicons name="warning-outline" size={16} color={theme.error} />
            <Text style={s.serverErrText}>{serverErr}</Text>
          </View>
        )}

        {/* Full name */}
        <Field label="Full Name" icon="person-outline" error={errors.fullName} f={f} theme={theme}>
          <TextInput
            style={f.input}
            placeholder="Your full name"
            placeholderTextColor={theme.icon}
            value={fullName}
            onChangeText={v => { setFullName(v); clearErr('fullName'); }}
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />
        </Field>

        {/* Email */}
        <Field label="Email address" icon="mail-outline" error={errors.email} f={f} theme={theme}>
          <TextInput
            ref={emailRef}
            style={f.input}
            placeholder="you@example.com"
            placeholderTextColor={theme.icon}
            value={email}
            onChangeText={v => { setEmail(v); clearErr('email'); }}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => pwRef.current?.focus()}
          />
        </Field>

        {/* Password */}
        <Field label="Password" icon="lock-closed-outline" error={errors.password} f={f} theme={theme}>
          <TextInput
            ref={pwRef}
            style={[f.input, { flex: 1 }]}
            placeholder="Create a strong password"
            placeholderTextColor={theme.icon}
            value={password}
            onChangeText={v => { setPassword(v); clearErr('password'); }}
            secureTextEntry={!showPw}
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />
          <TouchableOpacity onPress={() => setShowPw(p => !p)} style={{ padding: 12 }}>
            <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.icon} />
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
            <RuleRow ok={rules.length}    text="At least 8 characters" pw={pw} theme={theme} />
            <RuleRow ok={rules.uppercase} text="At least one uppercase letter (A–Z)" pw={pw} theme={theme} />
            <RuleRow ok={rules.special}   text="At least one special character (!@#$…)" pw={pw} theme={theme} />
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading} activeOpacity={0.88}>
          {loading ? (
            <ActivityIndicator color={theme.primaryText} />
          ) : (
            <>
              <Ionicons name="person-add-outline" size={20} color={theme.primaryText} style={{ marginRight: 6 }} />
              <Text style={s.btnText}>Create Account</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Separator */}
        <View style={s.separatorContainer}>
          <View style={s.separatorLine} />
          <Text style={s.separatorText}>OR</Text>
          <View style={s.separatorLine} />
        </View>

        {/* Social Login */}
        <View style={s.socialRow}>
          <TouchableOpacity style={s.socialBtn} onPress={() => Alert.alert('Google Sign-In', 'Google Sign-In backend integration pending.')} activeOpacity={0.88}>
            <Ionicons name="logo-google" size={20} color="#db4437" />
            <Text style={s.socialBtnText}>Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.socialBtn} onPress={() => Alert.alert('Apple Sign-In', 'Apple Sign-In backend integration pending.')} activeOpacity={0.88}>
            <Ionicons name="logo-apple" size={20} color="#111827" />
            <Text style={s.socialBtnText}>Apple</Text>
          </TouchableOpacity>
        </View>

        {/* Login link */}
        <TouchableOpacity style={s.link} onPress={() => navigation.navigate('Login')}>
          <Text style={s.linkText}>Already have an account? <Text style={s.linkBold}>Sign In →</Text></Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

/* Shared field styles */
const getFieldStyles = (t) => StyleSheet.create({
  group:  { marginBottom: 14 },
  label:  { fontSize: 13, fontWeight: '700', color: t.text, marginBottom: 6 },
  row:    { flexDirection: 'row', alignItems: 'center', backgroundColor: t.card, borderWidth: 1.5, borderColor: t.border, borderRadius: 14, overflow: 'hidden' },
  rowErr: { borderColor: t.error, backgroundColor: t.error + '10' },
  icon:   { paddingLeft: 13, paddingRight: 4 },
  input:  { flex: 1, height: 50, fontSize: 15, color: t.text, paddingHorizontal: 8 },
  errRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  errText:{ fontSize: 12, color: t.error, fontWeight: '600' },
});

/* Password strength styles */
const getPwStyles = (t) => StyleSheet.create({
  box:         { backgroundColor: t.background, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: t.border },
  barRow:      { flexDirection: 'row', gap: 6, marginBottom: 8 },
  bar:         { flex: 1, height: 4, borderRadius: 99 },
  barOk:       { backgroundColor: t.success },
  barBad:      { backgroundColor: t.border },
  strengthLabel:{ fontSize: 12, fontWeight: '700', color: t.textSecondary, marginBottom: 8 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  txt:         { fontSize: 13, color: t.icon },
  ok:          { color: t.success, fontWeight: '600' },
});

const getStyles = (t) => StyleSheet.create({
  safe:           { flex: 1, backgroundColor: t.background },
  container:      { flexGrow: 1, padding: 24, justifyContent: 'center' },
  brand:          { alignItems: 'center', marginBottom: 28 },
  logoBox:        { width: 72, height: 72, borderRadius: 20, backgroundColor: t.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: t.primary, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6 },
  logo:           { fontSize: 30, fontWeight: '900', color: t.text, letterSpacing: -0.5 },
  tagline:        { fontSize: 15, color: t.textSecondary, marginTop: 4 },
  serverErrBanner:{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.error + '15', borderWidth: 1, borderColor: t.error + '40', borderRadius: 12, padding: 12, marginBottom: 14 },
  serverErrText:  { color: t.error, fontSize: 13, fontWeight: '600', flex: 1 },
  btn:            { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: t.primary, borderRadius: 14, paddingVertical: 15, marginTop: 8, shadowColor: t.primary, shadowOpacity: 0.4, shadowRadius: 12, elevation: 5 },
  btnText:        { color: t.primaryText, fontSize: 16, fontWeight: '900' },
  separatorContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  separatorLine:  { flex: 1, height: 1, backgroundColor: t.border },
  separatorText:  { marginHorizontal: 12, fontSize: 13, color: t.icon, fontWeight: '700' },
  socialRow:      { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  socialBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: t.card, borderWidth: 1, borderColor: t.border, borderRadius: 14, paddingVertical: 14 },
  socialBtnText:  { color: t.text, fontSize: 15, fontWeight: '700', marginLeft: 8 },
  link:           { alignItems: 'center', marginTop: 32 },
  linkText:       { color: t.textSecondary, fontSize: 14 },
  linkBold:       { color: t.primary, fontWeight: '800' },
});
