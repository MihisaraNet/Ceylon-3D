/**
 * AddEditProductScreen.jsx — Add/Edit Product Placeholder
 *
 * This is a placeholder screen that redirects users to the ManageProductsScreen,
 * where the full add/edit product functionality is implemented via a modal dialog.
 *
 * This screen exists as a navigation target in the AdminStack so that the
 * "Add Product" quick action on the Admin Dashboard has a valid route.
 *
 * @module screens/admin/AddEditProductScreen
 */
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
