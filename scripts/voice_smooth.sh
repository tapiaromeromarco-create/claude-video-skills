#!/usr/bin/env bash
# Mejora una voz en off grabada por frases sueltas (limpieza + timbre + fluidez).
# 1) Limpieza: quita zumbido grave y ruido de fondo (afftdn con seguimiento de ruido).
# 2) Timbre: quita boom/caja (130 y 300 Hz), devuelve presencia (2.5-4 kHz) y brillo
#    (highshelf + excitador armónico suave, aplicado DESPUÉS de limpiar para no subir el soplido).
# 3) Fluidez: nivela volumen entre frases (dynaudnorm lento) y compresión suave.
# 4) Pausas limpias: expansor suave que baja el fondo entre frases sin cortes bruscos.
# 5) Entrega: -16 LUFS, pico -1.5 dBTP, 48 kHz.
# Uso: voice_smooth.sh entrada salida.wav [brillo=normal|suave]
set -euo pipefail
IN="$1"; OUT="$2"; BRILLO="${3:-normal}"
if [ "$BRILLO" = "suave" ]; then PRES=3; AIR=3; EXC=1; else PRES=5; AIR=5; EXC=1.5; fi
ffmpeg -hide_banner -loglevel error -y -i "$IN" -af "
  aformat=sample_rates=48000:channel_layouts=mono,
  highpass=f=90:p=2,
  afftdn=nr=24:nf=-45:tn=1:ad=0.7,
  afftdn=nr=8:nf=-55:tn=1,
  equalizer=f=130:t=q:w=1.0:g=-6,
  equalizer=f=300:t=q:w=1.2:g=-6,
  equalizer=f=600:t=q:w=1.5:g=-2,
  equalizer=f=2500:t=q:w=1.0:g=4,
  equalizer=f=4200:t=q:w=1.0:g=${PRES},
  highshelf=f=6500:g=${AIR},
  aexciter=amount=${EXC}:drive=6:blend=0:freq=5000:ceil=14000,
  dynaudnorm=f=350:g=31:p=0.9:m=2:s=4,
  acompressor=threshold=-22dB:ratio=2:attack=12:release=220:makeup=1.5,
  deesser=i=0.5:m=0.5:f=0.5,
  agate=threshold=0.02:ratio=3:range=0.03:attack=6:release=250:knee=3,
  lowpass=f=15000,
  loudnorm=I=-16:TP=-1.5:LRA=7,
  aformat=sample_rates=48000" -ar 48000 "$OUT"
echo "listo: $OUT"
