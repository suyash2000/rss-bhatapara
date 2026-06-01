// ── add-volunteer.js ─────────────────────────────────────────────────────────
// Adds a volunteer to data/volunteers.json (admin) or data/pending.json (public).
// Protected: requires valid Bearer token for admin path.
// ─────────────────────────────────────────────────────────────────────────────

const { verifyToken, unauthorized } = require('./_auth');

const owner  = 'suyash2000';
const repo   = 'rss-bhatapara';
const branch = 'main';

async function githubReadJSON(token, path) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github+json', 'User-Agent': 'Netlify-Function' }
  });
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.statusText}`);
  const file = await res.json();
  return { data: JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')), sha: file.sha };
}

async function githubWriteJSON(token, path, sha, data, message) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json', 'User-Agent': 'Netlify-Function' },
    body: JSON.stringify({ message, content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'), sha, branch })
  });
  if (!res.ok) throw new Error(`Failed to write ${path}: ${await res.text()}`);
  return res.json();
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Method Not Allowed' }) };
  }

  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'GITHUB_TOKEN missing' }) };

    const body = JSON.parse(event.body);
    const isAdmin = body.isAdmin === true;

    // Admin path requires a valid JWT
    if (isAdmin) {
      const auth = verifyToken(event);
      if (!auth.valid) return unauthorized(auth.reason);
    }

    // Validate required fields
    const required = ['name', 'contact', 'shakha', 'role', 'area', 'joining_year', 'blood_group', 'ganvesh'];
    for (const f of required) {
      if (!body[f]) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: `Missing field: ${f}` }) };
    }

    const vyavsay = body.spec_vyavsay ? `${body.vyavsay} (${body.spec_vyavsay})` : (body.vyavsay || '');

    if (isAdmin) {
      const { data: volunteers, sha } = await githubReadJSON(githubToken, 'data/volunteers.json');
      const maxId = volunteers.reduce((m, v) => Math.max(m, v.id || 0), 0);
      volunteers.push({
        id: maxId + 1,
        name: body.name, basti: body.basti || '', area: body.area,
        shakha: body.shakha, role: body.role, joining_year: body.joining_year,
        contact: body.contact, blood_group: body.blood_group,
        vyavsay, gannayak: body.gannayak || '', ganvesh: body.ganvesh
      });
      await githubWriteJSON(githubToken, 'data/volunteers.json', sha, volunteers, `Add volunteer: ${body.name}`);
    } else {
      const { data: pending, sha } = await githubReadJSON(githubToken, 'data/pending.json');
      const maxId = pending.reduce((m, v) => Math.max(m, v.id || 0), 0);
      pending.push({
        id: maxId + 1,
        name: body.name, basti: body.basti || '', area: body.area,
        shakha: body.shakha, role: body.role, joining_year: body.joining_year,
        contact: body.contact, blood_group: body.blood_group,
        vyavsay, gannayak: body.gannayak || '', ganvesh: body.ganvesh
      });
      await githubWriteJSON(githubToken, 'data/pending.json', sha, pending, `Add pending registration: ${body.name}`);
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true }) };

  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: err.message }) };
  }
};
