# Content Studio

Local AI video editor for vertical shorts (1080x1920, 30 fps). Remotion renders `src/` driven by per-video JSON in `public/videos/<name>/`.

- To edit a video, follow the `edit-video` skill (`.claude/skills/edit-video/SKILL.md`).
- Cue types live in `src/types.ts`. Their visuals are in `src/graphics/Cues.tsx`, sounds in `src/graphics/Sfx.tsx`, camera moves in `src/graphics/Camera.tsx`. When adding a cue type, update all three plus the README table.
- Keep it free and local: no paid APIs, no cloud services.
- Never commit media: `inbox/`, `output/`, `work/` and `public/videos/` are gitignored and hold the user's personal footage.
- Verify visual changes with `npx remotion still ...` frames before a full render (a full render takes a few minutes).
