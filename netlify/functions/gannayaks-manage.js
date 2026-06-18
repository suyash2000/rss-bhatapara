// ── gannayaks-manage.js ──────────────────────────────────────────────────────
// Handles add/edit/delete for data/gannayaks.json. Requires Bearer token.
// ─────────────────────────────────────────────────────────────────────────────

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

    const body   = JSON.parse(event.body);
    const action = body.action;   // 'add' | 'edit' | 'delete'
    const index  = body.index !== undefined ? parseInt(body.index) : -1;
    const name   = body.name ? body.name.trim() : '';

    const { data: gannayaks, sha } = await githubReadJSON(githubToken, 'data/gannayaks.json');

    if (action === 'add') {
      if (!name) throw new Error('Name cannot be empty');
      if (gannayaks.includes(name)) throw new Error('Gan-nayak already exists');
      gannayaks.push(name);
      await githubWriteJSON(githubToken, 'data/gannayaks.json', sha, gannayaks, `Add Gan-nayak: ${name}`);

    } else if (action === 'edit') {
      if (index === -1 || index >= gannayaks.length) throw new Error(`Index ${index} out of bounds`);
      if (!name) throw new Error('Name cannot be empty');
      const oldName = gannayaks[index];
      gannayaks[index] = name;
      await githubWriteJSON(githubToken, 'data/gannayaks.json', sha, gannayaks, `Edit Gan-nayak index ${index}: ${oldName} -> ${name}`);

    } else if (action === 'delete') {
      if (index === -1 || index >= gannayaks.length) throw new Error(`Index ${index} out of bounds`);
      const removed = gannayaks.splice(index, 1);
      await githubWriteJSON(githubToken, 'data/gannayaks.json', sha, gannayaks, `Delete Gan-nayak index ${index}: ${removed[0]}`);

    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true }) };

  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: err.message }) };
  }
};
