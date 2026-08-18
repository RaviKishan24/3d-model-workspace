const User = require('../models/User');
const {
  signToken,
  setAuthCookie,
  clearAuthCookie,
} = require('../services/authService');

/** POST /api/auth/register */
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() }).lean();
    if (existing) {
      const err = new Error('An account with this email already exists');
      err.statusCode = 409;
      throw err;
    }

    // Password hashing happens in the User pre-save hook (bcrypt, 12 rounds).
    const user = await User.create({ name, email, password });
    const token = signToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: 'Account created',
      data: { user: user.toPublicJSON() },
    });
  } catch (err) {
    return next(err);
  }
}

/** POST /api/auth/login */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    // Same message for unknown email and wrong password (no account enumeration).
    if (!user || !(await user.comparePassword(password))) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.json({
      success: true,
      message: 'Signed in',
      data: { user: user.toPublicJSON() },
    });
  } catch (err) {
    return next(err);
  }
}

/** POST /api/auth/logout */
async function logout(req, res) {
  clearAuthCookie(res);
  return res.json({ success: true, message: 'Signed out' });
}

/** GET /api/auth/me */
async function me(req, res) {
  return res.json({ success: true, data: { user: req.user } });
}

module.exports = { register, login, logout, me };
