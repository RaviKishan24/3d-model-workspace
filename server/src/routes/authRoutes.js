const express = require('express');
const { body } = require('express-validator');
const { register, login, logout, me } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be at least 8 characters'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== undefined && value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  ],
  validate,
  register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post('/logout', logout);
router.get('/me', protect, me);

module.exports = router;
