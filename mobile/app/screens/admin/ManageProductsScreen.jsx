/**
 * ManageProductsScreen.jsx — Catalog Infrastructure
 * 
 * Attractive, modern design for catalog management 
 * with premium card layouts and focused data entry.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, Modal, Image, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../lib/api';
import { getImageUri } from '../../lib/config';
import { CATEGORIES } from '../../data/categories';

const EMPTY_FORM = { name:'', description:'', price:'', stock:'', category:'custom', imageUri:null };

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
    if (!form.name || !form.price) return Alert.alert('Missing Data', 'Name and Price are mandatory.');
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
    } catch { Alert.alert('Error', 'Save protocol failed.'); }
    finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Erase Product', 'This action is permanent.', [
      { text:'Cancel', style:'cancel' },
      { text:'Erase', style:'destructive', onPress: async () => {
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
          <Text style={s.rowSub}>{item.category?.toUpperCase()} · LKR {item.price}</Text>
        </View>
        <View style={s.rowActions}>
          <TouchableOpacity onPress={() => openEdit(item)} style={s.actionBtn}><Ionicons name="pencil" size={16} color="#0f172a" /></TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item._id)} style={s.actionBtn}><Ionicons name="trash" size={16} color="#f43f5e" /></TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={s.header}>
        <Text style={s.title}>Inventory</Text>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#6366f1" size="large" style={{ marginTop: 80 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={i => i._id}
          renderItem={renderProduct}
          contentContainerStyle={{ padding: 24, gap: 12 }}
          ListEmptyComponent={<Text style={s.empty}>Zero assets detected.</Text>}
        />
      )}

      <Modal visible={modal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <ScrollView contentContainerStyle={s.modalContent} showsVerticalScrollIndicator={false}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editing ? 'Edit Entry' : 'New Entry'}</Text>
              <TouchableOpacity onPress={() => setModal(false)}><Ionicons name="close-circle" size={32} color="#0f172a" /></TouchableOpacity>
            </View>

            <TouchableOpacity style={s.imgPicker} onPress={pickImage} activeOpacity={0.8}>
              {form.imageUri ? (
                <Image source={{ uri:form.imageUri }} style={s.imgPreview} />
              ) : (
                <View style={s.imgPHBox}>
                  <Ionicons name="camera-outline" size={32} color="#cbd5e1" />
                  <Text style={s.imgPHText}>Select Media</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={s.field}>
              <Text style={s.label}>IDENTIFIER</Text>
              <TextInput style={s.input} value={form.name} onChangeText={v => setForm(p=>({...p,name:v}))} placeholder="Product Name" />
            </View>

            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>VALUATION (LKR)</Text>
                <TextInput style={s.input} value={form.price} onChangeText={v => setForm(p=>({...p,price:v}))} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>QUANTITY</Text>
                <TextInput style={s.input} value={form.stock} onChangeText={v => setForm(p=>({...p,stock:v}))} keyboardType="numeric" />
              </View>
            </View>

            <View style={s.field}>
              <Text style={s.label}>SPECIFICATIONS</Text>
              <TextInput style={[s.input, { height: 120, textAlignVertical: 'top' }]} value={form.description} onChangeText={v => setForm(p=>({...p,description:v}))} multiline placeholder="Enter description..." />
            </View>

            <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.9}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Save Entry</Text>}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 28, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  title: { fontSize: 32, fontWeight: '900', color: '#0f172a', letterSpacing: -1.5 },
  addBtn: { backgroundColor: '#0f172a', width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#0f172a', shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 },

  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 28, padding: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  rowImgWrap: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#f8fafc', overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  thumbPH: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  rowInfo: { flex: 1, marginLeft: 16 },
  rowName: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  rowSub: { fontSize: 12, color: '#94a3b8', fontWeight: '700', marginTop: 4, letterSpacing: 0.5 },
  rowActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  
  modalContent: { padding: 32 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalTitle: { fontSize: 28, fontWeight: '900', color: '#0f172a', letterSpacing: -1 },
  imgPicker: { height: 220, backgroundColor: '#f8fafc', borderRadius: 32, borderWidth: 2, borderStyle: 'dashed', borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginBottom: 32, overflow: 'hidden' },
  imgPreview: { width: '100%', height: '100%' },
  imgPHBox: { alignItems: 'center', gap: 10 },
  imgPHText: { fontSize: 13, fontWeight: '800', color: '#cbd5e1', letterSpacing: 1 },
  
  field: { marginBottom: 24 },
  label: { fontSize: 10, fontWeight: '900', color: '#cbd5e1', letterSpacing: 1.5, marginBottom: 12 },
  input: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 18, fontSize: 15, color: '#0f172a', fontWeight: '700', borderWidth: 1, borderColor: '#f1f5f9' },
  saveBtn: { backgroundColor: '#0f172a', borderRadius: 24, paddingVertical: 22, marginTop: 24, alignItems: 'center', shadowColor: '#0f172a', shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  empty: { textAlign: 'center', color: '#cbd5e1', marginTop: 100, fontWeight: '800', letterSpacing: 1 },
});
