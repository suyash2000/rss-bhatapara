const owner = 'suyash2000';
const repo  = 'rss-bhatapara';
const branch = 'main';

const VARG_NAMES = [
  'प्रारम्भिक वर्ग',
  'प्राथमिक शिक्षा वर्ग',
  'संघ शिक्षा वर्ग',
  'कार्यकर्ता विकास वर्ग 1',
  'कार्यकर्ता विकास वर्ग 2',
];

async function updateGitHubFile({ token, path, updateFn, commitMessage }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'Netlify-Function'
  };

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.statusText}`);
  const fileData = await res.json();
  const currentContent = Buffer.from(fileData.content, 'base64').toString('utf8');

  const updatedContent = updateFn(currentContent);

  const putRes = await fetch(url, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: commitMessage,
      content: Buffer.from(updatedContent, 'utf8').toString('base64'),
      sha: fileData.sha,
      branch
    })
  });

  if (!putRes.ok) {
    const err = await putRes.text();
    throw new Error(`Failed to commit ${path}: ${err}`);
  }
  return await putRes.json();
}

// ── Helpers to find the boundaries of VARG_DATA[idx] array in the file ──────
function findVargArrayBounds(lines, vargIdx) {
  // Look for the comment marker like "// ── 0:" or "// ── 1:" etc.
  const markerRegex = new RegExp(`\\/\\/\\s*──\\s*${vargIdx}:`);
  let markerLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (markerRegex.test(lines[i])) { markerLine = i; break; }
  }
  if (markerLine === -1) throw new Error(`Marker for VARG_DATA[${vargIdx}] not found`);

  // Find opening '[' after the marker
  let openBracket = -1;
  for (let i = markerLine; i < lines.length; i++) {
    if (lines[i].trim() === '[') { openBracket = i; break; }
  }
  if (openBracket === -1) throw new Error(`Opening bracket for VARG_DATA[${vargIdx}] not found`);

  // Find the matching closing '],' or ']'
  let closeBracket = -1;
  for (let i = openBracket + 1; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t === '],' || t === ']') { closeBracket = i; break; }
  }
  if (closeBracket === -1) throw new Error(`Closing bracket for VARG_DATA[${vargIdx}] not found`);

  return { openBracket, closeBracket };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Method Not Allowed' }) };
  }

  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Server not configured: GITHUB_TOKEN missing.' }) };
    }

    const data = JSON.parse(event.body);
    const action   = data.action;   // 'add' | 'edit' | 'delete'
    const vargIdx  = parseInt(data.vargIdx);  // 0–4
    const entryIdx = data.entryIdx !== undefined ? parseInt(data.entryIdx) : -1;

    if (isNaN(vargIdx) || vargIdx < 0 || vargIdx > 4) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Invalid vargIdx' }) };
    }

    let commitMessage = '';
    if (action === 'add')    commitMessage = `Add entry to ${VARG_NAMES[vargIdx]} (via admin)`;
    if (action === 'edit')   commitMessage = `Edit entry in ${VARG_NAMES[vargIdx]} (via admin)`;
    if (action === 'delete') commitMessage = `Delete entry from ${VARG_NAMES[vargIdx]} (via admin)`;

    await updateGitHubFile({
      token,
      path: 'js/varg-data.js',
      commitMessage,
      updateFn: (content) => {
        const lines = content.split('\n');
        const { openBracket, closeBracket } = findVargArrayBounds(lines, vargIdx);

        if (action === 'add') {
          const { name, mobile, session, sthal } = data;
          const newLine = `    { name:'${name}', mobile:'${mobile}', session:'${session}', sthal:'${sthal}' },`;
          lines.splice(closeBracket, 0, newLine);

        } else if (action === 'edit') {
          // Find the entryIdx-th data line between openBracket and closeBracket
          let count = 0;
          for (let i = openBracket + 1; i < closeBracket; i++) {
            if (lines[i].trim().startsWith('{')) {
              if (count === entryIdx) {
                const { name, mobile, session, sthal } = data;
                lines[i] = `    { name:'${name}', mobile:'${mobile}', session:'${session}', sthal:'${sthal}' },`;
                break;
              }
              count++;
            }
          }

        } else if (action === 'delete') {
          let count = 0;
          for (let i = openBracket + 1; i < closeBracket; i++) {
            if (lines[i].trim().startsWith('{')) {
              if (count === entryIdx) {
                lines.splice(i, 1);
                break;
              }
              count++;
            }
          }

        } else {
          throw new Error(`Unknown action: ${action}`);
        }

        return lines.join('\n');
      }
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: err.message })
    };
  }
};
