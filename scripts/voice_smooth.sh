#!/usr/bin/env bash
# Mejora una voz en off grabada por frases sueltas (timbre + fluidez).
# 1) Timbre: quita boom/caja (130 y 300 Hz), devuelve presencia (2.5-4 kHz),
#    brillo con highshelf y excitador armónico (regenera agudos que faltan > 8 kHz).
# 2) Fluidez: nivela volumen entre frases (dynaudnorm lento), compresión suave,
#    de-esser, "sala" muy sutil y fondo de ambiente continuo en las pausas.
# 3) Entrega: -16 LUFS, pico -1.5 dBTP, 48 kHz.
# Uso: voice_smooth.sh entrada salida.wav [nivel_ambiente_dB=-70] [brillo=normal|suave]
set -euo pipefail
IN="$1"; OUT="$2"; AMB="${3:--70}"; BRILLO="${4:-normal}"
if [ "$BRILLO" = "suave" ]; then PRES=3; AIR=4; EXC=1.5; else PRES=5; AIR=6; EXC=2.5; fi
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
ffmpeg -hide_banner -loglevel error -y -i "$IN" \
  -f lavfi -t "$DUR" -i "anoisesrc=color=pink:amplitude=1:seed=7" \
  -filter_complex "
  [0:a]aformat=sample_rates=48000:channel_layouts=mono,
       highpass=f=85:p=2,
       equalizer=f=130:t=q:w=1.0:g=-6,
       equalizer=f=300:t=q:w=1.2:g=-6,
       equalizer=f=600:t=q:w=1.5:g=-2,
       equalizer=f=2500:t=q:w=1.0:g=4,
       equalizer=f=4200:t=q:w=1.0:g=${PRES},
       highshelf=f=6500:g=${AIR},
       aexciter=amount=${EXC}:drive=8:blend=0:freq=5000:ceil=16000,
       dynaudnorm=f=350:g=31:p=0.9:m=2:s=4,
       acompressor=threshold=-22dB:ratio=2:attack=12:release=220:makeup=1.5,
       deesser=i=0.5:m=0.5:f=0.5,
       aecho=0.85:0.6:23|37:0.07|0.05[v];
  [1:a]aformat=sample_rates=48000:channel_layouts=mono,
       lowpass=f=5000,highpass=f=120,volume=${AMB}dB[n];
  [v][n]amix=inputs=2:normalize=0:duration=first,
       loudnorm=I=-16:TP=-1.5:LRA=7,
       aformat=sample_rates=48000[out]" \
  -map "[out]" -ar 48000 "$OUT"
echo "listo: $OUT"
