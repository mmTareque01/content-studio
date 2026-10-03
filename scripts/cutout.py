"""Remove the background from a talking-head video (RobustVideoMatting, runs locally).

Usage: python scripts/cutout.py <in.mp4> <out.webm>
Writes a VP9 WebM with an alpha channel: you, with a transparent background.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import torch
from tqdm import tqdm

MODEL = Path(__file__).resolve().parent.parent / "models" / "rvm_mobilenetv3.torchscript"
src, dst = sys.argv[1], sys.argv[2]

probe = json.loads(subprocess.check_output([
    "ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets",
    "-show_entries", "stream=width,height,r_frame_rate,nb_read_packets", "-of", "json", src,
]))["streams"][0]
W, H = probe["width"], probe["height"]
fps = probe["r_frame_rate"]
total = int(probe.get("nb_read_packets", 0)) or None


def load(device):
    m = torch.jit.load(str(MODEL), map_location="cpu").to(device).eval()
    # Smoke-test the device so MPS problems surface before we start encoding.
    with torch.no_grad():
        m(torch.zeros(1, 3, 256, 256, device=device), None, None, None, None, 0.25)
    return m


device = "mps" if torch.backends.mps.is_available() else "cpu"
try:
    model = load(device)
except Exception as e:  # noqa: BLE001
    print(f"MPS failed ({e}); falling back to CPU")
    device, model = "cpu", load("cpu")
print(f"Matting {W}x{H} @ {fps} on {device}")

reader = subprocess.Popen(
    ["ffmpeg", "-v", "error", "-i", src, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
    stdout=subprocess.PIPE,
)
writer = subprocess.Popen(
    ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", fps, "-i", "-",
     "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-auto-alt-ref", "0", "-b:v", "0", "-crf", "28",
     "-deadline", "good", "-cpu-used", "5", "-row-mt", "1", dst],
    stdin=subprocess.PIPE,
)

rec = [None] * 4
downsample = min(1.0, 512 / max(W, H))  # RVM works best with ~512px internal resolution
frame_bytes = W * H * 3
with torch.no_grad(), tqdm(total=total, unit="f") as bar:
    while chunk := reader.stdout.read(frame_bytes):
        if len(chunk) < frame_bytes:
            break
        rgb = np.frombuffer(chunk, np.uint8).reshape(H, W, 3)
        x = torch.from_numpy(rgb).to(device).permute(2, 0, 1)[None].float().div(255)
        fgr, pha, *rec = model(x, *rec, downsample)
        rgba = torch.cat([fgr, pha], 1)[0].permute(1, 2, 0).mul(255).clamp(0, 255).byte().cpu().numpy()
        writer.stdin.write(rgba.tobytes())
        bar.update(1)

writer.stdin.close()
writer.wait()
reader.wait()
print(f"-> {dst}")
