/* Srjan gallery engine (no dependencies) */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const enc = encodeURIComponent;
  const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  };
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const safeUrl = u => { u = (u || '').trim(); if (!u) return ''; if (/^https?:\/\//i.test(u)) return u; if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(u)) return 'https://' + u; return ''; };

  const ROOMS = window.ROOMS, ARTISTS = window.ARTISTS, PAINTINGS = window.PAINTINGS, Store = window.AurumStore;

  /* ───────── prepare collection ───────── */
  PAINTINGS.forEach((p, i) => {
    p.id = i; p.artist = ARTISTS[p.a];
    const m = /\d{4}/.exec(p.y);
    if (m) p.yr = +m[0]; else { const c = /(\d{1,2})(st|nd|rd|th) century/.exec(p.y); p.yr = c ? (+c[1] - 1) * 100 + 50 : 1000; }
    p.hay = norm([p.t, p.artist.n, p.med, p.loc, p.mv, p.s, p.y].join(' '));
  });
  const byRoom = id => PAINTINGS.filter(p => p.mv === id);
  const akey = p => p.a || ('c:' + p.artist.n);
  const byTitle = t => PAINTINGS.find(p => p.t === t);
  const wingOf = p => { const r = ROOMS.find(x => x.id === p.mv); return (r && r.wing) || p.wing || 'Art'; };
  const LINKMAP = {};
  (window.LINKS || []).forEach(([x, y, why]) => { (LINKMAP[x] = LINKMAP[x] || []).push({ t: y, why }); (LINKMAP[y] = LINKMAP[y] || []).push({ t: x, why }); });
  const WALKLIST = (window.WALK || []).map(t => PAINTINGS.find(p => p.t === t)).filter(Boolean);
  const FEAT = {
    Art: ['Featured Artists', 'Artists of today', 'Contemporary paintings reviewed by our curators and hung beside the masters.'],
    Spaces: ['Featured Spaces', 'Studios of today', 'Interiors and architecture by living designers, reviewed by our curators.'],
    Design: ['Featured Designers', 'Makers of today', 'Furniture, objects and textiles by living designers and makers.']
  };

  /* ───────── live image resolver ───────── */
  const COMMONS = 'https://commons.wikimedia.org/w/api.php';
  const IMG_KEY = 'srjan.img.v3';
  const imgCache = store.get(IMG_KEY, {});
  const pending = {}, queue = []; let active = 0;
  function pump() { while (active < 6 && queue.length) { const j = queue.shift(); active++; j.fn().then(j.res, j.rej).finally(() => { active--; pump(); }); } }
  const limited = fn => new Promise((res, rej) => { queue.push({ fn, res, rej }); pump(); });
  async function jget(url) { const r = await fetch(url); if (!r.ok) throw new Error(r.status); return r.json(); }
  const fromInfo = (ii, page) => ii ? { t0: ii.thumburl || ii.url, o: ii.url, w: ii.width, h: ii.height, page: page || null } : null;
  async function viaFile(f) {
    const d = await jget(`${COMMONS}?action=query&format=json&origin=*&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=960&titles=${enc('File:' + f)}`);
    const pg = Object.values((d.query && d.query.pages) || {})[0];
    return pg && pg.imageinfo ? fromInfo(pg.imageinfo[0], 'https://commons.wikimedia.org/wiki/' + enc('File:' + f)) : null;
  }
  async function viaWiki(title) {
    const d = await jget(`https://en.wikipedia.org/api/rest_v1/page/summary/${enc(title)}?redirect=true`);
    if (!d || !d.thumbnail) return null;
    const o = d.originalimage || d.thumbnail;
    return { t0: d.thumbnail.source, o: o.source, w: o.width, h: o.height, page: d.content_urls && d.content_urls.desktop && d.content_urls.desktop.page };
  }
  async function viaSearch(q) {
    const d = await jget(`${COMMONS}?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=8&gsrsearch=${enc(q + ' filetype:bitmap')}&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=960`);
    const pages = Object.values((d.query && d.query.pages) || {}).sort((a, b) => a.index - b.index);
    for (const pg of pages) { const ii = pg.imageinfo && pg.imageinfo[0]; if (ii && /image\/(jpeg|png)/.test(ii.mime) && ii.width >= 500) return fromInfo(ii, 'https://commons.wikimedia.org/wiki/' + enc(pg.title)); }
    return null;
  }
  function resolveRecord(key, spec) {
    if (imgCache[key]) return Promise.resolve(imgCache[key]);
    if (pending[key]) return pending[key];
    pending[key] = limited(async () => {
      let r = null;
      for (const step of [spec.f && (() => viaFile(spec.f)), spec.w && (() => viaWiki(spec.w)), spec.q && (() => viaSearch(spec.q))]) {
        if (!step) continue;
        try { r = await step(); } catch (e) { r = null; }
        if (r) break;
      }
      if (r) { imgCache[key] = r; store.set(IMG_KEY, imgCache); }
      return r;
    });
    return pending[key];
  }
  const resolvePainting = p => p.custom
    ? Promise.resolve(p.img ? { t0: p.thumb || p.img, o: p.img } : null)
    : resolveRecord('p:' + p.t, { f: p.f, w: p.w, q: p.q || (p.t + ' ' + p.artist.n) });
  const resolveArtist = a => resolveRecord('a:' + a.n, { w: a.pw });
  const sized = (u, w) => (u && u.includes('/thumb/')) ? u.replace(/\/\d+px-/, `/${w}px-`) : u;

  const fallbackNode = p => el('div', 'fallback-art', `<small>IMAGE UNAVAILABLE</small><span>${esc(p.t)}</span><small>${esc(p.artist.n.toUpperCase())}</small>`);
  async function paintInto(p, art, img, width) {
    const r = await resolvePainting(p);
    if (!r) { art.classList.add('fail'); art.appendChild(fallbackNode(p)); return null; }
    img.onload = () => art.classList.add('ok');
    img.onerror = () => { if (img.src !== r.t0) img.src = r.t0; else { art.classList.add('fail'); art.appendChild(fallbackNode(p)); } };
    img.src = sized(r.t0, width);
    return r;
  }

  /* ───────── observers ───────── */
  const lazyIO = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { lazyIO.unobserve(en.target); const f = en.target._lazy; if (f) f(); } }), { rootMargin: '600px 600px' });
  const lazy = (node, fn) => { node._lazy = fn; lazyIO.observe(node); };
  const revealIO = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); } }), { threshold: .08, rootMargin: '0px 0px -4% 0px' });
  const reveal = (node, delay) => { node.classList.add('reveal'); node.style.transitionDelay = (delay || 0) + 'ms'; revealIO.observe(node); };

  /* ───────── overlays ───────── */
  const stack = []; let lastFocus = null, hist = 0;
  function openOv(node) {
    if (!stack.length) lastFocus = document.activeElement;
    if (!stack.includes(node)) stack.push(node);
    if (hist < stack.length) { try { history.pushState({ aurum: 1 }, ''); hist++; } catch (e) { } }
    node.hidden = false; node.scrollTop = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => node.classList.add('open')));
    document.body.classList.add('locked');
    const c = $('.close', node); if (c) c.focus({ preventScroll: true });
  }
  function doClose(node) {
    if (!node || node.hidden) return;
    node.classList.remove('open');
    const i = stack.indexOf(node); if (i > -1) stack.splice(i, 1);
    if (node.id === 'tour') stopTour();
    if (node.id === 'viewer' || node.id === 'exhibition') clearHash();
    if (!stack.length) {
      document.body.classList.remove('locked');
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) { } }
    }
    setTimeout(() => { if (!node.classList.contains('open')) node.hidden = true; }, 520);
  }
  /* closing from a button or Escape goes through history so the phone Back button stays in step */
  function closeOv(node) {
    if (!node || node.hidden) return;
    if (stack[stack.length - 1] === node && hist >= stack.length) {
      history.back();
      setTimeout(() => { if (stack.includes(node)) { hist = Math.max(0, hist - 1); doClose(node); } }, 350); /* if the browser ignored Back */
    } else doClose(node);
  }
  addEventListener('popstate', () => { hist = Math.max(0, hist - 1); while (stack.length > hist) doClose(stack[stack.length - 1]); });
  const clearHash = () => { try { if (/^#(painting|exhibition)-/.test(location.hash)) history.replaceState(history.state, '', location.pathname + location.search); } catch (e) { } };
  const setHash = h => { try { history.replaceState(history.state, '', h); } catch (e) { } };
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-close]'); if (c) { closeOv(c.closest('.overlay')); return; }
    if (e.target.classList && e.target.classList.contains('overlay') && ['viewer', 'artistPanel', 'exhibition', 'enquiry', 'legal', 'artistHub'].includes(e.target.id)) closeOv(e.target);
  });
  let tt; function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2600); }

  /* ───────── state ───────── */
  let favs = new Set(store.get('srjan.favs', []));
  const saveFavs = () => { store.set('srjan.favs', [...favs]); $('#favCount').textContent = favs.size; };
  let view = PAINTINGS.slice();

  /* wooden and gilt frames, chosen by room so each wing has its own character */
  const FRAME = { 'Indian Heritage': 'f-oak', 'Wonders of the World': 'f-black', 'Objects and Furniture': 'f-walnut', 'Pattern and Craft': 'f-oak', 'Renaissance': 'f-gilt', 'Baroque & Golden Age': 'f-walnut', 'Romantic & Neoclassical': 'f-gilt', 'Impressionism': 'f-oak', 'Post-Impressionism': 'f-oak', 'Modern & Surrealism': 'f-black', 'Indian Masters': 'f-walnut', 'East Asian': 'f-black' };
  const CYCLE = ['f-black', 'f-oak', 'f-walnut'];
  const frameFor = p => p.custom ? CYCLE[[...String(p.exId)].reduce((a, c) => a + c.charCodeAt(0), 0) % 3] : (FRAME[p.mv] || 'f-oak');

  /* ───────── cards ───────── */
  function makeCard(p, i, opts = {}) {
    const c = el('div', 'card'); c.tabIndex = 0; c.setAttribute('role', 'button');
    c.setAttribute('aria-label', `${p.t} by ${p.artist.n}`); c.dataset.key = p.custom ? 'c:' + p.id : p.t;
    const saved = !p.custom && favs.has(p.t);
    c.innerHTML = `<div class="frame ${frameFor(p)}"><div class="mat"><div class="art"><img alt="${esc(p.t + ' by ' + p.artist.n)}" decoding="async" draggable="false"></div></div></div>
      ${p.custom && p.forSale ? '<span class="tag">Available</span>' : ''}
      ${p.custom ? '' : `<button class="save ${saved ? 'on' : ''}" aria-pressed="${saved}">${saved ? 'Saved' : 'Save'}</button>`}
      <div class="plaque"><strong>${esc(p.t)}</strong><span>${esc(p.artist.n)}</span><small>${esc(p.y)}</small></div>`;
    const art = $('.art', c), img = $('img', c);
    const rm = ROOMS.find(r => r.id === p.mv); if (rm && rm.fit === 'cover') art.classList.add('cover');
    lazy(c, () => paintInto(p, art, img, 500));
    if (p.custom) c.addEventListener('contextmenu', e => e.preventDefault());
    if (!opts.noReveal) reveal(c, (i % 6) * 55);
    const open = () => openViewer(p, opts.list || view);
    c.addEventListener('click', e => { if (e.target.closest('.save')) return; open(); });
    c.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.save')) { e.preventDefault(); open(); } });
    const sv = $('.save', c); if (sv) sv.addEventListener('click', e => { e.stopPropagation(); toggleFav(p); });
    return c;
  }
  function toggleFav(p) {
    const on = !favs.has(p.t); on ? favs.add(p.t) : favs.delete(p.t); saveFavs();
    $$('.card').forEach(c => { if (c.dataset.key === p.t) { const b = $('.save', c); if (b) { b.classList.toggle('on', on); b.textContent = on ? 'Saved' : 'Save'; b.setAttribute('aria-pressed', on); } } });
    syncViewerFav(); toast(on ? 'Saved to your collection' : 'Removed from your collection');
    if (R.spec && R.spec.saved && !$('#room').hidden) applyRoom();
  }

  /* ───────── rooms ───────── */
  let SHOW = [], wing = 'Art';
  function buildWings() {
    const ready = window.WINGS.filter(w => w.ready), box = $('#wingTabs');
    if (ready.length < 2) { box.hidden = true; return; }
    box.hidden = false; box.style.setProperty('--n', ready.length);
    box.innerHTML = ready.map(w => `<button class="${w.id === wing ? 'on' : ''}" data-w="${w.id}" role="tab" aria-selected="${w.id === wing}">${esc(w.label)}</button>`).join('');
  }
  $('#wingTabs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; wing = b.dataset.w; buildWings(); buildRooms(); });
  function buildRooms() {
    const g = $('#roomsGrid'); g.innerHTML = '';
    const order = ROOMS.filter(r => !r.hidden && (r.wing || 'Art') === wing).sort((a, b) => (b.id === 'Indian Masters') - (a.id === 'Indian Masters'));
    order.forEach((r, i) => {
      const list = byRoom(r.id), b = el('button', 'room' + (r.id === 'Indian Masters' ? ' feature' : ''));
      b.innerHTML = `<div class="room-bg"></div>${r.id === 'Indian Masters' ? '<span class="flag">Spotlight on India</span>' : ''}<span class="yrs">${esc(r.years)}</span><h3>${esc(r.name)}</h3><p>${esc(r.blurb)}</p><span class="count">${list.length} works</span>`;
      b.addEventListener('click', () => openRoom({ id: r.id }));
      g.appendChild(b); reveal(b, (i % 4) * 70);
      lazy(b, async () => { for (const p of list.slice(0, 4)) { const rec = await resolvePainting(p); if (rec) { $('.room-bg', b).style.backgroundImage = `url("${sized(rec.t0, 960)}")`; break; } } });
    });
    const mine = SHOW.filter(p => p.wing === wing);
    {
      const f = FEAT[wing], b = el('button', 'room' + (mine.length ? '' : ' opencall'));
      b.innerHTML = `<div class="room-bg"></div>${mine.length ? '' : '<span class="flag">Open call</span>'}<span class="yrs">${esc(f[1])}</span><h3>${esc(f[0])}</h3><p>${esc(f[2])}</p><span class="count">${mine.length ? mine.length + (mine.length === 1 ? ' work' : ' works') : 'Be the first to appear'}</span>`;
      b.addEventListener('click', () => openRoom({ featured: true, wing })); g.appendChild(b); reveal(b, 0);
      const t = mine.length && (mine[0].thumb || mine[0].img); if (t) $('.room-bg', b).style.backgroundImage = `url("${t}")`;
    }
  }
  const R = { spec: null, base: [], q: '', artist: '', sort: 'curated' };
  function fillArtistSelect(base) {
    const sel = $('#rartist'), names = {}; base.forEach(p => { names[akey(p)] = p.artist.n; });
    const keys = Object.keys(names).sort((x, y) => names[x].localeCompare(names[y]));
    sel.innerHTML = '<option value="">All creators</option>' + keys.map(k => `<option value="${esc(k)}">${esc(names[k])}</option>`).join('');
  }
  function openRoom(spec) {
    R.spec = spec; R.q = ''; R.artist = ''; R.sort = 'curated';
    $('#rq').value = ''; $('#rsort').value = 'curated';
    const note = $('#rmNote'); note.hidden = true;
    if (spec.id) {
      const r = ROOMS.find(x => x.id === spec.id); R.base = byRoom(r.id);
      $('#rmEyebrow').textContent = (r.wing || 'Art') + ' room'; $('#rmTitle').textContent = r.name; $('#rmYears').textContent = r.years; $('#rmBlurb').textContent = r.blurb;
      if (r.note) { note.innerHTML = r.note.split('\n\n').map(t => `<p>${esc(t)}</p>`).join(''); note.hidden = false; }
    } else if (spec.featured) {
      const f = FEAT[spec.wing || 'Art']; R.base = SHOW.filter(p => p.wing === (spec.wing || 'Art'));
      $('#rmEyebrow').textContent = f[1]; $('#rmTitle').textContent = f[0]; $('#rmYears').textContent = ''; $('#rmBlurb').textContent = f[2];
    } else if (spec.saved) {
      R.base = PAINTINGS.filter(p => favs.has(p.t));
      $('#rmEyebrow').textContent = 'My collection'; $('#rmTitle').textContent = 'Saved works'; $('#rmYears').textContent = ''; $('#rmBlurb').textContent = 'Paintings you have saved on this device.';
    } else {
      R.base = PAINTINGS.slice();
      $('#rmEyebrow').textContent = spec.search ? 'Search' : 'The permanent collection'; $('#rmTitle').textContent = 'All works'; $('#rmYears').textContent = ''; $('#rmBlurb').textContent = `Every work in the collection, ${PAINTINGS.length} in all.`;
    }
    $('#rmYears').hidden = !$('#rmYears').textContent;
    fillArtistSelect(R.spec.saved ? PAINTINGS : R.base);
    applyRoom();
    if ($('#room').hidden) openOv($('#room')); else $('#room').scrollTop = 0;
    if (spec.search) setTimeout(() => $('#rq').focus(), 350);
  }
  function applyRoom() {
    const base = R.spec.saved ? PAINTINGS.filter(p => favs.has(p.t)) : R.base, q = norm(R.q.trim());
    const list = base.filter(p => (!R.artist || akey(p) === R.artist) && (!q || q.split(/\s+/).every(w => p.hay.includes(w))));
    const s = R.sort;
    if (s === 'old') list.sort((a, b) => a.yr - b.yr); else if (s === 'new') list.sort((a, b) => b.yr - a.yr);
    else if (s === 'artist') list.sort((a, b) => a.artist.n.localeCompare(b.artist.n) || a.yr - b.yr); else if (s === 'title') list.sort((a, b) => a.t.localeCompare(b.t));
    view = list;
    const grid = $('#rmGrid'); grid.innerHTML = '';
    const frag = document.createDocumentFragment(); list.forEach((p, i) => frag.appendChild(makeCard(p, i, { list }))); grid.appendChild(frag);
    $('#rmEmpty').hidden = list.length > 0;
    const openCall = !!(R.spec.featured && !base.length), noSaved = !!(R.spec.saved && !base.length);
    $('#rmEmptyText').textContent = openCall ? `No featured work yet. This room is for living creators in the ${R.spec.wing || 'Art'} wing. Apply to be the first to appear here.` : noSaved ? 'You have not saved any works yet. Use Save on any work.' : 'No works match your search.';
    $('#rmReset').hidden = openCall || noSaved; $('#rmApply').hidden = !openCall; $('#room .toolbar').hidden = openCall;
    $('#rmCount').textContent = list.length ? `${list.length} ${list.length === 1 ? 'work' : 'works'}` : '';
    $('#rmTour').hidden = list.length < 2;
    $('#favCount').textContent = favs.size;
  }
  $('#rq').addEventListener('input', e => { clearTimeout(rqt); rqt = setTimeout(() => { R.q = e.target.value; applyRoom(); }, 160); });
  let rqt;
  $('#rartist').onchange = e => { R.artist = e.target.value; applyRoom(); };
  $('#rsort').onchange = e => { R.sort = e.target.value; applyRoom(); };
  $('#rmApply').onclick = () => openHub();
  $('#rmReset').onclick = () => { R.q = R.artist = ''; $('#rq').value = ''; $('#rartist').value = ''; applyRoom(); };
  $('#rmTour').onclick = () => startTour(view);

  /* ───────── masters ───────── */
  function portraitInto(box, a) {
    box.innerHTML = `<span class="mono">${esc(a.n.replace(/^(Raja|J\. ?M\. ?W\.|J\.-A\.-D\.) /, '').charAt(0))}</span>`;
    if (!a.pw) return;
    resolveArtist(a).then(r => { if (!r) return; const im = new Image(); im.alt = a.n; im.onload = () => { box.innerHTML = ''; box.appendChild(im); }; im.src = sized(r.t0, 250); });
  }
  function buildArtists() {
    const g = $('#artistsGrid');
    Object.keys(ARTISTS).forEach((k, i) => {
      const a = ARTISTS[k], works = PAINTINGS.filter(p => p.a === k); if (!works.length) return;
      const b = el('button', 'artist');
      b.innerHTML = `<div class="portrait"></div><div><strong>${esc(a.n)}</strong><small>${esc(a.life)}</small><em>${works.length} ${works.length === 1 ? 'work' : 'works'}</em></div>`;
      b.addEventListener('click', () => openArtist(k)); g.appendChild(b); reveal(b, (i % 4) * 50);
      const box = $('.portrait', b); box.innerHTML = `<span class="mono">${esc(a.n.charAt(0))}</span>`; lazy(b, () => portraitInto(box, a));
    });
  }
  function openArtist(k) {
    const a = ARTISTS[k];
    $('#apName').textContent = a.n; $('#apLife').textContent = a.life; $('#apFrom').textContent = a.from; $('#apBio').textContent = a.bio;
    portraitInto($('#apPortrait'), a);
    const box = $('#apWorks'); box.innerHTML = '';
    const works = PAINTINGS.filter(p => p.a === k);
    works.forEach(p => {
      const b = el('button');
      b.innerHTML = `<div class="frame ${frameFor(p)}"><div class="mat"><div class="art"><img alt="${esc(p.t)}"></div></div></div><span>${esc(p.t)}<br><i>${esc(p.y)}</i></span>`;
      paintInto(p, $('.art', b), $('img', b), 500); b.onclick = () => openViewer(p, works); box.appendChild(b);
    });
    doClose($('#viewer')); doClose($('#exhibition'));
    openOv($('#artistPanel'));
  }

  /* ───────── viewer ───────── */
  const V = { p: null, list: [], z: 1, x: 0, y: 0 };
  const vImg = $('#vImg'), vWrap = $('#vWrap');
  function openViewer(p, list) {
    V.list = list && list.includes(p) ? list : [p];
    if ($('#viewer').hidden) openOv($('#viewer'));
    loadViewer(p);
  }
  function money(p) {
    if (!p.price) return 'Price on request';
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: p.currency || 'INR', maximumFractionDigits: 0 }).format(p.price); } catch (e) { return (p.currency || '') + ' ' + p.price; }
  }
  function loadViewer(p) {
    V.p = p; resetZoom();
    const cu = !!p.custom;
    $('#vFrame').className = 'frame frame-view ' + frameFor(p);
    if (cu && !p.showcase) setHash('#exhibition-' + p.exId); else if (!cu) setHash('#painting-' + p.id); else clearHash();
    const room = ROOMS.find(r => r.id === p.mv);
    $('#vRoom').textContent = cu ? p.exTitle : (room ? room.name : p.mv);
    $('#vTitle').textContent = p.t;
    const ab = $('#vArtist'); ab.textContent = p.artist.n; ab.classList.toggle('plain', cu && (!V.canOpenEx || !!p.showcase));
    $('#vYears').textContent = cu ? p.artist.from : `${p.artist.life}, ${p.artist.from}`;
    $('#vDateRow').hidden = !p.y; $('#vDate').textContent = p.y || ''; $('#vMedRow').hidden = !p.med; $('#vMed').textContent = p.med || '';
    $('#vDimRow').hidden = !(cu && p.dimensions); $('#vDim').textContent = p.dimensions || '';
    $('#vLoc').textContent = cu ? 'Exhibited on Srjan' : p.loc;
    const text = cu ? p.s : p.s;
    $('#vStoryHead').textContent = cu ? 'About the work' : 'The story'; $('#vStory').textContent = text; $('#vStory').hidden = !text; $('#vStoryHead').hidden = !text;
    $('#vLookBox').hidden = !p.lc; if (p.lc) $('#vLook').textContent = p.lc;
    const lk = cu ? [] : (LINKMAP[p.t] || []).map(x => ({ p: byTitle(x.t), why: x.why })).filter(x => x.p);
    const ll = $('#vLinkList'); ll.innerHTML = ''; $('#vLinks').hidden = !lk.length;
    lk.forEach(x => {
      const b = el('button', 'link-item'); b.innerHTML = `<span class="li-img"><img alt=""></span><span><strong>${esc(x.p.t)}</strong><small>${esc(x.p.artist.n)}</small><em>${esc(x.why)}</em></span>`;
      resolvePainting(x.p).then(r => { if (r) $('img', b).src = sized(r.t0, 250); });
      b.onclick = () => { V.list = [x.p, ...lk.map(y => y.p).filter(q => q !== x.p), p]; loadViewer(x.p); };
      ll.appendChild(b);
    });
    $('#vSale').hidden = !(cu && p.forSale); if (cu && p.forSale) $('#vPrice').textContent = money(p);
    const rn = $('#vRights'); rn.hidden = false; if (!cu) rn.textContent = 'Image from Wikimedia Commons. Open Learn more for the source, photographer and licence.'; if (cu) rn.textContent = `Copyright ${p.artist.n}.${p.credit ? ' Photography: ' + p.credit + '.' : ''} All rights reserved. This image may not be copied or reused without written permission.`;
    $('#vFav').hidden = cu; $('#vWiki').hidden = cu; $('#vOrig').hidden = cu;
    const i = V.list.indexOf(p); $('#vCount').textContent = V.list.length > 1 ? `${i + 1} of ${V.list.length}` : '';
    $('#vPrev').hidden = $('#vNext').hidden = V.list.length < 2;
    $('#viewer').scrollTop = 0; syncViewerFav();
    $('#vWiki').href = 'https://en.wikipedia.org/w/index.php?search=' + enc(p.t + ' ' + p.artist.n); $('#vOrig').removeAttribute('href');
    vImg.classList.remove('on'); vImg.removeAttribute('src'); vImg.alt = `${p.t} by ${p.artist.n}`;
    $('#vFallback').hidden = true; $('#vSpin').classList.remove('off');
    resolvePainting(p).then(r => {
      if (V.p !== p) return;
      if (!r) return vFail(p);
      if (r.page) $('#vWiki').href = r.page; if (r.o) $('#vOrig').href = r.o;
      vImg.onload = () => { if (V.p === p) { vImg.classList.add('on'); $('#vSpin').classList.add('off'); } };
      vImg.onerror = () => { if (vImg.src !== r.t0) vImg.src = r.t0; else vFail(p); };
      vImg.src = cu ? (p.img || r.t0) : sized(r.t0, 1280);
    });
    [-1, 1].forEach(d => { const n = V.list[(i + d + V.list.length) % V.list.length]; if (n && !n.custom) resolvePainting(n); });
  }
  function vFail(p) {
    $('#vSpin').classList.add('off'); const f = $('#vFallback'); f.hidden = false;
    f.innerHTML = `<small>IMAGE UNAVAILABLE</small><span>${esc(p.t)}</span><small>${esc(p.artist.n.toUpperCase())}</small>`;
  }
  const step = d => { const i = V.list.indexOf(V.p); loadViewer(V.list[(i + d + V.list.length) % V.list.length]); };
  function syncViewerFav() { if (!V.p || V.p.custom) return; const on = favs.has(V.p.t), b = $('#vFav'); b.classList.toggle('on', on); b.textContent = on ? 'Saved' : 'Save'; }
  $('#vPrev').onclick = () => step(-1); $('#vNext').onclick = () => step(1);
  $('#vFav').onclick = () => V.p && !V.p.custom && toggleFav(V.p);
  $('#vArtist').onclick = () => { const p = V.p; if (p.custom) { if (!p.showcase && V.canOpenEx !== false) { const ex = EX.find(x => x.id === p.exId); if (ex) openExhibition(ex); } } else openArtist(p.a); };
  $('#vShare').onclick = async () => {
    const h = V.p.custom ? (V.p.showcase ? '' : '#exhibition-' + V.p.exId) : '#painting-' + V.p.id, url = location.origin + location.pathname + h;
    try { await navigator.clipboard.writeText(url); toast('Link copied'); } catch (e) { window.prompt('Copy this link:', url); }
  };
  $('#vEnquire').onclick = () => { if (V.p && V.p.custom) openEnquiry(V.p); };
  vWrap.addEventListener('contextmenu', e => { if (V.p && V.p.custom) e.preventDefault(); });

  function applyZoom(anim) {
    const w = vImg.clientWidth, h = vImg.clientHeight, mx = Math.max(0, (w * V.z - w) / 2), my = Math.max(0, (h * V.z - h) / 2);
    V.x = Math.max(-mx, Math.min(mx, V.x)); V.y = Math.max(-my, Math.min(my, V.y));
    vImg.style.transition = anim === false ? 'none' : ''; vImg.style.transform = `translate(${V.x}px,${V.y}px) scale(${V.z})`;
    vWrap.classList.toggle('zoomed', V.z > 1);
  }
  function resetZoom() { V.z = 1; V.x = V.y = 0; applyZoom(); }
  function zoomBy(f) { V.z = Math.max(1, Math.min(5, V.z * f)); if (V.z === 1) V.x = V.y = 0; applyZoom(); }
  $('#zIn').onclick = () => zoomBy(1.5); $('#zOut').onclick = () => zoomBy(1 / 1.5); $('#zReset').onclick = resetZoom;
  $('#vStage').addEventListener('wheel', e => { e.preventDefault(); zoomBy(e.deltaY < 0 ? 1.18 : 1 / 1.18); }, { passive: false });
  const ptrs = new Map(); let drag = null, moved = false, pinch = null, lastTap = 0;
  const pdist = () => { const [a, b] = [...ptrs.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; };
  vWrap.addEventListener('pointerdown', e => {
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); try { vWrap.setPointerCapture(e.pointerId); } catch (x) { }
    if (ptrs.size === 1) { drag = { x: e.clientX, y: e.clientY, ox: V.x, oy: V.y }; moved = false; }
    else if (ptrs.size === 2) { pinch = { d: pdist(), z: V.z }; drag = null; moved = true; }
  });
  vWrap.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2 && pinch) { V.z = Math.max(1, Math.min(5, pinch.z * pdist() / pinch.d)); if (V.z === 1) V.x = V.y = 0; applyZoom(false); return; }
    if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
    if (V.z > 1) { vWrap.classList.add('drag'); V.x = drag.ox + dx; V.y = drag.oy + dy; applyZoom(false); }
  });
  const endPtr = e => {
    const was = ptrs.size; ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (!ptrs.size) {
      vWrap.classList.remove('drag');
      if (e.type === 'pointerup' && !moved && was === 1) {
        const now = Date.now(), dbl = now - lastTap < 320; lastTap = now;
        if (e.pointerType === 'mouse' || dbl) { if (V.z > 1) resetZoom(); else { V.z = 2.4; applyZoom(); } }
      }
      drag = null;
    }
  };
  vWrap.addEventListener('pointerup', endPtr); vWrap.addEventListener('pointercancel', endPtr);
  let sx = null;
  $('#vStage').addEventListener('touchstart', e => { sx = e.touches.length === 1 && V.z === 1 ? e.touches[0].clientX : null; }, { passive: true });
  $('#vStage').addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 70 && V.list.length > 1) step(dx < 0 ? 1 : -1); }, { passive: true });

  /* ───────── exhibitions ───────── */
  let EX = [], exFilter = 'aurum';
  function curatedEx() {
    return window.EXHIBITIONS.map(e => ({ id: e.id, kind: 'aurum', title: e.title, by: 'Curated by Srjan', tagline: e.tagline, text: e.text, works: e.works.map(byTitle).filter(Boolean), host: null, thread: !!e.thread }));
  }
  function communityEx(list) {
    return list.filter(r => r.kind !== 'showcase').map(r => {
      const artist = { n: r.host.name, life: '', from: [r.host.city, r.host.country].filter(Boolean).join(', ') };
      const works = r.works.map(w => ({ custom: true, id: w.id, exId: r.id, exTitle: r.title, t: w.title, y: w.year || '', med: w.medium || '', dimensions: w.dimensions || '', s: w.description || '', credit: w.credit || '', forSale: w.forSale, price: w.price, currency: w.currency, img: w.img, thumb: w.thumb, artist }));
      return { id: r.id, kind: 'artist', wing: r.wing || 'Art', credits: r.credits || '', title: r.title, by: r.host.name, tagline: [r.category, artist.from].filter(Boolean).join(', '), text: r.statement, works, host: r.host, featured: r.featured, category: r.category, start: r.start, end: r.end };
    });
  }
  function showcaseWorks(list) {
    const out = [];
    list.filter(r => r.kind === 'showcase').forEach(r => {
      const artist = { n: r.host.name, life: '', from: [r.host.city, r.host.country].filter(Boolean).join(', ') };
      r.works.forEach(w => {
        const wg = r.wing || 'Art';
        const p = { custom: true, showcase: true, wing: wg, id: w.id, exId: r.id, exTitle: FEAT[wg][0], t: w.title, y: w.year || '', med: w.medium || '', dimensions: w.dimensions || '', s: w.description || '', credit: w.credit || '', forSale: w.forSale, price: w.price, currency: w.currency, img: w.img, thumb: w.thumb, artist };
        const m = /\d{4}/.exec(p.y); p.yr = m ? +m[0] : 0;
        p.hay = norm([p.t, artist.n, p.med, p.s, p.y].join(' '));
        out.push(p);
      });
    });
    return out;
  }
  const fmtDate = d => { try { return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return d; } };
  function exMeta(ex) {
    const bits = [`${ex.works.length} ${ex.works.length === 1 ? 'work' : 'works'}`];
    if (ex.category) bits.push(ex.category);
    if (ex.start && ex.end) bits.push(`${fmtDate(ex.start)} to ${fmtDate(ex.end)}`); else if (ex.start) bits.push('From ' + fmtDate(ex.start)); else if (ex.kind === 'aurum') bits.push('Permanent exhibition');
    return bits.join(', ');
  }
  function renderEx() {
    const g = $('#exGrid'); g.innerHTML = '';
    const nA = EX.filter(e => e.kind === 'aurum').length, nB = EX.filter(e => e.kind === 'artist').length;
    $('#nAurum').textContent = nA; $('#nArtist').textContent = nB;
    const list = EX.filter(e => e.kind === exFilter);
    list.forEach((ex, i) => {
      const b = el('button', 'ex-card');
      b.innerHTML = `<div class="ex-cover">${[0, 1, 2].map(() => '<div class="cell"><img alt="" decoding="async" draggable="false"></div>').join('')}</div>
        <div class="ex-info"><span class="eyebrow">${ex.thread ? 'Thread' : ex.kind === 'aurum' ? 'Curated by Srjan' : 'Hosted by a creator, ' + esc(ex.wing || 'Art')}</span><h3>${esc(ex.title)}</h3><span class="by">${esc(ex.kind === 'aurum' ? ex.tagline : 'By ' + ex.by)}</span><p>${esc(ex.text)}</p><span class="meta">${esc(exMeta(ex))}</span></div>`;
      $$('.cell', b).forEach((cell, k) => {
        const p = ex.works[k] || ex.works[0]; if (!p) return;
        lazy(cell, async () => { const r = await resolvePainting(p); if (!r) return; const im = $('img', cell); im.onload = () => cell.classList.add('ok'); im.src = sized(r.t0, 500); });
      });
      b.addEventListener('click', () => openExhibition(ex)); g.appendChild(b); reveal(b, (i % 3) * 70);
    });
    if (exFilter === 'artist') {
      const c = el('div', 'ex-card ex-cta');
      c.innerHTML = `<span class="eyebrow">Open call</span><h3>${list.length ? 'Host your own exhibition' : 'Your exhibition could be here'}</h3><p>Artists, architects and designers are invited to host their own show on Srjan. Apply, upload your work and we will review it.</p><button class="btn btn-gold small" data-host>Apply to host</button>`;
      g.appendChild(c); reveal(c, 120);
    }
  }
  $('#exTabs').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; exFilter = b.dataset.k;
    $$('#exTabs button').forEach(c => { const on = c === b; c.classList.toggle('on', on); c.setAttribute('aria-selected', on); }); renderEx();
  });

  function hostCard(h) {
    const link = safeUrl(h.links);
    const wrap = $('#exHost');
    wrap.innerHTML = `<div class="top"><div class="portrait"></div><div><h3>${esc(h.name)}</h3><span class="where">${esc([h.city, h.country].filter(Boolean).join(', '))}</span></div></div>
      ${h.bio ? `<p>${esc(h.bio)}</p>` : ''}${link ? `<a href="${esc(link)}" target="_blank" rel="noopener nofollow">${esc(h.links)}</a>` : (h.links ? `<p>${esc(h.links)}</p>` : '')}`;
    const box = $('.portrait', wrap);
    if (h.portrait) { const im = new Image(); im.alt = h.name; im.onload = () => { box.innerHTML = ''; box.appendChild(im); }; im.src = h.portrait; box.innerHTML = `<span class="mono">${esc(h.name.charAt(0))}</span>`; }
    else box.innerHTML = `<span class="mono">${esc(h.name.charAt(0))}</span>`;
    wrap.hidden = false;
  }
  function openExhibition(ex) {
    $('#exKind').textContent = ex.thread ? 'Thread, curated by Srjan' : ex.kind === 'aurum' ? 'Exhibition' : 'Creator-hosted ' + (ex.wing || 'Art') + ' exhibition';
    const cr = $('#exCredits'); cr.hidden = !ex.credits; if (ex.credits) $('#exCreditsText').textContent = ex.credits;
    $('#exTitle').textContent = ex.title; $('#exBy').textContent = ex.kind === 'aurum' ? ex.by : 'By ' + ex.by;
    $('#exMeta').textContent = exMeta(ex); $('#exText').textContent = ex.text;
    if (ex.host) hostCard(ex.host); else $('#exHost').hidden = true;
    const rn = $('#exRights'); rn.hidden = ex.kind === 'aurum'; if (ex.kind === 'artist') rn.textContent = `Works in this exhibition are the copyright of ${ex.by} and of any photographer, designer or maker credited. Reproduction or reuse without written permission is not allowed.`;
    const g = $('#exWorks'); g.innerHTML = '';
    ex.works.forEach((p, i) => g.appendChild(makeCard(p, i, { list: ex.works, noReveal: true })));
    doClose($('#viewer')); doClose($('#artistPanel'));
    if ($('#exhibition').hidden) openOv($('#exhibition')); else $('#exhibition').scrollTop = 0;
    setHash('#exhibition-' + ex.id);
  }
  /* viewer opened from an exhibition should not reopen it when the host name is tapped */
  const _openViewer = openViewer;
  openViewer = function (p, list) { V.canOpenEx = !($('#exhibition') && !$('#exhibition').hidden); _openViewer(p, list); };

  /* enquiry */
  let enqWork = null;
  function openEnquiry(p) {
    enqWork = p; $('#enqSub').textContent = `${p.t} by ${p.artist.n}`; $('#enqError').hidden = true; $('#enqForm').reset(); openOv($('#enquiry'));
  }
  $('#enqForm').addEventListener('submit', async e => {
    e.preventDefault(); const f = e.target, err = $('#enqError'); err.hidden = true;
    if (f.website_url.value) return;
    const name = f.name.value.trim(), email = f.email.value.trim();
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = 'Please enter your name and a valid email address.'; err.hidden = false; return; }
    const btn = $('button[type=submit]', f); btn.disabled = true;
    try {
      await Store.enquire({ exhibitionId: enqWork.exId, exhibitionTitle: enqWork.exTitle, workId: String(enqWork.id), workTitle: enqWork.t, name, email, message: f.message.value.trim() });
      closeOv($('#enquiry')); toast(Store.demo ? 'Demo mode: enquiry saved on this device' : 'Your enquiry has been sent');
    } catch (x) { err.textContent = 'Sorry, the enquiry could not be sent. Please try again.'; err.hidden = false; }
    btn.disabled = false;
  });

  /* ───────── guided tour ───────── */
  const T = { list: [], i: 0, playing: true, timer: null, dur: 13000 };
  function startTour(list) { T.list = (list && list.length > 1 ? list : PAINTINGS).slice(); T.i = 0; T.playing = true; $('#tPlay').textContent = 'Pause'; openOv($('#tour')); showSlide(); }
  function showSlide() {
    clearTimeout(T.timer);
    const p = T.list[T.i], room = ROOMS.find(r => r.id === p.mv);
    $('.frame-tour').className = 'frame frame-tour ' + frameFor(p);
    $('#tRoom').textContent = room ? `${wingOf(p)}: ${room.name}` : ''; $('#tTitle').textContent = p.t; $('#tMeta').textContent = `${p.artist.n}, ${p.y}`; $('#tStory').textContent = p.s;
    const img = $('#tImg'), fb = $('#tFallback'); img.classList.remove('on'); fb.hidden = true; img.alt = p.t;
    resolvePainting(p).then(r => {
      if (T.list[T.i] !== p) return;
      if (!r) { img.removeAttribute('src'); fb.hidden = false; fb.innerHTML = `<small>IMAGE UNAVAILABLE</small><span>${esc(p.t)}</span>`; return; }
      img.onload = () => { if (T.list[T.i] === p) img.classList.add('on'); }; img.onerror = () => { if (img.src !== r.t0) img.src = r.t0; };
      img.src = sized(r.t0, 1280); $('#tourBg').style.backgroundImage = `url("${sized(r.t0, 500)}")`;
    });
    const nx = T.list[(T.i + 1) % T.list.length]; resolvePainting(nx).then(r => { if (r) { const pre = new Image(); pre.src = sized(r.t0, 1280); } });
    const bar = $('#tBar'); bar.classList.remove('run'); void bar.offsetWidth; bar.style.setProperty('--dur', T.dur + 'ms');
    if (T.playing) { bar.classList.add('run'); T.timer = setTimeout(() => tourStep(1), T.dur); } else bar.style.width = '0';
  }
  const tourStep = d => { T.i = (T.i + d + T.list.length) % T.list.length; showSlide(); };
  const stopTour = () => clearTimeout(T.timer);
  $('#tPrev').onclick = () => tourStep(-1); $('#tNext').onclick = () => tourStep(1);
  $('#tPlay').onclick = () => { T.playing = !T.playing; $('#tPlay').textContent = T.playing ? 'Pause' : 'Play'; showSlide(); };

  /* ───────── keys ───────── */
  document.addEventListener('keydown', e => {
    const top = stack[stack.length - 1];
    if (e.key === 'Escape' && top) { closeOv(top); return; }
    if (!top) { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); openRoom({ all: true, search: true }); } return; }
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (top.id === 'viewer') {
      if (e.key === 'ArrowRight' && V.list.length > 1) step(1); else if (e.key === 'ArrowLeft' && V.list.length > 1) step(-1);
      else if (e.key === '+' || e.key === '=') zoomBy(1.5); else if (e.key === '-') zoomBy(1 / 1.5); else if (e.key === '0') resetZoom();
    } else if (top.id === 'tour') {
      if (e.key === 'ArrowRight') tourStep(1); else if (e.key === 'ArrowLeft') tourStep(-1); else if (e.key === ' ') { e.preventDefault(); $('#tPlay').click(); }
    }
  });

  /* ───────── hero featured ───────── */
  const POOL = ['Mona Lisa', 'The Starry Night', 'Girl with a Pearl Earring', 'The Birth of Venus', 'The Great Wave off Kanagawa', 'Liberty Leading the People', 'The Kiss', 'The Night Watch', 'Las Meninas', 'Water Lilies', 'Wanderer above the Sea of Fog', 'Impression, Sunrise', 'The Creation of Adam', 'The School of Athens', 'The Scream', 'Hunters in the Snow', 'Bani Thani', 'The Arnolfini Portrait', 'Galaxy of Musicians'];
  function buildFeatured() {
    const pool = PAINTINGS.filter(p => POOL.includes(p.t)), p = pool[Math.floor(Date.now() / 864e5) % pool.length];
    $('#featuredFrame').className = 'frame frame-lg ' + frameFor(p);
    const art = $('#featuredImg'), img = new Image(); img.alt = p.t; img.decoding = 'async'; art.appendChild(img);
    paintInto(p, art, img, 960);
    $('#featuredTitle').textContent = p.t; $('#featuredMeta').textContent = `${p.artist.n}, ${p.y}`;
    $('#featured').onclick = () => openViewer(p, PAINTINGS);
  }

  /* ───────── navigation ───────── */
  const nav = $('#nav'); let lastY = 0;
  addEventListener('scroll', () => {
    const y = scrollY; nav.classList.toggle('solid', y > 40);
    nav.classList.toggle('hide', y > 500 && y > lastY + 6 && !$('#navlinks').classList.contains('open'));
    if (y < lastY - 6) nav.classList.remove('hide'); lastY = y;
  }, { passive: true });
  const menu = $('#menuBtn');
  const closeMenu = () => { $('#navlinks').classList.remove('open'); menu.setAttribute('aria-expanded', false); };
  menu.onclick = () => { const o = $('#navlinks').classList.toggle('open'); menu.setAttribute('aria-expanded', o); };
  const hub = $('#artistHub');
  const openHub = () => openOv(hub);
  $$('.opt', hub).forEach(b => b.addEventListener('click', () => { doClose(hub); window.AurumHost && window.AurumHost.open(b.dataset.mode); }));
  const openArtistsIdx = () => openOv($('#artistsIdx'));
  $$('#navlinks a').forEach(a => a.addEventListener('click', e => {
    closeMenu();
    if (a.id === 'navTour') { e.preventDefault(); startTour(WALKLIST.length > 1 ? WALKLIST : PAINTINGS); }
    if (a.id === 'navArtists') { e.preventDefault(); openArtistsIdx(); }
    if (a.id === 'navHub') { e.preventDefault(); openHub(); }
  }));
  document.addEventListener('click', e => { if ($('#navlinks').classList.contains('open') && !e.target.closest('#navlinks, #menuBtn')) closeMenu(); });
  $('#heroTour').onclick = () => startTour(WALKLIST.length > 1 ? WALKLIST : PAINTINGS);
  $('#searchBtn').onclick = () => openRoom({ all: true, search: true });
  $('#favBtn').onclick = () => openRoom({ saved: true });
  $('#allWorksBtn').onclick = () => openRoom({ all: true });
  $('#footArtists').onclick = openArtistsIdx;
  $('#footHost').onclick = openHub;
  document.addEventListener('click', e => {
    const l = e.target.closest('[data-legal]');
    if (l) { openOv($('#legal')); if (l.dataset.legal === 'privacy') setTimeout(() => $('#legalPrivacy').scrollIntoView({ behavior: 'smooth' }), 160); else $('#legal').scrollTop = 0; }
    if (e.target.closest('[data-host]')) openHub();
  });
  /* mobile tab bar */
  $('#tabbar').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; const go = b.dataset.go;
    if (go === 'rooms' || go === 'exhibitions') { (stack.length ? Promise.resolve() : Promise.resolve()).then(() => $('#' + go).scrollIntoView()); }
    else if (go === 'search') openRoom({ all: true, search: true });
    else if (go === 'saved') openRoom({ saved: true });
    else if (go === 'hub') openHub();
  });
  addEventListener('scroll', () => { if (scrollY < 200) $$('#tabbar button').forEach(b => b.classList.toggle('on', false)); }, { passive: true });
  const tabIO = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.go === en.target.id)); }), { threshold: .35 });
  ['rooms', 'exhibitions'].forEach(id => tabIO.observe($('#' + id)));
  $$('.section-head').forEach(n => reveal(n, 0));

  /* ───────── entrance ───────── */
  function dust() {
    const cv = $('#dust'); if (!cv || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cx = cv.getContext('2d'); let W, H;
    const size = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; }; size(); addEventListener('resize', size);
    const P = Array.from({ length: 60 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.8 + .3, v: Math.random() * .35 + .08, a: Math.random() * .7 + .2, d: Math.random() * 6 }));
    (function loop(t) {
      if ($('#intro').classList.contains('gone')) return; cx.clearRect(0, 0, W, H);
      P.forEach(p => { p.y -= p.v; p.x += Math.sin(t / 1800 + p.d) * .25; if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; } cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283); cx.fillStyle = `rgba(232,200,120,${p.a * (.6 + .4 * Math.sin(t / 700 + p.d))})`; cx.fill(); });
      requestAnimationFrame(loop);
    })(0);
  }
  function enter() { $('#intro').classList.add('gone'); document.body.classList.remove('locked'); try { sessionStorage.setItem('srjan.entered', '1'); } catch (e) { } }

  function handleHash() {
    let m = /^#painting-(\d+)$/.exec(location.hash);
    if (m && PAINTINGS[+m[1]]) { enter(); openViewer(PAINTINGS[+m[1]], PAINTINGS); return true; }
    m = /^#exhibition-(.+)$/.exec(location.hash);
    if (m) { const ex = EX.find(x => x.id === m[1]); if (ex) { enter(); openExhibition(ex); return true; } }
    return false;
  }

  /* visitor count: real numbers once the database is connected */
  async function showVisitors() {
    try {
      const v = await Store.visits(n => { $('#vOnline').textContent = n; $('#vLive').hidden = false; });
      $('#vTotal').textContent = Number(v.total).toLocaleString(); $('#visitors').hidden = false;
    } catch (e) { }
  }

  /* ───────── init ───────── */
  async function init() {
    $('#yr').textContent = new Date().getFullYear();
    $('#statWorks').textContent = PAINTINGS.length;
    $('#statArtists').textContent = Object.keys(ARTISTS).filter(k => PAINTINGS.some(p => p.a === k)).length;
    buildWings(); buildRooms(); buildArtists(); buildFeatured(); saveFavs();
    EX = curatedEx(); renderEx(); showVisitors();
    $('#enter').onclick = enter;
    let seen = false; try { seen = sessionStorage.getItem('srjan.entered') === '1'; } catch (e) { }
    if (/^#painting-\d+$/.test(location.hash)) handleHash();
    else if (seen) { $('#intro').classList.add('gone'); document.body.classList.remove('locked'); }
    else dust();
    try { const all = await Store.listApproved(); SHOW = showcaseWorks(all); if (SHOW.length) buildRooms(); const community = communityEx(all); EX = community.concat(curatedEx()); renderEx(); } catch (e) { /* offline or not configured */ }
    if (/^#exhibition-/.test(location.hash)) handleHash();
  }
  window.Aurum = { openOv, closeOv, toast, esc, safeUrl, el, $, $$ };
  init();
})();
