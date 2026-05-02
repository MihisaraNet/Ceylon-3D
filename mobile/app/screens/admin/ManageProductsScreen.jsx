import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, Modal, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../lib/api';
import { getImageUri } from '../../lib/config';
import { CATEGORIES } from '../../data/categories';

const EMPTY_FORM = { name:'', description:'', price:'', stock:'', category:'custom', imageUri:null, imageMime:null, imageName:null };
const EMPTY_ERRS = { name:'', price:'', stock:'' };

/* ── Inline error row ── */
const FieldErr = ({ msg }) => msg ? (
  <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginTop:3 }}>
    <Ionicons name="alert-circle-outline" size={12} color="#ef4444" />
    <Text style={{ fontSize:11, color:'#ef4444', fontWeight:'600' }}>{msg}</Text>
  </View>
) : null;

export default function ManageProductsScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving,  setSaving]   = useState(false);
  const [fErr,    setFErr]    = useState(EMPTY_ERRS);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/api/products'); setProducts(data); }
    catch (err) { console.error('ManageProducts load error:', err.message, err.code); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm(EMPTY_FORM); setFErr(EMPTY_ERRS); setModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ name:p.name, description:p.description||'', price:String(p.price), stock:String(p.stock||0), category:p.category||'custom', imageUri:null, imageMime:null, imageName:null });
    setFErr(EMPTY_ERRS);
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
    // ── Client-side validation ──────────────────────────
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      e.name  = 'Product name must be at least 2 characters';
    else if (form.name.trim().length > 120)
      e.name  = 'Name must be 120 characters or less';

    const p = parseFloat(form.price);
    if (!form.price || isNaN(p))   e.price = 'Price is required';
    else if (p < 0)                e.price = 'Price cannot be negative';
    else if (p > 10_000_000)       e.price = 'Price seems unrealistically high';

    if (form.stock !== '' && form.stock !== null) {
      const st = parseInt(form.stock, 10);
      if (isNaN(st) || st < 0)     e.stock = 'Stock must be 0 or a positive number';
      else if (st > 100_000)       e.stock = 'Stock cannot exceed 100,000';
    }

    setFErr(e);
    if (Object.keys(e).length) return;

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
    } catch (err) {
      const res = err.response?.data;
      if (res?.errors) setFErr(prev => ({ ...prev, ...res.errors }));
      else Alert.alert('Save Failed', res?.error || 'Could not save product');
    }
    finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Product', 'Are you sure? This will remove it from all carts.', [
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive', onPress: async () => {
        try { await api.delete(`/api/products/${id}`); load(); }
        catch (err) { Alert.alert('Error', err.response?.data?.error || 'Delete failed'); }
      }},
    ]);
  };

  const renderProduct = ({ item }) => {
    const imgUri = getImageUri(item.imagePath);
    return (
      <View style={s.row}>
        {imgUri ? <Image source={{ uri:imgUri }} style={s.thumb} /> : <View style={[s.thumb, s.thumbPH]}><Ionicons name="cube-outline" size={20} color="#9ca3af" /></View>}
        <View style={s.rowInfo}>
          <Text style={s.rowName} numberOfLines={1}>{item.name}</Text>
          <Text style={s.rowSub}>{item.category} · LKR {item.price?.toFixed(2)} · Stock: {item.stock}</Text>
        </View>
        <TouchableOpacity onPress={() => openEdit(item)} style={s.editBtn}><Ionicons name="pencil" size={18} color="#6366f1" /></TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item._id)} style={s.deleteBtn}><Ionicons name="trash" size={18} color="#ef4444" /></TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <TouchableOpacity style={s.addBtn} onPress={openAdd}>
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={s.addBtnText}> Add New Product</Text>
      </TouchableOpacity>

      {loading ? <ActivityIndicator color="#6366f1" style={{ marginTop:40 }} /> : (
        <FlatList
          data={products}
          keyExtractor={i => i._id}
          renderItem={renderProduct}
          contentContainerStyle={{ padding:12, gap:8 }}
          ListEmptyComponent={<Text style={s.empty}>No products yet</Text>}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet">
        <ScrollView contentContainerStyle={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{editing ? 'Edit Product' : 'Add Product'}</Text>
            <TouchableOpacity onPress={() => setModal(false)}>
              <Ionicons name="close" size={26} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Image */}
          <TouchableOpacity style={s.imgPicker} onPress={pickImage}>
            {form.imageUri
              ? <Image source={{ uri:form.imageUri }} style={s.imgPreview} />
              : <View style={s.imgPickerPlaceholder}>
                  <Ionicons name="image-outline" size={32} color="#9ca3af" />
                  <Text style={s.imgPickerText}>Tap to select image</Text>
                </View>
            }
          </TouchableOpacity>

          {[
            { key:'name',        label:'Product Name *',  multiline:false, keyboard:'default' },
            { key:'price',       label:'Price (LKR) *',   multiline:false, keyboard:'decimal-pad' },
            { key:'stock',       label:'Stock (units)',   multiline:false, keyboard:'numeric' },
            { key:'description', label:'Description',     multiline:true,  keyboard:'default' },
          ].map(fi => (
            <View key={fi.key} style={s.fieldGroup}>
              <Text style={s.label}>{fi.label}</Text>
              <TextInput
                style={[s.input, fi.multiline && { height:80 }, fErr[fi.key] && { borderColor:'#ef4444', backgroundColor:'#fff5f5' }]}
                value={form[fi.key]}
                onChangeText={v => { setForm(p => ({...p,[fi.key]:v})); setFErr(e => ({...e,[fi.key]:''})); }}
                keyboardType={fi.keyboard}
                multiline={fi.multiline}
                placeholderTextColor="#9ca3af"
                placeholder={fi.label}
              />
              <FieldErr msg={fErr[fi.key]} />
            </View>
          ))}

          <Text style={s.label}>Category</Text>
          <View style={s.catGrid}>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c.id} style={[s.catChip, form.category===c.id && s.catChipActive]} onPress={() => setForm(f => ({...f, category:c.id}))}>
                <Text style={[s.catChipText, form.category===c.id && s.catChipActive && { color:'#fff' }]}>{c.icon} {c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>{editing ? 'Save Changes' : 'Create Product'}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex:1, backgroundColor:'#f9fafb' },
  addBtn:          { flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor:'#6366f1', margin:16, borderRadius:12, padding:14 },
  addBtnText:      { color:'#fff', fontWeight:'700', fontSize:15 },
  row:             { flexDirection:'row', alignItems:'center', backgroundColor:'#fff', borderRadius:12, padding:12, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:6, elevation:2 },
  thumb:           { width:48, height:48, borderRadius:8 },
  thumbPH:         { backgroundColor:'#f3f4f6', justifyContent:'center', alignItems:'center' },
  rowInfo:         { flex:1, marginHorizontal:12 },
  rowName:         { fontSize:14, fontWeight:'700', color:'#111827' },
  rowSub:          { fontSize:12, color:'#6b7280', marginTop:2 },
  editBtn:         { padding:8 },
  deleteBtn:       { padding:8 },
  empty:           { textAlign:'center', color:'#9ca3af', marginTop:40 },
  modal:           { padding:20, paddingBottom:40 },
  modalHeader:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  modalTitle:      { fontSize:20, fontWeight:'800', color:'#111827' },
  imgPicker:       { borderWidth:2, borderStyle:'dashed', borderColor:'#d1d5db', borderRadius:14, marginBottom:16, overflow:'hidden' },
  imgPickerPlaceholder:{ height:120, justifyContent:'center', alignItems:'center', gap:8 },
  imgPickerText:   { color:'#9ca3af', fontSize:14 },
  imgPreview:      { width:'100%', height:160, resizeMode:'cover' },
  fieldGroup:      { marginBottom:14 },
  label:           { fontSize:14, fontWeight:'700', color:'#374151', marginBottom:6 },
  input:           { backgroundColor:'#f9fafb', borderWidth:1, borderColor:'#e5e7eb', borderRadius:12, padding:12, fontSize:14, color:'#111827' },
  catGrid:         { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:20 },
  catChip:         { backgroundColor:'#f3f4f6', borderRadius:999, paddingHorizontal:12, paddingVertical:8 },
  catChipActive:   { backgroundColor:'#6366f1' },
  catChipText:     { fontSize:13, fontWeight:'600', color:'#374151' },
  saveBtn:         { backgroundColor:'#6366f1', borderRadius:12, padding:16, alignItems:'center', marginTop:8 },
  saveBtnText:     { color:'#fff', fontSize:16, fontWeight:'700' },
});
