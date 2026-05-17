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
  const navLinks  = document.getElementById('nav-links');
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
    p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;` +
      `animation-duration:${Math.random()*10+8}s;animation-delay:${Math.random()*8}s;`;
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

// ── Inline Data ───────────────────────────────────────────────────────────────
const VOLUNTEERS_DATA = [
  { id:1,  name:'राहुल शर्मा',    area:'वार्ड 5',  shakha:'प्रभात शाखा',  role:'कार्यकर्ता',    joining_year:'2021', contact:'9876543210', blood_group:'B+',  vyavsay:'शिक्षक' },
  { id:2,  name:'अमित पटेल',     area:'वार्ड 3',  shakha:'उषा शाखा',    role:'शाखा प्रमुख',  joining_year:'2018', contact:'9845123456', blood_group:'O+',  vyavsay:'व्यापारी' },
  { id:3,  name:'विकास सिंह',    area:'वार्ड 7',  shakha:'संध्या शाखा', role:'मुख्य शिक्षक', joining_year:'2019', contact:'9712345678', blood_group:'A+',  vyavsay:'कृषि' },
  { id:4,  name:'सुरेश यादव',    area:'वार्ड 1',  shakha:'प्रभात शाखा', role:'कार्यकर्ता',    joining_year:'2020', contact:'9632147852', blood_group:'AB+', vyavsay:'सरकारी नौकरी' },
  { id:5,  name:'मनोज वर्मा',    area:'वार्ड 9',  shakha:'उषा शाखा',    role:'गणवेश प्रमुख', joining_year:'2017', contact:'9587412369', blood_group:'B-',  vyavsay:'इंजीनियर' },
  { id:6,  name:'अजय कुमार',     area:'वार्ड 2',  shakha:'संध्या शाखा', role:'कार्यकर्ता',    joining_year:'2022', contact:'9456321478', blood_group:'O-',  vyavsay:'छात्र' },
  { id:7,  name:'देवेन्द्र तिवारी',area:'वार्ड 6', shakha:'प्रभात शाखा', role:'शाखा प्रमुख',  joining_year:'2016', contact:'9321456987', blood_group:'A-',  vyavsay:'डॉक्टर' },
  { id:8,  name:'रमेश चंद्रा',   area:'वार्ड 4',  shakha:'बाल शाखा',    role:'बाल शिक्षक',   joining_year:'2023', contact:'9214587632', blood_group:'B+',  vyavsay:'शिक्षक' },
  { id:9,  name:'प्रकाश गुप्ता', area:'वार्ड 8',  shakha:'उषा शाखा',    role:'कार्यकर्ता',    joining_year:'2020', contact:'9147852369', blood_group:'AB-', vyavsay:'व्यापारी' },
  { id:10, name:'नितिन मिश्रा',  area:'वार्ड 10', shakha:'संध्या शाखा', role:'नगर प्रमुख',   joining_year:'2015', contact:'9036985214', blood_group:'O+',  vyavsay:'अधिवक्ता' },
  { id:11, name:'संजय सोनी',     area:'वार्ड 5',  shakha:'बाल शाखा',    role:'बाल शिक्षक',   joining_year:'2021', contact:'9925874136', blood_group:'A+',  vyavsay:'छात्र' },
  { id:12, name:'कमलेश राव',     area:'वार्ड 3',  shakha:'प्रभात शाखा', role:'कार्यकर्ता',    joining_year:'2022', contact:'9814523697', blood_group:'B+',  vyavsay:'कृषि' },
  { id:13, name:'हरीश पांडेय',   area:'वार्ड 7',  shakha:'उषा शाखा',    role:'सेवा प्रमुख',  joining_year:'2019', contact:'9703214785', blood_group:'O-',  vyavsay:'सरकारी नौकरी' },
  { id:14, name:'विनोद साहू',    area:'वार्ड 1',  shakha:'संध्या शाखा', role:'कार्यकर्ता',    joining_year:'2023', contact:'9592145873', blood_group:'A-',  vyavsay:'व्यापारी' },
  { id:15, name:'अरुण तिवारी',   area:'वार्ड 9',  shakha:'प्रभात शाखा', role:'मुख्य शिक्षक', joining_year:'2018', contact:'9481236974', blood_group:'AB+', vyavsay:'इंजीनियर' },
];

const SHAKHA_DATA = [
  { id:1, name:'प्रभात शाखा', timing:'प्रात: 6:00 – 7:00', address:'रामलीला मैदान, वार्ड 5, भाटापारा', contact_person:'देवेन्द्र तिवारी', contact:'9321456987', schedule:['सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'], activities:['शारीरिक अभ्यास','गीत-गान','बौद्धिक'], strength:42 },
  { id:2, name:'उषा शाखा', timing:'प्रात: 5:30 – 6:30', address:'नेहरू चौक, वार्ड 3, भाटापारा', contact_person:'अमित पटेल', contact:'9845123456', schedule:['सोमवार','बुधवार','शुक्रवार','शनिवार'], activities:['योग','सूर्य नमस्कार','प्राणायाम'], strength:35 },
  { id:3, name:'संध्या शाखा', timing:'सायं 5:30 – 6:30', address:'शिव मंदिर प्रांगण, वार्ड 7, भाटापारा', contact_person:'विकास सिंह', contact:'9712345678', schedule:['मंगलवार','गुरुवार','शनिवार'], activities:['खेल','व्यायाम','सांस्कृतिक गतिविधियाँ'], strength:28 },
  { id:4, name:'बाल शाखा', timing:'सायं 4:00 – 5:00', address:'राम मंदिर परिसर, वार्ड 1, भाटापारा', contact_person:'रमेश चंद्रा', contact:'9214587632', schedule:['सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार'], activities:['बाल खेल','देशभक्ति गीत','कहानी'], strength:56 }
];

const EVENTS_DATA = [
  { id:1, title:'गुरु पूर्णिमा उत्सव', date:'2026-07-10', time:'07:00 AM', location:'RSS मैदान, भाटापारा', type:'उत्सव', description:'परम पूज्य डॉ. केशवराव बलिराम हेडगेवार जी के स्मरण में गुरु पूर्णिमा उत्सव। सभी स्वयंसेवक गणवेश में उपस्थित रहें।', status:'upcoming' },
  { id:2, title:'रक्तदान शिविर', date:'2026-06-05', time:'09:00 AM', location:'सामुदायिक भवन, भाटापारा', type:'सेवा', description:'नि:स्वार्थ सेवा के भाव से रक्तदान महाशिविर का आयोजन। सभी स्वस्थ स्वयंसेवक भाग लें।', status:'upcoming' },
  { id:3, title:'पथ संचलन – स्वतंत्रता दिवस', date:'2026-08-15', time:'06:30 AM', location:'मुख्य चौक, भाटापारा', type:'पथ संचलन', description:'स्वतंत्रता दिवस के पावन अवसर पर भव्य पथ संचलन। सभी शाखाओं के स्वयंसेवक एकत्रित होंगे।', status:'upcoming' },
  { id:4, title:'स्वयंसेवक प्रशिक्षण शिविर', date:'2026-05-20', time:'08:00 AM', location:'RSS कार्यालय, भाटापारा', type:'प्रशिक्षण', description:'नए स्वयंसेवकों के लिए 3-दिवसीय प्रशिक्षण शिविर। शारीरिक, बौद्धिक एवं सांस्कृतिक प्रशिक्षण।', status:'upcoming' },
  { id:5, title:'होली मिलन समारोह', date:'2026-03-14', time:'10:00 AM', location:'RSS मैदान, भाटापारा', type:'उत्सव', description:'होली पर्व पर सभी स्वयंसेवकों का मिलन समारोह। सांस्कृतिक कार्यक्रम एवं प्रीति भोज।', status:'completed' },
  { id:6, title:'वृक्षारोपण अभियान', date:'2026-04-22', time:'07:30 AM', location:'नगर उद्यान, भाटापारा', type:'सेवा', description:'पर्यावरण दिवस पर 500 पौधों का रोपण अभियान। भारत माता की हरियाली के लिए सेवा।', status:'completed' }
];
