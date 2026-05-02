/**
 * STLUploadScreen.jsx — 3D Print Order Upload Wizard
 * Minimalist design version.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { STL_MATERIALS } from '../../data/categories';

const STEPS = ['Upload File', 'Your Details', 'Review'];

export default function STLUploadScreen() {
  const { user } = useAuth();
  const [step, setStep]     = useState(0);
  const [file, setFile]     = useState(null);
  const [material, setMat]  = useState('PLA');
  const [quantity, setQty]  = useState(1);
  const [notes, setNotes]   = useState('');
  const [form, setForm]     = useState({
    name: user?.fullName || '', email: user?.email || '', phone: '', address: '', email2: ''
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
      return Alert.alert('Invalid file', 'Only .stl, .pdf, .jpg, .jpeg are accepted');
    }
    setFile(asset);
  };

  const validateStep1 = () => {
    if (!file) {
      Alert.alert('Required', 'Please select a file');
      return false;
    }
    return true;
  };
  
  const validateStep2 = () => {
    if (!form.name || !form.email || !form.phone || !form.address) {
      Alert.alert('Required', 'Please fill all required fields');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      Alert.alert('Invalid', 'Invalid email');
      return false;
    }
    if (!/^\+?[0-9\s()\-]{7,20}$/.test(form.phone)) {
      Alert.alert('Invalid', 'Invalid phone number');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step===0 && !validateStep1()) return;
    if (step===1 && !validateStep2()) return;
    setStep(s => s+1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('file', { uri: file.uri, name: file.name, type: file.mimeType || 'application/octet-stream' });
      fd.append('name', form.name);
      fd.append('email', form.email);
      if (form.email2) fd.append('email2', form.email2);
      fd.append('phone', form.phone);
      fd.append('address', form.address);
      fd.append('material', material);
      fd.append('quantity', String(quantity));
      fd.append('message', notes);
      
      const { data } = await api.post('/api/uploads/stl', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(data);
    } catch (err) {
      Alert.alert('Submit Failed', err.response?.data?.error || 'Submission failed. Please try again.');
    } finally { 
      setSubmitting(false); 
    }
  };

  if (result) return (
    <ScrollView contentContainerStyle={s.successContainer}>
      <Ionicons name="checkmark-circle-outline" size={80} color="#000" />
      <Text style={s.successTitle}>Order Submitted!</Text>
      <Text style={s.successSub}>Our team will review your file and send you a quote.</Text>
      <View style={s.resultCard}>
        <Row label="Order ID" value={`#${result.stlOrderId?.slice(-6).toUpperCase()}`} />
        <Row label="File"     value={result.fileName?.replace(/^[0-9a-f-]+-/i,'')} />
        <Row label="Material" value={result.material} />
        <Row label="Quantity" value={String(result.quantity)} />
        <Row label="Est. Price" value={`LKR ${result.estimatedPrice?.toFixed(2)}`} />
        <Row label="Status"   value="Pending Quote" />
      </View>
      <TouchableOpacity style={s.resetBtn} onPress={() => { setResult(null); setStep(0); setFile(null); setNotes(''); setQty(1); }}>
        <Text style={s.resetBtnText}>Submit Another Order</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={s.container}>
      <View style={s.stepper}>
        {STEPS.map((label, i) => (
          <View key={i} style={s.stepItem}>
            <View style={[s.stepDot, i<=step && s.stepActive]}>
              {i<step ? <Ionicons name="checkmark" size={14} color="#fff" /> : <Text style={[s.stepNum, i===step && { color:'#fff' }]}>{i+1}</Text>}
            </View>
            <Text style={[s.stepLabel, i===step && s.stepLabelActive]}>{label}</Text>
            {i<STEPS.length-1 && <View style={[s.stepLine, i<step && s.stepLineDone]} />}
          </View>
        ))}
      </View>

      <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20 }}>
        {step===0 && (
          <View>
            <TouchableOpacity style={[s.dropzone, file && s.dropzoneDone]} onPress={pickFile}>
              <Ionicons name={file ? 'document-text-outline' : 'cloud-upload-outline'} size={48} color={file?'#000':'#ccc'} />
              <Text style={[s.dropzoneText, file && { color:'#000' }]}>
                {file ? file.name : 'Tap to select file\n(.stl, .pdf, .jpg, .jpeg)'}
              </Text>
              {file && <Text style={s.fileSize}>{(file.size/1024).toFixed(1)} KB</Text>}
            </TouchableOpacity>

            <Text style={s.fieldLabel}>Material</Text>
            <View style={s.materialGrid}>
              {STL_MATERIALS.map(m => (
                <TouchableOpacity key={m.id} style={[s.matBtn, material===m.id && s.matBtnActive]} onPress={() => setMat(m.id)}>
                  <Text style={s.matEmoji}>{m.emoji}</Text>
                  <Text style={[s.matLabel, material===m.id && s.matLabelActive]}>{m.label}</Text>
                  <Text style={s.matDesc}>{m.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.fieldLabel}>Quantity</Text>
            <View style={s.qtyRow}>
              <TouchableOpacity style={s.qtyBtn} onPress={() => setQty(q => Math.max(1, q-1))}><Ionicons name="remove" size={20} color="#000" /></TouchableOpacity>
              <Text style={s.qtyVal}>{quantity}</Text>
              <TouchableOpacity style={s.qtyBtn} onPress={() => setQty(q => q+1)}><Ionicons name="add" size={20} color="#000" /></TouchableOpacity>
            </View>

            <Text style={s.fieldLabel}>Special Instructions (optional)</Text>
            <TextInput style={s.textarea} value={notes} onChangeText={setNotes} placeholder="Any special notes..." multiline numberOfLines={3} placeholderTextColor="#999" />
          </View>
        )}

        {step===1 && (
          <View>
            {[
              { key:'name',   label:'Full Name *',          icon:'person-outline',   keyboard:'default' },
              { key:'email',  label:'Email *',              icon:'mail-outline',     keyboard:'email-address', disabled: !!user },
              { key:'phone',  label:'Phone * (+94 7X XXX)', icon:'call-outline',     keyboard:'phone-pad' },
              { key:'email2', label:'Alternative Email',    icon:'mail-open-outline',keyboard:'email-address' },
            ].map(f => (
              <View key={f.key} style={s.fieldGroup}>
                <Text style={s.fieldLabel}>{f.label}</Text>
                <View style={s.inputRow}>
                  <Ionicons name={f.icon} size={18} color="#999" style={s.inputIcon} />
                  <TextInput
                    style={[s.inputField, f.disabled && s.inputDisabled]}
                    value={form[f.key]}
                    onChangeText={v => setForm(p => ({...p,[f.key]:v}))}
                    keyboardType={f.keyboard}
                    autoCapitalize="none"
                    editable={!f.disabled}
                    placeholderTextColor="#999"
                    placeholder={f.label}
                  />
                </View>
              </View>
            ))}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Delivery Address *</Text>
              <View style={s.inputRow}>
                <Ionicons name="map-outline" size={18} color="#999" style={s.inputIcon} />
                <TextInput style={[s.inputField, { height:80 }]} value={form.address} onChangeText={v => setForm(p => ({...p,address:v}))} multiline numberOfLines={3} placeholder="Full delivery address" placeholderTextColor="#999" />
              </View>
            </View>
          </View>
        )}

        {step===2 && (
          <View>
            <Panel title="Design File">
              <Row label="File"     value={file?.name?.replace(/^[0-9a-f-]+-/i,'') || '-'} />
              <Row label="Size"     value={file ? `${(file.size/1024).toFixed(1)} KB` : '-'} />
            </Panel>
            <Panel title="Print Details">
              <Row label="Material" value={material} />
              <Row label="Quantity" value={String(quantity)} />
              {notes && <Row label="Notes" value={notes} />}
            </Panel>
            <Panel title="Contact Info">
              <Row label="Name"    value={form.name} />
              <Row label="Email"   value={form.email} />
              {form.email2 && <Row label="Alt Email" value={form.email2} />}
              <Row label="Phone"   value={form.phone} />
              <Row label="Address" value={form.address} />
            </Panel>
            <View style={s.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color="#000" />
              <Text style={s.infoBoxText}> Our team will review your file and send you an accurate quote before any printing begins.</Text>
            </View>
            <View style={s.trustBadges}>
              {['No upfront payment','Quote before printing','Secure file upload'].map(t => (
                <View key={t} style={s.trustBadge}><Ionicons name="checkmark-outline" size={14} color="#000" /><Text style={s.trustText}> {t}</Text></View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={s.footer}>
        {step>0 && (
          <TouchableOpacity style={s.backBtn} onPress={() => setStep(s => s-1)}>
            <Ionicons name="arrow-back" size={18} color="#000" />
            <Text style={s.backBtnText}> Back</Text>
          </TouchableOpacity>
        )}
        {step<2 ? (
          <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
            <Text style={s.nextBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={s.nextBtnText}> Submit Order</Text>
            </>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const Panel = ({ title, children }) => (
  <View style={s.panel}>
    <Text style={s.panelTitle}>{title}</Text>
    {children}
  </View>
);

const Row = ({ label, value }) => (
  <View style={s.reviewRow}>
    <Text style={s.reviewLabel}>{label}</Text>
    <Text style={s.reviewVal}>{value}</Text>
  </View>
);

const s = StyleSheet.create({
  container:       { flex:1, backgroundColor:'#ffffff' },
  stepper:         { flexDirection:'row', alignItems:'center', backgroundColor:'#fff', padding:16, paddingBottom:12, borderBottomWidth: 1, borderColor: '#eee' },
  stepItem:        { flex:1, alignItems:'center', position:'relative' },
  stepDot:         { width:28, height:28, borderRadius:14, backgroundColor:'#f5f5f5', justifyContent:'center', alignItems:'center', marginBottom:4, borderWidth: 1, borderColor: '#ddd' },
  stepActive:      { backgroundColor:'#000', borderColor: '#000' },
  stepNum:         { fontSize:12, fontWeight:'700', color:'#666' },
  stepLabel:       { fontSize:10, color:'#999', textAlign:'center', textTransform: 'uppercase', fontWeight: '700' },
  stepLabelActive: { color:'#000' },
  stepLine:        { position:'absolute', top:14, right:'-50%', width:'100%', height:1, backgroundColor:'#eee', zIndex:-1 },
  stepLineDone:    { backgroundColor:'#000' },
  dropzone:        { borderWidth:1, borderStyle:'dashed', borderColor:'#ccc', borderRadius:8, padding:32, alignItems:'center', marginBottom:20, backgroundColor: '#fafafa' },
  dropzoneDone:    { borderColor:'#000', backgroundColor: '#fff' },
  dropzoneText:    { fontSize:15, color:'#666', textAlign:'center', marginTop:10 },
  fileSize:        { fontSize:12, color:'#999', marginTop:6 },
  fieldLabel:      { fontSize:12, fontWeight:'700', color:'#666', marginBottom:8, marginTop:4, textTransform: 'uppercase' },
  materialGrid:    { flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:16 },
  matBtn:          { flex:1, minWidth:'45%', backgroundColor:'#fff', borderWidth:1, borderColor:'#eee', borderRadius:8, padding:12, alignItems:'center' },
  matBtnActive:    { borderColor:'#000', backgroundColor:'#000' },
  matEmoji:        { fontSize:24, marginBottom:4 },
  matLabel:        { fontSize:14, fontWeight:'700', color:'#333' },
  matLabelActive:  { color:'#fff' },
  matDesc:         { fontSize:11, color:'#999', textAlign:'center', marginTop:2 },
  qtyRow:          { flexDirection:'row', alignItems:'center', marginBottom:16, gap:12 },
  qtyBtn:          { backgroundColor:'#fff', borderWidth: 1, borderColor: '#ccc', borderRadius:8, padding:10 },
  qtyVal:          { fontSize:22, fontWeight:'800', color:'#000', minWidth:40, textAlign:'center' },
  textarea:        { backgroundColor:'#fff', borderWidth:1, borderColor:'#eee', borderRadius:8, padding:12, fontSize:14, color:'#000', height:80 },
  fieldGroup:      { marginBottom:12 },
  inputRow:        { flexDirection:'row', alignItems:'flex-start', backgroundColor:'#fff', borderWidth:1, borderColor:'#eee', borderRadius:8 },
  inputIcon:       { padding:13 },
  inputField:      { flex:1, padding:12, fontSize:14, color:'#000' },
  inputDisabled:   { color:'#999', backgroundColor: '#fafafa' },
  panel:           { backgroundColor:'#fff', borderRadius:8, padding:16, marginBottom:12, borderWidth: 1, borderColor: '#eee' },
  panelTitle:      { fontSize:13, fontWeight:'700', color:'#666', marginBottom:10, textTransform: 'uppercase' },
  reviewRow:       { flexDirection:'row', justifyContent:'space-between', marginBottom:6 },
  reviewLabel:     { fontSize:13, color:'#666', flex:1 },
  reviewVal:       { fontSize:13, color:'#000', fontWeight:'600', flex:2, textAlign:'right' },
  infoBox:         { flexDirection:'row', alignItems:'flex-start', backgroundColor:'#fafafa', borderRadius:8, padding:14, marginBottom:12, borderWidth: 1, borderColor: '#eee' },
  infoBoxText:     { fontSize:13, color:'#000', flex:1, lineHeight:20 },
  trustBadges:     { gap:6, marginBottom:8 },
  trustBadge:      { flexDirection:'row', alignItems:'center' },
  trustText:       { fontSize:13, color:'#333' },
  footer:          { flexDirection:'row', justifyContent:'space-between', padding:16, backgroundColor:'#fff', borderTopWidth:1, borderTopColor:'#eee' },
  backBtn:         { flexDirection:'row', alignItems:'center', padding:14, borderRadius:8, borderWidth:1, borderColor:'#000' },
  backBtnText:     { color:'#000', fontWeight:'700', fontSize:15 },
  nextBtn:         { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor:'#000', borderRadius:8, padding:14, marginLeft:12, gap:6 },
  submitBtn:       { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor:'#000', borderRadius:8, padding:14, marginLeft:12, gap:6 },
  nextBtnText:     { color:'#fff', fontWeight:'700', fontSize:15 },
  successContainer:{ flexGrow:1, alignItems:'center', padding:24, paddingTop:40, backgroundColor: '#ffffff' },
  successTitle:    { fontSize:28, fontWeight:'900', color:'#000', marginTop:16 },
  successSub:      { fontSize:15, color:'#666', textAlign:'center', marginTop:8, marginBottom:20 },
  resultCard:      { width:'100%', backgroundColor:'#fff', borderRadius:8, padding:16, borderWidth:1, borderColor:'#eee', marginBottom:20 },
  resetBtn:        { backgroundColor:'#000', borderRadius:8, paddingHorizontal:24, paddingVertical:14 },
  resetBtnText:    { color:'#fff', fontWeight:'700', fontSize:15 },
});
