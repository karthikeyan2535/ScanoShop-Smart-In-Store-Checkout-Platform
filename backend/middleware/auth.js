const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');

/**
 * Middleware to verify JWT token
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return sendError(res, 'Access denied. No token provided.', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return sendError(res, 'Invalid or expired token.', 401);
  }
};

/**
 * Middleware to restrict access by role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, 'Forbidden. Insufficient permissions.', 403);
    }
    next();
  };
};

module.exports = { authenticate, authorize };
