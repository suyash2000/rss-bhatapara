// ── login.js ─────────────────────────────────────────────────────────────────
// Returns a signed HMAC token on successful login.
// Client stores token in sessionStorage and sends it as Bearer on every API call.
// ─────────────────────────────────────────────────────────────────────────────

const { signToken } = require('./_auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { username, password } = JSON.parse(event.body);

    const validUser = process.env.ADMIN_USERNAME || 'admin';
    const validPass = process.env.ADMIN_PASSWORD;

    if (!validPass) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Server not configured: ADMIN_PASSWORD missing' }),
      };
    }

    if (username === validUser && password === validPass) {
      const token = signToken(username);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, token }),
      };
    }

    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Invalid credentials' }),
    };

  } catch (err) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Bad request' }),
    };
  }
};
