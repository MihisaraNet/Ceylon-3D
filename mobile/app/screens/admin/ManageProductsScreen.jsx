import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, TextInput, Modal, Image,
  ScrollView, SafeAreaView, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../lib/api';
import { getImageUri } from '../../lib/config';
import { CATEGORIES } from '../../data/categories';

const EMPTY_FORM = { name: '', description: '', price: '', stock: '', category: 'custom', imageUri: null, imageMime: null, imageName: null };
const EMPTY_ERRS = { name: '', price: '', stock: '' };

/* ── Inline Helpers ── */
const FieldErr = ({ msg }) => msg ? (
  <View style={s.errRow}>
    <Ionicons name="alert-circle-outline" size={12} color="#ef4444" />
    <Text style={s.errText}>{msg}</Text>
  </View>
) : null;

const StockBadge = ({ count }) => {
  const isLow = count > 0 && count <= 5;
  const isOut = count <= 0;
  
  let bg = '#ecfdf5', text = '#059669', label = 'In Stock';
  if (isLow) { bg = '#fffbeb'; text = '#d97706'; label = 'Low Stock'; }
  if (isOut) { bg = '#fef2f2'; text = '#dc2626'; label = 'Out of Stock'; }

  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <View style={[s.badgeDot, { backgroundColor: text }]} />
      <Text style={[s.badgeText, { color: text }]}>{label}: {count}</Text>
    </View>
  );
};

