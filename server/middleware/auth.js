const jwt = require('jsonwebtoken');
const JWT_SECRET = 'novacart-secret-key-2026';

// Middleware to authenticate any logged in user
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
}

// Middleware to authorize admin only
function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
    }
  });
}

module.exports = {
  authenticateToken,
  requireAdmin,
  JWT_SECRET
};
