#!/usr/bin/env bash
# Variante de voice_smooth.sh con nivelación agresiva: volumen muy parejo, sin subidas ni bajadas.
# Mismo timbre/limpieza; dynaudnorm rápido + compresión 4:1 + limitador.
# Uso: voice_smooth_parejo.sh entrada salida.wav [brillo=normal|suave]
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
  dynaudnorm=f=150:g=11:p=0.85:m=3:s=6,
  acompressor=threshold=-26dB:ratio=4:attack=5:release=120:knee=6:makeup=4,
  deesser=i=0.5:m=0.5:f=0.5,
  agate=threshold=0.02:ratio=3:range=0.03:attack=6:release=250:knee=3,
  alimiter=limit=0.7:attack=3:release=60:level=disabled,
  lowpass=f=15000,
  loudnorm=I=-16:TP=-1.5:LRA=4,
  aformat=sample_rates=48000" -ar 48000 "$OUT"
echo "listo: $OUT"
