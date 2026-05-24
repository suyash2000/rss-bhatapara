const owner = 'suyash2000';
const repo = 'rss-bhatapara';
const branch = 'main';

async function updateGitHubFile({ token, path, updateFn, commitMessage }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'Netlify-Function'
  };
  
  // 1. Get current file content & sha
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path} from GitHub: ${res.statusText}`);
  }
  const fileData = await res.json();
  const currentContent = Buffer.from(fileData.content, 'base64').toString('utf8');
  
  // 2. Compute updated content
  const updatedContent = updateFn(currentContent);
  
  // 3. Commit back to GitHub
  const putRes = await fetch(url, {
    method: 'PUT',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: commitMessage,
      content: Buffer.from(updatedContent, 'utf8').toString('base64'),
      sha: fileData.sha,
      branch: branch
    })
  });
  
  if (!putRes.ok) {
    const errorText = await putRes.text();
    throw new Error(`Failed to commit ${path} to GitHub: ${errorText}`);
  }
  
  return await putRes.json();
}

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Method Not Allowed' })
    };
  }
  
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Server not configured: GITHUB_TOKEN environment variable is missing.' })
      };
    }
    
    const data = JSON.parse(event.body);
    const isAdmin = data.isAdmin === true;
    
    // Format occupation details if present
    let vyavsayField = data.vyavsay;
    if (data.spec_vyavsay) {
      vyavsayField = `${data.vyavsay} (${data.spec_vyavsay})`;
    }
    
    if (isAdmin) {
      // ── 1. Update shared.js (VOLUNTEERS_DATA) ──────────────────────────────────
      await updateGitHubFile({
        token: token,
        path: 'js/shared.js',
        commitMessage: `Add volunteer ${data.name} (via production admin form)`,
        updateFn: (content) => {
          const match = content.match(/const VOLUNTEERS_DATA = \[(.*?)\];/s);
          let volunteersBlock = match ? match[1] : content;
          
          const idRegex = /id:\s*(\d+)/g;
          let maxId = 15;
          let m;
          while ((m = idRegex.exec(volunteersBlock)) !== null) {
            const idVal = parseInt(m[1]);
            if (idVal > maxId) maxId = idVal;
          }
          const nextId = maxId + 1;
          
          const jsLine = `  { id:${nextId},  name:'${data.name}',      basti:'${data.basti}',          area:'${data.area}',             shakha:'${data.shakha}',   role:'${data.role}',    joining_year:'${data.joining_year}', contact:'${data.contact}', blood_group:'${data.blood_group}',  vyavsay:'${vyavsayField}', gannayak:'${data.gannayak}', ganvesh:'${data.ganvesh}' },`;
          
          const lines = content.split('\n');
          let insertIndex = -1;
          let foundBlock = false;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('const VOLUNTEERS_DATA = [')) {
              foundBlock = true;
            }
            if (foundBlock && lines[i].trim() === '];') {
              insertIndex = i;
              break;
            }
          }
          
          if (insertIndex !== -1) {
            lines.splice(insertIndex, 0, jsLine);
            return lines.join('\n');
          }
          throw new Error("Could not find closing bracket of VOLUNTEERS_DATA in shared.js");
        }
      });
      
      // ── 2. Update volunteers.csv ────────────────────────────────────────────
      await updateGitHubFile({
        token: token,
        path: 'data/volunteers.csv',
        commitMessage: `Add volunteer ${data.name} to CSV (via production admin form)`,
        updateFn: (content) => {
          const csvLine = `${data.name},${data.basti},${data.area},${data.shakha},${data.role},${data.joining_year},${data.contact},${data.blood_group},${vyavsayField},${data.gannayak},${data.ganvesh}`;
          const trimmed = content.trimEnd();
          return trimmed + '\n' + csvLine + '\n';
        }
      });
    } else {
      // ── 1. Update shared.js (PENDING_VOLUNTEERS_DATA) ──────────────────────────
      await updateGitHubFile({
        token: token,
        path: 'js/shared.js',
        commitMessage: `Add pending registration ${data.name} (via production form)`,
        updateFn: (content) => {
          const match = content.match(/const PENDING_VOLUNTEERS_DATA = \[(.*?)\];/s);
          let pendingBlock = match ? match[1] : '';
          
          const idRegex = /id:\s*(\d+)/g;
          let maxId = 0;
          let m;
          while ((m = idRegex.exec(pendingBlock)) !== null) {
            const idVal = parseInt(m[1]);
            if (idVal > maxId) maxId = idVal;
          }
          const nextId = maxId + 1;
          
          const jsLine = `  { id:${nextId},  name:'${data.name}',      basti:'${data.basti}',          area:'${data.area}',             shakha:'${data.shakha}',   role:'${data.role}',    joining_year:'${data.joining_year}', contact:'${data.contact}', blood_group:'${data.blood_group}',  vyavsay:'${vyavsayField}', gannayak:'${data.gannayak}', ganvesh:'${data.ganvesh}' },`;
          
          const lines = content.split('\n');
          let insertIndex = -1;
          let foundBlock = false;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('const PENDING_VOLUNTEERS_DATA = [')) {
              foundBlock = true;
            }
            if (foundBlock && lines[i].trim() === '];') {
              insertIndex = i;
              break;
            }
          }
          
          if (insertIndex !== -1) {
            lines.splice(insertIndex, 0, jsLine);
            return lines.join('\n');
          }
          throw new Error("Could not find closing bracket of PENDING_VOLUNTEERS_DATA in shared.js");
        }
      });
      
      // ── 2. Update pending_volunteers.csv ────────────────────────────────────
      await updateGitHubFile({
        token: token,
        path: 'data/pending_volunteers.csv',
        commitMessage: `Add pending volunteer ${data.name} to CSV (via production form)`,
        updateFn: (content) => {
          const csvLine = `${data.name},${data.basti},${data.area},${data.shakha},${data.role},${data.joining_year},${data.contact},${data.blood_group},${vyavsayField},${data.gannayak},${data.ganvesh}`;
          const trimmed = content.trimEnd();
          return trimmed + '\n' + csvLine + '\n';
        }
      });
    }
    
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
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
