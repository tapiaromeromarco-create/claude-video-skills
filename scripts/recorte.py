#!/usr/bin/env python3
"""Recortes estilo collage: quita el fondo (BiRefNet lite, MIT) y agrega borde blanco "a tijera".

Uso:
  recorte.py entrada.jpg salida.png [--borde 18] [--semitono] [--sin-ia]
  --sin-ia   no quita fondo: recorta el rectángulo de la foto con borde irregular (para fotos completas)
  --semitono convierte la figura a semitono (puntos) en tinta, estilo impreso
Salida: PNG con transparencia, listo para el video."""
import argparse, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

MODEL = os.path.join(os.path.dirname(__file__), "..", ".models", "birefnet_lite.onnx")

def mascara_ia(img):
    import onnxruntime as ort
    s = ort.InferenceSession(MODEL, providers=["CPUExecutionProvider"])
    x = np.asarray(img.convert("RGB").resize((1024, 1024), Image.BICUBIC), dtype=np.float32) / 255.0
    x = (x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
    x = x.transpose(2, 0, 1)[None].astype(np.float32)
    y = s.run(None, {"input_image": x})[0][0, 0]
    y = 1 / (1 + np.exp(-y)) if y.min() < 0 or y.max() > 1 else y
    m = Image.fromarray((np.clip(y, 0, 1) * 255).astype(np.uint8)).resize(img.size, Image.BICUBIC)
    return m

def mascara_rect(img, seed=3):
    """Rectángulo con bordes cortados a mano (polígono irregular)."""
    w, h = img.size; rng = np.random.default_rng(seed); j = max(4, int(min(w, h) * 0.012)); n = 14
    pts = []
    for i in range(n): pts.append((w * i / n, rng.uniform(0, j)))
    for i in range(n): pts.append((w - rng.uniform(0, j), h * i / n))
    for i in range(n): pts.append((w - w * i / n, h - rng.uniform(0, j)))
    for i in range(n): pts.append((rng.uniform(0, j), h - h * i / n))
    m = Image.new("L", (w, h), 0); ImageDraw.Draw(m).polygon(pts, fill=255)
    return m

def semitono(img, mask, celda=7, tinta=(23, 20, 18), papel=(239, 230, 210)):
    g = ImageOps.grayscale(img); w, h = g.size
    out = Image.new("RGB", (w, h), papel); d = ImageDraw.Draw(out)
    a = np.asarray(g, dtype=np.float32) / 255
    for yy in range(0, h, celda):
        for xx in range(0, w, celda):
            v = 1 - a[yy:yy + celda, xx:xx + celda].mean()
            r = celda * 0.72 * np.sqrt(v)
            if r > 0.4: d.ellipse([xx + celda / 2 - r, yy + celda / 2 - r, xx + celda / 2 + r, yy + celda / 2 + r], fill=tinta)
    return out

def borde_tijera(mask, ancho, seed=7):
    """Dilata la máscara y la vuelve poligonal/irregular, como cortada con tijeras."""
    big = mask.filter(ImageFilter.MaxFilter(ancho * 2 + 1)).point(lambda v: 255 if v > 90 else 0)
    # simplificar el contorno a segmentos rectos (corte de tijera) con pequeñas variaciones
    small = big.resize((max(8, big.width // 6), max(8, big.height // 6)), Image.NEAREST)
    small = small.filter(ImageFilter.MaxFilter(3))
    rough = small.resize(big.size, Image.BILINEAR).filter(ImageFilter.GaussianBlur(2)).point(lambda v: 255 if v > 128 else 0)
    return Image.fromarray(np.maximum(np.asarray(rough), np.asarray(big)))

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("entrada"); ap.add_argument("salida")
    ap.add_argument("--borde", type=int, default=18); ap.add_argument("--semitono", action="store_true")
    ap.add_argument("--sin-ia", action="store_true"); ap.add_argument("--max", type=int, default=1600)
    a = ap.parse_args()
    img = Image.open(a.entrada).convert("RGB"); img.thumbnail((a.max, a.max))
    if a.sin_ia:
        pad = a.borde; base = Image.new("RGB", (img.width + 2 * pad, img.height + 2 * pad), (251, 248, 241))
        base.paste(img, (pad, pad)); img = base
        alpha = mascara_rect(img); fig = img
    else:
        pad = a.borde * 2 + 10
        img = ImageOps.expand(img, pad, fill=(255, 255, 255))
        m = mascara_ia(img).point(lambda v: 255 if v > 110 else 0)
        fig = semitono(img, m) if a.semitono else img
        alpha_b = borde_tijera(m, a.borde)
        blanco = Image.new("RGB", img.size, (251, 248, 241))
        fig = Image.composite(fig, blanco, m.filter(ImageFilter.GaussianBlur(0.8)))
        alpha = alpha_b
    out = fig.convert("RGBA"); out.putalpha(alpha)
    bb = alpha.getbbox(); out = out.crop(bb) if bb else out
    out.save(a.salida, optimize=True)
    print(f"{a.salida} {out.size}")

if __name__ == "__main__":
    main()
