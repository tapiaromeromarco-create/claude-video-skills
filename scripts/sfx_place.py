#!/usr/bin/env python3
"""Coloca efectos de sonido según el storyboard resuelto y genera una pista de efectos.
Uso: sfx_place.py storyboard.json carpeta_sfx salida.wav"""
import json, os, random, sys
import numpy as np, soundfile as sf

SR = 48000
VOL = {"whoosh": -21, "swipe": -19, "papel": -25, "golpe": -23, "cinta": -25, "rotulador": -27, "maquina": -25, "sello": -17}
GAP = 0.12  # separación mínima entre efectos de la misma familia

sb, lib, out = sys.argv[1:4]
D = json.load(open(sb, encoding="utf-8")); random.seed(4)
track = np.zeros((int((D["duration"] + 2) * SR), 2), np.float32)
cache = {}
def load(name):
    k = f"{name}_{random.randint(0, 3)}"
    if k not in cache: cache[k] = sf.read(os.path.join(lib, k + ".wav"), dtype="float32")[0]
    return cache[k]
last = {}
def put(name, t, extra_db=0.0):
    if t is None or t < 0: return
    if t - last.get(name, -9) < GAP: return
    last[name] = t
    x = load(name) * 10 ** ((VOL[name] + extra_db) / 20)
    i = int(t * SR); j = min(len(track), i + len(x)); track[i:j] += x[:j - i]

ITEM = {"photo": [("papel", 0.0), ("golpe", 0.22)], "paper": [("papel", 0.0)], "tape": [("cinta", 0.0)], "hand": [("rotulador", 0.0)],
        "arrow": [("rotulador", 0.0)], "circle": [("rotulador", 0.0)], "asterisk": [("rotulador", 0.0)], "label": [("rotulador", 0.05)],
        "ficha": [("maquina", 0.05)], "year": [("sello", 0.0)], "rotulo": [("papel", 0.0)], "tag": [("maquina", 0.0)]}
n = 0
for i, s in enumerate(D["scenes"]):
    if i > 0: put("swipe", s["t0"] - 0.05); n += 1
    if s["type"] == "chapter": put("sello", s["t0"] + 0.25, 2); n += 1
    if s["type"] == "end": put("sello", s["t0"] + 0.3); n += 1
    p = s["props"]
    if s["type"] == "board":
        cams = [c for c in p.get("cams", []) if c.get("at") is not None]
        for c in cams[1:]: put("whoosh", c["at"] - 0.1); n += 1
        for it in sorted(p.get("items", []), key=lambda it: it.get("at") or 0):
            if it.get("at") is None: continue
            for name, dt in ITEM.get(it["type"], []):
                put(name, it["at"] + dt, -3 if it["type"] == "photo" and not it.get("cutout") else 0); n += 1
            if it["type"] == "pictos":
                for pc in it.get("items", []): put("golpe", pc.get("at")); n += 1
    else:  # escenas sueltas: entradas de piezas
        for it in p.get("items", []) or []: put("papel", it.get("at")); n += 1
peak = np.abs(track).max()
if peak > 0.9: track *= 0.9 / peak
sf.write(out, track, SR, subtype="PCM_16")
print(f"pista de efectos: {out} ({n} eventos propuestos)")
