import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';

/* ── Inline Helper: Field Component ──────────────────────── */
const Field = ({ label, icon, children }) => (
  <View style={s.fieldGroup}>
    <Text style={s.label}>{label}</Text>
    <View style={s.inputRow}>
      <Ionicons name={icon} size={18} color="#6366f1" style={s.fieldIcon} />
      {children}
    </View>
  </View>
);

export default function CostCalculatorScreen() {
  const [form, setForm] = useState({
    printTimeHours: '0',
    printTimeMinutes: '0',
    weightGrams: '100',
    material: 'PLA',
    supportStructures: false
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCalc = async () => {
    // Basic validation
    if (isNaN(form.printTimeHours) || isNaN(form.printTimeMinutes) || isNaN(form.weightGrams)) {
      return Alert.alert('Invalid Input', 'Please enter valid numbers for time and weight.');
    }

    setLoading(true);
    try {
      const { data } = await api.post('/stl-orders/calculate-cost', {
        printTimeHours: Number(form.printTimeHours),
        printTimeMinutes: Number(form.printTimeMinutes),
        weightGrams: Number(form.weightGrams),
        material: form.material,
        supportStructures: form.supportStructures,
      });
      setResult(data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ printTimeHours: '0', printTimeMinutes: '0', weightGrams: '100', material: 'PLA', supportStructures: false });
    setResult(null);
  };

  const ResultRow = ({ label, val, bold, color, info }) => (
    <View style={s.resultRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={s.resultLabel}>{label}</Text>
        {info && (
          <TouchableOpacity onPress={() => Alert.alert(label, info)}>
            <Ionicons name="information-circle-outline" size={14} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={[s.resultVal, bold && s.resultValBold, color && { color }]}>
        LKR {val?.toFixed(2)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f7ff" />
      <View style={s.header}>
        <Text style={s.title}>Cost Calculator</Text>
        <TouchableOpacity onPress={resetForm} style={s.resetBtn}>
          <Ionicons name="refresh-outline" size={16} color="#6366f1" />
          <Text style={s.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.container}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Input Section */}
        <View style={s.card}>
          <View style={s.timeRow}>
            <View style={{ flex: 1 }}>
              <Field label="Hours" icon="time-outline">
                <TextInput
                  style={s.input}
                  value={form.printTimeHours}
                  onChangeText={v => setForm(p => ({ ...p, printTimeHours: v }))}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Minutes" icon="timer-outline">
                <TextInput
                  style={s.input}
                  value={form.printTimeMinutes}
                  onChangeText={v => setForm(p => ({ ...p, printTimeMinutes: v }))}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </Field>
            </View>
          </View>

          <Field label="Weight (grams)" icon="scale-outline">
            <TextInput
              style={s.input}
              value={form.weightGrams}
              onChangeText={v => setForm(p => ({ ...p, weightGrams: v }))}
              keyboardType="numeric"
              placeholder="100"
            />
          </Field>

          <Text style={s.label}>Material Selection</Text>
          <View style={s.matRow}>
            {['PLA', 'PLA+', 'ABS', 'ABS+'].map(m => (
              <TouchableOpacity
                key={m}
                style={[s.matChip, form.material === m && s.matChipActive]}
                onPress={() => setForm(p => ({ ...p, material: m }))}
                activeOpacity={0.7}
              >
                <Text style={[s.matChipText, form.material === m && s.matChipTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={s.supportRow}
            onPress={() => setForm(p => ({ ...p, supportStructures: !p.supportStructures }))}
            activeOpacity={0.7}
          >
            <View style={[s.checkbox, form.supportStructures && s.checkboxActive]}>
              {form.supportStructures && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={s.supportLabel}>Include Support Structures (+LKR 100)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.calcBtn, loading && { opacity: 0.8 }]}
            onPress={handleCalc}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="calculator-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={s.calcBtnText}>Calculate Breakdown</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Result Section */}
        {result && (
          <View style={s.resultCard}>
            <View style={s.resultHeader}>
              <Ionicons name="receipt-outline" size={20} color="#1e1b4b" />
              <Text style={s.resultTitle}>Price Breakdown</Text>
            </View>
            
            <View style={s.breakdownBox}>
              <ResultRow label="Material Cost" val={result.materialCost} info="Based on weight and material rate (e.g. PLA is LKR 5/g)." />
              <ResultRow label="Machine usage" val={result.machineCost} info="Depreciation and maintenance cost of the 3D printer per hour (LKR 50/hr)." />
              <ResultRow label="Energy consumption" val={result.energyCost} info="Electricity used by the printer and cooling systems (LKR 30/hr)." />
              <ResultRow label="Labour & Handling" val={result.laborCost} info="Flat fee for setup, slicing, and manual handling." />
              <ResultRow label="Support Material" val={result.supportCost} info="Additional cost if support structures are required for complex geometries." />
              
              <View style={s.divider} />
              
              <ResultRow label="Total Net Cost" val={result.totalCost} bold color="#1e1b4b" info="Total internal cost to produce the print." />
            </View>

            <View style={s.sellingBox}>
              <View>
                <Text style={s.sellingLabel}>Recommended Selling Price</Text>
                <Text style={s.sellingSub}>Includes 50% profit margin</Text>
              </View>
              <Text style={s.sellingVal}>LKR {result.sellingPrice?.toFixed(2)}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f7ff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: '900', color: '#1e1b4b', letterSpacing: -0.5 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#c7d2fe' },
  resetText: { color: '#4f46e5', fontSize: 13, fontWeight: '800' },
  container: { flex: 1 },
  
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 5, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  timeRow: { flexDirection: 'row', gap: 15 },
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '800', color: '#4b5563', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f7ff', borderRadius: 14, borderWidth: 1.5, borderColor: '#e5e7eb', overflow: 'hidden' },
  fieldIcon: { paddingHorizontal: 12 },
  input: { flex: 1, height: 50, fontSize: 16, color: '#1e1b4b', fontWeight: '600' },
  
  matRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  matChip: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  matChipActive: { backgroundColor: '#eef2ff', borderColor: '#6366f1' },
  matChipText: { fontSize: 14, fontWeight: '700', color: '#6b7280' },
  matChipTextActive: { color: '#6366f1' },
  
  supportRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 10, backgroundColor: '#f8f7ff', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#6366f1', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  checkboxActive: { backgroundColor: '#6366f1' },
  supportLabel: { fontSize: 14, color: '#1e1b4b', fontWeight: '700' },
  
  calcBtn: { flexDirection: 'row', backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  calcBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  
  resultCard: { marginTop: 20, backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, elevation: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 20, backgroundColor: '#f8f7ff', borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  resultTitle: { fontSize: 18, fontWeight: '900', color: '#1e1b4b' },
  breakdownBox: { padding: 20 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  resultLabel: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  resultVal: { fontSize: 15, color: '#374151', fontWeight: '700' },
  resultValBold: { fontSize: 17, fontWeight: '900' },
  divider: { height: 1, backgroundColor: '#f1f1f1', marginVertical: 12 },
  
  sellingBox: { backgroundColor: '#1e1b4b', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sellingLabel: { fontSize: 14, color: '#a5b4fc', fontWeight: '800' },
  sellingSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  sellingVal: { fontSize: 22, color: '#fff', fontWeight: '900' },
});
