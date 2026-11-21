# Adding works to Srjan

This guide is for whoever adds works: the weekly scheduled task, or Claude on request. Follow every rule.

## What to add

Each week, add about 10 to 15 works that are not yet in the collection, in these proportions:

- about half for **Bharat**: Indian painting, manuscripts, murals, temples, forts, tombs, stepwells, textiles and crafts;
- the rest for world art, spaces and design that people will admire.

Build meaningful exhibitions out of the new works (four or more works in a clear theme, no work repeated across exhibitions). Never add works only to raise a count.

## Rules that cannot be broken

1. **Indian copyright.** Show a work only if its creator died at least 61 calendar years before the current year (in 2026, that means a death in 1965 or earlier), or the work is anonymous, traditional or historic. The rule comes from the Copyright Act, 1957, Section 22: life plus sixty years, counted from the beginning of the year after death. For a creator who died later, add `after: "YYYY-01-01"` to the work (the first day after the term ends). Examples already in the data: Picasso, Dali, Magritte, Hopper, Nandalal Bose.
2. **Image.** The picture must be on Wikimedia Commons under a free licence. The image build checks this and drops any work with no free picture. Never add a work whose only image is on Wikipedia as non free.
3. **Right creator.** Name the exact creator of each work. If an attribution is traditional or disputed, say so in the story. Check the facts against the Wikipedia article for the work, or against the museum.
4. **Stories.** Two to four sentences of plain, elegant English. Only facts you have checked. No hyphens, dashes, asterisks, emojis or arrows anywhere in visible text (write "1632 to 1653", not "1632-1653"; "tie dye", not "tie-dye").
5. **No repeats.** Do not add a work whose title is already in the data files.

## Where to add

Add new blocks at the end of `srjan/js/data-more.js`, in this order:

1. `window.ROOMS.push(...)` for a new room (only if needed). Fields: `id`, `wing` ("Art", "Spaces" or "Design"), `name`, `years`, `blurb`, and `fit: "cover"` for Spaces and Design rooms.
2. `Object.assign(window.ARTISTS, {...})` for new creators. Fields: `n` (name), `life`, `from`, `bio`, and `pw` (the Wikipedia article for a portrait, if one exists on Commons).
3. `window.PAINTINGS.push(...)` for the works. Fields: `t` (title), `a` (creator key), `y` (date), `med`, `loc`, `mv` (room id), `s` (story), and the picture source: `w` (title of the Wikipedia article) and/or `f` (exact Commons file name) and/or `q` (Commons search words, used only as a last resort).
4. `window.LINKS.push([titleA, titleB, "why they connect"])` for connected works.
5. `window.EXHIBITIONS.push({ id, title, by: "Srjan Curators", tagline, text, works: [...] })`.

Use the Wikipedia API to check article titles and the lead picture before adding a work:
`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=original&redirects=1&titles=Title1|Title2`
A lead picture whose address contains `/wikipedia/commons/` is free. One containing `/wikipedia/en/` is not.

## Check, then publish

1. Run the data checks and the browser checks (`node` scripts used in earlier sessions): no duplicate titles, every creator and room exists, every exhibition has at least four works, no hyphens or dashes in visible text, no errors in the browser.
2. Commit to a branch, open a pull request into `main`, and merge it. The workflow **Build gallery images** then runs by itself, saves the pictures, writes `srjan/js/images.js` and `tools/image-report.json`, and the site is published.
3. Read `tools/image-report.json` after the build. For any work that failed, fix the picture source (a better `w`, an exact `f`, or an entry in `tools/image-overrides.json`), or remove the work. For a picture that shows the wrong thing, add `{"skip": true, "reason": "..."}` for that work in `tools/image-overrides.json`, or give the right file with `{"f": "File name.jpg"}`.

## Honest limits

The pictures and rights are checked by the build. The stories are written from reliable general knowledge and checked against Wikipedia, but they have not been reviewed by an art historian. That review is a good idea before a large public launch.
