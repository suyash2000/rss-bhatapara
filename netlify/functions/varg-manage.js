// ── varg-manage.js ───────────────────────────────────────────────────────────
// Handles add/edit/delete for data/varg.json (training records). Requires Bearer token.
// ─────────────────────────────────────────────────────────────────────────────

const { verifyToken, unauthorized } = require('./_auth');
const owner = 'suyash2000', repo = 'rss-bhatapara', branch = 'main';

const VARG_NAMES = [
  'प्रारम्भिक वर्ग',
  'प्राथमिक शिक्षा वर्ग',
  'संघ शिक्षा वर्ग',
  'कार्यकर्ता विकास वर्ग 1',
  'कार्यकर्ता विकास वर्ग 2',
];

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

    const body = JSON.parse(event.body);
    const action = body.action; // 'add' | 'edit' | 'delete'
    const vargIdx = parseInt(body.vargIdx); // 0–4
    const entryIdx = body.entryIdx !== undefined ? parseInt(body.entryIdx) : -1;

    if (isNaN(vargIdx) || vargIdx < 0 || vargIdx > 4) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Invalid vargIdx' }) };
    }

    const { data: vargData, sha } = await githubReadJSON(githubToken, 'data/varg.json');

    let commitMessage = '';
    const name = body.name || '';
    const mobile = body.mobile || '';
    const session = body.session || '';
    const sthal = body.sthal || '';

    if (action === 'add') {
      commitMessage = `Add entry to ${VARG_NAMES[vargIdx]} (via admin)`;
      vargData[vargIdx].push({ name, mobile, session, sthal });
      await githubWriteJSON(githubToken, 'data/varg.json', sha, vargData, commitMessage);

    } else if (action === 'edit') {
      if (entryIdx < 0 || entryIdx >= vargData[vargIdx].length) {
        throw new Error(`Invalid entryIdx ${entryIdx}`);
      }
      commitMessage = `Edit entry in ${VARG_NAMES[vargIdx]} (via admin)`;
      vargData[vargIdx][entryIdx] = { name, mobile, session, sthal };
      await githubWriteJSON(githubToken, 'data/varg.json', sha, vargData, commitMessage);

    } else if (action === 'delete') {
      if (entryIdx < 0 || entryIdx >= vargData[vargIdx].length) {
        throw new Error(`Invalid entryIdx ${entryIdx}`);
      }
      commitMessage = `Delete entry from ${VARG_NAMES[vargIdx]} (via admin)`;
      vargData[vargIdx].splice(entryIdx, 1);
      await githubWriteJSON(githubToken, 'data/varg.json', sha, vargData, commitMessage);

    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true }) };

  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: err.message }) };
  }
};
