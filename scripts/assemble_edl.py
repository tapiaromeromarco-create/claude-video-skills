#!/usr/bin/env python3
"""Arma una voz en off fluida a partir de una lista de fragmentos (EDL) en JSON.
EDL: [{"a": inicio, "b": fin, "gap": "w|c|s|p", "txt": "...", opcionales:
        "fi": fundido de entrada (s), "pausa": pausa antes en s (anula gap), "sin_acelerar": true}...]
  gap = pausa ANTES del fragmento: w=entre palabras, c=coma, s=fin de oración, p=párrafo.
Fluidez:
  - fragmentos contiguos en el original (hueco corto, sin muletillas) se unen sin cortar;
  - entre palabras se empalma con fundido cruzado (sin silencio en medio);
  - palabras dichas muy lento se aceleran (rubberband, sin cambiar el tono).
Uso: assemble_edl.py original.wav edl.json salida.wav [--islas islands.json]"""
import argparse, json, os, re, subprocess, tempfile
import numpy as np, soundfile as sf, librosa

GAPS = {"w": 0.0, "c": 0.22, "s": 0.50, "p": 0.85}
MERGE_GAP = 0.40      # unir si en el original están a menos de esto
XFADE = 0.035         # fundido cruzado entre palabras
SPS_MAX = 0.235       # seg/sílaba a partir del cual se acelera
SPS_TARGET = 0.205
TEMPO_MAX = 1.25
TAIL_EXT = 0.10      # extender el final antes de una pausa (cola natural de la voz)
FADE_OUT = 0.18      # desvanecimiento del final de cada frase
SR = 48000

def syl(t):
    t = t.lower().replace("1968", "mil novecientos sesenta y ocho").replace("1980", "mil novecientos ochenta")
    return max(1, len(re.findall(r"[aeiouáéíóúü]+", t)))

def stretch(x, tempo):
    if abs(tempo - 1) < 0.03: return x
    with tempfile.TemporaryDirectory() as d:
        i, o = os.path.join(d, "i.wav"), os.path.join(d, "o.wav")
        sf.write(i, x, SR, subtype="FLOAT")
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", i, "-af",
                        f"rubberband=tempo={tempo:.3f}:pitchq=quality:formant=preserved:transients=smooth",
                        o], check=True)
        return sf.read(o, dtype="float32")[0]

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("src"); ap.add_argument("edl"); ap.add_argument("out")
    ap.add_argument("--islas")
    ap.add_argument("--pausas", help="p.ej. c=0.06,s=0.12,p=0.2 (segundos)")
    ap.add_argument("--nivelar", type=float, help="igualar cada fragmento a este RMS en dBFS, p.ej. -20")
    a = ap.parse_args()
    if a.pausas:
        for kv in a.pausas.split(","): k, v = kv.split("="); GAPS[k] = float(v)
    y, _ = librosa.load(a.src, sr=SR, mono=True)
    E = json.load(open(a.edl, encoding="utf-8"))
    islas = json.load(open(a.islas, encoding="utf-8")) if a.islas else []

    def limpio(t0, t1):  # ¿no hay palabras/muletillas transcritas en el hueco?
        return not any(i["t"].strip(" .") and i["a"] < t1 - 0.02 and i["b"] > t0 + 0.02 for i in islas)

    # 1) unir fragmentos contiguos
    G = []
    for e in E:
        if G and e.get("gap", "w") == "w" and 0 <= e["a"] - G[-1]["b"] <= MERGE_GAP and limpio(G[-1]["b"], e["a"]) and "fi" not in e:
            G[-1]["b"] = e["b"]; G[-1]["txt"] += " " + e["txt"]
            G[-1]["sin_acelerar"] = G[-1].get("sin_acelerar") or e.get("sin_acelerar", False)
        else:
            G.append(dict(e))
    # extender el final de cada frase que va antes de una pausa, sin pisar la siguiente isla
    for k, g in enumerate(G):
        if k + 1 < len(G) and (G[k + 1].get("gap", "w") != "w" or "pausa" in G[k + 1]) or k + 1 == len(G):
            nxt = min([i["a"] for i in islas if i["a"] > g["b"] + 0.01] or [g["b"] + TAIL_EXT + 0.05])
            nb = min(g["b"] + TAIL_EXT, nxt - 0.04); g["fin"] = max(0.0, nb - g["b"]); g["b"] = nb
    # 2) cortar, acelerar si va lento y empalmar
    out = np.zeros(0, dtype=np.float32); X = int(XFADE * SR); stats = []
    for k, g in enumerate(G):
        x = y[int(g["a"] * SR):int(g["b"] * SR)].astype(np.float32)
        sps = len(x) / SR / syl(g["txt"])
        tempo = min(TEMPO_MAX, sps / SPS_TARGET) if sps > SPS_MAX and not g.get("sin_acelerar") else 1.0
        x = stretch(x, tempo); stats.append((g["txt"], sps, tempo))
        if a.nivelar is not None:  # mismo volumen para todos los fragmentos + arranque suave
            fr = librosa.feature.rms(y=x, frame_length=1024, hop_length=256)[0]
            voz = fr[fr > fr.max() * 0.1]
            rms_db = 20 * np.log10(np.sqrt(np.mean(voz ** 2)) + 1e-9)
            x = x * 10 ** (np.clip(a.nivelar - rms_db, -9, 9) / 20)
            # arranque fuerte: si los primeros 120 ms superan el promedio, se suavizan
            n0 = int(0.12 * SR); pico = np.abs(x[:n0]).max() if len(x) > n0 else 0
            ref = np.sqrt(np.mean(x ** 2)) * 4
            if pico > ref: x[:n0] *= np.linspace(ref / pico, 1, n0)
        fi = int(g.get("fi", 0.012) * SR); fi = min(fi, len(x) // 3)
        if "fin" in g:  # final de frase difuminado: sólo sobre la cola natural de la voz
            fo = min(int(min(FADE_OUT, g["fin"] / tempo + 0.015) * SR), len(x) // 4)
            x[-fo:] *= np.cos(np.linspace(0, np.pi / 2, fo)) ** 1.5
        plosiva = re.match(r"[¡¿\"']*(t|p|k|c[aou]|qu|b|d|g[aou])", g["txt"].lower())
        if k and g.get("gap", "w") == "w" and "pausa" not in g and plosiva:  # microsilencio: conserva la explosión de la consonante
            x[:int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))
            m = int(0.012 * SR); out[-m:] *= np.linspace(1, 0, m)
            out = np.concatenate([out, np.zeros(int(0.03 * SR), np.float32), x])
        elif k == 0 or g.get("gap", "w") != "w" or "pausa" in g:
            x[:fi] *= np.linspace(0, 1, fi) ** 2
            pausa = g.get("pausa", GAPS[g.get("gap", "w")])
            out = np.concatenate([out, np.zeros(int(pausa * SR), np.float32), x])
        else:  # fundido cruzado de igual potencia
            n = min(X, len(x) // 3, len(out) // 3); t = np.linspace(0, np.pi / 2, n)
            out[-n:] = out[-n:] * np.cos(t) + x[:n] * np.sin(t)
            out = np.concatenate([out, x[n:]])
    sf.write(a.out, out, SR, subtype="PCM_24")
    acel = [s for s in stats if s[2] > 1.0]
    print(f"{len(E)} fragmentos -> {len(G)} empalmes; {len(acel)} acelerados; duración {len(out)/SR:.1f}s")
    for t, s, tp in acel: print(f"   x{tp:.2f}  {t[:50]}")

if __name__ == "__main__": main()
