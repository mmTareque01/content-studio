---
name: edit-video
description: Edit a raw clip into a finished vertical short. Prepares the footage, reads the transcript, designs voice-synced graphics in cues.json, checks frames, and renders. Use when the user asks to edit, make, cut or render a video, or drops a clip in inbox/.
---

# Edit a video

The user gives a clip (usually in `inbox/`) and, optionally, a vibe ("funny", "educational", "food vlog"). You do the whole edit.

## 1. Prepare
Pick a short kebab-case `<name>` from the file or topic.

- **Talking head** (someone speaking to camera): `scripts/prepare.sh inbox/<file> <name>`. Use `medium` as the 3rd arg for Bangla, Hindi or strong accents. This produces `public/videos/<name>/{talk.mp4, person.webm, words.json, meta.json, cues.json}`.
- **B-roll / vlog footage** (no one talking to camera): reframe only, then set `"footage": true` in cues.json:
  ```
  mkdir -p public/videos/<name>
  ffmpeg -y -i inbox/<file> -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30" -c:v libx264 -crf 18 -c:a aac public/videos/<name>/talk.mp4
  ```
  Then write `meta.json` (`{"duration": <ffprobe seconds>, "fps": 30}`) and `words.json` (`{"language": null, "text": "", "words": []}`). To see what's in the shot, extract a contact sheet: `ffmpeg -i talk.mp4 -vf "fps=1/2,scale=270:-1,tile=8x1" sheet.jpg` and look at it.
- **Voice-over** (an audio file, the user narrates and you build all the visuals): `scripts/prepare.sh inbox/<file>.m4a <name>` (same `medium` rule). It writes `voice.m4a`, `words.json`, `meta.json` and a cues.json with `"voice": true`. See **Voice-over visuals** below.

## 2. Read the content
Read `words.json`. Find: the hook (first claim/question), the structure (list? story? comparison?), every number, the payoff, and the ending. Note the exact `s` time of each key word, because cues snap to words.

## 3. Design cues.json
All cue types and options are documented in README.md. Editing rules that make videos perform:

1. **0–2 s is the hook.** Always open with `hook` (big slammed text, 3–6 words, `highlight` the 1–2 punch words). Never open on a quiet card.
2. **Something changes every 1.5–3 s.** No gaps longer than ~3 s without a new cue, `sticker`, `pointer`, `zoom` or `burst`. Overlap is good: a `sticker` or `burst` on top of a card adds energy.
3. **Snap to the voice.** `from` = the `s` of the word that triggers it (minus ~0.1 s). List items use `at` = the `s` of each item's first word.
4. **Match the type to the content.**
   - Numbers / prices go in `stat`, and percentages get the ring automatically.
   - A list or steps go in `bullets` / `steps` with `at`.
   - "X vs Y" goes in `compare`.
   - Scores or verdicts go in `rating`, and several numbers go in `bars`.
   - A place goes in `location`.
   - "Look at this" goes in `pointer` plus `zoom` on the same x,y (check the frame first).
   - Emotional beats (shock, love, fire) go in `icon` or `burst`.
5. **Few words on screen.** Card text ≤ 6 words per line. Captions already carry the full speech, so cards are headlines, not transcripts.
6. **End with `cta`** over the last 2–3 s (ask a question or follow). If you don't know the user's handle, ask them, or omit `handle`.
7. **`emphasis`** lists 3–8 caption words worth stressing (claims, negations, results). Numbers are automatic.
8. **Color:** pick `accent` to fit the topic (food = warm orange/red, tech = violet/cyan, beauty = pink, money = green) and `accent2` as a bright contrasting highlight.
9. Card cues sit in the top area. In talking-head mode the person fills the bottom ~60%, so overlays (`sticker`, `pointer`) must avoid covering the face.

Examples: `examples/talking-head.cues.json`, `examples/food-vlog.cues.json`.

## Voice-over visuals
There is no person on screen, so the picture must carry the video:

1. Split the transcript into **scenes of 2–5 s**, one per idea or sentence. Cover the whole timeline with back-to-back `scene` cues (`to` of one = `from` of the next; they crossfade).
2. For each scene pick a concrete, filmable search ("robot arm factory", "doctor tablet hospital", "city traffic night"), not abstract words ("future", "change"). Fetch with `.venv/bin/python scripts/stock.py <name> "<search>" -n 2` (add `--photos` for stills). It needs `PEXELS_API_KEY`; if unset, ask the user for a free key, or use their files in `public/assets/`, or skip scenes and stay on the animated studio. Look at a frame of each download (`ffmpeg -ss 1 -i <clip> -frames:v 1 -vf scale=270:-1 x.jpg`) and drop poor matches.
3. Clips must be at least as long as their scene (the script prints durations); otherwise use `start` or a photo. Vary `move` or let it auto-cycle.
4. Layer the usual cues on top, with `pos: "center"` for cards since there is no face to avoid: `hook` at 0 s, `stat` for numbers, `bullets`/`steps` for lists, `compare`, `sticker`, `burst`, `cta`. Keep a card on screen for about half the time, so the stock footage gets room to breathe. Raise a scene's `dim` (0.5) under busy cards.
5. Suggest quiet `music` (0.06–0.1) if the user has a track in `public/assets/music/`.

## 4. Check, then render
Run `npm run typecheck`. Render 4–6 stills at key moments (mid-hook, each card fully in, the CTA) and look at them:
```
npx remotion still src/index.ts Explainer work/<name>/f<N>.png --props='{"name":"<name>"}' --frame=<N> --scale=0.33
```
Fix overlaps, unreadable text and pointers that miss their target. Then `scripts/render.sh <name>` produces `output/<name>.mp4`. Tell the user where it is and offer `npm run studio` for live tweaking.
