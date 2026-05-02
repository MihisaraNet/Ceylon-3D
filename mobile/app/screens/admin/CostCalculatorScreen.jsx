/**
 * CostCalculatorScreen.jsx — Admin 3D Printing Cost Calculator
 * Minimalist design
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
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
    } catch (err) { 
      Alert.alert('Error', 'Calculation failed'); 
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
    <ScrollView style={s.container} contentContainerStyle={{ padding:24 }}>
      <Text style={s.title}>COST CALCULATOR</Text>

      {[
        { key:'printTimeHours',   label:'PRINT TIME (HOURS)',   keyboard:'numeric' },
        { key:'printTimeMinutes', label:'PRINT TIME (MINUTES)', keyboard:'numeric' },
        { key:'weightGrams',      label:'WEIGHT (GRAMS)',       keyboard:'numeric' },
      ].map(f => (
        <View key={f.key} style={s.fieldGroup}>
          <Text style={s.label}>{f.label}</Text>
          <TextInput style={s.input} value={form[f.key]} onChangeText={v => setForm(p => ({...p,[f.key]:v}))} keyboardType={f.keyboard} placeholderTextColor="#ccc" />
        </View>
      ))}

      <Text style={s.label}>MATERIAL</Text>
      <View style={s.matRow}>
        {['PLA','PLA+','ABS','ABS+'].map(m => (
          <TouchableOpacity key={m} style={[s.matChip, form.material===m && s.matChipActive]} onPress={() => setForm(p => ({...p,material:m}))}>
            <Text style={[s.matChipText, form.material===m && { color:'#fff' }]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.supportRow} onPress={() => setForm(p => ({...p, supportStructures:!p.supportStructures}))} activeOpacity={0.8}>
        <Ionicons name={form.supportStructures ? 'checkbox' : 'square-outline'} size={24} color="#000" />
        <Text style={s.supportLabel}> SUPPORT STRUCTURES (+LKR 100)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.calcBtn} onPress={handleCalc} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.calcBtnText}>CALCULATE COST</Text>}
      </TouchableOpacity>

      {result && (
        <View style={s.resultCard}>
          <Text style={s.resultTitle}>BREAKDOWN</Text>
          <Row label="Material Cost"  val={result.materialCost} />
          <Row label="Machine Cost"   val={result.machineCost} />
          <Row label="Energy Cost"    val={result.energyCost} />
          <Row label="Labour Cost"    val={result.laborCost} />
          <Row label="Support Cost"   val={result.supportCost} />
          <View style={s.divider} />
          <Row label="Total Cost"     val={result.totalCost} bold />
          <View style={s.sellingBox}>
            <Text style={s.sellingLabel}>SELLING PRICE (1.5x)</Text>
            <Text style={s.sellingVal}>LKR {result.sellingPrice?.toFixed(2)}</Text>
          </View>
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:      { flex:1, backgroundColor:'#fff' },
  title:          { fontSize:20, fontWeight:'900', color:'#000', marginBottom:24, letterSpacing: 2 },
  fieldGroup:     { marginBottom:16 },
  label:          { fontSize:11, fontWeight:'800', color:'#666', marginBottom:8, letterSpacing: 1 },
  input:          { backgroundColor:'#fff', borderWidth:1, borderColor:'#eee', borderRadius:8, padding:14, fontSize:15, color:'#000' },
  matRow:         { flexDirection:'row', gap:8, marginBottom:20 },
  matChip:        { flex:1, backgroundColor:'#fff', borderRadius:8, padding:12, alignItems:'center', borderWidth:1, borderColor:'#eee' },
  matChipActive:  { backgroundColor:'#000', borderColor:'#000' },
  matChipText:    { fontSize:12, fontWeight:'700', color:'#666' },
  supportRow:     { flexDirection:'row', alignItems:'center', marginBottom:24 },
  supportLabel:   { fontSize:12, color:'#000', fontWeight:'700', letterSpacing: 0.5 },
  calcBtn:        { backgroundColor:'#000', borderRadius:8, padding:18, alignItems:'center', marginBottom:24 },
  calcBtnText:    { color:'#fff', fontSize:14, fontWeight:'900', letterSpacing: 1 },
  resultCard:     { backgroundColor:'#fff', borderRadius:8, padding:20, borderWidth: 1, borderColor: '#eee' },
  resultTitle:    { fontSize:14, fontWeight:'900', color:'#000', marginBottom:16, letterSpacing: 1 },
  resultRow:      { flexDirection:'row', justifyContent:'space-between', marginBottom:8 },
  resultLabel:    { fontSize:13, color:'#666' },
  resultVal:      { fontSize:13, color:'#000', fontWeight:'600' },
  resultValBold:  { color:'#000', fontWeight:'800' },
  divider:        { height:1, backgroundColor:'#eee', marginVertical:12 },
  sellingBox:     { backgroundColor:'#f9f9f9', borderRadius:8, padding:16, marginTop:8, borderWidth: 1, borderColor: '#eee' },
  sellingLabel:   { fontSize:12, color:'#666', fontWeight:'800', marginBottom:4, letterSpacing: 1 },
  sellingVal:     { fontSize:20, color:'#000', fontWeight:'900' },
});
