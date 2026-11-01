#!/usr/bin/env bash
# Turn a hero video (blueprint → layout → aerial → exterior) into a WebP image
# sequence for the canvas scrubber, then set NEXT_PUBLIC_HERO_FRAMES.
#   npm run frames -- path/to/hero.mp4 [fps=30] [width=1920]
set -euo pipefail
IN="${1:?usage: extract-frames.sh hero.mp4 [fps] [width]}"
FPS="${2:-30}"
WIDTH="${3:-1920}"
OUT="public/frames"
rm -rf "$OUT" && mkdir -p "$OUT" "$OUT/mobile"
ffmpeg -loglevel error -i "$IN" -vf "fps=${FPS},scale=${WIDTH}:-1" -c:v libwebp -quality 80 "$OUT/%04d.webp"
ffmpeg -loglevel error -i "$IN" -vf "fps=${FPS},scale=900:-1" -c:v libwebp -quality 75 "$OUT/mobile/%04d.webp"
COUNT=$(ls "$OUT"/*.webp | wc -l | tr -d ' ')
echo "Extracted ${COUNT} frames → ${OUT}"
echo "Add to .env:  NEXT_PUBLIC_HERO_FRAMES=${COUNT}"
