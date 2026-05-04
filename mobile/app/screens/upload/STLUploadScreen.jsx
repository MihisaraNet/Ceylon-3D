/**
 * STLUploadScreen.jsx — 3D Print Order Wizard
 * 
 * This screen guides the user through a 3-step process to request a quote
 * for a custom 3D print job by uploading an STL or design file.
 * 
 * Flow:
 *   Step 0: Upload — Select file, choose material, set quantity/notes.
 *   Step 1: Details — Enter contact info (Name, Email, Phone, Address).
 *   Step 2: Review — Final summary before submission.
 * 
 * Features:
 *   - File type validation (.stl, .pdf, .jpg, .jpeg)
 *   - Automatic user profile fallback for authenticated users
 *   - Multi-step state management with form validation per step
 *   - Interactive material selection grid
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, SafeAreaView, StatusBar,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { STL_MATERIALS } from '../../data/categories';

const STEPS = ['Upload', 'Details', 'Review'];

export default function STLUploadScreen() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [material, setMat] = useState('PLA');
  const [quantity, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [form, setForm] = useState({
    name: user?.fullName || '', email: user?.email || '', phone: '', address: '', email2: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  /**
   * pickFile — Opens the document picker to select an STL/design file.
   * Validates the file extension before updating the state.
   */
  const pickFile = async () => {
    // Open system file browser
    const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    
    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (!asset) return;
    
    // Extract extension and validate
    const ext = asset.name.split('.').pop().toLowerCase();
    if (!['stl', 'pdf', 'jpg', 'jpeg'].includes(ext)) {
      return Alert.alert('Invalid file', 'Only .stl, .pdf, .jpg, .jpeg are accepted');
    }
    
    setFile(asset);
  };

  /**
   * removeFile — Clears the selected file and resets the dropzone.
   */
  const removeFile = () => {
    setFile(null);
  };

  /**
   * validateStep1 — Ensures a file has been selected before moving to step 2.
   */
  const validateStep1 = () => {
    if (!file) { Alert.alert('Required', 'Please select a file'); return false; }
    return true;
  };

  /**
   * validateStep2 — Validates contact information using basic rules and regex.
   */
  const validateStep2 = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.name || !form.email || !form.phone || !form.address) {
      Alert.alert('Required', 'Please fill all required fields');
      return false;
    }
    if (!emailRegex.test(form.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return false;
    }
    if (form.phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 0 && !validateStep1()) return;
    if (step === 1 && !validateStep2()) return;
    setStep(s => s + 1);
  };

  /**
   * handleSubmit — Final submission of the order to the backend.
   * Packages the file and form fields into a FormData object.
   */
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Build multipart/form-data payload
      const fd = new FormData();
      // Attach the physical file
      fd.append('file', { 
        uri: file.uri, 
        name: file.name, 
        type: file.mimeType || 'application/octet-stream' 
      });
      
      // Attach metadata and contact details
      fd.append('name', form.name);
      fd.append('email', form.email);
      if (form.email2) fd.append('email2', form.email2);
      fd.append('phone', form.phone);
      fd.append('address', form.address);
      fd.append('material', material);
      fd.append('quantity', String(quantity));
      fd.append('message', notes);

      // POST /api/uploads/stl triggers the upload and initial pricing logic
      const { data } = await api.post('/api/uploads/stl', fd, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      
      setResult(data); // Display success screen
    } catch (err) {
      Alert.alert('Submit Failed', err.response?.data?.error || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  if (result) return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.successContainer} showsVerticalScrollIndicator={false}>
        <View style={s.successIconBox}>
          <Ionicons name="checkmark-circle" size={80} color="#6366f1" />
        </View>
        <Text style={s.successTitle}>Order Submitted!</Text>
        <Text style={s.successSub}>Our team will review your file and send you a quote shortly.</Text>
        
        <View style={s.resultCard}>
          <View style={s.resultHeader}>
            <Text style={s.resultId}>Order #{result.stlOrderId?.slice(-6).toUpperCase()}</Text>
            <View style={s.pendingBadge}><Text style={s.pendingText}>PENDING QUOTE</Text></View>
          </View>
          <View style={s.resultContent}>
            <Row label="File Name" value={result.fileName?.replace(/^[0-9a-f-]+-/i, '')} />
            <Row label="Material" value={result.material} />
            <Row label="Quantity" value={String(result.quantity)} />
            <View style={s.priceBox}>
              <Text style={s.priceLabel}>Estimated Price</Text>
              <Text style={s.priceVal}>LKR {result.estimatedPrice?.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={s.resetBtn} onPress={() => { setResult(null); setStep(0); setFile(null); setNotes(''); setQty(1); }}>
          <Text style={s.resetBtnText}>Submit Another Order</Text>
          <Ionicons name="add-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f7ff" />
      
      {/* Premium Stepper */}
      <View style={s.stepperHeader}>
        <Text style={s.stepperTitle}>{STEPS[step]}</Text>
        <View style={s.stepTrack}>
          {STEPS.map((_, i) => (
            <React.Fragment key={i}>
              <View style={[s.stepDot, i <= step && s.stepDotActive, i < step && s.stepDotDone]}>
                {i < step ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : (
                  <Text style={[s.stepNum, i === step && { color: '#fff' }]}>{i + 1}</Text>
                )}
              </View>
              {i < STEPS.length - 1 && <View style={[s.stepLine, i < step && s.stepLineDone]} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {step === 0 && (
          <View>
            <View style={[s.dropzone, file && s.dropzoneDone]}>
              <TouchableOpacity 
                style={s.dropzoneTouch} 
                onPress={pickFile} 
                activeOpacity={0.7}
              >
                <View style={[s.dropzoneIcon, file && { backgroundColor: '#eef2ff' }]}>
                  <Ionicons name={file ? 'document-text' : 'cloud-upload-outline'} size={40} color={file ? '#6366f1' : '#9ca3af'} />
                </View>
                <Text style={[s.dropzoneText, file && { color: '#1e1b4b', fontWeight: '800' }]}>
                  {file ? file.name : 'Tap to Select Design File'}
                </Text>
                {!file && <Text style={s.dropzoneSub}>STL, PDF, or High-res Image</Text>}
              </TouchableOpacity>

              {file && (
                <View style={s.fileInfoRow}>
                  <Text style={s.fileSize}>{(file.size / 1024).toFixed(1)} KB</Text>
                  <TouchableOpacity 
                    style={s.removeFileBtn} 
                    onPress={removeFile} 
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    <Text style={s.removeFileText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Text style={s.fieldLabel}>Preferred Material</Text>
            <View style={s.materialGrid}>
              {STL_MATERIALS.map(m => (
                <TouchableOpacity key={m.id} style={[s.matBtn, material === m.id && s.matBtnActive]} onPress={() => setMat(m.id)}>
                  <Text style={s.matEmoji}>{m.emoji}</Text>
                  <Text style={[s.matLabel, material === m.id && s.matLabelActive]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.qtySection}>
              <View>
                <Text style={s.fieldLabel}>Quantity</Text>
                <Text style={s.fieldSub}>Number of copies</Text>
              </View>
              <View style={s.qtyRow}>
                <TouchableOpacity style={s.qtyBtn} onPress={() => setQty(q => Math.max(1, q - 1))} activeOpacity={0.6} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="remove" size={20} color="#6366f1" />
                </TouchableOpacity>
                <Text style={s.qtyVal}>{quantity}</Text>
                <TouchableOpacity style={s.qtyBtn} onPress={() => setQty(q => q + 1)} activeOpacity={0.6} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="add" size={20} color="#6366f1" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={s.fieldLabel}>Additional Notes</Text>
            <TextInput
              style={s.textarea}
              value={notes}
              onChangeText={setNotes}
              placeholder="E.g. Specific infill, color, or finish requirements..."
              multiline
              numberOfLines={4}
              placeholderTextColor="#9ca3af"
            />
          </View>
        )}

        {step === 1 && (
          <View style={s.form}>
            {[
              { key: 'name', label: 'Full Name', icon: 'person-outline' },
              { key: 'email', label: 'Email Address', icon: 'mail-outline', disabled: !!user },
              { key: 'email2', label: 'Alt Email (Optional)', icon: 'mail-open-outline' },
              { key: 'phone', label: 'Phone Number', icon: 'call-outline', keyboard: 'phone-pad' },
              { key: 'address', label: 'Delivery Address', icon: 'map-outline', multiline: true },
            ].map(f => (
              <View key={f.key} style={s.fieldGroup}>
                <Text style={s.fieldLabel}>{f.label}</Text>
                <View style={[s.inputRow, f.multiline && { alignItems: 'flex-start', paddingVertical: 10 }]}>
                  <Ionicons name={f.icon} size={18} color="#6366f1" style={s.inputIcon} />
                  <TextInput
                    style={[s.inputField, f.disabled && s.inputDisabled, f.multiline && { height: 80, textAlignVertical: 'top' }]}
                    value={form[f.key]}
                    onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                    keyboardType={f.keyboard || 'default'}
                    editable={!f.disabled}
                    placeholder={`Enter your ${f.label.toLowerCase()}`}
                    placeholderTextColor="#9ca3af"
                    multiline={f.multiline}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {step === 2 && (
          <View style={s.reviewBox}>
            <View style={s.reviewCard}>
              <View style={s.reviewHeader}>
                <Ionicons name="document-text-outline" size={18} color="#6366f1" />
                <Text style={s.reviewTitle}>Summary</Text>
              </View>
              <View style={s.reviewBody}>
                <Row label="File" value={file?.name?.replace(/^[0-9a-f-]+-/i, '') || '-'} />
                <Row label="Material" value={material} />
                <Row label="Quantity" value={String(quantity)} />
                <View style={s.divider} />
                <Row label="Contact" value={form.name} />
                <Row label="Phone" value={form.phone} />
                <Row label="Deliver to" value={form.address} />
                {notes ? <Row label="Notes" value={notes} /> : null}
              </View>
            </View>

            <View style={s.infoCard}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#6366f1" />
              <View style={{ flex: 1 }}>
                <Text style={s.infoCardTitle}>Secure Quote System</Text>
                <Text style={s.infoCardText}>No payment is required now. We will send you a final quote once our experts review the file.</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={s.footer}>
        {step > 0 ? (
          <TouchableOpacity style={s.backBtn} onPress={() => setStep(s => s - 1)}>
            <Ionicons name="chevron-back" size={20} color="#6366f1" />
            <Text style={s.backBtnText}>Previous</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 100 }} />}

        {step < 2 ? (
          <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
            <Text style={s.nextBtnText}>Continue</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={s.nextBtnText}>Confirm Order</Text>
                <Ionicons name="send" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const Row = ({ label, value }) => (
  <View style={s.reviewRow}>
    <Text style={s.reviewLabel}>{label}</Text>
    <Text style={s.reviewVal} numberOfLines={2}>{value}</Text>
  </View>
);

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f7ff' },
  stepperHeader: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  stepperTitle: { fontSize: 24, fontWeight: '900', color: '#1e1b4b', marginBottom: 15 },
  stepTrack: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  stepDotActive: { backgroundColor: '#6366f1' },
  stepDotDone: { backgroundColor: '#22c55e' },
  stepNum: { fontSize: 13, fontWeight: '800', color: '#94a3b8' },
  stepLine: { flex: 1, height: 4, backgroundColor: '#f1f5f9', marginHorizontal: -2 },
  stepLineDone: { backgroundColor: '#22c55e' },
  
  container: { flex: 1 },
  dropzone: { backgroundColor: '#fff', borderRadius: 24, padding: 30, alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: '#c7d2fe', marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  dropzoneDone: { borderColor: '#6366f1', backgroundColor: '#f8f7ff' },
  dropzoneTouch: { width: '100%', alignItems: 'center' },
  dropzoneIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  dropzoneText: { fontSize: 16, color: '#6366f1', fontWeight: '700', textAlign: 'center' },
  dropzoneSub: { fontSize: 12, color: '#94a3b8', marginTop: 5 },
  fileInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 10 },
  fileSize: { fontSize: 12, color: '#6366f1', fontWeight: '800' },
  removeFileBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fef2f2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#fee2e2' },
  removeFileText: { fontSize: 11, fontWeight: '700', color: '#ef4444' },
  
  fieldLabel: { fontSize: 14, fontWeight: '800', color: '#1e1b4b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldSub: { fontSize: 12, color: '#94a3b8', marginTop: -6, marginBottom: 10 },
  materialGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  matBtn: { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: '#f1f5f9' },
  matBtnActive: { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
  matEmoji: { fontSize: 24, marginBottom: 4 },
  matLabel: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  matLabelActive: { color: '#6366f1' },
  
  qtySection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, backgroundColor: '#fff', padding: 16, borderRadius: 20 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  qtyBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center' },
  qtyVal: { fontSize: 20, fontWeight: '900', color: '#1e1b4b', minWidth: 30, textAlign: 'center' },
  
  textarea: { backgroundColor: '#fff', borderRadius: 20, padding: 16, fontSize: 16, color: '#1e1b4b', fontWeight: '600', borderWidth: 1.5, borderColor: '#f1f5f9', height: 120 },
  
  form: { gap: 16 },
  fieldGroup: { marginBottom: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1.5, borderColor: '#f1f5f9' },
  inputIcon: { marginRight: 12 },
  inputField: { flex: 1, height: 50, fontSize: 16, color: '#1e1b4b', fontWeight: '600' },
  inputDisabled: { color: '#94a3b8' },
  
  reviewBox: { gap: 16 },
  reviewCard: { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  reviewTitle: { fontSize: 16, fontWeight: '800', color: '#1e1b4b' },
  reviewBody: { padding: 16, gap: 10 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  reviewLabel: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  reviewVal: { fontSize: 14, color: '#1e1b4b', fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 20 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 },
  
  infoCard: { flexDirection: 'row', gap: 15, backgroundColor: '#eef2ff', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#c7d2fe' },
  infoCardTitle: { fontSize: 15, fontWeight: '900', color: '#4338ca', marginBottom: 2 },
  infoCardText: { fontSize: 13, color: '#4f46e5', lineHeight: 18 },
  
  footer: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 16 },
  backBtnText: { color: '#6366f1', fontSize: 16, fontWeight: '800' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 24, gap: 8, shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#22c55e', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 24, gap: 8, shadowColor: '#22c55e', shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  
  successContainer: { flexGrow: 1, alignItems: 'center', padding: 24, paddingTop: 60 },
  successIconBox: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successTitle: { fontSize: 32, fontWeight: '900', color: '#1e1b4b', marginBottom: 10 },
  successSub: { fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  resultCard: { width: '100%', backgroundColor: '#fff', borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, elevation: 5 },
  resultHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultId: { fontSize: 16, fontWeight: '900', color: '#1e1b4b' },
  pendingBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  pendingText: { fontSize: 10, fontWeight: '900', color: '#d97706' },
  resultContent: { padding: 16, gap: 10 },
  priceBox: { marginTop: 10, backgroundColor: '#1e1b4b', padding: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 13, color: '#a5b4fc', fontWeight: '800' },
  priceVal: { fontSize: 20, color: '#fff', fontWeight: '900' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#6366f1', paddingVertical: 18, paddingHorizontal: 32, borderRadius: 20, marginTop: 40, shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  resetBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
