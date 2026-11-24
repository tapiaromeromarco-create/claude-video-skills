#!/usr/bin/env bash
# Render completo con desenfoque de movimiento:
#   1) Remotion a 60 fps (las animaciones están escritas en tiempo de 30 fps)
#   2) mezcla de cada par de fotogramas -> 30 fps con motion blur natural
#   3) mezcla final de voz, música (con ducking) y efectos
set -euo pipefail
cd "$(dirname "$0")"
A=../audio
python3 ../../../scripts/sfx_place.py remotion/src/data/storyboard.json $A/sfx $A/sfx_pista.wav
(cd remotion && npx remotion render VideoEnsayo ../render/video_voz60.mp4 --concurrency=4 --codec=h264 --crf=16 --log=error 2>&1 | grep -vE "memory|CGroup|meminfo|docker|lower amount" || true)
cd render
ffmpeg -hide_banner -loglevel error -y -i video_voz60.mp4 -i ../$A/musica_provisional_mix.wav -i ../$A/sfx_pista.wav -filter_complex "
 [0:v]tmix=frames=2:weights='1 1',fps=30,format=yuv420p[vid];
 [0:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[v][sc];
 [1:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.9[m];
 [m][sc]sidechaincompress=threshold=0.03:ratio=8:attack=40:release=600:makeup=1[md];
 [2:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=1.0[fx];
 [v][md][fx]amix=inputs=3:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9[a]" \
 -map "[vid]" -map "[a]" -c:v libx264 -preset medium -crf 19 -r 30 -c:a aac -b:a 192k video_final.mp4
ffmpeg -hide_banner -loglevel error -y -i video_final.mp4 -vf scale=1280:-2 -c:v libx264 -preset veryfast -crf 25 -c:a aac -b:a 128k video_final_720p.mp4
rm -f video_voz60.mp4
ls -la video_final*.mp4
