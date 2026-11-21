/* Build the gallery images.
   Runs on GitHub Actions (it needs internet). For every work and artist portrait in the data files it:
   1. finds the picture on Wikimedia Commons (exact file, Wikipedia lead image, or a checked search),
   2. checks that the file is freely licensed (anything non free is skipped),
   3. downloads it once, makes three sizes and saves them in srjan/img/w,
   4. writes srjan/js/images.js (the list the site reads) and tools/image-report.json (what happened to each one).
   Works with no usable image are left out of the manifest, so the site hides them. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import sharp from 'sharp';

const SITE = 'srjan';
const OUT = path.join(SITE, 'img', 'w');
const UA = 'GalleryImageBuilder/1.1 (educational gallery build script; low request rate; automated)';
const SIZES = [480, 960, 1600];
const PORTRAIT = 320;
fs.mkdirSync(OUT, { recursive: true });

/* ---------- load the data files ---------- */
const win = {};
const ctx = vm.createContext({ window: win });
for (const f of ['data.js', 'data-wings.js', 'data-more.js']) vm.runInContext(fs.readFileSync(path.join(SITE, 'js', f), 'utf8'), ctx);
const { PAINTINGS, ARTISTS } = win;
let overrides = {};
try { overrides = JSON.parse(fs.readFileSync('tools/image-overrides.json', 'utf8')); } catch (e) { }
let prev = {};
try { const t = fs.readFileSync(path.join(SITE, 'js', 'images.js'), 'utf8'); prev = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)); } catch (e) { }

/* ---------- helpers ---------- */
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(url, opts = {}, tries = 6) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': '*/*' }, redirect: 'follow', signal: AbortSignal.timeout(75000), ...opts });
      if (r.status === 429 || r.status >= 500) { const ra = Math.min(+r.headers.get('retry-after') || 4 + i * 6, 60); await sleep(ra * 1000); last = new Error('HTTP ' + r.status); continue; }
      return r;
    } catch (e) { last = e; await sleep(1500 + i * 1500); }
  }
  throw last || new Error('fetch failed');
}
const json = async url => { const r = await get(url); if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url); return r.json(); };
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const stripHtml = h => String(h || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const fileUrl = name => 'https://commons.wikimedia.org/wiki/' + encodeURIComponent('File:' + name.replace(/ /g, '_'));

function commonsNameFromUrl(u) {
  if (!u) return null;
  const p = new URL(u).pathname.split('/').filter(Boolean);
  const i = p.indexOf('commons');
  if (i < 0 || p[0] !== 'wikipedia') return null; /* en.wikipedia local upload = non free */
  const name = p[i + 1] === 'thumb' ? p[i + 4] : p[i + 3];
  return name ? decodeURIComponent(name).replace(/_/g, ' ') : null;
}

