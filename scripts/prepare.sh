#!/usr/bin/env bash
# Prepare a raw recording for editing.
#   1. cut silences (auto-editor)   2. reframe to 1080x1920 @30fps
#   3. transcribe with word timings  4. cut yourself out of the background
#
# Usage: scripts/prepare.sh <raw-video> <name> [small|medium|large] [--keep-silence]
set -euo pipefail
cd "$(dirname "$0")/.."

src="$1"; name="$2"; model="${3:-small}"; keep="${4:-}"
out="public/videos/$name"; work="work/$name"
mkdir -p "$out" "$work"
py=.venv/bin/python

if [[ "$keep" == "--keep-silence" ]]; then
  cp "$src" "$work/cut.mp4"
else
  echo "==> Cutting silences"
  auto-editor "$src" --margin 0.15s -o "$work/cut.mp4"
fi

echo "==> Reframing to 1080x1920"
ffmpeg -v error -y -i "$work/cut.mp4" \
  -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30" \
  -c:v libx264 -crf 18 -preset fast -c:a aac -b:a 192k "$out/talk.mp4"

echo "==> Transcribing ($model)"
$py scripts/transcribe.py "$out/talk.mp4" "$out/words.json" "$model"

echo "==> Removing background"
$py scripts/cutout.py "$out/talk.mp4" "$out/person.webm"

dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out/talk.mp4")
echo "{\"duration\": $dur, \"fps\": 30}" > "$out/meta.json"

if [[ ! -f "$out/cues.json" ]]; then
  cat > "$out/cues.json" <<'JSON'
{
  "accent": "#7C5CFF",
  "background": null,
  "music": null,
  "cues": []
}
JSON
fi

echo
echo "Ready: $out  (${dur}s)"
echo "Next: fill $out/cues.json with graphics, then: scripts/render.sh $name"
