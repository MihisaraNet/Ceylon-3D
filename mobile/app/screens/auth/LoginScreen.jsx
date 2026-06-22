/**
 * LoginScreen.jsx — User Sign-In Screen
 *
 * Allows existing users to authenticate with email and password.
 *
 * Features:
 *   - Client-side validation (email format, password required)
 *   - Server-side error display (inline under fields + top banner)
 *   - Password visibility toggle
 *   - Auto-focus from email to password field
 *   - Navigation link to RegisterScreen
 *   - On success: calls AuthContext.login() to store token & navigate to MainTabs
 *
 * @module screens/auth/LoginScreen
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, SafeAreaView, StatusBar, Alert, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

/* ── Inline helpers ─────────────────────────────────────── */
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

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

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const s = getStyles(theme);
  const f = getFieldStyles(theme);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});
  const [serverErr,setServerErr]= useState('');
  const pwRef = useRef(null);

  // Auth Flow Modals State
  const [modalMode, setModalMode] = useState(null); // 'VERIFY' | 'FORGOT' | 'RESET' | null
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  /* ── Client validation ──────────────────────────────── */
  // Validate required fields before sending auth request.
  const validate = () => {
    const e = {};
    if (!email.trim())       e.email    = 'Email is required';
    else if (!isEmail(email))e.email    = 'Enter a valid email address';
    
    if (!password)           e.password = 'Password is required';
    
    setErrors(e);
    // True means form is valid.
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    // Reset prior server error banner.
    setServerErr('');
    
    // Stop early on invalid input.
    if (!validate()) return;
    
    setLoading(true);
    
    try {
      // Normalize email for case-insensitive matching.
      const { data } = await api.post('/auth/login', { email: email.trim().toLowerCase(), password });
      
      // Persist token/user via auth context.
      await login(data.token, data.user);
    } catch (err) {
      const res = err.response?.data;
      
      if (err.response?.status === 403 && res?.isVerified === false) {
        // Intercept login to show verification modal
        setModalMode('VERIFY');
        return;
      }
      
      // Map backend field errors when available.
      if (res?.errors) setErrors(res.errors);
      
      // Show general auth error.
      setServerErr(res?.error || 'Login failed. Please try again.');
    } finally { 
      setLoading(false); 
    }
  };

  const clearErr = (k) => setErrors(e => ({ ...e, [k]: '' }));

  /* ── Modal Handlers ───────────────────────────────────── */
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) return Alert.alert('Error', 'Enter a 6-digit OTP');
    setModalLoading(true);
    try {
      const { data } = await api.post('/auth/verify-email', { email: email.trim().toLowerCase(), otp: otpCode });
      setModalMode(null);
      await login(data.token, data.user);
    } catch (err) {
      Alert.alert('Verification Failed', err.response?.data?.error || 'Invalid OTP');
    } finally { setModalLoading(false); }
  };

  const handleResendOtp = async () => {
    try {
      await api.post('/auth/resend-otp', { email: email.trim().toLowerCase() });
      Alert.alert('Sent', 'A new OTP has been sent to your email.');
    } catch (err) { Alert.alert('Error', err.response?.data?.error || 'Failed to resend OTP'); }
  };

  const handleForgotPassword = async () => {
    if (!isEmail(email)) return Alert.alert('Email Required', 'Please enter your email address in the login field first.');
    setModalLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setModalMode('RESET');
      setOtpCode('');
      Alert.alert('Email Sent', 'We sent a password reset code to your email.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to send reset code');
    } finally { setModalLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!otpCode || otpCode.length !== 6) return Alert.alert('Error', 'Enter a 6-digit OTP');
    if (!newPassword || newPassword.length < 8) return Alert.alert('Error', 'New password must be at least 8 chars');
    setModalLoading(true);
    try {
      await api.post('/auth/reset-password', { email: email.trim().toLowerCase(), otp: otpCode, newPassword });
      setModalMode(null);
      setPassword(newPassword);
      Alert.alert('Success', 'Password reset successfully. You can now sign in.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to reset password');
    } finally { setModalLoading(false); }
  };

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
          <Text style={s.tagline}>Sign in to your account</Text>
        </View>

        {/* Server error banner */}
        {!!serverErr && (
          <View style={s.serverErrBanner}>
            <Ionicons name="warning-outline" size={16} color={theme.error} />
            <Text style={s.serverErrText}>{serverErr}</Text>
          </View>
        )}

        {/* Fields */}
        <Field label="Email address" icon="mail-outline" error={errors.email} f={f} theme={theme}>
          <TextInput
            style={f.input}
            placeholder="you@example.com"
            placeholderTextColor={theme.icon}
            value={email}
            onChangeText={v => { setEmail(v); clearErr('email'); setServerErr(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => pwRef.current?.focus()}
          />
        </Field>

        <Field label="Password" icon="lock-closed-outline" error={errors.password} f={f} theme={theme}>
          <TextInput
            ref={pwRef}
            style={[f.input, { flex: 1 }]}
            placeholder="Enter password"
            placeholderTextColor={theme.icon}
            value={password}
            onChangeText={v => { setPassword(v); clearErr('password'); setServerErr(''); }}
            secureTextEntry={!showPw}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          <TouchableOpacity onPress={() => setShowPw(p => !p)} style={{ padding: 12 }}>
            <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.icon} />
          </TouchableOpacity>
        </Field>

        {/* Remember Me & Forgot Password Row */}
        <View style={s.optionsRow}>
          <TouchableOpacity 
            style={s.rememberMe} 
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.7}
          >
            <View style={[s.checkbox, rememberMe && s.checkboxChecked]}>
              {rememberMe && <Ionicons name="checkmark" size={12} color={theme.primaryText} />}
            </View>
            <Text style={s.rememberText}>Remember me</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => {
            if (!isEmail(email)) {
              Alert.alert('Email Required', 'Please enter your email address above to reset your password.');
            } else {
              setModalMode('FORGOT');
            }
          }}>
            <Text style={s.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.88}>
          {loading ? (
            <ActivityIndicator color={theme.primaryText} />
          ) : (
            <>
              <Ionicons name="log-in-outline" size={20} color={theme.primaryText} style={{ marginRight: 6 }} />
              <Text style={s.btnText}>Sign In</Text>
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

        {/* Register link */}
        <TouchableOpacity style={s.link} onPress={() => navigation.navigate('Register')}>
          <Text style={s.linkText}>Don't have an account? <Text style={s.linkBold}>Create one →</Text></Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Auth Modals (Verify / Forgot / Reset) */}
      <Modal visible={modalMode !== null} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Ionicons 
                name={modalMode === 'VERIFY' ? "mail-unread-outline" : "key-outline"} 
                size={32} color={theme.primary} 
              />
              <Text style={s.modalTitle}>
                {modalMode === 'VERIFY' ? 'Verify Email' : modalMode === 'FORGOT' ? 'Reset Password' : 'New Password'}
              </Text>
              <Text style={s.modalSub}>
                {modalMode === 'VERIFY' ? `Enter the 6-digit code sent to ${email}` : 
                 modalMode === 'FORGOT' ? `We'll send a code to ${email}` : 
                 `Enter the reset code and your new password`}
              </Text>
            </View>

            {modalMode !== 'FORGOT' && (
              <TextInput
                style={s.otpInput}
                placeholder="000000"
                placeholderTextColor={theme.icon}
                keyboardType="number-pad"
                maxLength={6}
                value={otpCode}
                onChangeText={setOtpCode}
                autoFocus={modalMode === 'VERIFY'}
              />
            )}

            {modalMode === 'RESET' && (
              <TextInput
                style={[s.otpInput, { fontSize: 16, letterSpacing: 0, paddingVertical: 14 }]}
                placeholder="New Password (min 8 chars)"
                placeholderTextColor={theme.icon}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
            )}

            <TouchableOpacity 
              style={s.btn} 
              onPress={modalMode === 'VERIFY' ? handleVerifyOtp : modalMode === 'FORGOT' ? handleForgotPassword : handleResetPassword} 
              disabled={modalLoading}
            >
              {modalLoading ? <ActivityIndicator color={theme.primaryText} /> : (
                <Text style={s.btnText}>
                  {modalMode === 'VERIFY' ? 'Verify & Login' : modalMode === 'FORGOT' ? 'Send Code' : 'Update Password'}
                </Text>
              )}
            </TouchableOpacity>

            {(modalMode === 'VERIFY' || modalMode === 'RESET') && (
              <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={handleResendOtp}>
                <Text style={{ color: theme.primary, fontWeight: '700' }}>Resend Code</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => setModalMode(null)}>
              <Text style={{ color: theme.textSecondary }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

const getStyles = (t) => StyleSheet.create({
  safe:           { flex: 1, backgroundColor: t.background },
  container:      { flexGrow: 1, padding: 24, justifyContent: 'center' },
  brand:          { alignItems: 'center', marginBottom: 32 },
  logoBox:        { width: 72, height: 72, borderRadius: 20, backgroundColor: t.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: t.primary, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6 },
  logo:           { fontSize: 30, fontWeight: '900', color: t.text, letterSpacing: -0.5 },
  tagline:        { fontSize: 15, color: t.textSecondary, marginTop: 4 },
  serverErrBanner:{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.error + '15', borderWidth: 1, borderColor: t.error + '40', borderRadius: 12, padding: 12, marginBottom: 14 },
  serverErrText:  { color: t.error, fontSize: 13, fontWeight: '600', flex: 1 },
  btn:            { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: t.primary, borderRadius: 14, paddingVertical: 15, marginTop: 18, shadowColor: t.primary, shadowOpacity: 0.4, shadowRadius: 12, elevation: 5 },
  btnText:        { color: t.primaryText, fontSize: 16, fontWeight: '900' },
  optionsRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 8 },
  rememberMe:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox:       { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: t.border, backgroundColor: t.card, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked:{ backgroundColor: t.primary, borderColor: t.primary },
  rememberText:   { fontSize: 13, color: t.textSecondary, fontWeight: '600' },
  forgotText:     { fontSize: 13, color: t.primary, fontWeight: '700' },
  separatorContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  separatorLine:  { flex: 1, height: 1, backgroundColor: t.border },
  separatorText:  { marginHorizontal: 12, fontSize: 13, color: t.icon, fontWeight: '700' },
  socialRow:      { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  socialBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: t.card, borderWidth: 1, borderColor: t.border, borderRadius: 14, paddingVertical: 14 },
  socialBtnText:  { color: t.text, fontSize: 15, fontWeight: '700', marginLeft: 8 },
  link:           { alignItems: 'center', marginTop: 32 },
  linkText:       { color: t.textSecondary, fontSize: 14 },
  linkBold:       { color: t.primary, fontWeight: '800' },

  /* Modal Styles */
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  modalContent:   { backgroundColor: t.card, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  modalHeader:    { alignItems: 'center', marginBottom: 24 },
  modalTitle:     { fontSize: 24, fontWeight: '900', color: t.text, marginTop: 12 },
  modalSub:       { fontSize: 14, color: t.textSecondary, textAlign: 'center', marginTop: 8 },
  otpInput:       { backgroundColor: t.background, borderWidth: 1, borderColor: t.border, borderRadius: 14, fontSize: 32, fontWeight: '900', color: t.text, textAlign: 'center', letterSpacing: 10, paddingVertical: 16, marginBottom: 16 },
});
