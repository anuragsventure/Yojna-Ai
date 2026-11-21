# Srjan: going live on your own domain

This page is written for the owner of the site. Follow the steps in order.

## 1. Where everything is saved

Everything lives in one GitHub repository: `anuragsventure/Yojna-Ai`.

| What | Where |
| --- | --- |
| The Srjan website (pages, styles, scripts, data) | folder `srjan/` |
| Collection data (works, creators, rooms, exhibitions) | `srjan/js/data.js`, `data-wings.js`, `data-more.js` |
| Saved pictures (three sizes of every work) | `srjan/img/w/` |
| List of the saved pictures and their credits | `srjan/js/images.js` (written by the image build) |
| Privacy and Disclaimers page | `srjan/legal.html` |
| Admin page | `srjan/admin.html` |
| Database set up for creator applications | `srjan/supabase/schema.sql` |
| Settings (database keys, admin email, visitor counter) | `srjan/js/config.js` |
| Image build (runs on GitHub) | `tools/build-images.mjs`, `.github/workflows/images.yml` |
| Report of the last image build | `tools/image-report.json` |
| Publishing to the web | `.github/workflows/pages.yml` |
| Guide for adding works | `tools/ADDING-WORKS.md` |
| The earlier AURUM gallery (kept as it was) | folder `aurum/` and the branch `backup-aurum-v1` |

The site is live now at `https://anuragsventure.github.io/Yojna-Ai/srjan/`.

## 2. Switch the site to publish from GitHub Actions (one time)

1. Open the repository on GitHub, then **Settings**, then **Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Open the **Actions** tab, choose **Deploy site to GitHub Pages**, and press **Run workflow**.

After this the site is published at the root of the Pages address, for example
`https://anuragsventure.github.io/Yojna-Ai/`. The old address ending in `/srjan/` forwards there.

## 3. Add your domain in GitHub

1. In **Settings**, **Pages**, find **Custom domain**.
2. Type your domain exactly as you will use it. Use the plain domain, for example `yourname.in`, as the main address.
3. Press **Save**. GitHub starts a DNS check. It will report an error until step 4 is finished, and that is normal.

## 4. Point the domain to GitHub (at the company where you bought it)

Open the DNS settings of your domain and make these records. Delete any older `A`, `AAAA` or `CNAME` records for the same names first.

| Type | Name or host | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |
| CNAME | `www` | `anuragsventure.github.io` |

Changes usually reach the world within an hour, and can take up to 24 hours. Keep any mail records (`MX`, `TXT`) that you already have.

## 5. Turn on HTTPS

When GitHub shows a green tick next to the domain, tick **Enforce HTTPS** in **Settings**, **Pages**. The certificate can take up to an hour after the DNS check passes.

## 6. Make the site public (ask Claude: "go public")

The site is marked private for search engines while it is a preview. When you are ready, ask Claude to go public. That change will:

- remove `noindex` from the pages, so that Google can list the site;
- set the visitor counter to start at 0 (`visitorSeed` in `srjan/js/config.js`);
- add a sitemap and a robots file;
- keep the admin page hidden from search engines.

## 7. Before you invite the public

1. **Database and admin sign in.** Follow the section "Go live" in `srjan/README.md`. It creates the free database, adds the keys to `srjan/js/config.js`, and sets your admin email. Until this is done, the application forms and the admin page work only in demo mode, on one device.
2. **Sign in address.** In the database settings, set the site address to your new domain so that the sign in link in the email opens the right page.
3. **Contact details.** On `srjan/legal.html`, add the name of the Grievance Officer and a real email address in clause 6.5, and replace the Instagram contact with that email if you wish.
4. **A lawyer.** Ask an Indian lawyer to read `srjan/legal.html` once. It was written with care, but only a lawyer can confirm it for your business.
5. **Pictures.** Open `tools/image-report.json` and check that no work you care about was dropped.

## 8. Everyday work

- **New works** are added by the weekly task or by asking Claude. They are checked for Indian copyright and for a freely licensed picture, as described in `tools/ADDING-WORKS.md`.
- **Creator applications** arrive in the admin page. Approve or decline there.
- **Changes to words or design:** ask Claude. Claude changes the files and publishes them.

## 9. If something goes wrong

| Problem | What to do |
| --- | --- |
| The domain shows a GitHub 404 page | Check that Source is GitHub Actions and that the **Deploy site** run in the Actions tab is green. |
| GitHub says the DNS check failed | Check the records in step 4 for typing mistakes, then wait an hour and press **Check again**. |
| The old version appears | Press Ctrl+F5, or open the site in a private window. |
| A work is missing | Look for it in `tools/image-report.json`. A work without a freely licensed picture is hidden on purpose. |
