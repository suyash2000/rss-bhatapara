// ── approve-volunteer.js ──────────────────────────────────────────────────────
// Moves a volunteer from data/pending.json to data/volunteers.json.
// Requires valid Bearer token.
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

  const auth = verifyToken(event);
  if (!auth.valid) return unauthorized(auth.reason);

  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'GITHUB_TOKEN missing' }) };

    const { id } = JSON.parse(event.body);
    const pendingId = parseInt(id);

    // Read both files
    const { data: pending, sha: pendingSha }     = await githubReadJSON(githubToken, 'data/pending.json');
    const { data: volunteers, sha: volsSha }     = await githubReadJSON(githubToken, 'data/volunteers.json');

    const idx = pending.findIndex(v => v.id === pendingId);
    if (idx === -1) throw new Error(`Pending volunteer ID ${pendingId} not found`);

    const volunteer = pending.splice(idx, 1)[0];
    const maxId = volunteers.reduce((m, v) => Math.max(m, v.id || 0), 0);
    volunteer.id = maxId + 1;
    volunteers.push(volunteer);

    // Write both files
    await githubWriteJSON(githubToken, 'data/pending.json',    pendingSha, pending,    `Approve volunteer: ${volunteer.name} (removed from pending)`);
    await githubWriteJSON(githubToken, 'data/volunteers.json', volsSha,    volunteers, `Approve volunteer: ${volunteer.name} (added to active)`);

    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true }) };

  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: err.message }) };
  }
};
