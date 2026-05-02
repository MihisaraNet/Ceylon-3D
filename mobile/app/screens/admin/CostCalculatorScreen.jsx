/**
 * CostCalculatorScreen.jsx — High-End Algorithm Estimator
 * 
 * Attractive, modern design for cost estimation 
 * with premium input groups and clean breakdown layouts.
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
    } catch { Alert.alert('Error', 'Calculation protocol failed.'); }
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
        <Text style={s.title}>Estimator</Text>
        <TouchableOpacity style={s.resetBtn} onPress={() => setResult(null)}>
          <Ionicons name="trash-outline" size={20} color="#f43f5e" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={s.card}>
          {[
            { key:'printTimeHours',   label:'HOURS',   icon:'time-outline' },
            { key:'printTimeMinutes', label:'MINUTES', icon:'timer-outline' },
            { key:'weightGrams',      label:'WEIGHT (G)', icon:'scale-outline' },
          ].map(f => (
            <View key={f.key} style={s.field}>
              <Text style={s.label}>{f.label}</Text>
              <View style={s.fieldInput}>
                <Ionicons name={f.icon} size={20} color="#94a3b8" style={{ marginLeft: 18 }} />
                <TextInput style={s.input} value={form[f.key]} onChangeText={v => setForm(p => ({...p,[f.key]:v}))} keyboardType="numeric" />
              </View>
            </View>
          ))}

          <Text style={s.label}>MATERIAL SELECTION</Text>
          <View style={s.matRow}>
            {['PLA','PLA+','ABS','ABS+'].map(m => (
              <TouchableOpacity key={m} style={[s.matChip, form.material===m && s.matChipOn]} onPress={() => setForm(p => ({...p,material:m}))}>
                <Text style={[s.matChipText, form.material===m && { color:'#fff' }]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={s.toggleRow} onPress={() => setForm(p => ({...p, supportStructures:!p.supportStructures}))}>
            <View style={[s.checkbox, form.supportStructures && s.checkboxOn]}>
              {form.supportStructures && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={s.toggleLabel}>Support Structures (+LKR 100)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.calcBtn} onPress={handleCalc} disabled={loading} activeOpacity={0.9}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={s.calcBtnText}>Generate Estimate</Text>
                <Ionicons name="flash" size={18} color="#fff" style={{ marginLeft: 10 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {result && (
          <View style={s.resCard}>
            <Text style={s.resHeader}>Breakdown</Text>
            <Row label="Material Allocation"  val={result.materialCost} />
            <Row label="Machine Runtime"      val={result.machineCost} />
            <Row label="Energy Consumption"   val={result.energyCost} />
            <Row label="Technical Labour"     val={result.laborCost} />
            <Row label="Support Material"     val={result.supportCost} />
            <View style={s.divider} />
            <Row label="Manufacturing Cost"    val={result.totalCost} bold />
            <View style={s.quoteBox}>
              <Text style={s.quoteLabel}>SUGGESTED QUOTE</Text>
              <Text style={s.quoteVal}>LKR {result.sellingPrice?.toFixed(2)}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 28, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  title: { fontSize: 32, fontWeight: '900', color: '#0f172a', letterSpacing: -1.5 },
  resetBtn: { backgroundColor: '#fef2f2', padding: 12, borderRadius: 16 },

  card: { backgroundColor: '#fff', borderRadius: 32, padding: 28, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10 },
  field: { marginBottom: 20 },
  label: { fontSize: 10, fontWeight: '900', color: '#cbd5e1', letterSpacing: 1.5, marginBottom: 12 },
  fieldInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  input: { flex: 1, padding: 18, fontSize: 15, color: '#0f172a', fontWeight: '700' },
  
  matRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  matChip: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  matChipOn: { backgroundColor: '#6366f1' },
  matChipText: { fontSize: 11, fontWeight: '900', color: '#94a3b8' },
  
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 14 },
  checkbox: { width: 28, height: 28, borderRadius: 10, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  checkboxOn: { backgroundColor: '#10b981', borderColor: '#10b981' },
  toggleLabel: { fontSize: 14, color: '#475569', fontWeight: '800' },
  
  calcBtn: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 24, height: 68, justifyContent: 'center', alignItems: 'center', shadowColor: '#0f172a', shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 },
  calcBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  resCard: { backgroundColor: '#fff', borderRadius: 32, padding: 28, marginTop: 32, borderWidth: 1, borderColor: '#f1f5f9' },
  resHeader: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 20 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  resultLabel: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
  resultVal: { fontSize: 13, color: '#0f172a', fontWeight: '800' },
  resultValBold: { color: '#0f172a', fontWeight: '900', fontSize: 16 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 16 },
  quoteBox: { backgroundColor: '#f8fafc', borderRadius: 24, padding: 24, marginTop: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  quoteLabel: { fontSize: 9, fontWeight: '900', color: '#cbd5e1', letterSpacing: 1.5, marginBottom: 4 },
  quoteVal: { fontSize: 28, color: '#10b981', fontWeight: '900' },
});
