/* AURUM: host an exhibition (application form) */
(function () {
  'use strict';
  const { openOv, closeOv, toast, esc, $, $$ } = window.Aurum;
  const Store = window.AurumStore;
  const root = $('#hostForm'), form = $('#hf');
  const MAX_BYTES = 25 * 1024 * 1024;
  let stepNo = 1, works = [], portrait = null, busy = false, needReset = true, mode = 'exhibition';
  const showcase = () => mode === 'showcase';
  const maxWorks = () => showcase() ? 6 : Store.maxWorks;
  const order = () => showcase() ? [1, 3, 4] : [1, 2, 3, 4];

  $('#demoNote').hidden = !Store.demo;

  /* ───────── images ───────── */
  async function toBitmap(file) {
    if (window.createImageBitmap) { try { return await createImageBitmap(file); } catch (e) { } }
    return new Promise((res, rej) => { const im = new Image(), u = URL.createObjectURL(file); im.onload = () => res(im); im.onerror = rej; im.src = u; });
  }
  async function shrink(src, max, q) {
    const w0 = src.width, h0 = src.height, k = Math.min(1, max / Math.max(w0, h0));
    const c = document.createElement('canvas'); c.width = Math.round(w0 * k); c.height = Math.round(h0 * k);
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(src, 0, 0, c.width, c.height);
    return new Promise(res => c.toBlob(b => res(b), 'image/jpeg', q));
  }
  async function processFile(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error(`${file.name} is not a JPG, PNG or WebP image.`);
    if (file.size > MAX_BYTES) throw new Error(`${file.name} is larger than 25 MB.`);
    const bmp = await toBitmap(file);
    if (bmp.width < 600 && bmp.height < 600) throw new Error(`${file.name} is too small. Please use an image at least 600 pixels on its longest side.`);
    const full = await shrink(bmp, 2000, .86), thumb = await shrink(bmp, 700, .82);
    return { full, thumb, url: URL.createObjectURL(thumb) };
  }

  /* ───────── steps ───────── */
  function show(n) {
    stepNo = n; const ord = order(), pos = ord.indexOf(n);
    $$('section[data-step]', form).forEach(sec => sec.hidden = +sec.dataset.step !== n);
    $$('#stepper li').forEach((li, i) => { const st = i + 1, vis = ord.includes(st); li.hidden = !vis; li.classList.toggle('on', st === n); li.classList.toggle('past', vis && ord.indexOf(st) < pos); });
    $('#stepper').style.gridTemplateColumns = `repeat(${ord.length},1fr)`;
    $('#hfBack').hidden = pos === 0; $('#hfNext').hidden = n === 4; $('#hfSubmit').hidden = n !== 4;
    $('#formError').hidden = true;
    if (n === 4) buildReview();
    root.scrollTop = 0;
  }
  function fail(msg, nodes) {
    const e = $('#formError'); e.textContent = msg; e.hidden = false;
    (nodes || []).forEach(n => n.closest('.fld, .check') && n.closest('.fld, .check').classList.add('bad'));
    if (nodes && nodes[0]) nodes[0].focus({ preventScroll: false });
  }
  const clearBad = () => $$('.bad', root).forEach(n => n.classList.remove('bad'));
  form.addEventListener('input', e => { $('#formError').hidden = true; const f = e.target.closest('.fld, .check'); if (f) f.classList.remove('bad'); const c = $(`.count[data-for="${e.target.name}"]`); if (c) c.textContent = `${e.target.value.length} / ${e.target.maxLength}`; });

  function validate(n) {
    clearBad();
    const q = sel => $$(sel, $(`section[data-step="${n}"]`, form));
    if (n === 1 || n === 2) {
      const bad = q('[required]').filter(i => !i.value.trim());
      if (bad.length) { fail('Please fill in the required fields.', bad); return false; }
      if (n === 1) {
        const em = form.email; if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value.trim())) { fail('Please enter a valid email address.', [em]); return false; }
        if (form.bio.value.trim().length < 40) { fail('Please write at least a couple of sentences about yourself.', [form.bio]); return false; }
      }
      if (n === 2) {
        if (form.statement.value.trim().length < 60) { fail('Please write a short exhibition statement (at least a few sentences).', [form.statement]); return false; }
        if (form.start.value && form.end.value && form.end.value < form.start.value) { fail('The closing date must come after the opening date.', [form.end]); return false; }
      }
    }
    if (n === 3) {
      if (!works.length) { fail('Please add at least one artwork.'); return false; }
      const noTitle = works.filter(w => !w.title.trim());
      if (noTitle.length) { fail('Every artwork needs a title.', $$('.work-item input[data-f="title"]').filter(i => !i.value.trim())); return false; }
      const noPrice = works.filter(w => w.forSale && !(+w.price > 0));
      if (noPrice.length) { fail('Please enter a price for each work marked as available, or untick it.', $$('.work-item input[data-f="price"]').filter((i, k) => works[k] && works[k].forSale && !(+works[k].price > 0))); return false; }
    }
    return true;
  }
  $('#hfNext').onclick = () => { if (!busy && validate(stepNo)) { const o = order(); show(o[o.indexOf(stepNo) + 1]); } };
  $('#hfBack').onclick = () => { const o = order(); show(o[o.indexOf(stepNo) - 1]); };

  /* ───────── portrait ───────── */
  $('#hfPortraitFile').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) throw new Error('Please choose a JPG, PNG or WebP photo.');
      const bmp = await toBitmap(f); portrait = await shrink(bmp, 600, .85);
      const box = $('#hfPortrait'); box.innerHTML = ''; const im = new Image(); im.alt = 'Your portrait'; im.src = URL.createObjectURL(portrait); box.appendChild(im);
    } catch (x) { fail(x.message); }
    e.target.value = '';
  });

  /* ───────── works ───────── */
  const CUR = ['INR', 'USD', 'EUR', 'GBP'];
  function renderWorks() {
    const list = $('#worksList'); list.innerHTML = '';
    works.forEach((w, i) => {
      const d = document.createElement('div'); d.className = 'work-item';
      d.innerHTML = `<div class="thumb"><img alt="" src="${w.url}"></div>
        <div class="work-fields">
          <label class="fld"><span>Title <i>required</i></span><input data-f="title" type="text" maxlength="160" value="${esc(w.title)}"></label>
          <div class="work-row">
            <label class="fld"><span>Year</span><input data-f="year" type="text" maxlength="20" value="${esc(w.year)}"></label>
            <label class="fld"><span>Medium</span><input data-f="medium" type="text" maxlength="120" value="${esc(w.medium)}" placeholder="Oil on canvas"></label>
            <label class="fld"><span>Size</span><input data-f="dimensions" type="text" maxlength="60" value="${esc(w.dimensions)}" placeholder="60 x 80 cm"></label>
          </div>
          <label class="fld"><span>Description <i>optional</i></span><textarea data-f="description" maxlength="1500" rows="3">${esc(w.description)}</textarea></label>
          <div class="work-sale">
            <label class="check"><input type="checkbox" data-f="forSale" ${w.forSale ? 'checked' : ''}><span>Available for sale</span></label>
            <label class="fld"><span>Price</span><input data-f="price" type="number" min="0" step="any" inputmode="decimal" value="${esc(w.price)}" ${w.forSale ? '' : 'disabled'}></label>
            <label class="fld"><span>Currency</span><select data-f="currency" ${w.forSale ? '' : 'disabled'}>${CUR.map(c => `<option ${c === w.currency ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
          </div>
          <div><button type="button" class="btn btn-ghost small" data-remove>Remove this work</button></div>
        </div>`;
      d.addEventListener('input', e => {
        const f = e.target.dataset.f; if (!f) return;
        w[f] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        if (f === 'forSale') { $('[data-f=price]', d).disabled = $('[data-f=currency]', d).disabled = !w.forSale; }
        e.target.closest('.fld') && e.target.closest('.fld').classList.remove('bad');
      });
      $('[data-remove]', d).onclick = () => { URL.revokeObjectURL(w.url); works.splice(i, 1); renderWorks(); };
      list.appendChild(d);
    });
    $('#drop').hidden = works.length >= maxWorks();
  }
  async function addFiles(files) {
    const room = maxWorks() - works.length; const take = [...files].slice(0, room);
    if (files.length > room) fail(`You can add up to ${maxWorks()} works. Only the first ${room} were added.`);
    for (const f of take) {
      try { const r = await processFile(f); works.push({ title: f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 120), year: '', medium: '', dimensions: '', description: '', forSale: false, price: '', currency: 'INR', full: r.full, thumb: r.thumb, url: r.url }); }
      catch (x) { fail(x.message || 'That image could not be read.'); }
    }
    renderWorks();
  }
  $('#hfFiles').addEventListener('change', e => { addFiles(e.target.files); e.target.value = ''; });
  const drop = $('#drop');
  ['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => addFiles(e.dataTransfer.files));

  /* ───────── review and submit ───────── */
  function buildReview() {
    const v = n => form[n].value.trim();
    const head = showcase() ? 'Featured paintings' : v('title');
    $('#review').innerHTML = `<h4>${esc(head)}</h4>
      <div class="r"><b>By</b><span>${esc(v('name'))}, ${esc(v('city'))}, ${esc(v('country'))}</span></div>
      <div class="r"><b>Type</b><span>${showcase() ? 'Feature request for the Featured Artists room' : esc(v('category')) + ' exhibition'}</span></div>
      <div class="r"><b>Works</b><span>${works.length}, of which ${works.filter(w => w.forSale).length} available for sale</span></div>
      <div class="review-thumbs">${works.map(w => `<img alt="" src="${w.url}">`).join('')}</div>`;
  }
  form.addEventListener('submit', async e => {
    e.preventDefault(); if (busy) return;
    if (form.website_url.value) { done('00000000'); return; }
    clearBad();
    const req = ['c1', 'c2', 'c3', 'c4'].map(n => form[n]);
    const miss = req.filter(c => !c.checked);
    if (miss.length) { fail('Please confirm each statement in "Rights and consent" to continue.', miss); return; }
    const last = +(localStorage.getItem('aurum.lastSubmit') || 0), cnt = +(localStorage.getItem('aurum.submitCount') || 0);
    if (Date.now() - last < 3600e3 && cnt >= 3) { fail('You have sent several applications recently. Please try again later.'); return; }
    busy = true; $('#hfSubmit').disabled = true; $('#hfBack').disabled = true; $('#progress').hidden = false; $('#formError').hidden = true;
    const v = n => form[n].value.trim();
    try {
      const res = await Store.submit({
        host: { name: v('name'), city: v('city'), country: v('country'), bio: v('bio'), links: v('links') },
        kind: mode,
        exhibition: showcase() ? { title: ('Featured: ' + v('name')).slice(0, 120), category: 'Painting', statement: '', start: '', end: '' } : { title: v('title'), category: v('category'), statement: v('statement'), start: form.start.value, end: form.end.value },
        email: v('email'), phone: v('phone'), promoOk: form.promo.checked, portrait,
        works: works.map(w => ({ title: w.title.trim(), year: w.year.trim(), medium: w.medium.trim(), dimensions: w.dimensions.trim(), description: w.description.trim(), forSale: w.forSale, price: w.forSale ? +w.price : null, currency: w.currency, full: w.full, thumb: w.thumb }))
      }, p => { $('#progressBar').style.width = Math.round(p * 100) + '%'; });
      try { localStorage.setItem('aurum.lastSubmit', Date.now()); localStorage.setItem('aurum.submitCount', (Date.now() - last < 3600e3 ? cnt : 0) + 1); } catch (x) { }
      done(res.ref);
    } catch (x) {
      console.error(x); fail('Sorry, your application could not be sent. Please check your connection and try again.');
    }
    busy = false; $('#hfSubmit').disabled = false; $('#hfBack').disabled = false; $('#progress').hidden = true;
  });
  function done(ref) {
    form.hidden = true; $('#stepper').hidden = true; $('#demoNote').hidden = !Store.demo; $('.sheet-head', root).hidden = true;
    $('#refCode').textContent = ref; $('#doneWhat').textContent = showcase() ? 'paintings' : 'exhibition'; $('#hfDone').hidden = false; root.scrollTop = 0; needReset = true;
  }
  $('#doneClose').onclick = () => closeOv(root);

  /* ───────── open ───────── */
  function setMode(m) {
    mode = m;
    $('#hfEyebrow').textContent = showcase() ? 'Feature your work' : 'Apply to host';
    $('#hfTitle').textContent = showcase() ? 'Feature your paintings' : 'Host an exhibition';
    $('#hfLede').textContent = showcase() ? 'Three short steps. Your paintings appear in the Featured Artists room once our team has reviewed them.' : 'Four short steps. Nothing goes live until our team has reviewed it.';
    $('#maxWorks').textContent = maxWorks();
  }
  function reset() {
    form.reset(); works.forEach(w => URL.revokeObjectURL(w.url)); works = []; portrait = null; renderWorks();
    $('#hfPortrait').innerHTML = '<span class="mono">+</span>'; clearBad();
    form.hidden = false; $('#stepper').hidden = false; $('.sheet-head', root).hidden = false; $('#hfDone').hidden = true;
    $$('.count', form).forEach(c => c.textContent = `0 / ${c.dataset.for === 'bio' ? 1500 : 3000}`);
    setMode(mode); show(1);
  }
  window.AurumHost = {
    open(m) {
      m = m === 'showcase' ? 'showcase' : 'exhibition';
      if (needReset || m !== mode) { mode = m; reset(); needReset = false; }
      openOv(root);
    }
  };
})();
