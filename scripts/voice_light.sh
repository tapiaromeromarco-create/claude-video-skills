#!/usr/bin/env bash
# Procesado ligero para voces ya limpias (sin excitador): EQ por perfil, nivelación, -16 LUFS,
# y recorte de silencio al inicio/fin (deja 0.12 s).
# Uso: voice_light.sh entrada salida.wav [perfil=neutro|grave|claro]
#   grave = voz con exceso de graves (recorta 120/300 Hz, suma presencia)
#   claro = voz ya brillante (solo retoques)
set -euo pipefail
IN="$1"; OUT="$2"; PERFIL="${3:-neutro}"
case "$PERFIL" in
  grave) EQ="equalizer=f=110:t=q:w=1.0:g=-6,equalizer=f=280:t=q:w=1.2:g=-3.5,equalizer=f=3500:t=q:w=1.0:g=3.5,highshelf=f=8000:g=2.5" ;;
  claro) EQ="equalizer=f=250:t=q:w=1.2:g=-2,equalizer=f=3500:t=q:w=1.0:g=1.5,equalizer=f=5500:t=q:w=1.2:g=2" ;;
  *)     EQ="equalizer=f=250:t=q:w=1.2:g=-2,equalizer=f=3500:t=q:w=1.0:g=2" ;;
esac
ffmpeg -hide_banner -loglevel error -y -i "$IN" -af "
  aformat=sample_rates=48000:channel_layouts=mono,
  highpass=f=80:p=2,
  afftdn=nr=10:nf=-55:tn=1,
  ${EQ},
  dynaudnorm=f=300:g=21:p=0.9:m=8:s=4,
  acompressor=threshold=-24dB:ratio=2.5:attack=8:release=180:makeup=2,
  deesser=i=0.4:m=0.5:f=0.5,
  silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.12:detection=rms,
  areverse,
  silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.15:detection=rms,
  areverse,
  loudnorm=I=-16:TP=-1.5:LRA=7,
  aformat=sample_rates=48000" -ar 48000 "$OUT"
