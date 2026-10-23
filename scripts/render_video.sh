#!/usr/bin/env bash
set -euo pipefail

# Template para render final con FFmpeg
# Ajusta rutas y nombres según tu flujo real

INPUT_DIR="${1:-./clips}"
OUTPUT_FILE="${2:-./output/final-video.mp4}"

mkdir -p "$(dirname "$OUTPUT_FILE")"

ffmpeg -y \
  -i "$INPUT_DIR/clip_1.mp4" \
  -i "$INPUT_DIR/clip_2.mp4" \
  -filter_complex "[0:v]scale=1280:720,setsar=1[v0];[1:v]scale=1280:720,setsar=1[v1];[v0][v1]concat=n=2:v=1:a=0[outv]" \
  -map "[outv]" \
  -c:v libx264 \
  -pix_fmt yuv420p \
  "$OUTPUT_FILE"

echo "Video renderizado en: $OUTPUT_FILE"
