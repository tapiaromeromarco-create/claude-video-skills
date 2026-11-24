#!/usr/bin/env python3
"""Sintetiza una biblioteca de efectos de sonido para el collage (sin muestras externas).
Uso: sfx_synth.py carpeta_salida   -> genera varias variaciones de cada efecto (WAV estéreo 48 kHz)."""
import os, sys
import numpy as np, soundfile as sf
from scipy import signal

SR = 48000
rng = np.random.default_rng(11)

def env(n, a, d, curve=3.0):
    t = np.linspace(0, 1, n); A = int(n * a)
    e = np.ones(n); e[:A] = np.linspace(0, 1, A) ** 2 if A else 1
    e[A:] = (1 - np.linspace(0, 1, n - A)) ** curve
    return e

def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), hi / (SR / 2)], "band"); return signal.lfilter(b, a, x)

def lp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2)); return signal.lfilter(b, a, x)

def hp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), "high"); return signal.lfilter(b, a, x)

def sweep_filter(x, f0, f1):
    """Filtro pasa-banda que barre de f0 a f1 (por bloques)."""
    out = np.zeros_like(x); B = 512
    for i in range(0, len(x), B):
        f = f0 + (f1 - f0) * (i / len(x)); seg = x[max(0, i - 2048):i + B]
        y = bp(seg, max(60, f * 0.6), min(SR / 2 - 100, f * 1.6)); out[i:i + B] = y[-len(x[i:i + B]):]
    return out

def stereo(x, pan0=0.0, pan1=0.0):
    p = np.linspace(pan0, pan1, len(x)); l = x * np.cos((p + 1) * np.pi / 4); r = x * np.sin((p + 1) * np.pi / 4)
    return np.stack([l, r], 1)

def norm(x, peak=0.8):
    m = np.abs(x).max(); return x / m * peak if m > 0 else x

def whoosh(dur=0.8):
    n = int(dur * SR); x = rng.standard_normal(n)
    up = rng.random() < 0.5
    y = sweep_filter(x, 300 if up else 2500, 2500 if up else 300)
    y = y * env(n, 0.55, 0.45, 2.0); p = rng.uniform(-0.6, 0.6)
    return norm(stereo(y, p, -p), 0.7)

def swipe():
    return whoosh(0.35)

def papel():
    n = int(rng.uniform(0.22, 0.35) * SR); x = rng.standard_normal(n)
    g = (rng.random(n) < 0.02) * rng.uniform(0.5, 1.5, n)  # granos de roce
    y = bp(x, 900, 6500) * 0.5 + bp(lp(g, 3000), 600, 5000) * 3
    return norm(stereo(y * env(n, 0.25, 0.75, 2.5), rng.uniform(-0.4, 0.4)), 0.6)

def golpe():
    n = int(0.35 * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (95 - 40 * t) * t) * np.exp(-t * 18)
    click = bp(rng.standard_normal(n), 1500, 6000) * np.exp(-t * 120) * 0.4
    return norm(stereo(body + click, rng.uniform(-0.2, 0.2)), 0.75)

def cinta():
    n = int(rng.uniform(0.3, 0.45) * SR); t = np.arange(n) / SR
    crack = (rng.random(n) < np.linspace(0.02, 0.15, n)).astype(float) * rng.standard_normal(n)
    y = hp(crack, 1800) + bp(rng.standard_normal(n), 2500, 9000) * 0.15
    return norm(stereo(y * env(n, 0.1, 0.9, 1.2), rng.uniform(-0.3, 0.3)), 0.55)

def rotulador(dur=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    mod = 0.6 + 0.4 * np.abs(np.sin(2 * np.pi * rng.uniform(5, 9) * t))  # trazos
    y = bp(rng.standard_normal(n), 2200, 6000) * mod
    y += 0.25 * np.sin(2 * np.pi * rng.uniform(1800, 2600) * t) * mod * 0.3  # chirrido leve
    return norm(stereo(y * env(n, 0.08, 0.3, 1.0), rng.uniform(-0.3, 0.3)), 0.45)

def tecla():
    n = int(0.05 * SR); t = np.arange(n) / SR
    y = bp(rng.standard_normal(n), 1800, 4500) * np.exp(-t * 160) + 0.5 * np.sin(2 * np.pi * 180 * t) * np.exp(-t * 90)
    return y

def maquina(k=None):
    k = k or rng.integers(6, 11); out = np.zeros(int(1.2 * SR))
    pos = 0
    for _ in range(k):
        c = tecla() * rng.uniform(0.6, 1.0); out[pos:pos + len(c)] += c; pos += int(rng.uniform(0.07, 0.12) * SR)
        if pos + 3000 > len(out): break
    out = out[:pos + 3000]
    return norm(stereo(out, rng.uniform(-0.3, 0.3)), 0.55)

def sello():
    n = int(0.5 * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (70 - 25 * t) * t) * np.exp(-t * 11)
    slap = lp(rng.standard_normal(n), 2500) * np.exp(-t * 40) * 0.6
    return norm(stereo(body + slap), 0.85)

if __name__ == "__main__":
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    gens = {"whoosh": whoosh, "swipe": swipe, "papel": papel, "golpe": golpe, "cinta": cinta, "rotulador": rotulador, "maquina": maquina, "sello": sello}
    for name, g in gens.items():
        for i in range(4):
            sf.write(os.path.join(out, f"{name}_{i}.wav"), g().astype(np.float32), SR)
    print("listo:", len(gens) * 4, "efectos en", out)
