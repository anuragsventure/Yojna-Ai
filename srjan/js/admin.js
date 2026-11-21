/* Srjan admin: review, approve, decline, feature */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const A = window.AurumStore.admin, S = window.AurumStore;
  let tab = 'pending', tt;
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2400); };
  const when = ts => { try { return new Date(ts).toLocaleString(); } catch (e) { return ''; } };

  async function boot() {
    $('#demoBanner').hidden = !S.demo;
    let sess = null; try { sess = await A.session(); } catch (e) { }
    if (!sess) { $('#login').hidden = false; return; }
    if (S.adminEmail && sess.email.toLowerCase() !== S.adminEmail.toLowerCase()) { $('#denied').hidden = false; $('#signOut').hidden = false; $('#who').textContent = sess.email; return; }
    $('#login').hidden = true; $('#dash').hidden = false; $('#signOut').hidden = S.demo; $('#who').textContent = S.demo ? '' : sess.email;
    await refresh();
  }
  $('#login').addEventListener('submit', async e => {
    e.preventDefault(); const err = $('#loginError'); err.hidden = true;
    try { await A.signIn($('#loginEmail').value.trim()); $('#loginSent').hidden = false; } catch (x) { err.textContent = 'Could not send the link. Check the address and try again.'; err.hidden = false; }
  });
  $('#signOut').onclick = async () => { await A.signOut(); location.reload(); };
  $('#tabs').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; tab = b.dataset.t; $$('#tabs .chip').forEach(c => c.classList.toggle('on', c === b)); render(); });

  async function refresh() {
    try { const c = await A.counts(); ['pending', 'approved', 'rejected'].forEach(k => $('#n-' + k).textContent = c[k]); const q = await A.enquiries(); $('#n-enq').textContent = q.length; } catch (e) { toast('Could not load data'); }
    render();
  }
  async function render() {
    const list = $('#list'); list.innerHTML = '<p class="muted">Loading</p>';
    try {
      if (tab === 'enquiries') {
        const q = await A.enquiries();
        list.innerHTML = q.length ? q.map(r => `<div class="enq"><b>${esc(r.workTitle || 'General')}</b><span class="muted">${esc(r.exhibitionTitle || '')}</span><span>${esc(r.name)}, <a class="inline-link" href="mailto:${esc(r.email)}">${esc(r.email)}</a></span><p>${esc(r.message || '')}</p><span class="muted">${esc(when(r.createdAt))}</span></div>`).join('') : '<p class="muted">No enquiries yet.</p>';
        return;
      }
      const items = await A.list(tab);
      if (!items.length) { list.innerHTML = `<p class="muted">Nothing here yet.</p>`; return; }
      list.innerHTML = ''; items.forEach(x => list.appendChild(card(x)));
    } catch (e) { list.innerHTML = '<p class="form-error">Could not load. You may need to sign in again.</p>'; }
  }
  function card(x) {
    const d = document.createElement('article'); d.className = 'sub';
    const pv = x.priv || {};
    d.innerHTML = `<div class="sub-head"><div><span class="ref">Ref ${esc(x.ref)}</span><h2>${esc(x.title)}</h2><span class="by">${esc(x.host.name)}, ${esc([x.host.city, x.host.country].filter(Boolean).join(', '))}</span></div>
      <div><span class="pill on">${x.kind === 'showcase' ? 'Feature request' : 'Exhibition'}</span>${x.promoOk ? '<span class="pill">Promo OK</span>' : ''}<span class="pill">${esc(x.category || 'No category')}</span></div></div>
      <dl><dt>Submitted</dt><dd>${esc(when(x.createdAt))}</dd><dt>Rights accepted</dt><dd>${esc(when(x.rightsAt))}</dd>
        <dt>Contact</dt><dd>${esc(pv.email || 'Not visible')} ${pv.phone ? ', ' + esc(pv.phone) : ''}</dd><dt>Links</dt><dd>${esc(x.host.links || 'None')}</dd>
        ${x.kind === 'showcase' ? '' : `<dt>Dates</dt><dd>${x.start || x.end ? esc((x.start || 'Open') + ' to ' + (x.end || 'Open')) : 'Not set'}</dd>`}</dl>
      ${x.statement ? `<div><span class="eyebrow">Statement</span><p class="txt">${esc(x.statement)}</p></div>` : ''}
      <div><span class="eyebrow">About the artist</span><p class="txt">${esc(x.host.bio)}</p></div>
      <div><span class="eyebrow">${x.works.length} artworks</span><div class="sub-works">${x.works.map(w => `<figure data-full="${esc(w.img)}"><img src="${esc(w.thumb)}" alt="${esc(w.title)}"><figcaption>${esc(w.title)}${w.year ? ', ' + esc(w.year) : ''}${w.forSale ? ', for sale' : ''}</figcaption></figure>`).join('')}</div></div>
      <div class="sub-actions"><textarea placeholder="Note to self (optional)">${esc(x.adminNote)}</textarea></div>`;
    const bar = $('.sub-actions', d);
    const btn = (label, cls, fn) => { const b = document.createElement('button'); b.className = 'btn small ' + cls; b.textContent = label; b.onclick = async () => { b.disabled = true; try { await fn(); } catch (e) { toast('Something went wrong'); } b.disabled = false; }; bar.appendChild(b); return b; };
    const note = () => $('textarea', d).value.trim();
    if (x.status !== 'approved') btn('Approve', 'btn-gold', async () => { await A.update(x.id, { status: 'approved', adminNote: note() }); toast('Approved and published'); refresh(); });
    if (x.status !== 'rejected') btn('Decline', 'btn-ghost', async () => { await A.update(x.id, { status: 'rejected', adminNote: note() }); toast('Declined'); refresh(); });
    if (x.status !== 'pending') btn('Move to pending', 'btn-ghost', async () => { await A.update(x.id, { status: 'pending' }); refresh(); });
    let armed = false; const del = btn('Delete', 'btn-ghost', async () => { if (!armed) { armed = true; del.textContent = 'Click again to confirm'; setTimeout(() => { armed = false; del.textContent = 'Delete'; }, 4000); return; } await A.remove(x.id); toast('Deleted'); refresh(); });
    $$('.sub-works figure', d).forEach(f => f.onclick = () => { const l = document.createElement('div'); l.className = 'lightbox'; l.innerHTML = `<img src="${esc(f.dataset.full)}" alt="">`; l.onclick = () => l.remove(); document.body.appendChild(l); });
    return d;
  }
  boot();
})();
