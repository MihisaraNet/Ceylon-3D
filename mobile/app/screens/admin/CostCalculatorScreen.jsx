import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';

/**
 * CostCalculatorScreen.jsx — Admin Tool for Price Estimation
 * 
 * This screen allows administrators to calculate a detailed cost breakdown
 * for a 3D print job based on physical parameters (time, weight, material).
 * It communicates with the backend /calculate-cost endpoint to get the math.
 */

/* ── Inline Helper: Field Component ──────────────────────── */
const Field = ({ label, icon, children, s, theme }) => (
  <View style={s.fieldGroup}>
    <Text style={s.label}>{label}</Text>
    <View style={s.inputRow}>
      <Ionicons name={icon} size={18} color={theme.primary} style={s.fieldIcon} />
      {children}
    </View>
  </View>
);

export default function CostCalculatorScreen() {
  const { theme, isDarkMode } = useTheme();
  const s = getStyles(theme);

  const [form, setForm] = useState({
    printTimeHours: '0',
    printTimeMinutes: '0',
    weightGrams: '100',
    material: 'PLA',
    supportStructures: false
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * handleCalc — Submits the form data to the backend to get a cost breakdown.
   * Performs basic validation before making the API request.
   */
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

  /**
   * ResultRow — Subcomponent to display a single line in the breakdown.
   * Includes an information icon that shows a descriptive tooltip on press.
   */
  const ResultRow = ({ label, val, bold, color, info }) => (
    <View style={s.resultRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={s.resultLabel}>{label}</Text>
        {info && (
          <TouchableOpacity onPress={() => Alert.alert(label, info)}>
            <Ionicons name="information-circle-outline" size={14} color={theme.icon} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={[s.resultVal, bold && s.resultValBold, color && { color }]}>
        LKR {(val || 0).toFixed(2)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      <View style={s.header}>
        <Text style={s.title}>Cost Calculator</Text>
        <TouchableOpacity onPress={resetForm} style={s.resetBtn}>
          <Ionicons name="refresh-outline" size={16} color={theme.primary} />
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
              <Field label="Hours" icon="time-outline" s={s} theme={theme}>
                <TextInput
                  style={s.input}
                  value={form.printTimeHours}
                  onChangeText={v => setForm(p => ({ ...p, printTimeHours: v }))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.icon}
                />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Minutes" icon="timer-outline" s={s} theme={theme}>
                <TextInput
                  style={s.input}
                  value={form.printTimeMinutes}
                  onChangeText={v => setForm(p => ({ ...p, printTimeMinutes: v }))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.icon}
                />
              </Field>
            </View>
          </View>

          <Field label="Weight (grams)" icon="scale-outline" s={s} theme={theme}>
            <TextInput
              style={s.input}
              value={form.weightGrams}
              onChangeText={v => setForm(p => ({ ...p, weightGrams: v }))}
              keyboardType="numeric"
              placeholder="100"
              placeholderTextColor={theme.icon}
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
              {form.supportStructures && <Ionicons name="checkmark" size={14} color={theme.primaryText} />}
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
              <ActivityIndicator color={theme.primaryText} />
            ) : (
              <>
                <Ionicons name="calculator-outline" size={20} color={theme.primaryText} style={{ marginRight: 8 }} />
                <Text style={s.calcBtnText}>Calculate Breakdown</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Result Section */}
        {result && (
          <View style={s.resultCard}>
            <View style={s.resultHeader}>
              <Ionicons name="receipt-outline" size={20} color={theme.text} />
              <Text style={s.resultTitle}>Price Breakdown</Text>
            </View>
            
            <View style={s.breakdownBox}>
              <ResultRow label="Material Cost" val={result.materialCost} info="Based on weight and material rate (e.g. PLA is LKR 5/g)." />
              <ResultRow label="Machine usage" val={result.machineCost} info="Depreciation and maintenance cost of the 3D printer per hour (LKR 50/hr)." />
              <ResultRow label="Energy consumption" val={result.energyCost} info="Electricity used by the printer and cooling systems (LKR 30/hr)." />
              <ResultRow label="Labour & Handling" val={result.laborCost} info="Flat fee for setup, slicing, and manual handling." />
              <ResultRow label="Support Material" val={result.supportCost} info="Additional cost if support structures are required for complex geometries." />
              
              <View style={s.divider} />
              
              <ResultRow label="Total Net Cost" val={result.totalCost} bold color={theme.text} info="Total internal cost to produce the print." />
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

const getStyles = (t) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: '900', color: t.text, letterSpacing: -0.5 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.glassBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: t.glassBorder },
  resetText: { color: t.primary, fontSize: 13, fontWeight: '800' },
  container: { flex: 1 },
  
  card: { backgroundColor: t.card, borderRadius: 24, padding: 20, shadowColor: t.text, shadowOpacity: 0.05, shadowRadius: 15, elevation: 5, borderWidth: 1, borderColor: t.border },
  timeRow: { flexDirection: 'row', gap: 15 },
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '800', color: t.textSecondary, marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.background, borderRadius: 14, borderWidth: 1.5, borderColor: t.border, overflow: 'hidden' },
  fieldIcon: { paddingHorizontal: 12 },
  input: { flex: 1, height: 50, fontSize: 16, color: t.text, fontWeight: '600' },
  
  matRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  matChip: { flex: 1, backgroundColor: t.background, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  matChipActive: { backgroundColor: t.primary + '1A', borderColor: t.primary },
  matChipText: { fontSize: 14, fontWeight: '700', color: t.textSecondary },
  matChipTextActive: { color: t.primary },
  
  supportRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 10, backgroundColor: t.background, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: t.border },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: t.primary, justifyContent: 'center', alignItems: 'center', backgroundColor: t.card },
  checkboxActive: { backgroundColor: t.primary },
  supportLabel: { fontSize: 14, color: t.text, fontWeight: '700' },
  
  calcBtn: { flexDirection: 'row', backgroundColor: t.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', shadowColor: t.primary, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  calcBtnText: { color: t.primaryText, fontSize: 16, fontWeight: '900' },
  
  resultCard: { marginTop: 20, backgroundColor: t.card, borderRadius: 24, overflow: 'hidden', shadowColor: t.text, shadowOpacity: 0.08, shadowRadius: 20, elevation: 10, borderWidth: 1, borderColor: t.border },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 20, backgroundColor: t.background, borderBottomWidth: 1, borderBottomColor: t.border },
  resultTitle: { fontSize: 18, fontWeight: '900', color: t.text },
  breakdownBox: { padding: 20 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  resultLabel: { fontSize: 14, color: t.textSecondary, fontWeight: '500' },
  resultVal: { fontSize: 15, color: t.text, fontWeight: '700' },
  resultValBold: { fontSize: 17, fontWeight: '900' },
  divider: { height: 1, backgroundColor: t.border, marginVertical: 12 },
  
  sellingBox: { backgroundColor: t.text, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sellingLabel: { fontSize: 14, color: t.background, fontWeight: '800' },
  sellingSub: { fontSize: 11, color: t.icon, marginTop: 2 },
  sellingVal: { fontSize: 22, color: t.background, fontWeight: '900' },
});