export default function ManageProductsScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [fErr, setFErr] = useState(EMPTY_ERRS);

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

  const openAdd = () => {
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
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!res.canceled && res.assets?.[0]) {
      const asset = res.assets[0];
      setForm(f => ({ ...f, imageUri: asset.uri, imageMime: asset.mimeType || 'image/jpeg', imageName: asset.fileName || 'image.jpg' }));
    }
  };

  const handleSave = async () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Name too short';
    const p = parseFloat(form.price);
    if (!form.price || isNaN(p)) e.price = 'Required';
    if (form.stock !== '') {
      const st = parseInt(form.stock, 10);
      if (isNaN(st) || st < 0) e.stock = 'Invalid';
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
      if (form.imageUri) fd.append('image', { uri: form.imageUri, type: form.imageMime, name: form.imageName });

      if (editing) await api.put(`/api/products/${editing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      else await api.post('/api/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });

      setModal(false);
      load();
    } catch (err) {
      Alert.alert('Save Failed', err.response?.data?.error || 'Could not save product');
    } finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Product', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/api/products/${id}`);
            load();
          } catch (err) {
            Alert.alert('Error', 'Delete failed');
          }
        }
      },
    ]);
  };

  const renderProduct = ({ item }) => {
    const imgUri = getImageUri(item.imagePath);
    return (
      <View style={s.card}>
        <View style={s.cardTop}>
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={s.thumb} />
          ) : (
            <View style={[s.thumb, s.thumbPH]}>
              <Ionicons name="cube-outline" size={24} color="#9ca3af" />
            </View>
          )}
          <View style={s.cardInfo}>
            <View style={s.catBadge}>
              <Text style={s.catBadgeText}>{item.category?.toUpperCase()}</Text>
            </View>
            <Text style={s.rowName} numberOfLines={1}>{item.name}</Text>
            <Text style={s.rowPrice}>LKR {item.price?.toFixed(2)}</Text>
          </View>
        </View>

        <View style={s.cardBottom}>
          <StockBadge count={item.stock} />
          <View style={s.actions}>
            <TouchableOpacity onPress={() => openEdit(item)} style={s.iconBtn}>
              <Ionicons name="pencil-sharp" size={18} color="#6366f1" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item._id)} style={[s.iconBtn, { backgroundColor: '#fef2f2' }]}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f7ff" />
      <View style={s.header}>
        <View>
          <Text style={s.title}>Products</Text>
          <View style={s.countBox}>
            <Text style={s.countText}>{products.length} Items</Text>
          </View>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={openAdd} activeOpacity={0.85}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.centred}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={s.loadText}>Loading catalogue…</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={i => i._id}
          renderItem={renderProduct}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Ionicons name="cube-outline" size={64} color="#e5e7eb" />
              <Text style={s.emptyText}>No products found</Text>
            </View>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={s.modalContainer} contentContainerStyle={s.modalContent} showsVerticalScrollIndicator={false}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{editing ? 'Edit Product' : 'Add New Product'}</Text>
            <TouchableOpacity onPress={() => setModal(false)} style={s.closeBtn}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.imgPicker} onPress={pickImage} activeOpacity={0.7}>
            {form.imageUri ? (
              <Image source={{ uri: form.imageUri }} style={s.imgPreview} />
            ) : (
              <View style={s.imgPHLarge}>
                <Ionicons name="cloud-upload-outline" size={40} color="#6366f1" />
                <Text style={s.imgPHText}>Upload Product Image</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={s.form}>
            <Text style={s.label}>Product Name</Text>
            <TextInput
              style={[s.input, fErr.name && s.inputErr]}
              value={form.name}
              onChangeText={v => setForm(p => ({ ...p, name: v }))}
              placeholder="e.g. High Detail Resin Statuette"
              placeholderTextColor="#9ca3af"
            />
            <FieldErr msg={fErr.name} />

            <View style={s.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Price (LKR)</Text>
                <TextInput
                  style={[s.input, fErr.price && s.inputErr]}
                  value={form.price}
                  onChangeText={v => setForm(p => ({ ...p, price: v }))}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />
                <FieldErr msg={fErr.price} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Stock</Text>
                <TextInput
                  style={[s.input, fErr.stock && s.inputErr]}
                  value={form.stock}
                  onChangeText={v => setForm(p => ({ ...p, stock: v }))}
                  keyboardType="numeric"
                  placeholder="0"
                />
                <FieldErr msg={fErr.stock} />
              </View>
            </View>

            <Text style={s.label}>Category</Text>
            <View style={s.catGrid}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[s.catChip, form.category === c.id && s.catChipActive]}
                  onPress={() => setForm(f => ({ ...f, category: c.id }))}
                >
                  <Text style={[s.catChipText, form.category === c.id && { color: '#fff' }]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Description</Text>
            <TextInput
              style={[s.input, s.textArea]}
              value={form.description}
              onChangeText={v => setForm(p => ({ ...p, description: v }))}
              multiline
              numberOfLines={4}
              placeholder="Tell customers about this product..."
            />

            <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>{editing ? 'Update Product' : 'Create Product'}</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f7ff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: '900', color: '#1e1b4b', letterSpacing: -0.5 },
  countBox: { backgroundColor: '#eef2ff', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 2 },
  countText: { fontSize: 11, fontWeight: '800', color: '#6366f1', textTransform: 'uppercase' },
  addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', shadowColor: '#6366f1', shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  
  centred: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadText: { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
  
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  thumb: { width: 80, height: 80, borderRadius: 12 },
  thumbPH: { backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, justifyContent: 'center', gap: 2 },
  catBadge: { backgroundColor: '#f1f5f9', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 2 },
  catBadgeText: { fontSize: 9, fontWeight: '900', color: '#64748b' },
  rowName: { fontSize: 16, fontWeight: '800', color: '#1e1b4b' },
  rowPrice: { fontSize: 14, fontWeight: '700', color: '#6366f1' },
  
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f8fafc', paddingTop: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center' },
  
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100, gap: 10 },
  emptyText: { fontSize: 16, color: '#9ca3af', fontWeight: '600' },

  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalContent: { padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1e1b4b' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  
  imgPicker: { width: '100%', height: 180, borderRadius: 20, backgroundColor: '#f8f7ff', borderWeight: 2, borderStyle: 'dashed', borderColor: '#c7d2fe', overflow: 'hidden', marginBottom: 24 },
  imgPHLarge: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  imgPHText: { color: '#6366f1', fontSize: 14, fontWeight: '700' },
  imgPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  form: { gap: 16 },
  formRow: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '800', color: '#4b5563', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: -8, marginLeft: 4 },
  input: { backgroundColor: '#f8f7ff', borderRadius: 14, borderWidth: 1.5, borderColor: '#e5e7eb', padding: 14, fontSize: 16, color: '#1e1b4b', fontWeight: '600' },
  inputErr: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  textArea: { height: 100, textAlignVertical: 'top' },
  errRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -12, marginLeft: 4 },
  errText: { fontSize: 11, color: '#ef4444', fontWeight: '600' },
  
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 4 },
  catChip: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  catChipActive: { backgroundColor: '#6366f1' },
  catChipText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  
  saveBtn: { backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 10, shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
