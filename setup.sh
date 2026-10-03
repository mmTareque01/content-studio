#!/usr/bin/env bash
# One-time setup on an Apple Silicon Mac. Safe to re-run.
set -euo pipefail
cd "$(dirname "$0")"

need() { command -v "$1" >/dev/null || { echo "Installing $1 (Homebrew)"; brew install "$2"; }; }
command -v brew >/dev/null || { echo "Install Homebrew first: https://brew.sh"; exit 1; }
need ffmpeg ffmpeg
need node node
need auto-editor auto-editor
need python3.12 python@3.12

echo "==> Python env"
[[ -d .venv ]] || python3.12 -m venv .venv
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -q -r requirements.txt

echo "==> Background-removal model"
mkdir -p models
[[ -f models/rvm_mobilenetv3.torchscript ]] || curl -L --fail -o models/rvm_mobilenetv3.torchscript \
  https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_mobilenetv3_fp32.torchscript

echo "==> Node packages"
npm install --silent

echo "==> Sound effects"
scripts/make-sfx.sh >/dev/null

mkdir -p inbox output public/assets/{backgrounds,images,logos,music}
echo
echo "Done. Drop a clip in inbox/ and ask Claude Code: \"edit inbox/my-clip.mp4\""
