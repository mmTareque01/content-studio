"""Download free portrait stock clips/photos from Pexels for `scene` cues.

Usage: python scripts/stock.py <name> "<search>" [--photos] [-n 3]
Needs a free key from https://www.pexels.com/api/ in $PEXELS_API_KEY.
Files land in public/videos/<name>/stock/ (gitignored); prints the `src` paths to use in cues.json.
"""
import argparse
import json
import os
import re
import sys
import urllib.parse
import urllib.request

ap = argparse.ArgumentParser()
ap.add_argument("name")
ap.add_argument("query")
ap.add_argument("--photos", action="store_true", help="photos instead of video clips")
ap.add_argument("-n", type=int, default=3, help="how many results to download")
args = ap.parse_args()

key = os.environ.get("PEXELS_API_KEY")
if not key:
    sys.exit("Set PEXELS_API_KEY (free at https://www.pexels.com/api/)")

HEADERS = {"Authorization": key, "User-Agent": "content-studio/1.0"}


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=60) as r:
        return r.read()


q = urllib.parse.urlencode({"query": args.query, "orientation": "portrait", "per_page": args.n, "size": "medium"})
endpoint = "https://api.pexels.com/v1/search" if args.photos else "https://api.pexels.com/videos/search"
results = json.loads(get(f"{endpoint}?{q}"))["photos" if args.photos else "videos"]
if not results:
    sys.exit(f'No results for "{args.query}"')

out = f"public/videos/{args.name}/stock"
os.makedirs(out, exist_ok=True)
slug = re.sub(r"[^a-z0-9]+", "-", args.query.lower()).strip("-")

for i, r in enumerate(results, 1):
    if args.photos:
        url, ext, info = r["src"]["portrait"], "jpg", r.get("alt", "")
    else:
        # Smallest mp4 that still fills 1080x1920 (falls back to the largest), so rendering stays fast.
        files = [f for f in r["video_files"] if f.get("file_type") == "video/mp4" and f.get("height")]
        files.sort(key=lambda f: f["height"])
        pick = next((f for f in files if f["height"] >= 1900 and f["width"] >= 1000), files[-1])
        url, ext, info = pick["link"], "mp4", f'{r["duration"]}s {pick["width"]}x{pick["height"]}'
    path = f"{out}/{slug}-{i}.{ext}"
    with open(path, "wb") as f:
        f.write(get(url))
    print(f'{path.removeprefix("public/")}  ({info})')
