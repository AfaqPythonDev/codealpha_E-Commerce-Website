const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../dbHelper');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// POST - Create a new order (Authenticated user)
router.post('/', authenticateToken, (req, res) => {
  const { items, shippingAddress, paymentMethod, couponCode, subtotal, shippingCost, discountAmount, total } = req.body;
  const userId = req.user.id;
  const userName = req.user.name;

  if (!items || !items.length || !shippingAddress || !paymentMethod) {
    return res.status(400).json({ success: false, message: 'Missing order details (items, address, or payment method).' });
  }

  // Load database files
  const products = readData('products.json');
  const orders = readData('orders.json');

  // Verify and update stock
  for (const item of items) {
    const dbProduct = products.find(p => p.id === item.productId);
    if (!dbProduct) {
      return res.status(400).json({ success: false, message: `Product ${item.name} not found.` });
    }
    if (dbProduct.stock < item.quantity) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient stock for ${dbProduct.name}. Only ${dbProduct.stock} left in stock.` 
      });
    }
    // Decrement stock
    dbProduct.stock -= item.quantity;
  }

  // Generate order metadata
  const orderId = 'NC' + Math.floor(100000 + Math.random() * 900000);
  const newOrder = {
    id: orderId,
    userId,
    userName,
    items,
    shippingAddress,
    paymentMethod,
    couponCode: couponCode || null,
    subtotal: parseFloat(subtotal),
    shippingCost: parseFloat(shippingCost),
    discountAmount: parseFloat(discountAmount || 0),
    total: parseFloat(total),
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  orders.push(newOrder);

  // Commit changes to both orders and products
  writeData('products.json', products);
  writeData('orders.json', orders);

  return res.status(201).json({ 
    success: true, 
    message: 'Order placed successfully!', 
    order: newOrder 
  });
});

// GET - Retrieve all orders for the current user
router.get('/user', authenticateToken, (req, res) => {
  const orders = readData('orders.json');
  const userOrders = orders.filter(o => o.userId === req.user.id);
  
  // Sort user orders by date descending (latest first)
  userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return res.json(userOrders);
});

// GET - Retrieve all orders in system (Admin Only)
router.get('/', requireAdmin, (req, res) => {
  const orders = readData('orders.json');
  
  // Sort all orders by date descending (latest first)
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return res.json(orders);
});

// PUT - Update order status (Admin Only)
router.put('/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid or missing status.' });
  }

  const orders = readData('orders.json');
  const index = orders.findIndex(o => o.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  // If status is being cancelled, return the stock to inventory!
  const currentStatus = orders[index].status;
  if (status === 'Cancelled' && currentStatus !== 'Cancelled') {
    const products = readData('products.json');
    for (const item of orders[index].items) {
      const dbProduct = products.find(p => p.id === item.productId);
      if (dbProduct) {
        dbProduct.stock += item.quantity;
      }
    }
    writeData('products.json', products);
  }

  orders[index].status = status;
  writeData('orders.json', orders);

  return res.json({ 
    success: true, 
    message: `Order status updated to ${status} successfully!`, 
    order: orders[index] 
  });
});

// PUT - Cancel pending order (Authenticated User cancels their own order)
router.put('/:id/cancel', authenticateToken, (req, res) => {
  const orders = readData('orders.json');
  const index = orders.findIndex(o => o.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  const order = orders[index];

  // Verify that this order belongs to the user
  if (order.userId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized to cancel this order.' });
  }

  // Verify order is pending
  if (order.status !== 'Pending') {
    return res.status(400).json({ success: false, message: `Only pending orders can be cancelled. Current status is ${order.status}.` });
  }

  // Restore inventory stock
  const products = readData('products.json');
  for (const item of order.items) {
    const dbProduct = products.find(p => p.id === item.productId);
    if (dbProduct) {
      dbProduct.stock += item.quantity;
    }
  }
  writeData('products.json', products);

  // Set status
  order.status = 'Cancelled';
  orders[index] = order;
  writeData('orders.json', orders);

  return res.json({ 
    success: true, 
    message: 'Order cancelled successfully and funds/stock returned.', 
    order 
  });
});

module.exports = router;
