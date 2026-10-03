#!/usr/bin/env bash
# Render the final vertical video.
# Usage: scripts/render.sh <name>
set -euo pipefail
cd "$(dirname "$0")/.."
name="$1"
mkdir -p output
npx remotion render src/index.ts Explainer "output/$name.mp4" \
  --props="{\"name\":\"$name\"}" --codec=h264 --crf=18 --concurrency=4
echo "-> output/$name.mp4"
