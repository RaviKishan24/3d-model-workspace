const { verifyToken, TOKEN_COOKIE } = require('../services/authService');
const User = require('../models/User');

/**
 * Verifies the JWT from the HTTP-only cookie (preferred) or the
 * Authorization header, then attaches the user document to req.user.
 * Stateless: no server-side session, so any EC2 instance can serve any request.
 */
async function protect(req, res, next) {
  try {
    let token = req.cookies ? req.cookies[TOKEN_COOKIE] : null;

    if (!token) {
      const header = req.headers.authorization || '';
      if (header.startsWith('Bearer ')) token = header.slice(7);
    }

    if (!token) {
      const err = new Error('Not authenticated');
      err.statusCode = 401;
      throw err;
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.sub).lean();

    if (!user) {
      const err = new Error('Account no longer exists');
      err.statusCode = 401;
      throw err;
    }

    req.user = { id: user._id.toString(), name: user.name, email: user.email };
    return next();
  } catch (err) {
    if (!err.statusCode) err.statusCode = 401;
    return next(err);
  }
}

module.exports = { protect };
