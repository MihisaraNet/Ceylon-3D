/**
 * ManageProductsScreen.jsx — Admin Product Management
 *
 * Modern, colorful and simple design.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, Modal, Image, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../lib/api';
import { getImageUri } from '../../lib/config';
import { CATEGORIES } from '../../data/categories';

const EMPTY_FORM = { name:'', description:'', price:'', stock:'', category:'custom', imageUri:null, imageMime:null, imageName:null };

export default function ManageProductsScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving,  setSaving]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { 
      const { data } = await api.get('/api/products'); 
      setProducts(data); 
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ name:p.name, description:p.description||'', price:String(p.price), stock:String(p.stock||0), category:p.category||'custom', imageUri:null });
    setModal(true);
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes:['images'], quality:0.8 });
    if (!res.canceled && res.assets?.[0]) {
      const asset = res.assets[0];
      setForm(f => ({ ...f, imageUri:asset.uri, imageMime:asset.mimeType||'image/jpeg', imageName:asset.fileName||'image.jpg' }));
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return Alert.alert('Error', 'Name and Price are required');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('description', form.description.trim());
      fd.append('price', form.price);
      fd.append('stock', form.stock || '0');
      fd.append('category', form.category);
      if (form.imageUri) fd.append('image', { uri:form.imageUri, type:form.imageMime, name:form.imageName });

      if (editing) await api.put(`/api/products/${editing._id}`, fd, { headers:{ 'Content-Type':'multipart/form-data' } });
      else         await api.post('/api/products', fd, { headers:{ 'Content-Type':'multipart/form-data' } });

      setModal(false);
      load();
    } catch { Alert.alert('Error', 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Delete this product?', [
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive', onPress: async () => {
        try { await api.delete(`/api/products/${id}`); load(); } catch { }
      }},
    ]);
  };

  const renderProduct = ({ item }) => {
    const imgUri = getImageUri(item.imagePath);
    return (
      <View style={s.row}>
        <View style={s.rowImgWrap}>
          {imgUri ? <Image source={{ uri:imgUri }} style={s.thumb} /> : <View style={s.thumbPH}><Ionicons name="cube" size={20} color="#cbd5e1" /></View>}
        </View>
        <View style={s.rowInfo}>
          <Text style={s.rowName} numberOfLines={1}>{item.name}</Text>
          <Text style={s.rowSub}>{item.category} · LKR {item.price}</Text>
        </View>
        <View style={s.rowActions}>
          <TouchableOpacity onPress={() => openEdit(item)} style={s.actionBtn}><Ionicons name="pencil" size={18} color="#6366f1" /></TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item._id)} style={s.actionBtn}><Ionicons name="trash" size={18} color="#ef4444" /></TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={s.header}>
        <Text style={s.headerTitle}>Inventory</Text>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#6366f1" size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={i => i._id}
          renderItem={renderProduct}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          ListEmptyComponent={<Text style={s.empty}>No products</Text>}
        />
      )}

      <Modal visible={modal} animationType="slide">
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editing ? 'Edit Product' : 'Add Product'}</Text>
              <TouchableOpacity onPress={() => setModal(false)}><Ionicons name="close" size={30} color="#1e293b" /></TouchableOpacity>
            </View>

            <TouchableOpacity style={s.imgPicker} onPress={pickImage}>
              {form.imageUri ? <Image source={{ uri:form.imageUri }} style={s.imgPreview} /> : <View style={s.imgPH}><Ionicons name="camera" size={40} color="#cbd5e1" /><Text style={s.imgText}>Upload Image</Text></View>}
            </TouchableOpacity>

            <Text style={s.inputLabel}>PRODUCT NAME</Text>
            <TextInput style={s.input} value={form.name} onChangeText={v => setForm(p=>({...p,name:v}))} placeholder="e.g. 3D Bench" />

            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.inputLabel}>PRICE (LKR)</Text>
                <TextInput style={s.input} value={form.price} onChangeText={v => setForm(p=>({...p,price:v}))} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.inputLabel}>STOCK</Text>
                <TextInput style={s.input} value={form.stock} onChangeText={v => setForm(p=>({...p,stock:v}))} keyboardType="numeric" />
              </View>
            </View>

            <Text style={s.inputLabel}>DESCRIPTION</Text>
            <TextInput style={[s.input, { height: 100, textAlignVertical: 'top' }]} value={form.description} onChangeText={v => setForm(p=>({...p,description:v}))} multiline />

            <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>{editing ? 'Save Changes' : 'Create Product'}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#f8fafc' },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  headerTitle:    { fontSize: 28, fontWeight: '900', color: '#1e293b' },
  addBtn:         { backgroundColor: '#6366f1', width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },

  row:            { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  rowImgWrap:     { width: 56, height: 56, borderRadius: 12, backgroundColor: '#f1f5f9', overflow: 'hidden' },
  thumb:          { width: '100%', height: '100%' },
  thumbPH:        { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  rowInfo:        { flex: 1, marginLeft: 16 },
  rowName:        { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  rowSub:         { fontSize: 13, color: '#64748b', fontWeight: '600', marginTop: 2 },
  rowActions:     { flexDirection: 'row', gap: 8 },
  actionBtn:      { backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  
  modalContent:   { padding: 24 },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalTitle:     { fontSize: 24, fontWeight: '900', color: '#1e293b' },
  imgPicker:      { height: 200, backgroundColor: '#f8fafc', borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginBottom: 24, overflow: 'hidden' },
  imgPreview:     { width: '100%', height: '100%' },
  imgPH:          { alignItems: 'center', gap: 8 },
  imgText:        { fontSize: 13, fontWeight: '800', color: '#94a3b8' },
  
  inputLabel:     { fontSize: 11, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input:          { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, fontSize: 15, color: '#1e293b', fontWeight: '600', borderWidth: 1, borderColor: '#f1f5f9' },
  saveBtn:        { backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: 18, marginTop: 40, alignItems: 'center', shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  saveBtnText:    { color: '#fff', fontSize: 16, fontWeight: '800' },
  empty:          { textAlign: 'center', color: '#94a3b8', marginTop: 60, fontWeight: '700' },
});
