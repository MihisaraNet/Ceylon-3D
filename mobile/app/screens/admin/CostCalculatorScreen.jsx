/**
 * CostCalculatorScreen.jsx — Admin 3D Printing Cost Calculator
 *
 * Modern, colorful and simple design.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';

export default function CostCalculatorScreen() {
  const [form, setForm] = useState({ printTimeHours:'0', printTimeMinutes:'0', weightGrams:'100', material:'PLA', supportStructures:false });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCalc = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/stl-orders/calculate-cost', {
        printTimeHours:   Number(form.printTimeHours),
        printTimeMinutes: Number(form.printTimeMinutes),
        weightGrams:      Number(form.weightGrams),
        material:         form.material,
        supportStructures:form.supportStructures,
      });
      setResult(data);
    } catch { Alert.alert('Error', 'Calculation failed'); }
    finally { setLoading(false); }
  };

  const Row = ({ label, val, bold }) => (
    <View style={s.resultRow}>
      <Text style={s.resultLabel}>{label}</Text>
      <Text style={[s.resultVal, bold && s.resultValBold]}>LKR {val?.toFixed(2)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={s.header}>
        <Text style={s.headerTitle}>Estimator</Text>
        <TouchableOpacity style={s.resetBtn} onPress={() => setResult(null)}>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        <View style={s.card}>
          {[
            { key:'printTimeHours',   label:'HOURS',   icon:'time-outline' },
            { key:'printTimeMinutes', label:'MINUTES', icon:'timer-outline' },
            { key:'weightGrams',      label:'WEIGHT (G)', icon:'scale-outline' },
          ].map(f => (
            <View key={f.key} style={s.inputGroup}>
              <Text style={s.inputLabel}>{f.label}</Text>
              <View style={s.inputWrap}>
                <Ionicons name={f.icon} size={20} color="#94a3b8" style={{ marginLeft: 16 }} />
                <TextInput style={s.input} value={form[f.key]} onChangeText={v => setForm(p => ({...p,[f.key]:v}))} keyboardType="numeric" />
              </View>
            </View>
          ))}

          <Text style={s.inputLabel}>MATERIAL</Text>
          <View style={s.matRow}>
            {['PLA','PLA+','ABS','ABS+'].map(m => (
              <TouchableOpacity key={m} style={[s.matChip, form.material===m && s.matChipActive]} onPress={() => setForm(p => ({...p,material:m}))}>
                <Text style={[s.matChipText, form.material===m && { color:'#fff' }]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={s.supportRow} onPress={() => setForm(p => ({...p, supportStructures:!p.supportStructures}))}>
            <View style={[s.checkbox, form.supportStructures && s.checkboxActive]}>
              {form.supportStructures && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={s.supportLabel}>Include Support Structures (+LKR 100)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.calcBtn} onPress={handleCalc} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={s.calcBtnText}>Calculate Cost</Text>
                <Ionicons name="calculator" size={20} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {result && (
          <View style={s.resultCard}>
            <Text style={s.resultTitle}>Breakdown</Text>
            <Row label="Material Cost"  val={result.materialCost} />
            <Row label="Machine Cost"   val={result.machineCost} />
            <Row label="Energy Cost"    val={result.energyCost} />
            <Row label="Labour Cost"    val={result.laborCost} />
            <Row label="Support Cost"   val={result.supportCost} />
            <View style={s.divider} />
            <Row label="Total Cost"     val={result.totalCost} bold />
            <View style={s.sellingBox}>
              <Text style={s.sellingLabel}>RECOMMENDED SELLING PRICE</Text>
              <Text style={s.sellingVal}>LKR {result.sellingPrice?.toFixed(2)}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#f8fafc' },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  headerTitle:    { fontSize: 28, fontWeight: '900', color: '#1e293b' },
  resetBtn:       { backgroundColor: '#fef2f2', padding: 10, borderRadius: 12 },

  card:           { backgroundColor: '#fff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10 },
  inputGroup:     { marginBottom: 16 },
  inputLabel:     { fontSize: 11, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  inputWrap:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  input:          { flex: 1, padding: 16, fontSize: 15, color: '#1e293b', fontWeight: '600' },
  
  matRow:         { flexDirection: 'row', gap: 8, marginBottom: 20 },
  matChip:        { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  matChipActive:  { backgroundColor: '#6366f1' },
  matChipText:    { fontSize: 12, fontWeight: '800', color: '#64748b' },
  
  supportRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
  checkbox:       { width: 24, height: 24, borderRadius: 8, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  checkboxActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  supportLabel:   { fontSize: 14, color: '#475569', fontWeight: '700' },
  
  calcBtn:        { flexDirection: 'row', backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: 18, justifyContent: 'center', alignItems: 'center', shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  calcBtnText:    { color: '#fff', fontSize: 16, fontWeight: '800' },

  resultCard:     { backgroundColor: '#f5f3ff', borderRadius: 24, padding: 24, marginTop: 24, borderWidth: 1, borderColor: '#e0e7ff' },
  resultTitle:    { fontSize: 18, fontWeight: '900', color: '#6366f1', marginBottom: 16 },
  resultRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  resultLabel:    { fontSize: 13, color: '#64748b', fontWeight: '600' },
  resultVal:      { fontSize: 13, color: '#1e293b', fontWeight: '800' },
  resultValBold:  { color: '#1e293b', fontWeight: '900', fontSize: 15 },
  divider:        { height: 1, backgroundColor: '#e0e7ff', marginVertical: 12 },
  sellingBox:     { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginTop: 12, borderWidth: 1, borderColor: '#e0e7ff' },
  sellingLabel:   { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, marginBottom: 4 },
  sellingVal:     { fontSize: 24, color: '#10b981', fontWeight: '900' },
});
