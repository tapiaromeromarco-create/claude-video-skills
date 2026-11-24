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
# Tableros: en cada parada de cámara, la primera pieza de esa zona entra al llegar (sin papel vacío)
for sc in scenes:
    if sc["type"] != "board": continue
    cams = [c for c in sc["props"].get("cams", []) if c.get("at") is not None] or []
    if not cams: continue
    cams[0] = dict(cams[0]); cams[0].setdefault("at", sc["t0"])
    items = sc["props"].get("items", [])
    def zona(it):
        cx = it["x"] + it.get("w", 400) / 2; cy = it["y"] + it.get("h", 300) / 2
        return min(range(len(cams)), key=lambda i: (cams[i]["x"] - cx) ** 2 + (cams[i]["y"] - cy) ** 2)
    for i, c in enumerate(cams):
        grupo = sorted([it for it in items if it.get("at") is not None and zona(it) == i and it["type"] not in ("arrow", "circle", "asterisk")], key=lambda it: it["at"])
        if grupo and grupo[0]["at"] > c["at"] + 1.2:
            grupo[0]["at"] = round(c["at"] + 0.7, 3)

# Imágenes a pantalla completa (encima de las escenas): "at" + "until" (frase) o "dur" (s)
overlays = []
for i, ov in enumerate(S.get("overlays", [])):
    b = blocks[ov["block"]]
    t0 = resolve(ov["at"], b["start"], b["end"], f"pantalla completa {i}")
    if t0 is None: continue
    t1 = resolve(ov["until"], t0 + 0.5, b["end"], f"pantalla completa {i} (fin)") if ov.get("until") else None
    t1 = t1 if t1 is not None else t0 + ov.get("dur", 3.5)
    overlays.append(dict(block=ov["block"], type=ov.get("kind", "full"), t0=round(t0, 3), t1=round(t1, 3), props=resolve(ov.get("props", {}), t0 - 0.3, t1 + 0.3, f"pantalla completa {i}")))

# Planos específicos: en las zonas largas la cámara se acerca a una pieza clave y luego regresa
for sc in scenes:
    if sc["type"] != "board": continue
    cams = sorted([c for c in sc["props"].get("cams", []) if c.get("at") is not None], key=lambda c: c["at"])
    if not cams: continue
    items = sc["props"].get("items", [])
    def zona_de(it):
        cx = it["x"] + it.get("w", 400) / 2; cy = it["y"] + it.get("h", 300) / 2
        return min(range(len(cams)), key=lambda i: (cams[i]["x"] - cx) ** 2 + (cams[i]["y"] - cy) ** 2)
    extra = []
    for i, c in enumerate(cams):
        t_next = cams[i + 1]["at"] if i + 1 < len(cams) else sc["t1"]
        d = t_next - c["at"]
        if d < 6.5: continue
        cands = [it for it in items if zona_de(it) == i and it.get("at") is not None and it["at"] < c["at"] + d * 0.7
                 and (it["type"] in ("year", "rotulo", "pictos") or (it["type"] == "photo" and it.get("src")))]
        cands.sort(key=lambda it: -(it.get("w", 300) * it.get("h", 300)))
        usados = 0; t = c["at"] + max(2.2, d * 0.3)
        for it in cands[:2 if d > 12 else 1]:
            t = max(t, it["at"] + 0.8)
            if t > t_next - 3.0: break
            h = it.get("h", 300) if it["type"] != "year" else it.get("size", 300)
            z = max(1.25, min(1.75, 0.72 * 1080 / max(h, 200)))
            extra.append(dict(at=round(t, 3), x=it["x"] + it.get("w", 400) / 2, y=it["y"] + h / 2, z=round(z, 2), dur=1.4, kind="zoom"))
            vuelta = t + 2.6
            if vuelta < t_next - 1.6:
                extra.append(dict(at=round(vuelta, 3), x=c["x"], y=c["y"], z=c["z"], dur=1.3, kind="zoom"))
            t = vuelta + 1.5; usados += 1
    sc["props"]["cams"] = sorted(cams + extra, key=lambda c: c["at"])

json.dump(dict(duration=T["duration"], scenes=scenes, overlays=overlays), open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"{len(scenes)} escenas · {T['duration']:.1f}s")
short = [f"  {i} {s['type']} {s['t1']-s['t0']:.1f}s" for i, s in enumerate(scenes) if s["t1"] - s["t0"] < 2.0]
if short: print("escenas muy cortas (<2 s):\n" + "\n".join(short))
if warn: print("anclas no encontradas:\n" + "\n".join(warn))
