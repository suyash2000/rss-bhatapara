const owner = 'suyash2000';
const repo  = 'rss-bhatapara';
const branch = 'main';

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

function findEventsArrayBounds(lines) {
  let openBracket = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const EVENTS_DATA = [')) { openBracket = i; break; }
  }
  if (openBracket === -1) throw new Error(`Opening bracket for EVENTS_DATA not found`);

  let closeBracket = -1;
  for (let i = openBracket + 1; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t === '];') { closeBracket = i; break; }
  }
  if (closeBracket === -1) throw new Error(`Closing bracket for EVENTS_DATA not found`);

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
    const action = data.action;   // 'add' | 'edit' | 'delete'
    const id     = data.id !== undefined ? parseInt(data.id) : -1;

    let commitMessage = '';
    if (action === 'add')    commitMessage = `Add event (via admin)`;
    if (action === 'edit')   commitMessage = `Edit event ID ${id} (via admin)`;
    if (action === 'delete') commitMessage = `Delete event ID ${id} (via admin)`;

    await updateGitHubFile({
      token,
      path: 'js/shared.js',
      commitMessage,
      updateFn: (content) => {
        const lines = content.split('\n');
        const { openBracket, closeBracket } = findEventsArrayBounds(lines);

        if (action === 'add') {
          // Find max ID in block
          let maxId = 0;
          for (let i = openBracket + 1; i < closeBracket; i++) {
            const m = lines[i].match(/id:\s*(\d+)/);
            if (m) {
              const idVal = parseInt(m[1]);
              if (idVal > maxId) maxId = idVal;
            }
          }
          const newId = maxId + 1;
          const { title, date, time, location, type, description, status } = data;
          const newLine = `  { id:${newId}, title:'${title}', date:'${date}', time:'${time}', location:'${location}', type:'${type}', description:'${description}', status:'${status}' },`;
          lines.splice(closeBracket, 0, newLine);

        } else if (action === 'edit') {
          let updated = false;
          for (let i = openBracket + 1; i < closeBracket; i++) {
            if (lines[i].includes(`id:${id},`) || lines[i].includes(`id: ${id},`) || new RegExp(`\\bid:\\s*${id}\\b`).test(lines[i])) {
              const { title, date, time, location, type, description, status } = data;
              lines[i] = `  { id:${id}, title:'${title}', date:'${date}', time:'${time}', location:'${location}', type:'${type}', description:'${description}', status:'${status}' },`;
              updated = true;
              break;
            }
          }
          if (!updated) throw new Error(`Event with ID ${id} not found to edit`);

        } else if (action === 'delete') {
          let deleted = false;
          for (let i = openBracket + 1; i < closeBracket; i++) {
            if (lines[i].includes(`id:${id},`) || lines[i].includes(`id: ${id},`) || new RegExp(`\\bid:\\s*${id}\\b`).test(lines[i])) {
              lines.splice(i, 1);
              deleted = true;
              break;
            }
          }
          if (!deleted) throw new Error(`Event with ID ${id} not found to delete`);

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
