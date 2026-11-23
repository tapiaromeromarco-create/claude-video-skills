#!/usr/bin/env bash
# Render completo: video (Remotion) + mezcla final de voz, música (con ducking) y efectos.
set -euo pipefail
cd "$(dirname "$0")"
A=../audio
python3 ../../../scripts/sfx_place.py remotion/src/data/storyboard.json $A/sfx $A/sfx_pista.wav
(cd remotion && npx remotion render VideoEnsayo ../render/video_voz.mp4 --concurrency=4 --codec=h264 --crf=20 --log=error 2>&1 | grep -vE "memory|CGroup|meminfo|docker|lower amount" || true)
cd render
ffmpeg -hide_banner -loglevel error -y -i video_voz.mp4 -i ../$A/musica_provisional_mix.wav -i ../$A/sfx_pista.wav -filter_complex "
 [0:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[v][sc];
 [1:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.9[m];
 [m][sc]sidechaincompress=threshold=0.03:ratio=8:attack=40:release=600:makeup=1[md];
 [2:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=1.0[fx];
 [v][md][fx]amix=inputs=3:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9[a]" \
 -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k video_final.mp4
ffmpeg -hide_banner -loglevel error -y -i video_final.mp4 -vf scale=1280:-2 -c:v libx264 -preset veryfast -crf 26 -c:a aac -b:a 128k video_final_720p.mp4
ls -la video_final*.mp4
