# Edición de voz — Marco (bloques 3, 5 y cierre)

- **Original:** `WhatsApp Audio 2026-11-22 at 10.20.03 PM` · 8 min 32 s
- **Editado:** `audio/marco/marco_fluido.(wav|mp3)` · 1 min 23 s · −16 LUFS
- **Lista de cortes:** `ediciones/edl_marco.json` (79 fragmentos; se rearma con `scripts/assemble_edl.py`)

## Fluidez (versión 2)
- 79 fragmentos → 55 empalmes: las frases dichas de corrido se dejaron enteras.
- Entre palabras, fundido cruzado sin silencio; microsilencio de 30 ms solo antes de t/p/k/b/d/g para no perder la consonante.
- Finales de frase difuminados sobre la cola natural de la voz.
- 27 tramos dichos muy lento acelerados (máx. ×1.25, sin cambiar el tono). "Lance Wyman" sin acelerar.

## Versión pareja (v3) — `audio/marco/marco_smooth.(wav|mp3)` · 1 min 19 s
- Pausas mínimas: coma 0.07 s, oración 0.14 s, párrafo 0.22 s (la más larga: ~0.3 s).
- Cada fragmento igualado al mismo volumen antes de unir; arranques fuertes suavizados.
- Nivelación agresiva (`scripts/voice_smooth_parejo.sh`): variación de volumen 11.8 → 7.2 dB (p5–p95).
- Comando: `assemble_edl.py marco_original.wav edl_marco.json salida.wav --islas islands.json --pausas "c=0.07,s=0.14,p=0.22" --nivelar -20`

## Qué se quitó
- Muletillas: todos los "pues" (~25), "eh", "este", "así que", "tú solo", el "y" al inicio de oraciones.
- Tomas falladas y repeticiones: 6 intentos de "Pero la verdadera profesionalización",
  "Lance William", "y las institu…", "entendieron" ×3, "que ya no gastaban", "personalidad" (1ª), "de, de, de entre… y mil, y mil novecientos", "insta-", "no solo resolvió" (repetido).
- Texto que no está en el guion: "se" en "se llegó", "sino que", "muy linda y", "Cierre del video" (dicho en voz alta).
- Silencios largos: de 8.5 min a 1.5 min.

## Tomas usadas (por oración del guion)
| Oración | Tomas (s del original) |
|---|---|
| Pero la verdadera profesionalización… visual. | 34.5 + 59.6 + 63.8–75.5 |
| En 1968, México fue sede… Iberoamericana. | 79.0–142.4 (sin muletillas) |
| Con todo este aprendizaje… Joan Costa. | 194.4–210.9 + 235.0–242.6 + 251.9–259.8 |
| En conclusión… del país. | 293.6 + 302.4–315.5 (1ª toma) + 460.7–468.9 (2ª toma, "visuales; construyó…") |
| La próxima vez… diseño mexicano. | 470.5–486.2 + 498.5–508.2 |
| ¡Muchas gracias por acompañarnos! | 508.8–510.7 |

## Revisar al escuchar
- **Beatrice Trueblood:** en la grabación se oye "Beatriz … Blood"; el "True" casi no se escucha. Si molesta, regrabar solo "Beatrice Trueblood".
- **Joan Costa:** a veces se entiende "Joana Costa". Es la única toma.
- **"visuales"** viene de la segunda toma (min 7:40) y el resto de esa oración de la primera; revisar que el tono empate.
- **"pases enfrente a"** (guion: "pases frente a"). Es como se dijo; no hay toma sin "en".
