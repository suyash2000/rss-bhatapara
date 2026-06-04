// ── DATA-LOADER.JS ───────────────────────────────────────────────────────────
// Loads all site data asynchronously from JSON files and populates window globals
// so existing rendering logic continues to work.
// ─────────────────────────────────────────────────────────────────────────────

async function loadSiteData() {
  try {
    const t = Date.now();
    const [vols, pending, events, varg, gannayaks] = await Promise.all([
      fetch(`/data/volunteers.json?t=${t}`).then(r => {
        if (!r.ok) throw new Error('volunteers.json failed');
        return r.json();
      }),
      fetch(`/data/pending.json?t=${t}`).then(r => {
        if (!r.ok) throw new Error('pending.json failed');
        return r.json();
      }),
      fetch(`/data/events.json?t=${t}`).then(r => {
        if (!r.ok) throw new Error('events.json failed');
        return r.json();
      }),
      fetch(`/data/varg.json?t=${t}`).then(r => {
        if (!r.ok) throw new Error('varg.json failed');
        return r.json();
      }),
      fetch(`/data/gannayaks.json?t=${t}`).then(r => {
        if (!r.ok) throw new Error('gannayaks.json failed');
        return r.json();
      })
    ]);

    window.VOLUNTEERS_DATA = vols;
    window.PENDING_VOLUNTEERS_DATA = pending;
    window.EVENTS_DATA = events;
    window.VARG_DATA = varg;
    window.GANNAYAKS_DATA = gannayaks;
  } catch (err) {
    console.error('Error loading site data:', err);
  }
}
