const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./server/routes/auth');
const productRoutes = require('./server/routes/products');
const orderRoutes = require('./server/routes/orders');
const couponRoutes = require('./server/routes/coupons');
const analyticsRoutes = require('./server/routes/analytics');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'client')));

// Bind API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/analytics', analyticsRoutes);

// Temporary Diagnostic Route for Vercel Paths
app.get('/api/debug-paths', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  try {
    const debugInfo = {
      cwd: process.cwd(),
      __dirname: __dirname,
      filesInCwd: fs.existsSync(process.cwd()) ? fs.readdirSync(process.cwd()) : [],
      serverExists: fs.existsSync(path.join(process.cwd(), 'server')),
      serverDataExists: fs.existsSync(path.join(process.cwd(), 'server', 'data')),
    };
    if (debugInfo.serverExists) {
      debugInfo.filesInServer = fs.readdirSync(path.join(process.cwd(), 'server'));
    }
    if (debugInfo.serverDataExists) {
      debugInfo.filesInServerData = fs.readdirSync(path.join(process.cwd(), 'server', 'data'));
    }
    return res.json(debugInfo);
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Fallback path to serve homepage if someone accesses random routes
app.get('*', (req, res) => {
  // If request is looking for an API path but it didn't match any route, return 404 JSON
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found.' });
  }
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Start listening
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  NovaCart Server running successfully on port ${PORT}`);
  console.log(`  Local URL: http://localhost:${PORT}`);
  console.log(`==================================================`);
});
