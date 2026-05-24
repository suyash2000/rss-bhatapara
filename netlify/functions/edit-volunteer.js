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
    const id = parseInt(data.id);
    
    // ── 1. Update shared.js ─────────────────────────────────────────────────
    let updatedSharedJsContent = '';
    await updateGitHubFile({
      token: token,
      path: 'js/shared.js',
      commitMessage: `Edit volunteer ${data.name} (ID: ${id}) (via admin panel)`,
      updateFn: (content) => {
        const lines = content.split('\n');
        let updated = false;
        const idRegex = new RegExp(`\\bid:\\s*${id}\\b`);
        
        let insideVolunteers = false;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('const VOLUNTEERS_DATA = [')) {
            insideVolunteers = true;
          }
          if (insideVolunteers && idRegex.test(lines[i])) {
            lines[i] = `  { id:${id},  name:'${data.name}',      basti:'${data.basti}',          area:'${data.area}',             shakha:'${data.shakha}',   role:'${data.role}',    joining_year:'${data.joining_year}', contact:'${data.contact}', blood_group:'${data.blood_group}',  vyavsay:'${data.vyavsay}', gannayak:'${data.gannayak}', ganvesh:'${data.ganvesh}' },`;
            updated = true;
            break;
          }
          if (insideVolunteers && lines[i].trim() === '];') {
            break;
          }
        }
        
        if (!updated) {
          throw new Error(`Volunteer with ID ${id} not found in VOLUNTEERS_DATA inside shared.js`);
        }
        
        updatedSharedJsContent = lines.join('\n');
        return updatedSharedJsContent;
      }
    });
    
    // ── 2. Sync volunteers.csv based on the updated shared.js data ─────────
    await updateGitHubFile({
      token: token,
      path: 'data/volunteers.csv',
      commitMessage: `Sync CSV for volunteer edit ${data.name} (ID: ${id})`,
      updateFn: () => {
        // Extract VOLUNTEERS_DATA block from the updated shared.js content
        const match = updatedSharedJsContent.match(/const VOLUNTEERS_DATA = \[(.*?)\];/s);
        let volunteersBlock = match ? match[1] : updatedSharedJsContent;
        
        // Match all object elements inside the array
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
