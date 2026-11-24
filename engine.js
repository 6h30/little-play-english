/* Little Talk: mastery model and the planner for the daily adventure.
   Each item (word, sentence, letter) has a box 0..4:
   0 new · 1 heard · 2 recognised (right first time, no hint) · 3 solid (right again in another session) · 4 lasting (right after 20+ hours)
   A wrong answer drops one box and the item comes back soon. A grown-up who saw it happen in real life adds one box. */
(function () {
  'use strict';
  const { S, shuffle } = BE;
  S.m = S.m || {}; S.missions = S.missions || []; S.stickers = S.stickers || 0; S.days = S.days || [];
  if (!S.level) S.level = 1;
  const H = 36e5, DAY = 24 * H;
  const SES = Date.now().toString(36);   // a "session" is one visit to the app

  const M = BE.M = {
    get(id) { return S.m[id] || { b: 0, t: 0, n: 0, w: 0, r: 0, ses: '' }; },
    put(id, m) { S.m[id] = m; BE.save(); },
    box(id) { return M.get(id).b; },
    heard(id) { const m = M.get(id); if (m.b < 1) m.b = 1; m.t = Date.now(); M.put(id, m); },
    // right(id, clean): clean = first try, no hint
    right(id, clean) {
      const m = M.get(id), now = Date.now(); m.n++;
      if (m.b < 1) m.b = 1;
      if (clean) {
        if (m.b === 1) m.b = 2;
        else if (m.b === 2 && m.ses && m.ses !== SES) m.b = 3;
        else if (m.b === 3 && now - m.t >= 20 * H) m.b = 4;
        m.ses = SES;
      }
      m.t = now; M.put(id, m);
    },
    wrong(id) {
      const m = M.get(id); m.w++; if (m.b > 1) m.b--; if (m.b < 1) m.b = 1; m.t = Date.now(); M.put(id, m);
    },
    // a grown-up saw the child do it in real life
    real(id) { const m = M.get(id); m.r++; m.b = Math.min(4, Math.max(m.b, 1) + 1); m.t = Date.now(); m.ses = ''; M.put(id, m); },
    due(id) {
      const m = M.get(id), age = Date.now() - m.t;
      if (m.b === 0) return false;
      if (m.b === 1) return true;
      if (m.b === 2) return age > 4 * H;
      if (m.b === 3) return age > 20 * H;
      return age > 5 * DAY;
    },
    // share of a world's items that are recognised or better
    progress(world) { const w = typeof world === 'string' ? BE.world(world) : world; return w.items.filter(i => M.box(i.id) >= 2).length / w.items.length; },
    heardShare(world) { const w = typeof world === 'string' ? BE.world(world) : world; return w.items.filter(i => M.box(i.id) >= 1).length / w.items.length; },
    levelProgress(n) { const ws = BE.WORLDS.filter(w => w.level === n); return ws.reduce((a, w) => a + M.progress(w), 0) / ws.length; },
    totals() { let heard = 0, known = 0, solid = 0; Object.keys(BE.ITEMS).forEach(id => { const b = M.box(id); if (b >= 1) heard++; if (b >= 2) known++; if (b >= 4) solid++; }); return { heard, known, solid, all: Object.keys(BE.ITEMS).length }; },
    reset() { S.m = {}; S.missions = []; S.stickers = 0; S.days = []; BE.save(); }
  };

  // Words a child has met get better care: pick the ones that need practice most
  BE.need = id => { const m = M.get(id); return (4 - m.b) * 2 + (M.due(id) ? 3 : 0) + Math.min(3, m.w) + Math.random(); };

  /* ---------- Planner: what happens in today's adventure ---------- */
  const NEWCOUNT = { words: 3, colors: 3, actions: 3, frames: 2, count: 2, position: 1, syllables: 3, rhymes: 3, letters: 3, read: 3, talk: 2, story: 1 };
  BE.plan = function () {
    let L = S.level, up = false;
    if (L < 5 && M.levelProgress(L) >= 0.8) { L++; S.level = L; BE.save(); up = true; }
    const worlds = BE.WORLDS.filter(w => w.level === L);
    let cur = worlds.find(w => M.progress(w) < 0.8 && w.items.some(i => M.box(i.id) === 0)) || worlds.find(w => M.progress(w) < 0.8) || worlds[worlds.length - 1];
    const n = NEWCOUNT[cur.kind] || 3;
    let fresh = cur.items.filter(i => M.box(i.id) === 0);
    if (cur.kind === 'rhymes') {           // new rhyme words come in whole families
      const g = fresh.length ? fresh[0].g : null;
      fresh = fresh.filter(i => i.g === g).concat(fresh.filter(i => i.g !== g)); }
    fresh = fresh.slice(0, n);
    // review: things already met that are due, from this level and earlier ones (up to 4)
    const rev = Object.keys(BE.ITEMS).map(id => BE.ITEMS[id])
      .filter(i => M.due(i.id) && !fresh.includes(i) && BE.world(i.wid).kind !== 'story' && BE.world(i.wid).level <= L)
      .sort((a, b) => BE.need(b.id) - BE.need(a.id)).slice(0, 4);
    return { level: L, up, world: cur, fresh, review: rev };
  };

  // Grown-up mission for after the session: two or three things to try away from the screen
  BE.mission = function (items) {
    const picks = items.filter(i => i.e || i.c || i.w).slice(0, 3);
    return picks;
  };
  BE.addMission = function (items) {
    if (!items.length) return null;
    const mm = { id: 'm' + Date.now(), t: Date.now(), items: items.map(i => i.id), done: {} };
    S.missions.push(mm); if (S.missions.length > 10) S.missions.shift();
    S.stickers++; S.days.push(Date.now()); if (S.days.length > 200) S.days.shift();
    BE.save(); return mm;
  };
  BE.openMissions = () => S.missions.filter(m => m.items.some(id => !m.done[id]));
})();
