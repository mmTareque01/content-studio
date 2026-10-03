"""Transcribe a video to word-level timestamps (runs locally on Apple Silicon).

Usage: python scripts/transcribe.py <video> <out.json> [model]
  model: small (default, fast) | medium (better for Bangla/accents) | large (best, slow)
"""
import json
import sys

import mlx_whisper

MODELS = {
    "small": "mlx-community/whisper-small-mlx",
    "medium": "mlx-community/whisper-medium-mlx",
    "large": "mlx-community/whisper-large-v3-turbo",
}

src, dst = sys.argv[1], sys.argv[2]
model = MODELS[sys.argv[3] if len(sys.argv) > 3 else "small"]

result = mlx_whisper.transcribe(src, path_or_hf_repo=model, word_timestamps=True)

words = [
    {"w": w["word"].strip(), "s": round(w["start"], 3), "e": round(w["end"], 3)}
    for seg in result["segments"]
    for w in seg.get("words", [])
    if w["word"].strip()
]

with open(dst, "w") as f:
    json.dump({"language": result.get("language"), "text": result["text"].strip(), "words": words}, f, ensure_ascii=False, indent=1)

print(f"{len(words)} words ({result.get('language')}) -> {dst}")
