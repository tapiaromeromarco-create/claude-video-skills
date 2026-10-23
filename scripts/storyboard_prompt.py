#!/usr/bin/env python3
"""Genera un prompt de storyboard a partir de una idea breve."""

import sys
from textwrap import dedent


def build_storyboard(topic: str) -> str:
    return dedent(f"""
    Título: {topic}

    Storyboard:
    1. Intro (0-5s)
       - Plano general con texto breve y una imagen impactante
       - Estilo: cinematográfico, limpio, elegante

    2. Desarrollo (5-15s)
       - Mostrar acción principal con movimiento suave
       - Iluminación dramática, fondo de alta calidad
       - Enfoque en detalle visual y ritmo de edición

    3. Cierre (15-20s)
       - Resumen visual con frase final fuerte
       - Slow motion o flash de detalle
       - Fondo minimalista con marca de agua sutil

    Prompt de video:
    "{topic}", cinematographic, ultra-detailed, smooth camera motion, dramatic lighting, high contrast, 16:9, 4k, realistic textures, elegant composition, short-form commercial aesthetic
    """).strip()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3 scripts/storyboard_prompt.py \"idea del video\"")
        sys.exit(1)

    topic = " ".join(sys.argv[1:])
    print(build_storyboard(topic))
