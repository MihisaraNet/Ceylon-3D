import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CartItemCard({ 
  item, 
  onQtyChange, 
  onRemove, 
  qtyError
}) {
  return (
    <View style={s.itemCard}>
      {/* Product Image */}
      {item.image ? (
        <Image source={{ uri: item.image }} style={s.itemImg} resizeMode="cover" />
      ) : (
        <View style={s.imgPH}>
          <Ionicons name="cube-outline" size={24} color="#94a3b8" />
        </View>
      )}

      {/* Item Details */}
      <View style={s.itemBody}>
        <View style={s.topRow}>
          <Text style={s.itemName} numberOfLines={2}>{item.title}</Text>
          <TouchableOpacity 
            style={s.removeBtn} 
            onPress={() => onRemove(item.cartItemId)}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>
        
        <Text style={s.itemPrice}>LKR {item.price?.toFixed(2)}</Text>

        {/* Quantity Controls */}
        <View style={s.qtyRow}>
          <TouchableOpacity
            style={s.qtyBtn}
            onPress={() => onQtyChange(item.cartItemId, item.quantity - 1)}
            disabled={item.quantity <= 1}
            activeOpacity={0.6}
          >
            <Ionicons name="remove" size={14} color={item.quantity <= 1 ? '#cbd5e1' : '#0f172a'} />
          </TouchableOpacity>
          <Text style={s.qtyVal}>{item.quantity}</Text>
          <TouchableOpacity
            style={s.qtyBtn}
            onPress={() => onQtyChange(item.cartItemId, item.quantity + 1)}
            activeOpacity={0.6}
          >
            <Ionicons name="add" size={14} color="#0f172a" />
          </TouchableOpacity>
        </View>

        {/* Stock Error Message */}
        {qtyError && (
          <Text style={s.qtyErrText}>{qtyError}</Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  itemCard: { 
    flexDirection: 'row', 
    borderRadius: 20, 
    padding: 12, 
    alignItems: 'center', 
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12,
  },
  itemImg: { width: 80, height: 80, borderRadius: 12, marginRight: 14, backgroundColor: '#f8fafc' },
  imgPH: { width: 80, height: 80, borderRadius: 12, marginRight: 14, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  
  itemBody: { flex: 1, justifyContent: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#0f172a', lineHeight: 20 },
  removeBtn: { padding: 4, marginLeft: 8 },
  
  itemPrice: { fontSize: 13, color: '#64748b', fontWeight: '500', marginTop: 2, marginBottom: 8 },
  
  qtyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  qtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  qtyVal: { fontSize: 13, fontWeight: '700', color: '#0f172a', minWidth: 24, textAlign: 'center' },
  
  qtyErrText: { fontSize: 11, color: '#ef4444', fontWeight: '500', marginTop: 4 },
});
