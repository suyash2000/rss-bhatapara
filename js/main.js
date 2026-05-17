// ── CSV Parser ──────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return headers.reduce((obj, h, i) => {
      obj[h] = (values[i] || '').trim();
      return obj;
    }, {});
  });
}

// ── Volunteer Module ─────────────────────────────────────────────────────────
let allVolunteers = [];

const VOLUNTEERS_CSV = `name,area,shakha,role,joining_year,contact
राहुल शर्मा,वार्ड 5,प्रभात शाखा,कार्यकर्ता,2021,9876543210
अमित पटेल,वार्ड 3,उषा शाखा,शाखा प्रमुख,2018,9845123456
विकास सिंह,वार्ड 7,संध्या शाखा,मुख्य शिक्षक,2019,9712345678
सुरेश यादव,वार्ड 1,प्रभात शाखा,कार्यकर्ता,2020,9632147852
मनोज वर्मा,वार्ड 9,उषा शाखा,गणवेश प्रमुख,2017,9587412369
अजय कुमार,वार्ड 2,संध्या शाखा,कार्यकर्ता,2022,9456321478
देवेन्द्र तिवारी,वार्ड 6,प्रभात शाखा,शाखा प्रमुख,2016,9321456987
रमेश चंद्रा,वार्ड 4,बाल शाखा,बाल शिक्षक,2023,9214587632
प्रकाश गुप्ता,वार्ड 8,उषा शाखा,कार्यकर्ता,2020,9147852369
नितिन मिश्रा,वार्ड 10,संध्या शाखा,नगर प्रमुख,2015,9036985214
संजय सोनी,वार्ड 5,बाल शाखा,बाल शिक्षक,2021,9925874136
कमलेश राव,वार्ड 3,प्रभात शाखा,कार्यकर्ता,2022,9814523697
हरीश पांडेय,वार्ड 7,उषा शाखा,सेवा प्रमुख,2019,9703214785
विनोद साहू,वार्ड 1,संध्या शाखा,कार्यकर्ता,2023,9592145873
अरुण तिवारी,वार्ड 9,प्रभात शाखा,मुख्य शिक्षक,2018,9481236974`;

