#!/usr/bin/env python3
"""Arma la voz maestra y timeline.json a partir de las pistas procesadas de cada narrador.
Uso: build_master.py carpeta_proc salida_voz.wav salida_timeline.json"""
import json, sys
import numpy as np, soundfile as sf, librosa

P, OUT, TL = sys.argv[1:4]
PLAN = [
 ("b1", None, "Introducción", [("marco", "marco_intro")]),
 ("b2", "La historieta crítica y los moneros", "1970–1980", [("lucas", "lucas_primer"), ("lucas", "lucas_segundo"), ("lucas", "lucas_tercer")]),
 ("b3", "Sistemas de identidad: México 68 y México 70", "1968–1970", [("marco", "marco_mexico68"), ("lucas", "lucas_cuarto"), ("lucas", "lucas_quinto")]),
 ("b4", "El Metro de la CDMX y la nueva museografía", "1964–1977", [("clau", "clau_titulo"), ("clau", "clau_primer"), ("clau", "clau_segundo"), ("clau", "clau_tercer")]),
 ("b5", "Identidad corporativa, billetes y cierre", "1969–1980", [("marco", "marco_identidad"), ("clau", "clau_cuarto"), ("marco", "marco_cierre")]),
]
SR = 48000; out = []; t = 0.0; T = []
def add(x):
    global t; out.append(x.astype(np.float32)); t += len(x) / SR
def sil(s): add(np.zeros(int(s * SR), np.float32))
sil(0.8)
for bid, title, years, segs in PLAN:
    b = dict(id=bid, title=title, years=years, start=round(t, 3), segments=[])
    if title and segs[0][1] != "clau_titulo": sil(2.2)  # tarjeta de capítulo
    for k, (who, name) in enumerate(segs):
        x, _ = librosa.load(f"{P}/{name}.wav", sr=SR)
        if k: sil(0.45 if segs[k - 1][0] == who else 0.7)
        b["segments"].append(dict(file=name, speaker=who, start=round(t, 3), dur=round(len(x) / SR, 3))); add(x)
    sil(0.9); b["end"] = round(t, 3); T.append(b)
sil(1.5)
z = np.concatenate(out); sf.write(OUT, z, SR, subtype="PCM_24")
json.dump(dict(duration=round(len(z) / SR, 3), blocks=T), open(TL, "w"), ensure_ascii=False, indent=1)
m, s = divmod(len(z) / SR, 60); print(f"voz maestra {int(m)}:{s:04.1f}")
for b in T: print(" ", b["id"], b["start"], b["end"], [x["file"] for x in b["segments"]])
