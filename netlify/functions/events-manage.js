// ── events-manage.js ──────────────────────────────────────────────────────────
// Handles add/edit/delete for data/events.json. Requires Bearer token.
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
    const id     = body.id !== undefined ? parseInt(body.id) : -1;

    const { data: events, sha } = await githubReadJSON(githubToken, 'data/events.json');

    if (action === 'add') {
      const maxId = events.reduce((m, e) => Math.max(m, e.id || 0), 0);
      events.push({ id: maxId + 1, title: body.title, date: body.date, time: body.time, location: body.location, type: body.type, description: body.description, status: body.status });
      await githubWriteJSON(githubToken, 'data/events.json', sha, events, `Add event: ${body.title}`);

    } else if (action === 'edit') {
      const idx = events.findIndex(e => e.id === id);
      if (idx === -1) throw new Error(`Event ID ${id} not found`);
      events[idx] = { id, title: body.title, date: body.date, time: body.time, location: body.location, type: body.type, description: body.description, status: body.status };
      await githubWriteJSON(githubToken, 'data/events.json', sha, events, `Edit event ID ${id}: ${body.title}`);

    } else if (action === 'delete') {
      const idx = events.findIndex(e => e.id === id);
      if (idx === -1) throw new Error(`Event ID ${id} not found`);
      const [removed] = events.splice(idx, 1);
      await githubWriteJSON(githubToken, 'data/events.json', sha, events, `Delete event ID ${id}: ${removed.title}`);

    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true }) };

  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: err.message }) };
  }
};
