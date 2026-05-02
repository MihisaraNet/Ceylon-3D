/**
 * CostCalculatorScreen.jsx — Admin 3D Printing Cost Calculator
 *
 * Allows admins to calculate detailed cost breakdowns for 3D print jobs.
 *
 * Input fields:
 *   - Print Time (Hours + Minutes)
 *   - Weight in grams
 *   - Material selection (PLA, PLA+, ABS, ABS+)
 *   - Support structures toggle (+LKR 100)
 *
 * Output (cost breakdown card):
 *   - Material Cost, Machine Cost, Energy Cost, Labour Cost, Support Cost
 *   - Total Cost
 *   - Selling Price (Total × 1.5 markup)
 *
 * Calls POST /stl-orders/calculate-cost on the backend.
 *
 * @module screens/admin/CostCalculatorScreen
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import api from '../../lib/api';

export default function CostCalculatorScreen() {
  const [form, setForm] = useState({ printTimeHours:'0', printTimeMinutes:'0', weightGrams:'100', material:'PLA', supportStructures:false });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  // Holds the optional STL file the admin uploads for auto weight estimation
  const [stlFile, setStlFile] = useState(null);

  // Pick optional STL file and prefill estimated weight.
  const pickStlFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (!asset) return;
    const ext = asset.name.split('.').pop().toLowerCase();
    if (!['stl', 'pdf', 'jpg', 'jpeg'].includes(ext))
      return Alert.alert('Invalid file', 'Only .stl, .pdf, .jpg, .jpeg are accepted');
    // Auto-fill weight from file size when available: ~1g per 15KB (heuristic)
    if (typeof asset.size === 'number' && asset.size > 0) {
      const estimatedWeight = Math.max(5, Math.round((asset.size / 1024) / 15));
      setForm(p => ({ ...p, weightGrams: String(estimatedWeight) }));
    }
    setStlFile(asset);
  };

  // Submit calculator inputs and render returned cost breakdown.
  const handleCalc = async () => {
    setLoading(true);
    try {
      let data;
      if (stlFile) {
        // Send as multipart/form-data so the backend can also use file size for estimation
        const fd = new FormData();
        fd.append('file', { uri: stlFile.uri, name: stlFile.name, type: stlFile.mimeType || 'application/octet-stream' });
        fd.append('printTimeHours',   form.printTimeHours);
        fd.append('printTimeMinutes', form.printTimeMinutes);
        fd.append('weightGrams',      form.weightGrams);
        fd.append('material',         form.material);
        fd.append('supportStructures',String(form.supportStructures));
        const res = await api.post('/stl-orders/calculate-cost', fd,
          { headers: { 'Content-Type': 'multipart/form-data' } });
        data = res.data;
      } else {
        // Send as regular JSON when no file is attached
        const res = await api.post('/stl-orders/calculate-cost', {
          printTimeHours:   Number(form.printTimeHours),
          printTimeMinutes: Number(form.printTimeMinutes),
          weightGrams:      Number(form.weightGrams),
          material:         form.material,
          supportStructures:form.supportStructures,
        });
        data = res.data;
      }
      // Save the resulting breakdown (energy, labor, material, etc.) to display on screen
      setResult(data);
    } catch (err) { 
      Alert.alert('Error', err.response?.data?.error || 'Calculation failed'); 
    } finally { 
      setLoading(false); 
    }
  };

  const Row = ({ label, val, bold }) => (
    <View style={s.resultRow}>
      <Text style={s.resultLabel}>{label}</Text>
      <Text style={[s.resultVal, bold && s.resultValBold]}>LKR {val?.toFixed(2)}</Text>
    </View>
  );

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding:20 }}>
      <Text style={s.title}>Cost Calculator</Text>

      {/* ── Optional STL File Upload ── */}
      <TouchableOpacity style={[s.uploadBtn, stlFile && s.uploadBtnDone]} onPress={pickStlFile}>
        <Ionicons name={stlFile ? 'document-text' : 'cloud-upload-outline'} size={20}
          color={stlFile ? '#22c55e' : '#6366f1'} />
        <Text style={[s.uploadBtnText, stlFile && { color:'#22c55e' }]}>
          {stlFile
            ? `📎 ${stlFile.name.replace(/^[0-9a-f-]+-/i, '')}${typeof stlFile.size === 'number' ? ` · ${(stlFile.size/1024).toFixed(1)} KB` : ''}`
            : 'Upload STL File (auto-fills weight)'}
        </Text>
      </TouchableOpacity>
      {stlFile && (
        <TouchableOpacity onPress={() => { setStlFile(null); }} style={s.clearFile}>
          <Ionicons name="close-circle" size={14} color="#9ca3af" />
          <Text style={s.clearFileText}>Remove file</Text>
        </TouchableOpacity>
      )}

      {[
        { key:'printTimeHours',   label:'Print Time (Hours)',   keyboard:'numeric' },
        { key:'printTimeMinutes', label:'Print Time (Minutes)', keyboard:'numeric' },
        { key:'weightGrams',      label:'Weight (grams)',       keyboard:'numeric' },
      ].map(f => (
        <View key={f.key} style={s.fieldGroup}>
          <Text style={s.label}>{f.label}</Text>
          <TextInput style={s.input} value={form[f.key]} onChangeText={v => setForm(p => ({...p,[f.key]:v}))} keyboardType={f.keyboard} placeholderTextColor="#9ca3af" />
        </View>
      ))}

      <Text style={s.label}>Material</Text>
      <View style={s.matRow}>
        {['PLA','PLA+','ABS','ABS+'].map(m => (
          <TouchableOpacity key={m} style={[s.matChip, form.material===m && s.matChipActive]} onPress={() => setForm(p => ({...p,material:m}))}>
            <Text style={[s.matChipText, form.material===m && s.matChipTextActive]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.supportRow} onPress={() => setForm(p => ({...p, supportStructures:!p.supportStructures}))}>
        <Ionicons name={form.supportStructures ? 'checkbox' : 'square-outline'} size={22} color="#6366f1" />
        <Text style={s.supportLabel}> Support Structures (+LKR 100)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.calcBtn} onPress={handleCalc} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.calcBtnText}>Calculate Cost</Text>}
      </TouchableOpacity>

      {result && (
        <View style={s.resultCard}>
          <Text style={s.resultTitle}>Cost Breakdown</Text>
          <Row label="Material Cost"  val={result.materialCost} />
          <Row label="Machine Cost"   val={result.machineCost} />
          <Row label="Energy Cost"    val={result.energyCost} />
          <Row label="Labour Cost"    val={result.laborCost} />
          <Row label="Support Cost"   val={result.supportCost} />
          <View style={s.divider} />
          <Row label="Total Cost"     val={result.totalCost} bold />
          <View style={[s.sellingRow]}>
            <Text style={s.sellingLabel}>Selling Price (×1.5)</Text>
            <Text style={s.sellingVal}>LKR {result.sellingPrice?.toFixed(2)}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:      { flex:1, backgroundColor:'#f9fafb' },
  title:          { fontSize:22, fontWeight:'800', color:'#111827', marginBottom:16 },
  uploadBtn:      { flexDirection:'row', alignItems:'center', gap:10, borderWidth:2, borderStyle:'dashed', borderColor:'#6366f1', borderRadius:12, padding:14, backgroundColor:'#eef2ff', marginBottom:6 },
  uploadBtnDone:  { borderColor:'#22c55e', backgroundColor:'#f0fdf4' },
  uploadBtnText:  { fontSize:14, fontWeight:'700', color:'#6366f1', flex:1 },
  clearFile:      { flexDirection:'row', alignItems:'center', gap:4, marginBottom:14, paddingLeft:4 },
  clearFileText:  { fontSize:12, color:'#9ca3af' },
  fieldGroup:     { marginBottom:14 },
  label:          { fontSize:14, fontWeight:'700', color:'#374151', marginBottom:6 },
  input:          { backgroundColor:'#fff', borderWidth:1, borderColor:'#e5e7eb', borderRadius:12, padding:13, fontSize:15, color:'#111827' },
  matRow:         { flexDirection:'row', gap:10, marginBottom:16 },
  matChip:        { flex:1, backgroundColor:'#f3f4f6', borderRadius:10, padding:10, alignItems:'center', borderWidth:2, borderColor:'transparent' },
  matChipActive:  { backgroundColor:'#eef2ff', borderColor:'#6366f1' },
  matChipText:    { fontSize:14, fontWeight:'700', color:'#374151' },
  matChipTextActive:{ color:'#6366f1' },
  supportRow:     { flexDirection:'row', alignItems:'center', marginBottom:20 },
  supportLabel:   { fontSize:15, color:'#374151', fontWeight:'600' },
  calcBtn:        { backgroundColor:'#6366f1', borderRadius:12, padding:16, alignItems:'center', marginBottom:20 },
  calcBtnText:    { color:'#fff', fontSize:16, fontWeight:'700' },
  resultCard:     { backgroundColor:'#fff', borderRadius:16, padding:20, shadowColor:'#000', shadowOpacity:0.06, shadowRadius:8, elevation:3 },
  resultTitle:    { fontSize:18, fontWeight:'800', color:'#111827', marginBottom:16 },
  resultRow:      { flexDirection:'row', justifyContent:'space-between', marginBottom:8 },
  resultLabel:    { fontSize:14, color:'#6b7280' },
  resultVal:      { fontSize:14, color:'#374151', fontWeight:'600' },
  resultValBold:  { color:'#111827', fontWeight:'800' },
  divider:        { height:1, backgroundColor:'#e5e7eb', marginVertical:8 },
  sellingRow:     { flexDirection:'row', justifyContent:'space-between', backgroundColor:'#eef2ff', borderRadius:10, padding:12, marginTop:8 },
  sellingLabel:   { fontSize:15, color:'#6366f1', fontWeight:'700' },
  sellingVal:     { fontSize:18, color:'#6366f1', fontWeight:'900' },
});
