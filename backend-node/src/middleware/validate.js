/**
 * validate.js — Reusable validation middleware for Express routes.
 *
 * Usage:
 *   const { body, validationResult } = require('express-validator');
 *   router.post('/', validate([body('email').isEmail()...]), handler);
 *
 * Or use the plain helpers below without express-validator.
 */

/* ── Pure helper functions ─────────────────────────────── */

const isEmail   = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());
const isPhone   = (v) => /^\+?[0-9\s\-().]{7,20}$/.test(String(v || '').trim());
const isStrongPw= (v) => String(v).length >= 8 && /[A-Z]/.test(v) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v);

/* ── Auth validation ───────────────────────────────────── */

const validateRegister = (req, res, next) => {
  const { fullName, email, password } = req.body;
  const errors = {};

  if (!fullName || String(fullName).trim().length < 2)
    errors.fullName = 'Full name must be at least 2 characters';
  if (!email || !isEmail(email))
    errors.email    = 'Please enter a valid email address';
  if (!password)
    errors.password = 'Password is required';
  else if (String(password).length < 8)
    errors.password = 'Password must be at least 8 characters';
  else if (!/[A-Z]/.test(password))
    errors.password = 'Password must contain at least one uppercase letter';
  else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
    errors.password = 'Password must contain at least one special character';

  if (Object.keys(errors).length)
    return res.status(400).json({ error: Object.values(errors)[0], errors });
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = {};

  if (!email || !isEmail(email))  errors.email    = 'Please enter a valid email address';
  if (!password)                   errors.password = 'Password is required';

  if (Object.keys(errors).length)
    return res.status(400).json({ error: Object.values(errors)[0], errors });
  next();
};

/* ── Product validation ─────────────────────────────────── */

const validateProduct = (req, res, next) => {
  const { name, price, stock } = req.body;
  const errors = {};

  if (!name || String(name).trim().length < 2)
    errors.name  = 'Product name must be at least 2 characters';
  if (name && String(name).trim().length > 120)
    errors.name  = 'Product name must be 120 characters or less';

  const p = parseFloat(price);
  if (price == null || price === '' || isNaN(p))
    errors.price = 'Price is required';
  else if (p < 0)
    errors.price = 'Price cannot be negative';
  else if (p > 10_000_000)
    errors.price = 'Price seems unrealistically high';

  if (stock !== undefined && stock !== '') {
    const s = parseInt(stock, 10);
    if (isNaN(s) || s < 0)
      errors.stock = 'Stock must be a non-negative integer';
    else if (s > 100_000)
      errors.stock = 'Stock cannot exceed 100,000 units';
  }

  if (Object.keys(errors).length)
    return res.status(400).json({ error: Object.values(errors)[0], errors });
  next();
};

/* ── Order validation ───────────────────────────────────── */

const validateOrder = (req, res, next) => {
  const { shippingAddress, items } = req.body;
  const errors = {};

  if (!shippingAddress || String(shippingAddress).trim().length < 10)
    errors.shippingAddress = 'Please provide a complete shipping address';

  if (!Array.isArray(items) || items.length === 0)
    errors.items = 'Order must contain at least one item';

  if (Array.isArray(items)) {
    for (const [i, item] of items.entries()) {
      const qty = Number(item.quantity);
      const price = Number(item.unitPrice ?? item.price);
      if (!item.productName || String(item.productName).trim() === '')
        errors[`items[${i}].productName`] = `Item ${i + 1}: product name is required`;
      if (!Number.isInteger(qty) || qty < 1)
        errors[`items[${i}].quantity`] = `Item ${i + 1}: quantity must be a positive integer`;
      if (isNaN(price) || price < 0)
        errors[`items[${i}].price`] = `Item ${i + 1}: invalid price`;
    }
  }

  if (Object.keys(errors).length)
    return res.status(400).json({ error: Object.values(errors)[0], errors });
  next();
};

/* ── Cart validation ─────────────────────────────────────── */

const validateAddToCart = (req, res, next) => {
  const { productId, quantity } = req.body;
  const errors = {};

  if (!productId || String(productId).trim() === '')
    errors.productId = 'productId is required';

  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1)
    errors.quantity = 'Quantity must be a positive integer';
  else if (qty > 99)
    errors.quantity = 'Maximum quantity per item is 99';

  if (Object.keys(errors).length)
    return res.status(400).json({ error: Object.values(errors)[0], errors });
  next();
};

/* ── STL Order validation ───────────────────────────────── */

const validateStlOrder = (req, res, next) => {
  const { name, email, phone, address, material, quantity } = req.body;
  const errors = {};

  if (!name || String(name).trim().length < 2)
    errors.name = 'Full name must be at least 2 characters';
  if (!email || !isEmail(email))
    errors.email = 'Please enter a valid email address';
  if (!phone || !isPhone(phone))
    errors.phone = 'Please enter a valid phone number';
  if (!address || String(address).trim().length < 10)
    errors.address = 'Please enter a complete delivery address';

  const VALID_MATERIALS = ['PLA', 'ABS', 'PETG', 'RESIN'];
  if (!material || !VALID_MATERIALS.includes(String(material).toUpperCase()))
    errors.material = `Material must be one of: ${VALID_MATERIALS.join(', ')}`;

  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1)
    errors.quantity = 'Quantity must be a positive integer';
  else if (qty > 1000)
    errors.quantity = 'Quantity cannot exceed 1,000 units per order';

  if (Object.keys(errors).length)
    return res.status(400).json({ error: Object.values(errors)[0], errors });
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateProduct,
  validateOrder,
  validateAddToCart,
  validateStlOrder,
  // helpers for use in controllers
  isEmail,
  isPhone,
  isStrongPw,
};
