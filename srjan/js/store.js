/* Srjan data layer: Supabase when configured, otherwise a local demo store (IndexedDB). */
(function () {
  'use strict';
  const C = window.AURUM_CONFIG || {};
  const live = !!(C.supabaseUrl && C.supabaseKey && window.supabase);
  const sb = live ? window.supabase.createClient(C.supabaseUrl, C.supabaseKey) : null;
  const BUCKET = 'artworks';
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2));
  const refOf = id => id.replace(/-/g, '').slice(0, 8).toUpperCase();

  /* ───────── demo store (IndexedDB) ───────── */
  let _db;
  function idb() {
    if (_db) return _db;
    _db = new Promise((res, rej) => {
      const r = indexedDB.open('srjan-demo', 1);
      r.onupgradeneeded = () => { r.result.createObjectStore('subs', { keyPath: 'id' }); r.result.createObjectStore('enq', { keyPath: 'id' }); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    return _db;
  }
  const tx = async (store, mode, fn) => {
    const d = await idb();
    return new Promise((res, rej) => {
      const t = d.transaction(store, mode), s = t.objectStore(store), out = fn(s);
      t.oncomplete = () => res(out && out.result !== undefined ? out.result : undefined); t.onerror = () => rej(t.error);
    });
  };
  const allOf = store => tx(store, 'readonly', s => s.getAll());
  const putOf = (store, v) => tx(store, 'readwrite', s => s.put(v));
  const delOf = (store, k) => tx(store, 'readwrite', s => s.delete(k));
  const blobUrl = b => b ? URL.createObjectURL(b) : null;

  function fromDemo(r) {
    return {
      id: r.id, ref: refOf(r.id), kind: r.kind || 'exhibition', wing: r.wing || 'Art', credits: r.credits || '', status: r.status, featured: !!r.featured, title: r.title, statement: r.statement, category: r.category,
      start: r.start, end: r.end, createdAt: r.createdAt, adminNote: r.adminNote || '', rightsAt: r.rightsAt, promoOk: !!r.promoOk,
      host: { name: r.host.name, city: r.host.city, country: r.host.country, bio: r.host.bio, links: r.host.links, portrait: blobUrl(r.portrait) },
      works: r.works.map((w, i) => ({ id: r.id + ':' + i, title: w.title, year: w.year, medium: w.medium, dimensions: w.dimensions, description: w.description, credit: w.credit, introOk: !!w.introOk, img: blobUrl(w.full), thumb: blobUrl(w.thumb) })),
      priv: { email: r.email, phone: r.phone }
    };
  }

  /* ───────── live mapping ───────── */
  const pub = p => p ? sb.storage.from(BUCKET).getPublicUrl(p).data.publicUrl : null;
  function fromRow(r) {
    return {
      id: r.id, ref: refOf(r.id), kind: r.kind || 'exhibition', wing: r.wing || 'Art', credits: r.credits || '', status: r.status, featured: !!r.featured, title: r.title, statement: r.statement, category: r.category,
      start: r.start_date, end: r.end_date, createdAt: r.created_at, adminNote: r.admin_note || '', rightsAt: r.rights_accepted_at, promoOk: !!r.promo_ok,
      host: { name: r.host_name, city: r.host_city, country: r.host_country, bio: r.host_bio, links: r.host_links, portrait: pub(r.portrait_path) },
      works: (r.artworks || []).slice().sort((a, b) => a.sort - b.sort).map(w => ({ id: w.id, title: w.title, year: w.year, medium: w.medium, dimensions: w.dimensions, description: w.description, credit: w.credit, introOk: !!w.intro_ok, img: pub(w.image_path), thumb: pub(w.thumb_path) })),
      priv: r.exhibition_private ? (Array.isArray(r.exhibition_private) ? r.exhibition_private[0] : r.exhibition_private) : null
    };
  }

  const Store = {
    live, demo: !live, maxWorks: C.maxWorks || 12, contactEmail: C.contactEmail || '', adminEmail: C.adminEmail || '',

    async listApproved() {
      if (!live) { const all = await allOf('subs'); return all.filter(r => r.status === 'approved').sort((a, b) => b.createdAt - a.createdAt).map(fromDemo); }
      const { data, error } = await sb.from('exhibitions').select('*, artworks(*)').eq('status', 'approved').order('approved_at', { ascending: false });
      if (error) throw error;
      return data.map(fromRow);
    },

    /* payload: { host, exhibition, works:[{meta..., full:Blob, thumb:Blob}], portrait:Blob|null, email, phone, promoOk } */
    async submit(pl, onProgress) {
      const id = uid(), step = (n, t) => onProgress && onProgress(n / t);
      if (!live) {
        await putOf('subs', {
          id, kind: pl.kind || 'exhibition', wing: pl.wing || 'Art', credits: pl.credits || '', status: 'pending', featured: false, createdAt: Date.now(), rightsAt: Date.now(), promoOk: pl.promoOk,
          title: pl.exhibition.title, statement: pl.exhibition.statement, category: pl.exhibition.category, start: pl.exhibition.start, end: pl.exhibition.end,
          host: pl.host, portrait: pl.portrait || null, email: pl.email, phone: pl.phone,
          works: pl.works.map(w => ({ credit: w.credit, title: w.title, year: w.year, medium: w.medium, dimensions: w.dimensions, description: w.description, introOk: w.introOk, full: w.full, thumb: w.thumb }))
        });
        step(1, 1); return { ref: refOf(id) };
      }
      const total = pl.works.length * 2 + (pl.portrait ? 1 : 0) + 1; let done = 0;
      const up = async (path, blob) => {
        const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false });
        if (error) throw error; step(++done, total);
      };
      let portraitPath = null;
      if (pl.portrait) { portraitPath = id + '/host.jpg'; await up(portraitPath, pl.portrait); }
      const works = [];
      for (let i = 0; i < pl.works.length; i++) {
        const w = pl.works[i], fp = `${id}/w${i}.jpg`, tp = `${id}/w${i}_t.jpg`;
        await up(fp, w.full); await up(tp, w.thumb);
        works.push({ sort: i, credit: w.credit || null, title: w.title, year: w.year, medium: w.medium, dimensions: w.dimensions, description: w.description, intro_ok: !!w.introOk, image_path: fp, thumb_path: tp });
      }
      const { error } = await sb.rpc('submit_exhibition', { p: {
        id, kind: pl.kind || 'exhibition', wing: pl.wing || 'Art', credits: pl.credits || '', title: pl.exhibition.title, statement: pl.exhibition.statement, category: pl.exhibition.category, start_date: pl.exhibition.start || null, end_date: pl.exhibition.end || null,
        host_name: pl.host.name, host_city: pl.host.city, host_country: pl.host.country, host_bio: pl.host.bio, host_links: pl.host.links, portrait_path: portraitPath,
        email: pl.email, phone: pl.phone, promo_ok: !!pl.promoOk, rights_accepted: true, rights_version: 'v5', works
      } });
      if (error) throw error; step(total, total);
      return { ref: refOf(id) };
    },

    async enquire(e) {
      if (!live) { await putOf('enq', { id: uid(), createdAt: Date.now(), ...e }); return; }
      const { error } = await sb.rpc('submit_enquiry', { p: e });
      if (error) throw error;
    },

    /* ───────── admin ───────── */
    admin: {
      async session() {
        if (!live) return { email: 'demo@local' };
        const { data } = await sb.auth.getSession();
        return data.session ? { email: data.session.user.email } : null;
      },
      async signIn(email) {
        if (!live) return;
        const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
        if (error) throw error;
      },
      async signOut() { if (live) await sb.auth.signOut(); },
      async list(status) {
        if (!live) { const all = await allOf('subs'); return all.filter(r => r.status === status).sort((a, b) => b.createdAt - a.createdAt).map(fromDemo); }
        const { data, error } = await sb.from('exhibitions').select('*, artworks(*), exhibition_private(*)').eq('status', status).order('created_at', { ascending: false });
        if (error) throw error; return data.map(fromRow);
      },
      async counts() {
        const out = {};
        for (const s of ['pending', 'approved', 'rejected']) out[s] = (await this.list(s)).length;
        return out;
      },
      async update(id, patch) {
        if (!live) {
          const all = await allOf('subs'), r = all.find(x => x.id === id); if (!r) return;
          if (patch.status) r.status = patch.status; if ('featured' in patch) r.featured = patch.featured; if ('adminNote' in patch) r.adminNote = patch.adminNote;
          return putOf('subs', r);
        }
        const row = {};
        if (patch.status) { row.status = patch.status; if (patch.status === 'approved') row.approved_at = new Date().toISOString(); }
        if ('featured' in patch) row.featured = patch.featured;
        if ('adminNote' in patch) row.admin_note = patch.adminNote;
        const { error } = await sb.from('exhibitions').update(row).eq('id', id); if (error) throw error;
      },
      async remove(id) {
        if (!live) return delOf('subs', id);
        const { data: files } = await sb.storage.from(BUCKET).list(id);
        if (files && files.length) await sb.storage.from(BUCKET).remove(files.map(f => id + '/' + f.name));
        const { error } = await sb.from('exhibitions').delete().eq('id', id); if (error) throw error;
      },
      async enquiries() {
        if (!live) return (await allOf('enq')).sort((a, b) => b.createdAt - a.createdAt);
        const { data, error } = await sb.from('enquiries').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(r => ({ id: r.id, createdAt: Date.parse(r.created_at), name: r.name, email: r.email, message: r.message, workTitle: r.work_title, exhibitionTitle: r.exhibition_title }));
      }
    }
  };
  window.AurumStore = Store;
})();
