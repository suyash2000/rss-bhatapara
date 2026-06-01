// ── ID-CARD-GENERATOR.JS ──────────────────────────────────────────────────────
// Dynamically generates SVG-based membership cards for RSS volunteers,
// supports direct high-res PNG downloads, and card-scale printing.
// ─────────────────────────────────────────────────────────────────────────────

// Helper to get initials (same logic as volunteers.html)
function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

// Generate the verified UID
function generateMemberUID(v) {
  const year = v.joining_year || '2026';
  const idStr = String(v.id || 0).padStart(4, '0');
  return `RSS-BHP-${year}-${idStr}`;
}

// Fetch QR Code as Base64 Data URL to prevent CORS taint
async function fetchQRCodeDataURL(data) {
  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`;
    const res = await fetch(qrUrl);
    if (!res.ok) throw new Error('QR server error');
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Failed to load QR code base64:', err);
    // Simple fallback image/blank SVG or empty
    return '';
  }
}

// Generate raw SVG code for the ID card
function generateIDCardSVG(v, qrDataUrl) {
  const name = esc(v.name);
  const initials = getInitials(v.name);
  const role = esc(v.role);
  const shakha = esc(v.shakha);
  const area = esc(v.area || 'भाटापारा');
  const basti = esc(v.basti || '—');
  const blood = esc(v.blood_group);
  const uid = generateMemberUID(v);

  return `
<svg id="id-card-svg" width="600" height="950" viewBox="0 0 600 950" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradients -->
    <linearGradient id="card-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1c0d02" />
      <stop offset="40%" stop-color="#9e3a00" />
      <stop offset="100%" stop-color="#0f0601" />
    </linearGradient>
    <radialGradient id="card-glow" cx="50%" cy="20%" r="60%">
      <stop offset="0%" stop-color="#ff6b00" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#ff6b00" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE259" />
      <stop offset="50%" stop-color="#FFD700" />
      <stop offset="100%" stop-color="#FFA751" />
    </linearGradient>
    <linearGradient id="footer-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#8B0000" />
      <stop offset="50%" stop-color="#D32F2F" />
      <stop offset="100%" stop-color="#8B0000" />
    </linearGradient>

    <!-- Filters -->
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.5" />
    </filter>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Card Background -->
  <rect width="600" height="950" rx="32" fill="url(#card-bg)" />
  <rect width="600" height="950" rx="32" fill="url(#card-glow)" />

  <!-- Gold Frame Border -->
  <rect x="16" y="16" width="568" height="918" rx="24" fill="none" stroke="url(#gold-grad)" stroke-width="2" stroke-opacity="0.6" />
  <rect x="22" y="22" width="556" height="906" rx="20" fill="none" stroke="url(#gold-grad)" stroke-width="0.8" stroke-opacity="0.3" />

  <!-- Corner Gold Details -->
  <rect x="26" y="26" width="30" height="2" fill="url(#gold-grad)" />
  <rect x="26" y="26" width="2" height="30" fill="url(#gold-grad)" />
  <rect x="544" y="26" width="30" height="2" fill="url(#gold-grad)" />
  <rect x="572" y="26" width="2" height="30" fill="url(#gold-grad)" />
  <rect x="26" y="922" width="30" height="2" fill="url(#gold-grad)" />
  <rect x="26" y="894" width="2" height="30" fill="url(#gold-grad)" />
  <rect x="544" y="922" width="30" height="2" fill="url(#gold-grad)" />
  <rect x="572" y="894" width="2" height="30" fill="url(#gold-grad)" />

  <!-- Header Section -->
  <g transform="translate(0, 15)">
    <!-- Flag Emblem -->
    <g transform="translate(42, 28) scale(1.3)">
      <rect x="3" y="1" width="3.5" height="42" rx="1.5" fill="url(#gold-grad)" />
      <polygon points="6.5,1 36,9.5 6.5,19" fill="#FF7F27" />
      <polygon points="6.5,8.5 28,14.5 6.5,21.5" fill="#FFE259" opacity="0.4" />
    </g>
    <!-- Header Text -->
    <text x="325" y="44" font-family="'Tiro Devanagari Hindi', sans-serif" font-size="25" font-weight="900" fill="#FFFFFF" letter-spacing="1" text-anchor="middle">राष्ट्रीय स्वयंसेवक संघ</text>
    <text x="325" y="74" font-family="'Outfit', sans-serif" font-size="16" font-weight="700" fill="url(#gold-grad)" letter-spacing="3" text-anchor="middle">RSS BHATAPARA</text>
    <text x="325" y="98" font-family="'Tiro Devanagari Hindi', sans-serif" font-size="14" font-weight="500" fill="#E0D0C0" text-anchor="middle">छत्तीसगढ़ प्रांत (ज़िला भाटापारा)</text>
  </g>

  <!-- Divider Line -->
  <line x1="45" y1="138" x2="555" y2="138" stroke="url(#gold-grad)" stroke-width="1" stroke-opacity="0.35" />

  <!-- Profile Image Container -->
  <g filter="url(#shadow)">
    <!-- Outer gold ring -->
    <circle cx="300" cy="245" r="82" fill="none" stroke="url(#gold-grad)" stroke-width="3" />
    <!-- Inner mask/circle -->
    <circle cx="300" cy="245" r="77" fill="#1d120a" stroke="rgba(255,107,0,0.3)" stroke-width="1.5" />
    <!-- Initials text -->
    <text x="300" y="263" font-family="'Outfit', sans-serif" font-size="48" font-weight="900" fill="#ff6b00" text-anchor="middle" filter="url(#glow)">${initials}</text>
  </g>

  <!-- Swayamsevak Name -->
  <text x="300" y="372" font-family="'Tiro Devanagari Hindi', sans-serif" font-size="32" font-weight="900" fill="#FFFFFF" text-anchor="middle" filter="url(#shadow)">${name}</text>
  
  <!-- Accent Line under Name -->
  <line x1="120" y1="392" x2="480" y2="392" stroke="url(#gold-grad)" stroke-width="1.5" stroke-opacity="0.6" />
  <circle cx="300" cy="392" r="4" fill="url(#gold-grad)" />

  <!-- Details Block -->
  <g transform="translate(68, 415)" font-family="'Tiro Devanagari Hindi', 'Outfit', sans-serif">
    <!-- Row 1: UID -->
    <text x="0" y="25" font-size="15" font-weight="700" fill="#FFE4B5" text-anchor="start">सदस्य क्रमांक / UID</text>
    <text x="180" y="25" font-family="'Outfit', sans-serif" font-size="16" font-weight="800" fill="url(#gold-grad)" text-anchor="start">${uid}</text>
    <line x1="0" y1="40" x2="464" y2="40" stroke="rgba(255,255,255,0.06)" stroke-width="1" />

    <!-- Row 2: Role -->
    <text x="0" y="68" font-size="15" font-weight="700" fill="#FFE4B5" text-anchor="start">दायित्व / Role</text>
    <text x="180" y="68" font-size="17" font-weight="800" fill="#FFFFFF" text-anchor="start">${role}</text>
    <line x1="0" y1="83" x2="464" y2="83" stroke="rgba(255,255,255,0.06)" stroke-width="1" />

    <!-- Row 3: Shakha -->
    <text x="0" y="111" font-size="15" font-weight="700" fill="#FFE4B5" text-anchor="start">शाखा / Shakha</text>
    <text x="180" y="111" font-size="17" font-weight="800" fill="#FFFFFF" text-anchor="start">${shakha}</text>
    <line x1="0" y1="126" x2="464" y2="126" stroke="rgba(255,255,255,0.06)" stroke-width="1" />

    <!-- Row 4: Area -->
    <text x="0" y="154" font-size="15" font-weight="700" fill="#FFE4B5" text-anchor="start">बस्ती / क्षेत्र</text>
    <text x="180" y="154" font-size="17" font-weight="800" fill="#FFFFFF" text-anchor="start">${basti} · ${area}</text>
    <line x1="0" y1="169" x2="464" y2="169" stroke="rgba(255,255,255,0.06)" stroke-width="1" />

    <!-- Row 5: Blood Group -->
    <text x="0" y="197" font-size="15" font-weight="700" fill="#FFE4B5" text-anchor="start">रक्त समूह / Blood</text>
    <!-- Blood group background badge -->
    <rect x="178" y="179" width="55" height="26" rx="6" fill="#D32F2F" />
    <text x="205" y="197" font-family="'Outfit', sans-serif" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle">${blood}</text>
  </g>

  <!-- QR Code and Verification Badge area -->
  <g transform="translate(0, 650)">
    <!-- QR Code white container -->
    <g filter="url(#shadow)">
      <rect x="410" y="45" width="136" height="136" rx="14" fill="#FFFFFF" />
      ${qrDataUrl ? `<image href="${qrDataUrl}" x="418" y="53" width="120" height="120" />` : ''}
    </g>

    <!-- Verification Stamp / Seal -->
    <g transform="translate(165, 110)">
      <circle cx="0" cy="0" r="54" fill="rgba(255,215,0,0.06)" stroke="url(#gold-grad)" stroke-width="2.5" stroke-dasharray="4,2" />
      <circle cx="0" cy="0" r="48" fill="none" stroke="url(#gold-grad)" stroke-width="0.8" stroke-opacity="0.5" />
      <!-- Starburst spikes / seal aesthetics -->
      <path d="M-8,-26 L0,-34 L8,-26 M-26,-8 L-34,0 L-26,8 M8,26 L0,34 L-8,26 M26,8 L34,0 L26,-8" stroke="url(#gold-grad)" stroke-width="1.5" stroke-opacity="0.4" fill="none" />
      <!-- Checkmark -->
      <path d="M-15,-4 L-3,8 L16,-12" fill="none" stroke="url(#gold-grad)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Seal texts around -->
      <text x="0" y="24" font-family="'Tiro Devanagari Hindi', sans-serif" font-size="10" font-weight="900" fill="url(#gold-grad)" letter-spacing="1" text-anchor="middle">सत्यापित</text>
      <text x="0" y="-18" font-family="'Tiro Devanagari Hindi', sans-serif" font-size="10" font-weight="800" fill="#FFFFFF" letter-spacing="0.5" text-anchor="middle">स्वयंसेवक</text>
    </g>
  </g>

  <!-- Footer Banner Bar -->
  <path d="M 18,870 L 582,870 L 582,932 L 18,932 Z" fill="url(#footer-grad)" />
  <path d="M 18,870 L 582,870" stroke="url(#gold-grad)" stroke-width="1.5" />
  <text x="300" y="910" font-family="'Tiro Devanagari Hindi', sans-serif" font-size="22" font-weight="900" fill="#FFFFFF" letter-spacing="1.5" text-anchor="middle">भारत माता की जय</text>
</svg>
  `;
}

// Inject Modal HTML and CSS dynamically on demand
function injectIDCardModalStyles() {
  if (document.getElementById('idcard-modal-styles')) return;

  const style = document.createElement('style');
  style.id = 'idcard-modal-styles';
  style.textContent = `
    .idcard-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(12px);
      z-index: 10000; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none;
      transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1); padding: 1.5rem;
    }
    .idcard-overlay.open { opacity: 1; pointer-events: auto; }
    .idcard-container {
      background: #160e07; border: 1.5px solid rgba(255,107,0,0.25); border-radius: 28px;
      width: 100%; max-width: 580px; padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem;
      box-shadow: 0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,107,0,0.15);
      transform: translateY(30px) scale(0.96); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative; overflow: hidden;
    }
    .idcard-overlay.open .idcard-container { transform: translateY(0) scale(1); }
    
    .idcard-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,107,0,0.15); padding-bottom: 0.75rem; }
    .idcard-header h3 { font-size: 1.25rem; font-weight: 800; color: #fff; }
    .idcard-close {
      background: none; border: none; color: rgba(255,255,255,0.5); font-size: 1.5rem; cursor: pointer;
      width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50%;
      transition: all 0.2s;
    }
    .idcard-close:hover { background: rgba(255,255,255,0.08); color: #fff; }

    .idcard-body { display: flex; justify-content: center; align-items: center; background: #0c0703; padding: 1rem; border-radius: 18px; border: 1px solid rgba(255,255,255,0.03); }
    .idcard-preview-wrapper { width: 100%; max-width: 290px; aspect-ratio: 600/950; filter: drop-shadow(0 12px 30px rgba(0,0,0,0.7)); }
    .idcard-preview-wrapper svg { width: 100%; height: 100%; display: block; border-radius: 18px; }

    .idcard-footer { display: flex; gap: 1rem; }
    .idcard-btn {
      flex: 1; padding: 0.9rem 1.2rem; font-family: inherit; font-size: 0.95rem; font-weight: 700; border-radius: 14px;
      display: flex; align-items: center; justify-content: center; gap: 0.5rem; cursor: pointer; transition: all 0.3s;
    }
    .idcard-btn-download { background: linear-gradient(135deg, #ff6b00, #ff8c00); color: #fff; border: none; box-shadow: 0 4px 15px rgba(255,107,0,0.3); }
    .idcard-btn-download:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255,107,0,0.5); }
    
    .idcard-btn-print { background: rgba(255,255,255,0.05); color: #ffebd3; border: 1px solid rgba(255,107,0,0.3); }
    .idcard-btn-print:hover { background: rgba(255,107,0,0.1); border-color: #ff6b00; color: #fff; }

    /* Custom Loading Indicator */
    .idcard-loading-shimmer {
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem;
      min-height: 380px; color: #ffebd3; font-size: 0.95rem; font-weight: 500;
    }
    .idcard-spinner {
      width: 40px; height: 40px; border: 3px solid rgba(255,107,0,0.1); border-top-color: #ff6b00;
      border-radius: 50%; animation: idcard-spin 0.8s linear infinite;
    }
    @keyframes idcard-spin { to { transform: rotate(360deg); } }

    @media (max-width: 480px) {
      .idcard-container { padding: 1.25rem; gap: 1rem; }
      .idcard-footer { flex-direction: column; }
    }
  `;
  document.head.appendChild(style);
}

// Injects the overlay modal HTML
function injectIDCardModalHTML() {
  if (document.getElementById('idcard-modal-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'idcard-modal-overlay';
  overlay.className = 'idcard-overlay';
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeIDCardModal();
  });

  overlay.innerHTML = `
    <div class="idcard-container">
      <div class="idcard-header">
        <h3 id="idcard-modal-title">स्वयंसेवक पहचान पत्र</h3>
        <button class="idcard-close" onclick="closeIDCardModal()">&times;</button>
      </div>
      <div class="idcard-body" id="idcard-modal-body">
        <!-- Live Preview or Spinner -->
      </div>
      <div class="idcard-footer" id="idcard-modal-footer" style="display:none">
        <button class="idcard-btn idcard-btn-print" id="idcard-print-btn">🖨️ प्रिंट करें</button>
        <button class="idcard-btn idcard-btn-download" id="idcard-download-btn">📥 डाउनलोड PNG</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Esc closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeIDCardModal();
  });
}

// Close helper
function closeIDCardModal() {
  const overlay = document.getElementById('idcard-modal-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// Global triggering entry point
async function showMemberIDCard(v) {
  // 1. Ensure modal structure & styles exist
  injectIDCardModalStyles();
  injectIDCardModalHTML();

  const overlay = document.getElementById('idcard-modal-overlay');
  const body = document.getElementById('idcard-modal-body');
  const footer = document.getElementById('idcard-modal-footer');
  const title = document.getElementById('idcard-modal-title');

  // Lock scrolling
  document.body.style.overflow = 'hidden';
  overlay.classList.add('open');

  title.textContent = `पहचान पत्र: ${v.name}`;
  footer.style.display = 'none';
  body.innerHTML = `
    <div class="idcard-loading-shimmer">
      <div class="idcard-spinner"></div>
      <div>QR कोड सत्यापित किया जा रहा है...</div>
    </div>
  `;

  // 2. Fetch QR code (points to verification link on public page)
  const host = window.location.origin;
  const verificationLink = `${host}/volunteers.html?id=${v.id}`;
  const qrDataUrl = await fetchQRCodeDataURL(verificationLink);

  // 3. Generate SVG content
  const svgHtml = generateIDCardSVG(v, qrDataUrl);

  // 4. Render Preview
  body.innerHTML = `<div class="idcard-preview-wrapper">${svgHtml}</div>`;
  footer.style.display = 'flex';

  // 5. Wire up actions
  document.getElementById('idcard-download-btn').onclick = () => {
    const svgEl = body.querySelector('svg');
    downloadIDCardPNG(v.name, svgEl);
  };

  document.getElementById('idcard-print-btn').onclick = () => {
    printIDCard(svgHtml);
  };
}

// Print logic using custom popup with styling
function printIDCard(svgHtml) {
  const w = window.open('', '_blank');
  w.document.write(`
    <!DOCTYPE html>
    <html lang="hi">
    <head>
      <meta charset="UTF-8" />
      <title>प्रिंट आईडी कार्ड</title>
      <style>
        @media print {
          @page {
            size: 54mm 85.6mm portrait;
            margin: 0;
          }
          html, body {
            margin: 0; padding: 0; width: 54mm; height: 85.6mm; overflow: hidden;
            background: #000;
          }
          svg {
            width: 54mm; height: 85.6mm; display: block;
          }
        }
        /* Screen styling for verification */
        body {
          margin: 0; background: #111; display: flex; align-items: center; justify-content: center; min-height: 100vh;
        }
        svg {
          width: 320px; height: 508px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.8);
        }
      </style>
    </head>
    <body>
      ${svgHtml}
      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
            window.close();
          }, 300);
        };
      </script>
    </body>
    </html>
  `);
  w.document.close();
}

// Download PNG logic using XMLSerializer and canvas drawing
function downloadIDCardPNG(memberName, svgElement) {
  try {
    const xml = new XMLSerializer().serializeToString(svgElement);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    const image64 = 'data:image/svg+xml;base64,' + svg64;

    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      // Render at high-resolution (double scale) for professional print sharpness
      canvas.width = 1200;
      canvas.height = 1900;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 1200, 1900);

      try {
        const dataURL = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.download = `RSS_ID_${memberName.replace(/\s+/g, '_')}.png`;
        a.href = dataURL;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err) {
        console.error('Canvas serialization failed (likely CORS taint):', err);
        alert('PNG डाउनलोड विफल रहा। कृपया प्रिंट विकल्प (PDF के रूप में सहेजें) का उपयोग करें।');
      }
    };
    img.src = image64;
  } catch (err) {
    console.error('Error generating image link:', err);
    alert('आईडी कार्ड छवि बनाने में असमर्थ।');
  }
}

// Helper function to show ID Card by volunteer ID directly
function showMemberIDCardById(id) {
  const list = window.VOLUNTEERS_DATA || [];
  const member = list.find(x => x.id === id);
  if (member) {
    showMemberIDCard(member);
  } else {
    const pendingList = window.PENDING_VOLUNTEERS_DATA || [];
    const pendingMember = pendingList.find(x => x.id === id);
    if (pendingMember) {
      showMemberIDCard(pendingMember);
    } else {
      console.error('Member not found for ID:', id);
    }
  }
}
