import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function CartItemCard({ 
  item, 
  onQtyChange, 
  onRemove, 
  qtyError,
  theme,
}) {
  const s = getStyles(theme);
  return (
    <View style={s.itemCard}>
      {/* Product Image */}
      {item.image ? (
        <Image source={{ uri: item.image }} style={s.itemImg} resizeMode="cover" />
      ) : (
        <View style={s.imgPH}>
          <Ionicons name="cube-outline" size={24} color={theme.primary} />
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
            <Ionicons name="close-circle" size={20} color={theme.icon} />
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
            <Ionicons name="remove" size={14} color={item.quantity <= 1 ? theme.border : theme.primary} />
          </TouchableOpacity>
          <Text style={s.qtyVal}>{item.quantity}</Text>
          <TouchableOpacity
            style={s.qtyBtn}
            onPress={() => onQtyChange(item.cartItemId, item.quantity + 1)}
            activeOpacity={0.6}
          >
            <Ionicons name="add" size={14} color={theme.primary} />
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

const getStyles = (t) => StyleSheet.create({
  itemCard: { 
    flexDirection: 'row', 
    borderRadius: 24, 
    padding: 12, 
    alignItems: 'center', 
    backgroundColor: t.card,
    shadowColor: '#1a1a1a',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: t.border,
  },
  itemImg: { width: 80, height: 80, borderRadius: 16, marginRight: 16, backgroundColor: t.background },
  imgPH: { width: 80, height: 80, borderRadius: 16, marginRight: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: t.glassBg },
  
  itemBody: { flex: 1, justifyContent: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { flex: 1, fontSize: 15, fontWeight: '700', color: t.text, lineHeight: 22 },
  removeBtn: { padding: 4, marginLeft: 8, marginTop: -4, marginRight: -4 },
  
  itemPrice: { fontSize: 14, color: t.primary, fontWeight: '700', marginTop: 2, marginBottom: 10 },
  
  qtyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.glassBg, alignSelf: 'flex-start', borderRadius: 99, borderWidth: 1, borderColor: t.glassBorder },
  qtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  qtyVal: { fontSize: 14, fontWeight: '700', color: t.text, minWidth: 24, textAlign: 'center' },
  
  qtyErrText: { fontSize: 12, color: t.error, fontWeight: '600', marginTop: 4 },
});
