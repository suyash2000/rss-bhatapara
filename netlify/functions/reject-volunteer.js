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
  
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path} from GitHub: ${res.statusText}`);
  }
  const fileData = await res.json();
  const currentContent = Buffer.from(fileData.content, 'base64').toString('utf8');
  
  const updatedContent = updateFn(currentContent);
  
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
    const id = parseInt(data.id);
    
    let updatedSharedJsContent = '';
    
    // ── 1. Update shared.js (remove from pending) ───────────────────────────
    await updateGitHubFile({
      token: token,
      path: 'js/shared.js',
      commitMessage: `Reject volunteer registration (Pending ID: ${id})`,
      updateFn: (content) => {
        const lines = content.split('\n');
        const pendingIdRegex = new RegExp(`\\bid:\\s*${id}\\b`);
        
        // Find the pending volunteer row
        let pendingLineIndex = -1;
        let insidePending = false;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('const PENDING_VOLUNTEERS_DATA = [')) {
            insidePending = true;
          }
          if (insidePending && pendingIdRegex.test(lines[i])) {
            pendingLineIndex = i;
          }
          if (insidePending && lines[i].trim() === '];') {
            insidePending = false;
          }
        }
        
        if (pendingLineIndex === -1) {
          throw new Error(`Pending registration with ID ${id} not found in PENDING_VOLUNTEERS_DATA`);
        }
        
        // Remove the pending line from shared.js lines
        lines.splice(pendingLineIndex, 1);
        
        updatedSharedJsContent = lines.join('\n');
        return updatedSharedJsContent;
      }
    });
    
    // ── 2. Sync pending_volunteers.csv ──────────────────────────────────────
    await updateGitHubFile({
      token: token,
      path: 'data/pending_volunteers.csv',
      commitMessage: `Sync CSV for volunteer rejection (ID: ${id})`,
      updateFn: () => {
        const match = updatedSharedJsContent.match(/const PENDING_VOLUNTEERS_DATA = \[(.*?)\];/s);
        let pendingBlock = match ? match[1] : '';
        
        const objectRegex = /\{\s*id:\s*\d+,\s*name:\s*'(.*?)',\s*basti:\s*'(.*?)',\s*area:\s*'(.*?)',\s*shakha:\s*'(.*?)',\s*role:\s*'(.*?)',\s*joining_year:\s*'(.*?)',\s*contact:\s*'(.*?)',\s*blood_group:\s*'(.*?)',\s*vyavsay:\s*'(.*?)',\s*gannayak:\s*'(.*?)',\s*ganvesh:\s*'(.*?)'\s*\}/gs;
        
        const csvLines = ["name,basti,area,shakha,role,joining_year,contact,blood_group,vyavsay,gannayak,ganvesh"];
        let objMatch;
        while ((objMatch = objectRegex.exec(pendingBlock)) !== null) {
          const [_, name, basti, area, shakha, role, joining_year, contact, blood_group, vyavsay, gannayak, ganvesh] = objMatch;
          csvLines.push(`${name},${basti},${area},${shakha},${role},${joining_year},${contact},${blood_group},${vyavsay},${gannayak},${ganvesh}`);
        }
        return csvLines.join('\n') + '\n';
      }
    });
    
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
