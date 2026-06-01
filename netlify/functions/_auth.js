// ── _auth.js — Shared JWT/HMAC helper for all Netlify functions ───────────────
// Uses Node.js built-in 'crypto' — no npm packages needed.
//
// Token format:  base64(JSON payload) + "." + hmac-sha256(secret, base64payload)
// Expiry:        8 hours from login
// Secret:        JWT_SECRET env var (set in Netlify Dashboard → Environment Variables)
// ─────────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');

const DEV_SECRET = 'rss-bhatapara-local-dev-only-not-for-production';

function getSecret() {
  return process.env.JWT_SECRET || DEV_SECRET;
}

/**
 * Create a signed token for a successful login.
 * @param {string} username
 * @returns {string} signed token
 */
function signToken(username) {
  const secret = getSecret();
  const payload = {
    sub: username,
    iat: Date.now(),
    exp: Date.now() + 8 * 60 * 60 * 1000   // 8 hours
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig  = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return `${data}.${sig}`;
}

/**
 * Verify a token from an Authorization header.
 * @param {object} event  Netlify event object
 * @returns {{ valid: boolean, username?: string }}
 */
function verifyToken(event) {
  const secret = getSecret();

  // Accept token from Authorization header OR from body (for local dev flexibility)
  const authHeader = (event.headers && (event.headers['authorization'] || event.headers['Authorization'])) || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return { valid: false, reason: 'No token provided' };

  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false, reason: 'Malformed token' };

  const [data, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('hex');

  // Constant-time comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
    return { valid: false, reason: 'Invalid signature' };
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
  } catch {
    return { valid: false, reason: 'Malformed payload' };
  }

  if (payload.exp < Date.now()) return { valid: false, reason: 'Token expired' };

  return { valid: true, username: payload.sub };
}

/** Standard 401 response */
function unauthorized(reason) {
  return {
    statusCode: 401,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: false, message: `Unauthorized: ${reason}` })
  };
}

module.exports = { signToken, verifyToken, unauthorized };