async function viaWiki(title) {
  const d = await json(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`);
  const src = (d.originalimage && d.originalimage.source) || (d.thumbnail && d.thumbnail.source);
  if (!src) return { fail: 'Wikipedia article has no image' };
  const name = commonsNameFromUrl(src);
  if (!name) return { fail: 'image is a local Wikipedia upload (not on Commons, so not free)' };
  return { name, via: 'wikipedia' };
}
const STOP = new Set(['painting', 'raja', 'ravi', 'varma', 'tagore', 'bose', 'amrita', 'sher', 'gil', 'the', 'and', 'with', 'from', 'looking', 'back', 'file', 'jpg', 'jpeg', 'png', 'that', 'this', 'india', 'indian', 'image', 'photo', 'interior', 'inlay', 'silver', 'dye', 'tie', 'saree', 'sari']);
const words = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 5 && !STOP.has(w));
async function viaSearch(q, need) {
  const d = await json(`${COMMONS}?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=10&gsrsearch=${encodeURIComponent(q + ' filetype:bitmap')}&prop=imageinfo&iiprop=size|mime`);
  const pages = Object.values((d.query && d.query.pages) || {}).sort((a, b) => a.index - b.index);
  for (const pg of pages) {
    const ii = pg.imageinfo && pg.imageinfo[0];
    if (!ii || !/image\/(jpeg|png)/.test(ii.mime) || ii.width < 700) continue;
    const name = pg.title.replace(/^File:/, '');
    const nm = words(name);
    if (need.length && !need.some(w => nm.some(x => x.includes(w) || w.includes(x)))) continue; /* file name must match the work */
    return { name, via: 'search' };
  }
  return { fail: 'no matching file found on Commons' };
}
async function meta(name) {
  const d = await json(`${COMMONS}?action=query&format=json&titles=${encodeURIComponent('File:' + name)}&prop=imageinfo&iiurlwidth=1920&iiprop=url|size|mime|extmetadata&iiextmetadatafilter=Artist|LicenseShortName|LicenseUrl|Copyrighted|UsageTerms|Credit`);
  const pg = Object.values((d.query && d.query.pages) || {})[0];
  const ii = pg && pg.imageinfo && pg.imageinfo[0];
  if (!ii) return null;
  const m = ii.extmetadata || {};
  const v = k => (m[k] && m[k].value) || '';
  return { url: ii.url, thumb: ii.thumburl, w: ii.width, h: ii.height, mime: ii.mime, by: stripHtml(v('Artist')), lic: stripHtml(v('LicenseShortName')), licUrl: v('LicenseUrl'), copyrighted: v('Copyrighted') };
}
function freeLicence(m) {
  const s = (m.lic || '').toLowerCase();
  if (/non[- ]free|fair use|all rights reserved|restricted/.test(s)) return false;
  if (/^(cc0|cc[- ]by|public domain|pd\b|pd-|gfdl|attribution|free art|fal\b|no restrictions|copyrighted free use)/.test(s)) return true;
  if (String(m.copyrighted).toLowerCase() === 'false') return true;
  return false;
}
async function download(name, width, fallbackUrl, thumb) {
  const tries = [thumb, `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name.replace(/ /g, '_'))}?width=${width}`, fallbackUrl].filter(Boolean);
  for (const u of tries) {
    try {
      const r = await get(u);
      if (!r.ok) continue;
      const len = +r.headers.get('content-length') || 0;
      if (len > 60e6) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length > 500) return buf;
    } catch (e) { }
  }
  return null;
}
const save = (buf, file, w, opts = {}) => sharp(buf, { limitInputPixels: 400e6 }).rotate().resize({ width: w, withoutEnlargement: true, ...opts }).jpeg({ quality: opts.q || 82, mozjpeg: true, progressive: true }).toFile(file);

/* ---------- one job ---------- */
async function build(key, spec, portrait) {
  const rep = { key };
  try {
    const ov = overrides[key] || {};
    if (ov.skip) return { ...rep, status: 'skipped', reason: ov.reason || 'removed by override' };
    const steps = [];
    if (ov.f || spec.f) steps.push(async () => ({ name: ov.f || spec.f, via: 'file' }));
    if (spec.w) steps.push(() => viaWiki(spec.w));
    if (spec.q) steps.push(() => viaSearch(spec.q, spec.need || []));
    let found = null, m = null; const fails = [];
    for (const s of steps) {
      let r = null; try { r = await s(); } catch (e) { fails.push(String(e.message || e)); continue; }
      if (r && r.fail) { fails.push(r.fail); continue; }
      if (!r || !r.name) continue;
      const mm = await meta(r.name);
      if (!mm) { fails.push('file not found on Commons: ' + r.name); continue; }
      if (!freeLicence(mm)) { fails.push(`licence not free (${mm.lic || 'none shown'}): ` + r.name); continue; }
      found = r; m = mm; break;
    }
    if (!found) return { ...rep, status: 'failed', reason: fails.join('; ') || 'no source' };
    const base = portrait ? 'a-' + slug(spec.id) : slug(spec.id);
    const old = prev[key];
    const wanted = portrait ? [PORTRAIT] : SIZES;
    const have = old && old.file === found.name && wanted.every(s => fs.existsSync(path.join(OUT, `${base}-${s}.jpg`)));
    if (have) return { ...rep, status: 'ok', via: found.via, file: found.name, entry: old, cached: true };
    const buf = await download(found.name, portrait ? 500 : 1920, m.url, portrait ? null : m.thumb);
    if (!buf) return { ...rep, status: 'failed', reason: 'download failed', file: found.name };
    let info;
    if (portrait) { await save(buf, path.join(OUT, `${base}-${PORTRAIT}.jpg`), PORTRAIT, { height: PORTRAIT, fit: 'cover', position: 'top', q: 80 }); info = { w: PORTRAIT, h: PORTRAIT }; }
    else {
      for (const s of SIZES) await save(buf, path.join(OUT, `${base}-${s}.jpg`), s);
      const im = await sharp(path.join(OUT, `${base}-1600.jpg`)).metadata(); info = { w: im.width, h: im.height };
    }
    const entry = { s: `img/w/${base}`, w: info.w, h: info.h, file: found.name, page: fileUrl(found.name), by: m.by, lic: m.lic, licUrl: m.licUrl };
    return { ...rep, status: 'ok', via: found.via, file: found.name, entry };
  } catch (e) { return { ...rep, status: 'failed', reason: String(e.message || e) }; }
}

/* ---------- run ---------- */
const jobs = [];
PAINTINGS.forEach(p => {
  if (p.after && Date.now() < Date.parse(p.after)) return; /* still in copyright in India */
  const a = ARTISTS[p.a] || {};
  const need = [...words(p.t), ...words(p.q || '')].filter(w => !words(a.n || '').includes(w));
  jobs.push(['p:' + p.t, { f: p.f, w: p.w, q: p.q || (p.t + ' ' + (a.n || '')), need, id: p.t }, false]);
});
const withWorks = new Set(PAINTINGS.filter(p => !(p.after && Date.now() < Date.parse(p.after))).map(p => p.a));
Object.entries(ARTISTS).forEach(([k, a]) => { if (a.pw && withWorks.has(k)) jobs.push(['a:' + a.n, { w: a.pw, id: k }, true]); });

const isDone = j => { const k = j[0], o = prev[k], ov = overrides[k] || {}; if (!o || ov.skip) return false; if (ov.f && ov.f !== o.file) return false; const sizes = j[2] ? [320] : [480, 960, 1600]; return sizes.every(s => fs.existsSync(path.join(OUT, path.basename(o.s) + '-' + s + '.jpg'))); };
jobs.sort((a, b) => (isDone(a) ? 1 : 0) - (isDone(b) ? 1 : 0)); /* unfinished first, finished ones are only re-checked at the end */
const DEADLINE = Date.now() + 32 * 60e3; /* stop starting new work after 32 minutes so the run can always save what it has */
const results = [];
let i = 0;
const wantedKeys = new Set(jobs.map(j => j[0]));
function snapshot() {
  const manifest = {};
  for (const k of Object.keys(prev)) if (wantedKeys.has(k) && !results.some(r => r.key === k && r.status !== 'ok')) manifest[k] = prev[k];
  results.filter(r => r.status === 'ok').forEach(r => { manifest[r.key] = r.entry; });
  const sorted = Object.fromEntries(Object.keys(manifest).sort().map(k => [k, manifest[k]]));
  fs.writeFileSync(path.join(SITE, 'js', 'images.js'), '/* Written by tools/build-images.mjs. Do not edit by hand. */\nwindow.IMGS = ' + JSON.stringify(sorted, null, 1) + ';\n');
  const total = { ok: 0, failed: 0, skipped: 0, pending: 0 }; results.forEach(r => total[r.status]++);
  total.pending += jobs.filter(j => !results.some(r => r.key === j[0])).length;
  const rs = [...results].sort((a, b) => a.key.localeCompare(b.key));
  fs.writeFileSync('tools/image-report.json', JSON.stringify({ total, results: rs.map(({ entry, ...r }) => ({ ...r, by: entry && entry.by, lic: entry && entry.lic })) }, null, 1));
  return { manifest: sorted, total };
}
const WATCHDOG = setTimeout(() => { console.log('Time is up, saving what is finished'); snapshot(); process.exit(0); }, 38 * 60e3);
async function worker() { while (i < jobs.length && Date.now() < DEADLINE) { const j = jobs[i++]; const r = await build(...j); results.push(r); if (results.length % 4 === 0) snapshot(); console.log(r.status.padEnd(7), r.key, r.status === 'ok' ? `${r.via}: ${r.file}${r.cached ? ' (cached)' : ''}` : r.reason); await sleep(500); } }
await Promise.all([worker(), worker(), worker()]);
for (; i < jobs.length; i++) { const k = jobs[i][0]; const o = prev[k]; if (o) results.push({ key: k, status: 'ok', via: 'previous', file: o.file, entry: o, cached: true }); else results.push({ key: k, status: 'pending', reason: 'not reached in this run, will continue in the next run' }); }

clearTimeout(WATCHDOG);
const { manifest, total } = snapshot();
const used = new Set(); Object.values(manifest).forEach(e => { [480, 960, 1600, 320].forEach(s => used.add(path.basename(e.s) + '-' + s + '.jpg')); });
for (const f of fs.readdirSync(OUT)) if (!used.has(f) && !jobs.some(j => f.startsWith((j[2] ? 'a-' : '') + slug(j[1].id) + '-'))) fs.unlinkSync(path.join(OUT, f));
console.log('DONE', total);
const wantedWorks = jobs.filter(j => !j[2]).length, okWorks = results.filter(r => r.key.startsWith('p:') && r.status === 'ok').length;
console.log(`Works with images: ${okWorks} of ${wantedWorks}`);
