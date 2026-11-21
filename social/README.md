# AURUM social

Tools for the AURUM Instagram account. Nothing here connects to Instagram yet.

- `calendar/3-day.json` the three-day pilot: slides, captions, hashtags, alt text
- `3-day-plan.md` the same content in readable form for review
- `render.py` draws each painting on a gallery wall in a wooden or gilt frame (1080 x 1350)
- `samples/` layout samples made with placeholder pictures

Preview layout without internet:
    python3 social/render.py --calendar social/calendar/3-day.json --out social/out --sample

Render with the real paintings (needs internet, pip install pillow numpy):
    python3 social/render.py --calendar social/calendar/3-day.json --out social/out

Rules built into the calendar: public-domain works only, living artists only with written consent, every post credits the image source.
For the final look, put Cormorant Garamond and Jost font files in `social/fonts/`. Without them the renderer falls back to a plain serif.
