/**
 * ManageProductsScreen.jsx — Admin Product Management
 * Minimalist design
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, Modal, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../lib/api';
import { getImageUri } from '../../lib/config';
import { CATEGORIES } from '../../data/categories';

const EMPTY_FORM = { name:'', description:'', price:'', stock:'', category:'custom', imageUri:null, imageMime:null, imageName:null };
const EMPTY_ERRS = { name:'', price:'', stock:'' };

const FieldErr = ({ msg }) => msg ? (
  <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginTop:3 }}>
    <Ionicons name="alert-circle-outline" size={12} color="#000" />
    <Text style={{ fontSize:11, color:'#000', fontWeight:'600' }}>{msg}</Text>
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
    try { 
      const { data } = await api.get('/api/products'); 
      setProducts(data); 
    } catch (err) { 
      console.error('ManageProducts load error:', err.message); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { 
    setEditing(null); 
    setForm(EMPTY_FORM); 
    setFErr(EMPTY_ERRS); 
    setModal(true); 
  };
  
  const openEdit = (p) => {
    setEditing(p);
    setForm({ 
      name: p.name, 
      description: p.description || '', 
      price: String(p.price), 
      stock: String(p.stock || 0), 
      category: p.category || 'custom', 
      imageUri: null, imageMime: null, imageName: null 
    });
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
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name  = 'Name too short';
    const p = parseFloat(form.price);
    if (!form.price || isNaN(p)) e.price = 'Price required';
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
      Alert.alert('Save Failed', err.response?.data?.error || 'Could not save product');
    } finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Product', 'Permanently remove this product?', [
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive', onPress: async () => {
        try { 
          await api.delete(`/api/products/${id}`); 
          load(); 
        } catch (err) { 
          Alert.alert('Error', 'Delete failed'); 
        }
      }},
    ]);
  };

  const renderProduct = ({ item }) => {
    const imgUri = getImageUri(item.imagePath);
    return (
      <View style={s.row}>
        {imgUri ? <Image source={{ uri:imgUri }} style={s.thumb} /> : <View style={[s.thumb, s.thumbPH]}><Ionicons name="cube-outline" size={20} color="#ccc" /></View>}
        <View style={s.rowInfo}>
          <Text style={s.rowName} numberOfLines={1}>{item.name}</Text>
          <Text style={s.rowSub}>{item.category} · LKR {item.price?.toFixed(2)}</Text>
        </View>
        <TouchableOpacity onPress={() => openEdit(item)} style={s.editBtn}><Ionicons name="pencil-outline" size={18} color="#000" /></TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item._id)} style={s.deleteBtn}><Ionicons name="trash-outline" size={18} color="#000" /></TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <TouchableOpacity style={s.addBtn} onPress={openAdd}>
        <Ionicons name="add-outline" size={20} color="#fff" />
        <Text style={s.addBtnText}> ADD PRODUCT</Text>
      </TouchableOpacity>

      {loading ? <ActivityIndicator color="#000" style={{ marginTop:40 }} /> : (
        <FlatList
          data={products}
          keyExtractor={i => i._id}
          renderItem={renderProduct}
          contentContainerStyle={{ padding:16, gap:12 }}
          ListEmptyComponent={<Text style={s.empty}>No products found</Text>}
        />
      )}

      <Modal visible={modal} animationType="fade" transparent={false}>
        <ScrollView contentContainerStyle={s.modal} style={{ backgroundColor: '#fff' }}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{editing ? 'EDIT PRODUCT' : 'NEW PRODUCT'}</Text>
            <TouchableOpacity onPress={() => setModal(false)}>
              <Ionicons name="close-outline" size={30} color="#000" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.imgPicker} onPress={pickImage}>
            {form.imageUri
              ? <Image source={{ uri:form.imageUri }} style={s.imgPreview} />
              : <View style={s.imgPickerPlaceholder}>
                  <Ionicons name="camera-outline" size={32} color="#ccc" />
                  <Text style={s.imgPickerText}>SELECT IMAGE</Text>
                </View>
            }
          </TouchableOpacity>

          {[
            { key:'name',        label:'NAME *',        multiline:false, keyboard:'default' },
            { key:'price',       label:'PRICE (LKR) *', multiline:false, keyboard:'decimal-pad' },
            { key:'stock',       label:'STOCK',         multiline:false, keyboard:'numeric' },
            { key:'description', label:'DESCRIPTION',   multiline:true,  keyboard:'default' },
          ].map(fi => (
            <View key={fi.key} style={s.fieldGroup}>
              <Text style={s.label}>{fi.label}</Text>
              <TextInput
                style={[s.input, fi.multiline && { height:80 }, fErr[fi.key] && { borderColor:'#000' }]}
                value={form[fi.key]}
                onChangeText={v => { setForm(p => ({...p,[fi.key]:v})); setFErr(e => ({...e,[fi.key]:''})); }}
                keyboardType={fi.keyboard}
                multiline={fi.multiline}
                placeholderTextColor="#ccc"
              />
              <FieldErr msg={fErr[fi.key]} />
            </View>
          ))}

          <Text style={s.label}>CATEGORY</Text>
          <View style={s.catGrid}>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c.id} style={[s.catChip, form.category===c.id && s.catChipActive]} onPress={() => setForm(f => ({...f, category:c.id}))}>
                <Text style={[s.catChipText, form.category===c.id && { color:'#fff' }]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>{editing ? 'SAVE CHANGES' : 'CREATE PRODUCT'}</Text>}
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex:1, backgroundColor:'#fff' },
  addBtn:          { flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor:'#000', margin:16, borderRadius:8, padding:16 },
  addBtnText:      { color:'#fff', fontWeight:'800', fontSize:14, letterSpacing: 1 },
  row:             { flexDirection:'row', alignItems:'center', backgroundColor:'#fff', borderRadius:8, padding:12, borderWidth: 1, borderColor: '#eee' },
  thumb:           { width:50, height:50, borderRadius:4 },
  thumbPH:         { backgroundColor:'#f9f9f9', justifyContent:'center', alignItems:'center', borderWidth: 1, borderColor: '#eee' },
  rowInfo:         { flex:1, marginHorizontal:12 },
  rowName:         { fontSize:14, fontWeight:'800', color:'#000', textTransform: 'uppercase' },
  rowSub:          { fontSize:12, color:'#666', marginTop:2 },
  editBtn:         { padding:8 },
  deleteBtn:       { padding:8 },
  empty:           { textAlign:'center', color:'#ccc', marginTop:40, fontWeight: '700' },
  modal:           { padding:24 },
  modalHeader:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:24 },
  modalTitle:      { fontSize:18, fontWeight:'900', color:'#000', letterSpacing: 1 },
  imgPicker:       { borderWidth:1, borderStyle:'dashed', borderColor:'#ccc', borderRadius:8, marginBottom:20, backgroundColor: '#f9f9f9' },
  imgPickerPlaceholder:{ height:120, justifyContent:'center', alignItems:'center', gap:8 },
  imgPickerText:   { color:'#999', fontSize:11, fontWeight: '800' },
  imgPreview:      { width:'100%', height:200, resizeMode:'cover', borderRadius: 8 },
  fieldGroup:      { marginBottom:16 },
  label:           { fontSize:11, fontWeight:'800', color:'#666', marginBottom:6, letterSpacing: 1 },
  input:           { backgroundColor:'#fff', borderWidth:1, borderColor:'#eee', borderRadius:8, padding:14, fontSize:15, color:'#000' },
  catGrid:         { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:24 },
  catChip:         { backgroundColor:'#fff', borderRadius:8, paddingHorizontal:12, paddingVertical:10, borderWidth: 1, borderColor: '#eee' },
  catChipActive:   { backgroundColor:'#000', borderColor: '#000' },
  catChipText:     { fontSize:12, fontWeight:'700', color:'#666' },
  saveBtn:         { backgroundColor:'#000', borderRadius:8, padding:18, alignItems:'center' },
  saveBtnText:     { color:'#fff', fontSize:14, fontWeight:'900', letterSpacing: 1 },
});