function loadVolunteers() {
  allVolunteers = parseCSV(VOLUNTEERS_CSV);
  renderVolunteers(allVolunteers);
  populateFilters();
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

function renderVolunteers(list) {
  const grid = document.getElementById('vol-grid');
  if (!list.length) {
    grid.innerHTML = '<p class="no-results">कोई स्वयंसेवक नहीं मिला।</p>';
    return;
  }
  grid.innerHTML = list.map(v => `
    <div class="vol-card reveal">
      <div class="vol-year">${v.joining_year}</div>
      <div class="vol-avatar">${getInitials(v.name)}</div>
      <div class="vol-name">${v.name}</div>
      <div class="vol-role">${v.role}</div>
      <div class="vol-meta">
        <div class="vol-meta-item">
          <svg fill="none" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          ${v.area}
        </div>
        <div class="vol-meta-item">
          <svg fill="none" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/></svg>
          ${v.shakha}
        </div>
        <div class="vol-meta-item">
          <svg fill="none" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
          ${v.contact}
        </div>
      </div>
    </div>
  `).join('');
  observeReveal();
}

function populateFilters() {
  const shakhas = [...new Set(allVolunteers.map(v => v.shakha))].sort();
  const roles   = [...new Set(allVolunteers.map(v => v.role))].sort();
  const shakhaEl = document.getElementById('filter-shakha');
  const roleEl   = document.getElementById('filter-role');
  shakhas.forEach(s => shakhaEl.innerHTML += `<option value="${s}">${s}</option>`);
  roles.forEach(r => roleEl.innerHTML += `<option value="${r}">${r}</option>`);
}

function filterVolunteers() {
  const query  = document.getElementById('vol-search').value.toLowerCase();
  const shakha = document.getElementById('filter-shakha').value;
  const role   = document.getElementById('filter-role').value;
  const result = allVolunteers.filter(v => {
    const matchName  = v.name.toLowerCase().includes(query);
    const matchShakha = !shakha || v.shakha === shakha;
    const matchRole   = !role   || v.role   === role;
    return matchName && matchShakha && matchRole;
  });
  renderVolunteers(result);
}

// ── Shakha Module ────────────────────────────────────────────────────────────
const SHAKHA_DATA = [
  { id:1, name:'प्रभात शाखा', timing:'प्रात: 6:00 – 7:00', address:'रामलीला मैदान, वार्ड 5, भाटापारा', contact_person:'देवेन्द्र तिवारी', contact:'9321456987', schedule:['सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'], activities:['शारीरिक अभ्यास','गीत-गान','बौद्धिक'], strength:42 },
  { id:2, name:'उषा शाखा', timing:'प्रात: 5:30 – 6:30', address:'नेहरू चौक, वार्ड 3, भाटापारा', contact_person:'अमित पटेल', contact:'9845123456', schedule:['सोमवार','बुधवार','शुक्रवार','शनिवार'], activities:['योग','सूर्य नमस्कार','प्राणायाम'], strength:35 },
  { id:3, name:'संध्या शाखा', timing:'सायं 5:30 – 6:30', address:'शिव मंदिर प्रांगण, वार्ड 7, भाटापारा', contact_person:'विकास सिंह', contact:'9712345678', schedule:['मंगलवार','गुरुवार','शनिवार'], activities:['खेल','व्यायाम','सांस्कृतिक गतिविधियाँ'], strength:28 },
  { id:4, name:'बाल शाखा', timing:'सायं 4:00 – 5:00', address:'राम मंदिर परिसर, वार्ड 1, भाटापारा', contact_person:'रमेश चंद्रा', contact:'9214587632', schedule:['सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार'], activities:['बाल खेल','देशभक्ति गीत','कहानी'], strength:56 }
];

function loadShakha() {
  renderShakha(SHAKHA_DATA);
}

const icons = ['🌅', '🌄', '🌇', '🌱'];
function renderShakha(list) {
  const grid = document.getElementById('shakha-grid');
  grid.innerHTML = list.map((s, i) => `
    <div class="shakha-card reveal">
      <div class="shakha-icon">${icons[i % icons.length]}</div>
      <div class="shakha-name">${s.name}</div>
      <div class="shakha-timing">⏰ ${s.timing}</div>
      <div class="shakha-info">
        <div class="shakha-info-item">
          <svg fill="none" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
          ${s.address}
        </div>
        <div class="shakha-info-item">
          <svg fill="none" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          ${s.contact_person} · ${s.contact}
        </div>
      </div>
      <div class="shakha-days">${s.schedule.map(d => `<span class="shakha-day">${d}</span>`).join('')}</div>
      <div class="shakha-strength">
        <span>स्वयंसेवक: <strong>${s.strength}</strong></span>
        <div class="strength-bar"><div class="strength-fill" style="width:${Math.min(s.strength / 60 * 100, 100)}%"></div></div>
      </div>
    </div>
  `).join('');
  observeReveal();
}

// ── Events Module ────────────────────────────────────────────────────────────
let allEvents = [];
const monthNames = ['जन','फर','मार','अप्र','मई','जून','जुल','अग','सितं','अक्ट','नव','दिस'];

const EVENTS_DATA = [
  { id:1, title:'गुरु पूर्णिमा उत्सव', date:'2026-07-10', time:'07:00 AM', location:'RSS मैदान, भाटापारा', type:'उत्सव', description:'परम पूज्य डॉ. केशवराव बलिराम हेडगेवार जी के स्मरण में गुरु पूर्णिमा उत्सव। सभी स्वयंसेवक गणवेश में उपस्थित रहें।', status:'upcoming' },
  { id:2, title:'रक्तदान शिविर', date:'2026-06-05', time:'09:00 AM', location:'सामुदायिक भवन, भाटापारा', type:'सेवा', description:'नि:स्वार्थ सेवा के भाव से रक्तदान महाशिविर का आयोजन। सभी स्वस्थ स्वयंसेवक भाग लें।', status:'upcoming' },
  { id:3, title:'पथ संचलन – स्वतंत्रता दिवस', date:'2026-08-15', time:'06:30 AM', location:'मुख्य चौक, भाटापारा', type:'पथ संचलन', description:'स्वतंत्रता दिवस के पावन अवसर पर भव्य पथ संचलन। सभी शाखाओं के स्वयंसेवक एकत्रित होंगे।', status:'upcoming' },
  { id:4, title:'स्वयंसेवक प्रशिक्षण शिविर', date:'2026-05-20', time:'08:00 AM', location:'RSS कार्यालय, भाटापारा', type:'प्रशिक्षण', description:'नए स्वयंसेवकों के लिए 3-दिवसीय प्रशिक्षण शिविर। शारीरिक, बौद्धिक एवं सांस्कृतिक प्रशिक्षण।', status:'upcoming' },
  { id:5, title:'होली मिलन समारोह', date:'2026-03-14', time:'10:00 AM', location:'RSS मैदान, भाटापारा', type:'उत्सव', description:'होली पर्व पर सभी स्वयंसेवकों का मिलन समारोह। सांस्कृतिक कार्यक्रम एवं प्रीति भोज।', status:'completed' },
  { id:6, title:'वृक्षारोपण अभियान', date:'2026-04-22', time:'07:30 AM', location:'नगर उद्यान, भाटापारा', type:'सेवा', description:'पर्यावरण दिवस पर 500 पौधों का रोपण अभियान। भारत माता की हरियाली के लिए सेवा।', status:'completed' }
];

function loadEvents() {
  allEvents = EVENTS_DATA;
  renderEvents(allEvents);
}

function renderEvents(list) {
  const container = document.getElementById('events-list');
  if (!list.length) { container.innerHTML = '<p class="no-results">कोई कार्यक्रम नहीं।</p>'; return; }
  container.innerHTML = list.map(e => {
    const d = new Date(e.date);
    return `
    <div class="event-card reveal" data-type="${e.type}" data-status="${e.status}">
      <div class="event-date-box">
        <div class="event-date-day">${d.getDate()}</div>
        <div class="event-date-month">${monthNames[d.getMonth()]} ${d.getFullYear()}</div>
      </div>
      <div class="event-info">
        <h3>${e.title}</h3>
        <p>${e.description}</p>
        <div style="display:flex;gap:0.5rem;margin-top:0.5rem;flex-wrap:wrap;">
          <span style="font-size:0.78rem;color:#aaa;">📍 ${e.location}</span>
        </div>
      </div>
      <div class="event-meta">
        <span class="event-type">${e.type}</span>
        <span class="event-time">⏰ ${e.time}</span>
        <span class="event-status-badge ${e.status === 'upcoming' ? 'badge-upcoming' : 'badge-completed'}">
          ${e.status === 'upcoming' ? '✓ आगामी' : '✓ संपन्न'}
        </span>
      </div>
    </div>`;
  }).join('');
  observeReveal();
}

function filterEvents(type) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  if (type === 'all') { renderEvents(allEvents); return; }
  if (type === 'upcoming' || type === 'completed') {
    renderEvents(allEvents.filter(e => e.status === type));
  } else {
    renderEvents(allEvents.filter(e => e.type === type));
  }
}

