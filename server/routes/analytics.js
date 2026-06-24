const express = require('express');
const router = express.Router();
const { readData } = require('../dbHelper');
const { requireAdmin } = require('../middleware/auth');

// GET - Analytics KPIs (Admin Only)
router.get('/kpis', requireAdmin, (req, res) => {
  const products = readData('products.json');
  const orders = readData('orders.json');
  const users = readData('users.json');

  // Filter out cancelled orders for revenue/sales KPIs
  const validOrders = orders.filter(o => o.status !== 'Cancelled');

  // Total Revenue
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);

  // Total Sales Count
  const totalSalesCount = validOrders.length;

  // Active user count
  const customerCount = users.filter(u => u.role !== 'admin').length;

  // Product Count
  const productCount = products.length;

  // Sales by Category
  const categorySales = {};
  validOrders.forEach(order => {
    order.items.forEach(item => {
      // Find item in products database to get its category, or fallback to item's category property if it exists
      const dbProduct = products.find(p => p.id === item.productId);
      const cat = dbProduct ? dbProduct.category : 'General';
      
      const itemRevenue = item.price * item.quantity;
      categorySales[cat] = (categorySales[cat] || 0) + itemRevenue;
    });
  });

  // Recent order list for dashboard overview (latest 5)
  const recentOrders = orders.slice(-5).reverse().map(o => ({
    id: o.id,
    userName: o.userName,
    total: o.total,
    status: o.status,
    createdAt: o.createdAt
  }));

  // Simple daily revenue breakdown for a line chart (mocking dates based on order creation)
  const salesHistory = {};
  validOrders.forEach(o => {
    const dateStr = new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    salesHistory[dateStr] = (salesHistory[dateStr] || 0) + o.total;
  });

  const chartData = Object.keys(salesHistory).map(date => ({
    date,
    amount: parseFloat(salesHistory[date].toFixed(2))
  })).slice(-7); // Keep last 7 active days

  return res.json({
    success: true,
    kpis: {
      revenue: parseFloat(totalRevenue.toFixed(2)),
      salesCount: totalSalesCount,
      customers: customerCount,
      products: productCount
    },
    categorySales,
    recentOrders,
    chartData
  });
});

module.exports = router;
