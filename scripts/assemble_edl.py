#!/usr/bin/env python3
"""Arma una voz en off a partir de una lista de fragmentos (EDL) en JSON.
EDL: [{"a": inicio, "b": fin, "gap": "w|c|s|p", "txt": "...", "fi": fundido_entrada_s (opcional)}...]
  gap = pausa ANTES del fragmento: w=entre palabras, c=coma, s=fin de oración, p=párrafo.
Uso: assemble_edl.py original.wav edl.json salida.wav"""
import json, sys, numpy as np, soundfile as sf, librosa
GAPS = {"w": 0.09, "c": 0.28, "s": 0.55, "p": 0.95}
src, edl, out = sys.argv[1:4]
y, sr = librosa.load(src, sr=48000, mono=True)
F = int(0.012 * sr)
parts = []
for i, seg in enumerate(json.load(open(edl, encoding="utf-8"))):
    a, b = int(seg["a"] * sr), int(seg["b"] * sr)
    x = y[a:b].copy()
    n = min(F, len(x) // 4)
    fi = min(int(seg.get("fi", 0.012) * sr), len(x) // 3)
    x[:fi] *= np.linspace(0, 1, fi) ** 2; x[-n:] *= np.linspace(1, 0, n)
    if i: parts.append(np.zeros(int(GAPS[seg.get("gap", "w")] * sr), dtype=x.dtype))
    parts.append(x)
z = np.concatenate(parts)
sf.write(out, z, sr, subtype="PCM_24")
print(f"{len(parts)//2+1} fragmentos -> {len(z)/sr:.1f}s")
