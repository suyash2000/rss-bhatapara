// ── reject-volunteer.js ───────────────────────────────────────────────────────
const { verifyToken, unauthorized } = require('./_auth');
const owner = 'suyash2000', repo = 'rss-bhatapara', branch = 'main';

async function githubReadJSON(token, path) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github+json', 'User-Agent': 'Netlify-Function' }
  });
  if (!res.ok) throw new Error(`Fetch ${path}: ${res.statusText}`);
  const file = await res.json();
  return { data: JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')), sha: file.sha };
}
async function githubWriteJSON(token, path, sha, data, message) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json', 'User-Agent': 'Netlify-Function' },
    body: JSON.stringify({ message, content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'), sha, branch })
  });
  if (!res.ok) throw new Error(`Write ${path}: ${await res.text()}`);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const auth = verifyToken(event);
  if (!auth.valid) return unauthorized(auth.reason);
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'GITHUB_TOKEN missing' }) };
    const { id } = JSON.parse(event.body);
    const { data: pending, sha } = await githubReadJSON(githubToken, 'data/pending.json');
    const idx = pending.findIndex(v => v.id === parseInt(id));
    if (idx === -1) throw new Error(`Pending volunteer ID ${id} not found`);
    const [removed] = pending.splice(idx, 1);
    await githubWriteJSON(githubToken, 'data/pending.json', sha, pending, `Reject pending volunteer: ${removed.name}`);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: err.message }) };
  }
};
