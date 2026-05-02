/**
 * STLUploadScreen.jsx — Premium 3D Project Initiation
 * 
 * Attractive, modern design with a refined 
 * multi-step wizard and premium file dropzone.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator, SafeAreaView, StatusBar, Dimensions } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { STL_MATERIALS } from '../../data/categories';

const STEPS = ['Asset', 'Setup', 'Finish'];

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
    if (asset) setFile(asset);
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
    } catch { Alert.alert('Error', 'Upload failed. Check connection.'); }
    finally { setSubmitting(false); }
  };

  if (result) return (
    <ScrollView contentContainerStyle={s.successWrap} style={{ backgroundColor: '#fff' }}>
      <View style={s.successCircle}>
        <Ionicons name="checkmark-done" size={60} color="#fff" />
      </View>
      <Text style={s.successTitle}>Request Sent</Text>
      <Text style={s.successSub}>Your blueprint is being analyzed by our engineers.</Text>
      <View style={s.finalCard}>
        <View style={s.fRow}><Text style={s.fLabel}>Order</Text><Text style={s.fVal}>#{result.stlOrderId?.slice(-6).toUpperCase()}</Text></View>
        <View style={s.fRow}><Text style={s.fLabel}>Mat.</Text><Text style={s.fVal}>{result.material}</Text></View>
        <View style={s.fRow}><Text style={s.fLabel}>Est.</Text><Text style={[s.fVal, { color: '#6366f1' }]}>LKR {result.estimatedPrice?.toFixed(0)}</Text></View>
      </View>
      <TouchableOpacity style={s.resetBtn} onPress={() => { setResult(null); setStep(0); setFile(null); }}>
        <Text style={s.resetBtnText}>Submit Another</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={s.header}>
        <Text style={s.title}>New Project</Text>
        <View style={s.progressRow}>
          {STEPS.map((l, i) => (
            <View key={l} style={s.stepItem}>
              <View style={[s.stepNum, i <= step && s.stepNumActive]}>
                {i < step ? <Ionicons name="checkmark" size={12} color="#fff" /> : <Text style={[s.sText, i === step && { color: '#fff' }]}>{i + 1}</Text>}
              </View>
              {i < STEPS.length - 1 && <View style={[s.line, i < step && s.lineActive]} />}
            </View>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28 }}>
        {step === 0 && (
          <View>
            <TouchableOpacity style={[s.uploader, file && s.uploaderOn]} onPress={pickFile} activeOpacity={0.8}>
              <View style={[s.upIcon, { backgroundColor: file ? '#f0fdf4' : '#f8fafc' }]}>
                <Ionicons name={file ? 'document' : 'add'} size={32} color={file ? '#10b981' : '#6366f1'} />
              </View>
              <Text style={s.upTitle}>{file ? file.name : 'Choose Blueprint'}</Text>
              <Text style={s.upSub}>{file ? `${(file.size/1024).toFixed(0)} KB` : 'STL, STEP or high-res images'}</Text>
            </TouchableOpacity>

            <Text style={s.label}>MATERIAL SELECTION</Text>
            <View style={s.matList}>
              {STL_MATERIALS.map(m => (
                <TouchableOpacity key={m.id} style={[s.matItem, material === m.id && s.matItemOn]} onPress={() => setMat(m.id)}>
                  <Text style={s.matIcon}>{m.emoji}</Text>
                  <Text style={[s.matName, material === m.id && { color: '#fff' }]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>QUANTITY</Text>
            <View style={s.qtySection}>
              <TouchableOpacity style={s.ctrl} onPress={() => setQty(Math.max(1, quantity-1))}><Ionicons name="remove" size={24} color="#0f172a" /></TouchableOpacity>
              <Text style={s.qtyValText}>{quantity}</Text>
              <TouchableOpacity style={s.ctrl} onPress={() => setQty(quantity+1)}><Ionicons name="add" size={24} color="#0f172a" /></TouchableOpacity>
            </View>
          </View>
        )}

        {step === 1 && (
          <View>
            {[
              { key: 'name',    label: 'IDENTITY NAME', icon: 'person-outline' },
              { key: 'phone',   label: 'CONTACT NUMBER', icon: 'call-outline' },
              { key: 'address', label: 'SHIPPING DESTINATION', icon: 'location-outline', multi: true },
            ].map(f => (
              <View key={f.key} style={s.field}>
                <Text style={s.label}>{f.label}</Text>
                <View style={[s.fieldInput, f.multi && { height: 120, alignItems: 'flex-start' }]}>
                  <Ionicons name={f.icon} size={20} color="#94a3b8" style={{ marginTop: f.multi ? 18 : 0, marginLeft: 18 }} />
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
            <View style={s.summaryBox}>
              <Text style={s.sumHeader}>Summary</Text>
              <SumRow l="Selected File" v={file?.name} />
              <SumRow l="Material" v={material} />
              <SumRow l="Quantity" v={String(quantity)} />
              <View style={s.sumDivider} />
              <SumRow l="Recipient" v={form.name} />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={s.footer}>
        {step > 0 && (
          <TouchableOpacity style={s.prevBtn} onPress={() => setStep(s => s - 1)}>
            <Text style={s.prevBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[s.nextBtn, step === 2 && { backgroundColor: '#10b981' }]}
          onPress={step === 2 ? handleSubmit : () => setStep(s => s + 1)}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : (
            <>
              <Text style={s.nextBtnText}>{step === 2 ? 'Finalize' : 'Continue'}</Text>
              <Ionicons name={step === 2 ? 'checkmark' : 'chevron-forward'} size={18} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const SumRow = ({ l, v }) => (
  <View style={s.sumRow}><Text style={s.sumL}>{l}</Text><Text style={s.sumV}>{v}</Text></View>
);

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 28, paddingVertical: 24, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  title: { fontSize: 36, fontWeight: '900', color: '#0f172a', letterSpacing: -1.5, marginBottom: 24 },
  
  progressRow: { flexDirection: 'row', alignItems: 'center' },
  stepItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepNum: { width: 24, height: 24, borderRadius: 8, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  stepNumActive: { backgroundColor: '#0f172a' },
  sText: { fontSize: 10, fontWeight: '900', color: '#94a3b8' },
  line: { flex: 1, height: 2, backgroundColor: '#f1f5f9', marginHorizontal: 12 },
  lineActive: { backgroundColor: '#0f172a' },

  uploader: { borderWidth: 2, borderStyle: 'dashed', borderColor: '#e2e8f0', borderRadius: 32, padding: 40, alignItems: 'center', backgroundColor: '#f8fafc', marginBottom: 40 },
  uploaderOn: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
  upIcon: { padding: 18, borderRadius: 20, marginBottom: 16 },
  upTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  upSub: { fontSize: 13, color: '#94a3b8', marginTop: 4, fontWeight: '600' },

  label: { fontSize: 11, fontWeight: '900', color: '#cbd5e1', letterSpacing: 1.5, marginBottom: 14, textTransform: 'uppercase' },
  matList: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 40 },
  matItem: { width: '47%', backgroundColor: '#fff', borderRadius: 24, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  matItemOn: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  matIcon: { fontSize: 24, marginBottom: 6 },
  matName: { fontSize: 14, fontWeight: '800', color: '#0f172a' },

  qtySection: { flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 40 },
  ctrl: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  qtyValText: { fontSize: 40, fontWeight: '900', color: '#0f172a' },

  field: { marginBottom: 28 },
  fieldInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  input: { flex: 1, padding: 20, fontSize: 15, color: '#1e293b', fontWeight: '700' },

  summaryBox: { backgroundColor: '#f8fafc', borderRadius: 32, padding: 32, borderWidth: 1, borderColor: '#f1f5f9' },
  sumHeader: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 24 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  sumL: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  sumV: { fontSize: 14, color: '#0f172a', fontWeight: '800' },
  sumDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 20 },

  footer: { flexDirection: 'row', padding: 28, borderTopWidth: 1, borderColor: '#f1f5f9', gap: 16 },
  prevBtn: { paddingHorizontal: 24, justifyContent: 'center' },
  prevBtnText: { fontSize: 15, fontWeight: '800', color: '#94a3b8' },
  nextBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 24, height: 68, justifyContent: 'center', alignItems: 'center', shadowColor: '#0f172a', shadowOpacity: 0.2, shadowRadius: 15 },
  nextBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },

  successWrap: { flexGrow: 1, alignItems: 'center', padding: 48, paddingTop: 100 },
  successCircle: { width: 120, height: 120, backgroundColor: '#10b981', borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  successTitle: { fontSize: 36, fontWeight: '900', color: '#0f172a' },
  successSub: { fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 12, lineHeight: 26, fontWeight: '600' },
  finalCard: { width: '100%', backgroundColor: '#f8fafc', borderRadius: 32, padding: 32, marginTop: 48, borderWidth: 1, borderColor: '#f1f5f9' },
  fRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  fLabel: { fontSize: 11, fontWeight: '900', color: '#cbd5e1', letterSpacing: 1 },
  fVal: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  resetBtn: { backgroundColor: '#0f172a', paddingHorizontal: 40, paddingVertical: 22, borderRadius: 24, marginTop: 48 },
  resetBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
