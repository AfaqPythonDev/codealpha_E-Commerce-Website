const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../dbHelper');
const { requireAdmin } = require('../middleware/auth');

// GET - Validate coupon code
router.get('/validate', (req, res) => {
  const { code, subtotal } = req.query;

  if (!code) {
    return res.status(400).json({ success: false, message: 'Coupon code is required.' });
  }

  const coupons = readData('coupons.json');
  const coupon = coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase());

  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Invalid coupon code.' });
  }

  if (!coupon.active) {
    return res.status(400).json({ success: false, message: 'This coupon is no longer active.' });
  }

  const currentSubtotal = parseFloat(subtotal || 0);
  if (coupon.minPurchase && currentSubtotal < coupon.minPurchase) {
    return res.status(400).json({ 
      success: false, 
      message: `Minimum purchase of $${coupon.minPurchase.toFixed(2)} required to use this coupon.` 
    });
  }

  return res.json({
    success: true,
    message: 'Coupon applied successfully!',
    coupon: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value
    }
  });
});

// GET - List all coupons (Admin Only)
router.get('/', requireAdmin, (req, res) => {
  const coupons = readData('coupons.json');
  return res.json(coupons);
});

// POST - Create coupon (Admin Only)
router.post('/', requireAdmin, (req, res) => {
  const { code, type, value, minPurchase, active } = req.body;

  if (!code || !type || value === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required coupon details (code, type, value).' });
  }

  const coupons = readData('coupons.json');
  const codeExists = coupons.some(c => c.code.toUpperCase() === code.trim().toUpperCase());

  if (codeExists) {
    return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
  }

  const newCoupon = {
    id: 'c_' + Date.now(),
    code: code.trim().toUpperCase(),
    type, // 'percentage' or 'fixed'
    value: parseFloat(value),
    minPurchase: parseFloat(minPurchase || 0),
    active: active !== undefined ? active : true
  };

  coupons.push(newCoupon);
  writeData('coupons.json', coupons);

  return res.status(201).json({ success: true, message: 'Coupon created successfully!', coupon: newCoupon });
});

// DELETE - Remove a coupon (Admin Only)
router.delete('/:id', requireAdmin, (req, res) => {
  const coupons = readData('coupons.json');
  const filtered = coupons.filter(c => c.id !== req.params.id);

  if (coupons.length === filtered.length) {
    return res.status(404).json({ success: false, message: 'Coupon not found.' });
  }

  writeData('coupons.json', filtered);
  return res.json({ success: true, message: 'Coupon deleted successfully!' });
});

module.exports = router;