// ── Suvichar ─────────────────────────────────────────────────────────────────
const suvichars = [
  { text: 'संगठित समाज ही राष्ट्र की शक्ति है। जब हम एकजुट होते हैं तो हम अजेय होते हैं।', author: '— डॉ. केशवराव बलिराम हेडगेवार' },
  { text: 'राष्ट्र को जीवंत रखने के लिए, उसके हर नागरिक को समर्पित और कर्तव्यनिष्ठ होना चाहिए।', author: '— माधव सदाशिव गोलवलकर (गुरुजी)' },
  { text: 'स्वयंसेवक वह है जो बिना किसी स्वार्थ के, निस्वार्थ भाव से मातृभूमि की सेवा में समर्पित है।', author: '— RSS परंपरा' },
  { text: 'जब तक भारत माता की जय का नारा हमारे मन में है, तब तक हम अपराजेय हैं।', author: '— RSS प्रेरणा' },
  { text: 'सेवा ही परम धर्म है। समाज की सेवा ईश्वर की सेवा है।', author: '— भारतीय संस्कृति' },
];

function loadSuvichar() {
  const today = new Date();
  const idx = today.getDate() % suvichars.length;
  const s = suvichars[idx];
  document.getElementById('suvichar-text').textContent = s.text;
  document.getElementById('suvichar-author').textContent = s.author;
}

