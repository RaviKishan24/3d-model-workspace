const jwt = require('jsonwebtoken');

const TOKEN_COOKIE = 'access_token';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return secret;
}

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), email: user.email }, getSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true, // not readable from JavaScript -> mitigates XSS token theft
    secure: isProd, // HTTPS only in production
    sameSite: isProd ? 'none' : 'lax', // 'none' allows CloudFront frontend -> ALB API
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
    ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
  };
}

function setAuthCookie(res, token) {
  res.cookie(TOKEN_COOKIE, token, cookieOptions());
}

function clearAuthCookie(res) {
  const { maxAge, ...opts } = cookieOptions();
  res.clearCookie(TOKEN_COOKIE, opts);
}

module.exports = {
  TOKEN_COOKIE,
  signToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
};
