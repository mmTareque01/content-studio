#!/usr/bin/env bash
# Synthesize the sound-effect kit used by cues (no downloads, no licenses).
# Usage: scripts/make-sfx.sh   -> public/assets/sfx/*.wav
set -euo pipefail
cd "$(dirname "$0")/.."
out=public/assets/sfx; mkdir -p "$out"
gen() { ffmpeg -v error -y -f lavfi -i "$2" ${3:+-af "$3"} -ar 48000 -ac 2 "$out/$1.wav"; }

# airy swoosh: band-passed noise swelling in and out
gen whoosh "anoisesrc=color=pink:d=0.55:a=0.9" "highpass=f=500,lowpass=f=5000,afade=t=in:d=0.28:curve=exp,afade=t=out:st=0.28:d=0.27:curve=exp,volume=1.6"
# bubbly pop: fast downward pitch blip
gen pop "aevalsrc='0.9*sin(2*PI*(380+900*exp(-t*45))*t)*exp(-t*28)':d=0.18:s=48000"
# bright ding: two bell partials
gen ding "aevalsrc='0.5*sin(2*PI*1318*t)*exp(-t*5)+0.25*sin(2*PI*2637*t)*exp(-t*8)+0.12*sin(2*PI*3951*t)*exp(-t*12)':d=1.1:s=48000"
# cinematic hit: sub drop + noise crack
gen impact "aevalsrc='0.95*sin(2*PI*(45+110*exp(-t*14))*t)*exp(-t*3.2)+0.35*(random(0)*2-1)*exp(-t*30)':d=1.3:s=48000" "lowpass=f=6000"
# ui click
gen click "aevalsrc='0.8*(random(0)*2-1)*exp(-t*400)+0.5*sin(2*PI*2200*t)*exp(-t*120)':d=0.06:s=48000"
# sparkle: rising shimmer
gen sparkle "aevalsrc='0.3*sin(2*PI*(1800+2400*t)*t)*exp(-t*3)*(0.5+0.5*sin(2*PI*28*t))':d=0.7:s=48000"
ls "$out"
