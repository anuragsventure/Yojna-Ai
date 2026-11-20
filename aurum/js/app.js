/* AURUM — gallery engine (no dependencies) */
(function () {
  'use strict';

  /* ───────── helpers ───────── */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const enc = encodeURIComponent;
  const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  /* ───────── data prep ───────── */
  const ROOMS = window.ROOMS, ARTISTS = window.ARTISTS;
  const PAINTINGS = window.PAINTINGS;
  PAINTINGS.forEach((p, i) => {
    p.id = i;
    p.artist = ARTISTS[p.a];
    const m = /\d{4}/.exec(p.y);
    if (m) p.yr = +m[0];
    else { const c = /(\d{1,2})(st|nd|rd|th) century/.exec(p.y); p.yr = c ? (+c[1] - 1) * 100 + 50 : 1000; }
    p.hay = norm([p.t, p.artist.n, p.med, p.loc, p.mv, p.s, p.y].join(' '));
  });
  const byRoom = id => PAINTINGS.filter(p => p.mv === id);

  /* ───────── live image resolver (Wikipedia / Commons) ───────── */
  const COMMONS = 'https://commons.wikimedia.org/w/api.php';
  const IMG_KEY = 'aurum.img.v3';
  const imgCache = store.get(IMG_KEY, {});
  const pending = {};
  const queue = []; let active = 0;
  function pump() {
    while (active < 6 && queue.length) {
      const j = queue.shift(); active++;
      j.fn().then(j.res, j.rej).finally(() => { active--; pump(); });
    }
  }
  const limited = fn => new Promise((res, rej) => { queue.push({ fn, res, rej }); pump(); });
  async function jget(url) { const r = await fetch(url); if (!r.ok) throw new Error(r.status); return r.json(); }

  function fromInfo(ii, page) {
    if (!ii) return null;
    return { t0: ii.thumburl || ii.url, o: ii.url, w: ii.width, h: ii.height, page: page || null };
  }
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
    for (const pg of pages) {
      const ii = pg.imageinfo && pg.imageinfo[0];
      if (ii && /image\/(jpeg|png)/.test(ii.mime) && ii.width >= 500) return fromInfo(ii, 'https://commons.wikimedia.org/wiki/' + enc(pg.title));
    }
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
  const resolvePainting = p => resolveRecord('p:' + p.t, { f: p.f, w: p.w, q: p.q || (p.t + ' ' + p.artist.n) });
  const resolveArtist = a => resolveRecord('a:' + a.n, { w: a.pw });
  /* Wikimedia only serves standard thumbnail widths */
  const sized = (u, w) => (u && u.includes('/thumb/')) ? u.replace(/\/\d+px-/, `/${w}px-`) : u;

  function fallbackNode(p) {
    return el('div', 'fallback-art', `<small>IMAGE UNAVAILABLE</small><span>${esc(p.t)}</span><small>${esc(p.artist.n.toUpperCase())}</small>`);
  }
  /* put painting image into a placeholder; used by cards, hero, rooms, artist panel */
  async function paintInto(p, ph, img, width) {
    const r = await resolvePainting(p);
    if (!r) { ph.classList.add('fail'); ph.appendChild(fallbackNode(p)); return null; }
    if (r.w && r.h) ph.style.aspectRatio = r.w + ' / ' + r.h;
    img.onload = () => { ph.classList.add('ok'); };
    img.onerror = () => {
      if (img.src !== r.t0) img.src = r.t0;
      else { ph.classList.add('fail'); ph.appendChild(fallbackNode(p)); }
    };
    img.src = sized(r.t0, width);
    return r;
  }

  /* ───────── state ───────── */
  const state = { room: '', artist: '', q: '', sort: 'curated', favs: false };
  let favs = new Set(store.get('aurum.favs', []));
  const saveFavs = () => { store.set('aurum.favs', [...favs]); $('#favCount').textContent = favs.size; };
  let view = PAINTINGS.slice();

  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      const fn = en.target._lazy; if (fn) fn();
    });
  }, { rootMargin: '500px 500px' });
  const lazy = (node, fn) => { node._lazy = fn; io.observe(node); };

  /* ───────── cards ───────── */
  function makeCard(p, i, opts = {}) {
    const c = el('div', 'card');
    c.tabIndex = 0; c.setAttribute('role', 'button'); c.setAttribute('aria-label', `${p.t} by ${p.artist.n}`);
    c.style.position = 'relative';
    if (!opts.noDelay) c.style.animationDelay = Math.min(i * 40, 520) + 'ms';
    c.innerHTML = `<div class="frame"><div class="frame-inner"><div class="ph"><img alt="${esc(p.t + ' by ' + p.artist.n)}" decoding="async"><span class="zoomhint">VIEW</span></div></div></div>
      <button class="fav ${favs.has(p.t) ? 'on' : ''}" aria-label="Save to my collection" aria-pressed="${favs.has(p.t)}">${favs.has(p.t) ? '♥' : '♡'}</button>
      <div class="plaque"><strong>${esc(p.t)}</strong><span>${esc(p.artist.n)}</span><small>${esc(p.y)}</small></div>`;
    const ph = $('.ph', c), img = $('img', c);
    lazy(c, () => paintInto(p, ph, img, 500));
    const open = () => openViewer(p, opts.list || view);
    c.addEventListener('click', e => { if (e.target.closest('.fav')) return; open(); });
    c.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.fav')) { e.preventDefault(); open(); } });
    $('.fav', c).addEventListener('click', e => { e.stopPropagation(); toggleFav(p, c); });
    return c;
  }
  function toggleFav(p) {
    const on = !favs.has(p.t);
    on ? favs.add(p.t) : favs.delete(p.t);
    saveFavs();
    $$('.card').forEach(c => {
      if (c.getAttribute('aria-label') === `${p.t} by ${p.artist.n}`) {
        const b = $('.fav', c); b.classList.toggle('on', on); b.textContent = on ? '♥' : '♡'; b.setAttribute('aria-pressed', on);
      }
    });
    syncViewerFav();
    toast(on ? 'Saved to your collection' : 'Removed from your collection');
    if (state.favs) applyFilters(true);
  }

  /* ───────── rooms, chips, selects ───────── */
  function buildRooms() {
    const g = $('#roomsGrid');
    ROOMS.forEach(r => {
      const list = byRoom(r.id);
      const b = el('button', 'room reveal');
      b.innerHTML = `<div class="room-bg"></div><span class="yrs">${esc(r.years)}</span><h3>${esc(r.name)}</h3><p>${esc(r.blurb)}</p><span class="count">${list.length} works &rarr;</span>`;
      b.addEventListener('click', () => { setRoom(r.id); $('#collection').scrollIntoView(); });
      g.appendChild(b);
      lazy(b, async () => {
        for (const p of list.slice(0, 4)) {
          const rec = await resolvePainting(p);
          if (rec) { $('.room-bg', b).style.backgroundImage = `url("${sized(rec.t0, 500)}")`; break; }
        }
      });
    });
  }
  function buildChips() {
    const wrap = $('#chips'); wrap.innerHTML = '';
    const mk = (label, key, count) => {
      const c = el('button', 'chip', `${esc(label)} <span style="opacity:.6">${count}</span>`);
      c.dataset.k = key; c.setAttribute('role', 'tab');
      c.addEventListener('click', () => key === '__fav' ? setFavs(!state.favs) : setRoom(key));
      wrap.appendChild(c);
    };
    mk('All', '', PAINTINGS.length);
    ROOMS.forEach(r => mk(r.id, r.id, byRoom(r.id).length));
    mk('♥ My Collection', '__fav', favs.size);
  }
  function syncChips() {
    $$('.chip').forEach(c => {
      const k = c.dataset.k;
      const on = k === '__fav' ? state.favs : (!state.favs && k === state.room);
      c.classList.toggle('on', on); c.setAttribute('aria-selected', on);
      if (k === '__fav') c.innerHTML = `♥ My Collection <span style="opacity:.6">${favs.size}</span>`;
    });
  }
  function buildArtistSelect() {
    const sel = $('#artistSel');
    Object.keys(ARTISTS).filter(k => PAINTINGS.some(p => p.a === k))
      .sort((a, b) => ARTISTS[a].n.localeCompare(ARTISTS[b].n))
      .forEach(k => { const o = el('option'); o.value = k; o.textContent = ARTISTS[k].n; sel.appendChild(o); });
  }
  function setRoom(id) { state.room = id; state.favs = false; applyFilters(); }
  function setFavs(on) { state.favs = on; if (on) state.room = ''; applyFilters(); }

  /* ───────── filtering & grid ───────── */
  function applyFilters(keepScroll) {
    const q = norm(state.q.trim());
    let list = PAINTINGS.filter(p =>
      (!state.room || p.mv === state.room) &&
      (!state.artist || p.a === state.artist) &&
      (!state.favs || favs.has(p.t)) &&
      (!q || q.split(/\s+/).every(w => p.hay.includes(w))));
    const s = state.sort;
    if (s === 'old') list.sort((a, b) => a.yr - b.yr);
    else if (s === 'new') list.sort((a, b) => b.yr - a.yr);
    else if (s === 'artist') list.sort((a, b) => a.artist.n.localeCompare(b.artist.n) || a.yr - b.yr);
    else if (s === 'title') list.sort((a, b) => a.t.localeCompare(b.t));
    view = list;
    const grid = $('#grid'); grid.innerHTML = '';
    const frag = document.createDocumentFragment();
    list.forEach((p, i) => frag.appendChild(makeCard(p, i)));
    grid.appendChild(frag);
    $('#empty').hidden = list.length > 0;
    const roomName = state.room ? (ROOMS.find(r => r.id === state.room) || {}).name : '';
    $('#resultLine').textContent = state.favs
      ? (list.length ? `Your collection — ${list.length} saved ${list.length === 1 ? 'work' : 'works'}` : 'You have not saved any paintings yet. Tap the ♡ on any painting.')
      : `Showing ${list.length} of ${PAINTINGS.length} masterpieces${roomName ? ' in ' + roomName : ''}`;
    syncChips();
    $('#favCount').textContent = favs.size;
  }

  /* ───────── artists section ───────── */
  function portraitInto(box, a) {
    box.innerHTML = `<span class="mono">${esc(a.n.replace(/^(Raja|J\. ?M\. ?W\.|J\.-A\.-D\.) /, '').charAt(0))}</span>`;
    if (!a.pw) return;
    resolveArtist(a).then(r => {
      if (!r) return;
      const im = new Image(); im.alt = a.n; im.referrerPolicy = 'no-referrer';
      im.onload = () => { box.innerHTML = ''; box.appendChild(im); };
      im.src = sized(r.t0, 250);
    });
  }
  function buildArtists() {
    const g = $('#artistsGrid');
    Object.keys(ARTISTS).forEach(k => {
      const a = ARTISTS[k];
      const works = PAINTINGS.filter(p => p.a === k);
      if (!works.length) return;
      const b = el('button', 'artist');
      b.innerHTML = `<div class="portrait"></div><div><strong>${esc(a.n)}</strong><small>${esc(a.life)}</small><em>${works.length} ${works.length === 1 ? 'work' : 'works'}</em></div>`;
      b.addEventListener('click', () => openArtist(k));
      g.appendChild(b);
      const box = $('.portrait', b); box.innerHTML = `<span class="mono">${esc(a.n.charAt(0))}</span>`;
      lazy(b, () => portraitInto(box, a));
    });
  }

  function buildBharat() {
    const list = byRoom('Indian Masters');
    const rail = $('#bharatRail');
    list.forEach((p, i) => rail.appendChild(makeCard(p, i, { list, noDelay: true })));
  }

  /* ───────── overlays ───────── */
  const overlays = [];
  let lastFocus = null;
  function showOverlay(node) {
    if (!overlays.length) lastFocus = document.activeElement;
    node.hidden = false; overlays.push(node); document.body.classList.add('locked');
    node.scrollTop = 0;
    const c = $('.close', node); if (c) c.focus({ preventScroll: true });
  }
  function hideOverlay(node) {
    node.hidden = true;
    const i = overlays.indexOf(node); if (i > -1) overlays.splice(i, 1);
    if (!overlays.length) {
      document.body.classList.remove('locked');
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) { } }
    }
  }
  function closeTop() {
    const top = overlays[overlays.length - 1]; if (!top) return;
    if (top.id === 'tour') stopTour();
    if (top.id === 'viewer') { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { } }
    hideOverlay(top);
  }
  $$('[data-close]').forEach(b => b.addEventListener('click', closeTop));
  ['viewer', 'artistPanel'].forEach(id => $('#' + id).addEventListener('click', e => { if (e.target.id === id) closeTop(); }));

  /* ───────── viewer ───────── */
  const V = { p: null, list: [], rec: null, z: 1, x: 0, y: 0 };
  const vImg = $('#vImg'), vWrap = $('#vWrap');

  function openViewer(p, list) {
    V.list = list && list.length ? list : PAINTINGS;
    if (!V.list.includes(p)) V.list = PAINTINGS;
    if ($('#viewer').hidden) showOverlay($('#viewer'));
    loadViewer(p);
  }
  function loadViewer(p) {
    V.p = p; resetZoom();
    try { history.replaceState(null, '', '#painting-' + p.id); } catch (e) { }
    const room = ROOMS.find(r => r.id === p.mv);
    $('#vRoom').textContent = room ? room.name : p.mv;
    $('#vTitle').textContent = p.t;
    const ab = $('#vArtist'); ab.textContent = p.artist.n;
    $('#vYears').textContent = `${p.artist.life} · ${p.artist.from}`;
    $('#vDate').textContent = p.y; $('#vMed').textContent = p.med; $('#vLoc').textContent = p.loc;
    $('#vStory').textContent = p.s;
    $('#vLookBox').hidden = !p.lc; if (p.lc) $('#vLook').textContent = p.lc;
    const i = V.list.indexOf(p);
    $('#vCount').textContent = `${i + 1} / ${V.list.length}`;
    $('#vInfo').scrollTop = 0; $('#viewer').scrollTop = 0;
    syncViewerFav();
    $('#vWiki').href = 'https://en.wikipedia.org/w/index.php?search=' + enc(p.t + ' ' + p.artist.n);
    $('#vOrig').removeAttribute('href');
    vImg.classList.remove('on'); vImg.removeAttribute('src'); vImg.alt = `${p.t} by ${p.artist.n}`;
    $('#vFallback').hidden = true; $('#vSpin').classList.remove('off');
    resolvePainting(p).then(r => {
      if (V.p !== p) return;
      V.rec = r;
      if (!r) return vFail(p);
      if (r.page) $('#vWiki').href = r.page;
      $('#vOrig').href = r.o;
      vImg.onload = () => { if (V.p !== p) return; vImg.classList.add('on'); $('#vSpin').classList.add('off'); };
      vImg.onerror = () => { if (vImg.src !== r.t0) vImg.src = r.t0; else vFail(p); };
      vImg.src = sized(r.t0, 1280);
    });
    // warm neighbours
    [-1, 1].forEach(d => { const n = V.list[(i + d + V.list.length) % V.list.length]; resolvePainting(n); });
  }
  function vFail(p) {
    $('#vSpin').classList.add('off');
    const f = $('#vFallback'); f.hidden = false;
    f.innerHTML = `<small>IMAGE UNAVAILABLE</small><span>${esc(p.t)}</span><small>${esc(p.artist.n.toUpperCase())}</small>`;
  }
  function step(d) { const i = V.list.indexOf(V.p); loadViewer(V.list[(i + d + V.list.length) % V.list.length]); }
  function syncViewerFav() {
    if (!V.p) return;
    const on = favs.has(V.p.t), b = $('#vFav');
    b.classList.toggle('on', on); b.innerHTML = on ? '&#9829; Saved' : '&#9825; Save';
  }
  $('#vPrev').onclick = () => step(-1);
  $('#vNext').onclick = () => step(1);
  $('#vFav').onclick = () => V.p && toggleFav(V.p);
  $('#vArtist').onclick = () => { const k = V.p.a; openArtist(k); };
  $('#vShare').onclick = async () => {
    const url = location.origin + location.pathname + '#painting-' + V.p.id;
    try { await navigator.clipboard.writeText(url); toast('Link copied'); }
    catch (e) { window.prompt('Copy this link:', url); }
  };

  /* zoom & pan */
  function applyZoom(anim) {
    const w = vImg.clientWidth, h = vImg.clientHeight;
    const mx = Math.max(0, (w * V.z - w) / 2), my = Math.max(0, (h * V.z - h) / 2);
    V.x = Math.max(-mx, Math.min(mx, V.x)); V.y = Math.max(-my, Math.min(my, V.y));
    vImg.style.transition = anim === false ? 'none' : '';
    vImg.style.transform = `translate(${V.x}px,${V.y}px) scale(${V.z})`;
    vWrap.classList.toggle('zoomed', V.z > 1);
  }
  function resetZoom() { V.z = 1; V.x = V.y = 0; applyZoom(); }
  function zoomBy(f) { V.z = Math.max(1, Math.min(5, V.z * f)); if (V.z === 1) { V.x = V.y = 0; } applyZoom(); }
  $('#zIn').onclick = () => zoomBy(1.5);
  $('#zOut').onclick = () => zoomBy(1 / 1.5);
  $('#zReset').onclick = resetZoom;
  $('#vStage').addEventListener('wheel', e => { e.preventDefault(); zoomBy(e.deltaY < 0 ? 1.18 : 1 / 1.18); }, { passive: false });
  let drag = null, moved = false;
  vWrap.addEventListener('pointerdown', e => {
    drag = { x: e.clientX, y: e.clientY, ox: V.x, oy: V.y }; moved = false;
    vWrap.setPointerCapture(e.pointerId);
  });
  vWrap.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
    if (V.z > 1) { vWrap.classList.add('drag'); V.x = drag.ox + dx; V.y = drag.oy + dy; applyZoom(false); }
  });
  const endDrag = () => { drag = null; vWrap.classList.remove('drag'); };
  vWrap.addEventListener('pointerup', e => {
    if (!moved) { V.z > 1 ? resetZoom() : (V.z = 2.4, applyZoom()); }
    endDrag();
  });
  vWrap.addEventListener('pointercancel', endDrag);
  /* swipe between paintings on touch when not zoomed */
  let sx = null;
  $('#vStage').addEventListener('touchstart', e => { sx = e.touches.length === 1 && V.z === 1 ? e.touches[0].clientX : null; }, { passive: true });
  $('#vStage').addEventListener('touchend', e => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 70) step(dx < 0 ? 1 : -1);
  }, { passive: true });

  /* ───────── artist panel ───────── */
  function openArtist(k) {
    const a = ARTISTS[k];
    $('#apName').textContent = a.n; $('#apLife').textContent = a.life; $('#apFrom').textContent = a.from;
    $('#apBio').textContent = a.bio;
    portraitInto($('#apPortrait'), a);
    const box = $('#apWorks'); box.innerHTML = '';
    const works = PAINTINGS.filter(p => p.a === k);
    works.forEach(p => {
      const b = el('button');
      b.innerHTML = `<div class="frame"><div class="frame-inner"><div class="ph"><img alt="${esc(p.t)}"></div></div></div><span>${esc(p.t)}<br><i style="color:var(--gold)">${esc(p.y)}</i></span>`;
      paintInto(p, $('.ph', b), $('img', b), 500).then(() => { $('.ph', b).style.aspectRatio = '1'; });
      b.onclick = () => openViewer(p, works);
      box.appendChild(b);
    });
    if ($('#artistPanel').hidden) showOverlay($('#artistPanel'));
    $('#artistPanel').scrollTop = 0;
  }
  /* viewer → artist: close the viewer first so the panel sits on top cleanly */
  const _openArtist = openArtist;
  openArtist = function (k) {
    if (!$('#viewer').hidden) { hideOverlay($('#viewer')); try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { } }
    _openArtist(k);
  };

  /* ───────── guided tour ───────── */
  const T = { list: [], i: 0, playing: true, timer: null, dur: 13000 };
  function startTour(list) {
    T.list = (list && list.length > 1 ? list : PAINTINGS).slice(); T.i = 0; T.playing = true;
    showOverlay($('#tour'));
    $('#tPlay').innerHTML = '&#10074;&#10074;';
    showSlide();
  }
  function showSlide() {
    clearTimeout(T.timer);
    const p = T.list[T.i], room = ROOMS.find(r => r.id === p.mv);
    $('#tRoom').textContent = room ? room.name : '';
    $('#tTitle').textContent = p.t;
    $('#tMeta').textContent = `${p.artist.n} · ${p.y}`;
    $('#tStory').textContent = p.s;
    const img = $('#tImg'), fb = $('#tFallback');
    img.classList.remove('on'); fb.hidden = true; img.alt = p.t;
    resolvePainting(p).then(r => {
      if (T.list[T.i] !== p) return;
      if (!r) { img.removeAttribute('src'); fb.hidden = false; fb.innerHTML = `<small>IMAGE UNAVAILABLE</small><span>${esc(p.t)}</span>`; return; }
      img.onload = () => { if (T.list[T.i] === p) img.classList.add('on'); };
      img.onerror = () => { if (img.src !== r.t0) img.src = r.t0; };
      img.src = sized(r.t0, 1280);
      $('#tourBg').style.backgroundImage = `url("${sized(r.t0, 500)}")`;
    });
    const nx = T.list[(T.i + 1) % T.list.length]; resolvePainting(nx).then(r => { if (r) { const pre = new Image(); pre.src = sized(r.t0, 1280); } });
    // progress
    const bar = $('#tBar'); bar.classList.remove('run'); void bar.offsetWidth;
    bar.style.setProperty('--dur', T.dur + 'ms');
    if (T.playing) { bar.classList.add('run'); T.timer = setTimeout(() => tourStep(1), T.dur); }
    else bar.style.width = '0';
  }
  function tourStep(d) { T.i = (T.i + d + T.list.length) % T.list.length; showSlide(); }
  function stopTour() { clearTimeout(T.timer); }
  $('#tPrev').onclick = () => tourStep(-1);
  $('#tNext').onclick = () => tourStep(1);
  $('#tPlay').onclick = () => {
    T.playing = !T.playing;
    $('#tPlay').innerHTML = T.playing ? '&#10074;&#10074;' : '&#9654;';
    $('#tPlay').setAttribute('aria-label', T.playing ? 'Pause' : 'Play');
    showSlide();
  };

  /* ───────── global keys ───────── */
  document.addEventListener('keydown', e => {
    const top = overlays[overlays.length - 1];
    if (e.key === 'Escape' && top) { closeTop(); return; }
    if (!top) { if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); $('#q').focus(); } return; }
    if (top.id === 'viewer') {
      if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === '+' || e.key === '=') zoomBy(1.5);
      else if (e.key === '-') zoomBy(1 / 1.5);
      else if (e.key === '0') resetZoom();
    } else if (top.id === 'tour') {
      if (e.key === 'ArrowRight') tourStep(1);
      else if (e.key === 'ArrowLeft') tourStep(-1);
      else if (e.key === ' ') { e.preventDefault(); $('#tPlay').click(); }
    }
  });

  /* ───────── hero featured ───────── */
  const POOL = ['Mona Lisa', 'The Starry Night', 'Girl with a Pearl Earring', 'The Birth of Venus', 'The Great Wave off Kanagawa', 'Liberty Leading the People', 'The Kiss', 'The Night Watch', 'Las Meninas', 'Water Lilies', 'Wanderer above the Sea of Fog', 'Impression, Sunrise', 'The Creation of Adam', 'The School of Athens', 'The Scream', 'Hunters in the Snow', 'Bani Thani', 'Arnolfini Portrait', 'The Arnolfini Portrait', 'Galaxy of Musicians'];
  function buildFeatured() {
    const pool = PAINTINGS.filter(p => POOL.includes(p.t));
    const day = Math.floor(Date.now() / 864e5);
    const p = pool[day % pool.length];
    const slot = $('#featuredImg'), img = new Image();
    img.alt = p.t; slot.appendChild(img);
    paintInto(p, slot, img, 960).then(r => {
      slot.classList.remove('skeleton');
      if (r && r.w && r.h) { slot.style.aspectRatio = r.w + ' / ' + r.h; slot.style.maxHeight = '62vh'; }
      img.style.objectFit = 'contain';
    });
    $('#featuredTitle').textContent = p.t;
    $('#featuredMeta').textContent = `${p.artist.n} · ${p.y}`;
    $('#featured').onclick = () => openViewer(p, PAINTINGS);
  }

  /* ───────── nav, intro, misc ───────── */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('solid', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  $('#menuBtn').onclick = () => $('#navlinks').classList.toggle('open');
  $$('#navlinks a').forEach(a => a.addEventListener('click', e => {
    $('#navlinks').classList.remove('open');
    if (a.id === 'navTour') { e.preventDefault(); startTour(PAINTINGS); }
  }));
  $('#heroTour').onclick = () => startTour(PAINTINGS);
  $('#bharatBtn').onclick = () => { setRoom('Indian Masters'); $('#collection').scrollIntoView(); };
  $('#favBtn').onclick = () => { setFavs(true); $('#collection').scrollIntoView(); };
  $('#resetBtn').onclick = () => { state.room = state.artist = state.q = ''; state.favs = false; $('#q').value = ''; $('#artistSel').value = ''; applyFilters(); };
  let qt; $('#q').addEventListener('input', e => { clearTimeout(qt); qt = setTimeout(() => { state.q = e.target.value; applyFilters(); }, 160); });
  $('#artistSel').onchange = e => { state.artist = e.target.value; applyFilters(); };
  $('#sortSel').onchange = e => { state.sort = e.target.value; applyFilters(); };

  let tt; function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* reveal-on-scroll */
  const rio = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); rio.unobserve(en.target); } }), { threshold: .12 });
  function reveals() {
    $$('.section-head,.bharat-copy,.reveal').forEach((n, i) => { n.classList.add('reveal'); n.style.transitionDelay = (n.matches('.room') ? (i % 4) * 90 : 0) + 'ms'; rio.observe(n); });
  }

  /* gold dust on the entrance screen */
  function dust() {
    const cv = $('#dust'); if (!cv || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cx = cv.getContext('2d'); let W, H, run = true;
    const size = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; };
    size(); addEventListener('resize', size);
    const P = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.8 + .3, v: Math.random() * .35 + .08, a: Math.random() * .7 + .2, d: Math.random() * 6 }));
    (function loop(t) {
      if (!run || $('#intro').classList.contains('gone')) return;
      cx.clearRect(0, 0, W, H);
      P.forEach(p => {
        p.y -= p.v; p.x += Math.sin(t / 1800 + p.d) * .25; if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
        cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283);
        cx.fillStyle = `rgba(232,200,120,${p.a * (.6 + .4 * Math.sin(t / 700 + p.d))})`; cx.fill();
      });
      requestAnimationFrame(loop);
    })(0);
  }
  function enter() {
    $('#intro').classList.add('gone'); document.body.classList.remove('locked');
    try { sessionStorage.setItem('aurum.entered', '1'); } catch (e) { }
  }

  /* deep links */
  function handleHash() {
    const m = /^#painting-(\d+)$/.exec(location.hash);
    if (m && PAINTINGS[+m[1]]) { enter(); openViewer(PAINTINGS[+m[1]], PAINTINGS); return true; }
    return false;
  }

  /* ───────── init ───────── */
  function init() {
    $('#yr').textContent = new Date().getFullYear();
    $('#statWorks').textContent = PAINTINGS.length;
    $('#statArtists').textContent = Object.keys(ARTISTS).filter(k => PAINTINGS.some(p => p.a === k)).length;
    buildRooms(); buildChips(); buildArtistSelect(); buildArtists(); buildBharat(); buildFeatured();
    applyFilters(); saveFavs(); reveals();
    $('#enter').onclick = enter;
    let seen = false; try { seen = sessionStorage.getItem('aurum.entered') === '1'; } catch (e) { }
    if (!handleHash()) {
      if (seen) { $('#intro').classList.add('gone'); } else { document.body.classList.add('locked'); dust(); }
    }
    addEventListener('hashchange', handleHash);
  }
  init();
})();
