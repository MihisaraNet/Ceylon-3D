/**
 * STLUploadScreen.jsx — 3D Print Order Upload Wizard
 *
 * Modern, colorful and simple design.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { STL_MATERIALS } from '../../data/categories';

const STEPS = ['Upload', 'Details', 'Review'];

export default function STLUploadScreen() {
  const { user } = useAuth();
  const [step, setStep]     = useState(0);
  const [file, setFile]     = useState(null);
  const [material, setMat]  = useState('PLA');
  const [quantity, setQty]  = useState(1);
  const [notes, setNotes]   = useState('');
  const [form, setForm]     = useState({
    name: user?.fullName || '', email: user?.email || '', phone: '', address: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);

  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (!asset) return;
    
    const ext = asset.name.split('.').pop().toLowerCase();
    if (!['stl','pdf','jpg','jpeg'].includes(ext)) {
      return Alert.alert('Invalid', 'Only .stl, .pdf, .jpg, .jpeg accepted');
    }
    setFile(asset);
  };

  const handleNext = () => {
    if (step === 0 && !file) return Alert.alert('File Required', 'Please select a file.');
    if (step === 1 && (!form.name || !form.email || !form.phone || !form.address)) return Alert.alert('Required', 'Please fill all fields.');
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('file', { uri: file.uri, name: file.name, type: file.mimeType || 'application/octet-stream' });
      fd.append('name', form.name);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      fd.append('address', form.address);
      fd.append('material', material);
      fd.append('quantity', String(quantity));
      fd.append('message', notes);
      
      const { data } = await api.post('/api/uploads/stl', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(data);
    } catch (err) {
      Alert.alert('Failed', 'Submission failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (result) return (
    <ScrollView contentContainerStyle={s.successScroll} style={{ backgroundColor: '#fff' }}>
      <View style={s.successIconWrap}>
        <Ionicons name="checkmark-circle" size={100} color="#10b981" />
      </View>
      <Text style={s.successTitle}>Order Placed!</Text>
      <Text style={s.successSub}>We'll review your file and send a quote shortly.</Text>
      <View style={s.resultCard}>
        <View style={s.resultRow}><Text style={s.resultLabel}>ORDER ID</Text><Text style={s.resultVal}>#{result.stlOrderId?.slice(-6).toUpperCase()}</Text></View>
        <View style={s.resultRow}><Text style={s.resultLabel}>MATERIAL</Text><Text style={s.resultVal}>{result.material}</Text></View>
        <View style={s.resultRow}><Text style={s.resultLabel}>EST. PRICE</Text><Text style={[s.resultVal, { color: '#6366f1' }]}>LKR {result.estimatedPrice?.toFixed(2)}</Text></View>
      </View>
      <TouchableOpacity style={s.doneBtn} onPress={() => { setResult(null); setStep(0); setFile(null); }}>
        <Text style={s.doneBtnText}>New Submission</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={s.header}>
        <Text style={s.headerTitle}>STL Upload</Text>
        <View style={s.stepper}>
          {STEPS.map((l, i) => (
            <View key={l} style={s.stepWrap}>
              <View style={[s.stepDot, i <= step && s.stepDotActive]}>
                {i < step ? <Ionicons name="checkmark" size={12} color="#fff" /> : <Text style={[s.stepNum, i === step && { color: '#fff' }]}>{i + 1}</Text>}
              </View>
              <Text style={[s.stepLabel, i === step && s.stepLabelActive]}>{l}</Text>
              {i < STEPS.length - 1 && <View style={[s.stepLine, i < step && s.stepLineActive]} />}
            </View>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {step === 0 && (
          <View>
            <TouchableOpacity style={[s.dropzone, file && s.dropzoneActive]} onPress={pickFile}>
              <View style={[s.dropzoneIcon, { backgroundColor: file ? '#f0fdf4' : '#f5f3ff' }]}>
                <Ionicons name={file ? 'document-text' : 'cloud-upload'} size={40} color={file ? '#10b981' : '#6366f1'} />
              </View>
              <Text style={s.dropzoneTitle}>{file ? file.name : 'Select Design File'}</Text>
              <Text style={s.dropzoneSub}>{file ? `${(file.size/1024).toFixed(1)} KB` : 'STL, PDF, JPG, JPEG supported'}</Text>
            </TouchableOpacity>

            <Text style={s.sectionLabel}>CHOOSE MATERIAL</Text>
            <View style={s.materialGrid}>
              {STL_MATERIALS.map(m => (
                <TouchableOpacity key={m.id} style={[s.matCard, material === m.id && s.matCardActive]} onPress={() => setMat(m.id)}>
                  <Text style={s.matEmoji}>{m.emoji}</Text>
                  <Text style={[s.matTitle, material === m.id && s.matTitleActive]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.sectionLabel}>QUANTITY</Text>
            <View style={s.qtyRow}>
              <TouchableOpacity style={s.qtyBtn} onPress={() => setQty(q => Math.max(1, q-1))}><Ionicons name="remove" size={24} color="#6366f1" /></TouchableOpacity>
              <Text style={s.qtyVal}>{quantity}</Text>
              <TouchableOpacity style={s.qtyBtn} onPress={() => setQty(q => q+1)}><Ionicons name="add" size={24} color="#6366f1" /></TouchableOpacity>
            </View>

            <Text style={s.sectionLabel}>NOTES</Text>
            <TextInput
              style={s.textarea}
              placeholder="Any specific instructions..."
              multiline
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        )}

        {step === 1 && (
          <View>
            {[
              { key: 'name',    label: 'FULL NAME',     icon: 'person-outline' },
              { key: 'email',   label: 'EMAIL ADDRESS', icon: 'mail-outline' },
              { key: 'phone',   label: 'PHONE NUMBER',  icon: 'call-outline' },
              { key: 'address', label: 'ADDRESS',       icon: 'location-outline', multi: true },
            ].map(f => (
              <View key={f.key} style={s.inputGroup}>
                <Text style={s.sectionLabel}>{f.label}</Text>
                <View style={[s.inputWrap, f.multi && { alignItems: 'flex-start' }]}>
                  <Ionicons name={f.icon} size={20} color="#94a3b8" style={{ marginTop: f.multi ? 16 : 0, marginLeft: 16 }} />
                  <TextInput
                    style={[s.input, f.multi && { height: 100, textAlignVertical: 'top' }]}
                    value={form[f.key]}
                    onChangeText={v => setForm(p => ({...p, [f.key]: v}))}
                    placeholder={`Enter ${f.label.toLowerCase()}`}
                    multiline={f.multi}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {step === 2 && (
          <View>
            <View style={s.reviewCard}>
              <Text style={s.reviewTitle}>Final Review</Text>
              <ReviewRow label="File" value={file?.name} />
              <ReviewRow label="Material" value={material} />
              <ReviewRow label="Quantity" value={String(quantity)} />
              <View style={s.reviewDivider} />
              <ReviewRow label="Customer" value={form.name} />
              <ReviewRow label="Phone" value={form.phone} />
            </View>
            <View style={s.trustBanner}>
              <Ionicons name="shield-checkmark" size={24} color="#10b981" />
              <Text style={s.trustText}>Secure upload & Encrypted storage</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={s.footer}>
        {step > 0 && (
          <TouchableOpacity style={s.backBtn} onPress={() => setStep(s => s - 1)}>
            <Text style={s.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[s.nextBtn, step === 2 && { backgroundColor: '#10b981' }]}
          onPress={step === 2 ? handleSubmit : handleNext}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : (
            <>
              <Text style={s.nextBtnText}>{step === 2 ? 'Submit Order' : 'Continue'}</Text>
              <Ionicons name={step === 2 ? 'send' : 'arrow-forward'} size={18} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const ReviewRow = ({ label, value }) => (
  <View style={s.reviewRow}>
    <Text style={s.reviewLabel}>{label}</Text>
    <Text style={s.reviewVal}>{value}</Text>
  </View>
);

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#fff' },
  header:         { paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  headerTitle:    { fontSize: 28, fontWeight: '900', color: '#1e293b', marginBottom: 20 },
  
  stepper:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepWrap:       { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot:        { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  stepDotActive:  { backgroundColor: '#6366f1' },
  stepNum:        { fontSize: 10, fontWeight: '800', color: '#94a3b8' },
  stepLabel:      { fontSize: 12, color: '#94a3b8', fontWeight: '700', marginLeft: 8 },
  stepLabelActive:{ color: '#6366f1' },
  stepLine:       { flex: 1, height: 2, backgroundColor: '#f1f5f9', marginHorizontal: 8 },
  stepLineActive: { backgroundColor: '#6366f1' },

  dropzone:       { borderWidth: 2, borderStyle: 'dashed', borderColor: '#e2e8f0', borderRadius: 24, padding: 32, alignItems: 'center', backgroundColor: '#f8fafc', marginBottom: 32 },
  dropzoneActive: { borderColor: '#6366f1', backgroundColor: '#f5f3ff' },
  dropzoneIcon:   { padding: 16, borderRadius: 20, marginBottom: 16 },
  dropzoneTitle:  { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  dropzoneSub:    { fontSize: 14, color: '#94a3b8', marginTop: 4, fontWeight: '600' },

  sectionLabel:   { fontSize: 11, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },
  materialGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  matCard:        { width: '47%', backgroundColor: '#fff', borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  matCardActive:  { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  matEmoji:       { fontSize: 24, marginBottom: 4 },
  matTitle:       { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  matTitleActive: { color: '#fff' },

  qtyRow:         { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 32 },
  qtyBtn:         { backgroundColor: '#f5f3ff', padding: 12, borderRadius: 16 },
  qtyVal:         { fontSize: 32, fontWeight: '900', color: '#1e293b' },
  textarea:       { backgroundColor: '#f8fafc', borderRadius: 20, padding: 20, fontSize: 15, color: '#1e293b', borderWidth: 1, borderColor: '#f1f5f9', height: 120, textAlignVertical: 'top' },

  inputGroup:     { marginBottom: 20 },
  inputWrap:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  input:          { flex: 1, padding: 16, fontSize: 15, color: '#1e293b', fontWeight: '600' },

  reviewCard:     { backgroundColor: '#f5f3ff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#e0e7ff' },
  reviewTitle:    { fontSize: 20, fontWeight: '900', color: '#6366f1', marginBottom: 20 },
  reviewRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  reviewLabel:    { fontSize: 14, color: '#64748b', fontWeight: '700' },
  reviewVal:      { fontSize: 14, color: '#1e293b', fontWeight: '800' },
  reviewDivider:  { height: 1, backgroundColor: '#e0e7ff', marginVertical: 16 },
  trustBanner:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', padding: 20, borderRadius: 20, marginTop: 20, gap: 12 },
  trustText:      { fontSize: 14, color: '#166534', fontWeight: '700' },

  footer:         { flexDirection: 'row', padding: 24, borderTopWidth: 1, borderColor: '#f1f5f9', gap: 12 },
  backBtn:        { paddingHorizontal: 24, justifyContent: 'center' },
  backBtnText:    { fontSize: 15, fontWeight: '800', color: '#64748b' },
  nextBtn:        { flex: 1, flexDirection: 'row', backgroundColor: '#6366f1', borderRadius: 20, paddingVertical: 18, justifyContent: 'center', alignItems: 'center', shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  nextBtnText:    { color: '#fff', fontSize: 16, fontWeight: '800' },

  successScroll:  { flexGrow: 1, alignItems: 'center', padding: 40, paddingTop: 80 },
  successIconWrap:{ width: 160, height: 160, backgroundColor: '#f0fdf4', borderRadius: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  successTitle:   { fontSize: 32, fontWeight: '900', color: '#1e293b' },
  successSub:     { fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 12, lineHeight: 24, marginBottom: 40 },
  resultCard:     { width: '100%', backgroundColor: '#f8fafc', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 40 },
  resultRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  resultLabel:    { fontSize: 11, fontWeight: '900', color: '#94a3b8', letterSpacing: 1 },
  resultVal:      { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  doneBtn:        { backgroundColor: '#1e293b', paddingHorizontal: 40, paddingVertical: 20, borderRadius: 20 },
  doneBtnText:    { color: '#fff', fontSize: 16, fontWeight: '800' },
});
