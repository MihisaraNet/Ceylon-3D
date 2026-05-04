import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * CartItemCard Component
 * Renders a single item in the shopping cart with quantity controls and file attachment.
 */
export default function CartItemCard({ 
  item, 
  accentColor, 
  onQtyChange, 
  onRemove, 
  onPickFile, 
  onRemoveFile,
  isUploading,
  hasFile,
  qtyError
}) {
  return (
    <View style={s.itemCard}>
      {/* Left accent bar */}
      <View style={[s.accentBar, { backgroundColor: accentColor }]} />

      {/* Product Image or Placeholder */}
      {item.image ? (
        <Image source={{ uri: item.image }} style={s.itemImg} resizeMode="cover" />
      ) : (
        <View style={[s.itemImg, s.imgPH, { backgroundColor: accentColor + '22' }]}>
          <Ionicons name="cube-outline" size={28} color={accentColor} />
        </View>
      )}

      {/* Item Details */}
      <View style={s.itemBody}>
        <Text style={s.itemName} numberOfLines={2}>{item.title}</Text>
        <Text style={s.itemPrice}>LKR {item.price?.toFixed(2)}</Text>

        {/* Quantity Controls */}
        <View style={s.qtyRow}>
          <TouchableOpacity
            style={[s.qtyBtn, { borderColor: accentColor }]}
            onPress={() => onQtyChange(item.cartItemId, item.quantity - 1)}
            disabled={item.quantity <= 1}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="remove" size={16} color={item.quantity <= 1 ? '#d1d5db' : accentColor} />
          </TouchableOpacity>
          <Text style={s.qtyVal}>{item.quantity}</Text>
          <TouchableOpacity
            style={[s.qtyBtn, { borderColor: accentColor }]}
            onPress={() => onQtyChange(item.cartItemId, item.quantity + 1)}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="add" size={16} color={accentColor} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={s.removeBtn} 
            onPress={() => onRemove(item.cartItemId)}
            activeOpacity={0.5}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Stock Error Message */}
        {qtyError && (
          <Text style={s.qtyErrText}>⚠ {qtyError}</Text>
        )}

        {/* Design / Personalisation File Picker */}
        <View style={[s.itemFileBtn, hasFile && s.itemFileBtnDone]}>
          <TouchableOpacity
            style={s.itemFileBtnTouch}
            onPress={() => onPickFile(item.cartItemId)}
            activeOpacity={0.8}
          >
            {isUploading ? (
              <ActivityIndicator size={12} color="#6366f1" />
            ) : (
              <Ionicons
                name={hasFile ? 'image' : 'attach-outline'}
                size={13}
                color={hasFile ? '#22c55e' : accentColor}
              />
            )}
            <Text
              style={[
                s.itemFileBtnText,
                { color: hasFile ? '#22c55e' : accentColor },
              ]}
              numberOfLines={1}
            >
              {isUploading
                ? 'Uploading…'
                : hasFile
                  ? hasFile.name
                  : 'Attach design file'}
            </Text>
          </TouchableOpacity>
          
          {hasFile && !isUploading && (
            <TouchableOpacity
              onPress={() => onRemoveFile(item.cartItemId)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="trash-outline" size={14} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Line Total */}
      <View style={s.priceCol}>
        <Text style={[s.lineTotal, { color: accentColor }]}>
          LKR{'\n'}{(item.price * item.quantity).toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  itemCard:        { 
    flexDirection: 'row', 
    borderRadius: 18, 
    overflow: 'hidden', 
    padding: 12, 
    alignItems: 'flex-start', 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 2, 
    borderWidth: 1, 
    borderColor: 'rgba(0,0,0,0.04)',
    backgroundColor: '#ffffff'
  },
  accentBar:       { width: 4, borderRadius: 99, marginRight: 10, alignSelf: 'stretch' },
  itemImg:         { width: 72, height: 72, borderRadius: 12, marginRight: 10 },
  imgPH:           { justifyContent: 'center', alignItems: 'center' },
  itemBody:        { flex: 1, gap: 3 },
  itemName:        { fontSize: 14, fontWeight: '800', color: '#1e1b4b', lineHeight: 19 },
  itemPrice:       { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  qtyRow:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  qtyBtn:          { width: 30, height: 30, borderRadius: 8, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  qtyVal:          { fontSize: 16, fontWeight: '900', color: '#1e1b4b', minWidth: 22, textAlign: 'center' },
  removeBtn:       { marginLeft: 4, padding: 4 },
  qtyErrText:      { fontSize: 11, color: '#ef4444', fontWeight: '600', marginTop: 2 },
  itemFileBtn:     { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    marginTop: 6, 
    borderWidth: 1, 
    borderStyle: 'dashed', 
    borderColor: '#d1d5db', 
    borderRadius: 8, 
    paddingHorizontal: 8, 
    paddingVertical: 5, 
    backgroundColor: 'rgba(255,255,255,0.6)' 
  },
  itemFileBtnTouch: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  itemFileBtnDone: { borderColor: '#22c55e', backgroundColor: 'rgba(240,253,244,0.8)' },
  itemFileBtnText: { fontSize: 11, fontWeight: '700', flex: 1 },
  priceCol:        { minWidth: 70, alignItems: 'flex-end' },
  lineTotal:       { fontSize: 12, fontWeight: '900', textAlign: 'right', lineHeight: 18 },
});
