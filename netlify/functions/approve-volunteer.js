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
    
    // ── 1. Update shared.js (move from pending to active) ────────────────────
    await updateGitHubFile({
      token: token,
      path: 'js/shared.js',
      commitMessage: `Approve volunteer registration (Pending ID: ${id})`,
      updateFn: (content) => {
        const lines = content.split('\n');
        const pendingIdRegex = new RegExp(`\\bid:\\s*${id}\\b`);
        
        // Find the pending volunteer row
        let pendingLineIndex = -1;
        let pendingLine = '';
        let insidePending = false;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('const PENDING_VOLUNTEERS_DATA = [')) {
            insidePending = true;
          }
          if (insidePending && pendingIdRegex.test(lines[i])) {
            pendingLineIndex = i;
            pendingLine = lines[i];
          }
          if (insidePending && lines[i].trim() === '];') {
            insidePending = false;
          }
        }
        
        if (pendingLineIndex === -1) {
          throw new Error(`Pending registration with ID ${id} not found in PENDING_VOLUNTEERS_DATA`);
        }
        
        // Extract volunteer details from pendingLine
        const pattern = /name:\s*'(.*?)',\s*basti:\s*'(.*?)',\s*area:\s*'(.*?)',\s*shakha:\s*'(.*?)',\s*role:\s*'(.*?)',\s*joining_year:\s*'(.*?)',\s*contact:\s*'(.*?)',\s*blood_group:\s*'(.*?)',\s*vyavsay:\s*'(.*?)',\s*gannayak:\s*'(.*?)',\s*ganvesh:\s*'(.*?)'/;
        const matchDetails = pendingLine.match(pattern);
        if (!matchDetails) {
          throw new Error(`Failed to parse details for pending volunteer ID ${id}`);
        }
        
        const [_, name, basti, area, shakha, role, joining_year, contact, blood_group, vyavsay, gannayak, ganvesh] = matchDetails;
        
        // Remove the pending line from shared.js lines
        lines.splice(pendingLineIndex, 1);
        
        // Find next ID for VOLUNTEERS_DATA
        const matchActive = content.match(/const VOLUNTEERS_DATA = \[(.*?)\];/s);
        const volunteersBlock = matchActive ? matchActive[1] : '';
        const idRegex = /id:\s*(\d+)/g;
        let maxId = 15;
        let m;
        while ((m = idRegex.exec(volunteersBlock)) !== null) {
          const idVal = parseInt(m[1]);
          if (idVal > maxId) maxId = idVal;
        }
        const nextActiveId = maxId + 1;
        
        const jsLine = `  { id:${nextActiveId},  name:'${name}',      basti:'${basti}',          area:'${area}',             shakha:'${shakha}',   role:'${role}',    joining_year:'${joining_year}', contact:'${contact}', blood_group:'${blood_group}',  vyavsay:'${vyavsay}', gannayak:'${gannayak}', ganvesh:'${ganvesh}' },`;
        
        // Insert jsLine into VOLUNTEERS_DATA in shared.js lines
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
        
        if (insertIndex === -1) {
          throw new Error("Could not find closing bracket of VOLUNTEERS_DATA in shared.js");
        }
        
        lines.splice(insertIndex, 0, jsLine);
        updatedSharedJsContent = lines.join('\n');
        return updatedSharedJsContent;
      }
    });
    
    // ── 2. Sync volunteers.csv ──────────────────────────────────────────────
    await updateGitHubFile({
      token: token,
      path: 'data/volunteers.csv',
      commitMessage: `Sync CSV for volunteer approval (ID: ${id})`,
      updateFn: () => {
        const match = updatedSharedJsContent.match(/const VOLUNTEERS_DATA = \[(.*?)\];/s);
        let volunteersBlock = match ? match[1] : '';
        
        const objectRegex = /\{\s*id:\s*\d+,\s*name:\s*'(.*?)',\s*basti:\s*'(.*?)',\s*area:\s*'(.*?)',\s*shakha:\s*'(.*?)',\s*role:\s*'(.*?)',\s*joining_year:\s*'(.*?)',\s*contact:\s*'(.*?)',\s*blood_group:\s*'(.*?)',\s*vyavsay:\s*'(.*?)',\s*gannayak:\s*'(.*?)',\s*ganvesh:\s*'(.*?)'\s*\}/gs;
        
        const csvLines = ["name,basti,area,shakha,role,joining_year,contact,blood_group,vyavsay,gannayak,ganvesh"];
        let objMatch;
        while ((objMatch = objectRegex.exec(volunteersBlock)) !== null) {
          const [_, name, basti, area, shakha, role, joining_year, contact, blood_group, vyavsay, gannayak, ganvesh] = objMatch;
          csvLines.push(`${name},${basti},${area},${shakha},${role},${joining_year},${contact},${blood_group},${vyavsay},${gannayak},${ganvesh}`);
        }
        return csvLines.join('\n') + '\n';
      }
    });
    
    // ── 3. Sync pending_volunteers.csv ──────────────────────────────────────
    await updateGitHubFile({
      token: token,
      path: 'data/pending_volunteers.csv',
      commitMessage: `Sync Pending CSV for volunteer approval (ID: ${id})`,
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
