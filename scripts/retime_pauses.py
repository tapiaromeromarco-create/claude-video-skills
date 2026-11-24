#!/usr/bin/env python3
"""Ajusta la duración de pausas concretas de una voz en off.
Uso: retime_pauses.py entrada salida.wav INICIO-FIN:OBJETIVO [...]
  INICIO-FIN = pausa actual en segundos (zona en silencio), OBJETIVO = duración deseada.
Corta en el centro de la pausa y agrega (o quita) silencio con fundidos cortos."""
import sys, numpy as np, librosa, soundfile as sf
inp, out, specs = sys.argv[1], sys.argv[2], sys.argv[3:]
y, sr = librosa.load(inp, sr=48000, mono=True)
fade = int(0.012 * sr)
edits = sorted((float(a), float(b), float(t)) for a, b, t in
               (s.replace("-", ":", 1).split(":") for s in specs))
parts, pos, shift = [], 0, 0.0
for a, b, tgt in edits:
    cur = b - a; mid = int((a + b) / 2 * sr)
    if tgt >= cur:
        parts.append(y[pos:mid]); parts.append(np.zeros(int((tgt - cur) * sr), dtype=y.dtype)); pos = mid
    else:  # recortar: quitar el centro de la pausa
        cut = int((cur - tgt) * sr); s0 = mid - cut // 2
        head = y[pos:s0].copy(); head[-fade:] *= np.linspace(1, 0, fade)
        parts.append(head); pos = s0 + cut
        y[pos:pos + fade] *= np.linspace(0, 1, fade)
    shift += tgt - cur
    print(f"pausa {a:.2f}-{b:.2f}: {cur:.2f}s -> {tgt:.2f}s")
parts.append(y[pos:])
z = np.concatenate(parts)
sf.write(out, z, sr, subtype="PCM_24")
print(f"duración {len(y)/sr:.2f}s -> {len(z)/sr:.2f}s ({shift:+.2f}s)")
