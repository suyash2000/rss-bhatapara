// ── SHARED.JS ─────────────────────────────────────────────────────────────────
// Used by: volunteers.html (स्वयंसेवक page), admin.html, join.html
// NOT related to varg-data.js (प्रशिक्षण वर्ग page)
//
// VOLUNTEERS_DATA   → स्वयंसेवक सूची (active members)
// PENDING_VOLUNTEERS_DATA → लंबित स्वयंसेवक (awaiting admin approval)
// SHAKHA_DATA / EVENTS_DATA → शाखा और कार्यक्रम की जानकारी
// ─────────────────────────────────────────────────────────────────────────────
// ── Active Nav Link ───────────────────────────────────────────────────────────
(function () {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = a.getAttribute('href').split('/').pop();
    if (href === path) a.classList.add('active');
  });
})();

// ── Mobile Hamburger ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open);
    });
    document.querySelectorAll('.nav-link').forEach(a =>
      a.addEventListener('click', () => navLinks.classList.remove('open'))
    );
  }

  // Back to top
  const btt = document.getElementById('btt');
  if (btt) {
    window.addEventListener('scroll', () =>
      btt.classList.toggle('visible', window.scrollY > 400)
    );
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // Scroll reveal
  observeReveal();
});

// ── Scroll Reveal ─────────────────────────────────────────────────────────────
function observeReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

// ── Particles (hero) ─────────────────────────────────────────────────────────
function initParticles(containerId = 'hero-particles', count = 18) {
  const container = document.getElementById(containerId);
  if (!container) return;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 22 + 8;
    p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 100}%;` +
      `animation-duration:${Math.random() * 10 + 8}s;animation-delay:${Math.random() * 8}s;`;
    container.appendChild(p);
  }
}

// ── Stat Counter ──────────────────────────────────────────────────────────────
function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = +el.dataset.count, suffix = el.dataset.suffix || '';
    let n = 0;
    const step = Math.ceil(target / 60);
    const t = setInterval(() => {
      n = Math.min(n + step, target);
      el.textContent = n + suffix;
      if (n >= target) clearInterval(t);
    }, 25);
  });
}

// ── CSV Parser ────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    return headers.reduce((o, h, i) => { o[h] = (vals[i] || '').trim(); return o; }, {});
  });
}

// ── HTML Escaping for XSS Prevention ──────────────────────────────────────────
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Inline Data ───────────────────────────────────────────────────────────────
const SHAKHA_DATA = [
  { id: 1, name: 'केशव प्रभात शाखा', timing: 'प्रात: 6:00 – 7:00', address: 'केशव भवन, भाटापारा', contact_person: 'देवेन्द्र तिवारी', contact: '9321456987', schedule: ['सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'], activities: ['शारीरिक अभ्यास', 'गीत-गान', 'बौद्धिक'], strength: 42, mukhya_shikshak: '', shakha_karyavah: '', gan_shikshak: '', gan_nayak: '' },
  { id: 2, name: 'यज्ञ शाला शाखा', timing: 'प्रात: 5:30 – 6:30', address: 'यज्ञ शाला परिसर, भाटापारा', contact_person: 'अमित पटेल', contact: '9845123456', schedule: ['सोमवार', 'बुधवार', 'शुक्रवार', 'शनिवार'], activities: ['योग', 'सूर्य नमस्कार', 'प्राणायाम'], strength: 35, mukhya_shikshak: '', shakha_karyavah: '', gan_shikshak: '', gan_nayak: '' },
  { id: 3, name: 'लवकुश शाखा', timing: 'प्रात: 6:30 – 7:30', address: 'लवकुश मैदान, भाटापारा', contact_person: 'विकास सिंह', contact: '9712345678', schedule: ['मंगलवार', 'गुरुवार', 'शनिवार'], activities: ['खेल', 'व्यायाम', 'सांस्कृतिक गतिविधियाँ'], strength: 28, mukhya_shikshak: '', shakha_karyavah: '', gan_shikshak: '', gan_nayak: '' },
  { id: 4, name: 'माता देवाला शाखा', timing: 'सायं 5:00 – 6:00', address: 'माता देवाला मंदिर, भाटापारा', contact_person: 'मनोज वर्मा', contact: '9587412369', schedule: ['सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार'], activities: ['बाल खेल', 'देशभक्ति गीत', 'कहानी'], strength: 38, mukhya_shikshak: '', shakha_karyavah: '', gan_shikshak: '', gan_nayak: '' },
  { id: 5, name: 'गायत्री मंदिर शाखा', timing: 'प्रात: 6:00 – 7:00', address: 'गायत्री मंदिर परिसर, भाटापारा', contact_person: 'अजय कुमार', contact: '9456321478', schedule: ['सोमवार', 'बुधवार', 'शुक्रवार'], activities: ['शारीरिक अभ्यास', 'संस्कार', 'भजन'], strength: 32, mukhya_shikshak: '', shakha_karyavah: '', gan_shikshak: '', gan_nayak: '' },
  { id: 6, name: 'पटपर शाखा', timing: 'सायं 4:30 – 5:30', address: 'पटपर मोहल्ला, भाटापारा', contact_person: 'रमेश चंद्रा', contact: '9214587632', schedule: ['मंगलवार', 'गुरुवार', 'शनिवार'], activities: ['बाल शिक्षा', 'खेल', 'देशभक्ति'], strength: 25, mukhya_shikshak: '', shakha_karyavah: '', gan_shikshak: '', gan_nayak: '' },
];

// ── Dark Mode Toggle ────────────────────────────────────────────────────────
(function () {
  // 1. Immediately apply stored theme to body
  const currentTheme = localStorage.getItem('theme');
  if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }

  // 2. Wait for DOM content to load to inject toggle button
  document.addEventListener('DOMContentLoaded', () => {
    const navInner = document.querySelector('.nav-inner');
    const dashNavRight = document.querySelector('.dash-nav-right');
    const hamburger = document.getElementById('hamburger');

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'theme-toggle-btn';
    toggleBtn.setAttribute('aria-label', 'Toggle Dark/Light Mode');
    toggleBtn.type = 'button';

    // Set initial SVGs
    const sunSVG = `<svg class="sun-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    const moonSVG = `<svg class="moon-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    toggleBtn.innerHTML = sunSVG + moonSVG;

    toggleBtn.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-mode');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    if (dashNavRight) {
      // Admin page: insert as the first child of the right-side nav container
      dashNavRight.insertBefore(toggleBtn, dashNavRight.firstChild);
    } else if (navInner) {
      // Public pages: insert before hamburger if mobile, otherwise append
      if (hamburger) {
        navInner.insertBefore(toggleBtn, hamburger);
      } else {
        navInner.appendChild(toggleBtn);
      }
    }
  });
})();

// ── Inject Floating Glow Blobs ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const heroes = document.querySelectorAll('#main-hero, .page-hero, .prerna-hero, .login-screen');
  heroes.forEach(hero => {
    const container = document.createElement('div');
    container.className = 'bg-blob-container';

    const blob1 = document.createElement('div');
    blob1.className = 'bg-blob blob-orange';
    blob1.style.top = '10%';
    blob1.style.right = '-8%';

    const blob2 = document.createElement('div');
    blob2.className = 'bg-blob blob-saffron';
    blob2.style.bottom = '10%';
    blob2.style.left = '-8%';

    container.appendChild(blob1);
    container.appendChild(blob2);
    hero.appendChild(container);
  });
});

// ── PWA Service Worker Registration ──────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('PWA Service Worker registered with scope:', reg.scope))
      .catch(err => console.error('PWA Service Worker registration failed:', err));
  });
}


