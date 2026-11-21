# AURUM Digital Art Gallery

A static website: 84 famous paintings, 58 artists, 8 rooms, curated exhibitions, artist-hosted exhibitions
with admin approval, featured artists, a zoomable viewer and a guided tour. No build step.

## For artists
The home page shows only Rooms and Exhibitions. A single "For Artists" menu entry opens a choice between hosting an exhibition (up to 12 works, own page) and featuring paintings (up to 6 works, shown in the Featured Artists room, which appears once the first feature request is approved).

## Pages
- `index.html` the public gallery
- `admin.html` the admin review page (approve, decline, feature, delete, read enquiries)
- `js/data.js` paintings, artists and AURUM-curated exhibitions (edit freely)
- `js/config.js` database settings
- `supabase/schema.sql` the database

## Demo mode (default)
Until `js/config.js` has database keys, the site runs in demo mode. Applications and enquiries are saved in the
visitor's own browser only, so nothing reaches you. This lets you try the whole flow on one device:
apply on `index.html`, open `admin.html` in the same browser, approve, and the exhibition appears on the site.

## Go live (about 15 minutes, free tier is enough)
1. Create a free account at supabase.com and make a new project.
2. Open SQL Editor, paste the contents of `supabase/schema.sql`. First replace every `ADMIN_EMAIL_HERE` with the email you will use as admin. Run it.
3. In Project Settings, API, copy the Project URL and the anon public key into `js/config.js` (`supabaseUrl`, `supabaseKey`). Also fill `adminEmail` and `contactEmail`.
4. In Authentication, URL Configuration, set the Site URL to your website address (for example `https://anuragsventure.github.io/Yojna-Ai/aurum/`) and add `.../aurum/admin.html` to the redirect list.
5. Commit and publish. Open `admin.html`, sign in with the admin email, and review applications there.

The anon key is designed to be public. Security comes from the row-level rules in `schema.sql`: visitors can only
submit new pending applications and read approved ones. Only your admin email can read private contact details,
approve, decline or delete.

## How rights are protected
- Applicants must tick four rights statements, and the time of acceptance is stored with the application.
- Artist works are shown at web size with right-click saving blocked. Originals are never stored, only a 2000 px version.
- Every work carries a copyright line. Terms are in the "Artist rights and terms" page (edit in `index.html`, id `legal`).
- Have a lawyer review the terms and privacy text before launch.

## Ways to earn from it (pick later)
- Listing plans: free tier (one exhibition, up to 12 works), paid tier (more works, longer runs, priority review).
- Featured artist slots, sold monthly.
- Commission on sales that start from an enquiry.
- Sponsored exhibitions by galleries, brands and institutions.
- Virtual opening nights with ticketing.
- Prints and merchandise for approved artists.
Payments can be added with Razorpay (India) or Stripe once you choose a model.
