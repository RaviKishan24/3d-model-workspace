const rateLimit = require('express-rate-limit');

/**
 * Auth endpoints are the most abused surface, so they get a tight limit.
 * Behind an ALB, `trust proxy` (set in server.js) makes req.ip the real client IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Upload limit reached. Please try again later.' },
});

module.exports = { authLimiter, apiLimiter, uploadLimiter };
