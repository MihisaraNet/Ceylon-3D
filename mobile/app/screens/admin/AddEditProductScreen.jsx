/**
 * AddEditProductScreen.jsx — Add/Edit Product Placeholder
 * Minimalist design
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AddEditProductScreen() {
  return (
    <View style={s.container}>
      <Text style={s.text}>Add/Edit product functionality is available in the Manage Products screen modal.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', padding:40, backgroundColor: '#fff' },
  text:      { fontSize:14, color:'#999', textAlign:'center', fontWeight: '600', lineHeight: 22, textTransform: 'uppercase', letterSpacing: 1 },
});