// ── Announcements ─────────────────────────────────────────────────────────────
const announcements = [
  { title: 'गुरु पूर्णिमा उत्सव की तैयारी', text: 'सभी शाखा प्रमुख 25 जून को बैठक में उपस्थित रहें। तैयारी का विवरण साझा किया जाएगा।', date: '16 मई 2026' },
  { title: 'रक्तदान शिविर – पंजीकरण प्रारंभ', text: 'भाटापारा रक्तदान महाशिविर में भाग लेने के लिए अपने शाखा प्रमुख से संपर्क करें।', date: '14 मई 2026' },
  { title: 'नया स्वयंसेवक प्रशिक्षण बैच', text: 'नए स्वयंसेवकों के लिए 20 मई से 3-दिवसीय प्रशिक्षण शिविर प्रारंभ होगा। शीघ्र पंजीकरण कराएं।', date: '12 मई 2026' },
  { title: 'मासिक बैठक – सभी कार्यकर्ता', text: 'इस माह की मासिक बैठक 18 मई को RSS कार्यालय में प्रात: 10 बजे आयोजित होगी।', date: '10 मई 2026' },
];

function renderAnnouncements() {
  document.getElementById('ann-list').innerHTML = announcements.map(a => `
    <div class="ann-item reveal">
      <div class="ann-dot"></div>
      <div class="ann-content">
        <h4>${a.title}</h4>
        <p>${a.text}</p>
        <div class="ann-date">${a.date}</div>
      </div>
    </div>
  `).join('');
  observeReveal();
}

// ── Quotes ────────────────────────────────────────────────────────────────────
const quotes = [
  { text: 'भारत माता की जय! यही हमारा मंत्र है, यही हमारा संकल्प है, यही हमारी पहचान है।', author: 'RSS प्रेरणा' },
  { text: 'एक स्वयंसेवक का जीवन स्वयं के लिए नहीं, समाज के लिए समर्पित होता है।', author: 'संघ परंपरा' },
  { text: 'हम भारतीय हैं, यह हमारी सबसे बड़ी पहचान है। राष्ट्र ही हमारा परिवार है।', author: 'डॉ. हेडगेवार जी' },
  { text: 'संस्कार, सेवा और समर्पण – यही RSS के तीन मूल सूत्र हैं।', author: 'गुरुजी गोलवलकर' },
  { text: 'वंदे मातरम! भारत भूमि पर जन्म लेना सौभाग्य की बात है। इसे सार्थक करें।', author: 'RSS प्रेरणा' },
  { text: 'जो राष्ट्र की सेवा करता है, वही सच्चा वीर है। आओ मिलकर भारत को महान बनाएं।', author: 'संघ विचार' },
];

function renderQuotes() {
  document.getElementById('quotes-grid').innerHTML = quotes.map(q => `
    <div class="quote-card reveal">
      <div class="quote-mark">"</div>
      <p class="quote-text">${q.text}</p>
      <div class="quote-author">— ${q.author}</div>
    </div>
  `).join('');
  observeReveal();
}

// ── Scroll Reveal ─────────────────────────────────────────────────────────────
function observeReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => io.observe(el));
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function initNavbar() {
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => navLinks.classList.remove('open'));
  });
  window.addEventListener('scroll', () => {
    const links = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('section[id]');
    let current = '';
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 100) current = s.id; });
    links.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
    });
  });
}

// ── Particles ─────────────────────────────────────────────────────────────────
function initParticles() {
  const container = document.getElementById('hero-particles');
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 20 + 8;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      animation-duration:${Math.random()*10+8}s;
      animation-delay:${Math.random()*8}s;
    `;
    container.appendChild(p);
  }
}

// ── Back to Top ───────────────────────────────────────────────────────────────
function initBTT() {
  const btt = document.getElementById('btt');
  window.addEventListener('scroll', () => btt.classList.toggle('visible', window.scrollY > 400));
  btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ── Stats Counter ─────────────────────────────────────────────────────────────
function animateStats() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = +el.dataset.count;
    let count = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      count = Math.min(count + step, target);
      el.textContent = count + (el.dataset.suffix || '');
      if (count >= target) clearInterval(timer);
    }, 25);
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initNavbar();
  initBTT();
  loadSuvichar();
  loadVolunteers();
  loadShakha();
  loadEvents();
  renderAnnouncements();
  renderQuotes();
  observeReveal();

  // Animate stats on hero visible
  const heroIO = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { animateStats(); heroIO.disconnect(); }
  });
  heroIO.observe(document.getElementById('hero'));

  // Event search listeners
  document.getElementById('vol-search').addEventListener('input', filterVolunteers);
  document.getElementById('filter-shakha').addEventListener('change', filterVolunteers);
  document.getElementById('filter-role').addEventListener('change', filterVolunteers);
});
