// Placeholder for Add/Edit Product (full implementation in ManageProductsScreen modal)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AddEditProductScreen({ route }) {
  return (
    <View style={s.container}>
      <Text style={s.text}>Add/Edit product functionality is available in Manage Products screen.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', padding:24 },
  text:      { fontSize:16, color:'#6b7280', textAlign:'center' },
});
