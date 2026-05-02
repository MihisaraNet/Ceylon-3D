export const CATEGORIES = [
  { id: 'miniatures', name: 'Miniatures', icon: '🎮' },
  { id: 'prototypes', name: 'Prototypes', icon: '⚙️' },
  { id: 'art', name: 'Art & Decor', icon: '🎨' },
  { id: 'functional', name: 'Functional Parts', icon: '🔧' },
  { id: 'custom', name: 'Custom Orders', icon: '✨' },
];

export const STL_MATERIALS = [
  { id: 'PLA',   label: 'PLA',  desc: 'Standard, great finish',       emoji: '🟢' },
  { id: 'ABS',   label: 'ABS',  desc: 'Strong & heat resistant',      emoji: '🔴' },
  { id: 'PETG',  label: 'PETG', desc: 'Durable & flexible',           emoji: '🔵' },
  { id: 'RESIN', label: 'Resin', desc: 'Ultra-detailed prints',       emoji: '🟡' },
];

export const ORDER_STATUSES = {
  PENDING:    { label: 'Pending',    color: '#f59e0b' },
  PROCESSING: { label: 'Processing', color: '#3b82f6' },
  SHIPPED:    { label: 'Shipped',    color: '#8b5cf6' },
  DELIVERED:  { label: 'Delivered',  color: '#22c55e' },
  CANCELLED:  { label: 'Cancelled',  color: '#ef4444' },
};

export const STL_STATUSES = {
  PENDING_QUOTE: { label: 'Pending Quote', color: '#f59e0b' },
  QUOTED:        { label: 'Quoted',        color: '#3b82f6' },
  CONFIRMED:     { label: 'Confirmed',     color: '#10b981' },
  PRINTING:      { label: 'Printing',      color: '#8b5cf6' },
  READY:         { label: 'Ready',         color: '#6366f1' },
  DELIVERED:     { label: 'Delivered',     color: '#22c55e' },
  CANCELLED:     { label: 'Cancelled',     color: '#ef4444' },
};
