#!/usr/bin/env bash
# Hace más fluida una voz en off armada por frases sueltas.
# - nivela el volumen entre frases (dynaudnorm, ventana lenta)
# - compresión suave + EQ de voz + de-esser
# - "sala" muy sutil para unir las tomas
# - fondo de ambiente continuo para que las pausas no caigan a silencio digital
# - loudness final para video (-16 LUFS, pico -1.5 dBTP)
# Uso: voice_smooth.sh entrada.(mp3|wav) salida.wav [nivel_ambiente_dB=-70]
set -euo pipefail
IN="$1"; OUT="$2"; AMB="${3:--70}"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
ffmpeg -hide_banner -loglevel error -y -i "$IN" \
  -f lavfi -t "$DUR" -i "anoisesrc=color=pink:amplitude=1:seed=7" \
  -filter_complex "
  [0:a]aformat=sample_rates=48000:channel_layouts=mono,
       highpass=f=75,
       dynaudnorm=f=350:g=31:p=0.9:m=2:s=4,
       acompressor=threshold=-22dB:ratio=2:attack=12:release=220:makeup=1.5,
       equalizer=f=220:t=q:w=1.2:g=-1.5,
       equalizer=f=3200:t=q:w=1.0:g=1.5,
       deesser=i=0.35,
       aecho=0.85:0.6:23|37:0.07|0.05[v];
  [1:a]aformat=sample_rates=48000:channel_layouts=mono,
       lowpass=f=5000,highpass=f=120,volume=${AMB}dB[n];
  [v][n]amix=inputs=2:normalize=0:duration=first,
       loudnorm=I=-16:TP=-1.5:LRA=7,
       aformat=sample_rates=48000[out]" \
  -map "[out]" -ar 48000 "$OUT"
echo "listo: $OUT"
