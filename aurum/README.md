# AURUM — Digital Art Gallery

A static, dependency-free art gallery: 84 famous paintings, 58 artists, 8 themed rooms,
a zoomable viewer, artist pages, guided tour, search, filters and a personal "My Collection".

## Host it (no build step)
Upload the **`aurum/`** folder to any static host:
- **Netlify / Vercel / Cloudflare Pages**: drag-and-drop the folder (publish directory = `aurum`).
- **GitHub Pages**: Settings → Pages → deploy from branch, and open `/aurum/`
  (or copy the folder contents to the repo root of a dedicated repo).
- **Local preview**: `cd aurum && python3 -m http.server 8000`

## How images work
No image files are stored. Each painting is looked up live from Wikipedia / Wikimedia Commons
(public-domain scans) the first time it is viewed and cached in the visitor's browser.
If an image cannot be found, an elegant placeholder is shown instead.

## Add or edit paintings
Edit `js/data.js`. A painting needs: `t` (title), `a` (artist key), `y` (date), `med`, `loc`,
`mv` (room), `s` (story) and a way to find the image: `w` (Wikipedia article title),
or `f` (exact Commons file name), or `q` (Commons search text).
