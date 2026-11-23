#!/usr/bin/env python3
"""Convierte las frases ancla del storyboard en segundos usando la transcripción por palabra.

Uso: resolve_storyboard.py storyboard_src.json timeline.json words.json salida.json
- Cada escena se ancla con "at": "@frase" (dentro de su bloque) o "start": segundos desde el inicio del bloque.
- Cualquier valor "@frase" en props se resuelve buscando hacia adelante desde el inicio de la escena.
- Búsqueda tolerante: compara palabra por palabra sin acentos ni puntuación, con similitud aproximada.
- La escena dura hasta que empieza la siguiente (la última, hasta el final del audio)."""
import json, re, sys, unicodedata
from difflib import SequenceMatcher

def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9ñ ]+", " ", s).split()

src, tl, wj, out = sys.argv[1:5]
S = json.load(open(src, encoding="utf-8")); T = json.load(open(tl, encoding="utf-8")); W = json.load(open(wj, encoding="utf-8"))
toks = []  # (token normalizado, inicio)
for w in W:
    for t in norm(w["w"]):
        toks.append((t, w["s"]))
blocks = {b["id"]: b for b in T["blocks"]}
warn = []

def find(phrase, t_from, t_to):
    q = norm(phrase)
    best = (0, None)
    for i, (t, s) in enumerate(toks):
        if s < t_from - 0.05 or s > t_to: continue
        score = sum(SequenceMatcher(None, q[j], toks[i + j][0]).ratio() if i + j < len(toks) else 0 for j in range(len(q))) / len(q)
        if score > best[0] + 1e-9: best = (score, s)
        if score > 0.97: break
    return best

def resolve(v, t_from, t_to, ctx):
    if isinstance(v, str) and v.startswith("@"):
        score, s = find(v[1:], t_from, t_to)
        if s is None or score < 0.72:
            warn.append(f"  ? {ctx}: '{v[1:]}' (mejor {score:.2f})"); return None
        return round(s - 0.08, 3)
    if isinstance(v, list): return [resolve(x, t_from, t_to, ctx) for x in v]
    if isinstance(v, dict): return {k: resolve(x, t_from, t_to, ctx) for k, x in v.items()}
    return v

scenes = []
for i, sc in enumerate(S["scenes"]):
    b = blocks[sc["block"]]
    if "start" in sc: t0 = b["start"] + sc["start"]
    else:
        prev = scenes[-1]["t0"] if scenes and scenes[-1]["block"] == sc["block"] else b["start"]
        r = resolve(sc["at"], prev, b["end"], f"escena {i} ({sc['type']})")
        t0 = r if r is not None else prev + 3
        if scenes and scenes[-1]["type"] == "chapter": t0 = max(t0, scenes[-1]["t0"] + 2.4)  # capítulo mínimo 2.4 s
    scenes.append(dict(block=sc["block"], type=sc["type"], t0=round(max(0, t0), 3), props=sc.get("props", {})))
for i, sc in enumerate(scenes):
    end = scenes[i + 1]["t0"] if i + 1 < len(scenes) else T["duration"]
    sc["t1"] = round(end, 3)
    sc["props"] = resolve(sc["props"], sc["t0"] - 0.3, end + 0.5, f"escena {i} ({sc['type']})")
json.dump(dict(duration=T["duration"], scenes=scenes), open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"{len(scenes)} escenas · {T['duration']:.1f}s")
short = [f"  {i} {s['type']} {s['t1']-s['t0']:.1f}s" for i, s in enumerate(scenes) if s["t1"] - s["t0"] < 2.0]
if short: print("escenas muy cortas (<2 s):\n" + "\n".join(short))
if warn: print("anclas no encontradas:\n" + "\n".join(warn))
