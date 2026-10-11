#!/usr/bin/env bash
# Prepare a raw recording for editing.
#   1. cut silences (auto-editor)   2. reframe to 1080x1920 @30fps
#   3. transcribe with word timings  4. cut yourself out of the background
#
# An audio file (mp3/m4a/wav/...) is a voice-over: steps 2 and 4 are skipped and
# cues.json starts in voice mode, so the visuals come from stock scenes and cards.
#
# Usage: scripts/prepare.sh <raw-video> <name> [small|medium|large] [--keep-silence]
set -euo pipefail
cd "$(dirname "$0")/.."

src="$1"; name="$2"; model="${3:-small}"; keep="${4:-}"
out="public/videos/$name"; work="work/$name"
mkdir -p "$out" "$work"
py=.venv/bin/python
voice=false
[[ "$src" =~ \.(mp3|m4a|wav|aac|ogg|opus|flac)$ ]] && voice=true

if $voice; then
  if [[ "$keep" == "--keep-silence" ]]; then
    cp "$src" "$work/cut.${src##*.}"; cut="$work/cut.${src##*.}"
  else
    echo "==> Cutting silences"
    auto-editor "$src" --margin 0.2s -o "$work/cut.wav"; cut="$work/cut.wav"
  fi

  echo "==> Leveling voice"
  ffmpeg -v error -y -i "$cut" -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k "$out/voice.m4a"

  echo "==> Transcribing ($model)"
  $py scripts/transcribe.py "$out/voice.m4a" "$out/words.json" "$model"

  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out/voice.m4a")
  echo "{\"duration\": $dur, \"fps\": 30}" > "$out/meta.json"
  [[ -f "$out/cues.json" ]] || echo '{"accent": "#7C5CFF", "background": null, "music": null, "voice": true, "cues": []}' > "$out/cues.json"

  echo
  echo "Ready (voice-over): $out  (${dur}s)"
  echo "Next: fetch stock with scripts/stock.py, fill $out/cues.json, then: scripts/render.sh $name"
  exit 0
fi

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
